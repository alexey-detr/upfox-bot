const axios = require('axios');

function processVersion(version) {
    return version.replace('-', ' ')
        .replace(/beta(\d)/, (match, digit) => {
            return `beta ${digit}`;
        });
}

class Software {
    constructor(config) {
        this.disabled = !!config.disabled;
        this.name = config.name;
        this.code = config.code;
        this.url = config.url;
        this.debug = config.debug;
        this.urlDownload = config.urlDownload;
        this.validateVersion = config.validateVersion;
        this.pattern = config.pattern;
        this.textInfo = '';
        this.lastPolledAt = null;

        this.version = null;
        this.onNewVersion = () => {};
        this.timeout = config.timeout ? config.timeout : 3 * 60 * 1000;

        if (this.debug) {
            this.timeout = 10 * 1000;
        }
    }

    poll() {
        return new Promise((resolve, reject) => {
            if (this.lastPolledAt !== null && Date.now() - this.lastPolledAt <= this.timeout) {
                return resolve();
            }
            console.log(`Polling software '${this.code}'...`);
            this.lastPolledAt = Date.now();
            axios.get(this.url)
                .then(response => {
                    if (response.status !== 200) {
                        const message = `Got ${response.statusCode} HTTP status code when polling ${this.code}`;
                        console.error(message);
                        return reject(new Error(message));
                    }
                    const matches = this.pattern.exec(response.data);
                    if (matches === null) {
                        this.textInfo = `${this.name} can't parse version!`;
                        console.error(`Can't parse version for ${this.code} with pattern ${this.pattern} on page ${this.url}`);
                        return resolve();
                    }

                    const url = this.urlDownload ? this.urlDownload : this.url;
                    const oldVersion = this.version;
                    const newVersion = processVersion(matches[1]);

                    if (typeof this.validateVersion === 'function' && !this.validateVersion(newVersion)) {
                        return resolve();
                    }
                    this.textInfo = `${this.name} ${newVersion}\n${url}`;
                    this.version = newVersion;

                    if (oldVersion !== null && oldVersion !== newVersion) {
                        console.log(`Found a new version ${newVersion} for '${this.code}'`);
                        this.onNewVersion(this);
                    } else if (oldVersion !== null) {
                        console.log(`Version for '${this.code}' is still the same '${oldVersion}'`);
                    }

                    resolve();
                })
                .catch(err => {
                    console.error(`An error occurred while polling ${this.code}: ${err.message}`);
                    return err;
                });
        });
    }
}

module.exports = Software;
