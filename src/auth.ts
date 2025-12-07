import open from 'open';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { readFile, unlink, writeFile } from 'fs/promises';
import { createServer } from 'http';
import destroyer from 'server-destroy';
import { getResourcePath } from './utils/pathResolver';

const TOKEN_PATH = getResourcePath('token.json');
const CREDENTIALS_PATH = getResourcePath('client_secret.json');
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

interface Credentials {
  installed?: {
    client_id: string;
    client_secret: string;
    redirect_uris: string[];
  };
  web?: {
    client_id: string;
    client_secret: string;
    redirect_uris: string[];
  };
}

export async function authorize(): Promise<OAuth2Client> {
  let credentialsRaw: string;

  try {
    credentialsRaw = await readFile(CREDENTIALS_PATH, 'utf-8');
  } catch {
    const setupMessage = `
❌ Google API credentials not found!

The file 'client_secret.json' is required for Google Sheets access.

📋 Setup Instructions:
1. Go to Google Cloud Console (https://console.cloud.google.com/)
2. Create a project and enable Google Sheets API
3. Create OAuth 2.0 credentials (Desktop Application type)
4. Download the credentials file as 'client_secret.json'
5. Place it in: ${CREDENTIALS_PATH}

💡 For GUI development, place it in your project root directory (same folder as package.json).

📖 See SETUP.md for detailed instructions.
        `;

    console.error(setupMessage);
    throw new Error(
      `Google API credentials file (client_secret.json) not found at: ${CREDENTIALS_PATH}. See SETUP.md for instructions.`,
    );
  }

  const credentials = JSON.parse(credentialsRaw) as Credentials;
  const creds = credentials.installed || credentials.web;

  const oAuth2Client = new google.auth.OAuth2(
    creds!.client_id,
    creds!.client_secret,
    creds!.redirect_uris[0],
  );

  try {
    const token = await readFile(TOKEN_PATH, 'utf-8');
    oAuth2Client.setCredentials(JSON.parse(token));

    // Test the token by making a harmless request
    await oAuth2Client.getAccessToken();

    return oAuth2Client;
  } catch (err: unknown) {
    // Check if error has response property (Google API error)
    const hasResponse =
      err &&
      typeof err === 'object' &&
      'response' in err &&
      err.response &&
      typeof err.response === 'object' &&
      'data' in err.response &&
      err.response.data &&
      typeof err.response.data === 'object' &&
      'error' in err.response.data;

    const errorCode = hasResponse
      ? (err as { response: { data: { error?: string } } }).response.data.error
      : undefined;

    if (errorCode === 'invalid_grant') {
      console.warn('⚠️ Token expired or revoked. Regenerating...');
      await unlink(TOKEN_PATH);

      return await getNewToken(oAuth2Client);
    }

    return await getNewToken(oAuth2Client);
  }
}

async function getNewToken(oAuth2Client: OAuth2Client): Promise<OAuth2Client> {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('📡 Authorizing application in your browser...');
  await open(authUrl, { wait: false });

  const server = createServer(async (req, res) => {
    try {
      if (!req.url || !req.url.includes('/?code=')) return;

      const url = new URL(req.url, 'http://localhost');
      const code = url.searchParams.get('code');

      if (!code) throw new Error('No code in request');

      const { tokens } = await oAuth2Client.getToken(code);

      if (!tokens.access_token && !tokens.refresh_token) {
        throw new Error('❌ Token exchange failed — no access or refresh token.');
      }

      console.log(`🔐 Authorization successful!`);
      console.log(`📅 Token expires: ${new Date(tokens.expiry_date!).toLocaleString()}`);

      oAuth2Client.setCredentials(tokens);
      await writeFile(TOKEN_PATH, JSON.stringify(tokens), 'utf-8');

      res.end('Authorization successful! You can close this tab.');
      server.destroy();

      return;
    } catch (err) {
      console.error('❌ Error handling OAuth callback:', err);
      res.end('❌ Error during authentication.');
      server.destroy();
    }
  }).listen(80);

  destroyer(server);

  return new Promise((res, rej) => {
    server.on('close', () => res(oAuth2Client));
    server.on('error', rej);
  });
}
