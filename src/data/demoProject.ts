import { ProjectState } from "../types";
import { hydrateProjectResearchArtifacts } from "../lib/researchArtifacts";

export function createEmptyPipelineStages() {
  return [
    { id: "stg-1", number: 1, name: "Project Setup", description: "Define discipline, team roles, and project scope", status: "In progress" as const, progressPercent: 10 },
    { id: "stg-2", number: 2, name: "Idea Development", description: "Formulate research canvas and PICO framework", status: "Not started" as const, progressPercent: 0 },
    { id: "stg-3", number: 3, name: "Research Question", description: "Evaluate FINER score and set hypotheses", status: "Not started" as const, progressPercent: 0 },
    { id: "stg-4", number: 4, name: "Preliminary Search", description: "Build boolean query string and test databases", status: "Not started" as const, progressPercent: 0 },
    { id: "stg-5", number: 5, name: "Literature Review", description: "Import DOIs, extract evidence passages", status: "Not started" as const, progressPercent: 0 },
    { id: "stg-6", number: 6, name: "Research-Gap Assessment", description: "Map population, methodological, and theoretical gaps", status: "Not started" as const, progressPercent: 0 },
    { id: "stg-7", number: 7, name: "Methods & Protocol", description: "Specify study design and sample size", status: "Not started" as const, progressPercent: 0 },
    { id: "stg-8", number: 8, name: "Ethics & Registration", description: "Log ethics approval and trial registration", status: "Not started" as const, progressPercent: 0 },
    { id: "stg-9", number: 9, name: "Data Collection", description: "Upload dataset and profile variables", status: "Not started" as const, progressPercent: 0 },
    { id: "stg-10", number: 10, name: "Analysis Plan", description: "Approve statistical test assumptions and thresholds", status: "Not started" as const, progressPercent: 0 },
    { id: "stg-11", number: 11, name: "Analysis Execution", description: "Execute statistical models", status: "Not started" as const, progressPercent: 0 },
    { id: "stg-12", number: 12, name: "Results Verification", description: "Generate publication figures and tables", status: "Not started" as const, progressPercent: 0 },
    { id: "stg-13", number: 13, name: "Manuscript Planning", description: "Set outline and target word limits per section", status: "Not started" as const, progressPercent: 0 },
    { id: "stg-14", number: 14, name: "Section Drafting", description: "Draft Introduction, Methods, Results, Discussion", status: "Not started" as const, progressPercent: 0 },
    { id: "stg-15", number: 15, name: "Citation Verification", description: "Map in-text citations to verified DOIs and CSL style", status: "Not started" as const, progressPercent: 0 },
    { id: "stg-16", number: 16, name: "Internal Peer Review", description: "Run reviewer checks and resolve feedback", status: "Not started" as const, progressPercent: 0 },
    { id: "stg-17", number: 17, name: "Target Outlet Compliance", description: "Evaluate fit score for target journal", status: "Not started" as const, progressPercent: 0 },
    { id: "stg-18", number: 18, name: "Revision Management", description: "Track author responses to reviewer feedback", status: "Not started" as const, progressPercent: 0 },
    { id: "stg-19", number: 19, name: "Final Author Approval", description: "Sign off CRediT roles and corresponding author signoff", status: "Not started" as const, progressPercent: 0 },
    { id: "stg-20", number: 20, name: "Export & Submission", description: "Generate submission package (DOCX, PDF, BibTeX)", status: "Not started" as const, progressPercent: 0 }
  ];
}

export function createEmptyProject(overrides?: Partial<ProjectState>): ProjectState {
  const now = new Date().toISOString();
  return {
    id: `proj-${Date.now()}`,
    isDemoProject: false,
    title: overrides?.title || "My Research Project",
    discipline: overrides?.discipline || "Sports Science & Biomechanics",
    subdiscipline: overrides?.subdiscipline || "",
    projectType: overrides?.projectType || "Randomized controlled trial",
    createdAt: now,
    updatedAt: now,
    userRole: overrides?.userRole || "Project Owner",
    termsAccepted: false,
    authors: [],
    canvas: overrides?.canvas || {
      broadTopic: "",
      practicalProblem: "",
      scientificProblem: "",
      theoreticalProblem: "",
      population: "",
      context: "",
      intervention: "",
      exposure: "",
      comparator: "",
      outcome: "",
      existingKnowledge: "",
      suspectedGap: "",
      proposedContribution: "",
      framework: "PICO",
    },
    researchQuestions: [],
    searchStrategies: [],
    sources: [],
    claims: [],
    gaps: [],
    reportingGuideline: {
      name: "CONSORT",
      version: "2010",
      applicableStudyType: "Randomized Trial",
      checklistItems: [],
    },
    ethicsInfo: {
      approvalRequired: false,
      consentObtained: false,
      committeeName: "",
      approvalNumber: "",
      approvalDate: "",
      notes: "",
    },
    datasets: [],
    analysisPlans: [],
    analysisOutputs: [],
    figures: [],
    tables: [],
    sections: [
      { id: "sec-1", title: "Abstract", order: 1, currentWordCount: 0, content: "", citationIds: [], status: "Not started", version: 1, lastEditedBy: "", lastEditedTimestamp: now },
      { id: "sec-2", title: "Introduction", order: 2, currentWordCount: 0, content: "", citationIds: [], status: "Not started", version: 1, lastEditedBy: "", lastEditedTimestamp: now },
      { id: "sec-3", title: "Methods", order: 3, currentWordCount: 0, content: "", citationIds: [], status: "Not started", version: 1, lastEditedBy: "", lastEditedTimestamp: now },
      { id: "sec-4", title: "Results", order: 4, currentWordCount: 0, content: "", citationIds: [], status: "Not started", version: 1, lastEditedBy: "", lastEditedTimestamp: now },
      { id: "sec-5", title: "Discussion", order: 5, currentWordCount: 0, content: "", citationIds: [], status: "Not started", version: 1, lastEditedBy: "", lastEditedTimestamp: now },
      { id: "sec-6", title: "Conclusion", order: 6, currentWordCount: 0, content: "", citationIds: [], status: "Not started", version: 1, lastEditedBy: "", lastEditedTimestamp: now },
      { id: "sec-7", title: "Declarations & References", order: 7, currentWordCount: 0, content: "", citationIds: [], status: "Not started", version: 1, lastEditedBy: "", lastEditedTimestamp: now },
    ],
    activeCslStyle: "apa",
    selectedTargetOutlet: undefined,
    complianceReport: undefined,
    reviewerComments: [],
    aiLedger: [],
    pipelineStages: createEmptyPipelineStages(),
    readinessScore: {
      overall: 0,
      questionClarity: 0,
      literatureCoverage: 0,
      evidenceVerification: 0,
      methodCompleteness: 0,
      dataQuality: 0,
      reproducibility: 0,
      citationAccuracy: 0,
      compliance: 0,
      integrityReview: 0,
    },
    ...overrides,
  };
}

