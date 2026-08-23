export type UserRole =
  | "Individual Researcher"
  | "Project Owner"
  | "Corresponding Author"
  | "Co-author"
  | "Research Supervisor"
  | "Statistician"
  | "Literature Reviewer"
  | "Institutional Administrator"
  | "Platform Administrator";

export type ProjectRole =
  | "Owner"
  | "Corresponding Author"
  | "Co-author"
  | "Supervisor"
  | "Statistician"
  | "Reviewer"
  | "Viewer";

export interface ProjectMember {
  uid: string;
  email: string;
  displayName?: string;
  role: ProjectRole;
  joinedAt: string;
}

export interface ProjectVersionSnapshot {
  id: string;
  version: number;
  timestamp: string;
  createdByUid: string;
  createdByEmail: string;
  summary: string;
  titleSnapshot: string;
  sectionCountSnapshot: number;
}

export interface ProjectAuditEvent {
  id: string;
  timestamp: string;
  uid: string;
  userEmail: string;
  action: string;
  details: string;
}

export type ResearchProjectType =
  | "Original quantitative research"
  | "Original qualitative research"
  | "Mixed-methods research"
  | "Randomized controlled trial"
  | "Quasi-experimental study"
  | "Cross-sectional study"
  | "Cohort study"
  | "Case-control study"
  | "Crossover study"
  | "Diagnostic-accuracy study"
  | "Survey study"
  | "Laboratory experiment"
  | "Engineering experiment"
  | "Simulation study"
  | "Machine-learning study"
  | "Software or tool paper"
  | "Systematic review"
  | "Scoping review"
  | "Meta-analysis"
  | "Narrative review"
  | "Bibliometric review"
  | "Theoretical paper"
  | "Case report"
  | "Study protocol"
  | "Registered report"
  | "Thesis chapter conversion"
  | "Full conference paper"
  | "Short conference paper"
  | "Conference poster"
  | "Existing manuscript revision"
  | "Response to reviewers"
  | "Custom scholarly project";

export type StageStatus =
  | "Not started"
  | "In progress"
  | "Waiting for researcher"
  | "Waiting for collaborator"
  | "Blocked"
  | "Under review"
  | "Approved"
  | "Completed";

export interface PipelineStage {
  id: string;
  number: number;
  name: string;
  description: string;
  status: StageStatus;
  progressPercent: number;
  blockers?: string[];
}

export interface Author {
  id: string;
  fullName: string;
  publicationName: string;
  email: string;
  orcid?: string;
  department: string;
  institution: string;
  city: string;
  country: string;
  isCorresponding: boolean;
  order: number;
  creditRoles: string[]; // CRediT roles
  conflictDeclaration: string;
  finalApproval: boolean;
  approvalTimestamp?: string;
  isDemo?: boolean;
  isSynthetic?: boolean;
}

export interface ResearchCanvas {
  broadTopic: string;
  practicalProblem: string;
  scientificProblem: string;
  theoreticalProblem: string;
  population: string;
  context: string;
  intervention: string;
  exposure: string;
  comparator: string;
  outcome: string;
  existingKnowledge: string;
  suspectedGap: string;
  proposedContribution: string;
  framework: "PICO" | "PICOS" | "PECO" | "PCC" | "SPIDER" | "FINER" | "CIMO" | "Engineering";
  aiSuggestions?: {
    refinedTopic?: string;
    candidateQuestions?: string[];
    objectives?: string[];
    hypotheses?: string[];
    constructs?: string[];
    feasibilityRisks?: string[];
    ethicalRisks?: string[];
  };
}

export type MethodologySourceMode = "Researcher Entered" | "Protocol Upload" | "AI Proposal";
export type MethodologyReviewState = "Draft" | "Needs Review" | "AI Suggested" | "Researcher Approved";

export interface MethodologyFields {
  design: string;
  populationOrDataSource: string;
  sampling: string;
  eligibility: string;
  interventionExposureComparator: string;
  variablesOrOutcomes: string;
  instruments: string;
  dataCollection: string;
  analysisPlan: string;
  ethics: string;
  limitations: string;
}

