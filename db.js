'use strict';

const levelup = require('levelup');
const db = levelup('./database', {
  valueEncoding: 'json'
});

module.exports.db = db;
