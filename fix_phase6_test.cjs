const fs = require('fs');

let testCode = fs.readFileSync('src/tests/phase6.test.ts', 'utf8');
testCode = testCode.replace(
  'executionStatus: "Completed",\n        isReproduced: true,',
  'executionStatus: "Completed",\n        isReproduced: true,\n        state: "Approved for Manuscript",'
);

fs.writeFileSync('src/tests/phase6.test.ts', testCode);
