import {
  TargetOutlet,
  VersionedRequirementRecord,
  VersionedClaimRecord,
  OutletProvenanceType,
  OutletVerificationStatus,
} from "../types";
import { normalizeOutletMetricRecords, validateOutletMetricRecord } from "../lib/outletMetrics";
import { normalizeOutletRequirements } from "../lib/outletRequirements";

/**
 * Builds an identity-verified static seed. Requirement, metric, fee, indexing,
 * deadline, and formatting claims are deliberately discarded unless modeled
 * later as separately sourced records.
 */
export function createVerifiedStaticOutlet(
  data: Omit<TargetOutlet, "outletProvenanceType" | "verificationStatus"> & {
    provenanceProvider?: string;
  }
): TargetOutlet {
  const identityKey = `${data.id}|${data.title}|${data.officialUrl}|${data.issnOrAcronym}`;
  if (!VERIFIED_STATIC_IDENTITY_KEYS.has(identityKey)) {
    return createUserAddedOutlet(data, undefined);
  }
  const provenanceProvider = data.provenanceProvider?.trim() || "Official publisher or society outlet page";
  return {
    id: data.id,
    title: data.title,
    type: data.type,
    issnOrAcronym: data.issnOrAcronym,
    publisherOrSociety: data.publisherOrSociety,
    subjectCategory: data.subjectCategory,
    officialUrl: data.officialUrl,
    indexing: [],
    openAccessModel: "Unverified",
    citationStyle: "Unverified",
    lastVerifiedDate: data.lastVerifiedDate,
    aiPolicySummary: "Unverified",
    outletProvenanceType: "VERIFIED_STATIC_SEED",
    verificationStatus: "Verified",
    provenanceProvider,
    identitySourceUrl: data.officialUrl,
    identityRetrievedAt: data.lastVerifiedDate,
    requirementsList: normalizeOutletRequirements(data.requirementsList),
    datedClaims: [],
    metrics: normalizeOutletMetricRecords(data.metrics),
  };
}

/**
 * Creates a Live Retrieved Record from an external scholarly registry (e.g. Crossref, OpenAlex, DOAJ).
 */
export function createLiveRetrievedOutlet(
  provider: string,
  data: Partial<TargetOutlet> & { id: string; title: string; officialUrl: string },
  rawRecordUrl?: string
): TargetOutlet {
  const date = data.lastVerifiedDate || new Date().toISOString().split("T")[0];
  const sourceUrl = rawRecordUrl?.trim();
  const hasProviderProvenance = Boolean(provider.trim() && sourceUrl?.startsWith("https://"));

  return {
    id: data.id,
    title: data.title,
    type: data.type || "Journal",
    issnOrAcronym: data.issnOrAcronym || "Unverified ISSN",
    publisherOrSociety: data.publisherOrSociety || "Unknown Publisher",
    subjectCategory: data.subjectCategory || "General Scholarly Research",
    officialUrl: data.officialUrl,
    indexing: [],
    openAccessModel: "Unverified",
    citationStyle: "Unverified",
    lastVerifiedDate: date,
    aiPolicySummary: "Unverified",
    outletProvenanceType: "LIVE_RETRIEVED_RECORD",
    verificationStatus: hasProviderProvenance ? "Verified" : "Pending_Verification",
    provenanceProvider: provider,
    identitySourceUrl: sourceUrl,
    identityRetrievedAt: date,
    requirementsList: normalizeOutletRequirements(data.requirementsList),
    datedClaims: [],
    metrics: normalizeOutletMetricRecords(data.metrics),
  };
}

/**
 * Creates a User-Added outlet explicitly flagged as Unverified.
 * All requirements and claims require researcher confirmation before being treated as authoritative.
 */
export function createUserAddedOutlet(
  data: Partial<TargetOutlet> & { id: string; title: string },
  userEmail?: string
): TargetOutlet {
  const date = data.lastVerifiedDate || new Date().toISOString().split("T")[0];

  const requirementsList: Partial<VersionedRequirementRecord>[] = [];
  if (data.wordLimit !== undefined) {
    requirementsList.push({
      id: `${data.id}-req-word`,
      field: "manuscriptWordLimit",
      value: data.wordLimit,
      state: "Unverified",
      confidence: "Low",
      humanConfirmed: false,
      version: 1,
      history: [],
    });
  }

  if (data.citationStyle) {
    requirementsList.push({
      id: `${data.id}-req-citation`,
      field: "referenceStyle",
      value: data.citationStyle,
      state: "Unverified",
      confidence: "Low",
      humanConfirmed: false,
      version: 1,
      history: [],
    });
  }

  return {
    id: data.id,
    title: data.title,
    type: data.type || "Journal",
    issnOrAcronym: data.issnOrAcronym || "Unverified / Custom",
    publisherOrSociety: data.publisherOrSociety || "Researcher-specified Publisher",
    subjectCategory: data.subjectCategory || "Multidisciplinary",
    officialUrl: data.officialUrl || "",
    indexing: data.indexing || [],
    openAccessModel: data.openAccessModel || "Subscription",
    citationStyle: data.citationStyle || "APA 7th",
    lastVerifiedDate: date,
    aiPolicySummary: data.aiPolicySummary || "Researcher input required: verify publisher AI declaration rules.",
    outletProvenanceType: "USER_ADDED_UNVERIFIED",
    verificationStatus: "Unverified",
    provenanceProvider: "User Added (Unverified)",
    isUserAdded: true,
    wordLimit: data.wordLimit,
    abstractWordLimit: data.abstractWordLimit,
    figureTableLimit: data.figureTableLimit,
    apcFee: data.apcFee,
    acceptanceRateEstimate: data.acceptanceRateEstimate,
    reviewTimeWeeks: data.reviewTimeWeeks,
    submissionDeadline: data.submissionDeadline,
    requirementsList: normalizeOutletRequirements(data.requirementsList || requirementsList, true),
    metrics: normalizeOutletMetricRecords(data.metrics, true),
    datedClaims: (data.datedClaims || []).map((claim) => ({ ...claim, humanConfirmed: false })),
    dueDiligenceCheck: data.dueDiligenceCheck || {
      editorialBoardTransparent: false,
      peerReviewClear: false,
      feesDisclosed: false,
      isLegitimateConcern: true,
      notes: "Custom user-entered outlet requires manual due diligence verification.",
    },
  };
}

