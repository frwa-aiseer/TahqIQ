const fs = require('fs');

let testCode = fs.readFileSync('src/tests/numericGrounding.test.ts', 'utf8');
testCode = testCode.replace(
  'executionStatus: "Completed",\n        isReproduced: true,',
  'executionStatus: "Completed",\n        isReproduced: true,\n        state: "Approved for Manuscript",'
);

fs.writeFileSync('src/tests/numericGrounding.test.ts', testCode);
