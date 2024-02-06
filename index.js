const Slack = require("slack-node");
const axios = require('axios');
require('dotenv').config();

const webhookUrl = process.env.SLACK_WEBHOOK_URL;
const prodId = process.env.PROD_ID;
const pocCode = process.env.POC_CODE;
const sellType = process.env.SELL_TYPE;
const performanceDay = process.env.PERF_DAY;
const channelName = process.env.SLACK_CHANNEL_NAME;
const slack = new Slack();
slack.setWebhook(webhookUrl);
const baseUrl = 'https://tktapi.melon.com/api/product/schedule/list.json';

const send = async (message) => {
    slack.webhook({
        username: "<@U12345678> 티켓알리미",
        text: message,
        channel: channelName
    }, function (err, response) {
        console.log(response);
    });
}

function getFormattedTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); 
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hour}${minute}${second}`;
}


var requestUrl = `${baseUrl}?prodId=${prodId}&pocCode=${pocCode}&perfTypeCode=GN0001&sellTypeCode=${sellType}&corpCodeNo=&timestamp=${getFormattedTime()}&v=1`;


console.log(requestUrl);

const headers = {
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    'Connection': 'keep-alive',
    // 'Cookie': 'PCID=16602144656613347386364; PC_PCID=16602144656613347386364; search.perf=209371; ARY_CM=; TKT_POC_ID=AX25; NetFunnel_ID=WP15',
    'Host': 'tktapi.melon.com',
    'Origin': 'https://m.ticket.melon.com',
    'Referer': 'https://m.ticket.melon.com/',
    'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
    'Sec-Ch-Ua-Mobile': '?1',
    'Sec-Ch-Ua-Platform': '"Android"',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-site',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36'
};

async function checkSeatsAndNotify() {
    try {
        // Fetch the data from the API
        const response = await axios.get(requestUrl,{ headers: headers });
        const data = response.data; // The JSON data from the API

        console.log(JSON.stringify(data, null, 2));
        
        // Initialize the flags
        let isSeatCountAvailable = false;
        let isLockSeatCntlkGreaterThanZero = false;

        const perfDaylist = data.data.perfDaylist;

        const specificPerfDays = perfDaylist.filter((perfDay) => {
            return perfDay.someProperty === performanceDay; 
        });

        specificPerfDays.forEach((perfDay, index) => {
            perfDay.perfTimelist.forEach(perfTime => {
                console.log(`Performance Day ${index + 1}:`, perfDay);
                perfTime.seatGradelist.forEach(seatGrade => {
                    if (seatGrade.seatCount !== null) {
                        isSeatCountAvailable = true;
                    }
                    if (parseInt(seatGrade.lockSeatCntlk) > 0) {
                        isLockSeatCntlkGreaterThanZero = true;
                    }
                });
            });
        });

        if (isSeatCountAvailable) {
            await send("<@U12345678> 티켓 사세요!");
        }

        // Respond with the results
        res.json({
            isSeatCountAvailable,
            isLockSeatCntlkGreaterThanZero
        });

    } catch (error) {
        console.error('Error fetching data:', error);
        // res.status(500).send('An error occurred while fetching data.');
    }
}

checkSeatsAndNotify();
