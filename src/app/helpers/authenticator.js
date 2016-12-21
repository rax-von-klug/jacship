'use strict';

import config from '../../config';
import requestify from 'requestify';

export class Authenticator {
    constructor(auth_code) {
        this.auth_code = auth_code;
    }
    authenticate() {
        return new Promise((resolve, reject) => {
            let auth_url = `https://slack.com/api/oauth.access?client_id=${config.slack_id}&client_secret=${config.slack_secret}&code=${this.auth_code}&redirect_uri=${config.slack_redirect}new`;

            let request = requestify.get(auth_url)
                .then((res) => { 
                    console.log('SUCCESS!', res);
                    res.getBody();
                })
                .fail((res) => {
                    console.log('FAILED!', res);
                });
            resolve(request);
        });
    }
}