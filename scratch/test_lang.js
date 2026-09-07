const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const key = env.split('\n').find(l => l.startsWith('RIME_API_KEY=')).split('=')[1].trim().replace(/["']/g, '');

async function test() {
  const texts = [
    { name: 'English', text: 'Language set to English. Let us continue.' },
    { name: 'Devanagari Hindi', text: 'भाषा हिंदी में सेट कर दी गई है। चलिए जारी रखते हैं।' },
    { name: 'Roman Hindi', text: 'Bhasha Hindi mein set kar di gayi hai. Chaliye jaari rakhte hain.' }
  ];
  for (const t of texts) {
    try {
      const res = await fetch('https://users.rime.ai/v1/rime-tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + key,
          Accept: 'audio/mp3'
        },
        body: JSON.stringify({
          speaker: 'astra',
          modelId: 'arcana',
          text: t.text
        })
      });
      console.log(t.name, 'status:', res.status);
      if (!res.ok) {
        console.log(t.name, 'error:', await res.text());
      } else {
        const buf = await res.arrayBuffer();
        console.log(t.name, 'bytes:', buf.byteLength);
      }
    } catch (e) {
      console.error(t.name, 'exception:', e.message);
    }
  }
}
test();
