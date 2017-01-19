'use strict';

module.exports = {
  name: 'Docker',
  url: 'https://github.com/docker/docker/releases.atom',
  urlDownload: 'https://www.docker.com/',
  pattern: /\/docker\/docker\/releases\/tag\/v([0-9\.]+)/,
  validateVersion: (version) => !/-rc[0-9]+/.test(version)
};
