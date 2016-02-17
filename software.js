'use strict';

var path = require('path');
var Promise = require('bluebird');
var request = require('request');

class Software {
  constructor(file) {
    let config = require(file);
    config.code = path.basename(file, '.js');

    this.name = config.name;
    this.code = config.code;
    this.url = config.url;
    this.urlDownload = config.urlDownload;
    this.pattern = config.pattern;
    this.textInfo = '';
    this.lastPolledAt = null;

    this.version = null;
    this.onNewVersion = () => {};
    this.timeout = config.timeout ? config.timeout : 5 * 60 * 1000;
  }

  poll() {
    return new Promise((resolve, reject) => {
      if (this.lastPolledAt !== null && Date.now() - this.lastPolledAt <= this.timeout) {
        return resolve();
      }
      console.log(`Polling software with code '${this.code}'...`);
      request(this.url, (err, response, body) => {
        this.lastPolledAt = Date.now();
        if (err) {
          console.error(`An error occurred while polling ${this.code}: ${err.message}`);
          return reject(err);
        }
        if (response.statusCode !== 200) {
          console.error(`Got ${response.statusCode} HTTP status code when polling ${this.code}`);
          return reject(err);
        }
        let matches = this.pattern.exec(body);
        if (matches === null) {
          this.textInfo = `${this.name} can't parse version!`;
        } else {
          let url = this.urlDownload ? this.urlDownload : this.url;
          if (this.version !== null && this.version !== matches[1]) {
            this.onNewVersion(this);
          }
          this.version = matches[1];
          this.textInfo = `${this.name} ${this.version}\n${url}`;
        }
        resolve();
      });
    });
  }
}

module.exports.Software = Software;