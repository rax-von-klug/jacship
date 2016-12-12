'use strict';

import { Router } from 'express';

const router = Router();

router.post('/slack/interactive', (req, res) => {
    let payload = JSON.parse(req.body.payload);

    if (payload.callback_id === "general_help") {
        if (payload.actions[0].value === 'show_all_topics') {
            
            let help_messages = {
                title: 'Would you like to know more :question:',
                text: 'Type `help` to display this message again.',
                callback_id: 'general_help',
                response_type: 'in_channel',
                replace_original: true,
                attachments: [{
                    title: 'Would you like to know more :question:',
                    text: 'Type `help` to display this message again.',
                    callback_id: 'general_help',
                    attachment_type: 'default',
                    actions: [
                        {
                            name: 'register_help',
                            text: 'Register Slack Team',
                            value: 'register_help',
                            type: 'button'
                        },
                        {
                            name: 'share_help',
                            text: 'Share Channel',
                            value: 'share_help',
                            type: 'button'
                        },
                        {
                            name: 'available_help',
                            text: 'Available Channels',
                            value: 'available_help',
                            type: 'button'
                        }
                    ]
                }]
            };

            res.send(help_messages);
        }
    }
});