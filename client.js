/* eslint-disable no-console */
'use strict';

const { execute } = require('./client-core');

module.exports.isStar = true;

execute()
    .then(console.log)
    .catch(console.error);

