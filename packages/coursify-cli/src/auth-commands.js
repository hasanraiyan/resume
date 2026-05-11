import chalk from 'chalk';
import {
  generateCodeVerifier,
  generateCodeChallenge,
  receiveAuthorizationCode,
  exchangeCodeForTokens,
  registerClient,
} from './oauth.js';
import { loadCredentials, saveCredentials, clearCredentials } from './token-store.js';

export async function authLogin({ baseUrl }) {
  try {
    let credentials = loadCredentials();
    let clientId = credentials?.client_id;

    if (!clientId) {
      console.log(chalk.blue('Registering CLI client with server...'));
      const registration = await registerClient({
        baseUrl,
        redirectUris: ['http://127.0.0.1:0'], // Dynamic port handled by oauth.js
        clientName: 'Coursify CLI',
      });
      clientId = registration.client_id;
    }

    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);

    const authorizeUrl = new URL(`${baseUrl}/api/mcp/oauth/authorize`);
    authorizeUrl.searchParams.set('client_id', clientId);
    authorizeUrl.searchParams.set('response_type', 'code');
    authorizeUrl.searchParams.set('scope', 'coursify');
    authorizeUrl.searchParams.set('code_challenge', codeChallenge);
    authorizeUrl.searchParams.set('code_challenge_method', 'S256');

    console.log(chalk.blue('\nOpening browser for authentication...'));
    const { code, redirectUri } = await receiveAuthorizationCode(authorizeUrl.toString());

    console.log(chalk.blue('Exchanging code for tokens...'));
    const tokens = await exchangeCodeForTokens({
      baseUrl,
      code,
      codeVerifier,
      clientId,
      redirectUri,
    });

    saveCredentials({
      client_id: clientId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiresAt: Date.now() + tokens.expires_in * 1000,
      base_url: baseUrl,
    });

    console.log(chalk.green('\nSuccessfully authenticated!'));
  } catch (err) {
    console.error(chalk.red(`\nAuthentication failed: ${err.message}`));
    process.exit(1);
  }
}

export async function authStatus() {
  const credentials = loadCredentials();
  if (!credentials) {
    console.log(chalk.yellow('Not authenticated. Run `coursify auth login` to sign in.'));
    return;
  }

  const expiresInMin = Math.round((credentials.expiresAt - Date.now()) / 1000 / 60);

  console.log(chalk.bold('\nAuth Status: ') + chalk.green('Authenticated'));
  console.log(`${chalk.bold('Server:')} ${credentials.base_url}`);
  console.log(`${chalk.bold('Client ID:')} ${credentials.client_id}`);
  if (expiresInMin > 0) {
    console.log(`${chalk.bold('Token expires in:')} ${expiresInMin} minutes`);
  } else {
    console.log(`${chalk.bold('Token status:')} ${chalk.red('Expired')}`);
  }
}

export async function authLogout() {
  clearCredentials();
  console.log(chalk.green('Logged out. Credentials cleared.'));
}
