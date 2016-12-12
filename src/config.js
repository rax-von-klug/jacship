'use strict';

import path from 'path';

export default {
  db: process.env.MONGOLAB_URI || 'mongodb://admin:password@ds011734.mlab.com:11734/johnny-hack',
  slack_id: process.env.SLACK_ID || '16375843078.39018770275',
  slack_redirect: process.env.SLACK_REDIRECT || 'http://localhost:5000/',
  slack_secret: process.env.SLACK_SECRET || 'e179e9f917c233cbaa26e85fabb27328',
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  root: path.normalize(__dirname)
};