const fs = require('fs');
let code = fs.readFileSync('app/ai-grader/ielts/AiGraderClient.tsx', 'utf8');

const target = `  // Save draft on change
  useEffect(() => {
    if (hasLoadedDraft) { localStorage.setItem('draft_ielts_essay', essay)
    if (prompt) localStorage.setItem('draft_ielts_prompt', JSON.stringify(prompt))
    localStorage.setItem('draft_ielts_examType', examType)
  }, [essay, prompt, examType])`;

const replacement = `  // Save draft on change
  useEffect(() => {
    if (hasLoadedDraft) {
      localStorage.setItem('draft_ielts_essay', essay);
      if (prompt) localStorage.setItem('draft_ielts_prompt', JSON.stringify(prompt));
      localStorage.setItem('draft_ielts_examType', examType);
    }
  }, [essay, prompt, examType, hasLoadedDraft])`;

// Use standard string replace which handles newlines fine if they match exactly, 
// but since newlines might be \r\n, we can do a regex replace with whitespace flexibility:
const regex = /\/\/\s*Save draft on change[\s\S]*?\}, \[essay, prompt, examType\]\)/;
code = code.replace(regex, replacement);

fs.writeFileSync('app/ai-grader/ielts/AiGraderClient.tsx', code);
console.log("Fixed syntax error!");
