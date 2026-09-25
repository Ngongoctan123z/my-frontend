const fs = require('fs');
let content = fs.readFileSync('app/ai-grader/paraphrase/ParaphraseClient.tsx', 'utf8');

content = content.replace(/const res = await fetch\('\/api\/ai-grader'[\s\S]*?setCurrentPrompt\(data\)/, 
`const { callAiGraderClient } = await import('@/src/utils/geminiClient')
      const data = await callAiGraderClient(
        {
          action: 'generate_paraphrase_prompt',
          topic: topicName,
          level: selectedLevel
        },
        apiKey.trim()
      )
      setCurrentPrompt(data)`);

content = content.replace(/const res = await fetch\('\/api\/ai-grader'[\s\S]*?setResult\(data\)/, 
`const { callAiGraderClient } = await import('@/src/utils/geminiClient')
      const data = await callAiGraderClient(
        {
          action: 'grade_paraphrase',
          level: selectedLevel,
          vietnameseText: currentPrompt.vietnameseText,
          contextText: currentPrompt.context,
          userTranslation
        },
        apiKey.trim()
      )
      setResult(data)`);

fs.writeFileSync('app/ai-grader/paraphrase/ParaphraseClient.tsx', content);
