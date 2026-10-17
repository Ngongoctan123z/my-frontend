export interface FallbackPromptItem {
  content: string
  imageUrl?: string | null
  imageDescription?: string
}

export interface PairedExamSet {
  id: number
  title: string
  part1: FallbackPromptItem
  part2: FallbackPromptItem
}

// ==========================================
// TOEIC FALLBACK PROMPTS & PAIRED SETS
// ==========================================
export const TOEIC_RESPOND_FALLBACKS: FallbackPromptItem[] = [
  {
    content: `Directions: Read the email below. Respond to the email as if you are the Customer Service Manager. In your email, apologize for the delay, explain the reason, and offer a suitable resolution.

From: Michael Davies <m.davies@apexlogistics.com>
To: Support Department <service@techworld.com>
Subject: Inquiry regarding delayed shipment #TW-89241
Date: October 12

Dear TechWorld Support Team,
I am writing to inquire about our corporate computer equipment order placed two weeks ago (Order #TW-89241). The tracking status has not updated in five days, and our team is urgently waiting for these laptops to begin an upcoming client project.
Could you please provide an updated delivery timeline? Furthermore, what compensation or expedited options can your company offer for this unexpected delay?

Sincerely,
Michael Davies
Operations Director, Apex Logistics`
  },
  {
    content: `Directions: Read the email below. Respond to the email as if you are the Human Resources Coordinator. In your email, thank the candidate, confirm the interview schedule, and provide two instructions regarding preparation.

From: Sarah Jenkins <s.jenkins@email.com>
To: HR Department <careers@innova-corp.com>
Subject: Senior Marketing Specialist Interview Confirmation
Date: November 3

Dear Hiring Team,
Thank you very much for inviting me to interview for the Senior Marketing Specialist position next Tuesday at 10:00 AM.
I would like to confirm whether the interview will be held in person at your headquarters or via video conference. Additionally, could you let me know if I should prepare a portfolio presentation of my previous campaign projects?

Best regards,
Sarah Jenkins`
  }
]

export const TOEIC_ESSAY_FALLBACKS: FallbackPromptItem[] = [
  {
    content: `Directions: Read the question below. You have 30 minutes to plan, write, and revise an essay of at least 300 words. Give reasons and examples to support your opinion.

Question:
Some companies allow their employees to work remotely from home several days a week, while other companies require all staff to work in the office every day.
Which approach do you believe is more beneficial for overall productivity and employee satisfaction? Support your opinion with specific reasons and examples.`
  },
  {
    content: `Directions: Read the question below. You have 30 minutes to plan, write, and revise an essay of at least 300 words. Give reasons and examples to support your opinion.

Question:
Do you agree or disagree with the following statement?
"It is more important for a company to invest in employee training and professional development than to offer higher starting salaries to attract new talent."
Use specific reasons and examples to explain your position.`
  }
]

export const TOEIC_PAIRED_SETS: PairedExamSet[] = [
  {
    id: 1,
    title: 'Bộ đề TOEIC số #1 (Chuẩn Barem ETS)',
    part1: TOEIC_RESPOND_FALLBACKS[0],
    part2: TOEIC_ESSAY_FALLBACKS[0],
  },
  {
    id: 2,
    title: 'Bộ đề TOEIC số #2 (Chuẩn Barem ETS)',
    part1: TOEIC_RESPOND_FALLBACKS[1],
    part2: TOEIC_ESSAY_FALLBACKS[1],
  }
]

// ==========================================
// TOPIK FALLBACK PROMPTS (51, 52, 53, 54)
// ==========================================
export const TOPIK_51_FALLBACKS: FallbackPromptItem[] = [
  {
    content: `다음 글을 읽고 ㉠과 ㉡에 들어갈 말을 각각 한 문장으로 쓰십시오. (각 5점, 총 10점)

[기숙사 세탁실 이용 안내]
학생 여러분, 기숙사 지하 1층 세탁실 이용에 관한 안내 말씀드립니다.
최근 세탁기 사용 후 빨래를 제때 찾아가지 않아 다른 학생들이 큰 불편을 겪고 있습니다.
따라서 세탁이 완료되면 즉시 세탁물을 ( ㉠ ).
또한, 밤 11시 이후에는 다른 학생들의 수면을 위해 세탁실 이용을 ( ㉡ ).
학생 여러분의 적극적인 협조 부탁드립니다.`
  },
  {
    content: `다음 글을 읽고 ㉠과 ㉡에 들어갈 말을 각각 한 문장으로 쓰십시오. (각 5점, 총 10점)

[동아리 신입 회원 모집]
한국어 회화 동아리 '한울'에서 2학기 신입 회원을 모집합니다.
외국인 유학생과 한국인 학생이 함께 모여 자유롭게 대화하고 문화를 교류하는 모임입니다.
한국어 말하기 실력을 키우고 싶은 학생은 누구나 ( ㉠ ).
지원을 원하는 분은 이번 주 금요일까지 지원서를 ( ㉡ ).
많은 관심과 참여 바랍니다.`
  }
]

