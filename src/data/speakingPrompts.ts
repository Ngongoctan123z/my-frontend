export interface SpeakingPrompt {
  id: string
  examType: 'IELTS_SPEAKING' | 'TOEIC_SPEAKING'
  part: string
  topic: string
  questionEn: string
  questionVi: string
  cueCard?: string // For IELTS Part 2
  subQuestions?: string[] // For IELTS Part 1 / Part 3 follow-ups
  suggestedVocabulary?: string[]
  imageUrl?: string // For TOEIC Q3 / Q7-9
  prepTimeSec: number // preparation time in seconds
  speakTimeSec: number // speaking time in seconds
  startGraceSec: number // grace period to hit record before withdrawal
  criteria: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  setId?: string // Links Part 2 and Part 3 together in IELTS
  informationText?: string
  questionNumber?: number
  readingTimeSec?: number
  repeatQuestion?: boolean
}

// ─── IELTS Speaking ─────────────────────────────────────────────────────────

export const IELTS_PART1_PROMPTS: SpeakingPrompt[] = [
  {
    id: 'ielts_p1_hometown',
    examType: 'IELTS_SPEAKING',
    part: 'PART_1',
    topic: 'Hometown & Living',
    questionEn: "Let's talk about where you live. Do you live in a house or an apartment?",
    questionVi: "Hãy nói về nơi bạn sống. Bạn sống trong nhà hay căn hộ?",
    subQuestions: [
      "What do you like most about your home?",
      "Would you prefer to live in the city center or the suburbs? Why?",
      "Have you always lived in the same place?"
    ],
    suggestedVocabulary: ['spacious', 'cozy', 'convenient', 'commute', 'neighborhood', 'facilities', 'community'],
    prepTimeSec: 0,
    speakTimeSec: 45,
    startGraceSec: 15,
    criteria: ['Fluency & Coherence', 'Lexical Resource', 'Grammatical Range', 'Pronunciation'],
    difficulty: 'easy'
  },
  {
    id: 'ielts_p1_study',
    examType: 'IELTS_SPEAKING',
    part: 'PART_1',
    topic: 'Work & Studies',
    questionEn: "Do you work or are you a student?",
    questionVi: "Bạn đang đi làm hay đang là sinh viên?",
    subQuestions: [
      "What do you enjoy most about your work/studies?",
      "What are your plans for the future?",
      "Do you find your work/studies challenging? Why?"
    ],
    suggestedVocabulary: ['major', 'specialize', 'career', 'ambition', 'prospects', 'demanding', 'rewarding'],
    prepTimeSec: 0,
    speakTimeSec: 45,
    startGraceSec: 15,
    criteria: ['Fluency & Coherence', 'Lexical Resource', 'Grammatical Range', 'Pronunciation'],
    difficulty: 'easy'
  },
  {
    id: 'ielts_p1_hobbies',
    examType: 'IELTS_SPEAKING',
    part: 'PART_1',
    topic: 'Hobbies & Leisure',
    questionEn: "What do you like to do in your free time?",
    questionVi: "Bạn thích làm gì trong thời gian rảnh?",
    subQuestions: [
      "How often do you do this activity?",
      "Is this activity popular in your country?",
      "Have your hobbies changed since you were a child?"
    ],
    suggestedVocabulary: ['passionate', 'unwind', 'leisure', 'recreational', 'pursue', 'dedicate', 'enthusiasm'],
    prepTimeSec: 0,
    speakTimeSec: 45,
    startGraceSec: 15,
    criteria: ['Fluency & Coherence', 'Lexical Resource', 'Grammatical Range', 'Pronunciation'],
    difficulty: 'easy'
  },
  {
    id: 'ielts_p1_technology',
    examType: 'IELTS_SPEAKING',
    part: 'PART_1',
    topic: 'Digital Technology',
    questionEn: "How important is technology in your daily life?",
    questionVi: "Công nghệ quan trọng như thế nào trong cuộc sống hàng ngày của bạn?",
    subQuestions: [
      "Which technological device can you not live without?",
      "Do you think people are too dependent on technology nowadays?",
      "How has technology changed the way people communicate?"
    ],
    suggestedVocabulary: ['indispensable', 'connectivity', 'digital', 'dependence', 'innovation', 'streamline', 'revolutionize'],
    prepTimeSec: 0,
    speakTimeSec: 45,
    startGraceSec: 15,
    criteria: ['Fluency & Coherence', 'Lexical Resource', 'Grammatical Range', 'Pronunciation'],
    difficulty: 'medium'
  },
  {
    id: 'ielts_p1_food',
    examType: 'IELTS_SPEAKING',
    part: 'PART_1',
    topic: 'Food & Culinary',
    questionEn: "What is your favorite type of food?",
    questionVi: "Món ăn yêu thích của bạn là gì?",
    subQuestions: [
      "Do you prefer cooking at home or eating out?",
      "Have your food preferences changed as you've grown older?",
      "Is there any food you absolutely cannot eat?"
    ],
    suggestedVocabulary: ['cuisine', 'flavor', 'savory', 'nutritious', 'aromatic', 'heritage', 'culinary'],
    prepTimeSec: 0,
    speakTimeSec: 45,
    startGraceSec: 15,
    criteria: ['Fluency & Coherence', 'Lexical Resource', 'Grammatical Range', 'Pronunciation'],
    difficulty: 'easy'
  },
]
// ─── IELTS Part 2 (Long Turn) ────────────────────────────────────────────────

