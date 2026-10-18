// Original sample submissions and simulated provider output. These scores are
// fixtures for checking the API contract, not real AI assessments.
const criterion = score => ({ score, evidence: [], reasoning: 'Nhận xét mẫu để kiểm thử cấu trúc.', feedback: 'Phản hồi mẫu.' })
const result = scores => ({
  criteria: Object.fromEntries(Object.entries(scores).map(([key, score]) => [key, criterion(score)])),
  detailedFeedback: 'Kết quả giả lập để kiểm tra luồng chấm bài.', corrections: [],
})

const email = `Dear Ms. Brown,
Thank you for asking about the training session. I can confirm that it will take place on Friday at 9 a.m. in meeting room B. Participants should bring their laptops because we will practise using the new software. The session will finish at noon, and refreshments will be provided during a short break. Could you please let me know how many people from your team will attend? If anyone needs accessibility arrangements, I would be happy to help. I look forward to welcoming your team.
Best regards,
Alex Nguyen`

const opinion = `I believe companies should offer employees a flexible combination of office work and remote work. Although a shared office is useful for some activities, requiring everyone to commute every day creates unnecessary costs and reduces the time available for focused work. A clear hybrid policy can improve both productivity and employee satisfaction.
First, working from home allows people to organise tasks that require sustained concentration. For example, a financial analyst may need several uninterrupted hours to check a complex report. In a busy office, unexpected conversations can interrupt this process repeatedly. At home, the analyst can complete the report carefully and then discuss the findings with colleagues during an agreed online meeting. Managers should assess the quality and timeliness of the work rather than the number of hours spent at a desk.
Second, flexible arrangements make employment accessible to a wider range of people. Parents and workers who live far from the city can save several hours of travel each week. They can use part of that time to rest or study, which may help them bring more energy and useful skills to the company. Employers also benefit because satisfied staff members are less likely to leave, reducing the cost of recruiting replacements.
However, remote work should not eliminate personal contact. New employees often need direct guidance, and creative projects benefit from spontaneous discussion. Companies can address these needs by scheduling shared office days for training, planning and team activities. They should also provide secure equipment and clear communication rules so that everyone understands when colleagues are available.
In conclusion, a balanced hybrid policy offers practical advantages without sacrificing cooperation. By choosing where to work according to the task, employees can concentrate effectively while maintaining strong professional relationships. Companies that measure results and support communication can make this approach successful.`

const koreanEssay = `현대 사회에서 평생 학습의 중요성은 점점 커지고 있다. 기술과 직업 환경이 빠르게 변하기 때문에 학교에서 배운 지식만으로 모든 문제를 해결하기 어렵다. 따라서 성인이 된 후에도 새로운 지식과 능력을 꾸준히 익힐 필요가 있다. 평생 학습은 개인의 성장뿐만 아니라 사회 전체의 발전에도 도움을 준다.
우선 평생 학습을 통해 사람들은 변화에 유연하게 대응할 수 있다. 예를 들어 회사원이 새로운 컴퓨터 프로그램을 배우면 반복적인 업무를 더 효율적으로 처리할 수 있다. 또한 외국어를 공부하면 다른 나라 사람들과 소통하고 다양한 문화를 이해할 기회가 늘어난다. 이러한 경험은 자신감을 높이고 새로운 진로를 찾는 데에도 도움이 된다.
그러나 직장과 가정의 일을 함께 맡고 있는 사람들은 학습 시간을 확보하기 어렵다. 교육비가 부담스럽거나 가까운 곳에 교육 기관이 없는 경우도 있다. 이런 문제를 해결하려면 정부와 지역 사회가 저렴한 온라인 강좌와 주말 수업을 제공해야 한다. 기업 역시 직원이 교육에 참여할 수 있도록 근무 시간을 조정하고 학습 비용을 지원할 필요가 있다.
개인도 현실적인 목표를 세우는 노력을 해야 한다. 처음부터 많은 내용을 공부하려고 하기보다 매일 짧은 시간이라도 꾸준히 학습하는 것이 좋다. 배운 내용을 실제 생활이나 업무에 적용하면 학습 효과를 높일 수 있다. 결국 개인의 의지와 사회의 지원이 함께 이루어질 때 누구나 지속적으로 성장할 수 있는 사회를 만들 수 있을 것이다.`

const chineseSummary = `乡村图书馆的变化
年轻教师李明回到家乡后，发现村里的孩子虽然喜欢阅读，却很难找到适合自己的书。村里原来有一间旧图书室，但书籍数量少，开放时间也不固定，因此几乎没有人使用。李明决定利用周末整理书架，并向过去的同学介绍情况，希望大家捐出保存完好的儿童读物。
刚开始，只有几位朋友寄来书籍，村民也担心图书室很快又会关闭。李明没有放弃。他主动邀请家长参加阅读活动，让孩子轮流介绍自己喜欢的故事，还建立了简单的借书登记制度。为了方便放学后的学生，他和几名志愿者商量，每天下午安排一个人负责开门。
经过几个月的努力，图书室逐渐热闹起来。一些村民愿意捐款购买新书，附近学校的老师也开始带学生来参加活动。李明发现，孩子不仅阅读的数量增加了，而且更愿意表达自己的想法。有的孩子还把书中的科学知识用在生活中，帮助家人解决实际问题。
后来，村委会决定修理旧房屋，并提供稳定的经费。李明认为，图书馆能够坚持下来，靠的不是某一个人的力量，而是村民共同参与形成的责任感。他希望以后有更多年轻人加入，让这间小图书馆继续成为孩子认识世界的窗口。`