export const TOPIK_52_FALLBACKS: FallbackPromptItem[] = [
  {
    content: `다음 글을 읽고 ㉠과 ㉡에 들어갈 말을 각각 한 문장으로 쓰십시오. (각 5점, 총 10점)

사람들은 보통 잠을 잘 때 방의 불을 끄고 잡니다. 어두운 환경이어야 수면 유도 호르몬인 멜라토닌이 원활하게 분비되기 때문입니다. 만약 조명을 켜 둔 채 잠을 자면 멜라토닌이 충분히 ( ㉠ ). 그 결과 깊은 잠에 들지 못하고 자주 깨게 됩니다. 따라서 편안하고 깊은 잠을 자기 위해서는 잠들기 전에 실내를 어둡게 ( ㉡ ) 것이 좋습니다.`
  },
  {
    content: `다음 글을 읽고 ㉠과 ㉡에 들어갈 말을 각각 한 문장으로 쓰십시오. (각 5점, 총 10점)

나무는 계절의 변화에 따라 다양한 모습을 보입니다. 특히 가을이 되면 초록색 잎이 붉거나 노란 단풍으로 물듭니다. 기온이 떨어지면 잎 속의 엽록소가 파괴되면서 숨겨져 있던 다른 색소가 ( ㉠ ). 그리고 겨울이 다가오면 수분 증발을 막기 위해 잎을 ( ㉡ ). 이러한 현상은 나무가 추운 겨울을 견뎌 내기 위한 자연스러운 생존 전략입니다.`
  }
]

export const TOPIK_53_FALLBACKS: FallbackPromptItem[] = [
  {
    content: `다음을 참고하여 '성인의 연간 독서율 변화와 원인'에 대한 글을 200~300자로 쓰십시오. (30점)
단, 글의 제목을 쓰지 마십시오.

[조사 기관] 문화체육관광부 (최근 10년간 만 19세 이상 성인 남녀 2,000명 대상)
[독서율 변화 추이]
- 2013년: 71.4%
- 2018년: 61.2%
- 2023년: 43.0% (지속적인 감소 추세)

[독서율 감소 주요 원인]
- 스마트폰 및 디지털 콘텐츠 이용 증가 (42.5%)
- 학업 및 업무로 인한 시간 부족 (31.0%)
- 독서 습관 미형성 및 흥미 부족 (18.2%)

[향후 과제 및 제언]
- 디지털 독서 플랫폼 활성화 및 맞춤형 독서 동아리 지원 확대 필요`
  }
]

export const TOPIK_54_FALLBACKS: FallbackPromptItem[] = [
  {
    content: `다음을 주제로 하여 자신의 생각을 600~700자로 글로 쓰십시오. (50점)
단, 문제를 그대로 옮겨 쓰지 마십시오.

현대 사회에서 '인공지능(AI) 기술의 급격한 발전'은 일상생활과 산업 전반에 엄청난 혁신을 가져오고 있습니다. 그러나 동시에 인간의 일자리 감소, 창의성 저하, 윤리적 판단 결여 등 여러 우려도 제기되고 있습니다. 이에 대해 아래의 내용을 중심으로 자신의 견해를 논리적으로 서술하십시오.

1. 인공지능 기술의 발전이 현대 사회에 미치는 긍정적인 영향은 무엇인가?
2. 인공지능 발전으로 인해 발생할 수 있는 주요 문제점은 무엇인가?
3. 인공지능과 인간이 조화롭게 공존하기 위해 개인과 사회는 어떠한 노력을 기울여야 하는가?`
  }
]

