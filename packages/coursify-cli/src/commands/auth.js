import { Command } from 'commander';
import { authLogin, authStatus, authLogout } from '../auth-commands.js';

export const authCommands = new Command('auth').description('Manage authentication');

authCommands
  .command('login')
  .option('--base-url <url>', 'Server base URL')
  .option('--dev', 'Use localhost for development', false)
  .description('Authenticate via OAuth (opens browser)')
  .action(async (options) => {
    if (options.dev) {
      options.baseUrl = options.baseUrl || 'http://localhost:3000';
    } else {
      options.baseUrl = options.baseUrl || 'https://hasanraiyan.me';
    }
    await authLogin(options);
  });

authCommands
  .command('status')
  .description('Show current auth status')
  .action(async () => {
    await authStatus();
  });

authCommands
  .command('logout')
  .description('Clear stored tokens')
  .action(async () => {
    await authLogout();
  });
