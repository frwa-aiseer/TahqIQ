import { ProjectState, TargetOutlet, CalculatedComplianceRule, GateCheckResult, VersionedRequirementRecord } from "../types";

export function calculateComplianceRules(project: ProjectState, customOutlet?: TargetOutlet): CalculatedComplianceRule[] {
  const outlet = customOutlet || project.selectedTargetOutlet;
  if (!outlet) return [];

  const rules: CalculatedComplianceRule[] = [];
  const sections = project.sections || [];

  // Calculate actual counts
  const totalWordCount = sections.reduce((acc, s) => acc + (s.currentWordCount || 0), 0);
  const abstractSection = sections.find((s) => s.title.toLowerCase().includes("abstract"));
  const abstractWordCount = abstractSection ? abstractSection.currentWordCount || 0 : 0;
  const totalFiguresAndTables = (project.figures?.length || 0) + (project.tables?.length || 0);

  // Helper to find versioned requirement source for a field
  const getRequirementMeta = (field: string) => {
    const req = (outlet.requirementsList || []).find((r) => r.field === field);
    return {
      sourceRecordId: req?.id,
      officialSourceUrl: req?.officialSourceUrl || outlet.officialUrl,
      retrievalDate: req?.retrievalDate || outlet.lastVerifiedDate,
      humanConfirmed: req?.humanConfirmed ?? true,
    };
  };

  // Rule 1: Manuscript Total Word Limit
  if (outlet.wordLimit) {
    const meta = getRequirementMeta("wordLimit");
    const isPass = totalWordCount <= outlet.wordLimit;
    rules.push({
      id: "rule-word-limit",
      category: "Word Count",
      requirementName: "Manuscript Word Limit",
      requiredValue: `Max ${outlet.wordLimit.toLocaleString()} words`,
      actualValue: `${totalWordCount.toLocaleString()} words`,
      status: isPass ? "Pass" : "Fail",
      actionRequired: isPass ? undefined : `Reduce word count by ${(totalWordCount - outlet.wordLimit).toLocaleString()} words to comply with ${outlet.title} rules.`,
      ...meta,
    });
  }

  // Rule 2: Abstract Word Limit
  if (outlet.abstractWordLimit) {
    const meta = getRequirementMeta("abstractWordLimit");
    const isPass = abstractWordCount <= outlet.abstractWordLimit;
    rules.push({
      id: "rule-abstract-limit",
      category: "Abstract",
      requirementName: "Abstract Word Limit",
      requiredValue: `Max ${outlet.abstractWordLimit} words`,
      actualValue: `${abstractWordCount} words`,
      status: isPass ? "Pass" : "Fail",
      actionRequired: isPass ? undefined : `Trim abstract by ${abstractWordCount - outlet.abstractWordLimit} words.`,
      ...meta,
    });
  }

  // Rule 3: Figure & Table Count Limit
  if (outlet.figureTableLimit !== undefined) {
    const meta = getRequirementMeta("figureTableLimit");
    const isPass = totalFiguresAndTables <= outlet.figureTableLimit;
    rules.push({
      id: "rule-fig-table-limit",
      category: "Figures & Tables",
      requirementName: "Combined Figure & Table Limit",
      requiredValue: `Max ${outlet.figureTableLimit} items`,
      actualValue: `${totalFiguresAndTables} items (${project.figures?.length || 0} figs, ${project.tables?.length || 0} tbls)`,
      status: isPass ? "Pass" : "Fail",
      actionRequired: isPass ? undefined : `Combine or move ${totalFiguresAndTables - outlet.figureTableLimit} items to supplementary materials.`,
      ...meta,
    });
  }

  // Rule 4: Citation Style Alignment
  const metaStyle = getRequirementMeta("citationStyle");
  const currentStyle = project.activeCslStyle;
  const expectedStyleStr = outlet.citationStyle.toLowerCase();
  const isStyleMatch =
    (expectedStyleStr.includes("apa") && currentStyle.includes("apa")) ||
    (expectedStyleStr.includes("ieee") && currentStyle.includes("ieee")) ||
    (expectedStyleStr.includes("nature") && currentStyle.includes("nature")) ||
    (expectedStyleStr.includes("vancouver") && currentStyle.includes("vancouver")) ||
    (expectedStyleStr.includes("ama") && currentStyle.includes("ama")) ||
    (expectedStyleStr.includes("acs") && currentStyle.includes("acs")) ||
    (expectedStyleStr.includes("plos") && currentStyle.includes("plos"));

  rules.push({
    id: "rule-citation-style",
    category: "Citation Style",
    requirementName: "Target Citation Format",
    requiredValue: outlet.citationStyle,
    actualValue: currentStyle.toUpperCase(),
    status: isStyleMatch ? "Pass" : "Warning",
    actionRequired: isStyleMatch ? undefined : `Switch project bibliography style to ${outlet.citationStyle} in settings.`,
    ...metaStyle,
  });

  // Rule 5: Ethics & Mandatory Declaration
  const metaEthics = getRequirementMeta("ethics");
  const hasEthicsApproval = !project.ethicsInfo?.approvalRequired || Boolean(project.ethicsInfo?.approvalNumber);
  rules.push({
    id: "rule-ethics",
    category: "Ethics & AI",
    requirementName: "Mandatory Ethics Approval & Declaration",
    requiredValue: project.ethicsInfo?.approvalRequired ? "Ethics Protocol ID Required" : "Exempt / Statement Provided",
    actualValue: project.ethicsInfo?.approvalNumber ? `Approved (${project.ethicsInfo.approvalNumber})` : project.ethicsInfo?.approvalRequired ? "Missing Approval ID" : "Exempt",
    status: hasEthicsApproval ? "Pass" : "Fail",
    actionRequired: hasEthicsApproval ? undefined : "Provide valid Institutional Review Board (IRB) / Ethics Committee approval ID.",
    ...metaEthics,
  });

  // Rule 6: AI Usage Transparency Policy
  const metaAi = getRequirementMeta("aiPolicySummary");
  const hasAiCalls = (project.aiLedger || []).length > 0;
  const fullText = sections.map((s) => s.content).join("\n").toLowerCase();
  const mentionsAiDisclosure = fullText.includes("artificial intelligence") || fullText.includes("ai assistance") || fullText.includes("gemini") || fullText.includes("generative ai");

  const aiStatus = !hasAiCalls || mentionsAiDisclosure ? "Pass" : "Warning";
  rules.push({
    id: "rule-ai-policy",
    category: "Ethics & AI",
    requirementName: "Publisher AI Disclosure Compliance",
    requiredValue: outlet.aiPolicySummary ? "Disclosure Required" : "Standard Policy",
    actualValue: hasAiCalls ? (mentionsAiDisclosure ? "AI Disclosure Statement Included" : "AI Used without Explicit Disclosure Text") : "No Material AI Calls Registered",
    status: aiStatus,
    actionRequired: aiStatus === "Pass" ? undefined : "Include ICJME AI Assistance Disclosure statement in manuscript Declarations/Methods.",
    ...metaAi,
  });

  // Rule 7: Author Sign-off Confirmation
  const metaAuthors = getRequirementMeta("authors");
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
    ...metaAuthors,
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
  const hasApprovedOutputs = (project.analysisOutputs || []).length > 0;
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

  const aiPass = (!hasAiEvents && !hasAiSections) || hasDisclosureText;

  gateChecks.push({
    checkId: "gate-ai-disclosure",
    category: "AI Disclosure",
    name: "Generative AI Transparency & Ledger Alignment",
    status: aiPass ? "Pass" : "Blocker",
    message: aiPass
      ? hasAiEvents
        ? `Generative AI assistance logged in AI Ledger (${project.aiLedger.length} events) with matching disclosure statement.`
        : "No AI generated material detected."
      : "Material AI assistance recorded in AI Ledger, but manuscript lacks mandatory AI Disclosure statement.",
    resolutionPath: "Generate and append ICJME AI Disclosure statement from AI Assistance Ledger into Declarations.",
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
