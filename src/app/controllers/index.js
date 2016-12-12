'use strict';

import { Router } from 'express';
import { Authenticator } from '../helpers/authenticator.js';
import * as bot from '../helpers/botkit';

const router = Router();

router.get('/', (req, res, next) => res.render('index', { title: 'J.A.C.S.H.I.P', installed: false }));

router.get('/new', (req, res, next) => {
    let auth_code = req.query.code;

    if (!auth_code) {
        res.redirect('/');
    }

    let auth = new Authenticator(auth_code);

    auth.authenticate().then((auth) => {
        bot.register_team(auth);
        res.render('index', { title: 'J.A.C.S.H.I.P', installed: true, team_name: 'PortalWatchers' });
    });
});

export default router;
