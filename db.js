'use strict';

var levelup = require('levelup');
var db = levelup('./database', {
  valueEncoding: 'json'
});

module.exports.db = db;
