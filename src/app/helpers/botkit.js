'use strict';

import Botkit from 'botkit';
import requestify from 'requestify';
import _ from 'lodash';
import config from '../../config';
import botkit_mongo_storage from './botkit_storage_mongoose';
import logger from './logger';
import * as messages from './messages';

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

export function save_team({ access_token, bot, scope }) {
    let url = `https://slack.com/api/auth.test?token=${access_token}`;

    return new Promise((resolve, reject) => {
        resolve(requestify.get(url).then((res) => {
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

            return slack_team;
        }));
    });
}

export function register_slack_team(incoming_webhook_url, team_id, callback) {
    controller.storage.teams.get(team_id, (err, team) => {
        team.webhooks = {
            incomingUrl: incoming_webhook_url
        };

        controller.storage.teams.save(team, (err, team) => {
            if (!err) {
                callback(messages.register_command_reply(incoming_webhook_url));
            }
        });
    });
}

export function share_channel({ team_id, channel_id, channel_name }) {
    controller.storage.teams.get(team_id, (err, team) => {
        if (!err) {
            let shared_channel = {
                id: `${team_id}.${channel_id}`,
                team_id: team.id,
                team_name: team.name,
                channel_id: channel_id,
                channel_name: channel_name,
                joined_channels: []
            };

            controller.storage.shares.save(shared_channel, (err, shared_channel) => {
                callback(messages.share_command_reply(shared_channel.channel_name));
            });
        }
    });
}

const _bots = {};

function trackBot(bot) {
    _bots[bot.config.token] = bot;
}

controller.on('create_bot', (bot, team) => {
    if (_bots[bot.config.token]) {
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
        bot.startRTM((err) => {
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

            bot.say(messages.general_help_message(team.createdBy));
        });
    }
});