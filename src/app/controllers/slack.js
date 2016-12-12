'use strict';

import { Router } from 'express';
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
    
});

export default router;