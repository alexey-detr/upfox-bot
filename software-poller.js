'use strict';

var fs = require('fs');
var path = require('path');

class SoftwarePoller {
  constructor() {
    this.polls = [];
    this.walk(path.join(__dirname, 'polls'), (err, files) => {
      if (err) {
        throw err;
      }
      files.forEach((file) => {
        let poll = require(file).options;
        if (poll.code !== path.basename(file, '.js')) {
          throw new Error('Please make sure that file name is the same as code of poll. Found inconsistency in ' . file);
        }
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
      .map((item) => item.code)
      .join('\n');
  }

  poll() {

  }
}

module.exports = new SoftwarePoller();
