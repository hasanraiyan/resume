const { prompt } = require('enquirer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function setup() {
  console.log('\n\x1b[36m%s\x1b[0m', '--- Project Setup Assistant ---');
  console.log('\x1b[2m%s\x1b[0m', 'Configure your environment variables below.\n');

  const envPath = path.join(process.cwd(), '.env');

  // Load existing .env if it exists
  let existingEnv = {};
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach((line) => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        if (key && !key.startsWith('#')) existingEnv[key] = value;
      }
    });
    console.log('\x1b[33m%s\x1b[0m', 'Note: Found existing .env file. Values pre-filled.');
  }

  // Generate random secrets
  const generatedAuthSecret = crypto.randomBytes(32).toString('hex');
  const generatedEncryptionSecret = crypto.randomBytes(32).toString('hex');

  const questions = [
    {
      type: 'input',
      name: 'MONGODB_URI',
      message: 'MongoDB Connection URI:',
      initial: existingEnv.MONGODB_URI || 'mongodb://localhost:27017/resume-builder',
      validate: (value) => (value.startsWith('mongodb') ? true : 'Must be a valid MongoDB URI'),
    },
    {
      type: 'input',
      name: 'ADMIN_USERNAME',
      message: 'Admin Dashboard Username:',
      initial: existingEnv.ADMIN_USERNAME || 'admin',
    },
    {
      type: 'password',
      name: 'ADMIN_PASSWORD',
      message: 'Admin Dashboard Password:',
      initial: existingEnv.ADMIN_PASSWORD || 'your-secure-password',
    },
    {
      type: 'input',
      name: 'NEXTAUTH_SECRET',
      message: 'NextAuth Secret (Auto-generated):',
      initial: existingEnv.NEXTAUTH_SECRET || generatedAuthSecret,
    },
    {
      type: 'input',
      name: 'ENCRYPTION_SECRET',
      message: 'Encryption Secret (Auto-generated):',
      initial: existingEnv.ENCRYPTION_SECRET || generatedEncryptionSecret,
    },
    {
      type: 'input',
      name: 'NEXT_PUBLIC_BASE_URL',
      message: 'Public Base URL:',
      initial: existingEnv.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    },
    {
      type: 'confirm',
      name: 'configureThirdParty',
      message: 'Configure Cloudinary, UploadThing, and Qdrant?',
      initial: false,
    },
  ];

  try {
    const answers = await prompt(questions);

    let thirdPartyAnswers = {};
    if (answers.configureThirdParty) {
      console.log('\n\x1b[36m%s\x1b[0m', '--- API Configuration ---');

      thirdPartyAnswers = await prompt([
        {
          type: 'input',
          name: 'CLOUDINARY_CLOUD_NAME',
          message: 'Cloudinary Cloud Name:',
          footer: () =>
            '\x1b[2mLink: https://console.cloudinary.com/console/settings/api-keys\x1b[0m',
          initial: existingEnv.CLOUDINARY_CLOUD_NAME || '',
        },
        {
          type: 'input',
          name: 'CLOUDINARY_API_KEY',
          message: 'Cloudinary API Key:',
          initial: existingEnv.CLOUDINARY_API_KEY || '',
        },
        {
          type: 'password',
          name: 'CLOUDINARY_API_SECRET',
          message: 'Cloudinary API Secret:',
          initial: existingEnv.CLOUDINARY_API_SECRET || '',
        },
        {
          type: 'input',
          name: 'UPLOADTHING_SECRET',
          message: 'UploadThing Secret:',
          footer: () => '\x1b[2mLink: https://uploadthing.com/dashboard/api-keys\x1b[0m',
          initial: existingEnv.UPLOADTHING_SECRET || '',
        },
        {
          type: 'input',
          name: 'UPLOADTHING_APP_ID',
          message: 'UploadThing App ID:',
          initial: existingEnv.UPLOADTHING_APP_ID || '',
        },
        {
          type: 'input',
          name: 'QDRANT_URL',
          message: 'Qdrant URL:',
          footer: () => '\x1b[2mFound in Qdrant Cloud Cluster dashboard\x1b[0m',
          initial: existingEnv.QDRANT_URL || '',
        },
        {
          type: 'password',
          name: 'QDRANT_API_KEY',
          message: 'Qdrant API Key:',
          initial: existingEnv.QDRANT_API_KEY || '',
        },
        {
          type: 'input',
          name: 'CRON_API_KEY',
          message: 'Cron API Key (Auto-generated):',
          initial: existingEnv.CRON_API_KEY || crypto.randomBytes(16).toString('hex'),
        },
      ]);
    }

    const finalEnv = {
      ...answers,
      ...thirdPartyAnswers,
      NEXT_PUBLIC_APP_URL: answers.NEXT_PUBLIC_BASE_URL,
    };

    delete finalEnv.configureThirdParty;

    let envContent = '# Database\n';
    envContent += `MONGODB_URI=${finalEnv.MONGODB_URI}\n\n`;

    envContent += '# Admin Authentication\n';
    envContent += `ADMIN_USERNAME=${finalEnv.ADMIN_USERNAME}\n`;
    envContent += `ADMIN_PASSWORD=${finalEnv.ADMIN_PASSWORD}\n\n`;

    envContent += '# Secrets & Encryption\n';
    envContent += `NEXTAUTH_SECRET=${finalEnv.NEXTAUTH_SECRET}\n`;
    envContent += `ENCRYPTION_SECRET=${finalEnv.ENCRYPTION_SECRET}\n\n`;

    envContent += '# URLs\n';
    envContent += `NEXT_PUBLIC_BASE_URL=${finalEnv.NEXT_PUBLIC_BASE_URL}\n`;
    envContent += `NEXT_PUBLIC_APP_URL=${finalEnv.NEXT_PUBLIC_APP_URL}\n\n`;

    if (answers.configureThirdParty) {
      envContent += '# Cloudinary\n';
      envContent += `CLOUDINARY_CLOUD_NAME=${finalEnv.CLOUDINARY_CLOUD_NAME}\n`;
      envContent += `CLOUDINARY_API_KEY=${finalEnv.CLOUDINARY_API_KEY}\n`;
      envContent += `CLOUDINARY_API_SECRET=${finalEnv.CLOUDINARY_API_SECRET}\n\n`;

      envContent += '# UploadThing\n';
      envContent += `UPLOADTHING_SECRET=${finalEnv.UPLOADTHING_SECRET}\n`;
      envContent += `UPLOADTHING_APP_ID=${finalEnv.UPLOADTHING_APP_ID}\n\n`;

      envContent += '# Qdrant\n';
      envContent += `QDRANT_URL=${finalEnv.QDRANT_URL}\n`;
      envContent += `QDRANT_API_KEY=${finalEnv.QDRANT_API_KEY}\n\n`;

      envContent += '# Maintenance\n';
      envContent += `CRON_API_KEY=${finalEnv.CRON_API_KEY}\n`;
    }

    fs.writeFileSync(envPath, envContent);
    console.log('\n\x1b[32m%s\x1b[0m', '✅ .env file has been generated successfully!');
    console.log('\x1b[36m%s\x1b[0m', 'You can now run: pnpm run dev\n');
  } catch (err) {
    if (!err || (typeof err === 'object' && Object.keys(err).length === 0)) {
      console.log('\n\x1b[31m%s\x1b[0m', 'Setup cancelled.');
    } else {
      // Enquirer throws empty strings or empty objects on cancel (Ctrl+C)
      console.log('\n\x1b[31m%s\x1b[0m', 'Setup cancelled.');
    }
  }
}

setup();