export interface MethodologyWorkspace {
  sourceMode: MethodologySourceMode;
  reviewState: MethodologyReviewState;
  fields: MethodologyFields;
  uploadedProtocol?: {
    fileName: string;
    mimeType: string;
    uploadedAt: string;
    extractedAt: string;
  };
  aiProposal?: {
    generatedAt: string;
    model: string;
    promptVersion: string;
  };
  researcherApproval?: {
    approvedAt: string;
    approvedByUid: string;
  };
  updatedAt: string;
}

export interface Hypothesis {
  id: string;
  type: "Null" | "Alternative" | "Primary" | "Secondary" | "Directional" | "Non-directional";
  statement: string;
  testedInAnalysisId?: string;
  status: "Proposed" | "Approved" | "Supported" | "Rejected" | "Inconclusive";
}

export interface ResearchQuestionItem {
  id: string;
  question: string;
  type: "Primary" | "Secondary" | "Sub-question";
  finerScore: {
    feasible: number;
    interesting: number;
    novel: number;
    ethical: number;
    relevant: number;
    totalScore: number;
  };
  hypotheses: Hypothesis[];
  isApproved: boolean;
  approvalDate?: string;
}

export interface SearchStrategy {
  id: string;
  database: "Crossref" | "OpenAlex" | "PubMed" | "Europe PMC" | "DOAJ" | "DataCite" | "arXiv" | "Google Scholar / Search";
  concepts: string[];
  booleanQuery: string;
  filters: {
    dateFrom?: string;
    dateTo?: string;
    publicationTypes?: string[];
    languages?: string[];
    peerReviewedOnly?: boolean;
  };
  resultCount: number;
  searchDate: string;
}

export type VerificationState = "Unverified" | "Verified" | "Conflict" | "Retracted" | "Corrected";

export type SourceState =
  | "Imported"
  | "Metadata Pending"
  | "Metadata Verified"
  | "Full Text Available"
  | "Full Text Reviewed"
  | "Corrected"
  | "Retracted"
  | "Unresolved";

export type ClaimState =
  | "Draft"
  | "Unlinked"
  | "Evidence Linked"
  | "Researcher Reviewed"
  | "Verified"
  | "Contradicted"
  | "Rejected";

export type DatasetState =
  | "Uploaded"
  | "Parsing"
  | "Profiled"
  | "Requires Review"
  | "Approved for Analysis"
  | "Locked";

export type AnalysisState =
  | "Draft Plan"
  | "Awaiting Approval"
  | "Approved"
  | "Queued"
  | "Running"
  | "Failed"
  | "Completed"
  | "QC Passed"
  | "Researcher Reviewed"
  | "Approved for Manuscript"
  | "Locked";

export type SectionState =
  | "Empty"
  | "Draft"
  | "AI Suggested"
  | "Researcher Edited"
  | "Under Review"
  | "Approved"
  | "Locked";

export interface StateTransitionRecord {
  id: string;
  entityType: "Source" | "Claim" | "Dataset" | "Analysis" | "ManuscriptSection";
  entityId: string;
  fromState: string;
  toState: string;
  actorUid: string;
  actorEmail: string;
  timestamp: string;
  reason: string;
  evidenceRecordIds?: string[];
}

export interface FieldProvenance {
  provider: string; // e.g., "Crossref", "OpenAlex", "DataCite", "Europe PMC", "BibTeX", "RIS", "CSL JSON", "Manual Input"
  timestamp: string;
  rawRecordUrl?: string;
}

export interface ProvenanceMetadata {
  provider: string;
  retrievedAt: string;
  fieldProvenance?: Record<string, FieldProvenance>;
  disclaimer?: string;
}

export interface SourceRecord {
  id: string;
  title: string;
  authors: string[];
  year: number;
  fullDate?: string;
  journalOrVenue: string;
  publisher?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  pmid?: string;
  pmcid?: string;
  url?: string;
  abstract?: string;
  fullTextContent?: string; // Actual uploaded or retrieved content ONLY
  keywords?: string[];
  documentType: string;
  studyDesign?: string;
  peerReviewStatus: "Peer-reviewed" | "Preprint" | "Grey literature" | "Unknown";
  openAccessStatus?: string;
  verificationState: VerificationState;
  state?: SourceState;
  stateHistory?: StateTransitionRecord[];
  metadataProvider?: string;
  provenance?: ProvenanceMetadata; // Field-level provenance & metadata provider details
  verificationDate?: string;
  retractionWarning?: boolean;
  correctionNotice?: string;
  relevanceScore: number; // 1 to 10
  tags: string[];
  researcherNotes?: string;
  extractedPassages?: ExtractedPassage[];
  isDemo?: boolean;
  isSynthetic?: boolean;
}

