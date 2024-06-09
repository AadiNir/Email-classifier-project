const express = require('express')
const { google } = require('googleapis');
const router = express.Router();
const credentials = require('./credentials.json')
const cookieParser = require('cookie-parser');

const oAuth2Client = new google.auth.OAuth2(
    credentials.web.client_id,
    credentials.web.client_secret,
    credentials.web.redirect_uris[1]
  );

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/gmail.readonly','https://www.googleapis.com/auth/userinfo.profile']
});


router.get('/getemails', async (req, res) => {
    return res.send(authUrl)
  });

  router.get('/newoauthcallbacknew', async (req, res) => {
    try {
        const code = req.query.code;
        const { tokens } =await oAuth2Client.getToken(code);
         res.cookie('acctoken', JSON.stringify(tokens), {
          httpOnly: false,  // Change to true if you want the cookie to be accessible only by the server
          secure: true,    // Set to true if using HTTPS
          maxAge: 3600000,  // 1 hour
          sameSite: 'lax',
        });
        oAuth2Client.setCredentials({access_token: tokens.access_token});    // use the new auth client with the access_token
        let oauth2 = google.oauth2({
            auth: oAuth2Client,
            version: 'v2'
          });        
          let { data } = await oauth2.userinfo.get();    
          return res.json(data)
    } catch (error) {
        console.log(error)
    }
});

router.get('/oauth2callback', async (req, res) => {
    try {
        let numberofemails = req.query.count
        let token = req.cookies.acctoken;
        if (!token) {
            throw new Error('Token not found');
        }

        oAuth2Client.setCredentials(JSON.parse(token));

        const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
        const response = await gmail.users.messages.list({
            userId: 'me',
            maxResults: numberofemails
        });

        const emails = await Promise.all(response.data.messages.map(async (message) => {
            const email = await gmail.users.messages.get({
                userId: 'me', 
                id: message.id,
                format: 'full'
            });

            const headers = email.data.payload.headers;
            const subject = headers.find(header => header.name === 'Subject')?.value || '';
            const from = headers.find(header=>header.name==='From')?.value || '';
            const to = headers.find(header=>header==='Delivered-To')?.value || '';
            const labels = email.data.labelIds;
            const body = email.data.payload.parts?.find(part => part.mimeType === 'text/plain')?.body?.data || '';

            return { subject,labels, body,from,to };
        }));

        // Send the processed emails as JSON response
        res.json(emails);
    } catch (error) {
        console.error('Error retrieving emails:', error);
        res.status(500).send('Error retrieving emails');
    }
});

module.exports = router


