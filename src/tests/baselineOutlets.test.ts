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
      if (journal.metrics?.jcrQuartile?.quartile === "Q1") {
        q1Count++;
        // If JCR is declared, it MUST have the official Clarivate source URL
        expect(journal.metrics.jcrQuartile.officialSourceUrl).toContain("clarivate.com");
      }
    }
    // Baseline journals do not blindly fabricate JCR metrics on all 20+ outlets
    expect(q1Count).toBeLessThan(BASELINE_JOURNALS.length);
  });

  it("6. Every requirement and claim record has valid provenance fields and no invented values", () => {
    for (const outlet of BASELINE_JOURNALS) {
      if (outlet.requirementsList) {
        for (const req of outlet.requirementsList) {
          expect(req.field).toBeDefined();
          expect(req.officialSourceUrl).toBe(outlet.officialUrl);
          expect(req.retrievalDate).toBe(outlet.lastVerifiedDate);
          expect(req.extractedValue).toBeDefined();
          expect(["High", "Medium", "Low"]).toContain(req.confidence);
          expect(typeof req.humanConfirmed).toBe("boolean");
        }
      }

      if (outlet.datedClaims) {
        for (const claim of outlet.datedClaims) {
          expect(claim.claimName).toBeDefined();
          expect(claim.value).toBeDefined();
          expect(claim.officialSourceUrl).toBe(outlet.officialUrl);
          expect(claim.retrievalDate).toBe(outlet.lastVerifiedDate);
          expect(typeof claim.humanConfirmed).toBe("boolean");
        }
      }
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
    const wordReq = userOutlet.requirementsList?.find((r) => r.field === "wordLimit");
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

    const wordReq = liveRecord.requirementsList?.find((r) => r.field === "wordLimit");
    expect(wordReq?.officialSourceUrl).toBe("https://api.openalex.org/sources/s123");
    expect(wordReq?.confidence).toBe("Medium");
    expect(wordReq?.humanConfirmed).toBe(false);
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
});
