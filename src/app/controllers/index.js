'use strict';

import { Router } from 'express';
import { Authenticator } from '../helpers/authenticator.js';
import { SlackController } from './slack';
import * as bot from '../helpers/botkit';

const router = Router();

router.use('/slack', SlackController);

router.get('/', (req, res, next) => res.render('index', { title: 'J.A.C.S.H.I.P', installed: false }));

router.get('/new', (req, res, next) => {
    let auth_code = req.query.code;

    if (!auth_code) {
        res.redirect('/');
    }

    let auth = new Authenticator(auth_code);

    auth.authenticate().then((auth) => {
        bot.register_team(auth).then((team) => {
            res.render('index', { title: 'J.A.C.S.H.I.P', installed: true, team_name: team.name });
        });
    });
});

export default router;