export const gradingSamples = [
  { name: 'TOEIC câu 6–7: trả lời email', type: 'TOEIC_RESPOND', prompt: 'Reply to Ms. Brown: confirm the training time, explain what participants should bring, and ask one question about attendance.', essay: email,
    provider: { ...result({ taskFulfillment: 4, organization: 4, grammar: 4, vocabulary: 4 }), holisticScore: 4 }, expected: '4/4' },
  { name: 'TOEIC câu 8: bài luận', type: 'TOEIC_ESSAY', prompt: 'Should companies allow employees to work from home? Give reasons and examples.', essay: opinion,
    provider: { ...result({ reasonsAndExamples: 5, organization: 5, grammar: 5, vocabulary: 5 }), holisticScore: 5 }, expected: '5/5' },
  { name: 'TOPIK câu 51', type: 'TOPIK_51', prompt: '친구에게 도서관 모임 시간을 안내하는 글의 빈칸 두 개를 완성하십시오.', essay: '㉠ 오후 세 시에 도서관에서 만날까요?\n㉡ 시간이 바뀌면 미리 연락해 주시기 바랍니다.',
    provider: result({ taskCompletion: 80, grammarAndVocabulary: 80, organization: 80 }), expected: '8/10' },
  { name: 'TOPIK câu 52', type: 'TOPIK_52', prompt: '규칙적인 운동이 건강에 도움이 되는 이유를 설명하는 글을 완성하십시오.', essay: '㉠ 몸의 건강을 유지하는 데 도움이 된다.\n㉡ 자신의 건강 상태에 맞게 꾸준히 운동하는 것이 중요하다.',
    provider: result({ taskCompletion: 80, grammarAndVocabulary: 80, organization: 80 }), expected: '8/10' },
  { name: 'TOPIK câu 53', type: 'TOPIK_53', prompt: '온라인 강좌 이용률의 변화를 설명하십시오.', chartExtra: '온라인 강좌 이용률: 2020년 30%, 2025년 65%. 증가 이유: 시간 절약, 강좌 선택 확대.',
    essay: '온라인 강좌 이용률을 조사한 결과, 2020년에는 전체 응답자의 30%가 온라인 강좌를 이용했으나 2025년에는 65%로 증가하였다. 이는 5년 사이에 이용률이 두 배 이상 높아졌다는 것을 보여 준다. 이러한 변화의 주요 원인으로는 이동 시간을 줄일 수 있다는 점과 다양한 강좌를 선택할 수 있다는 점을 들 수 있다. 특히 직장인들은 자신의 일정에 맞추어 공부할 수 있어 온라인 강좌를 선호하는 것으로 보인다.',
    provider: result({ taskCompletion: 80, organization: 80, grammarAndVocabulary: 80 }), expected: '24/30' },
  { name: 'TOPIK câu 54', type: 'TOPIK_54', prompt: '평생 학습이 필요한 이유와 이를 지원하기 위한 방안을 쓰십시오.', essay: koreanEssay,
    provider: result({ taskCompletion: 80, organization: 80, grammarAndVocabulary: 80 }), expected: '40/50' },
  { name: 'HSK 5: cả ba phần', type: 'HSK_5', prompt: '完成八个句子排序题，并用“周末、朋友、图书馆、学习、帮助”写一段话，再根据志愿者整理书架的图片写一段话。',
    essay: '第一部分：91. 我喜欢在图书馆看书。92. 他每天早上去跑步。93. 这本书是朋友送给我的。94. 我已经完成了今天的作业。95. 她比我早到十分钟。96. 因为下雨所以我们没有出去。97. 请把这本书放在桌子上。98. 只要努力就一定会有进步。\n第二部分：周末，我和朋友一起去图书馆学习。我们先复习了上周的课程，然后互相提出问题。他帮助我理解了一段比较难的课文，我也向他介绍了记忆新词的方法。经过两个小时的练习，我们都觉得学习效率提高了。\n第三部分：图片中的年轻人正在图书馆整理书架。他先把读者归还的书分类，再按照编号放回原来的位置。虽然这份工作需要耐心，但他一直认真地检查。整齐的书架使读者更容易找到需要的书，也让图书馆变得更加舒适。',
    provider: { ...result({ part1_ordering: 35, part2_keywords: 24, part3_picture: 24 }), hsk5Parts: { part1: { score: 35, maxScore: 40, items: [] }, part2: { score: 24, maxScore: 30 }, part3: { score: 24, maxScore: 30 } } }, expected: '83/100' },
  { name: 'HSK 6: tóm tắt', type: 'HSK_6', prompt: '阅读李明回乡建立图书馆的故事，根据原文写一篇约四百字的缩写，不加入个人意见。', essay: chineseSummary,
    provider: result({ grammar: 80, vocabulary: 80, taskFulfillment: 80 }), expected: '80/100' },
]
