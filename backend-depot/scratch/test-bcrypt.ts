import * as bcrypt from 'bcrypt';

async function testBcrypt() {
  try {
    console.log('Starting bcrypt hash...');
    const start = Date.now();
    const hash = await bcrypt.hash('testpassword', 12);
    const end = Date.now();
    console.log('Bcrypt hash successful:', hash);
    console.log('Time taken:', end - start, 'ms');

    const isValid = await bcrypt.compare('testpassword', hash);
    console.log('Bcrypt compare successful:', isValid);
  } catch (error) {
    console.error('Bcrypt Error:', error);
  }
}

testBcrypt();
