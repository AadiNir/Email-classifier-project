const express = require('express');
const { google } = require('googleapis');
const router = express.Router();
const credentials = require('./credentials.json');
const cookieParser = require('cookie-parser');

const oAuth2Client = new google.auth.OAuth2(
    credentials.web.client_id,
    credentials.web.client_secret,
    credentials.web.redirect_uris[1] // Ensure this matches your registered redirect URI
);

const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/userinfo.profile'],
});

router.get('/getemails', async (req, res) => {
    return res.send(authUrl);
});

router.post('/oauth2callback', async (req, res) => {
    try {
        const code = req.query.code;
        if (!code) {
            throw new Error('Authorization code not provided');
        }
        const { tokens } = await oAuth2Client.getToken(code);
        res.cookie('acctoken', JSON.stringify(tokens), {
            httpOnly: true,
            secure: false,    // Set to true if using HTTPS
            maxAge: 3600000,  // 1 hour
            same_site: 'none',
      
        });
        console.loog(tokens)
        oAuth2Client.setCredentials(tokens);

        const oauth2 = google.oauth2({
            auth: oAuth2Client,
            version: 'v2'
        });

        const { data } = await oauth2.userinfo.get();
        res.json(data);
    } catch (error) {
        console.error('Error during OAuth callback:', error);
        res.status(500).send('Authentication error');
    }
});


router.get('/fetchmails', async (req, res) => {
    try {
        const numberofemails = req.query.count;
        const token = req.cookies.acctoken;

        if (!token) {
            return res.status(401).send('Unauthorized: Token not found');
        }

        oAuth2Client.setCredentials(JSON.parse(token));

        const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
        const response = await gmail.users.messages.list({
            userId: 'me',
            maxResults: numberofemails,
        });

        const emails = await Promise.all(response.data.messages.map(async (message) => {
            const email = await gmail.users.messages.get({
                userId: 'me',
                id: message.id,
                format: 'full',
            });

            const headers = email.data.payload.headers;
            const subject = headers.find(header => header.name === 'Subject')?.value || '';
            const from = headers.find(header => header.name === 'From')?.value || '';
            const to = headers.find(header => header.name === 'Delivered-To')?.value || '';
            const labels = email.data.labelIds;
            const body = email.data.payload.parts?.find(part => part.mimeType === 'text/plain')?.body?.data || '';

            return { subject, labels, body, from, to };
        }));

        res.json(emails);
    } catch (error) {
        console.error('Error retrieving emails:', error);
        res.status(500).send('Error retrieving emails');
    }
});

module.exports = router;