export const IELTS_PART2_PROMPTS: SpeakingPrompt[] = [
  {
    id: 'ielts_p2_person',
    examType: 'IELTS_SPEAKING',
    part: 'PART_2',
    topic: 'An Influential Person',
    setId: 'set_role_model',
    questionEn: "Describe a person who has had a significant influence on your life.",
    questionVi: "Mô tả một người đã có ảnh hưởng lớn đến cuộc sống của bạn.",
    cueCard: `You should say:
• Who this person is
• How long you have known them
• What qualities make them special
• And explain how they have influenced your life`,
    suggestedVocabulary: ['mentor', 'inspire', 'transform', 'guidance', 'perseverance', 'admire', 'pivotal', 'profound', 'compassionate', 'resilience'],
    prepTimeSec: 60,
    speakTimeSec: 120,
    startGraceSec: 15,
    criteria: ['Fluency & Coherence', 'Lexical Resource', 'Grammatical Range', 'Pronunciation'],
    difficulty: 'medium'
  },
  {
    id: 'ielts_p2_place',
    examType: 'IELTS_SPEAKING',
    part: 'PART_2',
    topic: 'A Memorable Place',
    setId: 'set_travel_tourism',
    questionEn: "Describe a place you have visited that made a strong impression on you.",
    questionVi: "Mô tả một nơi bạn đã đến và để lại ấn tượng mạnh với bạn.",
    cueCard: `You should say:
• Where this place is
• When you went there
• What you did there
• And explain why it made such a strong impression on you`,
    suggestedVocabulary: ['breathtaking', 'serene', 'vibrant', 'bustling', 'tranquil', 'awe-inspiring', 'picturesque', 'immerse', 'stunning', 'memorable'],
    prepTimeSec: 60,
    speakTimeSec: 120,
    startGraceSec: 15,
    criteria: ['Fluency & Coherence', 'Lexical Resource', 'Grammatical Range', 'Pronunciation'],
    difficulty: 'medium'
  },
  {
    id: 'ielts_p2_achievement',
    examType: 'IELTS_SPEAKING',
    part: 'PART_2',
    topic: 'A Proud Achievement',
    setId: 'set_achievement',
    questionEn: "Describe an achievement you are proud of.",
    questionVi: "Mô tả một thành tích mà bạn tự hào.",
    cueCard: `You should say:
• What the achievement was
• When you achieved it
• How you achieved it
• And explain why you are proud of it`,
    suggestedVocabulary: ['accomplishment', 'perseverance', 'dedication', 'milestone', 'triumph', 'overcome', 'determination', 'recognition', 'satisfaction', 'breakthrough'],
    prepTimeSec: 60,
    speakTimeSec: 120,
    startGraceSec: 15,
    criteria: ['Fluency & Coherence', 'Lexical Resource', 'Grammatical Range', 'Pronunciation'],
    difficulty: 'medium'
  },
  {
    id: 'ielts_p2_book',
    examType: 'IELTS_SPEAKING',
    part: 'PART_2',
    topic: 'An Inspiring Book or Film',
    setId: 'set_culture',
    questionEn: "Describe a book or film that changed your way of thinking.",
    questionVi: "Mô tả một cuốn sách hoặc bộ phim đã thay đổi cách suy nghĩ của bạn.",
    cueCard: `You should say:
• What the book/film was about
• When you read/watched it
• What the main message or theme was
• And explain how it changed your perspective`,
    suggestedVocabulary: ['thought-provoking', 'narrative', 'profound', 'perspective', 'philosophical', 'resonated', 'worldview', 'impactful', 'insightful', 'transformative'],
    prepTimeSec: 60,
    speakTimeSec: 120,
    startGraceSec: 15,
    criteria: ['Fluency & Coherence', 'Lexical Resource', 'Grammatical Range', 'Pronunciation'],
    difficulty: 'hard'
  },
  {
    id: 'ielts_p2_skill',
    examType: 'IELTS_SPEAKING',
    part: 'PART_2',
    topic: 'Learning a New Skill',
    setId: 'set_education',
    questionEn: "Describe a skill you would like to learn.",
    questionVi: "Mô tả một kỹ năng bạn muốn học.",
    cueCard: `You should say:
• What skill this is
• Why you want to learn it
• How you would go about learning it
• And explain how learning this skill would benefit you`,
    suggestedVocabulary: ['proficiency', 'acquire', 'master', 'endeavor', 'practical', 'discipline', 'ambition', 'versatile', 'marketable', 'dedication'],
    prepTimeSec: 60,
    speakTimeSec: 120,
    startGraceSec: 15,
    criteria: ['Fluency & Coherence', 'Lexical Resource', 'Grammatical Range', 'Pronunciation'],
    difficulty: 'easy'
  },
]