export interface ExtractedPassage {
  id: string;
  sourceId: string;
  pageNumber?: number;
  section?: string;
  text: string;
  category: "Purpose" | "Method" | "Sample" | "Finding" | "Limitation" | "Quote";
  confidence: number;
  isVerifiedByHuman: boolean;
}

export type ClaimType =
  | "Background fact"
  | "Theoretical claim"
  | "Prevalence claim"
  | "Methodological claim"
  | "Causal claim"
  | "Associational claim"
  | "Interpretation"
  | "Researcher result"
  | "Recommendation"
  | "Limitation";

export type EvidenceRelationship = "Direct support" | "Partial support" | "Contextual support" | "Contradictory evidence" | "No support identified";

export interface LinkedEvidenceItem {
  id: string;
  sourceId: string;
  sourceTitle?: string;
  passageQuote: string; // Exact page, section, paragraph, or quoted passage text
  pageNumber?: string;
  sectionName?: string;
  paragraphNumber?: string;
  notes?: string;
  createdAt: string;
  relationship?: EvidenceRelationship;
}

export interface ClaimItem {
  id: string;
  claimText: string;
  claimType: ClaimType;
  manuscriptSection: string;
  importance: "High" | "Medium" | "Low";
  linkedSourceIds: string[];
  linkedEvidence?: LinkedEvidenceItem[];
  evidenceRelationship: EvidenceRelationship;
  evidencePassage?: string;
  verificationStatus: "Unverified" | "Verified" | "Flagged";
  approvalStatus?: "Not Approved" | "Pending Review" | "Approved";
  state?: ClaimState;
  stateHistory?: StateTransitionRecord[];
  flagReason?: string;
  isResearcherApproved: boolean;
  isDemo?: boolean;
  isSynthetic?: boolean;
}

export interface ResearchGap {
  id: string;
  gapStatement: string;
  type: "Population" | "Geographic" | "Methodological" | "Theoretical" | "Evidence inconsistency" | "Temporal" | "Data";
  supportingSourceIds: string[];
  confidence: number;
  isApproved: boolean;
}

export interface ReportingChecklistItem {
  id: string;
  sectionOrTopic: string;
  itemNumber: string;
  description: string;
  status: "Required" | "Addressed" | "Partially addressed" | "Missing" | "Not applicable";
  manuscriptLocation?: string;
  researcherComment?: string;
}

export interface ReportingGuideline {
  name: "CONSORT" | "STROBE" | "PRISMA" | "CARE" | "COREQ" | "STARD" | "TRIPOD" | "ARRIVE" | "CHEERS";
  version: string;
  applicableStudyType: string;
  checklistItems: ReportingChecklistItem[];
}

export interface PiiWarning {
  variableName: string;
  warningType: "Direct Identifier" | "Quasi-Identifier" | "PII Content Pattern" | "High Cardinality Key";
  details: string;
}

export interface ParsingError {
  row?: number;
  col?: string | number;
  message: string;
  rawData?: string;
}

export interface DatasetVersion {
  version: number;
  fileHash: string;
  filename: string;
  uploadDate: string;
  recordCount: number;
  variableCount: number;
  missingnessPercent: number;
  changeNote?: string;
}

export interface DatasetVariable {
  name: string;
  type: "Numeric" | "Categorical" | "Datetime" | "ID" | "Text";
  label?: string;
  unit?: string;
  coding?: string;
  missingValueDefinitions?: string[];
  expectedMin?: number;
  expectedMax?: number;
  missingCount: number;
  uniqueValues: number;
  summaryStats?: {
    mean?: number;
    sd?: number;
    min?: number;
    max?: number;
    median?: number;
    iqr?: number;
    q1?: number;
    q3?: number;
    frequencies?: Record<string, number>;
    note?: string;
  };
  invalidDateCount?: number;
  rangeViolationCount?: number;
  possibleOutliers?: number;
  role?: "Primary outcome" | "Secondary outcome" | "Predictor" | "Covariate" | "ID" | "Period" | "Sequence";
}

