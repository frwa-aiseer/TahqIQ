const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Need to update the Results check in server.ts
// Wait, rather than importing, let's just implement the logic or we can try importing.
const newCheck = `
            (out: any) => {
              const isExplicitlyApproved =
                out.state === "Approved for Manuscript" ||
                out.isApproved === true ||
                out.isResearcherApproved === true ||
                out.state === "Researcher Approved";
              return isExplicitlyApproved;
            }
`;

code = code.replace(
  /\(out: any\) => out\.executionStatus === "Completed" \|\| out\.isReproduced \|\| out\.reproductionStatus === "Independently Reproduced"/g,
  newCheck
);

fs.writeFileSync('server.ts', code);