// ─── IELTS Part 3 (Discussion) ───────────────────────────────────────────────

export const IELTS_PART3_PROMPTS: SpeakingPrompt[] = [
  {
    id: 'ielts_p3_leadership',
    examType: 'IELTS_SPEAKING',
    part: 'PART_3',
    topic: 'Leadership & Role Models',
    setId: 'set_role_model',
    questionEn: "What qualities make a truly effective leader in society today?",
    questionVi: "Những phẩm chất nào tạo nên một nhà lãnh đạo thực sự hiệu quả trong xã hội ngày nay?",
    subQuestions: [
      "Do you think people are born leaders or can anyone learn to lead?",
      "How do modern role models differ from those in the past?",
      "Can celebrities be considered good role models for children?"
    ],
    suggestedVocabulary: ['integrity', 'empathy', 'visionary', 'charisma', 'accountability', 'delegate', 'influence', 'societal values', 'ethical', 'inspirational'],
    prepTimeSec: 0,
    speakTimeSec: 60,
    startGraceSec: 15,
    criteria: ['Fluency & Coherence', 'Lexical Resource', 'Grammatical Range', 'Pronunciation'],
    difficulty: 'hard'
  },
  {
    id: 'ielts_p3_tourism',
    examType: 'IELTS_SPEAKING',
    part: 'PART_3',
    topic: 'Tourism & Cultural Impact',
    setId: 'set_travel_tourism',
    questionEn: "How does international tourism impact local communities and historical heritage?",
    questionVi: "Du lịch quốc tế tác động như thế nào đến cộng đồng địa phương và di sản lịch sử?",
    subQuestions: [
      "What can governments do to promote eco-friendly sustainable tourism?",
      "Do historical sites benefit or suffer from large crowds of visitors?",
      "Will virtual reality ever replace physical travel in the future?"
    ],
    suggestedVocabulary: ['overtourism', 'preservation', 'economic stimulus', 'commercialization', 'cultural preservation', 'sustainable travel', 'footprint', 'revenue', 'authenticity', 'degradation'],
    prepTimeSec: 0,
    speakTimeSec: 60,
    startGraceSec: 15,
    criteria: ['Fluency & Coherence', 'Lexical Resource', 'Grammatical Range', 'Pronunciation'],
    difficulty: 'hard'
  },
  {
    id: 'ielts_p3_success',
    examType: 'IELTS_SPEAKING',
    part: 'PART_3',
    topic: 'Success & Modern Ambition',
    setId: 'set_achievement',
    questionEn: "How do societal definitions of personal success change across different generations?",
    questionVi: "Định nghĩa của xã hội về thành công cá nhân thay đổi như thế nào qua các thế hệ khác nhau?",
    subQuestions: [
      "Is financial wealth still the primary indicator of success?",
      "How does social media influence how young people perceive their own achievements?",
      "Can failure be more educational than success?"
    ],
    suggestedVocabulary: ['materialistic', 'fulfillment', 'societal expectations', 'pressure', 'validation', 'resilience', 'benchmark', 'work-life harmony', 'well-being', 'prosperity'],
    prepTimeSec: 0,
    speakTimeSec: 60,
    startGraceSec: 15,
    criteria: ['Fluency & Coherence', 'Lexical Resource', 'Grammatical Range', 'Pronunciation'],
    difficulty: 'hard'
  },
  {
    id: 'ielts_p3_education',
    examType: 'IELTS_SPEAKING',
    part: 'PART_3',
    topic: 'Modern Education Systems',
    setId: 'set_education',
    questionEn: "Some people believe that education systems focus too much on academic subjects. What is your view?",
    questionVi: "Một số người cho rằng hệ thống giáo dục tập trung quá nhiều vào các môn học thuật. Ý kiến của bạn?",
    subQuestions: [
      "How important are practical life skills compared to academic knowledge?",
      "How has digital education changed learning over the past few decades?",
      "What skills do you think schools must focus on for future careers?"
    ],
    suggestedVocabulary: ['curriculum', 'holistic', 'vocational', 'critical thinking', 'pedagogical', 'nurture', 'aptitude', 'assessment', 'employability', 'well-rounded'],
    prepTimeSec: 0,
    speakTimeSec: 60,
    startGraceSec: 15,
    criteria: ['Fluency & Coherence', 'Lexical Resource', 'Grammatical Range', 'Pronunciation'],
    difficulty: 'hard'
  },
  {
    id: 'ielts_p3_globalization',
    examType: 'IELTS_SPEAKING',
    part: 'PART_3',
    topic: 'Global Media & Culture',
    setId: 'set_culture',
    questionEn: "How has global mass media affected national identity and local cultural traditions?",
    questionVi: "Các phương tiện truyền thông toàn cầu đã ảnh hưởng như thế nào đến bản sắc dân tộc và truyền thống văn hóa địa phương?",
    subQuestions: [
      "Do you think cultural diversity is under threat in the modern world?",
      "What are the advantages and disadvantages of cross-border cultural exchange?",
      "Should governments intervene to protect traditional arts and cinema?"
    ],
    suggestedVocabulary: ['homogenization', 'cultural heritage', 'assimilation', 'indigenous', 'intercultural', 'westernization', 'authenticity', 'preservation', 'erosion', 'multiculturalism'],
    prepTimeSec: 0,
    speakTimeSec: 60,
    startGraceSec: 15,
    criteria: ['Fluency & Coherence', 'Lexical Resource', 'Grammatical Range', 'Pronunciation'],
    difficulty: 'hard'
  },
]

