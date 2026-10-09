const fs = require('fs');
let code = fs.readFileSync('app/ai-grader/ielts/AiGraderClient.tsx', 'utf8');

code = code.replace(/\/\/ Load draft on mount\n\s*useEffect\(\(\) => \{/, 'const [hasLoadedDraft, setHasLoadedDraft] = useState(false)\n\n  // Load draft on mount\n  useEffect(() => {');
code = code.replace(/IELTS_WRITING_TASK/g, 'IELTS_TASK_');
code = code.replace(/    \} catch \(e\) \{\}\n  \}, \[\]\)/, '    } catch (e) {}\n    setHasLoadedDraft(true)\n  }, [])');
code = code.replace(/localStorage\.setItem\('draft_ielts_essay', essay\)/, 'if (hasLoadedDraft) { localStorage.setItem(\'draft_ielts_essay\', essay)');
code = code.replace(/localStorage\.setItem\('draft_ielts_examType', examType\)\n  \}, \[essay, prompt, examType\]\)/, 'localStorage.setItem(\'draft_ielts_examType\', examType) }\n  }, [essay, prompt, examType, hasLoadedDraft])');
code = code.replace(/  useEffect\(\(\) => \{\n    promptQueue\.current = \[\]\n    isFetchingQueue\.current = false\n    currentExamType\.current = examType\n    setPrompt\(null\)\n  \}, \[examType\]\)/, '  useEffect(() => {\n    if (!hasLoadedDraft) return;\n    if (currentExamType.current !== examType) {\n      promptQueue.current = []\n      isFetchingQueue.current = false\n      currentExamType.current = examType\n      setPrompt(null)\n    }\n  }, [examType, hasLoadedDraft])');

fs.writeFileSync('app/ai-grader/ielts/AiGraderClient.tsx', code);
console.log("Fixed draft logic!");
