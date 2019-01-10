const https = require('https');
const d3 = require('d3-dsv');
const fs = require('fs');
const asyncLib = require('async');

let options = {
    host: 'tmi.twitch.tv',
    method: 'GET',
    headers: {
        'Client-ID': ''
    }
};

let apiCalls = [{
    host: 'api.twitch.tv',
    path: '/helix/users/follows?to_id=57764039&first=100'
}, {
    host: 'tmi.twitch.tv',
    path: '/api/rooms/57764039/recent_messages'
}];

function getTwitchInfo(apiCall, callback) {
    options.host = apiCall.host;
    options.path = apiCall.path;
    https.get(options, (resp) => {
        let data = '';

        // A chunk of data has been recieved.
        resp.on('data', (chunk) => {
            data += chunk;
        });

        // The whole response has been received. Print out the result.
        resp.on('end', () => {
            let newData = JSON.parse(data);
            callback(null, newData);
        });

    }).on('error', (err) => {
        console.log('Error: ' + err.message);
    });
}

function parseCSV(filepath, callback) {
    fs.readFile(filepath, 'utf8', (err, data) => {
        let parsedCSV = d3.csvParse(data);
        callback(null, parsedCSV);
    });
}

function checkFollowers(followers, csv) {
    followers.forEach(follower => {
        let followCheck = csv.every(row => follower.from_name !== row.Followers);
        if (followCheck) {
            csv.push({
                Followers: follower.from_name,
                Entries: 1
            });
        }
    });
    return csv;
}

function checkParticpants(messages, csv) {
    let formattedMessages = messages.map(message => {
        return message.split(';', 14);
    });
    formattedMessages = formattedMessages.map(fMessage => {
        return [fMessage[10], fMessage[fMessage.length - 1]]; // Regex
    });
    console.log(formattedMessages);
}

function writeCSV(updatedCSV) {
    fs.writeFile('./50for50.csv', d3.csvFormat(updatedCSV), err => {
        if (err) {
            console.error(err);
        }
    });
}

asyncLib.map(apiCalls, getTwitchInfo, (err, data) => {
    if (err) {
        console.error(err);
    }
    parseCSV('./50for50.csv', (err, csv) => {
        let updatedCSV = checkFollowers(data[0].data, csv);
        updatedCSV = checkParticpants(data[1].messages, updatedCSV);
        //writeCSV(updatedCSV);
    });
});