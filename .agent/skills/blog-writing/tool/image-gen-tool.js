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

const fs = require('fs');

const args = process.argv.slice(2);
const inputFileArg = args.find((a) => a.startsWith('--inputFile='));
const outputFileArg = args.find((a) => a.startsWith('--outputFile='));

if (!inputFileArg) {
  console.error(
    'Usage:\n' +
      '  Batch images: node image-gen-tool.js --inputFile="prompts.json" [--outputFile="results.json"]\n\n' +
      '  Supported Aspect Ratios: 1:1, 9:16, 16:9, 3:4, 4:3, 3:2, 2:3, 5:4, 4:5, 4:1, 1:4, 8:1, 1:8\n\n' +
      '  Input file format (JSON array):\n' +
      '  [ { "id": "Cover Image", "prompt": "...", "aspectRatio": "16:9" } ]'
  );
  process.exit(1);
}

const inputFilePath = inputFileArg.split('=')[1];
const outputFilePath = outputFileArg ? outputFileArg.split('=')[1] : 'image-results.json';

let promptsData = [];
try {
  const fileContent = fs.readFileSync(inputFilePath, 'utf8');
  promptsData = JSON.parse(fileContent);
} catch (err) {
  console.error(`Error reading input file: ${err.message}`);
  process.exit(1);
}

const results = {};

async function processPrompts() {
  console.log(`Found ${promptsData.length} prompts to process.`);
  for (const item of promptsData) {
    const promptText = typeof item === 'string' ? item : item.prompt;
    const aspect = typeof item === 'object' && item.aspectRatio ? item.aspectRatio : '16:9';
    const id = typeof item === 'object' && item.id ? item.id : promptText.substring(0, 30) + '...';

    console.log(`\nGenerating image for: ${id}`);
    try {
      const url = await generateImage(promptText, aspect);
      results[id] = { prompt: promptText, url };
      console.log(`Success: ${url}`);
    } catch (err) {
      console.error(`Failed for ${id}: ${err.message}`);
      results[id] = { prompt: promptText, error: err.message };
    }
  }

  fs.writeFileSync(outputFilePath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\nAll results saved to ${outputFilePath}`);
}

processPrompts();
