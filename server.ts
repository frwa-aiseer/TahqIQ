import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { lookupDoiMetadata, CrossrefDisclaimer } from "./src/lib/metadataProviders";
import { executePairedCrossoverAnalysis, generateAnalysisFiguresAndTables } from "./src/lib/statsEngine";
import { hasAttributableManuscriptApproval } from "./src/lib/analysisLifecycle";
import { applicationDefault, getApps as getAdminApps, initializeApp as initializeAdminApp } from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import { createTrustedAuditEvent, validateTrustedAuditRequest } from "./src/server/trustedAudit";
import type { ProjectRole, TrustedAuditEntityType } from "./src/types";

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "25mb" }));

  // Shared Gemini client initialization helper
  function getGeminiClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }

  function getTrustedFirebaseAdmin() {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.GCLOUD_PROJECT;
    if (!projectId) throw new Error("Trusted Firebase service Not Configured: FIREBASE_ADMIN_PROJECT_ID is missing.");
    const adminApp = getAdminApps()[0] || initializeAdminApp({ credential: applicationDefault(), projectId });
    return { adminAuth: getAdminAuth(adminApp), adminDb: getAdminFirestore(adminApp) };
  }

  function getAuditedEntity(project: Record<string, any>, entityType: TrustedAuditEntityType, entityId: string): Record<string, any> | null {
    const collectionByType: Partial<Record<TrustedAuditEntityType, string>> = {
      ManuscriptSection: "sections", Dataset: "datasets", AnalysisOutput: "analysisOutputs", AiArtifact: "aiLedger",
      Source: "sources", Claim: "claims", Author: "authors", ExportJob: "exportHistory",
    };
    if (entityType === "ProjectMember") return project.members?.[entityId] ? { uid: entityId, role: project.members[entityId] } : null;
    if (entityType === "Ethics") return entityId === "ethics" || entityId === project.id ? project.ethicsInfo || {} : null;
    const collectionName = collectionByType[entityType];
    return collectionName && Array.isArray(project[collectionName])
      ? project[collectionName].find((item: any) => item?.id === entityId) || null
      : null;
  }

  function actionMatchesEntity(action: string, entity: Record<string, any>): boolean {
    if (action === "ARTIFACT_APPROVED") return entity.state === "Approved" || entity.state === "Locked";
    if (action === "DATASET_APPROVED") return entity.state === "Approved for Analysis" || entity.state === "Locked";
    if (action === "ANALYSIS_APPROVED") return entity.state === "Approved for Manuscript" || entity.state === "Locked";
    if (action === "AI_ARTIFACT_DISPOSITIONED") return ["Accepted", "Modified", "Rejected"].includes(entity.researcherDecision);
    if (action === "AUTHOR_SIGNED_OFF") return entity.finalApproval === true;
    return true;
  }

  function priorStateSnapshot(entity: Record<string, any>): Record<string, unknown> | null {
    const history = Array.isArray(entity.stateHistory) ? entity.stateHistory : [];
    const last = history[history.length - 1];
    return last && typeof last.fromState === "string" ? { state: last.fromState, transitionId: last.id || null } : null;
  }

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", app: "TehqIQ", version: "2.4.0" });
  });

  // Trusted, append-only privileged audit path. Actor and timestamp are never accepted from the client.
  app.post("/api/projects/:projectId/audit-events", async (req, res) => {
    try {
      const authorization = req.header("authorization") || "";
      if (!authorization.startsWith("Bearer ")) return res.status(401).json({ status: "failed", error: "Firebase ID token required." });
      const { adminAuth, adminDb } = getTrustedFirebaseAdmin();
      const decoded = await adminAuth.verifyIdToken(authorization.slice(7));
      if (!decoded.uid || typeof decoded.email !== "string" || !decoded.email.trim()) {
        return res.status(403).json({ status: "failed", error: "An authenticated actor with an email claim is required." });
      }

      const projectId = req.params.projectId;
      const projectRef = adminDb.collection("projects").doc(projectId);
      const projectSnapshot = await projectRef.get();
      if (!projectSnapshot.exists) return res.status(404).json({ status: "failed", error: "Project not found." });
      const project = { id: projectSnapshot.id, ...projectSnapshot.data() } as Record<string, any>;
      const role = (project.ownerUid === decoded.uid ? "Owner" : project.members?.[decoded.uid]) as ProjectRole | undefined;
      if (!role) return res.status(403).json({ status: "failed", error: "Project membership required." });

      const validation = validateTrustedAuditRequest(req.body, role);
      if (!validation.valid || !validation.request) return res.status(400).json({ status: "failed", errors: validation.errors });
      const auditedEntity = getAuditedEntity(project, validation.request.entityType, validation.request.entityId);
      if (!auditedEntity) {
        return res.status(400).json({ status: "failed", error: "Audited entity does not exist in the project." });
      }
      if (!actionMatchesEntity(validation.request.action, auditedEntity)) {
        return res.status(409).json({ status: "failed", error: "Current entity state does not support the requested audit action." });
      }
      if (JSON.stringify(auditedEntity).length > 50_000) return res.status(413).json({ status: "failed", error: "Audited entity snapshot exceeds the size limit." });

      const eventRef = projectRef.collection("auditEvents").doc();
      const event = createTrustedAuditEvent(
        projectId,
        { uid: decoded.uid, email: decoded.email },
        validation.request,
        priorStateSnapshot(auditedEntity),
        auditedEntity,
        new Date().toISOString(),
        eventRef.id
      );
      await eventRef.create(event);
      return res.status(201).json({ status: "recorded", event });
    } catch (error: any) {
      console.error("Trusted audit append error:", error);
      const unavailable = String(error?.message || "").includes("Not Configured");
      return res.status(unavailable ? 503 : 500).json({ status: "failed", error: unavailable ? error.message : "Trusted audit append failed." });
    }
  });

  // 1. AI Agent Orchestrator Endpoint
  app.post("/api/gemini/agent", async (req, res) => {
    try {
      const { agentType, prompt, context } = req.body;
      const ai = getGeminiClient();

      const systemInstruction = `You are TehqIQ's specialized research agent (${agentType || "Research Orchestrator"}).
Your primary directives:
1. Maintain strict scientific integrity and evidence traceability.
2. NEVER invent citations, DOIs, sample numbers, or statistical p-values.
3. Provide scholarly, rigorous, precise analysis appropriate for doctoral-level publication.
4. Output structured JSON matching the TehqIQ schema.

Notice: TehqIQ assists researchers but does not replace subject expertise, ethical approval, statistical review, scholarly judgment or author responsibility.`;

      const userMessage = `Context: ${JSON.stringify(context || {})}\n\nTask Instructions:\n${prompt}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: userMessage,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      });

      res.json({
        status: "completed",
        text: response.text,
        agentType,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Gemini Agent Error:", error);
      res.status(500).json({ status: "failed", error: error.message || "Failed to execute AI agent request." });
    }
  });

  // 2. Structured Section Drafting Endpoint (Phase 6 Evidence-First Section Generation)
  app.post("/api/gemini/draft-section", async (req, res) => {
    try {
      const { sectionTitle, canvas, sources, claims, analysisOutputs, targetWordCount, focusStyle } = req.body;
      const titleLower = (sectionTitle || "").toLowerCase();

      // Rule 9: Results section blocked without approved analysis outputs
      if (titleLower.includes("result")) {
        const hasApprovedAnalysis =
          analysisOutputs &&
          analysisOutputs.length > 0 &&
          analysisOutputs.some((out: any) => hasAttributableManuscriptApproval(out));

        if (!hasApprovedAnalysis) {
          return res.status(400).json({
            status: "failed",
            executionStatus: "Failed",
            error: "Drafting Results section blocked: No approved analysis outputs exist in project. Upload dataset and execute an approved analysis plan first.",
          });
        }
      }

      const ai = getGeminiClient();
      const systemInstruction = `You are an expert scholarly manuscript assistant for TehqIQ.
STRICT EVIDENCE RULES:
1. ONLY use approved project facts, provided sources, and verified analysis outputs.
2. NEVER invent citations, DOIs, author surnames, sample sizes, or p-values.
3. Any missing information MUST become a visible placeholder (e.g., [MISSING SOURCE: ...], [DATA REQUIRED: ...]).
4. Return valid JSON adhering strictly to the responseSchema.`;

      const promptText = `Draft section "${sectionTitle}" (Target words: ${targetWordCount || 1200}, Focus: ${focusStyle || "General Scholarly Investigation"}).
Canvas Context: ${JSON.stringify(canvas || {})}
Available Verified Sources: ${JSON.stringify(sources || [])}
Verified Claims: ${JSON.stringify(claims || [])}
Approved Analysis Outputs: ${JSON.stringify((analysisOutputs || []).filter((out: any) => hasAttributableManuscriptApproval(out)))}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: promptText,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              content: { type: Type.STRING },
              citationsUsed: { type: Type.ARRAY, items: { type: Type.STRING } },
              evidenceUsed: { type: Type.ARRAY, items: { type: Type.STRING } },
              numbersUsed: { type: Type.ARRAY, items: { type: Type.NUMBER } },
              missingInformationFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["title", "content"],
          },
        },
      });

      let jsonRes = { title: sectionTitle, content: "" };
      try {
        jsonRes = JSON.parse(response.text || "{}");
      } catch (err) {
        return res.status(500).json({ status: "failed", error: "Failed to parse structured JSON response from Gemini model." });
      }

      res.json({
        status: "completed",
        draft: jsonRes,
        promptVersion: "v2.4-phase6",
        model: "gemini-3.6-flash",
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Gemini Section Drafting Error:", error);
      res.status(500).json({ status: "failed", error: error.message || "Failed to draft section via Gemini." });
    }
  });

  // 3. Structured Multi-Agent Peer Review Endpoint
  app.post("/api/gemini/peer-review", async (req, res) => {
    try {
      const { sections, sources, analysisOutputs, reviewerRole } = req.body;

      if (!reviewerRole) {
        return res.status(400).json({ status: "failed", error: "reviewerRole parameter is required." });
      }

      const ai = getGeminiClient();
      const systemInstruction = `You are a peer reviewer specialized as: ${reviewerRole}.
Provide 1 to 2 schema-validated, critical, constructive reviewer comments on the manuscript text and empirical data.
Strict rules: Output structured JSON matching the responseSchema. Never make generic compliment comments.`;

      const promptText = `Manuscript Sections: ${JSON.stringify(sections || [])}\nSources: ${JSON.stringify(sources || [])}\nAnalysis: ${JSON.stringify(analysisOutputs || [])}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: promptText,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              comments: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    agentRole: { type: Type.STRING },
                    severity: { type: Type.STRING },
                    manuscriptSection: { type: Type.STRING },
                    commentText: { type: Type.STRING },
                    suggestedAction: { type: Type.STRING },
                  },
                  required: ["agentRole", "severity", "manuscriptSection", "commentText", "suggestedAction"],
                },
              },
            },
            required: ["comments"],
          },
        },
      });

      let parsed = JSON.parse(response.text || '{"comments":[]}');
      res.json({
        status: "completed",
        reviewerRole,
        comments: parsed.comments || [],
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Gemini Peer Review Error:", error);
      res.status(500).json({
        status: "failed",
        reviewerRole: req.body?.reviewerRole,
        unavailable: true,
        reason: error.message || "Reviewer agent call failed.",
        error: error.message,
      });
    }
  });

  // Domain-neutral methodology proposal. Output remains AI Suggested until a researcher approves it.
  app.post("/api/gemini/methodology-proposal", async (req, res) => {
    try {
      const { projectId, projectContext } = req.body || {};
      if (!projectId || !projectContext || typeof projectContext !== "object") {
        return res.status(400).json({
          status: "failed",
          error: "projectId and projectContext are required for a methodology proposal.",
        });
      }

      const ai = getGeminiClient();
      const methodologyProperties = {
        design: { type: Type.STRING },
        populationOrDataSource: { type: Type.STRING },
        sampling: { type: Type.STRING },
        eligibility: { type: Type.STRING },
        interventionExposureComparator: { type: Type.STRING },
        variablesOrOutcomes: { type: Type.STRING },
        instruments: { type: Type.STRING },
        dataCollection: { type: Type.STRING },
        analysisPlan: { type: Type.STRING },
        ethics: { type: Type.STRING },
        limitations: { type: Type.STRING },
      };
      const methodologyKeys = Object.keys(methodologyProperties);

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: `Create a domain-neutral methodology proposal using only this researcher-provided project context:\n${JSON.stringify(projectContext)}`,
        config: {
          systemInstruction: `You are a methodology proposal assistant. Return a reviewable proposal, never an approved protocol.
Use only facts explicitly present in the supplied project context.
Do not invent participants, sample sizes, power assumptions, instruments, timings, ethics approvals, statistical values, interventions, exposures, comparators, or data sources.
For every unsupported field, return exactly "Researcher input required".
Intervention, exposure, and comparator are optional and must remain "Researcher input required" when not supplied.`,
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: methodologyProperties,
            required: methodologyKeys,
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      const proposal = Object.fromEntries(
        methodologyKeys.map((key) => [
          key,
          typeof parsed[key] === "string" && parsed[key].trim()
            ? parsed[key].trim()
            : "Researcher input required",
        ])
      );

      res.json({
        status: "completed",
        projectId,
        reviewState: "AI Suggested",
        proposal,
        model: "gemini-3.6-flash",
        promptVersion: "tq-vsc-003-v1",
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Gemini Methodology Proposal Error:", error);
      res.status(500).json({
        status: "failed",
        error: error.message || "AI methodology proposal failed. No fallback content was generated.",
      });
    }
  });

  // 4. DOI Lookup Proxy Endpoint (Authoritative Registries)
  app.post("/api/sources/doi", async (req, res) => {
    try {
      const { doi } = req.body;
      if (!doi) {
        return res.status(400).json({ error: "DOI parameter is required." });
      }

      const lookup = await lookupDoiMetadata(doi);
      if (!lookup.success) {
        return res.status(404).json({
          error: lookup.error || "DOI not found in authoritative registries.",
          resolved: false,
        });
      }

      res.json({
        doi: lookup.doi,
        title: lookup.title,
        authors: lookup.authors,
        year: lookup.year,
        journalOrVenue: lookup.journalOrVenue,
        volume: lookup.volume || "",
        issue: lookup.issue || "",
        pages: lookup.pages || "",
        publisher: lookup.publisher || "",
        verificationState: "Verified",
        metadataProvider: lookup.providerName,
        verificationDate: new Date().toISOString(),
        disclaimer: lookup.disclaimer || CrossrefDisclaimer.MESSAGE,
        fieldProvenance: lookup.fieldProvenance,
        provenance: {
          provider: lookup.providerName,
          retrievedAt: new Date().toISOString(),
          fieldProvenance: lookup.fieldProvenance,
          disclaimer: lookup.disclaimer || CrossrefDisclaimer.MESSAGE,
        },
      });
    } catch (error: any) {
      console.error("DOI Lookup Error:", error);
      res.status(500).json({ error: "Failed to resolve DOI metadata." });
    }
  });

  // 5. Statistical Analysis Execution Endpoint (Phase 5 Secure Server Execution)
  app.post("/api/analysis/execute", async (req, res) => {
    try {
      const { dataset, plan, options } = req.body;

      if (!dataset || !plan) {
        return res.status(400).json({
          status: "failed",
          executionStatus: "Failed",
          error: "Execution blocked: Both dataset and analysis plan parameters are required.",
        });
      }

      // Check external Python Cloud Run Service Interface
      if (process.env.ANALYSIS_SERVICE_URL) {
        try {
          const serviceResponse = await fetch(process.env.ANALYSIS_SERVICE_URL + "/execute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dataset, plan, options }),
          });
          const result = await serviceResponse.json();
          return res.json(result);
        } catch (serviceErr: any) {
          console.error("Cloud Run Analysis Service Error:", serviceErr);
          // Fall through to native statistical engine execution
        }
      }

      // Execute real statistical analysis from raw dataset records
      const output = executePairedCrossoverAnalysis({
        dataset,
        plan,
        outcomeVariable: options?.outcomeVariable || plan.outcomeVariable,
        conditionVariable: options?.conditionVariable || (plan.predictorVariables && plan.predictorVariables[0]),
        participantIdVariable: options?.participantIdVariable || "id",
        periodVariable: options?.periodVariable,
        sequenceVariable: options?.sequenceVariable,
        alpha: options?.alpha || plan.significanceThreshold || 0.05,
        isResearcherSuppliedLog: options?.isResearcherSuppliedLog || false,
      });

      if (output.executionStatus === "Failed") {
        return res.status(400).json({
          status: "failed",
          executionStatus: "Failed",
          output,
          error: output.summaryText,
        });
      }

      // Generate associated figures and tables using stored analysis output numbers ONLY
      const { figures, tables } = generateAnalysisFiguresAndTables(output, dataset, plan);

      res.json({
        status: "completed",
        executionStatus: "Completed",
        output,
        figures,
        tables,
        datasetHash: output.datasetHash,
        planId: output.planId,
        reproducibilityHash: output.reproducibilityHash,
      });
    } catch (error: any) {
      console.error("Analysis Execution Error:", error);
      res.status(500).json({
        status: "failed",
        executionStatus: "Failed",
        error: error.message || "Statistical analysis execution failed.",
      });
    }
  });

  // Serve static or Vite dev middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[TehqIQ Server] Running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
