const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const credentials = require('./credentials.json')

const app = express();
const port = 3000;

// Middleware setup
const allowedOrigins = ['http://localhost:3001']; // Add the frontend URL here

app.use(cors({
  origin: allowedOrigins,
  credentials: true // Allow credentials (cookies, authorization headers, etc.)
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
const oAuth2Client = new google.auth.OAuth2(
    credentials.web.client_id,
    credentials.web.client_secret,
    credentials.web.redirect_uris[1]
  );

// Generate the auth URL
const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/gmail.readonly']
});

// Route to start OAuth2 flow
app.get('/getemails', async (req, res) => {
    return res.send(authUrl)
  });
  

// Route to handle OAuth2 callback
app.get('/oauth2callback', async (req, res) => {
  const email = req.cookies.email;
  const code = req.query.code;

  // Exchange authorization code for access token
  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);

  // Use Gmail API to retrieve first 5 emails
  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
  const response = await gmail.users.messages.list({
    userId: 'me',
    maxResults: 5
  });

  const emails = response.data.messages;

  // Display emails
  res.json(emails);
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
