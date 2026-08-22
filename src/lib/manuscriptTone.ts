export type ManuscriptTone = "Concise Technical" | "Narrative Descriptive" | "Formal Academic";

/**
 * Deterministic formatting of researcher/approved text. This function does not
 * generate facts, citations, methods, results, or replacement manuscript prose.
 */
export function applyToneAndComplexity(content: string, toneStyle: ManuscriptTone): string {
  if (!content) return content;
  const tone = toneStyle || "Formal Academic";

  if (tone === "Concise Technical") {
    const concise = content
      .replace(/accumulating empirical evidence indicates that/gi, "Empirical data show")
      .replace(/it is important to note that/gi, "Notably,")
      .replace(/despite extensive previous investigation,/gi, "Despite prior work,")
      .replace(/in order to establish whether/gi, "To evaluate whether")
      .replace(/a major methodological limitation in existing literature is/gi, "Key methodological limitation:")
      .replace(/furthermore, many previous studies failed to report/gi, "Prior work omitted")
      .replace(/the central finding of this investigation is that/gi, "Primary result:")
      .replace(/statistical analysis was conducted using/gi, "Analyzed via");

    return `<!-- Tone & Complexity Mode: Concise Technical -->\n${concise}`;
  }

  if (tone === "Narrative Descriptive") {
    const narrative = content
      .replace(/## 1. Introduction/g, "## 1. Introduction & Contextual Narrative")
      .replace(/## 2. Materials and Methods/g, "## 2. Materials and Experimental Methods")
      .replace(/## 3. Results/g, "## 3. Findings & Observational Results")
      .replace(/## 4. Discussion/g, "## 4. Discussion & Mechanistic Interpretation")
      .replace(/key methodological limitation:/gi, "When evaluating the broader experimental landscape, a central methodological challenge emerges:")
      .replace(/primary result:/gi, "Upon examining the primary outcomes across verified observations, the data indicate:");

    return `<!-- Tone & Complexity Mode: Narrative Descriptive -->\n${narrative}`;
  }

  return content.replace(/<!-- Tone & Complexity Mode: [^>]+ -->\n?/g, "");
}
