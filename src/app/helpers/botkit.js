'use strict';

import Botkit from 'botkit';
import requestify from 'requestify';
import _ from 'lodash';
import config from '../../config';
import botkit_mongo_storage from './botkit_storage_mongoose';
import logger from './logger';
import * as messages from './messages';
import * as actions from './actions';

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

export function share_channel(team_id, channel_id, channel_name, callback) {
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

export function get_available_channels(channel_id, filter, callback) {
    controller.storage.shares.all((err, shares) => {
        let channels = _.filter(shares, (share) => share.channel_id !== channel_id);
        if (filter !== '') {
            channels = _.filter(channels, (channel) => channel.team_name === filter);
        }

        let grouped_channels = _.groupBy(channels, 'team_name');
        let reply_message = {
            attachments: []
        };

        _.forEach(grouped_channels, (value, key) => {
            let attachment = messages.available_channels_reply(key);

            _.forEach(value, (channel) => {
                attachment.actions.push(actions.available_channel_action(channel.channel_name, channel.channel_id, channel.team_id));
            });

            reply_message.attachments.push(attachment);
        });

        callback(reply_message);
    });
}

export function join_shared_channel({ actions, team, channel }, callback) {
    controller.storage.shares.get(actions[0].value, (err, shared_channel) => {
        controller.storage.teams.get(team.id, (err, team) => {
            if (!_.isArray(shared_channel.joined_channels)) {
                shared_channel.joined_channels = [];
            }

            let new_joined_channel = {
                id: team.id,
                webhook_url: team.webhooks.incomingUrl,
                post_channel_id: channel.id
            };

            if (_.some(shared_channel.joined_channels, new_joined_channel)) {
                callback({
                    text: `You have already joined *${shared_channel.team_name}'s* *#${shared_channel.channel_name}*`,
                    replace_original: false
                });
            } else {
                shared_channel.joined_channels.push(new_joined_channel);

                controller.storage.shares.save(shared_channel);

                callback({ 
                    text: `:white_check_mark: You have joined the conversation in *${shared_channel.team_name}'s* *#${shared_channel.channel_name}*!`,
                    replace_original: false 
                });
            }
        });
    });
}

export function leave_shared_channel({ actions, team, channel }, callback) {
    let shared_channel_id = actions[0].value.split('#')[0];
    let leaving_team_id = actions[0].value.split('#')[1];

    controller.storage.shares.get(shared_channel_id, (err, shared_channel) => {
        _.remove(shared_channel.joined_channels, (joined_channel) => joined_channel.id === leaving_team_id);

        controller.storage.shares.save(shared_channel);

        callback({
            text: `:negative_squared_cross_mark: You have left the conversation in *${shared_channel.team_name}'s* *#${shared_channel.channel_name}*`,
            replace_original: false
        });
    });
}

export function display_connected_channels({ team_id, channel_id }, callback) {
    controller.storage.shares.all((err, shares) => {
        let channels = _.filter(shares, (share) => share.channel_id !== channel_id);

        let grouped_channels = _.groupBy(channels, 'team_name');
        let reply_message = {
            attachments: []
        };

        _.forEach(grouped_channels, (value, key) => {
            let attachment = messages.joined_channels_reply(key);

            _.forEach(value, (channel) => {
                if (_.some(channel.joined_channels, ['id', team_id])) {
                    attachment.actions.push(actions.disconnect_channel_action(channel.channel_name, channel.id, team_id));
                }
            });

            reply_message.attachments.push(attachment);
        });

        callback(reply_message);
    });
}

export function process_event({ token, team_id, event }, callback) {
    if (event.subtype !== 'bot_message') {
        let shared_channel_id = `${team_id}.${event.channel}`;

        controller.storage.shares.get(shared_channel_id, (err, shared_channel) => {
            if (!err && shared_channel !== null) {
                controller.storage.teams.get(team_id, (err, team_info) => {
                    let url = `https://slack.com/api/users.info?token=${team_info.token}&user=${event.user}`;

                    requestify.get(url).then((res) => {
                        let payload = res.getBody();
                        if (payload.ok) {
                            _.forEach(shared_channel.joined_channels, (channel) => {
                                let post_message = {
                                    username: payload.user.name,
                                    channel: channel.post_channel_id,
                                    icon_url: payload.user.profile.image_32,
                                    text: event.text
                                };
                                let options = {
                                    headers: {
                                        'content-type': 'application/json'
                                    }
                                };
                                requestify.post(channel.webhook_url, post_message, options);
                            });
                        }
                    });
                });
            }
        });
    }
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