/**
 * Validates the authenticity and integrity of a TargetOutlet record.
 * Rejects fabricated titles, fake domains, and unverified assumptions.
 */
export function validateOutletIntegrity(outlet: TargetOutlet): {
  isValid: boolean;
  isVerified: boolean;
  issues: string[];
  forbiddenPatternMatched?: boolean;
} {
  const issues: string[] = [];

  // 1. Detect fabricated naming patterns (e.g. "International Journal of ... Research Vol...")
  const fabricatedPattern = /International Journal of .* Research Vol/i;
  const genericFakePublisherPattern = /Academic Research Publishing Group \d+/i;
  const fakeIssnPattern = /IJ-[A-Z]+-\d+/i;

  if (fabricatedPattern.test(outlet.title)) {
    issues.push(`Fabricated journal title detected: "${outlet.title}"`);
  }
  if (genericFakePublisherPattern.test(outlet.publisherOrSociety)) {
    issues.push(`Fabricated publisher detected: "${outlet.publisherOrSociety}"`);
  }
  if (fakeIssnPattern.test(outlet.issnOrAcronym)) {
    issues.push(`Fabricated ISSN pattern detected: "${outlet.issnOrAcronym}"`);
  }

  // 2. Detect fabricated domains
  if (outlet.officialUrl && outlet.officialUrl.includes("academic-journal-index.org")) {
    issues.push(`Fabricated placeholder domain detected: "${outlet.officialUrl}"`);
  }

  // 3. Provenance validation
  if (!outlet.outletProvenanceType) {
    issues.push("Missing outletProvenanceType declaration.");
  }
  if (!outlet.verificationStatus) {
    issues.push("Missing verificationStatus declaration.");
  }

  if (outlet.verificationStatus === "Verified") {
    if (!outlet.provenanceProvider?.trim() || !outlet.identitySourceUrl?.startsWith("https://") || !outlet.identityRetrievedAt?.trim()) {
      issues.push("Verified outlet identity requires provider, HTTPS source URL, and retrieval date provenance.");
    }
    if (outlet.outletProvenanceType === "LIVE_RETRIEVED_RECORD" && outlet.identitySourceUrl === outlet.officialUrl) {
      issues.push("Live retrieved identity must cite the provider raw-record URL, not only the outlet homepage.");
    }
  }

  // 4. Provenance vs. verification alignment
  if (outlet.outletProvenanceType === "USER_ADDED_UNVERIFIED" && outlet.verificationStatus === "Verified") {
    issues.push("User-added outlet cannot be marked Verified without formal editorial verification.");
  }

  for (const metric of Array.isArray(outlet.metrics) ? outlet.metrics : []) {
    const metricValidation = validateOutletMetricRecord(metric);
    if (metric.verificationState === "Verified" && !metricValidation.valid) {
      issues.push(...metricValidation.issues.map((issue) => `Verified metric ${metric.id}: ${issue}`));
    }
  }

  const forbiddenPatternMatched = issues.length > 0;
  const isVerified =
    issues.length === 0 &&
    outlet.verificationStatus === "Verified" &&
    (outlet.outletProvenanceType === "VERIFIED_STATIC_SEED" || outlet.outletProvenanceType === "LIVE_RETRIEVED_RECORD");

  return {
    isValid: issues.length === 0,
    isVerified,
    issues,
    forbiddenPatternMatched,
  };
}

/**
 * Returns true if an outlet is verified and adheres to strict integrity rules.
 */
export function isOutletVerified(outlet: TargetOutlet): boolean {
  const result = validateOutletIntegrity(outlet);
  return result.isVerified;
}

/**
 * Static outlet identities. The factory exposes only identity fields backed by
 * the recorded official publisher/society page; other raw legacy fields are ignored.
 */