export function isDemoRecord(record: any): boolean {
  if (!record) return false;
  return Boolean(record.isDemo || record.isSynthetic);
}

export function canAddRecordToProject(param1: any, param2: any): boolean {
  const project = (param1 && typeof param1 === 'object' && 'isDemoProject' in param1) ? param1 : param2;
  const record = (project === param1) ? param2 : param1;

  if (!project || project.isDemoProject === undefined) return true;
  if (!project.isDemoProject && isDemoRecord(record)) {
    return false;
  }
  return true;
}

export function createDemoProject(): ProjectState {
  const demoState = JSON.parse(JSON.stringify(DEMO_PROJECT_STATE)) as ProjectState;
  
  // Tag all demo records
  demoState.authors = demoState.authors.map(a => ({ ...a, isDemo: true, isSynthetic: true }));
  demoState.sources = demoState.sources.map(s => ({ ...s, isDemo: true, isSynthetic: true }));
  demoState.claims = demoState.claims.map(c => ({ ...c, isDemo: true, isSynthetic: true }));
  demoState.datasets = demoState.datasets.map(d => ({ ...d, isDemo: true, isSynthetic: true }));
  demoState.analysisOutputs = demoState.analysisOutputs.map(a => ({ ...a, isDemo: true, isSynthetic: true }));
  demoState.reviewerComments = demoState.reviewerComments.map(r => ({ ...r, isDemo: true, isSynthetic: true }));
  demoState.figures = demoState.figures.map(f => ({ ...f, isDemo: true, isSynthetic: true }));
  demoState.tables = demoState.tables.map(t => ({ ...t, isDemo: true, isSynthetic: true }));
  demoState.sections = demoState.sections.map(s => ({ ...s, isDemo: true, isSynthetic: true }));

  return hydrateProjectResearchArtifacts(demoState);
}

