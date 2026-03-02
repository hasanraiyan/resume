#!/usr/bin/env node

const https = require('https');

async function generateImage(prompt, aspectRatio = '1:1') {
  const data = JSON.stringify({
    prompt,
    aspectRatio,
  });

  const options = {
    hostname: 'pdfservice.pyqdeck.in',
    port: 443,
    path: '/api/image/generate',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (d) => {
        body += d;
      });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(body);
          if (parsedData.success) {
            resolve(parsedData.url);
          } else {
            reject(new Error(parsedData.error || 'Failed to generate image'));
          }
        } catch (e) {
          console.error('Raw Body:', body);
          reject(new Error('Failed to parse API response'));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

const args = process.argv.slice(2);
const promptArg = args.find((a) => a.startsWith('--prompt='));
const ratioArg = args.find((a) => a.startsWith('--aspectRatio='));

if (!promptArg) {
  console.error(
    'Usage: node image-gen-tool.js --prompt="your prompt" [--aspectRatio="1:1" | "16:9" | "9:16"]'
  );
  process.exit(1);
}

const prompt = promptArg.split('=')[1];
const aspectRatio = ratioArg ? ratioArg.split('=')[1] : '1:1';

generateImage(prompt, aspectRatio)
  .then((url) => {
    console.log(url);
  })
  .catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
  });
