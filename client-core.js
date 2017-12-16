'use strict';

module.exports.execute = execute;
module.exports.isStar = true;

const requestPromise = require('request-promise');

const chalk = require('chalk');

const ArgumentParser = require('argparse').ArgumentParser;
const parser = new ArgumentParser();
parser.addArgument('command', {
    choices: ['list', 'send', 'delete', 'edit']
});
parser.addArgument('--from');
parser.addArgument('--to');
parser.addArgument('--text');
parser.addArgument('--id');
parser.addArgument('-v');

const commands = {
    list: listFunc,
    send: sendFunc
};

/** Добавляем красивостей к сообщению
 * @param {json} message - сообщение
 * @returns {Array}
 */
function paintCommands(message) {
    let result = '';
    if (message.from) {
        result += `${chalk.hex('#f00')('FROM')}: ${message.from}\n`;
    }
    if (message.to) {
        result += `${chalk.hex('#f00')('TO')}: ${message.to}\n`;
    }
    result += `${chalk.hex('#0f0')('TEXT')}: ${message.text}`;

    return result;
}

/** Получаем список сообщений
 * @param {Array} args
 * @returns {Promise}
 */
function listFunc(args) {
    var options = {
        uri: 'http://localhost:8080/messages//',
        qs: { from: args.from, to: args.to },
        method: 'GET',
        json: true
    };

    return requestPromise(options)
        .then(messages => messages.map(message => paintCommands(message)))
        .then(messages => messages.join('\n\n'));
}

/** Отправляем сообщение
 * @param {Array} args
 * @returns {Promise}
 */
function sendFunc(args) {
    var options = {
        uri: 'http://localhost:8080/messages//',
        qs: { from: args.from, to: args.to },
        method: 'POST',
        json: { text: args.text }
    };

    return requestPromise(options)
        .then(message => paintCommands(message));
}

/**
 * @returns {Promise}
 */
function execute() {
    const args = parser.parseArgs(process.argv.slice(2));
    if (!args.to) {
        args.to = undefined;
    }
    if (!args.from) {
        args.from = undefined;
    }

    return commands[args.command](args);
}
