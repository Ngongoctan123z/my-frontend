const fs = require('fs');

// Fix IELTS - remove duplicate line 458 (0-indexed: 457)
let ielts = fs.readFileSync('app/ai-grader/ielts/AiGraderClient.tsx', 'utf8');
let ieltsLines = ielts.split(/\r?\n/);
// Remove line 458 which is the old corrupt duplicate
ieltsLines.splice(457, 1);
fs.writeFileSync('app/ai-grader/ielts/AiGraderClient.tsx', ieltsLines.join('\n'));
console.log('Fixed IELTS - removed duplicate intro line');

// Fix TOEIC - same issue
let toeic = fs.readFileSync('app/ai-grader/toeic/ToeicGraderClient.tsx', 'utf8');
let toeicLines = toeic.split(/\r?\n/);
// Check line 455 and 456 (0-indexed) and remove duplicate
// First let's see what's there
console.log('TOEIC line 454:', JSON.stringify(toeicLines[453]));
console.log('TOEIC line 455:', JSON.stringify(toeicLines[454]));
console.log('TOEIC line 456:', JSON.stringify(toeicLines[455]));
// Remove the duplicate at line 456 (0-indexed: 455)
toeicLines.splice(455, 1);
fs.writeFileSync('app/ai-grader/toeic/ToeicGraderClient.tsx', toeicLines.join('\n'));
console.log('Fixed TOEIC - removed duplicate intro line');
