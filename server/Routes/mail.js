require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');
const open = require('open');
const bodyParser = require('body-parser');
const credentials = require('./credentials.json');

const app = express();
const PORT = process.env.PORT || 3000;

// OAuth2 Client
const oAuth2Client = new google.auth.OAuth2(
  credentials.web.client_id,
  credentials.web.client_secret,
  'http://localhost:3000'
);

// Generate Auth URL
const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/gmail.readonly'],
});

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send(`<a href="${authUrl}">Authenticate with Google</a>`);
});

// OAuth2 callback endpoint
app.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send('Missing authorization code');
  }

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Save tokens to environment variables or database securely
    console.log('Access Token:', tokens.access_token);
    console.log('Refresh Token:', tokens.refresh_token);

    // Save tokens to local storage (you can use a database in production)
    res.cookie('access_token', tokens.access_token);
    res.cookie('refresh_token', tokens.refresh_token);

    res.send('Authentication successful! You can close this tab.');
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Endpoint to get emails using tokens
app.post('/api/emails', async (req, res) => {
  const { accessToken, refreshToken } = req.body;

  if (!accessToken || !refreshToken) {
    return res.status(400).send('Missing access or refresh token');
  }

  oAuth2Client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });

  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

  try {
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 5,
    });

    const messages = response.data.messages || [];

    const emails = await Promise.all(
      messages.map(async (message) => {
        const msg = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
        });
        return msg.data;
      })
    );

    res.json(emails);
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Open this URL to start the authentication process: ${authUrl}`);
  open(authUrl);
});