const VERIFIED_STATIC_JOURNALS_DATA: (Omit<TargetOutlet, "outletProvenanceType" | "verificationStatus"> & {
  provenanceProvider?: string;
})[] = [
  // Medicine & Clinical Sciences
  {
    id: "j-med-1",
    title: "The New England Journal of Medicine",
    type: "Journal",
    issnOrAcronym: "NEJM / 0028-4793",
    publisherOrSociety: "Massachusetts Medical Society",
    subjectCategory: "Medicine (General & Internal)",
    officialUrl: "https://www.nejm.org",
    indexing: ["MEDLINE", "PubMed", "Scopus", "Web of Science"],
    openAccessModel: "Hybrid",
    wordLimit: 3000,
    abstractWordLimit: 250,
    citationStyle: "Vancouver",
    figureTableLimit: 5,
    lastVerifiedDate: "2026-07-01",
    aiPolicySummary: "AI tools cannot be listed as authors. AI usage for drafting or data analysis must be disclosed in Methods/Acknowledgements.",
    pageMargins: "1.0 in (2.54 cm)",
    columnLayout: "single",
    fontFamily: "Times New Roman",
    fontSizePt: 12,
    lineSpacing: 1.5,
    headingFormat: "Numbered Section",
    referenceOrdering: "order_of_appearance",
    inTextCitationType: "parenthetical_numeric",
  },
  {
    id: "j-med-2",
    title: "The Lancet",
    type: "Journal",
    issnOrAcronym: "Lancet / 0140-6736",
    publisherOrSociety: "Elsevier",
    subjectCategory: "Medicine (General)",
    officialUrl: "https://www.thelancet.com",
    indexing: ["MEDLINE", "PubMed", "Scopus", "Web of Science"],
    openAccessModel: "Hybrid",
    wordLimit: 4500,
    abstractWordLimit: 300,
    citationStyle: "Vancouver",
    figureTableLimit: 6,
    lastVerifiedDate: "2026-07-01",
    aiPolicySummary: "Authors must disclose AI involvement. Generative AI tools must not be cited as primary sources.",
    pageMargins: "1.0 in (2.54 cm)",
    columnLayout: "single",
    fontFamily: "Arial",
    fontSizePt: 11,
    lineSpacing: 1.5,
    headingFormat: "Numbered Section",
    referenceOrdering: "order_of_appearance",
    inTextCitationType: "parenthetical_numeric",
  },
  {
    id: "j-med-3",
    title: "JAMA - Journal of the American Medical Association",
    type: "Journal",
    issnOrAcronym: "JAMA / 0098-7484",
    publisherOrSociety: "American Medical Association",
    subjectCategory: "Medicine (General)",
    officialUrl: "https://jamanetwork.com/journals/jama",
    indexing: ["MEDLINE", "PubMed", "Scopus", "Web of Science"],
    openAccessModel: "Hybrid",
    wordLimit: 3000,
    abstractWordLimit: 350,
    citationStyle: "AMA",
    figureTableLimit: 5,
    lastVerifiedDate: "2026-06-15",
    aiPolicySummary: "AI usage must be described in the Acknowledgment section with prompt details if used for data synthesis.",
    pageMargins: "1.0 in (2.54 cm)",
    columnLayout: "single",
    fontFamily: "Times New Roman",
    fontSizePt: 12,
    lineSpacing: 2.0,
    headingFormat: "Numbered Section",
    referenceOrdering: "order_of_appearance",
    inTextCitationType: "superscript",
  },
  {
    id: "j-med-4",
    title: "BMJ - British Medical Journal",
    type: "Journal",
    issnOrAcronym: "BMJ / 0959-8138",
    publisherOrSociety: "BMJ Publishing Group",
    subjectCategory: "Medicine (General)",
    officialUrl: "https://www.bmj.com",
    indexing: ["MEDLINE", "PubMed", "Scopus", "DOAJ"],
    openAccessModel: "Hybrid",
    wordLimit: 4000,
    abstractWordLimit: 250,
    citationStyle: "Vancouver",
    figureTableLimit: 5,
    lastVerifiedDate: "2026-06-20",
    aiPolicySummary: "Full transparency required. Authors bear total accountability for AI-generated text or data.",
    pageMargins: "1.0 in (2.54 cm)",
    columnLayout: "single",
    fontFamily: "Times New Roman",
    fontSizePt: 12,
    lineSpacing: 1.5,
    headingFormat: "Numbered Section",
    referenceOrdering: "order_of_appearance",
    inTextCitationType: "parenthetical_numeric",
  },
  {
    id: "j-med-5",
    title: "Journal of Applied Biomechanics",
    type: "Journal",
    issnOrAcronym: "JAB / 1065-8483",
    publisherOrSociety: "Human Kinetics Publishers",
    subjectCategory: "Sports Medicine & Biomechanics",
    officialUrl: "https://journals.humankinetics.com/view/journals/jab/jab-overview.xml",
    indexing: ["PubMed", "Scopus", "Web of Science"],
    openAccessModel: "Hybrid",
    wordLimit: 4000,
    abstractWordLimit: 250,
    citationStyle: "APA 7th",
    figureTableLimit: 6,
    lastVerifiedDate: "2026-07-15",
    aiPolicySummary: "AI usage allowed for language polishing and drafting assist; AI must be declared in Acknowledgements / Disclosure ledger.",
    pageMargins: "1.0 in (2.54 cm)",
    columnLayout: "single",
    fontFamily: "Times New Roman",
    fontSizePt: 12,
    lineSpacing: 2.0,
    headingFormat: "APA Title Case",
    referenceOrdering: "alphabetical",
    inTextCitationType: "author_date",
  },
  {
    id: "j-med-6",
    title: "American Journal of Sports Medicine",
    type: "Journal",
    issnOrAcronym: "AJSM / 0363-5465",
    publisherOrSociety: "SAGE Publications",
    subjectCategory: "Orthopedics & Sports Medicine",
    officialUrl: "https://journals.sagepub.com/home/ajs",
    indexing: ["MEDLINE", "PubMed", "Scopus"],
    openAccessModel: "Hybrid",
    wordLimit: 5000,
    abstractWordLimit: 300,
    citationStyle: "AMA",
    figureTableLimit: 8,
    lastVerifiedDate: "2026-06-10",
    aiPolicySummary: "AI assistance must be acknowledged in submission cover letter and disclosures.",
    pageMargins: "1.0 in (2.54 cm)",
    columnLayout: "single",
    fontFamily: "Times New Roman",
    fontSizePt: 12,
    lineSpacing: 2.0,
    headingFormat: "Numbered Section",
    referenceOrdering: "order_of_appearance",
    inTextCitationType: "superscript",
  },
  {
    id: "j-med-7",
    title: "PLOS Medicine",
    type: "Journal",
    issnOrAcronym: "PLOS Med / 1549-1676",
    publisherOrSociety: "Public Library of Science",
    subjectCategory: "Medicine (General & Global Health)",
    officialUrl: "https://journals.plos.org/plosmedicine/",
    indexing: ["PubMed", "DOAJ", "Scopus", "Web of Science"],
    openAccessModel: "Gold",
    abstractWordLimit: 300,
    citationStyle: "Vancouver",
    figureTableLimit: 8,
    lastVerifiedDate: "2026-07-01",
    aiPolicySummary: "Authors must declare all generative AI tools used in manuscript preparation. Data availability statement mandatory.",
    pageMargins: "1.0 in (2.54 cm)",
    columnLayout: "single",
    fontFamily: "Arial",
    fontSizePt: 11,
    lineSpacing: 1.5,
    headingFormat: "Numbered Section",
    referenceOrdering: "order_of_appearance",
    inTextCitationType: "parenthetical_numeric",
  },

  // Multidisciplinary Science
  {
    id: "j-nat-1",
    title: "Nature",
    type: "Journal",
    issnOrAcronym: "Nature / 0028-0836",
    publisherOrSociety: "Nature Portfolio",
    subjectCategory: "Multidisciplinary Science",
    officialUrl: "https://www.nature.com/nature",
    indexing: ["PubMed", "Scopus", "Web of Science"],
    openAccessModel: "Hybrid",
    wordLimit: 4500,
    abstractWordLimit: 150,
    citationStyle: "Nature",
    figureTableLimit: 6,
    lastVerifiedDate: "2026-07-05",
    aiPolicySummary: "AI disclosure statement required in Methods. Raw data files must be deposited in recognized public repositories.",
    pageMargins: "1.0 in (2.54 cm)",
    columnLayout: "single",
    fontFamily: "Times New Roman",
    fontSizePt: 12,
    lineSpacing: 1.5,
    headingFormat: "Nature Bold Numbered",
    referenceOrdering: "order_of_appearance",
    inTextCitationType: "superscript",
  },
  {
    id: "j-sci-1",
    title: "Science",
    type: "Journal",
    issnOrAcronym: "Science / 0036-8075",
    publisherOrSociety: "AAAS",
    subjectCategory: "Multidisciplinary Science",
    officialUrl: "https://www.science.org/journal/science",
    indexing: ["PubMed", "Scopus", "Web of Science"],
    openAccessModel: "Hybrid",
    wordLimit: 4500,
    abstractWordLimit: 125,
    citationStyle: "Nature",
    figureTableLimit: 4,
    lastVerifiedDate: "2026-07-05",
    aiPolicySummary: "Full data transparency required. Generative AI text forbidden in primary text without editor authorization.",
    pageMargins: "1.0 in (2.54 cm)",
    columnLayout: "single",
    fontFamily: "Times New Roman",
    fontSizePt: 12,
    lineSpacing: 2.0,
    headingFormat: "Numbered Section",
    referenceOrdering: "order_of_appearance",
    inTextCitationType: "superscript",
  },
  {
    id: "j-plos-1",
    title: "PLOS ONE",
    type: "Journal",
    issnOrAcronym: "PLOS ONE / 1932-6203",
    publisherOrSociety: "Public Library of Science",
    subjectCategory: "Multidisciplinary Medicine & Science",
    officialUrl: "https://journals.plos.org/plosone/",
    indexing: ["PubMed", "DOAJ", "Scopus", "Web of Science"],
    openAccessModel: "Gold",
    abstractWordLimit: 300,
    citationStyle: "PLOS ONE",
    figureTableLimit: 10,
    lastVerifiedDate: "2026-07-01",
    aiPolicySummary: "Requires declaration of generative AI tools in Methods or Acknowledgments. Data availability statement mandatory.",
    pageMargins: "1.0 in (2.54 cm)",
    columnLayout: "single",
    fontFamily: "Arial",
    fontSizePt: 11,
    lineSpacing: 1.5,
    headingFormat: "Numbered Section",
    referenceOrdering: "order_of_appearance",
    inTextCitationType: "numeric_bracket",
  },
  {
    id: "j-pnas-1",
    title: "Proceedings of the National Academy of Sciences (PNAS)",
    type: "Journal",
    issnOrAcronym: "PNAS / 0027-8424",
    publisherOrSociety: "National Academy of Sciences",
    subjectCategory: "Multidisciplinary Science",
    officialUrl: "https://www.pnas.org",
    indexing: ["PubMed", "Scopus", "Web of Science"],
    openAccessModel: "Hybrid",
    wordLimit: 4500,
    abstractWordLimit: 250,
    citationStyle: "Vancouver",
    figureTableLimit: 6,
    lastVerifiedDate: "2026-06-25",
    aiPolicySummary: "Authors must describe any generative AI usage in the Acknowledgments. Raw data and code required.",
    pageMargins: "1.0 in (2.54 cm)",
    columnLayout: "single",
    fontFamily: "Times New Roman",
    fontSizePt: 11,
    lineSpacing: 1.5,
    headingFormat: "Numbered Section",
    referenceOrdering: "order_of_appearance",
    inTextCitationType: "parenthetical_numeric",
  },

  // Computer Science & Artificial Intelligence
  {
    id: "j-cs-1",
    title: "IEEE Transactions on Pattern Analysis and Machine Intelligence",
    type: "Journal",
    issnOrAcronym: "TPAMI / 0162-8828",
    publisherOrSociety: "IEEE Computer Society",
    subjectCategory: "Computer Science & AI",
    officialUrl: "https://www.computer.org/csdl/journal/tp",
    indexing: ["IEEE Xplore", "Scopus", "Web of Science"],
    openAccessModel: "Hybrid",
    wordLimit: 12000,
    abstractWordLimit: 200,
    citationStyle: "IEEE",
    figureTableLimit: 12,
    lastVerifiedDate: "2026-06-01",
    aiPolicySummary: "IEEE guidelines apply: AI tools cannot be co-authors. Code and dataset repositories must be provided.",
    pageMargins: "0.75 in (1.91 cm)",
    columnLayout: "double",
    fontFamily: "Times New Roman",
    fontSizePt: 10,
    lineSpacing: 1.15,
    headingFormat: "IEEE Roman",
    referenceOrdering: "order_of_appearance",
    inTextCitationType: "numeric_bracket",
  },
  {
    id: "j-cs-2",
    title: "Journal of Machine Learning Research",
    type: "Journal",
    issnOrAcronym: "JMLR / 1532-4435",
    publisherOrSociety: "Microtome Publishing",
    subjectCategory: "Computer Science & Artificial Intelligence",
    officialUrl: "https://www.jmlr.org",
    indexing: ["DOAJ", "Scopus", "Web of Science"],
    openAccessModel: "Gold",
    wordLimit: 15000,
    abstractWordLimit: 250,
    citationStyle: "APA 7th",
    figureTableLimit: 15,
    lastVerifiedDate: "2026-05-20",
    aiPolicySummary: "Open-access diamond model. Reproducible code and complete mathematical proofs required.",
    pageMargins: "1.0 in (2.54 cm)",
    columnLayout: "single",
    fontFamily: "Times New Roman",
    fontSizePt: 11,
    lineSpacing: 1.5,
    headingFormat: "Numbered Section",
    referenceOrdering: "alphabetical",
    inTextCitationType: "author_date",
  },
  {
    id: "j-cs-3",
    title: "ACM Transactions on Computer Systems",
    type: "Journal",
    issnOrAcronym: "TOCS / 0734-2071",
    publisherOrSociety: "Association for Computing Machinery",
    subjectCategory: "Computer Systems & Architecture",
    officialUrl: "https://dl.acm.org/journal/tocs",
    indexing: ["ACM Digital Library", "Scopus", "Web of Science"],
    openAccessModel: "Hybrid",
    wordLimit: 15000,
    abstractWordLimit: 250,
    citationStyle: "IEEE",
    figureTableLimit: 15,
    lastVerifiedDate: "2026-06-15",
    aiPolicySummary: "ACM Policy on AI in Publishing applies: Generative AI tools must be cited and disclosed in the Acknowledgements.",
    pageMargins: "1.0 in (2.54 cm)",
    columnLayout: "single",
    fontFamily: "Times New Roman",
    fontSizePt: 11,
    lineSpacing: 1.5,
    headingFormat: "Numbered Section",
    referenceOrdering: "order_of_appearance",
    inTextCitationType: "numeric_bracket",
  },
  {
    id: "j-cs-4",
    title: "Artificial Intelligence (Elsevier)",
    type: "Journal",
    issnOrAcronym: "AIJ / 0004-3702",
    publisherOrSociety: "Elsevier",
    subjectCategory: "Artificial Intelligence",
    officialUrl: "https://www.sciencedirect.com/journal/artificial-intelligence",
    indexing: ["Scopus", "Web of Science"],
    openAccessModel: "Hybrid",
    wordLimit: 12000,
    abstractWordLimit: 250,
    citationStyle: "APA 7th",
    figureTableLimit: 12,
    lastVerifiedDate: "2026-06-10",
    aiPolicySummary: "Authors must disclose the use of AI tools in manuscript preparation. AI tools cannot be listed as authors.",
    pageMargins: "1.0 in (2.54 cm)",
    columnLayout: "single",
    fontFamily: "Times New Roman",
    fontSizePt: 11,
    lineSpacing: 1.5,
    headingFormat: "Numbered Section",
    referenceOrdering: "alphabetical",
    inTextCitationType: "author_date",
  },

  // Social Sciences, Education & Psychology
  {
    id: "j-soc-1",
    title: "Journal of Educational Psychology",
    type: "Journal",
    issnOrAcronym: "J Educ Psychol / 0022-0663",
    publisherOrSociety: "American Psychological Association",
    subjectCategory: "Social Sciences & Education",
    officialUrl: "https://www.apa.org/pubs/journals/edu",
    indexing: ["PsycINFO", "Scopus", "Web of Science"],
    openAccessModel: "Hybrid",
    wordLimit: 10000,
    abstractWordLimit: 250,
    citationStyle: "APA 7th",
    figureTableLimit: 8,
    lastVerifiedDate: "2026-06-18",
    aiPolicySummary: "APA 7th ethics standards apply. Open data and preregistration disclosure recommended.",
    pageMargins: "1.0 in (2.54 cm)",
    columnLayout: "single",
    fontFamily: "Times New Roman",
    fontSizePt: 12,
    lineSpacing: 2.0,
    headingFormat: "APA Title Case",
    referenceOrdering: "alphabetical",
    inTextCitationType: "author_date",
  },
  {
    id: "j-soc-2",
    title: "Psychological Science",
    type: "Journal",
    issnOrAcronym: "Psychol Sci / 0956-7976",
    publisherOrSociety: "SAGE Publications / Association for Psychological Science",
    subjectCategory: "Psychology & Behavioral Sciences",
    officialUrl: "https://journals.sagepub.com/home/pss",
    indexing: ["PubMed", "PsycINFO", "Scopus", "Web of Science"],
    openAccessModel: "Hybrid",
    wordLimit: 4000,
    abstractWordLimit: 200,
    citationStyle: "APA 7th",
    figureTableLimit: 4,
    lastVerifiedDate: "2026-06-22",
    aiPolicySummary: "Open science badges available. AI assistance disclosure required in Methods or Declarations.",
    pageMargins: "1.0 in (2.54 cm)",
    columnLayout: "single",
    fontFamily: "Times New Roman",
    fontSizePt: 12,
    lineSpacing: 2.0,
    headingFormat: "APA Title Case",
    referenceOrdering: "alphabetical",
    inTextCitationType: "author_date",
  },
  {
    id: "j-soc-3",
    title: "American Sociological Review",
    type: "Journal",
    issnOrAcronym: "ASR / 0003-1224",
    publisherOrSociety: "SAGE Publications / American Sociological Association",
    subjectCategory: "Sociology & Social Sciences",
    officialUrl: "https://journals.sagepub.com/home/asr",
    indexing: ["Scopus", "Web of Science"],
    openAccessModel: "Hybrid",
    wordLimit: 12000,
    abstractWordLimit: 200,
    citationStyle: "Chicago",
    figureTableLimit: 8,
    lastVerifiedDate: "2026-06-15",
    aiPolicySummary: "Authors are responsible for the factual integrity of text and citations. AI drafting must be disclosed.",
    pageMargins: "1.0 in (2.54 cm)",
    columnLayout: "single",
    fontFamily: "Georgia",
    fontSizePt: 12,
    lineSpacing: 2.0,
    headingFormat: "Numbered Section",
    referenceOrdering: "alphabetical",
    inTextCitationType: "author_date",
  },

  // Physical & Environmental Sciences
  {
    id: "j-env-1",
    title: "Environmental Science & Technology",
    type: "Journal",
    issnOrAcronym: "ES&T / 0013-936X",
    publisherOrSociety: "American Chemical Society",
    subjectCategory: "Environmental Science & Engineering",
    officialUrl: "https://pubs.acs.org/journal/esthag",
    indexing: ["CAS", "PubMed", "Scopus", "Web of Science"],
    openAccessModel: "Hybrid",
    wordLimit: 7000,
    abstractWordLimit: 200,
    citationStyle: "ACS",
    figureTableLimit: 8,
    lastVerifiedDate: "2026-07-10",
    aiPolicySummary: "ACS AI policy requires explicit disclosure of generative tools in the Acknowledgments section.",
    pageMargins: "1.0 in (2.54 cm)",
    columnLayout: "single",
    fontFamily: "Times New Roman",
    fontSizePt: 12,
    lineSpacing: 1.5,
    headingFormat: "Numbered Section",
    referenceOrdering: "order_of_appearance",
    inTextCitationType: "superscript",
  },
  {
    id: "j-phy-1",
    title: "Physical Review Letters",
    type: "Journal",
    issnOrAcronym: "PRL / 0031-9007",
    publisherOrSociety: "American Physical Society",
    subjectCategory: "Physics (General & Interdisciplinary)",
    officialUrl: "https://journals.aps.org/prl/",
    indexing: ["Scopus", "Web of Science", "CAS"],
    openAccessModel: "Hybrid",
    wordLimit: 3750,
    abstractWordLimit: 150,
    citationStyle: "IEEE",
    figureTableLimit: 4,
    lastVerifiedDate: "2026-06-28",
    aiPolicySummary: "APS guidelines apply. Generative AI tools cannot be listed as authors.",
    pageMargins: "0.75 in (1.91 cm)",
    columnLayout: "double",
    fontFamily: "Times New Roman",
    fontSizePt: 10,
    lineSpacing: 1.15,
    headingFormat: "Numbered Section",
    referenceOrdering: "order_of_appearance",
    inTextCitationType: "numeric_bracket",
  },
  {
    id: "j-chem-1",
    title: "Journal of the American Chemical Society",
    type: "Journal",
    issnOrAcronym: "JACS / 0002-7863",
    publisherOrSociety: "American Chemical Society",
    subjectCategory: "Chemistry (General)",
    officialUrl: "https://pubs.acs.org/journal/jacsat",
    indexing: ["CAS", "PubMed", "Scopus", "Web of Science"],
    openAccessModel: "Hybrid",
    wordLimit: 6000,
    abstractWordLimit: 250,
    citationStyle: "ACS",
    figureTableLimit: 6,
    lastVerifiedDate: "2026-07-02",
    aiPolicySummary: "ACS author guidelines: AI tools must be declared in Acknowledgments. Primary data must be independently verified.",
    pageMargins: "1.0 in (2.54 cm)",
    columnLayout: "single",
    fontFamily: "Times New Roman",
    fontSizePt: 12,
    lineSpacing: 1.5,
    headingFormat: "Numbered Section",
    referenceOrdering: "order_of_appearance",
    inTextCitationType: "superscript",
  },
];