// ─── TOEIC Speaking ─────────────────────────────────────────────────────────

export const TOEIC_Q1_2_PROMPTS: SpeakingPrompt[] = [
  {
    id: 'toeic_q1_picnic',
    examType: 'TOEIC_SPEAKING',
    part: 'Q1_2',
    topic: 'Company Annual Picnic',
    questionEn: `Attention all employees. The company annual picnic will be held this Saturday, June 15th, at Riverside Park, starting at 11 AM. Lunch will be provided. Please bring your family members. There will be games, prizes, and live music. In case of rain, the event will be rescheduled to the following Saturday.`,
    questionVi: "Thông báo cho tất cả nhân viên. Buổi dã ngoại thường niên của công ty sẽ được tổ chức vào thứ Bảy này, ngày 15 tháng 6, tại Công viên Riverside, bắt đầu lúc 11 giờ sáng. Bữa trưa sẽ được chuẩn bị sẵn. Hãy mời các thành viên gia đình tham gia. Sẽ có trò chơi, giải thưởng và âm nhạc trực tiếp.",
    suggestedVocabulary: ['annual', 'provided', 'rescheduled', 'following', 'employees', 'prizes'],
    prepTimeSec: 45,
    speakTimeSec: 45,
    startGraceSec: 15,
    criteria: ['Pronunciation', 'Intonation', 'Stress', 'Pacing', 'Clarity'],
    difficulty: 'easy'
  },
  {
    id: 'toeic_q2_health_clinic',
    examType: 'TOEIC_SPEAKING',
    part: 'Q1_2',
    topic: 'Health Center Helpline',
    questionEn: `Thank you for calling Meridian Health Center. Our office hours are Monday through Friday, from eight AM to six PM. We are also open on Saturdays from nine AM to one PM. For prescription refills, please press one. To schedule an appointment, press two. For billing inquiries, press three. To speak with a representative, please stay on the line.`,
    questionVi: "Cảm ơn bạn đã gọi đến Trung tâm Y tế Meridian. Giờ làm việc của chúng tôi là từ thứ Hai đến thứ Sáu, từ 8 giờ sáng đến 6 giờ chiều. Chúng tôi cũng mở cửa vào thứ Bảy từ 9 giờ sáng đến 1 giờ chiều. Để nhận lại thuốc theo đơn, vui lòng bấm phím 1. Để đặt lịch hẹn, bấm phím 2.",
    suggestedVocabulary: ['prescription', 'refills', 'billing', 'inquiries', 'representative', 'schedule'],
    prepTimeSec: 45,
    speakTimeSec: 45,
    startGraceSec: 15,
    criteria: ['Pronunciation', 'Intonation', 'Stress', 'Pacing', 'Clarity'],
    difficulty: 'easy'
  },
]

