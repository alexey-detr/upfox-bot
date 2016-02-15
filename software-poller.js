'use strict';

var fs = require('fs');
var path = require('path');
var cheerio = require('cheerio');
var request = require('request');
var async = require('async');

class SoftwarePoller {
  constructor() {
    this.polls = [];
    this.walk(path.join(__dirname, 'polls'), (err, files) => {
      if (err) {
        throw err;
      }
      files.forEach((file) => {
        let poll = require(file);
        poll.code = path.basename(file, '.js');
        this.polls.push(poll);
      });
    });
  }

  walk(dir, done) {
    var results = [];
    fs.readdir(dir, (err, list) => {
      if (err) return done(err);
      var pending = list.length;
      if (!pending) return done(null, results);
      list.forEach((file) => {
        file = dir + '/' + file;
        fs.stat(file, (err, stat) => {
          if (stat && stat.isDirectory()) {
            this.walk(file, (err, res) => {
              results = results.concat(res);
              if (!--pending) done(null, results);
            });
          } else {
            if (/\.js$/.test(file)) {
              results.push(file);
            }
            if (!--pending) done(null, results);
          }
        });
      });
    })
  }

  list() {
    return this.polls
      .map((item) => item.name)
      .join('\n');
  }

  poll(callback) {
    let results = [];
    async.eachLimit(this.polls, 4, (poll, next) => {
      request(poll.url, (err, response, body) => {
        if (err) {
          console.error(`An error occurred while polling ${poll.code}: ${err.message}`);
          return next();
        }
        if (response.statusCode !== 200) {
          console.error(`Got ${response.statusCode} HTTP status code when polling ${poll.code}`);
          return next();
        }
        let resultItem = '';
        let matches = poll.pattern.exec(body);
        if (matches === null) {
          resultItem = `${poll.name} can't parse version!`;
        } else {
          resultItem = `${poll.name} ${matches[1]}\n${poll.url}`;
        }
        results.push(resultItem);
        next();
      });
    }, (err) => {
      if (err) {
        return console.error(`An error occurred while polling: ${err.message}`);
      }
      callback(results.sort((a, b) => a.localeCompare(b)).join('\n\n'));
    });
  }
}

module.exports = new SoftwarePoller();
