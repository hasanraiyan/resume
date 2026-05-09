#!/usr/bin/env node

/**
 * Coursify Studio CLI Launcher
 * 
 * This script launches the content worker with the necessary path alias resolution.
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectRoot = process.cwd();

// Find the worker and loader scripts relative to this file
const registerPath = path.join(__dirname, 'register-loader.mjs');
const workerPath = path.join(__dirname, 'content_worker.mjs');

// Ensure we are in a project with a .env file (or similar)
if (!fs.existsSync(path.join(projectRoot, '.env'))) {
  console.warn('Warning: .env file not found in current directory. DB connection might fail.');
}

const nodeArgs = [
  '--no-warnings',
  '--import', `file://${registerPath.replace(/\\/g, '/')}`,
  workerPath,
  ...process.argv.slice(2)
];

const result = spawnSync('node', nodeArgs, {
  stdio: 'inherit',
  shell: true,
  env: { 
    ...process.env, 
    PROJECT_ROOT: projectRoot 
  }
});

if (result.error) {
  console.error('Failed to launch worker:', result.error.message);
  process.exit(1);
}

process.exit(result.status);
