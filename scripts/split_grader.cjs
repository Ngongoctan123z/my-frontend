const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '../app/api/ai-grader/route.ts');
const lines = fs.readFileSync(srcPath, 'utf8').split('\n');

// Helper to get lines (1-indexed, inclusive)
const getLines = (start, end) => lines.slice(start - 1, end).join('\n');

const groqClientCode = `import Groq from 'groq-sdk';
import { getDb } from '@/src/db';
import { systemConfigs, apiUsages, users } from '@/src/db/schema';
import { eq, sql } from 'drizzle-orm';

${getLines(9, 69)}
${getLines(71, 120)}
${getLines(122, 214)}
`;

const rubricsCode = `
export ${getLines(277, 282).replace(/^const /, '')}
export ${getLines(284, 292).replace(/^const /, '')}

export const basePrompt = \`${getLines(249, 275).replace(/`/g, '\\`')}\`;

${getLines(297, 448).replace(/const /g, 'export const ')}
`;

const scoringCode = `
import { systemConfigs } from '@/src/db/schema';
import { getDb } from '@/src/db';

${getLines(220, 246).replace(/const /g, 'export const ')}
export ${getLines(294, 295)}
${getLines(450, 542)}
${getLines(545, 567).replace(/async function getGradingSettings/, 'export async function getGradingSettings').replace(/const GRADING_CONTRACT/, 'export const GRADING_CONTRACT')}
`;

const newRouteCode = `import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDb } from '@/src/db';
import { prompts as promptsTable } from '@/src/db/schema';
import { sql } from 'drizzle-orm';

import { 
  checkAndIncrementRateLimit, 
  tryGenerateWithFallbackWrapped 
} from './groq-client';

import {
  basePrompt, CRIT, correctionsSchema,
  IELTS_COMMON_RUBRIC, IELTS_T2_RUBRIC, IELTS_T1_RUBRIC,
  TOEIC_67_RUBRIC, TOEIC_8_RUBRIC,
  HSK_RUBRIC_COMMON, HSK5_RUBRIC, HSK6_RUBRIC,
  TOPIK_COMMON, TOPIK_5152_RUBRIC, TOPIK_53_RUBRIC, TOPIK_54_RUBRIC
} from './rubrics';

import {
  MAX_ESSAY_LENGTH, countWords, countHanzi, countKoreanChars,
  buildUserContent, postProcessResult, parseModelJson,
  getGradingSettings, GRADING_CONTRACT
} from './scoring';

${getLines(569, lines.length)}
`;

fs.writeFileSync(path.join(__dirname, '../app/api/ai-grader/groq-client.ts'), groqClientCode);
fs.writeFileSync(path.join(__dirname, '../app/api/ai-grader/rubrics.ts'), rubricsCode);
fs.writeFileSync(path.join(__dirname, '../app/api/ai-grader/scoring.ts'), scoringCode);
fs.writeFileSync(srcPath, newRouteCode); // overwrite route.ts

console.log("Successfully split route.ts into 4 files.");
