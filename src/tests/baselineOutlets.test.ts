import { describe, it, expect } from "vitest";
import {
  BASELINE_JOURNALS,
  BASELINE_CONFERENCES,
  createVerifiedStaticOutlet,
  createLiveRetrievedOutlet,
  createUserAddedOutlet,
  validateOutletIntegrity,
  isOutletVerified,
} from "../data/baselineOutlets";
import { TargetOutlet } from "../types";
import { calculateComplianceRules } from "../lib/complianceEngine";
import { createEmptyProject } from "../data/demoProject";

describe("TehqIQ Baseline Outlets & Zero Fabrication Policy", () => {
  it("1. Baseline catalog contains NO programmatically fabricated journal titles", () => {
    const allOutlets = [...BASELINE_JOURNALS, ...BASELINE_CONFERENCES];

    for (const outlet of allOutlets) {
      // Must not match any generated/fabricated journal pattern
      expect(outlet.title).not.toMatch(/International Journal of .* Research Vol/i);
      expect(outlet.publisherOrSociety).not.toMatch(/Academic Research Publishing Group \d+/i);
      expect(outlet.issnOrAcronym).not.toMatch(/IJ-[A-Z]+-\d+/i);
    }
  });

  it("2. Baseline catalog contains NO fake/placeholder URL domains", () => {
    const allOutlets = [...BASELINE_JOURNALS, ...BASELINE_CONFERENCES];

    for (const outlet of allOutlets) {
      expect(outlet.officialUrl).not.toContain("academic-journal-index.org");
      expect(outlet.officialUrl).not.toContain("example.com");
      // Must have a valid https:// URL
      expect(outlet.officialUrl.startsWith("https://")).toBe(true);
    }
  });

  it("3. Every outlet in BASELINE_JOURNALS has explicit verified provenance", () => {
    for (const journal of BASELINE_JOURNALS) {
      expect(journal.outletProvenanceType).toBe("VERIFIED_STATIC_SEED");
      expect(journal.verificationStatus).toBe("Verified");
      expect(journal.provenanceProvider).toBeDefined();
      expect(isOutletVerified(journal)).toBe(true);

      const integrity = validateOutletIntegrity(journal);
      expect(integrity.isValid).toBe(true);
      expect(integrity.isVerified).toBe(true);
      expect(integrity.issues).toEqual([]);
    }
  });

  it("4. Every outlet in BASELINE_CONFERENCES has explicit verified provenance", () => {
    for (const conf of BASELINE_CONFERENCES) {
      expect(conf.outletProvenanceType).toBe("VERIFIED_STATIC_SEED");
      expect(conf.verificationStatus).toBe("Verified");
      expect(isOutletVerified(conf)).toBe(true);

      const integrity = validateOutletIntegrity(conf);
      expect(integrity.isValid).toBe(true);
      expect(integrity.isVerified).toBe(true);
    }
  });

  it("5. Outlets do NOT automatically fabricate Q1 quartile or citeScore without real source data", () => {
    // Check that we don't blanket assume Q1 for every outlet
    let q1Count = 0;
    for (const journal of BASELINE_JOURNALS) {
      q1Count += (journal.metrics || []).filter((metric) => metric.quartile === "Q1").length;
    }
    // Baseline journals do not blindly fabricate JCR metrics on all 20+ outlets
    expect(q1Count).toBeLessThan(BASELINE_JOURNALS.length);
  });

  it("6. Static identity seeds do not auto-create requirements, claims, metrics, or indexing assertions", () => {
    for (const outlet of BASELINE_JOURNALS) {
      expect(outlet.identitySourceUrl).toBe(outlet.officialUrl);
      expect(outlet.identityRetrievedAt).toBe(outlet.lastVerifiedDate);
      expect(outlet.requirementsList).toEqual([]);
      expect(outlet.datedClaims).toEqual([]);
      expect(outlet.metrics || []).toEqual([]);
      expect(outlet.indexing).toEqual([]);
      expect(outlet.openAccessModel).toBe("Unverified");
      expect(outlet.citationStyle).toBe("Unverified");
    }
  });

  it("7. User-added outlets are strictly initialized as USER_ADDED_UNVERIFIED and cannot be verified without human confirmation", () => {
    const userOutlet = createUserAddedOutlet(
      {
        id: "user-1",
        title: "Custom Researcher Journal",
        officialUrl: "https://mycustomjournal.org",
        wordLimit: 5000,
        citationStyle: "APA 7th",
      },
      "researcher@university.edu"
    );

    expect(userOutlet.outletProvenanceType).toBe("USER_ADDED_UNVERIFIED");
    expect(userOutlet.verificationStatus).toBe("Unverified");
    expect(userOutlet.isUserAdded).toBe(true);

    // Requirements must have confidence "Low" and humanConfirmed: false
    const wordReq = userOutlet.requirementsList?.find((r) => r.field === "manuscriptWordLimit");
    expect(wordReq?.confidence).toBe("Low");
    expect(wordReq?.humanConfirmed).toBe(false);

    // validateOutletIntegrity must confirm it is not verified
    const integrity = validateOutletIntegrity(userOutlet);
    expect(integrity.isVerified).toBe(false);
    expect(isOutletVerified(userOutlet)).toBe(false);
  });

  it("8. Live retrieved records from external providers carry provider provenance", () => {
    const liveRecord = createLiveRetrievedOutlet(
      "OpenAlex",
      {
        id: "openalex-w123",
        title: "Journal of Open Science",
        officialUrl: "https://opensciencejournal.org",
        indexing: ["DOAJ", "Scopus"],
        wordLimit: 6000,
      },
      "https://api.openalex.org/sources/s123"
    );

    expect(liveRecord.outletProvenanceType).toBe("LIVE_RETRIEVED_RECORD");
    expect(liveRecord.provenanceProvider).toBe("OpenAlex");
    expect(liveRecord.verificationStatus).toBe("Verified");

    expect(liveRecord.identitySourceUrl).toBe("https://api.openalex.org/sources/s123");
    expect(liveRecord.requirementsList).toEqual([]);
    expect(liveRecord.wordLimit).toBeUndefined();
    expect(liveRecord.indexing).toEqual([]);
  });

  it("9. validateOutletIntegrity intercepts and flags fabricated journals", () => {
    const fakeOutlet: TargetOutlet = {
      id: "fake-1",
      title: "International Journal of Applied Computer Research Vol. 14",
      type: "Journal",
      issnOrAcronym: "IJ-ACR-9999",
      publisherOrSociety: "Academic Research Publishing Group 5",
      subjectCategory: "Computer Science",
      officialUrl: "https://academic-journal-index.org/ij-acr",
      indexing: ["Scopus", "Web of Science", "DOAJ"],
      openAccessModel: "Gold",
      citationStyle: "IEEE",
      lastVerifiedDate: "2026-08-01",
      aiPolicySummary: "No policy",
      outletProvenanceType: "VERIFIED_STATIC_SEED",
      verificationStatus: "Verified",
    };

    const integrity = validateOutletIntegrity(fakeOutlet);
    expect(integrity.isValid).toBe(false);
    expect(integrity.isVerified).toBe(false);
    expect(integrity.forbiddenPatternMatched).toBe(true);
    expect(integrity.issues.length).toBeGreaterThanOrEqual(3);
    expect(isOutletVerified(fakeOutlet)).toBe(false);
  });

  it("10. User added outlet cannot spoof verification status without failing integrity audit", () => {
    const spoofedOutlet: TargetOutlet = {
      id: "spoof-1",
      title: "Self-proclaimed High Impact Journal",
      type: "Journal",
      issnOrAcronym: "1234-5678",
      publisherOrSociety: "Independent Press",
      subjectCategory: "Medicine",
      officialUrl: "https://independentpress.org/journal",
      indexing: ["Scopus"],
      openAccessModel: "Hybrid",
      citationStyle: "Vancouver",
      lastVerifiedDate: "2026-08-01",
      aiPolicySummary: "Standard",
      outletProvenanceType: "USER_ADDED_UNVERIFIED",
      verificationStatus: "Verified", // Illegitimate spoof
    };

    const integrity = validateOutletIntegrity(spoofedOutlet);
    expect(integrity.isValid).toBe(false);
    expect(integrity.isVerified).toBe(false);
    expect(integrity.issues).toContain(
      "User-added outlet cannot be marked Verified without formal editorial verification."
    );
    expect(isOutletVerified(spoofedOutlet)).toBe(false);
  });

  it("11. The static factory cannot promote an arbitrary generated outlet to Verified", () => {
    const generated = createVerifiedStaticOutlet({
      id: "generated-1",
      title: "Plausible Looking Journal",
      type: "Journal",
      issnOrAcronym: "9999-9999",
      publisherOrSociety: "Plausible Publisher",
      subjectCategory: "General",
      officialUrl: "https://plausible.invalid/journal",
      indexing: ["Scopus"],
      openAccessModel: "Gold",
      citationStyle: "APA 7th",
      lastVerifiedDate: "2026-08-22",
      aiPolicySummary: "Claimed policy",
      metrics: [{ id: "fake-metric", provider: "Claimed Aggregator", providerKind: "THIRD_PARTY", metricName: "JCR Quartile", year: 2026, subjectCategory: "General", quartile: "Q1", sourceUrl: "https://plausible.invalid/metric", retrievedAt: "2026-08-22", verificationState: "Verified" }],
    });
    expect(generated.verificationStatus).toBe("Unverified");
    expect(generated.outletProvenanceType).toBe("USER_ADDED_UNVERIFIED");
    expect(generated.metrics?.every((metric) => metric.verificationState !== "Verified")).toBe(true);
    expect(isOutletVerified(generated)).toBe(false);
    const project = createEmptyProject();
    project.selectedTargetOutlet = generated;
    expect(calculateComplianceRules(project)).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "rule-outlet-unverified", status: "Fail" }),
    ]));
  });
});
