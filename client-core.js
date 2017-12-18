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
parser.addArgument('-v', { action: 'storeTrue' });

const commands = {
    list: LIST,
    send: SEND,
    delete: DELETE,
    edit: EDIT
};

/** Добавляем красивостей к сообщению
 * @param {json} message - сообщение
 * @param {bool} isVerbose
 * @returns {Array}
 */
function paintCommands(message, isVerbose) {
    let result = [];
    if (isVerbose) {
        result.push(`${chalk.hex('#ff0')('ID')}: ${message.id}`);
    }
    if (message.from) {
        result.push(`${chalk.hex('#f00')('FROM')}: ${message.from}`);
    }
    if (message.to) {
        result.push(`${chalk.hex('#f00')('TO')}: ${message.to}`);
    }
    let edited = message.edited ? chalk.hex('#777')('(edited)') : '';
    result.push(`${chalk.hex('#0f0')('TEXT')}: ${message.text}${edited}`);

    return result.join('\n');
}

/** Получаем список сообщений
 * @param {Array} args
 * @returns {Promise}
 */
function LIST(args) {
    var options = {
        uri: 'http://localhost:8080/messages/',
        qs: { from: args.from, to: args.to },
        method: 'GET',
        json: true
    };

    return requestPromise(options)
        .then(messages => messages.map(message => paintCommands(message, args.v)),
            err => console.error(err))
        .then(messages => messages.join('\n\n'), err => console.error(err));
}

/** Отправляем сообщение
 * @param {Array} args
 * @returns {Promise}
 */
function SEND(args) {
    var options = {
        uri: 'http://localhost:8080/messages/',
        qs: { from: args.from, to: args.to },
        method: 'POST',
        json: { text: args.text }
    };

    return requestPromise(options)
        .then(message => paintCommands(message, args.v), err => console.error(err));
}

/** Удаляем сообщение
 * @param {Array} args
 * @returns {Promise}
 */
function DELETE(args) {
    var options = {
        uri: 'http://localhost:8080/messages/' + args.id,
        method: 'DELETE'
    };

    return requestPromise(options)
        .then(() => 'DELETED', err => console.error(err));
}

/** Редактируем сообщение
 * @param {Array} args
 * @returns {Promise}
 */
function EDIT(args) {
    var options = {
        uri: 'http://localhost:8080/messages/' + args.id,
        method: 'PATCH',
        json: { text: args.text }
    };

    return requestPromise(options)
        .then(message => paintCommands(message, args.v), err => console.error(err));
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