export const TOEIC_Q3_PROMPTS: SpeakingPrompt[] = [
  {
    id: 'toeic_q3_office',
    examType: 'TOEIC_SPEAKING',
    part: 'Q3',
    topic: 'Office Team Meeting',
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=900&auto=format&fit=crop&q=80',
    questionEn: "Describe what you see in the picture. Include as many details as possible (location, people, actions, background).",
    questionVi: "Mô tả bức ảnh này thật chi tiết: địa điểm, số người, trang phục, hành động và hậu cảnh.",
    suggestedVocabulary: ['in the foreground', 'in the background', 'on the left/right', 'appears to be', 'collaborating', 'holding documents', 'pointing at the laptop', 'modern workspace'],
    prepTimeSec: 45,
    speakTimeSec: 45,
    startGraceSec: 15,
    criteria: ['Pronunciation', 'Vocabulary', 'Coherence', 'Detail', 'Grammar'],
    difficulty: 'medium'
  },
  {
    id: 'toeic_q3_cafe',
    examType: 'TOEIC_SPEAKING',
    part: 'Q3',
    topic: 'Busy Coffee Shop',
    imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=900&auto=format&fit=crop&q=80',
    questionEn: "Describe what you see in the picture. Focus on the setting, customer activities, and the overall atmosphere.",
    questionVi: "Mô tả những gì bạn thấy trong quán cafe: không gian, hoạt động của khách hàng và bầu không khí chung.",
    suggestedVocabulary: ['bustling cafe', 'patrons', 'sitting by the window', 'working on laptops', 'sipping beverages', 'counter', 'natural light', 'casual atmosphere'],
    prepTimeSec: 45,
    speakTimeSec: 45,
    startGraceSec: 15,
    criteria: ['Pronunciation', 'Vocabulary', 'Coherence', 'Detail', 'Grammar'],
    difficulty: 'medium'
  },
]

