'use strict';

module.exports.execute = execute;
module.exports.isStar = false;

const requestPromise = require('request-promise');

const chalk = require('chalk');
const red = chalk.hex('#f00');
const green = chalk.hex('#0f0');

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
    return [
        message.from && `${red('FROM')}: ${message.from}`,
        message.to && `${red('TO')}: ${message.to}`,
        `${green('TEXT')}: ${message.text}`
    ].filter(Boolean).join('\n');
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
        .then(messages => messages.map(message => paintCommands(message)),
            err => console.error(err))
        .then(messages => messages.join('\n\n'), err => console.error(err));
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
        .then(message => paintCommands(message), err => console.error(err));
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
    if (args.command in commands) {

        return commands[args.command](args);
    }

    return Promise.reject('Supported only: list, send');
}
