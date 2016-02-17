'use strict';

var fs = require('fs');
var path = require('path');
var cheerio = require('cheerio');
var async = require('async');
var Promise = require('bluebird');
var Software = require('./software').Software;

class SoftwarePoller {
  constructor() {
    this.softwareList = [];
    this.textInfo = null;
    this.onNewVersion = () => {};
  }

  init() {
    return new Promise((resolve, reject) => {
      this.walk(path.join(__dirname, 'polls'), (err, files) => {
        if (err) {
          return reject(err);
        }
        this.softwareList = files
          .filter((file) => !/test\.js$/.test(file))
          .map((file) => new Software(file));
        this.softwareList.forEach((software) => {
          software.onNewVersion = (software) => {
            this.onNewVersion(software);
          }
        });
        resolve();
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
    return this.softwareList
      .map((item) => item.name)
      .sort((a, b) => a.localeCompare(b))
      .join('\n');
  }

  poll() {
    return new Promise((resolve, reject) => {
      let results = [];
      async.eachLimit(this.softwareList, 4, (software, next) => {
        software.poll().then(() => {
          results.push(software.textInfo);
          next();
        }).catch(next);
      }, (err) => {
        if (err) {
          console.error(`An error occurred while polling: ${err.message}`);
          return reject(err);
        }
        this.textInfo = results.sort((a, b) => a.localeCompare(b))
          .join('\n\n');
        resolve();
      });
    });
  }
}

module.exports.SoftwarePoller = SoftwarePoller;