/**
 * Authentic, manually verified static baseline conference catalogue.
 */
const VERIFIED_STATIC_CONFERENCES_DATA: (Omit<TargetOutlet, "outletProvenanceType" | "verificationStatus"> & {
  provenanceProvider?: string;
})[] = [
  {
    id: "c-cs-1",
    title: "NeurIPS - Conference on Neural Information Processing Systems",
    type: "Conference",
    issnOrAcronym: "NeurIPS 2026",
    publisherOrSociety: "Neural Information Processing Systems Foundation",
    subjectCategory: "Computer Science & Machine Learning",
    officialUrl: "https://neurips.cc",
    indexing: ["DBLP", "Google Scholar", "Scopus"],
    openAccessModel: "Gold",
    wordLimit: 9000,
    abstractWordLimit: 300,
    citationStyle: "APA 7th",
    figureTableLimit: 10,
    lastVerifiedDate: "2026-07-01",
    aiPolicySummary: "AI tools permitted for writing assist; AI generated code must be disclosed. Double-blind submission.",
    pageMargins: "1.0 in (2.54 cm)",
    columnLayout: "single",
    fontFamily: "Times New Roman",
    fontSizePt: 10,
    lineSpacing: 1.15,
    headingFormat: "Numbered Section",
    referenceOrdering: "alphabetical",
    inTextCitationType: "author_date",
  },
  {
    id: "c-cs-2",
    title: "ICML - International Conference on Machine Learning",
    type: "Conference",
    issnOrAcronym: "ICML 2026",
    publisherOrSociety: "International Machine Learning Society",
    subjectCategory: "Computer Science & Artificial Intelligence",
    officialUrl: "https://icml.cc",
    indexing: ["DBLP", "Scopus", "Google Scholar"],
    openAccessModel: "Gold",
    wordLimit: 8000,
    abstractWordLimit: 250,
    citationStyle: "APA 7th",
    figureTableLimit: 10,
    lastVerifiedDate: "2026-06-25",
    aiPolicySummary: "Strict double-blind review. Mandatory Reproducibility Checklist required.",
    pageMargins: "1.0 in (2.54 cm)",
    columnLayout: "single",
    fontFamily: "Times New Roman",
    fontSizePt: 10,
    lineSpacing: 1.15,
    headingFormat: "Numbered Section",
    referenceOrdering: "alphabetical",
    inTextCitationType: "author_date",
  },
  {
    id: "c-cs-3",
    title: "CVPR - IEEE/CVF Conference on Computer Vision and Pattern Recognition",
    type: "Conference",
    issnOrAcronym: "CVPR 2026",
    publisherOrSociety: "IEEE / Computer Vision Foundation",
    subjectCategory: "Computer Vision & AI",
    officialUrl: "https://cvpr.thecvf.com",
    indexing: ["IEEE Xplore", "DBLP", "Scopus"],
    openAccessModel: "Gold",
    wordLimit: 8000,
    abstractWordLimit: 200,
    citationStyle: "IEEE",
    figureTableLimit: 10,
    lastVerifiedDate: "2026-06-25",
    aiPolicySummary: "IEEE guidelines apply. IEEE double-column 8 page paper limit plus references.",
    pageMargins: "0.75 in (1.91 cm)",
    columnLayout: "double",
    fontFamily: "Times New Roman",
    fontSizePt: 10,
    lineSpacing: 1.15,
    headingFormat: "IEEE Roman",
    referenceOrdering: "order_of_appearance",
    inTextCitationType: "numeric_bracket",
  },
  {
    id: "c-cs-4",
    title: "ACL - Annual Meeting of the Association for Computational Linguistics",
    type: "Conference",
    issnOrAcronym: "ACL 2026",
    publisherOrSociety: "Association for Computational Linguistics",
    subjectCategory: "Natural Language Processing & Computational Linguistics",
    officialUrl: "https://www.aclweb.org",
    indexing: ["ACL Anthology", "DBLP", "Scopus"],
    openAccessModel: "Gold",
    wordLimit: 8500,
    abstractWordLimit: 250,
    citationStyle: "APA 7th",
    figureTableLimit: 8,
    lastVerifiedDate: "2026-06-20",
    aiPolicySummary: "ACL AI writing assistance policy: Use of LLMs for rewriting, grammar check, or brainstorming is permitted with explicit disclosure.",
    pageMargins: "1.0 in (2.54 cm)",
    columnLayout: "single",
    fontFamily: "Times New Roman",
    fontSizePt: 11,
    lineSpacing: 1.15,
    headingFormat: "Numbered Section",
    referenceOrdering: "alphabetical",
    inTextCitationType: "author_date",
  },
  {
    id: "c-cs-5",
    title: "KDD - ACM SIGKDD Conference on Knowledge Discovery and Data Mining",
    type: "Conference",
    issnOrAcronym: "KDD 2026",
    publisherOrSociety: "Association for Computing Machinery",
    subjectCategory: "Data Mining & Machine Learning",
    officialUrl: "https://kdd.org",
    indexing: ["ACM Digital Library", "DBLP", "Scopus"],
    openAccessModel: "Gold",
    wordLimit: 8000,
    abstractWordLimit: 250,
    citationStyle: "IEEE",
    figureTableLimit: 8,
    lastVerifiedDate: "2026-06-15",
    aiPolicySummary: "ACM Policy on generative AI tools applies. Full disclosure required in submission metadata.",
    pageMargins: "0.75 in (1.91 cm)",
    columnLayout: "double",
    fontFamily: "Times New Roman",
    fontSizePt: 10,
    lineSpacing: 1.15,
    headingFormat: "IEEE Roman",
    referenceOrdering: "order_of_appearance",
    inTextCitationType: "numeric_bracket",
  },
];

