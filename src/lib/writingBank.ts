export type WritingExam='TOPIK'|'HSK_5'|'HSK_6'
export const WRITING_EXAMS:WritingExam[]=['TOPIK','HSK_5','HSK_6']
export const WRITING_FORMATS={TOPIK:'TOPIK II PBT · 51–54 · 50 phút · 100 điểm',HSK_5:'HSK 5 · hệ 6 cấp (2.0) · 91–100 · 40 phút · 100 điểm',HSK_6:'HSK 6 · hệ 6 cấp (2.0) · tóm tắt · 10 phút đọc + 35 phút viết · 100 điểm'}
export type WritingSource={title:string;url:string;license?:string;licenseUrl?:string;publisher?:string;authorsUrl?:string;note?:string;documentUrl?:string;pdfPage?:number}
export type WritingRow={id:string;type:string;content:string;imageUrl?:string|null}
export type WritingSetRecord={id:string;exam:WritingExam;title:string;format:string;origin:string;children:Record<string,string>;sources:WritingSource[]}
export type WritingPrompt={id?:string;content:string;imageUrl?:string|null;imageDescription?:string;source?:WritingSource}
export type WritingLoadedSet=WritingSetRecord&{questions:Record<string,WritingPrompt>}
