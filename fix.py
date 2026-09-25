import re

with open('app/ai-grader/paraphrase/ParaphraseClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace generate_paraphrase_prompt
content = re.sub(
    r'const res = await fetch\(''/api/ai-grader'', \{[\s\S]*?body: JSON\.stringify\(\{\s*action: ''generate_paraphrase_prompt'',\s*topic: topicName,\s*level: selectedLevel\s*\}\)\s*\}\)\s*const data = await res\.json\(\)\s*if \(!res\.ok\) throw new Error\(data\.error \|\| ''.*?''\)',
    '''const { callAiGraderClient } = await import('@/src/utils/geminiClient');
        const data = await callAiGraderClient({ action: 'generate_paraphrase_prompt', topic: topicName, level: selectedLevel }, apiKey.trim());''',
    content
)

# Replace grade_paraphrase
content = re.sub(
    r'const res = await fetch\(''/api/ai-grader'', \{[\s\S]*?body: JSON\.stringify\(\{\s*action: ''grade_paraphrase'',\s*level: selectedLevel,\s*vietnameseText: currentPrompt\.vietnameseText,\s*contextText: currentPrompt\.context,\s*userTranslation\s*\}\)\s*\}\)\s*const data = await res\.json\(\)\s*if \(!res\.ok\) throw new Error\(data\.error \|\| ''.*?''\)',
    '''const { callAiGraderClient } = await import('@/src/utils/geminiClient');
        const data = await callAiGraderClient({ action: 'grade_paraphrase', level: selectedLevel, vietnameseText: currentPrompt.vietnameseText, contextText: currentPrompt.context, userTranslation }, apiKey.trim());''',
    content
)

with open('app/ai-grader/paraphrase/ParaphraseClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
