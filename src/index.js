const TelegramBot = require('node-telegram-bot-api');

const SoftwarePoller = require('./SoftwarePoller');
const db = new require('./db');
const token = require('./token');

let bot = new TelegramBot(token, { polling: true });
let softwarePoller = new SoftwarePoller();
let watchingUserIds;

function initWatchingUsers() {
    return new Promise((resolve, reject) => {
        db.get('watching-user-ids', (err, value) => {
            if (err && !err.notFound) {
                return reject(err);
            }
            if (err && err.notFound) {
                watchingUserIds = new Set();
            } else {
                watchingUserIds = new Set(value);
            }
            console.log(`Initialized ${watchingUserIds.size} watching user(s)`);
            watchingUserIds.forEach(userId => console.log(userId));
            resolve();
        });
    });
}

function persistWatchingUsers() {
    db.put('watching-user-ids', [...watchingUserIds]);
}

initWatchingUsers().then(() => {
    softwarePoller.init().then(() => {
        let poll = () => {
            softwarePoller.poll().catch((err) => {
                console.error(err.message);
            });
        };
        softwarePoller.onNewVersion = (software) => {
            watchingUserIds.forEach((userId) => {
                bot.sendMessage(userId, `Hey! Here is a new version of ${software.textInfo}`);
            });
        };
        setInterval(poll, 3000);
        poll();
    }).catch((err) => { throw err; });
}).catch((err) => { throw err; });

[
    {
        pattern: /^\/start$/,
        action: (msg, match) => {
            let message = 'Hi! I\'m Upfox, and I will help you to watch a new versions of software!\n' +
                'Type /help to learn more.';
            bot.sendMessage(msg.from.id, message);
        },
    },
    {
        pattern: /^\/help$/,
        action: (msg, match) => {
            let message =
                'Hey! You can use following commands:\n\n' +
                '/list – to get info about all fresh versions I\'ve found for ya ^^';
            bot.sendMessage(msg.from.id, message);
        },
    },
    {
        pattern: /^\/list$/,
        action: (msg, match) => {
            let message = softwarePoller.textInfo;
            if (message === null) {
                message = 'I\'m sleeping... Zzzz';
            }
            bot.sendMessage(msg.from.id, message, { disable_web_page_preview: true });
        },
    },
    {
        pattern: /^\/stat$/,
        admin: true,
        action: (msg, match) => {
            bot.sendMessage(msg.from.id, `Current number of watchers: ${watchingUserIds.size.toString()}`);
        },
    },
].forEach((action) => {
    bot.onText(action.pattern, (msg, match) => {
        if (action.admin && msg.from.id !== 100396221) {
            return;
        }
        action.action(msg, match);
        watchingUserIds.add(msg.from.id);
        persistWatchingUsers();
    });
});
