const levelup = require('levelup');
const leveldown = require('leveldown');
const encode = require('encoding-down');

const db = levelup(encode(leveldown('./database'), {
    valueEncoding: 'json',
}));

module.exports = db;
