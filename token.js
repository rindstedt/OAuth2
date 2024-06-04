const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const TOKEN_FILE = path.join(__dirname, 'token.json');
require('dotenv').config();

const MAX_RETRIES = 3; // Max antal försök att förnya token

async function refresh(refreshToken) {
    const credentials = Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64');
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`
    };

    try {
        const tokenResponse = await axios.post('https://apps.fortnox.se/oauth-v1/token', `refresh_token=${refreshToken}&grant_type=refresh_token`, { headers });
        return {
            accessToken: tokenResponse.data.access_token,
            newRefreshToken: tokenResponse.data.refresh_token,
            expires: Date.now() + tokenResponse.data.expires_in * 1000
        };
    } catch (error) {
        console.error('Error refreshing access token:', error);
        throw error;
    }
}

async function readTokenData() {
    try {
        const tokenData = await fs.readFile(TOKEN_FILE, 'utf-8');
        return JSON.parse(tokenData);
    } catch (error) {
        console.error('Error reading token file:', error);
        throw error;
    }
}

async function renew(retries = 0) {
    try {
        const { refreshToken } = await readTokenData();
        const { accessToken, newRefreshToken, expires } = await refresh(refreshToken);
        await fs.writeFile(TOKEN_FILE, JSON.stringify({ accessToken, expires, refreshToken: newRefreshToken }));
        return {
            'Authorization': `Bearer ${accessToken}`
        };
    } catch (error) {
        if (retries < MAX_RETRIES) {
            console.log(`Retrying token renewal (${retries + 1}/${MAX_RETRIES})...`);
            return await renew(retries + 1);
        } else {
            console.error('Max retries reached. Failed to renew access token.');
            throw error;
        }
    }
}

async function get() {
    try {
        const { accessToken, expires } = await readTokenData();
        if (Date.now() > expires) {
            console.log('Access token has expired, renewing...');
            return await renew();
        }
        return {
            'Authorization': `Bearer ${accessToken}`
        };
    } catch (error) {
        console.error('Error getting access token:', error);
        throw error;
    }
}

module.exports = {
    get,
    renew
};
