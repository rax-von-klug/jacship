'use strict';

import dotenv from 'dotenv';
import path from 'path';
import bodyParser from 'body-parser';
import compress from 'compression';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import favicon from 'serve-favicon';
import config from './config';
import controllers from './app/controllers';
import logger from './app/helpers/logger';

dotenv.load({ path: config.root + '/.env' });

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(config.root, 'app/views'));

app.use(express.static(path.join(config.root, 'static')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(compress());
app.use(cookieParser());
app.use(favicon(path.join(config.root, 'static/img/favicon.png')));
app.use(helmet());

app.use('/', controllers);

app.listen(config.port, () => {
  logger.info(`listening on port ${config.port}`);
});