export const TOEIC_Q4_6_PROMPTS: SpeakingPrompt[] = [
  {
    id: 'toeic_q4_6_travel',
    examType: 'TOEIC_SPEAKING',
    part: 'Q4_6',
    topic: 'Business Travel Habits',
    questionEn: `Imagine that a market research firm is conducting an interview about business travel.
Question 4: How often do you travel for work, and where do you usually go?`,
    questionVi: "Hãy tưởng tượng một công ty nghiên cứu thị trường đang phỏng vấn bạn về việc đi công tác.\nCâu 4: Bạn đi công tác bao nhiêu lần một năm và thường đến đâu?",
    subQuestions: [
      "Question 5: What is the most challenging or stressful part of traveling for work?",
      "Question 6: What services or benefits should companies provide to make business travel more comfortable for staff?"
    ],
    suggestedVocabulary: ['frequently', 'destination', 'itinerary', 'accommodation', 'jet lag', 'productivity', 'reimbursement', 'schedule', 'conference', 'convenient'],
    prepTimeSec: 3,
    speakTimeSec: 30,
    startGraceSec: 15,
    criteria: ['Pronunciation', 'Vocabulary', 'Fluency', 'Relevance', 'Grammar'],
    difficulty: 'medium'
  },
  {
    id: 'toeic_q4_6_shopping',
    examType: 'TOEIC_SPEAKING',
    part: 'Q4_6',
    topic: 'Online vs In-Store Shopping',
    questionEn: `Imagine that a retail magazine is conducting a telephone survey about consumer shopping habits.
Question 4: When was the last time you bought clothes, and did you buy them online or in a physical store?`,
    questionVi: "Hãy tưởng tượng một tạp chí bán lẻ đang phỏng vấn bạn về thói quen mua sắm.\nCâu 4: Lần gần đây nhất bạn mua quần áo là khi nào, mua online hay tại cửa hàng?",
    subQuestions: [
      "Question 5: Do you usually read customer reviews before purchasing an unfamiliar product online?",
      "Question 6: What factors influence your decision the most when choosing where to buy household items: price, quality, or return policy?"
    ],
    suggestedVocabulary: ['fitting room', 'customer reviews', 'return policy', 'discount', 'convenience', 'e-commerce platform', 'retail outlet', 'quality assurance'],
    prepTimeSec: 3,
    speakTimeSec: 30,
    startGraceSec: 15,
    criteria: ['Pronunciation', 'Vocabulary', 'Fluency', 'Relevance', 'Grammar'],
    difficulty: 'medium'
  },
]

export const TOEIC_Q7_9_PROMPTS: SpeakingPrompt[] = [
  {
    id: 'toeic_q7_9_conference',
    examType: 'TOEIC_SPEAKING',
    part: 'Q7_9',
    topic: 'Tech Conference Schedule',
    imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&auto=format&fit=crop&q=80',
    questionEn: `You will answer three questions based on the conference agenda below:
**Asia Tech Summit — Day 1 Schedule**
• 08:30 AM: Registration & Welcome Coffee (Lobby)
• 09:30 AM: Keynote by Dr. Kevin Lee: "AI in Healthcare" (Main Hall)
• 11:00 AM: Workshop: "Cloud Security Best Practices" — Room 3B
• 12:30 PM: Networking Lunch (Dining Hall)
• 02:00 PM: Panel: "Startup Funding in 2025" (Room 2A)
• 04:00 PM: Product Showcase & Demos (Exhibition Center)

Question 7: What time does Dr. Kevin Lee's keynote start, and what is the topic?`,
    questionVi: "Bạn sẽ trả lời ba câu hỏi dựa trên lịch trình hội nghị Công nghệ Châu Á:\nCâu 7: Bài phát biểu của Tiến sĩ Kevin Lee bắt đầu lúc mấy giờ và chủ đề là gì?",
    subQuestions: [
      "Question 8: I have an urgent meeting at 11 AM. Will I miss the Startup Funding panel?",
      "Question 9: Can you give me the full details of all sessions taking place in the afternoon?"
    ],
    suggestedVocabulary: ['keynote', 'panel discussion', 'registration', 'exhibition', 'concurrent sessions', 'takes place', 'scheduled for', 'agenda'],
    prepTimeSec: 45,
    speakTimeSec: 30,
    startGraceSec: 15,
    criteria: ['Pronunciation', 'Accuracy', 'Coherence', 'Completeness'],
    difficulty: 'medium'
  },
]