// ==========================================
// IELTS FALLBACK PROMPTS & PAIRED SETS
// ==========================================
export const IELTS_TASK_1_FALLBACKS: FallbackPromptItem[] = [
  {
    content: `The chart below shows the percentage of households with internet access in three European countries (United Kingdom, Germany, and France) between 2010 and 2022.

Summarize the information by selecting and reporting the main features, and make comparisons where relevant.
Write at least 150 words.`,
    imageUrl: null
  }
]

export const IELTS_TASK_2_FALLBACKS: FallbackPromptItem[] = [
  {
    content: `Some people believe that university education should be free of charge for all eligible citizens, while others argue that higher education should be funded primarily by students and their families.

Discuss both views and give your own opinion. Give reasons for your answer and include any relevant examples from your knowledge or experience.
Write at least 250 words.`
  }
]

export const IELTS_PAIRED_SETS: PairedExamSet[] = [
  {
    id: 1,
    title: 'Bộ đề IELTS số #1 (Cambridge Official)',
    part1: IELTS_TASK_1_FALLBACKS[0],
    part2: IELTS_TASK_2_FALLBACKS[0]
  }
]

// ==========================================
// HSK 5 & 6 FALLBACK PROMPTS
// ==========================================
export const HSK_5_FALLBACKS: FallbackPromptItem[] = [
  {
    content: `HSK 5 书写全套试题 (满分 100 分)

第 91-98 题：完成句子 (每题 5 分，共 40 分)
1. 去 / 打算 / 留学 / 明年 / 他 / 中国
2. 汉语水平 / 提高 / 他的 / 显著 / 得到了
3. 责任 / 对 / 每一个 / 我们 / 要 / 工作 / 负起
4. 被 / 经理 / 方案 / 这个 / 采纳了
5. 环境 / 这里的 / 适合 / 居住 / 非常
6. 他 / 充分 / 把 / 表达了 / 自己的 / 观点
7. 不仅 / 他 / 聪明 / 勤奋 / 而且 / 非常
8. 大家 / 给 / 深刻的 / 留下了 / 印象 / 这次旅行

第 99 题：请结合下列 5 个词语，写一篇 80 字左右的短文。(30 分)
词语：明确, 凭, 严肃, 规矩, 遵守

第 100 题：请结合下列情境写一篇 80 字左右的短文。(30 分)
图片情境：一位年轻人在整洁的书桌前专心致志地看书学习，桌上放着笔记本电脑和咖啡杯。`
  }
]

export const HSK_6_FALLBACKS: FallbackPromptItem[] = [
  {
    content: `HSK 6 书写缩写试题 (满分 100 分，考试时间 45 分钟)

请仔细阅读下面的文章，将其缩写成一篇 400 字左右的短文。
要求：
1. 只需复述文章的主要内容，不要加入自己的观点或评论。
2. 结构完整，语言连贯，表达准确。
3. 字数控制在 350-450 字之间。

【原文】
古时候，有个年轻人名叫李文，自幼酷爱弹琴，希望能成为名扬天下的乐师。他听说远方的伯牙先生琴艺高超，能借琴声引动天地万物之灵，便历经千难万险前去拜师求艺。

李文来到伯牙门下后，勤奋刻苦，日夜苦练指法。三年过去，他的弹奏技巧已非常娴熟，几乎能一字不差地弹奏伯牙传授的所有乐谱。然而，李文总觉得自己琴声平淡无奇，无法像师父那样打动人心。他为此非常苦恼，甚至怀疑自己的天资。

一天，伯牙对李文说：“你的指法已纯熟，但还未能融入自然真情。我带你去东海蓬莱岛拜访我的老师方子春先生，他能教你至高境界。”李文十分高兴，跟随伯牙乘船来到海中一座孤岛上。

伯牙让李文在海岛岩石上独自等候，自己则乘小舟离去。海岛上空无一人，只有波涛汹涌的大海拍打着礁石，海鸟在狂风中鸣叫，森林在风雨中呼啸。李文独自面对浩瀚无垠的天地，心中涌起前所未有的孤独与震撼。他突然明白了师父的用意——大自然才是最伟大的老师！李文抱起古琴，将狂风、巨浪、海鸟之声尽数融入指端琴弦之中。十天后伯牙驾舟归来，听闻李文的琴声悲壮雄浑、感人至深，欣慰地赞叹道：“你已真正领悟了琴道的真谛！”`
  }
]
