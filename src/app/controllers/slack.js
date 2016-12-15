'use strict';

import { Router } from 'express';
import * as validator from '../helpers/validator';
import * as bot from '../helpers/botkit';
import * as messages from '../helpers/messages';

const router = Router();

router.post('/interactive', (req, res, next) => {
    let payload = JSON.parse(req.body.payload);

    if (payload.callback_id === "general_help") {

        if (payload.actions[0].value === 'show_all_topics') {
            res.send(messages.help_options_message);
        }

        if (payload.actions[0].value === 'register_help') {
            res.send(messages.register_team_help_message);
        }

        if (payload.actions[0].value === 'share_help') {
            res.send(messages.share_channel_help_message);
        }

        if (payload.actions[0].value === 'available_help') {
            res.send(messages.available_channel_help_message);
        }
    }
});

router.post('/commands/register', (req, res, next) => {
    let payload = req.body;

    if (validator.is_url(payload.text)) {
        bot.register_slack_team(payload.text, payload.team_id, (reply) => {
            res.send(reply);
        });
    } else {
        res.send(messages.invalid_register_command_reply);
    }
});

router.post('/commands/share', (req, res, next) => {
    let payload = req.body;

    bot.share_channel(payload, (reply) => {
        res.send(reply);
    });
});

export default router;