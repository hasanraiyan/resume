/**
 * @fileoverview Script to generate TOTP secret and QR code for 2FA setup.
 * Run this script once to set up your authenticator app, then delete it.
 *
 * Usage: node scripts/setup-totp-2fa.js
 */

import { OTP } from 'otplib';
import QRCode from 'qrcode';
import dotenv from 'dotenv';

dotenv.config();

const otp = new OTP({ issuer: `Portfolio: ${process.env.ADMIN_USERNAME}` });

async function setupTOTP() {
  // Always generate a new secret that's properly sized (20 bytes = 160 bits)
  const secret = otp.generateSecret(20);
  console.log('\nGenerated new TOTP_SECRET:\n');
  console.log(secret);
  console.log('\n⚠️  Update your .env file with this new TOTP_SECRET\n');

  // Generate the otpauth URL
  const otpauth = otp.generateURI({
    label: process.env.ADMIN_USERNAME || 'admin',
    secret,
  });

  console.log('\n📱 Scan this QR code with your authenticator app:\n');

  // Generate ASCII QR code for terminal
  const asciiQR = await QRCode.toString(otpauth, { type: 'terminal' });
  console.log(asciiQR);

  console.log('\n✅ Setup complete! Your 2FA is now active.\n');
  console.log('⚠️  Remember to DELETE this script after setup!\n');
}

setupTOTP().catch(console.error);
