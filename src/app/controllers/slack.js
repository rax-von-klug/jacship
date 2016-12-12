'use strict';

import { Router } from 'express';

const router = Router();

router.post('/interactive', (req, res, next) => {
    let payload = JSON.parse(req.body.payload);

    if (payload.callback_id === "general_help") {

        if (payload.actions[0].value === 'show_all_topics') {
            let help_messages = {
                callback_id: 'general_help',
                response_type: 'in_channel',
                replace_original: true,
                attachments: [{
                    title: 'Would you like to know more :question:',
                    text: 'Type `help` to display this message again.',
                    callback_id: 'general_help',
                    attachment_type: 'default',
                    mrkdwn_in: ["text"],
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

        if (payload.actions[0].value === 'register_help') {
            res.send({
                text: 'To register your slack team an administrator will need to create an Incoming Webhook and then execute the following command\n`/register <Incoming Webhook Url>`',
                response_type: 'in_channel',
                replace_original: false
            });
        }

        if (payload.actions[0].value === 'share_help') {
            res.send({
                text: 'To begin sharing a channel you will need to `/invite @jacship` and then execute the `/share` command in the channel you wish to share.',
                response_type: 'in_channel',
                replace_original: false
            });
        }

        if (payload.actions[0].value === 'available_help') {
            res.send({
                text: 'To view a list of available shared channels execute the `/available` command.\nJ.A.C.S.H.I.P will post a message for each of the available shared channels with an interactive button to join that channel.',
                response_type: 'in_channel',
                replace_original: false
            });
        }
    }
});

export default router;