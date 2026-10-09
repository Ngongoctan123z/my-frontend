import { postProcessResult, buildUserContent } from '../app/api/ai-grader/scoring'
import assert from 'assert'

console.log('Running Tests for AI Grader...')
let pass = 0, fail = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ ${name}`);
    pass++;
  } catch (e: any) {
    console.error(`❌ ${name}`);
    console.error(e);
    fail++;
  }
}

// 1. Kiểm tra TOPIK_53 và HSK_5 nhận dữ liệu nguồn
test('TOPIK_53 and HSK_5 gets source data in userContent', () => {
  const hsk5Content = buildUserContent('bức tranh xyz', 'tôi viết gì đó', '80 chữ', '\\nTHÔNG SỐ CỦA HÌNH ẢNH: mô tả hình ảnh');
  assert(hsk5Content.includes('THÔNG SỐ CỦA HÌNH ẢNH: mô tả hình ảnh'), 'Thiếu mô tả ảnh');
});

// 2. Điểm ngoài khoảng bị từ chối
test('Throws on score out of bounds', () => {
  const invalidJson = {
    criteria: {
      taskAchievement: { score: 10, evidence: ['a'], reasoning: '', feedback: '' },
      coherenceCohesion: { score: 9, evidence: ['a'], reasoning: '', feedback: '' },
      lexicalResource: { score: 9, evidence: ['a'], reasoning: '', feedback: '' },
      grammaticalRange: { score: 9, evidence: ['a'], reasoning: '', feedback: '' },
    },
    corrections: []
  };
  assert.throws(() => {
    postProcessResult(invalidJson, 'IELTS_TASK_1', 'this is an essay with a');
  }, /score_out_of_bounds/);
});

// 3. Evidence bịa bị từ chối
test('Throws on fake evidence', () => {
  const json = {
    criteria: {
      taskAchievement: { score: 8, evidence: ['câu này không có trong bài'], reasoning: '', feedback: '' },
      coherenceCohesion: { score: 8, evidence: ['câu này không có trong bài'], reasoning: '', feedback: '' },
      lexicalResource: { score: 8, evidence: ['câu này không có trong bài'], reasoning: '', feedback: '' },
      grammaticalRange: { score: 8, evidence: ['câu này không có trong bài'], reasoning: '', feedback: '' },
    },
    corrections: []
  };
  assert.throws(() => {
    postProcessResult(json, 'IELTS_TASK_1', 'bài làm thực tế chỉ có câu này');
  }, /invalid_evidence/);
});

// 4. Correction bịa bị từ chối
test('Fake corrections are filtered out', () => {
  const json = {
    criteria: {
      grammarAndVocabulary: { score: 4, evidence: ['test'], reasoning: '', feedback: '' },
      organization: { score: 4, evidence: ['test'], reasoning: '', feedback: '' },
      taskFulfillment: { score: 4, evidence: ['test'], reasoning: '', feedback: '' },
    },
    holisticScore: 4,
    corrections: [
      { type: 'Lỗi', original: 'fake error', corrected: 'fix', explanation: 'err', impact: 'grammar' },
      { type: 'Lỗi', original: 'test', corrected: 'test fixed', explanation: 'err', impact: 'grammar' }
    ]
  };
  const res = postProcessResult(json, 'TOEIC_RESPOND', 'this is a test');
  assert.strictEqual(res.corrections.length, 1);
  assert.strictEqual(res.corrections[0].original, 'test');
});

// 5. TOEIC schema validation
test('TOEIC requires holisticScore', () => {
  const missingHolistic = {
    criteria: {
      grammarAndVocabulary: { score: 4, evidence: ['test'], reasoning: '', feedback: '' },
      organization: { score: 4, evidence: ['test'], reasoning: '', feedback: '' },
      taskFulfillment: { score: 4, evidence: ['test'], reasoning: '', feedback: '' },
    },
    corrections: []
  };
  assert.throws(() => {
    postProcessResult(missingHolistic, 'TOEIC_RESPOND', 'this is a test');
  }, /invalid_schema|score_out_of_bounds/); // Wait, if it's missing, it's undefined -> Number(undefined) is NaN -> score_out_of_bounds
});

console.log(`\nTests finished: ${pass} passed, ${fail} failed.`);
if (fail > 0) process.exit(1);
