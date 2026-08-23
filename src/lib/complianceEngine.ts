import { ProjectState, TargetOutlet, CalculatedComplianceRule, GateCheckResult, OutletRequirementField } from "../types";
import { hasAttributableManuscriptApproval } from "./analysisLifecycle";
import { isOutletVerified } from "../data/baselineOutlets";
import { getVerifiedRequirement } from "./outletRequirements";

export function calculateComplianceRules(project: ProjectState, customOutlet?: TargetOutlet): CalculatedComplianceRule[] {
  const outlet = customOutlet || project.selectedTargetOutlet;
  if (!outlet) return [];
  if (!isOutletVerified(outlet)) {
    return [{
      id: "rule-outlet-unverified",
      category: "Ethics & AI",
      requirementName: "Outlet Identity Verification",
      requiredValue: "Verified static identity or live provider record",
      actualValue: outlet.verificationStatus || "Unverified",
      status: "Fail",
      actionRequired: "Verify the outlet through an approved provider or retain it as a user-added Unverified record; its claims cannot drive compliance.",
    }];
  }

  const rules: CalculatedComplianceRule[] = [];
  const sections = project.sections || [];

  // Calculate actual counts
  const totalWordCount = sections.reduce((acc, s) => acc + (s.currentWordCount || 0), 0);
  const abstractSection = sections.find((s) => s.title.toLowerCase().includes("abstract"));
  const abstractWordCount = abstractSection ? abstractSection.currentWordCount || 0 : 0;
  const figureCount = project.figures?.length || 0;
  const tableCount = project.tables?.length || 0;

  // Only a valid, human-confirmed field record may provide outlet-requirement provenance.
  // Outlet identity provenance is deliberately not inherited by individual factual claims.
  const getVerifiedMeta = (field: OutletRequirementField) => {
    const requirement = getVerifiedRequirement(outlet, field);
    return {
      sourceRecordId: requirement?.id,
      officialSourceUrl: requirement?.sourceUrl,
      retrievalDate: requirement?.retrievedAt,
      humanConfirmed: requirement?.humanConfirmed,
    };
  };

  const numericValue = (value: unknown): number | undefined => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
    return undefined;
  };

  // Rule 1: Manuscript Total Word Limit
  const wordMeta = getVerifiedMeta("manuscriptWordLimit");
  const manuscriptWordLimit = numericValue(getVerifiedRequirement(outlet, "manuscriptWordLimit")?.value);
  if (manuscriptWordLimit !== undefined) {
    const isPass = totalWordCount <= manuscriptWordLimit;
    rules.push({
      id: "rule-word-limit",
      category: "Word Count",
      requirementName: "Manuscript Word Limit",
      requiredValue: `Max ${manuscriptWordLimit.toLocaleString()} words`,
      actualValue: `${totalWordCount.toLocaleString()} words`,
      status: isPass ? "Pass" : "Fail",
      actionRequired: isPass ? undefined : `Reduce word count by ${(totalWordCount - manuscriptWordLimit).toLocaleString()} words to comply with ${outlet.title} rules.`,
      ...wordMeta,
    });
  }

  // Rule 2: Abstract Word Limit
  const abstractMeta = getVerifiedMeta("abstractWordLimit");
  const abstractWordLimit = numericValue(getVerifiedRequirement(outlet, "abstractWordLimit")?.value);
  if (abstractWordLimit !== undefined) {
    const isPass = abstractWordCount <= abstractWordLimit;
    rules.push({
      id: "rule-abstract-limit",
      category: "Abstract",
      requirementName: "Abstract Word Limit",
      requiredValue: `Max ${abstractWordLimit} words`,
      actualValue: `${abstractWordCount} words`,
      status: isPass ? "Pass" : "Fail",
      actionRequired: isPass ? undefined : `Trim abstract by ${abstractWordCount - abstractWordLimit} words.`,
      ...abstractMeta,
    });
  }

  // Rule 3: independently sourced figure and table limits
  const countRequirements: Array<["figureLimit" | "tableLimit", string, number]> = [
    ["figureLimit", "Figure Limit", figureCount],
    ["tableLimit", "Table Limit", tableCount],
  ];
  for (const [field, name, count] of countRequirements) {
    const meta = getVerifiedMeta(field);
    const limit = numericValue(getVerifiedRequirement(outlet, field)?.value);
    if (limit === undefined) continue;
    const isPass = count <= limit;
    rules.push({
      id: `rule-${field}`,
      category: "Figures & Tables",
      requirementName: name,
      requiredValue: `Max ${limit} items`,
      actualValue: `${count} items`,
      status: isPass ? "Pass" : "Fail",
      actionRequired: isPass ? undefined : `Reduce or move ${count - limit} item(s) to supplementary materials.`,
      ...meta,
    });
  }

  // Rule 4: Citation Style Alignment
  const metaStyle = getVerifiedMeta("referenceStyle");
  const currentStyle = project.activeCslStyle;
  const referenceRequirement = getVerifiedRequirement(outlet, "referenceStyle");
  const expectedStyle = typeof referenceRequirement?.value === "string" ? referenceRequirement.value : undefined;
  const expectedStyleStr = expectedStyle?.toLowerCase() || "";
  const isStyleMatch =
    (expectedStyleStr.includes("apa") && currentStyle.includes("apa")) ||
    (expectedStyleStr.includes("ieee") && currentStyle.includes("ieee")) ||
    (expectedStyleStr.includes("nature") && currentStyle.includes("nature")) ||
    (expectedStyleStr.includes("vancouver") && currentStyle.includes("vancouver")) ||
    (expectedStyleStr.includes("ama") && currentStyle.includes("ama")) ||
    (expectedStyleStr.includes("acs") && currentStyle.includes("acs")) ||
    (expectedStyleStr.includes("plos") && currentStyle.includes("plos"));

  if (expectedStyle) rules.push({
    id: "rule-citation-style",
    category: "Citation Style",
    requirementName: "Target Citation Format",
    requiredValue: expectedStyle,
    actualValue: currentStyle.toUpperCase(),
    status: isStyleMatch ? "Pass" : "Warning",
    actionRequired: isStyleMatch ? undefined : `Switch project bibliography style to ${expectedStyle} in settings.`,
    ...metaStyle,
  });

  // Rule 5: Ethics & Mandatory Declaration
  const hasEthicsApproval = !project.ethicsInfo?.approvalRequired || Boolean(project.ethicsInfo?.approvalNumber);
  rules.push({
    id: "rule-ethics",
    category: "Ethics & AI",
    requirementName: "Mandatory Ethics Approval & Declaration",
    requiredValue: project.ethicsInfo?.approvalRequired ? "Ethics Protocol ID Required" : "Exempt / Statement Provided",
    actualValue: project.ethicsInfo?.approvalNumber ? `Approved (${project.ethicsInfo.approvalNumber})` : project.ethicsInfo?.approvalRequired ? "Missing Approval ID" : "Exempt",
    status: hasEthicsApproval ? "Pass" : "Fail",
    actionRequired: hasEthicsApproval ? undefined : "Provide valid Institutional Review Board (IRB) / Ethics Committee approval ID.",
  });

  // Rule 6: AI Usage Transparency Policy
  const metaAi = getVerifiedMeta("aiPolicy");
  const aiRequirement = getVerifiedRequirement(outlet, "aiPolicy");
  const hasAiCalls = (project.aiLedger || []).length > 0;
  const ledgerAssessed = Boolean(
    project.aiLedgerIntegrity?.assessedAt?.trim() &&
    project.aiLedgerIntegrity.assessedByUid?.trim() &&
    project.aiLedgerIntegrity.rationale?.trim()
  );
  const ledgerComplete = ledgerAssessed && project.aiLedgerIntegrity?.status === "Complete";
  const noAiUseConfirmed = ledgerAssessed && !hasAiCalls && project.aiLedgerIntegrity?.status === "No AI Use Confirmed";
  const fullText = sections.map((s) => s.content).join("\n").toLowerCase();
  const mentionsAiDisclosure = fullText.includes("artificial intelligence") || fullText.includes("ai assistance") || fullText.includes("gemini") || fullText.includes("generative ai");

  const aiStatus = noAiUseConfirmed || (hasAiCalls && ledgerComplete && mentionsAiDisclosure) ? "Pass" : "Warning";
  rules.push({
    id: "rule-ai-policy",
    category: "Ethics & AI",
    requirementName: "Publisher AI Disclosure Compliance",
    requiredValue: aiRequirement ? String(aiRequirement.value ?? "Not available") : "Outlet AI policy Unverified",
    actualValue: hasAiCalls
      ? (ledgerComplete ? (mentionsAiDisclosure ? "Complete AI ledger and disclosure present" : "AI used without explicit disclosure text") : "AI ledger integrity Unknown/Incomplete")
      : (noAiUseConfirmed ? "No AI use confirmed by attributable assessment" : "Empty ledger; AI-use history Unknown/Incomplete"),
    status: aiStatus,
    actionRequired: aiStatus === "Pass" ? undefined : "Include ICJME AI Assistance Disclosure statement in manuscript Declarations/Methods.",
    ...metaAi,
  });

  // Rule 7: Author Sign-off Confirmation
  const totalAuthors = project.authors?.length || 0;
  const approvedAuthors = (project.authors || []).filter((a) => a.finalApproval).length;
  const allAuthorsApproved = totalAuthors > 0 && approvedAuthors === totalAuthors;

  rules.push({
    id: "rule-author-approval",
    category: "Authorship",
    requirementName: "Final Author Sign-Off (100% Mandatory)",
    requiredValue: `${totalAuthors} / ${totalAuthors} Authors Approved`,
    actualValue: `${approvedAuthors} / ${totalAuthors} Authors Approved`,
    status: allAuthorsApproved ? "Pass" : "Fail",
    actionRequired: allAuthorsApproved ? undefined : `Obtain sign-off approval from ${totalAuthors - approvedAuthors} pending co-author(s).`,
  });

  return rules;
}

