async function testSvg() {
  try {
    const res = await fetch('https://flagcdn.com/tr.svg');
    console.log('Status for tr.svg:', res.status, res.headers.get('content-type'));
    const res2 = await fetch('https://flagcdn.com/pa.svg');
    console.log('Status for pa.svg:', res2.status, res2.headers.get('content-type'));
  } catch (e) {
    console.error('Fetch error:', e.message);
  }
}
testSvg();
