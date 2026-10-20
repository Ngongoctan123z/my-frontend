import Link from 'next/link'
import { ArrowRight, Mic, PenTool, Check } from 'lucide-react'

// Static homepage content stays on the server; URL-selected language needs no
// client router state or hydration bundle.
export function HomeClient({ language = 'vi', heading, description }: { language?: 'vi' | 'en'; heading?: string; description?: string }) {
  const en = language === 'en'
  const prefix = en ? '/en' : ''
  const exams = [
    { slug: 'ielts', name: 'IELTS Writing', detail: en ? 'Academic Task 1 charts, maps and processes; Task 2 essays. Review task response, organisation, vocabulary and grammar.' : 'Academic Task 1: biểu đồ, bản đồ, quy trình; Task 2: bài luận. Xem nhận xét về hoàn thành đề, bố cục, từ vựng và ngữ pháp.' },
    { slug: 'toeic', name: 'TOEIC Writing', detail: en ? 'Practise five picture sentences, two email responses and an opinion essay across all eight questions.' : 'Luyện đủ tám câu: năm câu viết theo ảnh, hai email phản hồi và một bài luận quan điểm.' },
    { slug: 'topik', name: 'TOPIK II Writing', detail: en ? 'Practise questions 51–54: complete sentences, describe data and develop a Korean essay.' : 'Luyện câu 51–54: hoàn thành câu, trình bày số liệu và triển khai bài luận tiếng Hàn.' },
    { slug: 'hsk', name: 'HSK 5 & HSK 6 Writing', detail: en ? 'Arrange sentences, write an 80-character passage and practise a 400-character summary.' : 'Sắp xếp câu, viết đoạn khoảng 80 chữ và luyện tóm tắt khoảng 400 chữ tiếng Trung.' },
  ]
  const sections = [
    { href: en ? '/en/ai-grader' : '/ai-grader', title: en ? 'Writing Practice' : 'Luyện Writing', icon: PenTool, detail: 'IELTS · TOEIC · TOPIK · HSK', description: en ? 'Write, submit and learn from detailed grammar, vocabulary and task feedback.' : 'Viết bài, nộp chấm và cải thiện ngữ pháp, từ vựng qua nhận xét chi tiết.', color: 'text-blue-600 bg-blue-50' },
    { href: '/speaking', title: en ? 'Speaking Practice' : 'Luyện Speaking', icon: Mic, detail: 'IELTS · TOEIC', description: en ? 'Record your answer, listen again, review the recognized transcript and receive feedback.' : 'Ghi âm, nghe lại, xem lời nói máy nhận được và nhận góp ý để nói tốt hơn.', color: 'text-emerald-600 bg-emerald-50' },
  ]
  return <div className="mx-auto w-full max-w-5xl px-1 py-12 sm:px-4 md:py-20">
    <section className="mx-auto max-w-2xl text-center">
      <p className="mb-4 text-sm font-bold text-blue-600">VNDocs</p>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">{heading || (en ? 'Practice Writing and Speaking' : 'Luyện Writing và Speaking')}</h1>
      <p className="mt-5 text-base leading-7 text-slate-500">{description || (en ? 'Choose a skill, practice and improve with detailed feedback after every submission.' : 'Chọn kỹ năng, bắt đầu luyện tập và tiến bộ qua nhận xét chi tiết sau mỗi bài làm.')}</p>
    </section>
    <section aria-label={en ? 'Choose a skill' : 'Chọn kỹ năng luyện tập'} className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
      {sections.map(({ href, title, icon: Icon, detail, description, color }) => <Link key={href} href={href} className="group min-w-0 rounded-2xl border border-slate-200 bg-white p-6 transition-colors hover:border-blue-400 dark:border-slate-700 dark:bg-slate-900 sm:p-8">
        <span className={'inline-flex h-12 w-12 items-center justify-center rounded-xl ' + color}><Icon size={24} /></span>
        <h2 className="mt-5 text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>
        <p className="mt-2 text-sm font-semibold text-slate-500">{detail}</p>
        <p className="mt-4 text-sm leading-6 text-slate-500">{description}</p>
        <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-blue-600">{en ? 'Start practice' : 'Bắt đầu luyện tập'} <ArrowRight size={17} /></span>
      </Link>)}
    </section>
    <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-slate-500">{(en ? ['Detailed corrections', 'Your practice history', 'Recordings and transcripts'] : ['Sửa lỗi chi tiết', 'Lưu lịch sử luyện tập', 'Ghi âm và bản chép lời']).map(text => <span key={text} className="inline-flex items-center gap-2"><Check size={16} className="shrink-0 text-emerald-600" />{text}</span>)}</div>
    <section className="mt-14 border-t border-slate-200 pt-8">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{en ? 'Choose the writing task you want to improve' : 'Chọn dạng bài Writing bạn muốn cải thiện'}</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{exams.map(exam => <article key={exam.slug} className="min-w-0 rounded-xl border border-slate-200 p-5 dark:border-slate-700"><h3 className="text-lg font-semibold"><Link href={`${prefix}/ai-grader/${exam.slug}`} className="text-blue-600 hover:underline">{exam.name}</Link></h3><p className="mt-2 text-sm leading-7 text-slate-500">{exam.detail}</p></article>)}</div>
    </section>
    <section className="mt-10 space-y-4 text-sm leading-7 text-slate-600 dark:text-slate-400">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{en ? 'Use feedback to revise, then practise again' : 'Dùng nhận xét để sửa bài, rồi luyện lại'}</h2>
      <ol className="list-decimal space-y-3 pl-5">
        <li>{en ? 'Choose an exam and task. Read the prompt, identify what you need to answer and write a brief outline.' : 'Chọn kỳ thi và dạng bài. Đọc kỹ đề, xác định điều cần trả lời và lập dàn ý ngắn.'}</li>
        <li>{en ? 'Write your response or record a Speaking answer. For Speaking, replay the audio and check the transcript against what you actually said.' : 'Viết bài hoặc ghi âm câu trả lời Speaking. Với Speaking, nghe lại bản thu và đối chiếu bản chữ với lời bạn đã nói.'}</li>
        <li>{en ? 'Submit for AI feedback, review each suggested correction and rewrite the weak sentences before trying another prompt.' : 'Nộp bài để nhận góp ý AI, kiểm tra từng lỗi được gợi ý và viết lại những câu chưa rõ trước khi chuyển đề mới.'}</li>
      </ol>
      <p>{en ? 'Sign in to submit practice and keep your account history. Some recording drafts also use browser storage; changing devices may not restore an unfinished draft. Plans have daily usage limits.' : 'Đăng nhập để nộp bài và xem lịch sử trong tài khoản. Một số bản nháp thu âm còn được lưu trong trình duyệt; đổi thiết bị có thể không khôi phục được bản nháp chưa nộp. Các gói có hạn mức sử dụng hằng ngày.'} <Link href={`${prefix}/premium`} className="font-semibold text-blue-600 hover:underline">{en ? 'Compare practice plans' : 'Xem các gói luyện tập'}</Link>.</p>
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">{en ? 'What does an AI score mean?' : 'Điểm AI có ý nghĩa gì?'}</h3>
      <p>{en ? 'AI scores are practice estimates and can be wrong. Use the feedback to find patterns in your mistakes; do not treat it as an official exam result. VNDocs is an independent practice platform and is not an exam organiser.' : 'Điểm AI là ước tính phục vụ luyện tập và có thể sai. Hãy dùng nhận xét để nhận ra lỗi lặp lại; không xem đây là kết quả thi chính thức. VNDocs là nền tảng luyện tập độc lập, không phải đơn vị tổ chức kỳ thi.'}</p>
      <p><Link href={`${prefix}/about`} className="font-semibold text-blue-600 hover:underline">{en ? 'About VNDocs' : 'Tìm hiểu về VNDocs'}</Link>{' · '}<Link href={`${prefix}/privacy`} className="font-semibold text-blue-600 hover:underline">{en ? 'How practice data is processed' : 'Cách dữ liệu luyện tập được xử lý'}</Link>{' · '}<Link href={`${prefix}/contact`} className="font-semibold text-blue-600 hover:underline">{en ? 'Get help or report an issue' : 'Liên hệ hỗ trợ và báo lỗi'}</Link></p>
    </section>
  </div>
}

