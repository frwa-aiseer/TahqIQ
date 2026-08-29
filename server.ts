import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { lookupDoiMetadata } from "./src/lib/metadataProviders";
import { executePairedCrossoverAnalysis, generateAnalysisFiguresAndTables } from "./src/lib/statsEngine";
import { hasAttributableManuscriptApproval } from "./src/lib/analysisLifecycle";
import { applicationDefault, getApps as getAdminApps, initializeApp as initializeAdminApp } from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import { createTrustedAuditEvent, validateTrustedAuditRequest } from "./src/server/trustedAudit";
import type { ProjectRole, TrustedAuditEntityType } from "./src/types";
import type { ProjectState } from "./src/types";
import { applyTrustedTransition, validateTrustedTransitionRequest } from "./src/server/trustedTransitions";
import {
  ALL_PROJECT_ROLES,
  AuthenticatedProjectRequest,
  createAuthenticatedProjectMiddleware,
  createInMemoryRateLimitHook,
  PROJECT_WRITER_ROLES,
  safeApiErrorHandler,
} from "./src/server/authMiddleware";
import {
  METHODOLOGY_KEYS,
  parseAndValidateModelJson,
  validateAgentModelOutput,
  validateAgentRequest,
  validateAnalysisRequest,
  validateDraftSectionModelOutput,
  validateDraftSectionRequest,
  validateDoiRequest,
  validateExternalAnalysisResponse,
  validateMethodologyModelOutput,
  validateMethodologyRequest,
  validatePeerReviewModelOutput,
  validatePeerReviewRequest,
} from "./src/server/apiSchemas";

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

  const apiRateLimit = createInMemoryRateLimitHook(60, 60_000);
  const protectedProjectRoute = (
    allowedRoles: readonly ProjectRole[],
    maxBodyBytes: number,
    requireEmail = false
  ) => createAuthenticatedProjectMiddleware({
    getAdminServices: getTrustedFirebaseAdmin,
    allowedRoles,
    maxBodyBytes,
    requireEmail,
    rateLimitHook: apiRateLimit,
    auditHook: (record) => console.info("[TehqIQ API Audit]", JSON.stringify(record)),
  });

  function rejectInvalidRequest(res: express.Response, errors: string[]) {
    return res.status(400).json({ status: "failed", error: "Request validation failed.", errors });
  }

  function rejectInvalidModelOutput(res: express.Response, errors: string[]) {
    return res.status(502).json({ status: "failed", error: "AI response validation failed.", errors });
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
  app.post("/api/projects/:projectId/audit-events", protectedProjectRoute(PROJECT_WRITER_ROLES, 64 * 1024, true), async (request, res) => {
    const req = request as AuthenticatedProjectRequest;
    try {
      const auth = req.projectAuth!;
      const projectId = auth.projectId;
      const projectRef = auth.projectRef as any;
      const project = auth.project as Record<string, any>;

      const validation = validateTrustedAuditRequest(req.body, auth.role);
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
        { uid: auth.actor.uid, email: auth.actor.email! },
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

  // Privileged project state is changed only inside this Admin SDK transaction.
  app.post("/api/projects/:projectId/transitions", protectedProjectRoute(PROJECT_WRITER_ROLES, 64 * 1024, true), async (request, res) => {
    const req = request as AuthenticatedProjectRequest;
    try {
      const auth = req.projectAuth!;
      const validation = validateTrustedTransitionRequest(req.body, auth.role);
      if (!validation.valid || !validation.request) return res.status(400).json({ status: "failed", errors: validation.errors });
      const projectRef = auth.projectRef as any;
      const transitionRef = projectRef.collection("stateTransitions").doc();
      const { adminDb } = getTrustedFirebaseAdmin();
      const result = await adminDb.runTransaction(async (transaction: any) => {
        const snapshot = await transaction.get(projectRef);
        if (!snapshot.exists) throw new Error("Project not found.");
        const applied = applyTrustedTransition(
          snapshot.data() as ProjectState,
          validation.request!,
          { uid: auth.actor.uid, email: auth.actor.email!, role: auth.role },
          new Date().toISOString(),
          transitionRef.id
        );
        transaction.update(projectRef, {
          sources: applied.project.sources,
          claims: applied.project.claims,
          datasets: applied.project.datasets,
          analysisOutputs: applied.project.analysisOutputs,
          figures: applied.project.figures,
          tables: applied.project.tables,
          sections: applied.project.sections,
          ethicsInfo: applied.project.ethicsInfo,
          authors: applied.project.authors,
          submissionState: applied.project.submissionState || "Draft",
          trustedTransitionIntegrity: applied.project.trustedTransitionIntegrity,
          updatedAt: applied.project.updatedAt,
        });
        transaction.create(transitionRef, applied.record);
        return applied;
      });
      return res.status(201).json({ status: "transitioned", project: result.project, transition: result.record });
    } catch (error: any) {
      console.error("Trusted transition error:", error);
      const message = String(error?.message || "");
      const conflict = /revision conflict|digest mismatch|already locked/i.test(message);
      const unavailable = message.includes("Not Configured");
      return res.status(unavailable ? 503 : conflict ? 409 : 400).json({ status: "failed", error: unavailable ? message : message || "Trusted transition failed." });
    }
  });

  // 1. AI Agent Orchestrator Endpoint
  app.post("/api/gemini/agent", protectedProjectRoute(PROJECT_WRITER_ROLES, 1024 * 1024), async (req, res) => {
    try {
      const requestValidation = validateAgentRequest(req.body);
      if (!requestValidation.valid) return rejectInvalidRequest(res, requestValidation.errors);
      const { agentType, prompt, context } = requestValidation.value;
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
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              proposals: { type: Type.ARRAY, items: { type: Type.STRING } },
              missingInformationFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
              evidenceIds: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["summary", "proposals", "missingInformationFlags", "evidenceIds"],
          },
        },
      });

      const modelValidation = parseAndValidateModelJson(response.text, validateAgentModelOutput);
      if (!modelValidation.valid) return rejectInvalidModelOutput(res, modelValidation.errors);

      res.json({
        status: "completed",
        result: modelValidation.value,
        agentType,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Gemini Agent Error:", error);
      res.status(500).json({ status: "failed", error: "AI agent request failed safely." });
    }
  });

  // 2. Structured Section Drafting Endpoint (Phase 6 Evidence-First Section Generation)
  app.post("/api/gemini/draft-section", protectedProjectRoute(PROJECT_WRITER_ROLES, 5 * 1024 * 1024), async (req, res) => {
    try {
      const requestValidation = validateDraftSectionRequest(req.body);
      if (!requestValidation.valid) return rejectInvalidRequest(res, requestValidation.errors);
      const { sectionTitle, canvas, sources, claims, analysisOutputs, targetWordCount, focusStyle } = requestValidation.value;
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
            required: ["title", "content", "citationsUsed", "evidenceUsed", "numbersUsed", "missingInformationFlags"],
          },
        },
      });

      const modelValidation = parseAndValidateModelJson(response.text, validateDraftSectionModelOutput);
      if (!modelValidation.valid) return rejectInvalidModelOutput(res, modelValidation.errors);

      res.json({
        status: "completed",
        draft: modelValidation.value,
        promptVersion: "v2.4-phase6",
        model: "gemini-3.6-flash",
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Gemini Section Drafting Error:", error);
      res.status(500).json({ status: "failed", error: "AI section drafting failed safely." });
    }
  });

  // 3. Structured Multi-Agent Peer Review Endpoint
  app.post("/api/gemini/peer-review", protectedProjectRoute([...PROJECT_WRITER_ROLES, "Reviewer"], 5 * 1024 * 1024), async (req, res) => {
    try {
      const requestValidation = validatePeerReviewRequest(req.body);
      if (!requestValidation.valid) return rejectInvalidRequest(res, requestValidation.errors);
      const { sections, sources, analysisOutputs, reviewerRole } = requestValidation.value;

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

      const modelValidation = parseAndValidateModelJson(response.text, validatePeerReviewModelOutput);
      if (!modelValidation.valid) return rejectInvalidModelOutput(res, modelValidation.errors);
      res.json({
        status: "completed",
        reviewerRole,
        comments: modelValidation.value.comments,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Gemini Peer Review Error:", error);
      res.status(500).json({
        status: "failed",
        reviewerRole: req.body?.reviewerRole,
        unavailable: true,
        reason: "Reviewer agent call failed safely.",
        error: "Reviewer agent call failed safely.",
      });
    }
  });

  // Domain-neutral methodology proposal. Output remains AI Suggested until a researcher approves it.
  app.post("/api/gemini/methodology-proposal", protectedProjectRoute(PROJECT_WRITER_ROLES, 512 * 1024), async (request, res) => {
    const req = request as AuthenticatedProjectRequest;
    try {
      const requestValidation = validateMethodologyRequest(req.body, req.projectAuth!.projectId);
      if (!requestValidation.valid) return rejectInvalidRequest(res, requestValidation.errors);
      const { projectId, projectContext } = requestValidation.value;

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
            required: [...METHODOLOGY_KEYS],
          },
        },
      });

      const modelValidation = parseAndValidateModelJson(response.text, validateMethodologyModelOutput);
      if (!modelValidation.valid) return rejectInvalidModelOutput(res, modelValidation.errors);

      res.json({
        status: "completed",
        projectId,
        reviewState: "AI Suggested",
        proposal: modelValidation.value,
        model: "gemini-3.6-flash",
        promptVersion: "tq-vsc-003-v1",
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Gemini Methodology Proposal Error:", error);
      res.status(500).json({
        status: "failed",
        error: "AI methodology proposal failed safely. No fallback content was generated.",
      });
    }
  });

  // 4. DOI Lookup Proxy Endpoint (Authoritative Registries)
  app.post("/api/sources/doi", protectedProjectRoute(ALL_PROJECT_ROLES, 16 * 1024), async (req, res) => {
    try {
      const requestValidation = validateDoiRequest(req.body);
      if (!requestValidation.valid) return rejectInvalidRequest(res, requestValidation.errors);
      const { doi } = requestValidation.value;

      const lookup = await lookupDoiMetadata(doi, {
        pubMed: {
          apiKey: process.env.NCBI_API_KEY,
          email: process.env.NCBI_EMAIL,
          tool: "tehqiq",
        },
      });
      if (!lookup.success) {
        return res.status(404).json({
          error: lookup.error || "DOI not found in authoritative registries.",
          resolved: false,
        });
      }

      res.json({
        doi: lookup.doi,
        pmid: lookup.pmid,
        pmcid: lookup.pmcid,
        title: lookup.title,
        authors: lookup.authors,
        year: lookup.year,
        journalOrVenue: lookup.journalOrVenue,
        volume: lookup.volume,
        issue: lookup.issue,
        pages: lookup.pages,
        publisher: lookup.publisher,
        verificationState: "Verified",
        metadataProvider: lookup.providerName,
        metadataProviderId: lookup.providerId,
        providerRecordId: lookup.providerRecordId,
        identifiers: lookup.identifiers,
        verificationDate: lookup.retrievedAt,
        disclaimer: lookup.disclaimer,
        fieldProvenance: lookup.fieldProvenance,
        provenance: {
          providerId: lookup.providerId,
          provider: lookup.providerName,
          retrievedAt: lookup.retrievedAt,
          fieldProvenance: lookup.fieldProvenance,
          disclaimer: lookup.disclaimer,
        },
      });
    } catch (error: any) {
      console.error("DOI Lookup Error:", error);
      res.status(500).json({ error: "Failed to resolve DOI metadata." });
    }
  });

  // 5. Statistical Analysis Execution Endpoint (Phase 5 Secure Server Execution)
  app.post("/api/analysis/execute", protectedProjectRoute(PROJECT_WRITER_ROLES, 25 * 1024 * 1024), async (req, res) => {
    try {
      const requestValidation = validateAnalysisRequest(req.body);
      if (!requestValidation.valid) return rejectInvalidRequest(res, requestValidation.errors);
      const { dataset, plan, options } = requestValidation.value;

      // Check external Python Cloud Run Service Interface
      if (process.env.ANALYSIS_SERVICE_URL) {
        try {
          const serviceResponse = await fetch(process.env.ANALYSIS_SERVICE_URL + "/execute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dataset, plan, options }),
          });
          const result = await serviceResponse.json();
          const responseValidation = validateExternalAnalysisResponse(result);
          if (!responseValidation.valid) {
            console.error("External analysis response validation failed:", responseValidation.errors);
          } else {
            return res.json(responseValidation.value);
          }
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
        error: "Statistical analysis execution failed safely.",
      });
    }
  });

  app.use("/api", safeApiErrorHandler);

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
