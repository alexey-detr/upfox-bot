'use strict';

var TelegramBot = require('node-telegram-bot-api');
var SoftwarePoller = new require('./software-poller').SoftwarePoller;
var db = new require('./db').db;

var token = '185864451:AAHNK55-esjCL2X1-1n4Up9KZ1VPCkscF9Q';
var bot = new TelegramBot(token, {polling: true});
var softwarePoller = new SoftwarePoller();
var watchingUserIds;

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
      watchingUserIds.forEach((userId) => console.log(userId));
      resolve();
    });
  });
}
function persistWatchingUsers() {
  db.put('watching-user-ids', [...watchingUserIds]);
}

initWatchingUsers().then(() => {
  softwarePoller.init().then(() => {
    var poll = () => {
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
      let message = "Hi! I'm Upfox, and I will help you to watch a new versions of software!\n" +
        "Type /help to learn more.";
      bot.sendMessage(msg.from.id, message);
    }
  },
  {
    pattern: /^\/help$/,
    action: (msg, match) => {
      let message =
        "Hey! You can use following commands:\n\n" +
        "/list – to list the software I'm watching for\n" +
        "/poll – to get info about fresh versions I've found for ya ^^";
      bot.sendMessage(msg.from.id, message);
    }
  },
  {
    pattern: /^\/list$/,
    action: (msg, match) => {
      var fromId = msg.from.id;
      bot.sendMessage(fromId, softwarePoller.list(), {disable_web_page_preview: true});
    }
  },
  {
    pattern: /^\/poll$/,
    action: (msg, match) => {
      var message = softwarePoller.textInfo;
      if (message === null) {
        message = "I'm sleeping... Zzzz";
      }
      bot.sendMessage(msg.from.id, message, {disable_web_page_preview: true});
    }
  },
  {
    pattern: /^\/watch$/,
    action: (msg, match) => {
      if (watchingUserIds.has(msg.from.id)) {
        return bot.sendMessage(msg.from.id, "But you are already in watchers list...");
      }
      bot.sendMessage(msg.from.id, "You're watching now!");
    }
  },
  {
    pattern: /^\/stat$/,
    action: (msg, match) => {
      bot.sendMessage(msg.from.id, `Current number of watchers: ${watchingUserIds.size.toString()}`);
    }
  },
  {
    pattern: /^\/myid$/,
    action: (msg, match) => {
      bot.sendMessage(msg.from.id, `Your user ID is ${msg.from.id}`);
    }
  }
].forEach((action) => {
  bot.onText(action.pattern, (msg, match) => {
    action.action(msg, match);
    watchingUserIds.add(msg.from.id);
    persistWatchingUsers();
  });
});
