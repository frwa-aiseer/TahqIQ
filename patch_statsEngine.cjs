const fs = require('fs');
let code = fs.readFileSync('src/lib/statsEngine.ts', 'utf8');

code = code.replace(
  'executionStatus: "Completed",\n      isResearcherSupplied: true,',
  'executionStatus: "Completed",\n      state: "Completed",\n      isResearcherSupplied: true,'
);

code = code.replace(
  'executionStatus: "Completed",\n    isResearcherSupplied: false,',
  'executionStatus: "Completed",\n    state: "Completed",\n    isResearcherSupplied: false,'
);

fs.writeFileSync('src/lib/statsEngine.ts', code);
