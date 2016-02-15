var TelegramBot = require('node-telegram-bot-api');
var softwarePoller = require('./software-poller');

var token = '185864451:AAHNK55-esjCL2X1-1n4Up9KZ1VPCkscF9Q';
var bot = new TelegramBot(token, {polling: true});

bot.onText(/\/echo (.+)/, (msg, match) => {
  var fromId = msg.from.id;
  var resp = match[1];
  bot.sendMessage(fromId, resp);
});

bot.onText(/\/list/, (msg, match) => {
  var fromId = msg.from.id;
  bot.sendMessage(fromId, softwarePoller.list());
});