export interface DatasetRecord {
  id: string;
  filename: string;
  fileHash: string;
  uploadDate: string;
  recordCount: number;
  variableCount: number;
  variables: DatasetVariable[];
  missingnessPercent: number;
  isAnonymizedConfirmed: boolean;
  duplicateRowCount?: number;
  schemaDriftDetected?: boolean;
  schemaDriftDetails?: string[];
  piiWarnings?: PiiWarning[];
  parsingErrors?: ParsingError[];
  version?: number;
  versionHistory?: DatasetVersion[];
  state?: DatasetState;
  stateHistory?: StateTransitionRecord[];
  rawPreview?: Record<string, any>[];
  isDemo?: boolean;
  isSynthetic?: boolean;
}

export interface AnalysisPlan {
  id: string;
  title: string;
  researchQuestionId: string;
  hypothesisId?: string;
  outcomeVariable: string;
  predictorVariables: string[];
  covariates?: string[];
  statisticalMethod: string;
  assumptions: string[];
  effectSizeMeasure: string;
  significanceThreshold: number; // default 0.05
  missingDataStrategy: string;
  status: "Draft" | "Approved" | "Executed";
  state?: AnalysisState;
  stateHistory?: StateTransitionRecord[];
  isPreregistered: boolean;
  approvalTimestamp?: string;
}

export interface AnalysisOutput {
  id: string;
  analysisPlanId: string;
  executionTimestamp: string;
  softwareEnvironment: string; // e.g. "Python 3.11 / statsmodels 0.14"
  randomSeed?: number;
  summaryText: string;
  numericResults: Record<string, number | string | Record<string, any>>;
  figuresCreated?: string[]; // IDs of generated figures
  tablesCreated?: string[]; // IDs of generated tables
  pValues: { test: string; pValue: number; significant: boolean; formatted: string }[];
  effectSizes: { metric: string; value: number; ciLower?: number; ciUpper?: number }[];
  assumptionChecks: { assumption: string; met: boolean; testUsed?: string; pValue?: number; note?: string }[];
  isReproduced: boolean;
  reproducibilityHash: string;
  isDemo?: boolean;
  isSynthetic?: boolean;
  
  // Phase 5 Analysis Metadata & Audit Fields
  datasetHash?: string;
  planId?: string;
  code?: string;
  packageVersions?: Record<string, string> | string;
  parameters?: Record<string, any>;
  logs?: string[];
  warnings?: string[];
  executionStatus?: "Completed" | "Failed" | "Queued" | "Running" | "Blocked";
  isResearcherSupplied?: boolean; // Label for imported SPSS/R/Jamovi/Prism logs
  reproductionStatus?: "Independently Reproduced" | "Not Independently Reproduced";
  pairingReport?: {
    totalParticipants: number;
    completePairs: number;
    incompletePairs: number;
    notes: string;
  };
  periodEffectReport?: {
    tStat: number;
    pValue: number;
    significant: boolean;
    meanDiff: number;
    note: string;
  };
  sequenceEffectReport?: {
    tStat: number;
    pValue: number;
    significant: boolean;
    meanDiff: number;
    note: string;
  };
  carryoverReport?: {
    fOrTStat: number;
    pValue: number;
    detected: boolean;
    limitationNotice: string;
  };
  missingDataReport?: {
    totalRows: number;
    completeRows: number;
    missingRows: number;
    missingPercent: number;
    droppedSubjects: string[];
  };
  sensitivityAnalysis?: {
    model: string;
    meanDiff: number;
    pValue: number;
    effectSize: number;
    note: string;
  }[];
  state?: AnalysisState;
  stateHistory?: StateTransitionRecord[];
  isApproved?: boolean;
  researcherApproval?: {
    actor: { uid: string; email: string };
    timestamp: string;
    rationale: string;
    outputId: string;
    datasetHash: string;
    planId: string;
  };
}

export interface GeneratedFigure {
  id: string;
  title: string;
  caption: string;
  type: "Bar Chart" | "Line Graph" | "Box Plot" | "Scatter Plot" | "Forest Plot" | "PRISMA Flow";
  analysisRunId: string;
  dataPoints: any[];
  xAxisLabel: string;
  yAxisLabel: string;
  isApproved: boolean;
  isDemo?: boolean;
  isSynthetic?: boolean;
}

