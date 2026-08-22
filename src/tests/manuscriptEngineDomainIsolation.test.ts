import { describe, it, expect } from 'vitest';
import { createEmptyProject } from '../data/demoProject';
import { expandSectionToQ1Length, expandFullPaperToQ1Length, applyToneAndComplexity } from '../lib/q1ManuscriptEngine';
import { ManuscriptSection, ProjectState } from '../types';

describe('Manuscript Engine Domain Isolation & Zero-Fabrication Tests', () => {
  const BANNED_DOMAIN_TERMS = [
    /hamstring/i,
    /semitendinosus/i,
    /treadmill/i,
    /crossover/i,
    /\b18[- ]participants?\b/i,
    /\b48[- ]hours?\s+washout\b/i,
    /\bEMG\b/,
    /\bmvic\b/i,
    /\bt\(17\)\s*=\s*6\.84\b/,
    /cohen's d(?:_rm)?\s*=\s*1\.41/i,
    /\bp\s*<\s*0\.000003\b/i,
    /\bBoyer\b/i,
    /\bMendiguchia\b/i,
    /\bEdouard\b/i,
    /\bSnyder\b/i,
  ];

  it('1. Arbitrary empty real project cannot receive any banned domain terms in any section', () => {
    const realProject = createEmptyProject();
    expect(realProject.isDemoProject).toBe(false);

    const sectionNames = [
      'Structured Abstract',
      '1. Introduction',
      '2. Materials and Methods',
      '3. Results',
      '4. Discussion',
      '5. Conclusion & Recommendations'
    ];

    sectionNames.forEach((title, idx) => {
      const section: ManuscriptSection = {
        id: `sec-${idx + 1}`,
        title,
        content: '',
        order: idx + 1,
        currentWordCount: 0,
        citationIds: [],
        status: 'Drafting',
        version: 1,
        lastEditedBy: 'Researcher',
        lastEditedTimestamp: new Date().toISOString()
      };

      const result = expandSectionToQ1Length(section, realProject, 1000);

      // Verify no banned domain words exist in generated content
      BANNED_DOMAIN_TERMS.forEach((regex) => {
        expect(result.content).not.toMatch(regex);
      });

      // Verify presence of explicit researcher required placeholders
      expect(result.content).toMatch(/\[Researcher input required|\[Citation required|\[Results: Pending|Unavailable in the prototype/);
    });
  });

  it('2. Arbitrary domain project (e.g. Marine Biology) receives ONLY marine biology context with zero biomechanics leak', () => {
    const marineProject: ProjectState = {
      ...createEmptyProject(),
      id: 'proj-marine-001',
      title: 'Ocean Acidification Impact on Coral Calcification',
      discipline: 'Marine Biology',
      subdiscipline: 'Chemical Oceanography',
      canvas: {
        broadTopic: 'Ocean Acidification and Coral Calcification',
        practicalProblem: 'Rapid ocean acidification threatens shallow-water coral reef frameworks.',
        scientificProblem: 'Aragonite saturation decline inhibits biomineralization rates in Porites corals.',
        intervention: 'Elevated seawater pCO2 simulation (800 ppm)',
        comparator: 'Ambient seawater pCO2 control (400 ppm)',
        population: 'Porites lutea coral nubbins',
        context: 'Controlled mesocosm flow-through aquaria in Great Barrier Reef',
        theoreticalProblem: 'Carbonate saturation state dynamics in biomineralization.',
        exposure: 'High pCO2 seawater',
        outcome: 'Skeletal density and calcification rate reduction',
        framework: 'PICO',
        proposedContribution: 'Quantifies calcification reduction thresholds under elevated carbonate chemistry.',
        suspectedGap: 'Interactive effects of diurnal pH fluctuations remain unquantified in tropical scleractinians.',
        existingKnowledge: 'Standard buoyant weight technique with spectrophotometric pH monitoring.'
      },
      sources: [
        {
          id: 'src-marine-1',
          title: 'Ocean acidification impacts on coral reefs',
          authors: ['Hoegh-Guldberg', 'Mumby'],
          year: 2021,
          journal: 'Nature Climate Change',
          verificationState: 'Verified',
          isDemo: false
        } as any
      ],
      claims: [
        {
          id: 'claim-1',
          claimText: 'Elevated pCO2 significantly decreases skeletal density in Porites corals.',
          importance: 'High',
          verificationStatus: 'Verified',
          evidenceIds: ['src-marine-1']
        } as any
      ],
      gaps: [
        {
          id: 'gap-1',
          type: 'Methodological',
          gapStatement: 'Lack of high-frequency carbonate monitoring during seasonal temperature extremes.',
          confidence: 0.95
        } as any
      ]
    };

    const introSection: ManuscriptSection = {
      id: 'sec-intro',
      title: '1. Introduction',
      content: '',
      order: 1,
      currentWordCount: 0,
      citationIds: [],
      status: 'Drafting',
      version: 1,
      lastEditedBy: 'Researcher',
      lastEditedTimestamp: new Date().toISOString()
    };

    const expandedIntro = expandSectionToQ1Length(introSection, marineProject);

    // Must contain marine context
    expect(expandedIntro.content).toMatch(/ocean acidification/i);
    expect(expandedIntro.content).toContain('Aragonite saturation decline');
    expect(expandedIntro.content).toContain('Hoegh-Guldberg');

    // Must NEVER contain biomechanics or crossover content
    BANNED_DOMAIN_TERMS.forEach((regex) => {
      expect(expandedIntro.content).not.toMatch(regex);
    });
  });

  it('3. Results section for project without approved analysis returns explicit prototype disabled notice without fake statistics', () => {
    const realProject = createEmptyProject();
    realProject.analysisOutputs = [];

    const resultsSection: ManuscriptSection = {
      id: 'sec-res',
      title: '3. Results',
      content: '',
      order: 3,
      currentWordCount: 0,
      citationIds: [],
      status: 'Drafting',
      version: 1,
      lastEditedBy: 'Researcher',
      lastEditedTimestamp: new Date().toISOString()
    };

    const expanded = expandSectionToQ1Length(resultsSection, realProject);

    expect(expanded.content).toContain('Unavailable in the prototype: this function requires verified data');
    expect(expanded.content).toContain('researchers must upload a verified dataset and execute an approved analysis plan');
    
    // Ensure no fallback t-statistic (6.84) or p-value (0.001) or Cohen's d (1.41) are injected
    BANNED_DOMAIN_TERMS.forEach((regex) => {
      expect(expanded.content).not.toMatch(regex);
    });
  });

  it('4. Full Paper Expansion (expandFullPaperToQ1Length) generates clean, domain-isolated manuscript across all sections', () => {
    const realProject = createEmptyProject();
    realProject.title = 'Quantum Coherence in Solid-State Qubits';
    realProject.discipline = 'Quantum Physics';

    realProject.sections = [
      { id: 's1', title: 'Structured Abstract', content: '', order: 1, currentWordCount: 0, citationIds: [], status: 'Drafting', version: 1, lastEditedBy: 'User', lastEditedTimestamp: '' },
      { id: 's2', title: '1. Introduction', content: '', order: 2, currentWordCount: 0, citationIds: [], status: 'Drafting', version: 1, lastEditedBy: 'User', lastEditedTimestamp: '' },
      { id: 's3', title: '2. Materials and Methods', content: '', order: 3, currentWordCount: 0, citationIds: [], status: 'Drafting', version: 1, lastEditedBy: 'User', lastEditedTimestamp: '' },
      { id: 's4', title: '3. Results', content: '', order: 4, currentWordCount: 0, citationIds: [], status: 'Drafting', version: 1, lastEditedBy: 'User', lastEditedTimestamp: '' },
      { id: 's5', title: '4. Discussion', content: '', order: 5, currentWordCount: 0, citationIds: [], status: 'Drafting', version: 1, lastEditedBy: 'User', lastEditedTimestamp: '' },
      { id: 's6', title: '5. Conclusion', content: '', order: 6, currentWordCount: 0, citationIds: [], status: 'Drafting', version: 1, lastEditedBy: 'User', lastEditedTimestamp: '' }
    ];

    const expandedProject = expandFullPaperToQ1Length(realProject, 4500);

    expect(expandedProject.sections).toHaveLength(6);
    expandedProject.sections.forEach((sec) => {
      expect(sec.content.length).toBeGreaterThan(50);
      BANNED_DOMAIN_TERMS.forEach((regex) => {
        expect(sec.content).not.toMatch(regex);
      });
    });
  });

  it('5. applyToneAndComplexity applies neutral transformations without introducing domain biases', () => {
    const rawProse = 'Accumulating empirical evidence indicates that in order to establish whether the intervention succeeds, a major methodological limitation in existing literature is sample size.';
    
    const concise = applyToneAndComplexity(rawProse, 'Concise Technical');
    expect(concise).toContain('Empirical data show');
    expect(concise).toContain('To evaluate whether');
    expect(concise).toContain('Key methodological limitation:');
    
    BANNED_DOMAIN_TERMS.forEach((regex) => {
      expect(concise).not.toMatch(regex);
    });

    const narrative = applyToneAndComplexity('## 1. Introduction\nKey methodological limitation: lack of data.', 'Narrative Descriptive');
    expect(narrative).toContain('## 1. Introduction & Contextual Narrative');
    expect(narrative).toContain('When evaluating the broader experimental landscape, a central methodological challenge emerges:');

    BANNED_DOMAIN_TERMS.forEach((regex) => {
      expect(narrative).not.toMatch(regex);
    });
  });
});
