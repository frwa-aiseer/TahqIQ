const fs = require('fs');
let code = fs.readFileSync('src/components/views/DataLabView.tsx', 'utf8');

code = code.replace(
  '{latestOutput.isResearcherSupplied ? (',
  '{latestOutput.isResearcherSupplied && !latestOutput.isReproduced && latestOutput.reproductionStatus !== "Independently Reproduced" ? ('
);

fs.writeFileSync('src/components/views/DataLabView.tsx', code);
