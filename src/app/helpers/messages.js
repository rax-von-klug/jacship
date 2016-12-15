'use strict';

import * as actions from './actions';

export function general_help_message(channel) {
    return {
        text: 'J.A.C.S.H.I.P helps facilitate communication by opening shared channels between slack teams.',
        attachments: [{
            title: 'Would you like to know more :question:',
            text: 'Type `help` to display this message again.',
            callback_id: 'general_help',
            attachment_type: 'default',
            actions: [actions.show_all_help]
        }],
        channel: channel
    };
}

export const help_options_message = {
    callback_id: 'general_help',
    response_type: 'in_channel',
    replace_original: true,
    attachments: [{
        title: 'Would you like to know more :question:',
        text: 'Type `help` to display this message again.',
        callback_id: 'general_help',
        attachment_type: 'default',
        mrkdwn_in: ["text", "pretext"],
        actions: [actions.available_channel_help, actions.register_team_help, actions.share_channel_help]
    }]
};

export const register_team_help_message = {
    text: 'To register your slack team an administrator will need to create an Incoming Webhook and then execute the following command\n`/register <Incoming Webhook Url>`',
    response_type: 'in_channel',
    replace_original: false
};

export const share_channel_help_message = {
    text: 'To begin sharing a channel you will need to `/invite @jacship` and then execute the `/share` command in the channel you wish to share.',
    response_type: 'in_channel',
    replace_original: false
};

export const available_channel_help_message = {
    text: 'To view a list of available shared channels execute the `/available` command.\nJ.A.C.S.H.I.P will post a message for each of the available shared channels with an interactive button to join that channel.',
    response_type: 'in_channel',
    replace_original: false
};

export function register_command_reply(webhook_url) {
    return {
        text: 'Your slack team has been registered!',
        response_type: 'ephemeral',
        attachments: [{ 
            text: `${webhook_url} was saved for your team.`,
            color: '#008000' 
        }]
    };
}

export const invalid_register_command_reply = {
    text: ':no_entry: Invalid register command :no_entry:',
    attachments: [{ 
        text: 'A valid URL is required.',
        color: '#ff0000'
    }]
};

export function share_command_reply(channel_name) {
    return {
        text: `*${channel_name}* has been marked as shared and joinable by other teams`,
        response_type: 'ephemeral'
    };
}

export function available_channels_reply(team_name) {
    return {
        text: `The following channels have been shared by *${team_name}*`,
        attachments: [{
            text: 'Would you like to join a conversation?',
            callback_id: `join_shared_channel_${team_name}`,
            color: '#008000',
            attachment_type: "default",
            actions: []
        }]
    };
}