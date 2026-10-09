const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '../app/api/ai-grader/route.ts');
const code = fs.readFileSync(srcPath, 'utf8');

// 1. Split out Groq Client
const groqClientIndex = code.indexOf('// ===== MODEL RIÊNG CHO CHẤM ĐIỂM =====');
const groqClientEnd = code.indexOf('// =====================================================================');
const groqCode = code.substring(0, groqClientEnd);

const groqClientImports = `import Groq from 'groq-sdk';
import { getDb } from '@/src/db';
import { systemConfigs, apiUsages, users } from '@/src/db/schema';
import { eq, sql } from 'drizzle-orm';
`;

let groqFile = groqClientImports + '\n' + groqCode.replace(/import .* from '.*';\n/g, ''); // remove original imports
groqFile = groqFile.replace(/async function getGroqConfigFromDb/, 'export async function getGroqConfigFromDb');
groqFile = groqFile.replace(/async function tryGenerateWithFallbackWrapped/, 'export async function tryGenerateWithFallbackWrapped');
groqFile = groqFile.replace(/async function checkAndIncrementRateLimit/, 'export async function checkAndIncrementRateLimit');

// 2. Scoring Utilities
const scoringIndex = code.indexOf('const MAX_ESSAY_LENGTH = 8000');
const scoringEndIndex = code.indexOf('export async function POST');
const scoringCode = code.substring(scoringIndex, scoringEndIndex);

const scoringImports = `import { getDb } from '@/src/db';
import { systemConfigs } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
`;

let scoringFile = scoringImports + '\n' + scoringCode;
scoringFile = scoringFile.replace(/const MAX_ESSAY_LENGTH/, 'export const MAX_ESSAY_LENGTH');
scoringFile = scoringFile.replace(/const countWords/, 'export const countWords');
scoringFile = scoringFile.replace(/const countHanzi/, 'export const countHanzi');
scoringFile = scoringFile.replace(/const countKoreanChars/, 'export const countKoreanChars');
scoringFile = scoringFile.replace(/const parseModelJson/, 'export const parseModelJson');
scoringFile = scoringFile.replace(/function parseModelJson/, 'export function parseModelJson');
scoringFile = scoringFile.replace(/async function getGradingSettings/, 'export async function getGradingSettings');
scoringFile = scoringFile.replace(/const GRADING_CONTRACT/, 'export const GRADING_CONTRACT');

// Wait, the basePrompt and Rubrics are inside scoringCode if I just substring from MAX_ESSAY_LENGTH.
// Let's split scoringCode into rubrics and scoring.
const rubricsIndex = scoringCode.indexOf('const basePrompt');
const rubricsEndIndex = scoringCode.indexOf('// ---------------------- HẬU XỬ LÝ ĐIỂM ----------------------');
const rubricsCode = scoringCode.substring(rubricsIndex, rubricsEndIndex);

const rubricsFile = rubricsCode
  .replace(/const basePrompt/, 'export const basePrompt')
  .replace(/const CRIT/, 'export const CRIT')
  .replace(/const correctionsSchema/, 'export const correctionsSchema')
  .replace(/const IELTS_COMMON_RUBRIC/, 'export const IELTS_COMMON_RUBRIC')
  .replace(/const IELTS_T2_RUBRIC/, 'export const IELTS_T2_RUBRIC')
  .replace(/const IELTS_T1_RUBRIC/, 'export const IELTS_T1_RUBRIC')
  .replace(/const TOEIC_67_RUBRIC/, 'export const TOEIC_67_RUBRIC')
  .replace(/const TOEIC_8_RUBRIC/, 'export const TOEIC_8_RUBRIC')
  .replace(/const HSK_RUBRIC_COMMON/, 'export const HSK_RUBRIC_COMMON')
  .replace(/const HSK5_RUBRIC/, 'export const HSK5_RUBRIC')
  .replace(/const HSK6_RUBRIC/, 'export const HSK6_RUBRIC')
  .replace(/const TOPIK_COMMON/, 'export const TOPIK_COMMON')
  .replace(/const TOPIK_5152_RUBRIC/, 'export const TOPIK_5152_RUBRIC')
  .replace(/const TOPIK_53_RUBRIC/, 'export const TOPIK_53_RUBRIC')
  .replace(/const TOPIK_54_RUBRIC/, 'export const TOPIK_54_RUBRIC');

// Remove rubrics from scoringFile
scoringFile = scoringFile.replace(rubricsCode, '');

// 3. New route.ts
const routeCode = code.substring(scoringEndIndex);
const newRouteCode = `import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDb } from '@/src/db';
import { prompts as promptsTable } from '@/src/db/schema';
import { sql } from 'drizzle-orm';

import { checkAndIncrementRateLimit, tryGenerateWithFallbackWrapped } from './groq-client';
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

${routeCode}
`;

fs.writeFileSync(path.join(__dirname, '../app/api/ai-grader/groq-client.ts'), groqFile);
fs.writeFileSync(path.join(__dirname, '../app/api/ai-grader/rubrics.ts'), rubricsFile);
fs.writeFileSync(path.join(__dirname, '../app/api/ai-grader/scoring.ts'), scoringFile);
fs.writeFileSync(srcPath, newRouteCode);

console.log("Successfully split route.ts using string splitting.");
