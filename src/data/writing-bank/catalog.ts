import charts from './topikCharts.json'
import {hsk6Original} from './hsk6Original'
import {topik51,topik52,topik54} from './topikText'
import {hsk5Text} from './hsk5Text'
import {TOEIC_REAL_PHOTOS} from '../toeicPhotoBank'
import {WRITING_FORMATS,type WritingExam,type WritingSource,type WritingRow,type WritingSetRecord} from '../../lib/writingBank'
const no=(i:number)=>String(i+1).padStart(2,'0')
export const TOPIK_FORMAT_SOURCE='https://exam.topik.go.kr/nasdata/webnas/raonkeditordata/uploadId/2024/02/20240227_175504804_07236.pdf'
export const HSK_FORMAT_SOURCE='https://admin.chinesetest.cn/godownload.do'
export function buildWritingBank(){
 const questions:WritingRow[]=[],sets:WritingSetRecord[]=[]
 for(let i=0;i<50;i++){
  const key=no(i),chart=charts[i],id='topik-practice-'+key,children:Record<string,string>={}
  for(const number of [51,52,53,54])children['TOPIK_'+number]=id+'-'+number
  questions.push({id:children.TOPIK_51,type:'TOPIK_51',content:'다음을 읽고 ㉠과 ㉡에 들어갈 말을 각각 한 문장으로 쓰십시오. (10점)\n\n'+topik51[i][1]},
   {id:children.TOPIK_52,type:'TOPIK_52',content:'다음을 읽고 ㉠과 ㉡에 들어갈 말을 각각 한 문장으로 쓰십시오. (10점)\n\n'+topik52[i][1]},
   {id:children.TOPIK_53,type:'TOPIK_53',imageUrl:chart.imageUrl,content:JSON.stringify({text:`다음 자료를 참고하여 '${chart.practiceTitle}'에 대한 글을 200~300자로 쓰십시오. (30점)\n단, 글의 제목은 쓰지 마십시오.\n\n${chart.focus}\n자료에 제시되지 않은 원인이나 전망을 추측하여 쓰지 마십시오.`,imageDescription:chart.verifiedData,source:chart.source})},
   {id:children.TOPIK_54,type:'TOPIK_54',content:`다음을 주제로 자신의 생각을 600~700자로 쓰십시오. (50점)\n단, 문제를 그대로 옮겨 쓰지 마십시오.\n\n${topik54[i][1]}\n\n• ${topik54[i][2]}\n• ${topik54[i][3]}\n• ${topik54[i][4]}`})
  sets.push({id,exam:'TOPIK',title:`TOPIK II PBT · Bộ ${key}`,format:WRITING_FORMATS.TOPIK,origin:'Đề luyện VNDocs; biểu đồ công bố thật, không phải đề thi TOPIK chính thức.',children,sources:[chart.source,{title:'TOPIK II PBT · Cấu trúc và cách viết',url:TOPIK_FORMAT_SOURCE,publisher:'NIIED / TOPIK'}]})
 }
 for(let i=0;i<50;i++){
  const key=no(i),[topic,keywords,lines]=hsk5Text[i],photo=TOEIC_REAL_PHOTOS[i],id='hsk5-practice-'+key,child=id+'-body'
  const source={title:photo.topic,publisher:'Unsplash',url:'https://images.unsplash.com/photo-'+photo.id,license:'Unsplash License',licenseUrl:'https://unsplash.com/license',note:'Ảnh chụp thật đã kiểm tra; không dùng ảnh AI. Bài luyện do VNDocs biên soạn.'}
  const content={title:`HSK 5 · 第${key}套 · ${topic}`,format:'HSK 5 six-level format (2.0)',origin:'original_practice',part1:lines.map((line,index)=>{const groups=line.split('／'),shift=(i+index+1)%groups.length;const order=[...groups.slice(shift),...groups.slice(0,shift)].reverse();if(order.join('')===groups.join(''))order.push(order.shift()!);return {id:91+index,words:order.join(' / ')}}),part2:{id:99,keywords:keywords.split(','),requirement:'请使用上面所给的五个词语（全部都要使用），写一篇80字左右的短文。'},part3:{id:100,imageUrl:`https://images.unsplash.com/photo-${photo.id}?w=1000&auto=format&fit=max&q=85`,description:photo.description,requirement:'请结合这张图片写一篇80字左右的短文。',source}}
  questions.push({id:child,type:'HSK_5',content:JSON.stringify(content),imageUrl:content.part3.imageUrl})
  sets.push({id,exam:'HSK_5',title:`HSK 5 · Bộ ${key} · ${topic}`,format:WRITING_FORMATS.HSK_5,origin:'Đề luyện VNDocs theo hệ 6 cấp; dùng ảnh chụp thật, không phải đề thi HSK chính thức.',children:{HSK_5:child},sources:[source,{title:'HSK · Kho đề mẫu chính thức và hướng dẫn',url:HSK_FORMAT_SOURCE,publisher:'Chinese Testing International'}]})
 }
 for(let i=0;i<50;i++){
  const article=hsk6Original[i],key=no(i),id='hsk6-practice-'+key,child=id+'-body'
  if(!article)throw new Error('Thiếu bài đọc HSK 6 số '+key)
  questions.push({id:child,type:'HSK_6',content:`HSK 6 书写缩写练习（100分）\n\n请先用10分钟阅读下面的文章。阅读时不能抄写或做笔记。阅读结束后，请关闭原文，用35分钟将文章缩写成一篇400字左右的短文。题目自拟，只叙述文章内容，不加入自己的观点。\n\n${article[1]}`})
  sets.push({id,exam:'HSK_6',title:`HSK 6 · Bộ ${key} · ${article[0]}`,format:WRITING_FORMATS.HSK_6,origin:'Bài đọc và đề luyện gốc do VNDocs biên soạn theo hệ 6 cấp; không phải đề thi HSK chính thức.',children:{HSK_6:child},sources:[{title:'HSK · Kho đề mẫu chính thức và hướng dẫn',url:HSK_FORMAT_SOURCE,publisher:'Chinese Testing International'}]})
 }
 return {questions,sets}
}