export interface GeneratedTable {
  id: string;
  number: number;
  title: string;
  caption: string;
  headers: string[];
  rows: (string | number)[][];
  footnotes?: string;
  analysisRunId: string;
  isApproved: boolean;
  isDemo?: boolean;
  isSynthetic?: boolean;
}

export interface ManuscriptSection {
  id: string;
  title: string;
  order: number;
  targetWordLimit?: number;
  currentWordCount: number;
  content: string; // Markdown or rich HTML
  citationIds: string[];
  status: "Not started" | "Drafting" | "Needs evidence" | "Under review" | "Approved";
  state?: SectionState;
  stateHistory?: StateTransitionRecord[];
  missingInformationFlags?: string[];
  version: number;
  lastEditedBy: string;
  lastEditedTimestamp: string;
  isDemo?: boolean;
  isSynthetic?: boolean;
}

export interface CSLStyleOption {
  id: "apa" | "ieee" | "nature" | "vancouver" | "chicago" | "chicago-notes" | "harvard" | "springer" | "elsevier" | "acs" | "ama" | "mla" | "cell" | "oxford" | "plos" | string;
  name: string;
  citationFormat: "author-date" | "numeric" | "footnote" | "superscript";
}

export type OutletRequirementField =
  | "articleType" | "manuscriptWordLimit" | "abstractWordLimit" | "abstractStructure"
  | "referenceStyle" | "referenceLimit" | "figureLimit" | "tableLimit" | "supplements"
  | "titlePage" | "authors" | "aiPolicy" | "ethics" | "dataSharing" | "apc"
  | "conferenceDeadline" | "conferenceTemplate" | "conferenceFileRequirements";

export type OutletRequirementState = "Verified" | "AI Extracted—Needs Review" | "Unverified" | "Unavailable";

export interface OutletRequirementHistoryEntry {
  version: number;
  value: string | number | boolean | string[] | null;
  state: OutletRequirementState;
  sourceProvider?: string;
  sourceUrl?: string;
  retrievedAt?: string;
  recordedAt: string;
}

export interface VersionedRequirementRecord {
  id: string;
  field: OutletRequirementField;
  value: string | number | boolean | string[] | null;
  state: OutletRequirementState;
  sourceProvider?: string;
  sourceUrl?: string;
  retrievedAt?: string;
  confidence: "High" | "Medium" | "Low";
  humanConfirmed: boolean;
  confirmedByUid?: string;
  confirmedByEmail?: string;
  confirmedAt?: string;
  version: number;
  history: OutletRequirementHistoryEntry[];

  /** Legacy read aliases; never sufficient for Verified state. */
  officialSourceUrl?: string;
  retrievalDate?: string;
  extractedValue?: string | number | string[];
}

export type OutletMetricProviderKind = "JCR" | "SCOPUS" | "SCIMAGO" | "OTHER_OFFICIAL" | "THIRD_PARTY";

export interface OutletMetricRecord {
  id: string;
  provider: string;
  providerKind: OutletMetricProviderKind;
  metricName: string;
  year: number;
  subjectCategory: string;
  value?: number | string;
  percentile?: number;
  quartile?: "Q1" | "Q2" | "Q3" | "Q4";
  sourceUrl: string;
  sourceRecordId?: string;
  retrievedAt: string;
  verificationState: "Verified" | "Unverified" | "Rejected";
}

export interface VersionedClaimRecord {
  claimName: "acceptance_rate" | "apc_fee" | "submission_deadline" | "indexing" | "review_time";
  value: string;
  officialSourceUrl: string;
  retrievalDate: string;
  humanConfirmed: boolean;
}

export type OutletProvenanceType =
  | "VERIFIED_STATIC_SEED"
  | "LIVE_RETRIEVED_RECORD"
  | "USER_ADDED_UNVERIFIED";

export type OutletVerificationStatus =
  | "Verified"
  | "Unverified"
  | "Pending_Verification";

