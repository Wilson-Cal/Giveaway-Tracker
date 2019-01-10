const https = require('https');

https.get('https://api.twitch.tv/helix/streams?game_id=33214', (resp) => {
    let data = '';

    // A chunk of data has been recieved.
    resp.on('data', (chunk) => {
        data += chunk;
    });

    // The whole response has been received. Print out the result.
    resp.on('end', () => {
        console.log(JSON.parse(data).explanation);
    });

}).on('error', (err) => {
    console.log('Error: ' + err.message);
});