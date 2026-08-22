const cit = '(Doe et al., 2024)';
const cleanCit = cit.replace(/[()\[\]]/g, "").trim();
const yearMatch = cleanCit.match(/\b(19\d{2}|20\d{2})\b/);
console.log(yearMatch);
