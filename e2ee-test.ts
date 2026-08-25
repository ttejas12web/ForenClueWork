function encryptText(text: string, key: string) {
  const utf8 = unescape(encodeURIComponent(text));
  let res = '';
  for(let i=0; i<utf8.length; i++) {
    res += String.fromCharCode(utf8.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return 'E2EE:' + btoa(res);
}

function decryptText(text: string, key: string) {
  if (!text.startsWith('E2EE:')) return text;
  const cipher = atob(text.replace('E2EE:', ''));
  let res = '';
  for(let i=0; i<cipher.length; i++) {
    res += String.fromCharCode(cipher.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return decodeURIComponent(escape(res));
}

const enc = encryptText('Hello 🌍', 'test_key');
console.log(enc);
console.log(decryptText(enc, 'test_key'));
