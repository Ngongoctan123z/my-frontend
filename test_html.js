fetch('https://www.khodethi.id.vn').then(r => r.text()).then(t => console.log(t.includes('href="/exams/')));
