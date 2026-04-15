const { authenticator } = require('@otplib/preset-default');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');

async function generate() {
  const secret = authenticator.generateSecret();
  const user = process.env.ADMIN_USERNAME || 'admin';
  const service = 'ResumeBuilderAdmin';

  const otpauth = authenticator.keyuri(user, service, secret);

  console.log('\n--- TOTP Secret Setup ---\n');
  console.log(`Secret (Base32): ${secret}`);
  console.log('You can manually enter this secret into your authenticator app.\n');

  console.log('Or scan this QR Code:\n');
  const qr = await qrcode.toString(otpauth, { type: 'terminal', small: true });
  console.log(qr);

  // Append to .env
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, 'utf8');
    if (!envContent.includes('TOTP_SECRET=')) {
      fs.appendFileSync(envPath, `\n# TOTP 2FA Secret\nTOTP_SECRET=${secret}\n`);
      console.log(`\n✅ Added TOTP_SECRET=${secret} to .env`);
    } else {
      console.log(`\n⚠️ TOTP_SECRET already exists in .env. Please update it manually if needed: TOTP_SECRET=${secret}`);
    }
  } else {
    fs.writeFileSync(envPath, `# TOTP 2FA Secret\nTOTP_SECRET=${secret}\n`);
    console.log(`\n✅ Created .env and added TOTP_SECRET=${secret}`);
  }
}

generate().catch(console.error);
