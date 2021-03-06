let giveawayTrackerTable = document.querySelector('#giveaway_tracker_table');
let simulateDrawingButton = document.querySelector('#simulateDrawing');
let winnerPTag = document.querySelector('#winner');

function getCSV(callback) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            callback(null, d3.csvParse(this.responseText));
        } else if (this.readyState == 4 && this.status != 200) {
            callback(`Error Code: ${this.status}`, null);
        }
    };
    xhttp.open('GET', 'https://raw.githubusercontent.com/Wilson-Cal/Giveaway-Tracker/master/50for50.csv', true);
    xhttp.send();
}

function buildTable(followerData) {
    followerData.forEach(row => {
        let rowData = [row.Followers, row.Entries, row['Last Message Timestamp']];
        let tr = document.createElement('tr');
        rowData.forEach((element, i) => {
            let td = document.createElement('td');
            let value;
            if (i === 2) {
                if (element) {
                    element = moment(parseInt(element)).format('MM-DD-YYYY');
                } else {
                    element = 'N/A';
                }
            }
            value = document.createTextNode(element);
            td.appendChild(value);
            tr.append(td);
        });
        giveawayTrackerTable.appendChild(tr);
    });
}

function buildArray(csv) {
    let data = [];
    csv.forEach(row => {
        for (let i = 0; i < row.Entries; i++) {
            data.push(row.Followers);
        }
    });
    return data;
}

function scrambleArray(data) {
    for (let i = data.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [data[i], data[j]] = [data[j], data[i]];
    }
    return data;
}

function selectWinner(scrambledArray) {
    let randomNumber = Math.floor(Math.random() * (scrambledArray.length));
    winnerPTag.innerHTML = `Simulated Winner: ${scrambledArray[randomNumber]}`;
}

function simulateDrawing(followerData) {
    let data = buildArray(followerData);
    let scrambledArray = scrambleArray(data);
    selectWinner(scrambledArray);
}

// Start Here
getCSV((err, followerData) => {
    if (err) {
        console.error(err);
        return;
    } else {
        buildTable(followerData);
        simulateDrawingButton.addEventListener('click', () => {
            simulateDrawing(followerData);
        });
    }
});