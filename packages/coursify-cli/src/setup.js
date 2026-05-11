import chalk from 'chalk';
import { loadConfig, saveConfig } from './config-store.js';
import { authLogin } from './auth-commands.js';

export async function setupInit(options) {
  const config = loadConfig();

  console.log(chalk.blue('Enter your Coursify server URL:'));
  console.log('Example: https://your-domain.com');

  // For now, we'll set a placeholder - user needs to configure
  config.baseUrl = 'NOT_CONFIGURED';
  config.initialized = true;

  saveConfig(config);

  console.log(
    chalk.yellow(
      '⚠️  Please run `coursify setup set-base-url <your-url>` to configure your server.'
    )
  );
  console.log(chalk.yellow('   Example: coursify setup set-base-url https://your-domain.com'));
}

export async function setupShow() {
  console.log(chalk.bold('\n--- Coursify CLI Status ---'));
  console.log(`${chalk.bold('Server:')} hasanraiyan.me`);
  console.log(`${chalk.bold('Version:')} 1.0.1`);
  console.log(`${chalk.bold('Status:')} ${chalk.green('Ready')}`);
}

export async function setupSetBaseUrl(url) {
  const config = loadConfig();

  // Validate URL format
  try {
    new URL(url);
  } catch (err) {
    console.error(
      chalk.red('❌ Invalid URL format. Please provide a valid URL starting with https://')
    );
    process.exit(1);
  }

  config.baseUrl = url;
  config.initialized = true;
  saveConfig(config);

  console.log(chalk.green(`✓ Server URL configured: ${url}`));
  console.log(chalk.blue('You can now use the CLI commands.'));
}

export function getConfiguredBaseUrl() {
  const config = loadConfig();

  if (!config.initialized || config.baseUrl === 'NOT_CONFIGURED' || !config.baseUrl) {
    console.error(chalk.red('❌ CLI not configured. Please run:'));
    console.error(chalk.yellow('   coursify setup init'));
    console.error(chalk.yellow('   coursify setup set-base-url <your-server-url>'));
    process.exit(1);
  }

  return config.baseUrl;
}

export async function setupSet(key, value) {
  const config = loadConfig();

  // Handle boolean values
  if (value === 'true') value = true;
  if (value === 'false') value = false;

  config[key] = value;
  saveConfig(config);

  console.log(chalk.green(`✓ Set ${key} = ${value}`));
}