export interface TargetOutlet {
  id: string;
  title: string;
  type: "Journal" | "Conference";
  issnOrAcronym: string;
  publisherOrSociety: string;
  subjectCategory: string;
  officialUrl: string;
  indexing: string[]; // e.g., ["Scopus", "PubMed", "DOAJ"]
  openAccessModel: "Gold" | "Hybrid" | "Green" | "Subscription" | "Unverified";
  apcFee?: string;
  wordLimit?: number;
  abstractWordLimit?: number;
  citationStyle: string;
  figureTableLimit?: number;
  acceptanceRateEstimate?: string;
  reviewTimeWeeks?: number;
  submissionDeadline?: string;
  lastVerifiedDate: string;
  aiPolicySummary: string;
  pageMargins?: string;
  columnLayout?: "single" | "double";
  fontFamily?: "Times New Roman" | "Arial" | "Calibri" | "Georgia";
  fontSizePt?: number;
  lineSpacing?: 1.0 | 1.15 | 1.5 | 2.0;
  headingFormat?: "IEEE Roman" | "APA Title Case" | "Nature Bold Numbered" | "Numbered Section";
  referenceOrdering?: "order_of_appearance" | "alphabetical" | "year_descending";
  inTextCitationType?: "numeric_bracket" | "author_date" | "superscript" | "parenthetical_numeric";
  fitScore?: number; // 0-100
  fitReasons?: string[];
  fitRisks?: string[];
  requirementsList?: VersionedRequirementRecord[];
  metrics?: OutletMetricRecord[];
  datedClaims?: VersionedClaimRecord[];
  outletProvenanceType?: OutletProvenanceType;
  verificationStatus?: OutletVerificationStatus;
  provenanceProvider?: string;
  identitySourceUrl?: string;
  identityRetrievedAt?: string;
  isUserAdded?: boolean;
  dueDiligenceCheck?: {
    editorialBoardTransparent: boolean;
    peerReviewClear: boolean;
    feesDisclosed: boolean;
    isLegitimateConcern: boolean;
    notes: string;
  };
}

export interface CalculatedComplianceRule {
  id: string;
  category: "Word Count" | "Abstract" | "Figures & Tables" | "Citation Style" | "Ethics & AI" | "Authorship";
  requirementName: string;
  requiredValue: string;
  actualValue: string;
  status: "Pass" | "Warning" | "Fail";
  sourceRecordId?: string;
  officialSourceUrl?: string;
  retrievalDate?: string;
  humanConfirmed?: boolean;
  actionRequired?: string;
}

export interface ComplianceReport {
  overallStatus: "Pass" | "Warning" | "Fail";
  outletName: string;
  lastCheckedDate: string;
  checks: {
    category: string;
    requirement: string;
    actual: string;
    status: "Pass" | "Warning" | "Fail";
    actionRequired?: string;
    officialSourceUrl?: string;
    retrievalDate?: string;
  }[];
}

export interface ReviewerComment {
  id: string;
  agentRole: "Methodology Reviewer" | "Statistical Reviewer" | "Subject-Matter Reviewer" | "Journal Editor Reviewer" | "Citation Reviewer" | "Language Reviewer";
  severity: "Major Concern" | "Minor Concern" | "Recommendation" | "Commendation";
  manuscriptSection: string;
  commentText: string;
  suggestedAction: string;
  authorResponse?: string;
  actionTaken?: "Accept" | "Reject with explanation" | "Partially accept" | "Pending";
  status: "Open" | "Resolved";
  timestamp: string;
  isDemo?: boolean;
  isSynthetic?: boolean;
}

export interface AiLedgerEvent {
  id: string;
  timestamp: string;
  userEmail: string;
  featureUsed: string;
  manuscriptSection?: string;
  model: string;
  promptVersion: string;
  inputSourcesUsed: string[];
  generatedSummary: string;
  userDecision: "Accepted" | "Edited" | "Rejected";
  creditRoleAssigned?: string;
}

export type AiLedgerIntegrityStatus = "Complete" | "Incomplete" | "Unknown" | "No AI Use Confirmed";

export interface AiLedgerIntegrity {
  status: AiLedgerIntegrityStatus;
  assessedAt?: string;
  assessedByUid?: string;
  rationale?: string;
  knownBypassPaths?: string[];
}

