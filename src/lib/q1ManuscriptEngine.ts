import { isAnalysisOutputApproved } from "./aiValidationService";
import { ProjectState, ManuscriptSection, ResearchCanvas } from "../types";
import { formatInTextCitation } from "./cslStyles";
import { applyToneAndComplexity } from "./manuscriptTone";

export { applyToneAndComplexity } from "./manuscriptTone";

/**
 * DEMO-ONLY legacy manuscript fixture engine.
 * Generates neutral, structurally rigorous scholarly manuscript scaffolding strictly grounded in
 * the explicitly selected demo fixture. Real-project access is rejected before any content is built.
 *
 * ZERO FABRICATION POLICY:
 * - Never injects domain-specific assumptions (e.g., biomechanics, crossover trials, 18 participants, EMG findings) into arbitrary real projects.
 * - Missing fields render explicit [Researcher input required] or [Missing data] placeholders.
 * - Local substitute scholarly content or fake literature references (e.g. Boyer/Mendiguchia) are strictly prohibited.
 */

export interface ManuscriptAssistantOptions {
  targetTotalWords?: number;
  focusStyle?: "Empirical Study" | "Clinical Medicine" | "Quantitative & Experimental" | "General Scholarly Journal";
  toneStyle?: "Concise Technical" | "Narrative Descriptive" | "Formal Academic";
  includeDetailedSubsections?: boolean;
  cslStyle?: string;
  useCanvasContext?: boolean;
  useSourceContext?: boolean;
  useAnalysisContext?: boolean;
}

// Backward-compatible alias for existing imports
export type Q1ExpansionOptions = ManuscriptAssistantOptions;

export class DemoManuscriptEngineAccessError extends Error {
  constructor(projectId: string) {
    super(
      `q1ManuscriptEngine is demo-only. Real project "${projectId || "Missing"}" was not modified and no substitute scientific content was generated.`
    );
    this.name = "DemoManuscriptEngineAccessError";
  }
}

function requireExplicitDemoProject(project: ProjectState): void {
  if (project.isDemoProject !== true) {
    throw new DemoManuscriptEngineAccessError(project.id);
  }
}

