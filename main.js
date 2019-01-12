const https = require('https');
const d3 = require('d3-dsv');
const fs = require('fs');
const asyncLib = require('async');
const moment = require('moment');


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
        if (err) {
            callback(err, null);
            return;
        }
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
                Entries: 1,
                'Last Message Timestamp': ''
            });
        }
    });
    return csv;
}

function getUserData(formattedMessages) {
    let userData = [];
    formattedMessages.forEach(fMessage => {
        userData.push(fMessage.map(element => {
            if (/^tmi-sent-ts=/.test(element)) {
                let i = element.indexOf('=');
                return element.slice(i + 1);
            } else if (/^user-type=/.test(element)) {
                let i1 = element.indexOf(':');
                let i2 = element.indexOf('!');
                return element.slice(i1 + 1, i2);
            }
        }));
    });
    return userData;
}

function checkParticpants(messages, csv) {
    let formattedMessages = messages.map(message => {
        return message.split(';', 14);
    });
    formattedMessages = formattedMessages.map(fMessage => {
        return fMessage.filter(element => {
            if (/^tmi-sent-ts=/.test(element)) {
                return true;
            } else if (/^user-type=/.test(element)) {
                return true;
            }
            return false;
        });
    });
    let userData = getUserData(formattedMessages);
    userData.forEach(element => {
        let twitchDate = moment(parseInt(element[0]));
        let currentUserTwitch = element[1];
        csv.forEach(row => {
            let lastMessageTimestamp = row['Last Message Timestamp'];
            if (lastMessageTimestamp === '' && currentUserTwitch.toLowerCase() === row.Followers.toLowerCase()) {
                row.Entries++;
                row['Last Message Timestamp'] = element[0];
            } else if (lastMessageTimestamp && currentUserTwitch.toLowerCase() === row.Followers.toLowerCase()) {
                let csvDate = moment(parseInt(lastMessageTimestamp));
                if (twitchDate.dayOfYear() > csvDate.dayOfYear()) {
                    row.Entries++;
                    row['Last Message Timestamp'] = element[0];
                }
            }
        });
    });
    return csv;
}

function writeCSV(updatedCSV) {
    fs.writeFile('./50for50.csv', d3.csvFormat(updatedCSV), err => {
        if (err) {
            console.error(err);
        }
        console.log('CSV Updated Successfully');
    });
}

// Start Here
fs.readFile('./auth.txt', 'utf8', (err, result) => {
    options.headers['Client-ID'] = result;
    asyncLib.map(apiCalls, getTwitchInfo, (err, data) => {
        if (err) {
            console.error(err);
            return;
        }
        parseCSV('./50for50.csv', (err, csv) => {
            if (err) {
                console.error(err);
                return;
            }
            let updatedCSV = checkFollowers(data[0].data, csv);
            updatedCSV = checkParticpants(data[1].messages, updatedCSV);
            writeCSV(updatedCSV);
        });
    });
});