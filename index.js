'use strict';

var TelegramBot = require('node-telegram-bot-api');
var SoftwarePoller = new require('./software-poller').SoftwarePoller;

var token = '185864451:AAHNK55-esjCL2X1-1n4Up9KZ1VPCkscF9Q';
var bot = new TelegramBot(token, {polling: true});
var softwarePoller = new SoftwarePoller();
var watchingUserIds = new Set();

softwarePoller.init().then(() => {
  var poll = () => {
    softwarePoller.poll().catch((err) => {
      console.error(err.message);
    });
  };
  softwarePoller.onNewVersion = (software) => {
    watchingUserIds.forEach((userId) => {
      bot.sendMessage(userId, `Hey! Here is a new version of ${software.name}\n` + software.textInfo);
    });
  };
  setInterval(poll, 3000);
  poll();
}).catch((err) => { throw err; });

bot.onText(/\/start/, (msg, match) => {
  let message = "Hi! I'm Upfox, and I will help you to watch a new versions of software!\n" +
    "Type /help to learn more.";
  bot.sendMessage(msg.from.id, message);
});

bot.onText(/\/help/, (msg, match) => {
  let message =
    "Hey! You can use following commands:\n\n" +
    "/list – to list the software I'm watching for\n" +
    "/poll – to get info about fresh versions I've found for ya ^^\n" +
    "/watch – to start watching, I'll notify ya if something will change asap!\n" +
    "/unwatch – to stop watching";
  bot.sendMessage(msg.from.id, message);
});

bot.onText(/\/list/, (msg, match) => {
  var fromId = msg.from.id;
  bot.sendMessage(fromId, softwarePoller.list(), {disable_web_page_preview: true});
});

bot.onText(/\/poll/, (msg, match) => {
  var message = softwarePoller.textInfo;
  if (message === null) {
    message = "I'm sleeping... Zzzz";
  }
  bot.sendMessage(msg.from.id, message, {disable_web_page_preview: true});
});

bot.onText(/\/watch/, (msg, match) => {
  watchingUserIds.add(msg.from.id);
  bot.sendMessage(msg.from.id, "You're watching now!");
});

bot.onText(/\/unwatch/, (msg, match) => {
  watchingUserIds.delete(msg.from.id);
  bot.sendMessage(msg.from.id, "You've stopped watching.");
});
