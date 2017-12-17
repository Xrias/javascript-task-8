/* eslint-disable no-console */
'use strict';

const { execute } = require('./client-core');

module.exports.isStar = false;

execute()
    .then(console.log)
    .catch(console.error);

