'use strict';

var TelegramBot = require('node-telegram-bot-api');
var softwarePoller = require('./software-poller');

var token = '185864451:AAHNK55-esjCL2X1-1n4Up9KZ1VPCkscF9Q';
var bot = new TelegramBot(token, {polling: true});

bot.onText(/\/help/, (msg, match) => {
  let message =
    "Hi I'm Upfox, and I will help you to watch a new versions of software!\n" +
    "You can use following commands:\n\n" +
    "/list – to list the software I'm watching for\n" +
    "/poll – to get info about fresh versions I've found for ya ^^";
  bot.sendMessage(msg.from.id, message);
});

bot.onText(/\/list/, (msg, match) => {
  var fromId = msg.from.id;
  bot.sendMessage(fromId, softwarePoller.list(), {disable_web_page_preview: true});
});

bot.onText(/\/poll/, (msg, match) => {
  softwarePoller.poll((result) => {
    bot.sendMessage(msg.from.id, result, {disable_web_page_preview: true});
  });
});
