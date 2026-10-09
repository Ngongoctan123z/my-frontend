const fs = require('fs');
let code = fs.readFileSync('app/ai-grader/ielts/AiGraderClient.tsx', 'utf8');

// 1. Fix header layout
code = code.replace(
  /<div className="flex items-center justify-between mb-4">\s*<h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">\s*<FileEdit className="w-5 h-5 text-blue-600" \/> \{isEn \? 'Exam Setup' : 'Thiết lập đề thi'\}\s*<\/h2>\s*<div className="flex gap-2">/g,
  '<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">\n              <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">\n                <FileEdit className="w-5 h-5 text-blue-600" /> {isEn ? \'Exam Setup\' : \'Thiết lập đề thi\'}\n              </h2>\n              <div className="flex flex-wrap gap-2">'
);

// 2. Hide "Lịch sử" text on mobile to save space
code = code.replace(
  /\{isEn \? 'History' : 'Lịch sử'\} \(\{history\.length\}\)/g,
  '<span className="hidden sm:inline">{isEn ? \'History\' : \'Lịch sử\'} ({history.length})</span><span className="sm:hidden">{history.length}</span>'
);

// 3. Make the Task 1 / Task 2 buttons flex-1 on mobile
code = code.replace(
  /<div className="flex flex-wrap gap-2 mb-4">/g,
  '<div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 mb-5">'
);
code = code.replace(
  /className={`px-4 py-2 rounded text-sm font-semibold transition-all border \$\{/g,
  'className={`w-full px-4 py-2 rounded text-sm font-semibold transition-all border ${'
);

// 4. Add the Trash button
code = code.replace(
  /\{isEditorExpanded \? <Minimize2 className="w-5 h-5" \/> : <Maximize2 className="w-5 h-5" \/>\}\s*<\/button>\s*<\/div>/g,
  '{isEditorExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}\n                </button>\n                <button \n                  onClick={() => { if(confirm(isEn ? \'Are you sure you want to clear your essay?\' : \'Bạn có chắc chắn muốn xóa toàn bộ bài làm?\')) setEssay(\'\') }}\n                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"\n                  title={isEn ? \'Clear essay\' : \'Xóa bài làm\'}\n                >\n                  <Trash2 className="w-5 h-5" />\n                </button>\n              </div>'
);

// 5. Fix "Nội dung đề bài" wrapping
code = code.replace(
  /<div className="flex items-center justify-between">\s*<label className="font-medium text-slate-700 text-sm">\{isEn \? 'Prompt Content:' : 'Nội dung đề bài:'\}<\/label>\s*<div className="flex items-center gap-2">/g,
  '<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">\n                <label className="font-medium text-slate-700 text-sm">{isEn ? \'Prompt Content:\' : \'Nội dung đề bài:\'}</label>\n                <div className="flex flex-wrap items-center gap-2">'
);

fs.writeFileSync('app/ai-grader/ielts/AiGraderClient.tsx', code);
console.log("Fixed layout and added Trash button!");