export interface IntegrityGateCheck {
  id: string;
  checkName: string;
  category: "Citation" | "Data" | "Ethics" | "Disclosure" | "Author Approval" | "Demonstration Data";
  status: "Pass" | "Warning" | "Blocker";
  message: string;
  resolutionPath?: string;
}

export interface GateCheckResult {
  checkId: string;
  category: "Citation Integrity" | "Unlinked Results" | "Ethics Mandate" | "AI Disclosure" | "Author Sign-off" | "Demo Content";
  name: string;
  status: "Pass" | "Warning" | "Blocker";
  message: string;
  affectedItemIds?: string[];
  resolutionPath: string;
}

export interface ExportJobRecord {
  id: string;
  jobId: string;
  timestamp: string;
  userEmail: string;
  manuscriptVersion: number;
  selectedOutletId?: string;
  selectedOutletTitle?: string;
  exportFormat: "DOCX" | "PDF" | "BibTeX" | "RIS" | "CSL JSON" | "JATS XML" | "LaTeX";
  exportMode: "Submission-Ready" | "Draft Review";
  isBlocked: boolean;
  gateChecksResults: GateCheckResult[];
  includedComponents: {
    titlePage: boolean;
    abstract: boolean;
    sections: boolean;
    figuresAndTables: boolean;
    bibliography: boolean;
    ethicsAndAiDisclosure: boolean;
    supplementarySelections: boolean;
  };
  fileSizeEstimate: string;
  status: "Success" | "Blocked" | "Error";
  errorMessage?: string;
}


export type NumericEvidenceSourceType = "DATASET" | "ANALYSIS_OUTPUT" | "RESEARCHER_PROTOCOL" | "VERIFIED_SOURCE" | "USER_CONFIRMED";

export interface NumericEvidence {
  id: string;
  value: number;
  normalizedValue: number;
  unit?: string;
  sourceType: NumericEvidenceSourceType;
  sourceId: string;
  datasetHash?: string;
  analysisRunId?: string;
  variableName?: string;
  evidencePassageId?: string;
  verificationState: "Verified" | "Unverified" | "Rejected";
  createdAt: string;
}

export interface ProjectState {
  id: string;
  isDemoProject: boolean;
  isArchived?: boolean;
  isDeleted?: boolean;
  ownerUid?: string;
  organizationId?: string;
  members?: Record<string, ProjectRole>;
  memberList?: ProjectMember[];
  version?: number;
  title: string;
  discipline: string;
  subdiscipline: string;
  projectType: ResearchProjectType;
  createdAt: string;
  updatedAt: string;
  userRole: UserRole | ProjectRole;
  termsAccepted: boolean;
  noticeAcceptedDate?: string;
  authors: Author[];
  canvas: ResearchCanvas;
  researchQuestions: ResearchQuestionItem[];
  searchStrategies: SearchStrategy[];
  sources: SourceRecord[];
  claims: ClaimItem[];
  gaps: ResearchGap[];
  reportingGuideline: ReportingGuideline;
  ethicsInfo: {
    approvalRequired: boolean;
    committeeName?: string;
    approvalNumber?: string;
    approvalDate?: string;
    consentObtained: boolean;
    trialRegistrationNumber?: string;
    notes?: string;
  };
  methodologyWorkspace?: MethodologyWorkspace;
  datasets: DatasetRecord[];
  analysisPlans: AnalysisPlan[];
  analysisOutputs: AnalysisOutput[];
  numericEvidenceRecords?: NumericEvidence[];
  figures: GeneratedFigure[];
  tables: GeneratedTable[];
  sections: ManuscriptSection[];
  activeCslStyle: CSLStyleOption["id"];
  selectedTargetOutlet?: TargetOutlet;
  complianceReport?: ComplianceReport;
  reviewerComments: ReviewerComment[];
  aiLedger: AiLedgerEvent[];
  aiLedgerIntegrity?: AiLedgerIntegrity;
  exportHistory?: ExportJobRecord[];
  pipelineStages: PipelineStage[];
  readinessScore: {
    overall: number; // 0 to 100
    questionClarity: number;
    literatureCoverage: number;
    evidenceVerification: number;
    methodCompleteness: number;
    dataQuality: number;
    reproducibility: number;
    citationAccuracy: number;
    compliance: number;
    integrityReview: number;
  };
}