export const TOEIC_Q10_11_PROMPTS: SpeakingPrompt[] = [
  {
    id: 'toeic_q10_remote_work',
    examType: 'TOEIC_SPEAKING',
    part: 'Q10_11',
    topic: 'Permanent Remote Work Policy',
    questionEn: "Do you agree or disagree with the following statement? Companies should allow all employees to work from home permanently. Give specific reasons and examples to support your opinion.",
    questionVi: "Bạn đồng ý hay không đồng ý với nhận định sau? Các công ty nên cho phép tất cả nhân viên làm việc từ xa vĩnh viễn. Hãy đưa ra lý do và ví dụ cụ thể để làm rõ quan điểm của bạn.",
    suggestedVocabulary: ['productivity', 'collaboration', 'flexibility', 'accountability', 'work-life balance', 'supervision', 'isolation', 'efficiency', 'commute', 'infrastructure'],
    prepTimeSec: 45,
    speakTimeSec: 60,
    startGraceSec: 15,
    criteria: ['Pronunciation', 'Vocabulary', 'Grammar', 'Coherence', 'Reasoning'],
    difficulty: 'hard'
  },
  {
    id: 'toeic_q11_online_shopping',
    examType: 'TOEIC_SPEAKING',
    part: 'Q10_11',
    topic: 'Future of Brick-and-Mortar Retail',
    questionEn: "Do you agree or disagree with the following statement? E-commerce and online shopping will completely replace traditional physical stores within the next ten years. Give reasons and examples to support your view.",
    questionVi: "Bạn đồng ý hay không đồng ý với nhận định sau? Thương mại điện tử sẽ hoàn toàn thay thế các cửa hàng truyền thống trong 10 năm tới. Hãy đưa ra lý do và ví dụ để hỗ trợ quan điểm của bạn.",
    suggestedVocabulary: ['e-commerce', 'consumer behavior', 'convenience', 'physical experience', 'supply chain', 'brick-and-mortar', 'digital transformation', 'retail', 'preferences', 'sustainable'],
    prepTimeSec: 45,
    speakTimeSec: 60,
    startGraceSec: 15,
    criteria: ['Pronunciation', 'Vocabulary', 'Grammar', 'Coherence', 'Reasoning'],
    difficulty: 'hard'
  },
]

// ─── Lookup helpers ──────────────────────────────────────────────────────────

export type SpeakingPart =
  | 'PART_1' | 'PART_2' | 'PART_3'
  | 'Q1_2' | 'Q3' | 'Q4_6' | 'Q7_9' | 'Q10_11'
  | 'Q3_4' | 'Q5_7' | 'Q8_10' | 'Q11'