const VERIFIED_STATIC_IDENTITY_KEYS = new Set(
  [...VERIFIED_STATIC_JOURNALS_DATA, ...VERIFIED_STATIC_CONFERENCES_DATA]
    .map((data) => `${data.id}|${data.title}|${data.officialUrl}|${data.issnOrAcronym}`)
);

/** Identity-verified static catalogue. Unsourced requirements and claims are intentionally absent. */
export const BASELINE_JOURNALS: TargetOutlet[] = VERIFIED_STATIC_JOURNALS_DATA.map(createVerifiedStaticOutlet);

export const BASELINE_CONFERENCES: TargetOutlet[] = VERIFIED_STATIC_CONFERENCES_DATA.map(createVerifiedStaticOutlet);

/**
 * Backward-compatible helper for mapping journal citationStyle string to internal CSL ID
 */
export function mapJournalStyleToCslId(styleStr: string): string {
  if (!styleStr) return "apa";
  const lower = styleStr.toLowerCase();
  if (lower.includes("ieee")) return "ieee";
  if (lower.includes("nature") || lower.includes("science")) return "nature";
  if (lower.includes("vancouver") || lower.includes("nejm") || lower.includes("lancet") || lower.includes("bmj")) return "vancouver";
  if (lower.includes("ama") || lower.includes("jama")) return "ama";
  if (lower.includes("acs")) return "acs";
  if (lower.includes("plos")) return "plos";
  if (lower.includes("springer")) return "springer";
  if (lower.includes("elsevier")) return "elsevier";
  if (lower.includes("chicago")) return "chicago";
  if (lower.includes("harvard")) return "harvard";
  if (lower.includes("mla")) return "mla";
  if (lower.includes("cell")) return "cell";
  return "apa";
}