export function evaluateExportGateChecks(
  project: ProjectState,
  exportMode: "Submission-Ready" | "Draft Review" = "Submission-Ready"
): GateCheckResult[] {
  const gateChecks: GateCheckResult[] = [];

  // Check 1: Citation Integrity (Unresolved / Unverified / Retracted sources)
  const unverifiedSources = (project.sources || []).filter(
    (s) => s.verificationState === "Unverified" || s.state === "Unresolved" || s.state === "Retracted" || s.retractionWarning
  );
  const unverifiedIds = unverifiedSources.map((s) => s.id);
  const citationPass = unverifiedSources.length === 0;

  gateChecks.push({
    checkId: "gate-citation-integrity",
    category: "Citation Integrity",
    name: "Unresolved / Unverified Source Verification",
    status: citationPass ? "Pass" : "Blocker",
    message: citationPass
      ? `All ${project.sources?.length || 0} sources in library are verified with stable bibliographic metadata.`
      : `Detected ${unverifiedSources.length} unresolved, unverified, or retracted reference(s) in source library.`,
    affectedItemIds: unverifiedIds,
    resolutionPath: "Verify metadata, replace unverified sources, or resolve retraction warnings in Source Library.",
  });

  // Check 2: Unlinked Results & Claims
  const unverifiedClaims = (project.claims || []).filter(
    (c) => c.verificationStatus === "Unverified" || c.state === "Unlinked" || (c.linkedSourceIds || []).length === 0
  );
  const resultsSection = (project.sections || []).find((s) => s.title.toLowerCase().includes("result"));
  const hasApprovedOutputs = (project.analysisOutputs || []).some(hasAttributableManuscriptApproval);
  const resultsUnlinked = Boolean(resultsSection && !hasApprovedOutputs);

  const resultsPass = unverifiedClaims.length === 0 && !resultsUnlinked;
  gateChecks.push({
    checkId: "gate-unlinked-results",
    category: "Unlinked Results",
    name: "Evidence Grounding & Result Verification",
    status: resultsPass ? "Pass" : "Blocker",
    message: resultsPass
      ? "All empirical claims and Results section findings are linked to verified data or literature."
      : resultsUnlinked
      ? "Results section exists but no approved statistical analysis outputs exist in project records."
      : `Detected ${unverifiedClaims.length} unlinked or unverified empirical claim(s) in Claim Matrix.`,
    affectedItemIds: unverifiedClaims.map((c) => c.id),
    resolutionPath: "Link evidence passages or approve statistical analysis outputs in Data Lab / Claim Matrix.",
  });

  // Check 3: Ethics Mandate
  const ethicsRequired = Boolean(project.ethicsInfo?.approvalRequired);
  const missingEthicsNumber = ethicsRequired && !project.ethicsInfo?.approvalNumber;
  const missingConsent = ethicsRequired && !project.ethicsInfo?.consentObtained;
  const ethicsPass = !ethicsRequired || (!missingEthicsNumber && !missingConsent);

  gateChecks.push({
    checkId: "gate-ethics-mandate",
    category: "Ethics Mandate",
    name: "Mandatory Ethics Approval & Participant Consent",
    status: ethicsPass ? "Pass" : "Blocker",
    message: ethicsPass
      ? ethicsRequired
        ? `Ethics protocol approved (${project.ethicsInfo.approvalNumber}) and participant consent confirmed.`
        : "Study designated as exempt / no human participants."
      : missingEthicsNumber
      ? "Ethics approval is required for this study type, but no protocol number was provided."
      : "Informed participant consent has not been confirmed.",
    resolutionPath: "Enter IRB/Ethics Approval Number and confirm participant consent in Ethics Workspace.",
  });

  // Check 4: False AI Disclosure
  const hasAiEvents = (project.aiLedger || []).length > 0;
  const hasAiSections = (project.sections || []).some((s) => s.state === "AI Suggested");
  const fullContent = (project.sections || []).map((s) => s.content).join("\n").toLowerCase();
  const hasDisclosureText =
    fullContent.includes("artificial intelligence") ||
    fullContent.includes("ai assistance") ||
    fullContent.includes("gemini") ||
    fullContent.includes("generative ai");

  const integrityAssessed = Boolean(
    project.aiLedgerIntegrity?.assessedAt?.trim() &&
    project.aiLedgerIntegrity.assessedByUid?.trim() &&
    project.aiLedgerIntegrity.rationale?.trim()
  );
  const completeLedger = integrityAssessed && project.aiLedgerIntegrity?.status === "Complete";
  const confirmedNoUse = integrityAssessed && !hasAiEvents && project.aiLedgerIntegrity?.status === "No AI Use Confirmed" && !hasAiSections;
  const aiPass = confirmedNoUse || (hasAiEvents && completeLedger && hasDisclosureText);

  gateChecks.push({
    checkId: "gate-ai-disclosure",
    category: "AI Disclosure",
    name: "Generative AI Transparency & Ledger Alignment",
    status: aiPass ? "Pass" : "Blocker",
    message: aiPass
      ? hasAiEvents
        ? `Generative AI assistance logged in a researcher-assessed Complete ledger (${project.aiLedger.length} events) with matching disclosure text.`
        : "No AI use confirmed by an attributable researcher ledger-integrity assessment."
      : !hasAiEvents
        ? "AI ledger is empty, but historical AI use is Unknown/Incomplete; emptiness is not proof of no AI use."
        : "AI ledger/disclosure completeness is insufficient for submission.",
    resolutionPath: "Complete an attributable ledger-integrity review and append a truthful AI-use disclosure into Declarations.",
  });

  // Check 5: Author Sign-off Approval
  const totalAuthors = project.authors?.length || 0;
  const approvedAuthors = (project.authors || []).filter((a) => a.finalApproval).length;
  const authorPass = totalAuthors > 0 && approvedAuthors === totalAuthors;

  gateChecks.push({
    checkId: "gate-author-signoff",
    category: "Author Sign-off",
    name: "Complete Co-Author Final Sign-Off (100%)",
    status: authorPass ? "Pass" : "Blocker",
    message: authorPass
      ? `All ${totalAuthors} author(s) have confirmed final manuscript approval.`
      : `Only ${approvedAuthors} of ${totalAuthors} co-author(s) have signed off on final submission.`,
    affectedItemIds: (project.authors || []).filter((a) => !a.finalApproval).map((a) => a.id),
    resolutionPath: "Obtain digital sign-off from all listed co-authors in Project Members & Authors setting.",
  });

  // Check 6: Demo Records / Demonstration Data
  const isDemoProj = Boolean(project.isDemoProject);
  const demoSources = (project.sources || []).filter((s) => s.isDemo || s.isSynthetic);
  const demoDatasets = (project.datasets || []).filter((d) => d.isDemo || d.isSynthetic);
  const demoClaims = (project.claims || []).filter((c) => c.isDemo || c.isSynthetic);
  const hasDemoItems = isDemoProj || demoSources.length > 0 || demoDatasets.length > 0 || demoClaims.length > 0;

  const demoPass = !hasDemoItems;

  gateChecks.push({
    checkId: "gate-demo-content",
    category: "Demo Content",
    name: "Demonstration Data & Synthetic Content Guard",
    status: demoPass ? "Pass" : "Blocker",
    message: demoPass
      ? "Project contains 100% genuine researcher-entered evidence and datasets."
      : isDemoProj
      ? "This is a prototype demo project environment. Real journal exports are blocked."
      : `Export contains ${demoSources.length + demoDatasets.length + demoClaims.length} prototype/synthetic demo record(s).`,
    affectedItemIds: [
      ...(isDemoProj ? ["demo-project"] : []),
      ...demoSources.map((s) => s.id),
      ...demoDatasets.map((d) => d.id),
      ...demoClaims.map((c) => c.id),
    ],
    resolutionPath: "Create a real research project or remove demo records prior to official submission export.",
  });

  return gateChecks;
}