export const DEMO_PROJECT_STATE: ProjectState = {
  id: "demo-tehqiq-project-001",
  isDemoProject: true,
  title: "Effect of a Structured Warm-Up on Semitendinosus Muscle Activation During Treadmill Running: A Synthetic Crossover Demonstration",
  discipline: "Sports Science & Biomechanics",
  subdiscipline: "Electromyography & Neuromuscular Physiology",
  projectType: "Crossover study",
  createdAt: "2026-07-28T09:00:00Z",
  updatedAt: "2026-07-30T12:00:00Z",
  userRole: "Project Owner",
  termsAccepted: true,
  noticeAcceptedDate: "2026-07-28T09:01:00Z",
  authors: [
    {
      id: "auth-1",
      fullName: "Dr. Moneeb Ahmad",
      publicationName: "Ahmad, M.",
      email: "eng.moneeb@jadwaa.com",
      orcid: "0000-0002-1823-9921",
      department: "Department of Biomechanics",
      institution: "National Institute of Sports Sciences",
      city: "Islamabad",
      country: "Pakistan",
      isCorresponding: true,
      order: 1,
      creditRoles: ["Conceptualization", "Methodology", "Formal analysis", "Writing – original draft"],
      conflictDeclaration: "The author declares no financial or personal conflicts of interest.",
      finalApproval: true,
      approvalTimestamp: "2026-07-29T14:00:00Z"
    },
    {
      id: "auth-2",
      fullName: "Prof. Sarah L. Jenkins",
      publicationName: "Jenkins, S.L.",
      email: "s.jenkins@niss-edu.org",
      orcid: "0000-0001-9238-1102",
      department: "Faculty of Applied Physiology",
      institution: "University of Biomechanical Studies",
      city: "London",
      country: "United Kingdom",
      isCorresponding: false,
      order: 2,
      creditRoles: ["Supervision", "Writing – review and editing"],
      conflictDeclaration: "No potential conflict of interest was reported by the author.",
      finalApproval: true,
      approvalTimestamp: "2026-07-29T15:30:00Z"
    }
  ],
  canvas: {
    broadTopic: "Neuromuscular activation during treadmill running post dynamic warm-up",
    practicalProblem: "Hamstring strain injuries are common in runners; improper hamstring muscle recruitment patterns post-warmup may contribute to susceptibility.",
    scientificProblem: "Uncertainty remains regarding whether a targeted multi-modal dynamic warm-up specifically alters semitendinosus peak EMG amplitude compared to a standard static stretch protocol in healthy runners.",
    theoreticalProblem: "Neural drive modulation and post-activation potentiation mechanisms in biarticular hamstring heads during treadmill stance phase.",
    population: "Recreational endurance runners aged 20-35 years (n=18 synthetic participants)",
    context: "Controlled laboratory environment, instrumented treadmill at 12 km/h",
    intervention: "10-minute structured dynamic neuromuscular warm-up (DWU)",
    exposure: "Dynamic lower-limb movement patterns",
    comparator: "10-minute static hamstring stretching protocol (SS)",
    outcome: "Normalized peak electromyographic (EMG) amplitude (% MVIC) of the semitendinosus muscle during stance phase",
    existingKnowledge: "Dynamic warm-ups enhance sprint performance, but fine-grained surface EMG changes in individual hamstring muscle bellies during submaximal running require structured crossover verification.",
    suspectedGap: "Differential activation between semitendinosus and biceps femoris post-dynamic vs static warm-up during treadmill running has not been evaluated in a 2x2 crossover design with period-carryover testing.",
    proposedContribution: "Demonstrate that dynamic warm-up selectively elevates semitendinosus pre-activation and stance peak EMG without carryover artifacts.",
    framework: "PICO",
    aiSuggestions: {
      refinedTopic: "Selective Neuromuscular Activation of Semitendinosus Following Dynamic vs Static Warm-Up: A Randomized Crossover Trial",
      candidateQuestions: [
        "Does a 10-minute dynamic warm-up result in significantly higher peak semitendinosus EMG (% MVIC) during running compared to static stretching?",
        "Are there significant period or carryover effects between testing sessions separated by 48 hours?"
      ],
      objectives: [
        "To quantify stance-phase peak EMG of semitendinosus following DWU versus SS.",
        "To verify crossover statistical validity using period and order interaction models."
      ],
      hypotheses: [
        "H1: Dynamic warm-up increases stance-phase peak semitendinosus EMG (% MVIC) compared to static stretching (p < 0.05)."
      ],
      constructs: ["Surface EMG Amplitude (% MVIC)", "Neuromuscular Pre-activation", "Crossover Period Effect"],
      feasibilityRisks: ["Fatigue induced by 12 km/h run protocols", "Electrode placement repeatability"],
      ethicalRisks: ["Minor muscle soreness following MVIC testing"]
    }
  },
  researchQuestions: [
    {
      id: "rq-1",
      question: "In recreational runners, does a 10-minute dynamic warm-up produce greater peak semitendinosus EMG amplitude (% MVIC) during treadmill running at 12 km/h compared to static stretching in a crossover design?",
      type: "Primary",
      finerScore: {
        feasible: 9,
        interesting: 8,
        novel: 8,
        ethical: 9,
        relevant: 9,
        totalScore: 43
      },
      hypotheses: [
        {
          id: "hyp-0",
          type: "Null",
          statement: "H0: Mean peak semitendinosus EMG (% MVIC) does not differ between dynamic warm-up and static stretch conditions (μ_DWU - μ_SS = 0).",
          status: "Proposed"
        },
        {
          id: "hyp-1",
          type: "Alternative",
          statement: "H1: Mean peak semitendinosus EMG (% MVIC) is higher following dynamic warm-up than static stretch (μ_DWU > μ_SS).",
          status: "Supported",
          testedInAnalysisId: "an-out-1"
        }
      ],
      isApproved: true,
      approvalDate: "2026-07-28T10:00:00Z"
    }
  ],
  searchStrategies: [
    {
      id: "search-1",
      database: "PubMed",
      concepts: ["Semitendinosus", "Dynamic warm-up", "Electromyography", "Treadmill running"],
      booleanQuery: "(\"semitendinosus\"[MeSH Terms] OR \"semitendinosus\") AND (\"warm-up exercise\"[MeSH Terms] OR \"dynamic warm up\") AND (\"electromyography\"[MeSH Terms] OR \"EMG\") AND (\"running\"[MeSH Terms] OR \"treadmill\")",
      filters: {
        dateFrom: "2015-01-01",
        dateTo: "2026-07-01",
        peerReviewedOnly: true,
        languages: ["English"]
      },
      resultCount: 42,
      searchDate: "2026-07-28T11:00:00Z"
    }
  ],
  sources: [
    {
      id: "src-1",
      title: "Effects of dynamic versus static warm-up protocols on muscle activation and lower limb kinematics in recreational runners",
      authors: ["Boyer, K. A.", "Johnson, G. R.", "Smith, P. M."],
      year: 2021,
      journalOrVenue: "Journal of Applied Biomechanics",
      volume: "37",
      issue: "4",
      pages: "312-320",
      doi: "10.1123/jab.2020-0194",
      pmid: "34192671",
      documentType: "Journal Article",
      peerReviewStatus: "Peer-reviewed",
      verificationState: "Verified",
      verificationDate: "2026-07-28T11:15:00Z",
      relevanceScore: 9,
      tags: ["Dynamic Warm-Up", "EMG", "Hamstrings"],
      researcherNotes: "Foundational evidence showing dynamic protocols increase neuromuscular firing rates during early stance phase."
    },
    {
      id: "src-2",
      title: "Electromyographic analysis of hamstring muscle recruitment during treadmill running: A systematic review",
      authors: ["Mendiguchia, J.", "Garrues, M. A.", "Alonso, A."],
      year: 2022,
      journalOrVenue: "Sports Medicine",
      volume: "52",
      issue: "2",
      pages: "145-162",
      doi: "10.1007/s40279-021-01588-w",
      pmid: "34787889",
      documentType: "Systematic Review",
      peerReviewStatus: "Peer-reviewed",
      verificationState: "Verified",
      verificationDate: "2026-07-28T11:20:00Z",
      relevanceScore: 10,
      tags: ["Systematic Review", "Semitendinosus", "Recruitment"],
      researcherNotes: "Demonstrates that semitendinosus undergoes highest eccentric acceleration pre-activation prior to foot strike."
    },
    {
      id: "src-3",
      title: "Statistical considerations for 2x2 crossover designs in sports biomechanics and exercise physiology",
      authors: ["Senn, S.", "Senn, S. J."],
      year: 2018,
      journalOrVenue: "Statistics in Medicine",
      volume: "37",
      issue: "12",
      pages: "1980-1996",
      doi: "10.1002/sim.7612",
      documentType: "Methodology Paper",
      peerReviewStatus: "Peer-reviewed",
      verificationState: "Verified",
      verificationDate: "2026-07-28T11:25:00Z",
      relevanceScore: 8,
      tags: ["Crossover Design", "Carryover Effect", "Statistics"],
      researcherNotes: "Guidelines for testing period effect (P1 vs P2) and sequence interaction before pooling crossover data."
    }
  ],
  claims: [
    {
      id: "clm-1",
      claimText: "Dynamic warm-up protocols significantly enhance post-activation neuromuscular potentiation in lower-limb skeletal muscles compared to passive or static stretching.",
      claimType: "Theoretical claim",
      manuscriptSection: "Introduction",
      importance: "High",
      linkedSourceIds: ["src-1"],
      evidenceRelationship: "Direct support",
      evidencePassage: "Dynamic warm-ups induced a 14.2% increase in motor unit recruitment frequency during initial ground contact.",
      verificationStatus: "Verified",
      isResearcherApproved: true
    },
    {
      id: "clm-2",
      claimText: "The semitendinosus muscle exhibits greater stance-phase activation sensitivity to dynamic warm-up conditioning than the biceps femoris during submaximal treadmill running.",
      claimType: "Associational claim",
      manuscriptSection: "Discussion",
      importance: "High",
      linkedSourceIds: ["src-2"],
      evidenceRelationship: "Direct support",
      evidencePassage: "Semitendinosus peak amplitude increased preferentially relative to biceps femoris long head under dynamic preparation.",
      verificationStatus: "Verified",
      isResearcherApproved: true
    }
  ],
  gaps: [
    {
      id: "gap-1",
      gapStatement: "Prior studies evaluating hamstring warm-up responses lacked rigorous crossover sequence-order testing and carryover verification across distinct testing days.",
      type: "Methodological",
      supportingSourceIds: ["src-1", "src-3"],
      confidence: 0.92,
      isApproved: true
    }
  ],
  reportingGuideline: {
    name: "CONSORT",
    version: "2010 Statement (Crossover Extension)",
    applicableStudyType: "Crossover Randomized Trial",
    checklistItems: [
      {
        id: "chk-1",
        itemNumber: "1a",
        sectionOrTopic: "Title & Abstract",
        description: "Identification as a randomized crossover trial in the title",
        status: "Addressed",
        manuscriptLocation: "Title and Abstract",
        researcherComment: "Explicitly designated as a synthetic crossover demonstration trial."
      },
      {
        id: "chk-2",
        itemNumber: "2a",
        sectionOrTopic: "Introduction",
        description: "Scientific background and explanation of rationale for crossover design",
        status: "Addressed",
        manuscriptLocation: "Introduction paragraph 2",
        researcherComment: "Detailed rationale for paired within-subject crossover controls."
      },
      {
        id: "chk-3",
        itemNumber: "3a",
        sectionOrTopic: "Methods",
        description: "Eligibility criteria for participants and setting",
        status: "Addressed",
        manuscriptLocation: "Methods - Participants"
      },
      {
        id: "chk-4",
        itemNumber: "11a",
        sectionOrTopic: "Methods",
        description: "Blinding and washout period explanation (48 hours)",
        status: "Addressed",
        manuscriptLocation: "Methods - Protocol"
      },
      {
        id: "chk-5",
        itemNumber: "16",
        sectionOrTopic: "Results",
        description: "Period and order carryover effect statistics",
        status: "Addressed",
        manuscriptLocation: "Results - Crossover Analysis"
      }
    ]
  },
  ethicsInfo: {
    approvalRequired: true,
    committeeName: "National Institute of Sports Sciences Ethics Committee (Synthetic Demo Exemption)",
    approvalNumber: "NISS-REC-2026-088-DEMO",
    approvalDate: "2026-07-20",
    consentObtained: true,
    trialRegistrationNumber: "ACTRN12626000101999 (Synthetic)",
    notes: "Demonstration synthetic dataset - Ethics approval reference simulated for methodological instructional purposes."
  },
  datasets: [
    {
      id: "ds-1",
      filename: "synthetic_crossover_semitendinosus_emg.csv",
      fileHash: "sha256-8a9d10e20f44bc11192a019e",
      uploadDate: "2026-07-28T12:00:00Z",
      recordCount: 36, // 18 participants x 2 periods
      variableCount: 8,
      missingnessPercent: 0,
      isAnonymizedConfirmed: true,
      variables: [
        { name: "Participant_ID", type: "ID", missingCount: 0, uniqueValues: 18, role: "ID" },
        { name: "Sequence", type: "Categorical", missingCount: 0, uniqueValues: 2, role: "Sequence" }, // DWU-SS vs SS-DWU
        { name: "Period", type: "Numeric", missingCount: 0, uniqueValues: 2, role: "Period" }, // 1 or 2
        { name: "Warmup_Condition", type: "Categorical", missingCount: 0, uniqueValues: 2, role: "Predictor" }, // DWU vs SS
        { name: "Semitendinosus_Peak_EMG", type: "Numeric", missingCount: 0, uniqueValues: 36, label: "Peak EMG (% MVIC)", unit: "% MVIC", role: "Primary outcome", summaryStats: { mean: 78.4, sd: 8.2, min: 61.2, max: 94.5, median: 78.0, iqr: 11.2 } },
        { name: "BicepsFemoris_Peak_EMG", type: "Numeric", missingCount: 0, uniqueValues: 36, label: "Peak EMG (% MVIC)", unit: "% MVIC", role: "Secondary outcome", summaryStats: { mean: 71.1, sd: 7.6, min: 55.0, max: 86.1 } },
        { name: "Running_Cadence", type: "Numeric", missingCount: 0, uniqueValues: 12, label: "Cadence (steps/min)", unit: "spm", role: "Covariate", summaryStats: { mean: 168.2, sd: 4.1 } },
        { name: "Session_Temperature", type: "Numeric", missingCount: 0, uniqueValues: 6, label: "Lab Temperature (°C)", unit: "°C", summaryStats: { mean: 21.5, sd: 0.8 } }
      ]
    }
  ],
  analysisPlans: [
    {
      id: "ap-1",
      title: "Paired Crossover Analysis of Peak Semitendinosus EMG (% MVIC)",
      researchQuestionId: "rq-1",
      hypothesisId: "hyp-1",
      outcomeVariable: "Semitendinosus_Peak_EMG",
      predictorVariables: ["Warmup_Condition"],
      covariates: ["Period", "Sequence"],
      statisticalMethod: "Paired Student's t-test with Crossover Period/Order Carryover Interaction ANOVA",
      assumptions: [
        "Normality of paired differences (Shapiro-Wilk test)",
        "Absence of sequence-by-period carryover interaction (p > 0.10)",
        "Equal variance across conditions"
      ],
      effectSizeMeasure: "Cohen's d_rm (repeated measures) and Hedges' g",
      significanceThreshold: 0.05,
      missingDataStrategy: "Complete case (0% missing in synthetic sample)",
      status: "Approved",
      isPreregistered: true,
      approvalTimestamp: "2026-07-28T14:00:00Z"
    }
  ],
  analysisOutputs: [
    {
      id: "an-out-1",
      analysisPlanId: "ap-1",
      executionTimestamp: "2026-07-28T14:30:00Z",
      softwareEnvironment: "Python 3.11 / scipy.stats 1.11.2 / statsmodels 0.14.0",
      randomSeed: 42,
      summaryText: "In 18 synthetic participants, dynamic warm-up (DWU) resulted in significantly higher peak semitendinosus EMG amplitude (82.6 ± 6.1 % MVIC) compared to static stretch (74.2 ± 5.8 % MVIC; mean difference = 8.4 % MVIC, 95% CI [5.8, 11.0], t(17) = 6.84, p < 0.0001, Cohen's d = 1.41). Crossover analysis confirmed no significant period effect (p = 0.74) or sequence-by-treatment carryover interaction (p = 0.62).",
      numericResults: {
        mean_DWU: 82.61,
        sd_DWU: 6.12,
        mean_SS: 74.21,
        sd_SS: 5.84,
        mean_diff: 8.40,
        ci_95_lower: 5.81,
        ci_95_upper: 10.99,
        t_statistic: 6.84,
        df: 17,
        p_value: 0.000003,
        cohens_d: 1.41,
        period_effect_p: 0.742,
        carryover_interaction_p: 0.621,
        shapiro_wilk_p: 0.58
      },
      pValues: [
        { test: "Paired t-test (DWU vs SS)", pValue: 0.000003, significant: true, formatted: "p < 0.001" },
        { test: "Period Effect Test (Period 1 vs Period 2)", pValue: 0.742, significant: false, formatted: "p = 0.742" },
        { test: "Sequence Carryover Interaction (DWU-SS vs SS-DWU)", pValue: 0.621, significant: false, formatted: "p = 0.621" },
        { test: "Shapiro-Wilk Normality of Differences", pValue: 0.580, significant: false, formatted: "p = 0.580 (Normal)" }
      ],
      effectSizes: [
        { metric: "Cohen's d (repeated measures)", value: 1.41, ciLower: 0.88, ciUpper: 1.94 },
        { metric: "Hedges' g", value: 1.38, ciLower: 0.85, ciUpper: 1.91 }
      ],
      assumptionChecks: [
        { assumption: "Normality of paired differences", met: true, testUsed: "Shapiro-Wilk", pValue: 0.58, note: "Differences normally distributed" },
        { assumption: "No carryover effect", met: true, testUsed: "Grizzle Crossover ANOVA", pValue: 0.621, note: "No sequence-by-treatment interaction" },
        { assumption: "No period effect", met: true, testUsed: "Period ANOVA", pValue: 0.742, note: "Performance stable across 48h washout" }
      ],
      isReproduced: true,
      reproducibilityHash: "8f71a93b-demo-reproducible-hash"
    }
  ],
  figures: [
    {
      id: "fig-1",
      title: "Figure 1: Comparison of Peak Semitendinosus EMG Amplitude",
      caption: "Figure 1. Stance-phase peak semitendinosus muscle activation (% MVIC) following Dynamic Warm-Up (DWU) versus Static Stretching (SS) in 18 synthetic participants (crossover design). Error bars represent 95% confidence intervals (* p < 0.001). [Demonstration Data — Not Real Research]",
      type: "Bar Chart",
      analysisRunId: "an-out-1",
      dataPoints: [
        { condition: "Static Stretch (SS)", value: 74.21, sd: 5.84, ciLower: 71.3, ciUpper: 77.1 },
        { condition: "Dynamic Warm-Up (DWU)", value: 82.61, sd: 6.12, ciLower: 79.6, ciUpper: 85.6 }
      ],
      xAxisLabel: "Warm-Up Condition",
      yAxisLabel: "Peak EMG Amplitude (% MVIC)",
      isApproved: true
    }
  ],
  tables: [
    {
      id: "tbl-1",
      number: 1,
      title: "Table 1: Participant Baseline Characteristics and Running Kinematics",
      caption: "Table 1. Demographic parameters and baseline physiological characteristics of synthetic crossover participants (n=18). Values reported as Mean ± SD. [Demonstration Data — Not Real Research]",
      headers: ["Parameter", "All Participants (n=18)", "Sequence 1 (DWU → SS, n=9)", "Sequence 2 (SS → DWU, n=9)", "p-value (Group Diff)"],
      rows: [
        ["Age (years)", "26.4 ± 3.2", "26.1 ± 3.1", "26.7 ± 3.4", "0.71"],
        ["Body Mass (kg)", "71.8 ± 6.5", "71.2 ± 6.2", "72.4 ± 7.0", "0.70"],
        ["Stature (cm)", "176.4 ± 5.8", "175.8 ± 5.2", "177.0 ± 6.5", "0.67"],
        ["Running Cadence (spm)", "168.2 ± 4.1", "168.5 ± 3.8", "167.9 ± 4.5", "0.76"],
        ["Baseline MVIC EMG (mV)", "1.42 ± 0.18", "1.40 ± 0.16", "1.44 ± 0.20", "0.64"]
      ],
      footnotes: "Abbreviation: MVIC = Maximal Voluntary Isometric Contraction; DWU = Dynamic Warm-Up; SS = Static Stretch.",
      analysisRunId: "an-out-1",
      isApproved: true
    },
    {
      id: "tbl-2",
      number: 2,
      title: "Table 2: Crossover EMG Activation Results and Statistical Model Outputs",
      caption: "Table 2. Peak semitendinosus and biceps femoris EMG (% MVIC) under Dynamic Warm-Up versus Static Stretching conditions with crossover statistical checks. [Demonstration Data — Not Real Research]",
      headers: ["Outcome Measure", "Static Stretch (SS)", "Dynamic Warm-Up (DWU)", "Mean Difference (95% CI)", "t-statistic (df=17)", "p-value", "Effect Size (Cohen's d)"],
      rows: [
        ["Semitendinosus Peak EMG (% MVIC)", "74.21 ± 5.84", "82.61 ± 6.12", "+8.40 [+5.81, +10.99]", "6.84", "< 0.001*", "1.41 (Large)"],
        ["Biceps Femoris Peak EMG (% MVIC)", "70.42 ± 6.10", "71.78 ± 5.92", "+1.36 [-0.42, +3.14]", "1.58", "0.132", "0.23 (Small)"],
        ["Period 1 vs Period 2 Difference", "78.20 ± 6.80", "78.62 ± 6.50", "+0.42 [-2.20, +3.04]", "0.33", "0.742", "0.06 (Negligible)"],
        ["Sequence Carryover Interaction", "-", "-", "-", "0.50", "0.621", "-"]
      ],
      footnotes: "* Statistically significant difference (p < 0.001). [Demonstration Data — Not Real Research]",
      analysisRunId: "an-out-1",
      isApproved: true
    }
  ],
  sections: [
    {
      id: "sec-1",
      title: "Title & Abstract",
      order: 1,
      targetWordLimit: 300,
      currentWordCount: 245,
      content: `# Effect of a Structured Warm-Up on Semitendinosus Muscle Activation During Treadmill Running: A Synthetic Crossover Demonstration

**Notice: Demonstration Data — Not Real Research**

**Abstract**
**Background:** Hamstring strain injuries in endurance runners often relate to altered neuromuscular recruitment during early stance phase. While dynamic warm-ups (DWU) are widely advocated, their specific influence on semitendinosus peak electromyography (EMG) relative to static stretching (SS) in controlled crossover conditions remains debated.
**Methods:** In an 18-participant synthetic randomized 2x2 crossover trial, recreational runners performed treadmill running at 12 km/h following 10 minutes of DWU or SS, separated by a 48-hour washout period. Surface EMG peak amplitude (% MVIC) was recorded for the semitendinosus during stance phase. Statistical testing comprised paired t-tests, period effect checks, and carryover interaction ANOVAs.
**Results:** DWU produced significantly higher semitendinosus peak EMG (82.61 ± 6.12 % MVIC) than SS (74.21 ± 5.84 % MVIC; mean difference = 8.40 % MVIC, 95% CI [5.81, 10.99], t(17) = 6.84, p < 0.001, Cohen's d = 1.41). Crossover diagnostic tests confirmed an absence of period effects (p = 0.742) or carryover interactions (p = 0.621). Biceps femoris activation exhibited no significant difference between protocols (p = 0.132).
**Conclusion:** A multi-modal dynamic warm-up selectively potentiates semitendinosus activation during submaximal running without sequence carryover. These synthetic findings illustrate TehqIQ's evidence-traceable crossover pipeline.`,
      citationIds: ["src-1", "src-2", "src-3"],
      status: "Approved",
      version: 1,
      lastEditedBy: "Dr. Moneeb Ahmad",
      lastEditedTimestamp: "2026-07-29T16:00:00Z"
    },
    {
      id: "sec-2",
      title: "Introduction",
      order: 2,
      targetWordLimit: 800,
      currentWordCount: 420,
      content: `## Introduction

Hamstring muscle injuries represent one of the most frequent lower-extremity musculoskeletal afflictions in endurance and field-sport athletes. Recent electromyographic (EMG) investigations indicate that neuromuscular activation of individual hamstring heads—specifically the semitendinosus and biceps femoris long head—plays a pivotal role in absorbing eccentric loads prior to initial ground contact during running [Boyer et al., 2021; Mendiguchia et al., 2022].

Although dynamic warm-up (DWU) routines have replaced static stretching (SS) in contemporary sports medicine recommendations, few empirical studies have quantified whether dynamic potentiation acts uniformly across biarticular hamstring bellies under controlled treadmill speeds. Static stretching has been hypothesized to temporarily impair neural drive and stretch reflex sensitivity, whereas multi-modal dynamic drills elevate muscle temperature and motor unit firing rates [Boyer et al., 2021].

However, methodological evaluations in exercise physiology frequently suffer from sequence order artifacts or inadequate washout protocols [Senn & Senn, 2018]. A randomized 2x2 crossover framework provides a rigorous within-subject design, minimizing inter-individual variance while allowing statistical testing for period and carryover effects.

Therefore, the primary objective of this study was to compare stance-phase peak semitendinosus EMG activation (% MVIC) during treadmill running at 12 km/h following DWU versus SS in a synthetic crossover sample. We hypothesized that DWU would elicit significantly higher semitendinosus peak activation without sequence-dependent carryover.`,
      citationIds: ["src-1", "src-2", "src-3"],
      status: "Approved",
      version: 1,
      lastEditedBy: "Dr. Moneeb Ahmad",
      lastEditedTimestamp: "2026-07-29T16:15:00Z"
    },
    {
      id: "sec-3",
      title: "Materials and Methods",
      order: 3,
      targetWordLimit: 1200,
      currentWordCount: 510,
      content: `## Materials and Methods

### Study Design & Ethics
This study utilized a two-period, two-sequence (2x2) randomized crossover design compliant with CONSORT recommendations for crossover trials [Senn & Senn, 2018]. Synthetic data representing 18 healthy recreational endurance runners (age 26.4 ± 3.2 years; 10 male, 8 female) were synthesized to evaluate methodic workflow parameters. Ethical approval was referenced under NISS-REC-2026-088-DEMO (Demonstration Data — Not Real Research).

### Interventions & Washout
Participants completed two testing sessions separated by a strict 48-hour washout period:
1. **Dynamic Warm-Up (DWU):** 10 minutes consisting of progressive multi-planar dynamic leg swings, high knees, walking lunges, and active hamstring scoops.
2. **Static Stretch (SS):** 10 minutes consisting of four unassisted static standing hamstring stretches held for 30 seconds each (repeated 3 times per limb).

Sequence allocation (DWU → SS vs SS → DWU) was randomized in a 1:1 ratio.

### EMG Acquisition & Instrumentation
Bipolar surface EMG electrodes (Delsys Trigno) were placed on the right semitendinosus belly following SENIAM guidelines. Maximal Voluntary Isometric Contractions (MVIC) were recorded prior to warm-up. Following intervention, participants ran on an instrumented treadmill at 12.0 km/h for 5 minutes. Surface EMG signals were band-pass filtered (20-450 Hz), rectified, and normalized to % MVIC over 20 consecutive strides during stance phase.

### Statistical Analysis
Paired Student's t-tests were conducted to compare peak EMG (% MVIC) between DWU and SS conditions. Grizzle's model was applied to test for carryover effects (sequence × treatment interaction) and period main effects (Period 1 vs Period 2) at α = 0.05. Statistical power was > 0.80 for detecting d = 0.80 at n = 18. Analysis was executed in Python 3.11 statsmodels.`,
      citationIds: ["src-1", "src-3"],
      status: "Approved",
      version: 1,
      lastEditedBy: "Dr. Moneeb Ahmad",
      lastEditedTimestamp: "2026-07-29T16:30:00Z"
    },
    {
      id: "sec-4",
      title: "Results",
      order: 4,
      targetWordLimit: 1000,
      currentWordCount: 340,
      content: `## Results

### Participant Flow & Baseline Demographics
All 18 synthetic participants completed both crossover periods without protocol deviations or adverse events. Baseline characteristics were balanced across sequence arms (Table 1).

### Primary Outcome: Semitendinosus Activation
As shown in Figure 1 and Table 2, dynamic warm-up elicited significantly greater peak semitendinosus activation during stance phase (82.61 ± 6.12 % MVIC) compared to static stretching (74.21 ± 5.84 % MVIC). The mean paired difference was 8.40 % MVIC (95% CI [5.81, 10.99], t(17) = 6.84, p < 0.001). The calculated effect size was exceptionally large (Cohen's d = 1.41).

### Secondary Outcome & Crossover Diagnostic Tests
In contrast, biceps femoris peak EMG did not exhibit a statistically significant difference between DWU (71.78 ± 5.92 % MVIC) and SS (70.42 ± 6.10 % MVIC; mean difference = 1.36 % MVIC, p = 0.132, Cohen's d = 0.23).

Diagnostic crossover ANOVA confirmed that period effects were non-significant (F(1,16) = 0.11, p = 0.742), and sequence-by-treatment carryover interaction was absent (F(1,16) = 0.25, p = 0.621), confirming the validity of pooled crossover estimates. Differences satisfied Shapiro-Wilk normality assumptions (W = 0.965, p = 0.580).`,
      citationIds: [],
      status: "Approved",
      version: 1,
      lastEditedBy: "Dr. Moneeb Ahmad",
      lastEditedTimestamp: "2026-07-29T16:45:00Z"
    },
    {
      id: "sec-5",
      title: "Discussion & Conclusion",
      order: 5,
      targetWordLimit: 1200,
      currentWordCount: 410,
      content: `## Discussion

The findings of this synthetic crossover trial demonstrate that a 10-minute dynamic warm-up significantly enhances semitendinosus peak EMG amplitude during stance-phase treadmill running relative to static stretching. Crucially, this potentiating effect occurred specifically in the semitendinosus without equivalent surge in biceps femoris activation, supporting the concept of muscle-specific neural drive modulation [Mendiguchia et al., 2022].

From a biomechanical standpoint, the rapid eccentric-to-concentric transition of the semitendinosus during early ground contact requires elevated rate of force development. Dynamic warm-up drills facilitate spindle sensitivity and temperature-dependent nerve conduction velocity [Boyer et al., 2021], whereas static stretching may induce transient muscle-tendon compliance increase without potentiating spinal alpha-motoneuron pools.

Methodologically, the absence of period or carryover effects confirms that a 48-hour washout period was adequate to extinguish acute viscoelastic or neural modifications induced by either condition [Senn & Senn, 2018].

### Limitations
As a synthetic demonstration project generated within TehqIQ, these numerical findings do not reflect human clinical data and must be treated purely as instructional benchmark artifacts. Real-world application requires empirical surface EMG trials with cross-talk suppression and 3D motion capture.

### Conclusion
A structured dynamic warm-up selectively elevates semitendinosus stance activation during running. This study confirms TehqIQ's automated crossover analysis, CSL citation mapping, and reporting compliance pipeline.`,
      citationIds: ["src-1", "src-2", "src-3"],
      status: "Approved",
      version: 1,
      lastEditedBy: "Dr. Moneeb Ahmad",
      lastEditedTimestamp: "2026-07-29T17:00:00Z"
    }
  ],
  activeCslStyle: "apa",
  selectedTargetOutlet: {
    id: "out-1",
    title: "Journal of Applied Biomechanics",
    type: "Journal",
    issnOrAcronym: "JAB / 1065-8483",
    publisherOrSociety: "Human Kinetics Publishers",
    subjectCategory: "Sports Medicine & Biomechanics",
    officialUrl: "https://journals.humankinetics.com/view/journals/jab/jab-overview.xml",
    indexing: ["PubMed", "Scopus", "Web of Science"],
    openAccessModel: "Hybrid",
    apcFee: "$2,800 USD (Optional OA)",
    wordLimit: 4000,
    abstractWordLimit: 250,
    citationStyle: "APA 7th",
    figureTableLimit: 6,
    acceptanceRateEstimate: "28% (Estimated from public indexing)",
    lastVerifiedDate: "2026-07-15",
    aiPolicySummary: "AI usage allowed for language polishing and drafting assist; AI must be declared in Acknowledgements / Disclosure ledger.",
    fitScore: 92,
    fitReasons: [
      "Scope explicitly includes surface electromyography in running kinematics.",
      "Crossover study design matches empirical article standards.",
      "APA 7th citation style fully supported."
    ],
    fitRisks: ["Word count (1,745 words) is well within the 4,000 word ceiling."],
    dueDiligenceCheck: {
      editorialBoardTransparent: true,
      peerReviewClear: true,
      feesDisclosed: true,
      isLegitimateConcern: false,
      notes: "Established peer-reviewed journal indexed in MEDLINE/PubMed."
    }
  },
  complianceReport: {
    overallStatus: "Pass",
    outletName: "Journal of Applied Biomechanics",
    lastCheckedDate: "2026-07-30T10:00:00Z",
    checks: [
      { category: "Article Type", requirement: "Original Research / Crossover Study", actual: "Crossover study", status: "Pass" },
      { category: "Main Text Length", requirement: "Max 4,000 words", actual: "1,745 words", status: "Pass" },
      { category: "Abstract Length", requirement: "Max 250 words", actual: "245 words", status: "Pass" },
      { category: "Figures & Tables", requirement: "Max 6 items", actual: "3 items (1 Figure, 2 Tables)", status: "Pass" },
      { category: "Citation Style", requirement: "APA 7th Format", actual: "APA 7th Rendered", status: "Pass" },
      { category: "Ethics Declaration", requirement: "Mandatory Committee Approval & Registration", actual: "Declared (NISS-REC-2026-088-DEMO)", status: "Pass" },
      { category: "AI Disclosure", requirement: "Explicit AI Assistance Statement", actual: "AI Ledger logged & disclosure generated", status: "Pass" },
      { category: "Demonstration Warning", requirement: "No synthetic demo data in production submission", actual: "Demonstration Flag Active!", status: "Warning", actionRequired: "Project is marked as Synthetic Demonstration Data." }
    ]
  },
  reviewerComments: [
    {
      id: "rev-1",
      agentRole: "Statistical Reviewer",
      severity: "Commendation",
      manuscriptSection: "Results",
      commentText: "The 2x2 crossover diagnostic ANOVA appropriately evaluated period main effects (p=0.742) and carryover interaction (p=0.621) prior to pooling paired t-test differences. Assumptions of normality were verified via Shapiro-Wilk test (p=0.580).",
      suggestedAction: "Maintain transparent reporting of crossover ANOVA F-statistics in Table 2.",
      authorResponse: "Table 2 updated with exact F-statistics and carryover p-values.",
      actionTaken: "Accept",
      status: "Resolved",
      timestamp: "2026-07-29T11:00:00Z"
    },
    {
      id: "rev-2",
      agentRole: "Journal Editor Reviewer",
      severity: "Minor Concern",
      manuscriptSection: "Title & Abstract",
      commentText: "Ensure the prominent synthetic demonstration banner is retained for instructional previews and clearly cleared prior to human empirical publishing.",
      suggestedAction: "Retain synthetic demonstration warnings in all preview headers.",
      authorResponse: "Demonstration banners confirmed across all screens and exports.",
      actionTaken: "Accept",
      status: "Resolved",
      timestamp: "2026-07-29T12:00:00Z"
    }
  ],
  aiLedger: [
    {
      id: "led-1",
      timestamp: "2026-07-28T10:15:00Z",
      userEmail: "eng.moneeb@jadwaa.com",
      featureUsed: "Research Question Refinement",
      manuscriptSection: "Introduction",
      model: "gemini-3.6-flash",
      promptVersion: "v1.2-rq-builder",
      inputSourcesUsed: ["PICO framework inputs"],
      generatedSummary: "Proposed 2 candidate research questions and FINER criteria scoring.",
      userDecision: "Accepted",
      creditRoleAssigned: "Conceptualization"
    },
    {
      id: "led-2",
      timestamp: "2026-07-28T14:35:00Z",
      userEmail: "eng.moneeb@jadwaa.com",
      featureUsed: "Crossover Statistical Interpretation",
      manuscriptSection: "Results",
      model: "gemini-3.6-flash",
      promptVersion: "v2.0-stats-interpreter",
      inputSourcesUsed: ["Python paired t-test output", "Grizzle crossover ANOVA output"],
      generatedSummary: "Summarized Cohen's d=1.41, t(17)=6.84, p<0.001 and period/carryover p-values.",
      userDecision: "Accepted",
      creditRoleAssigned: "Formal analysis"
    }
  ],
  pipelineStages: [
    { id: "stg-1", number: 1, name: "Project Setup", description: "Define discipline, team roles, and project scope", status: "Completed", progressPercent: 100 },
    { id: "stg-2", number: 2, name: "Idea Development", description: "Formulate research canvas and PICO framework", status: "Completed", progressPercent: 100 },
    { id: "stg-3", number: 3, name: "Research Question", description: "Evaluate FINER score and set hypotheses", status: "Completed", progressPercent: 100 },
    { id: "stg-4", number: 4, name: "Preliminary Search", description: "Build boolean query string and test databases", status: "Completed", progressPercent: 100 },
    { id: "stg-5", number: 5, name: "Literature Review", description: "Import DOIs, extract evidence passages", status: "Completed", progressPercent: 100 },
    { id: "stg-6", number: 6, name: "Research-Gap Assessment", description: "Map population, methodological, and theoretical gaps", status: "Completed", progressPercent: 100 },
    { id: "stg-7", number: 7, name: "Methods & Protocol", description: "Specify 2x2 crossover design and sample size", status: "Completed", progressPercent: 100 },
    { id: "stg-8", number: 8, name: "Ethics & Registration", description: "Log ethics approval and trial registration", status: "Completed", progressPercent: 100 },
    { id: "stg-9", number: 9, name: "Data Collection", description: "Upload synthetic CSV dataset and profile variables", status: "Completed", progressPercent: 100 },
    { id: "stg-10", number: 10, name: "Analysis Plan", description: "Approve statistical test assumptions and thresholds", status: "Completed", progressPercent: 100 },
    { id: "stg-11", number: 11, name: "Analysis Execution", description: "Execute paired t-test and Grizzle crossover ANOVA", status: "Completed", progressPercent: 100 },
    { id: "stg-12", number: 12, name: "Results Verification", description: "Generate publication Figure 1 and Tables 1-2", status: "Completed", progressPercent: 100 },
    { id: "stg-13", number: 13, name: "Manuscript Planning", description: "Set outline and target word limits per section", status: "Completed", progressPercent: 100 },
    { id: "stg-14", number: 14, name: "Section Drafting", description: "Draft Introduction, Methods, Results, Discussion", status: "Completed", progressPercent: 100 },
    { id: "stg-15", number: 15, name: "Citation Verification", description: "Map in-text citations to verified DOIs and CSL style", status: "Completed", progressPercent: 100 },
    { id: "stg-16", number: 16, name: "Internal Peer Review", description: "Run 6 reviewer agents and resolve feedback", status: "Completed", progressPercent: 100 },
    { id: "stg-17", number: 17, name: "Target Outlet Compliance", description: "Evaluate fit score for Journal of Applied Biomechanics", status: "Completed", progressPercent: 100 },
    { id: "stg-18", number: 18, name: "Revision Management", description: "Track author responses to reviewer feedback", status: "Completed", progressPercent: 100 },
    { id: "stg-19", number: 19, name: "Final Author Approval", description: "Sign off CRediT roles and corresponding author signoff", status: "Approved", progressPercent: 100 },
    { id: "stg-20", number: 20, name: "Export & Submission", description: "Generate submission package (DOCX, PDF, BibTeX)", status: "Completed", progressPercent: 100 }
  ],
  readinessScore: {
    overall: 96,
    questionClarity: 100,
    literatureCoverage: 95,
    evidenceVerification: 100,
    methodCompleteness: 98,
    dataQuality: 100,
    reproducibility: 100,
    citationAccuracy: 100,
    compliance: 94,
    integrityReview: 92
  }
};
