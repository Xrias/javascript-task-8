'use strict';

module.exports.execute = execute;
module.exports.isStar = true;

const request = require('request');

// Цвет
const chalk = require('chalk');
const red = chalk.hex('#f00');
const green = chalk.hex('#0f0');

// Парсим аргументы
const ArgumentParser = require('argparse').ArgumentParser;
const parser = new ArgumentParser();
parser.addArgument('command', {
    choices: ['list', 'send', 'delete', 'edit']
});
parser.addArgument('--from'); // От кого
parser.addArgument('--to'); // Кому
parser.addArgument('--text'); // Текст сообщения
parser.addArgument('--id');
parser.addArgument('-v'); // Режим подробного вывода

// Доступные команды
const commands = {
    list: listFunc,
    send: sendFunc,
    delete: deleteFunc,
    edit: editFunc
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

/** Создаем промис запроса
 * @param {Object} queryString
 * @param {string} method
 * @param {bool} json
 * @returns {Promise}
 */
function requestPromise({ queryString = {}, method = 'GET', json = true }) {
    return new Promise((resolve, reject) => {
        request({ url: 'http://localhost:8080/messages//', queryString, method, json },
            (err, response, body) => err ? reject(err) : resolve(body));
    });
}

/** Получаем сообщения
 * @param {Array} args
 * @returns {Promise}
 */
function listFunc(args) {
    return requestPromise({ queryString: { from: args.from, to: args.to } })
        .then(messages => messages.map(message => paintCommands(message)))
        .then(messages => messages.join('\n\n'));
}

/** Отправляем сообщение
 * @param {Array} args
 * @returns {Promise}
 */
function sendFunc(args) {
    return requestPromise({
        queryString: { from: args.from, to: args.to },
        method: 'POST', json: { text: args.text }
    })
        .then(message => paintCommands(message));
}

/** Удаляем сообщение
 * @param {Array} args
 * @returns {Promise}
 */
function deleteFunc(args) {
    return requestPromise({
        queryString: { from: args.from, to: args.to },
        method: 'POST', json: { text: args.text }
    })
        .then(message => paintCommands(message));
}

/** Изменяем сообщение
 * @param {Array} args
 * @returns {Promise}
 */
function editFunc(args) {
    return requestPromise({
        queryString: { from: args.from, to: args.to },
        method: 'POST', json: { text: args.text }
    })
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
