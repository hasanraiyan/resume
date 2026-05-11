import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import { login, pollToken, clearToken, getToken } from '../auth-client.js';

export function setupAuthCommands(program) {
  program
    .command('login')
    .description('Authenticate the CLI with your Coursify account')
    .action(async () => {
      try {
        const spinner = ora('Initiating device authorization...').start();
        const { device_code, user_code, verification_uri, expires_in, interval } = await login();
        spinner.stop();

        console.log(
          boxen(
            `1. Open this URL in your browser:\n${chalk.blue.underline(verification_uri)}\n\n` +
            `2. Enter the following code:\n${chalk.yellow.bold(user_code)}`,
            { padding: 1, margin: 1, borderStyle: 'round', borderColor: 'green' }
          )
        );

        const pollSpinner = ora('Waiting for authorization...').start();
        try {
          const { access_token } = await pollToken(device_code, interval);
          import('../auth-client.js').then(m => m.saveToken(access_token));
          pollSpinner.succeed(chalk.green('Successfully authenticated!'));
        } catch (error) {
          pollSpinner.fail(chalk.red(`Authentication failed: ${error.message}`));
        }
      } catch (error) {
        console.error(chalk.red(`Error: ${error.message}`));
      }
    });

  program
    .command('logout')
    .description('Remove stored authentication token')
    .action(() => {
      clearToken();
      console.log(chalk.green('Logged out successfully.'));
    });

  program
    .command('status')
    .description('Check authentication status')
    .action(() => {
      const token = getToken();
      if (token) {
        console.log(chalk.green('Status: Authenticated'));
      } else {
        console.log(chalk.yellow('Status: Not authenticated. Run "coursify login" to start.'));
      }
    });
}
