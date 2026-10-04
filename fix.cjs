const fs = require('fs');

// Fix route.ts
let route = fs.readFileSync('app/api/ai-grader/route.ts', 'utf8');
route = route.replace(/    \}\r?\n      \)\r?\n    \}\r?\n\r?\n    if \(action === 'grade_essay'\) \{/, "    }\n\n    if (action === 'grade_essay') {");
fs.writeFileSync('app/api/ai-grader/route.ts', route);

// Fix ProfileClient.tsx (if any syntax error)
let profile = fs.readFileSync('app/profile/ProfileClient.tsx', 'utf8');
// Check if the closing tag or brackets are correct.
fs.writeFileSync('app/profile/ProfileClient.tsx', profile);
