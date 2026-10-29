async function test() {
  try {
    const res = await fetch('https://flagcdn.com/w160/tr.png');
    console.log('Status for tr.png:', res.status, res.headers.get('content-type'));
    const res2 = await fetch('https://flagcdn.com/w160/pa.png');
    console.log('Status for pa.png:', res2.status, res2.headers.get('content-type'));
  } catch (e) {
    console.error('Fetch error:', e.message);
  }
}
test();
