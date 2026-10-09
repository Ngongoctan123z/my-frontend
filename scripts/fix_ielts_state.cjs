const fs = require('fs');
let code = fs.readFileSync('app/ai-grader/ielts/AiGraderClient.tsx', 'utf8');

const target = `  // Load draft on mount
  useEffect(() => {
    try {
      const savedEssay = localStorage.getItem('draft_ielts_essay')`;

const replacement = `  const [hasLoadedDraft, setHasLoadedDraft] = useState(false)

  // Load draft on mount
  useEffect(() => {
    try {
      const savedEssay = localStorage.getItem('draft_ielts_essay')`;

code = code.replace(target, replacement);

const target2 = `    } catch (e) {}
  }, [])`;

const replacement2 = `    } catch (e) {}
    setHasLoadedDraft(true)
  }, [])`;

code = code.replace(target2, replacement2);

// Fix the prompt nulling logic in useEffect on examType change
const target3 = `  useEffect(() => {
    promptQueue.current = []
    isFetchingQueue.current = false
    currentExamType.current = examType
    setPrompt(null)
  }, [examType])`;

const replacement3 = `  useEffect(() => {
    if (!hasLoadedDraft) return;
    if (currentExamType.current !== examType) {
      promptQueue.current = []
      isFetchingQueue.current = false
      currentExamType.current = examType
      setPrompt(null)
    }
  }, [examType, hasLoadedDraft])`;

code = code.replace(target3, replacement3);

// Fix IELTS_WRITING_TASK1 to IELTS_TASK_1 in the local storage load check
code = code.replace(/IELTS_WRITING_TASK/g, 'IELTS_TASK_');

fs.writeFileSync('app/ai-grader/ielts/AiGraderClient.tsx', code);
console.log("Fixed state declarations!");
