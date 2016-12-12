'use strict';

import Botkit from 'botkit';
import requestify from 'requestify';
import config from '../../config';
import botkit_mongo_storage from './botkit_storage_mongoose';
import logger from './logger';

export const controller = Botkit.slackbot({
    storage: botkit_mongo_storage(config)
});

function save_user(scope, { access_token, user_id, team_id, user }) {
    let approved_scopes = scope.split(/\,/);

    controller.storage.users.get(user_id, (err, user) => {
        if (!user) {
            user = {
                id: user_id,
                access_token: access_token,
                scopes: approved_scopes,
                team_id: team_id,
                user: user
            };
        }

        controller.storage.users.save(user, (err, id) => {
            if (err) {
                logger.error('An error occurred while saving a user: ', err);
                controller.trigger('error', [err]);
            }
        });
    });
}

export function connect(config) {
    let bot = controller.spawn(config);
    controller.trigger('create_bot', [ bot, config ]);
}

export function register_team({ access_token, bot, scope }) {
    let url = `https://slack.com/api/auth.test?token=${access_token}`;

    requestify.get(url).then((res) => {
        let { team_id, user_id, url, team, user } = res.getBody();

        let slack_team = {
            id: team_id,
            bot:{
              token: bot.bot_access_token,
              user_id: bot.bot_user_id,
              createdBy: user_id
            },
            createdBy: user_id,
            url: url,
            name: team
        };

        connect(slack_team);
        save_user(scope, { access_token, user_id, team_id, user });
    });
}

const _bots = {};

function trackBot(bot) {
    _bots[bot.config.token] = bot;
}

controller.on('create_bot', (bot, team) => {
    if (_bots[bot.config.token]) {
        console.log('Already exists');
        bot.api.channels.list({ token: bot.confi.token }, (err, result) => {
            if (!err) {
                team.channels = []; // reset channel listing.
                if (result.ok) {
                    for (var i = 0; i < result.channels.length; i++) {
                        team.channels.push({
                            id: result.channels[i].id,
                            name: result.channels[i].name
                        });
                    }
                }
            }
        });

        logger.info("already online! channel listing updated.");
    } else {
        console.log('Doesn\'t exist');
        bot.startRTM((err) => {
            console.log('Err', err);
            if (!err) {
                trackBot(bot);

                bot.api.channels.list({ token: bot.config.token }, (err, result) => {
                    if(!err) {
                        team.channels = [];
                        if (result.ok) {
                            for (var i = 0; i < result.channels.length; i++) {
                                team.channels.push({
                                    id: result.channels[i].id,
                                    name: result.channels[i].name
                                });
                            }
                        }

                        controller.saveTeam(team, function(err, id) {
                            if (err) {
                                logger.info("Error saving team");
                            }
                            else {
                                logger.info("Team " + team.name + " saved");
                            }
                        });
                    }
                });
            }

            bot.say({
                text: 'J.A.C.S.H.I.P helps facilitate communication by opening shared channels between slack teams.',
                attachments: [{
                    title: 'Would you like to know more :question:',
                    text: 'Type `help` to display this message again.',
                    callback_id: 'general_help',
                    attachment_type: 'default',
                    actions: [
                        {
                            name: 'show_help',
                            text: 'Show all Help topics',
                            value: 'show_all_topics',
                            style: 'primary',
                            type: 'button'
                        }
                    ]
                }],
                channel: team.createdBy
            });
        });
    }
});