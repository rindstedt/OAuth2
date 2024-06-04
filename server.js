const express = require('express');
const axios = require('axios');
const app = express();

require('dotenv').config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = 'https://75a8-79-136-76-30.ngrok-free.app/activation';
const STATE = 'mystate123';

app.get('/auth', (req, res) => {
    const authUrl = `https://apps.fortnox.se/oauth-v1/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent('article invoice costcenter customer payment offer price supplierinvoice supplier')}&state=${encodeURIComponent(STATE)}&access_type=offline&response_type=code&account_type=service`;
    console.log("Redirecting to Fortnox authentication:", authUrl); // Logga autentiserings-URL:en
    res.redirect(authUrl);
});

app.get('/activation', async (req, res) => {
    console.log("Received request:", req.query); // Logga hela req-objektet för felsökning

    const authorizationCode = req.query.code;
    const state = req.query.state;

    console.log("Received authorization code:", authorizationCode); // Logga den mottagna autorisationskoden
    console.log("Received state:", state); // Logga det mottagna "state"-värdet

    if (state !== STATE) {
        console.error('Invalid state parameter:', state); // Logga felmeddelande om ogiltig "state"-parameter
        return res.status(400).send('Invalid state parameter');
    }

    try {
        const tokenResponse = await axios.post('https://apps.fortnox.se/oauth-v1/token', {
            code: authorizationCode,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            grant_type: 'authorization_code'
        });

        const accessToken = tokenResponse.data.access_token;
        const refreshToken = tokenResponse.data.refresh_token;

        res.send(`Access Token: ${accessToken}, Refresh Token: ${refreshToken}`);
    } catch (error) {
        console.error('Error fetching access token:', error); // Logga felmeddelande vid felaktig åtkomst
        res.status(500).send('Error fetching access token');
    }
});

const PORT = 1337;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
