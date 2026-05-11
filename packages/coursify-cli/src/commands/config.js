import chalk from 'chalk';
import Conf from 'conf';

const config = new Conf({ projectName: 'coursify-cli' });

export function setupConfigCommands(program) {
  const cfg = program.command('config').description('Configure CLI settings');

  cfg
    .command('set <key> <value>')
    .description('Set a configuration value (e.g., baseUrl, token)')
    .action((key, value) => {
      config.set(key, value);
      console.log(chalk.green(`Configuration updated: ${key} = ${value}`));
    });

  cfg
    .command('get [key]')
    .description('Get a configuration value or all settings')
    .action((key) => {
      if (key) {
        console.log(`${key}: ${config.get(key)}`);
      } else {
        console.log(JSON.stringify(config.store, null, 2));
      }
    });

  cfg
    .command('reset')
    .description('Clear all configuration')
    .action(() => {
      config.clear();
      console.log(chalk.green('Configuration reset successfully.'));
    });
}