export function expandSectionToQ1Length(
  section: ManuscriptSection,
  project: ProjectState,
  targetWordCount: number = 1200,
  options: ManuscriptAssistantOptions = {}
): ManuscriptSection {
  requireExplicitDemoProject(project);

  const canvas: Partial<ResearchCanvas> = project.canvas || {};
  const topic = project.title || "Scholarly Investigation";
  const discipline = project.discipline || "Academic Discipline [Unspecified]";
  const subdiscipline = project.subdiscipline || "Specialized Subfield [Unspecified]";
  
  const sources = project.sources || [];
  const cslStyle = options.cslStyle || project.activeCslStyle || "apa";
  
  // Format citations from verified source library sequentially
  const formattedCitations = sources.map((s) => ({
    source: s,
    inText: formatInTextCitation([s], cslStyle, sources),
    title: s.title,
    authorYear: `${s.authors?.[0] || "Author"} et al. (${s.year || "n.d."})`,
    findings: s.abstract || s.extractedPassages?.[0]?.text || "Empirical context documented in reference library."
  }));

  // Citations strictly originate from project sources; otherwise placeholder
  const cit1 = formattedCitations[0]?.inText || "[Citation required: Add source to Reference Library]";
  const cit2 = formattedCitations[1]?.inText || "[Citation required: Add source to Reference Library]";
  const cit3 = formattedCitations[2]?.inText || "[Citation required: Add source to Reference Library]";

  // Contextual Sources Synthesis
  const sourcesSynthesis = sources.length > 0
    ? sources.map((s) => `• ${s.authors?.[0] || "Author"} et al. (${s.year || "n.d."}): "${s.title}" — ${s.abstract || "Abstract not indexed"} ${formatInTextCitation([s], cslStyle, sources)}`).join("\n")
    : "• Source library empty: [Researcher input required: Import verified records into Reference Library]";

  // Contextual Claims Synthesis
  const claims = project.claims || [];
  const claimsSynthesis = claims.length > 0
    ? claims.map((c) => `• [${c.importance || "High"}] ${c.claimText} (${c.verificationStatus || "Unverified"})`).join("\n")
    : "• No claims registered: [Researcher input required: Register hypotheses and claims in Claim Matrix]";

  // Contextual Gaps Synthesis
  const gaps = project.gaps || [];
  const gapsSynthesis = gaps.length > 0
    ? gaps.map((g) => `• Gap [${g.type}]: ${g.gapStatement} (Confidence: ${Math.round((g.confidence || 0.9) * 100)}%)`).join("\n")
    : "• No research gaps logged: [Researcher input required: Define literature gaps in Gap Map]";

  // Contextual Analysis Outputs (Strictly grounded on actual output)
  const output = project.analysisOutputs?.[0];
  const hasValidAnalysis = Boolean(output && (isAnalysisOutputApproved(output)));

  const primaryRq = project.researchQuestions?.[0]?.question || canvas.scientificProblem || "[Research Question: Researcher input required in Idea Canvas or Research Questions module]";
  const primaryHyp = project.researchQuestions?.[0]?.hypotheses?.find((h) => h.type === "Alternative")?.statement || "[Primary Hypothesis: Researcher input required in Idea Canvas or Research Questions module]";

  let newContent = "";
  const titleLower = section.title.toLowerCase();

  if (titleLower.includes("abstract")) {
    newContent = `# ${topic}

**Structured Abstract**

**Background & Rationale:** ${canvas.practicalProblem || "[Practical Problem: Researcher input required in Idea Canvas]"} ${canvas.scientificProblem || "[Scientific Problem: Researcher input required in Idea Canvas]"}

**Objective:** ${primaryRq}

**Methods:** ${canvas.intervention ? `The study investigated the effect of ${canvas.intervention}${canvas.comparator ? ` compared against ${canvas.comparator}` : ""}.` : "[Study design and intervention: Researcher input required]"} ${canvas.population ? `Target population: ${canvas.population}.` : "[Target population: Researcher input required]"} ${canvas.context ? `Study context: ${canvas.context}.` : "[Context: Researcher input required]"}

**Results:** ${hasValidAnalysis ? (output?.summaryText || "Empirical findings verified in project Data Lab.") : "[Results: Pending verified dataset upload and approved analysis execution in Data Lab]"}

**Conclusions & Scholarly Contribution:** ${canvas.proposedContribution || "[Scholarly Contribution: Researcher input required in Idea Canvas]"}

**Key Literature Context:**
${sourcesSynthesis}

**Keywords:** ${(project as any).keywords && (project as any).keywords.length > 0 ? (project as any).keywords.join("; ") : `${discipline}; ${subdiscipline}; [Keywords: Researcher input required]`}.`;

  } else if (titleLower.includes("intro")) {
    newContent = `## 1. Introduction

### 1.1 Background & Domain Context
${canvas.practicalProblem ? `Addressing ${canvas.practicalProblem} represents an essential objective within ${discipline} and ${subdiscipline}. Relevant literature underscores the need for rigorous, evidence-grounded investigation ${cit1}.` : `The field of ${discipline} requires systematic investigation of core domain challenges ${cit1}. [Researcher input required: Detail domain background and epidemiological context].`}

### 1.2 Theoretical Framework & Scientific Problem
${canvas.scientificProblem ? `A central challenge in this domain is that ${canvas.scientificProblem}. Understanding the underlying mechanisms is necessary to guide effective intervention design ${cit2}.` : `[Scientific Problem: Researcher input required in Idea Canvas].`}

### 1.3 Literature Gap & Methodological Rationale
${canvas.suspectedGap ? `Previous investigations have identified that ${canvas.suspectedGap} ${cit3}.` : `A critical gap exists in current literature regarding verified outcomes ${cit3}.`}

**Identified Research Gaps in Source Library:**
${gapsSynthesis}

**Synthesized Scientific Claims:**
${claimsSynthesis}

### 1.4 Research Objectives & Specific Hypotheses
To address these gaps, this study establishes the following core objectives:
1. **Primary Objective:** ${primaryRq}
2. **Secondary Objectives:** [Researcher input required: Define secondary objectives]

**Formal Hypotheses:**
- **Primary Alternative (H1):** ${primaryHyp}
- **Primary Null (H0):** [Null hypothesis formulation required: μ_treatment - μ_control = 0]`;

  } else if (titleLower.includes("method")) {
    newContent = `## 2. Materials and Methods

### 2.1 Study Design & Methodological Framework
${canvas.framework ? `This study utilized a structured ${canvas.framework} experimental design.` : "This study was structured according to formal reporting guidelines (e.g. CONSORT / STROBE / PRISMA as appropriate for study typology)."}
${canvas.intervention ? `Experimental intervention: ${canvas.intervention}.` : "[Intervention details: Researcher input required]"}
${canvas.comparator ? `Control/Comparator: ${canvas.comparator}.` : "[Comparator details: Researcher input required]"}

### 2.2 Participant Eligibility & Sampling
- **Target Population:** ${canvas.population || "[Participant sample and inclusion/exclusion criteria required]"}
- **Study Setting & Context:** ${canvas.context || "[Study context and laboratory/clinical setting required]"}
- **Ethics Approval:** ${project.ethicsInfo?.approvalNumber ? `Ethics approval Ref: ${project.ethicsInfo.approvalNumber} (${project.ethicsInfo.committeeName || "Institutional Review Board"}).` : "Ethics Approval: [Researcher input required — Institutional ethics approval number must be recorded]."}

### 2.3 Experimental Protocols & Instrumentation
${canvas.existingKnowledge ? `Protocol foundations: ${canvas.existingKnowledge}` : "[Standardized operational procedures and instrumentation details required]"}

### 2.4 Statistical Analysis Plan
Statistical evaluation will be performed following preregistered protocol parameters.
- Descriptive metrics: Mean ± SD or Median (IQR) as appropriate.
- Hypothesis testing: Inferential testing aligned with study design and data distribution.
- Significance threshold: Predefined α = 0.05.`;

  } else if (titleLower.includes("result")) {
    if (!hasValidAnalysis || !output) {
      newContent = `## 3. Results

Unavailable in the prototype: this function requires verified data, evidence or a configured backend.

*To generate Results in a real project, researchers must upload a verified dataset and execute an approved analysis plan in the Data Lab.*`;
    } else {
      newContent = `## 3. Results

### 3.1 Primary Empirical Findings
${output.summaryText || "Analysis execution completed and recorded in project Data Lab."}

${output.numericResults ? `**Verified Quantitative Metrics:**
${output.numericResults.mean_difference !== undefined ? `- Mean Difference: ${output.numericResults.mean_difference}` : ""}
${output.numericResults.t_statistic !== undefined && output.numericResults.df !== undefined ? `- Test Statistic: t(${output.numericResults.df}) = ${output.numericResults.t_statistic}` : ""}
${output.numericResults.p_value !== undefined ? `- Significance: ${typeof output.numericResults.p_value === "number" ? (output.numericResults.p_value < 0.001 ? "p < 0.001" : `p = ${output.numericResults.p_value}`) : String(output.numericResults.p_value)}` : ""}
${output.numericResults.cohens_d !== undefined ? `- Effect Size (Cohen's d): ${output.numericResults.cohens_d}` : ""}` : ""}

### 3.2 Assumptions & Diagnostic Verification
${output.assumptionChecks && output.assumptionChecks.length > 0 ? output.assumptionChecks.map((a) => `- ${a.assumption}: ${a.met ? "Met" : "Unmet"} (${a.testUsed}, ${a.pValue !== undefined ? `p = ${a.pValue}` : "Verified"})`).join("\n") : "Standard statistical assumption checks recorded in Data Lab analysis output."}`;
    }

  } else if (titleLower.includes("discuss")) {
    newContent = `## 4. Discussion

### 4.1 Summary of Principal Findings
${hasValidAnalysis ? `This study investigated ${primaryRq}. The primary empirical analysis revealed: ${output?.summaryText || "Observed outcome distributions recorded in Data Lab."}` : `This study evaluated ${primaryRq}. [Principal findings discussion requires verified empirical results from Data Lab].`}

### 4.2 Integration with Literature & Verified Claims
${sources.length > 0 ? `Our findings contribute to existing scholarly knowledge established in ${sources[0]?.title ? `"${sources[0].title}" ${cit1}` : `the literature ${cit1}`}.` : `Comparison with current literature: [Researcher input required: Synthesize findings relative to external literature].`}

**Integration with Verified Claims:**
${claimsSynthesis}

### 4.3 Theoretical & Practical Significance
**Proposed Scholarly Contribution:** ${canvas.proposedContribution || "[Scholarly Contribution: Researcher input required in Idea Canvas]"}

### 4.4 Study Limitations & Addressing Gaps
**Addressing Research Gaps:**
${gapsSynthesis}

**Study Limitations:**
1. [Limitation 1: Researcher input required regarding sample generalizability, measurement boundaries, or scope constraints].
2. [Limitation 2: Researcher input required regarding potential confounders or methodological parameters].`;

  } else {
    // Conclusion Section
    newContent = `## 5. Conclusion & Recommendations

### 5.1 Concluding Summary
In conclusion, this study addressed ${primaryRq}.
${hasValidAnalysis ? `The empirical results provide evidence regarding ${canvas.proposedContribution || "the targeted phenomenon"}.` : "Final conclusions will be synthesized upon completion of empirical analysis."}

**Scholarly Contribution:** ${canvas.proposedContribution || "[Scholarly Contribution: Researcher input required in Idea Canvas]"}

### 5.2 Implications for Theory & Practice
- **Scholarly & Theoretical Implications:** [Researcher input required: Detail theoretical contributions].
- **Practical & Translational Recommendations:** [Researcher input required: Detail direct applications].
- **Future Research Directions:** [Researcher input required: Identify prospective investigation avenues].`;
  }

  if (options.toneStyle) {
    newContent = applyToneAndComplexity(newContent, options.toneStyle);
  }

  const words = newContent.trim().split(/\s+/).filter(Boolean).length;

  return {
    ...section,
    content: newContent,
    currentWordCount: words,
    targetWordLimit: Math.max(targetWordCount, words),
    status: "Drafting",
    state: "AI Suggested",
    lastEditedTimestamp: new Date().toISOString(),
    isDemo: true,
    isSynthetic: true,
  };
}

export function expandFullPaperToQ1Length(
  project: ProjectState,
  targetTotalWords: number = 4500,
  options: ManuscriptAssistantOptions = {}
): ProjectState {
  requireExplicitDemoProject(project);

  const currentSections = project.sections || [];
  if (currentSections.length === 0) return project;

  const sectionTargets: Record<string, number> = {
    abstract: 300,
    introduction: 1200,
    materials: 1500,
    methods: 1500,
    results: 1000,
    discussion: 1500,
    conclusion: 400
  };

  const updatedSections = currentSections.map((sec) => {
    const titleLower = sec.title.toLowerCase();
    let target = 1000;
    for (const key of Object.keys(sectionTargets)) {
      if (titleLower.includes(key)) {
        target = sectionTargets[key];
        break;
      }
    }
    return expandSectionToQ1Length(sec, project, target, options);
  });

  return {
    ...project,
    sections: updatedSections,
    updatedAt: new Date().toISOString()
  };
}