export function getPromptsForPart(examType: 'IELTS_SPEAKING' | 'TOEIC_SPEAKING', part: SpeakingPart): SpeakingPrompt[] {
  if (examType === 'IELTS_SPEAKING') {
    if (part === 'PART_1') return IELTS_PART1_PROMPTS
    if (part === 'PART_2') return IELTS_PART2_PROMPTS
    if (part === 'PART_3') return IELTS_PART3_PROMPTS
  } else {
    if (part === 'Q1_2') return TOEIC_Q1_2_PROMPTS
    if (part === 'Q3' || part === 'Q3_4') return TOEIC_Q3_PROMPTS.map(p => ({ ...p, part: 'Q3_4', speakTimeSec: 30 }))
    if (part === 'Q4_6' || part === 'Q5_7') return TOEIC_Q4_6_PROMPTS.map(p => ({ ...p, part: 'Q5_7', speakTimeSec: 15 }))
    if (part === 'Q7_9' || part === 'Q8_10') return TOEIC_Q7_9_PROMPTS.map(p => ({ ...p, part: 'Q8_10' }))
    if (part === 'Q10_11' || part === 'Q11') return TOEIC_Q10_11_PROMPTS.map(p => ({ ...p, part: 'Q11' }))
  }
  return []
}

/**
 * Returns a linked Part 3 prompt matching the setId of a Part 2 prompt (for IELTS paired topics)
 */
export function getLinkedIeltsPart3(part2Prompt: SpeakingPrompt): SpeakingPrompt | null {
  if (!part2Prompt.setId) return null
  return IELTS_PART3_PROMPTS.find(p => p.setId === part2Prompt.setId) ?? null
}

export const PART_META: Record<SpeakingPart, { labelEn: string; labelVi: string; descVi: string; defaultPrep: number; defaultSpeak: number }> = {
  PART_1: { labelEn: 'Part 1', labelVi: 'Phần 1', descVi: 'Interview & Introduction — Câu hỏi ngắn về bản thân', defaultPrep: 0, defaultSpeak: 45 },
  PART_2: { labelEn: 'Part 2', labelVi: 'Phần 2', descVi: 'Long Turn — Cue card, 1 phút chuẩn bị, 2 phút nói', defaultPrep: 60, defaultSpeak: 120 },
  PART_3: { labelEn: 'Part 3', labelVi: 'Phần 3', descVi: 'Discussion — Phân tích chuyên sâu, so sánh, dự đoán', defaultPrep: 0, defaultSpeak: 60 },
  Q1_2: { labelEn: 'Q1-2', labelVi: 'Câu 1-2', descVi: 'Read aloud — Đọc to đoạn văn bản theo ngữ điệu chuẩn', defaultPrep: 45, defaultSpeak: 45 },
  Q3: { labelEn: 'Q3', labelVi: 'Câu 3', descVi: 'Describe a picture — Mô tả chi tiết bức ảnh trong phòng thi', defaultPrep: 45, defaultSpeak: 45 },
  Q4_6: { labelEn: 'Q4-6', labelVi: 'Câu 4-6', descVi: 'Respond to questions — Trả lời tình huống phỏng vấn', defaultPrep: 3, defaultSpeak: 30 },
  Q7_9: { labelEn: 'Q7-9', labelVi: 'Câu 7-9', descVi: 'Respond using information — Trả lời theo lịch trình/bảng biểu', defaultPrep: 45, defaultSpeak: 30 },
  Q10_11: { labelEn: 'Q10-11', labelVi: 'Câu 10-11', descVi: 'Express an opinion — Trình bày quan điểm cá nhân', defaultPrep: 45, defaultSpeak: 60 },
  Q3_4: { labelEn: 'Q3–4', labelVi: 'Câu 3–4', descVi: 'Describe a picture — Miêu tả ảnh', defaultPrep: 45, defaultSpeak: 30 },
  Q5_7: { labelEn: 'Q5–7', labelVi: 'Câu 5–7', descVi: 'Respond to questions — Trả lời câu hỏi', defaultPrep: 3, defaultSpeak: 15 },
  Q8_10: { labelEn: 'Q8–10', labelVi: 'Câu 8–10', descVi: 'Use information — Trả lời dựa trên thông tin', defaultPrep: 3, defaultSpeak: 15 },
  Q11: { labelEn: 'Q11', labelVi: 'Câu 11', descVi: 'Express an opinion — Nêu quan điểm', defaultPrep: 45, defaultSpeak: 60 },
}

