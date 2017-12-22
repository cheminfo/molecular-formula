'use strict';

const request = require('request-promise-native');

module.exports = async function fetchJSON(url) {
    let response = await request({
        uri: url,
        encoding: 'application/json'
    });
    return response;
};
