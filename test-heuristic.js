const extractSemanticFields = (fieldsData) => {
  let word = '', ipa = '', meaning = ''
  const examples = [], images = [], audios = []
  const others = []
  
  fieldsData.forEach(f => {
    const name = f.name.toLowerCase().trim()
    const val = f.value.trim()
    if (!val) return
    
    const textOnly = val.replace(/<[^>]*>?/gm, '').replace(/\[sound:[^\]]+\]/gi, '').replace(/&nbsp;/gi, '').trim()
    
    // NẾU TEXT CHỈ CÓ SỐ VÀ KÝ HIỆU ĐẶC BIỆT (KHÔNG CÓ CHỮ CÁI NÀO), BỎ QUA LUÔN (NÓ LÀ STT)
    const hasLetters = /\p{L}/u.test(textOnly)
    
    if (['stt', 'id', 'thứ tự', 'seq', 'index', 'no', 'số thứ tự'].includes(name) || (textOnly.length > 0 && !hasLetters)) {
      return
    }
    
    const isImgOnly = textOnly.length === 0 && val.includes('<img')
    const isAudioOnly = textOnly.length === 0 && val.includes('[sound:')
    
    if (name.includes('word') || name.includes('từ vựng') || name.includes('từ') || name.includes('vocab') || name.includes('english') || name.includes('tiếng anh') || name.includes('mặt trước') || name.includes('front')) {
      word = val
    }
    else if (name.includes('ipa') || name.includes('phiên âm') || name.includes('phonetic') || name.includes('pronunciation')) {
      ipa = val
    }
    else if (name.includes('meaning') || name.includes('nghĩa') || name.includes('definition') || name.includes('tiếng việt') || name.includes('dịch') || name.includes('mặt sau') || name.includes('back')) {
      meaning = val
    }
    else if (name.includes('example') || name.includes('ví dụ') || name.includes('sentence') || name.includes('câu')) {
      examples.push(val)
    }
    else if (name.includes('audio') || name.includes('âm thanh') || name.includes('sound') || name.includes('nghe') || isAudioOnly) {
      audios.push(val)
    }
    else if (name.includes('picture') || name.includes('image') || name.includes('hình ảnh') || name.includes('ảnh') || isImgOnly) {
      images.push(val)
    }
    else {
      others.push(f)
    }
  })
  
  if (!word && others.length > 0) {
    const idx = others.findIndex(f => {
       const t = f.value.replace(/<[^>]*>?/gm, '').replace(/\[sound:[^\]]+\]/gi, '').replace(/&nbsp;/gi, '').trim()
       return /\p{L}/u.test(t)
    })
    if (idx !== -1) {
      word = others[idx].value
      others.splice(idx, 1)
    }
  }
  
  if (!meaning && others.length > 0) {
    const idx = others.findIndex(f => {
       const t = f.value.replace(/<[^>]*>?/gm, '').replace(/\[sound:[^\]]+\]/gi, '').replace(/&nbsp;/gi, '').trim()
       return /\p{L}/u.test(t)
    })
    if (idx !== -1) {
      meaning = others[idx].value
      others.splice(idx, 1)
    }
  }
  
  others.forEach(o => {
    examples.push(`<b>${o.name}:</b><br/>${o.value}`)
  })
  
  return { word, ipa, meaning, examples, images, audios }
}

const test1 = [
  { name: 'Mã', value: '1.' }, 
  { name: 'Từ', value: 'apple' },
  { name: 'Giải thích', value: 'quả táo' }
]
console.log('TEST 1:', extractSemanticFields(test1))

const test2 = [
  { name: 'Field 1', value: '#1' }, 
  { name: 'Field 2', value: 'banana' },
  { name: 'Field 3', value: 'chuối' }
]
console.log('TEST 2:', extractSemanticFields(test2))

const test3 = [
  { name: 'Field 1', value: 'Card 1' }, // Crap, this has letters!
  { name: 'Field 2', value: 'cherry' },
  { name: 'Field 3', value: 'quả anh đào' }
]
console.log('TEST 3:', extractSemanticFields(test3))
