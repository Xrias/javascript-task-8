'use strict';

const http = require('http');
const server = http.createServer();
const urlapi = require('url');
const queryapi = require('querystring');

let messages = [];

/** Выбираем фильтр по сообщениям
 * @param {string} from
 * @param {string} to
 * @returns {Object}
 */
function queryCheck(from, to) {
    if (from && to) {
        return {
            from: from,
            to: to
        };
    }
    if (from) {
        return { from: from };
    }
    if (to) {
        return { to: to };
    }

    return () => true;
}

/** Выбираем фильтр по сообщениям
 * @param {string} from
 * @param {string} to
 * @param {string} text
 * @returns {Object}
 */
function prepareMessageToSend(from, to, text) {
    let note = {};
    if (from) {
        note.from = from;
    }
    if (to) {
        note.to = to;
    }
    note.text = JSON.parse(text).text;

    return note;
}

/** Проверяем корректность url'а
 * @param {string} url
 * @returns {bool}
 */
function isUrlCorrect(url) {
    return (/^\/messages($|\?)/).test(url);
}

server.on('request', (req, res) => {
    let query = urlapi.parse(req.url).query;
    let { from, to } = queryapi.parse(query);
    res.setHeader('content-type', 'application/json');
    if (!isUrlCorrect(req.url)) {
        res.statusCode = 404;
        res.end();
    }
    if (req.method === 'GET') {
        res.write(JSON.stringify(messages.filter(queryCheck(from, to))));
        res.end();
    }
    if (req.method === 'POST') {
        let text = '';
        req.on('data', partOfText => {
            text += partOfText;
        });
        req.on('end', () => {
            let note = prepareMessageToSend(from, to, text);
            messages.push(note);
            res.write(JSON.stringify(note));
            res.end();
        });
    }
});

module.exports = server;
