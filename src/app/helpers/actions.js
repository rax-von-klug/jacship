'use strict';

export const show_all_help = {
    name: 'show_help',
    text: 'Show all Help topics',
    value: 'show_all_topics',
    style: 'primary',
    type: 'button'
};

export const register_team_help = {
    name: 'register_help',
    text: 'Register Slack Team',
    value: 'register_help',
    type: 'button'
};

export const share_channel_help = {
    name: 'share_help',
    text: 'Share Channel',
    value: 'share_help',
    type: 'button'
};

export const available_channel_help = {
    name: 'available_help',
    text: 'Available Channels',
    value: 'available_help',
    type: 'button'
};

export function available_channel_action(channel_name, channel_id, team_id) {
    return {
        name: 'join_channel',
        text: `#${channel_name}`,
        type: "button",
        value: `${team_id}.${channel_id}`
    };
}