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
        return (note) => note.from === from && note.to === to;
    }
    if (from) {
        return (note) => note.from === from;
    }
    if (to) {
        return (note) => note.to === to;
    }

    return () => true;
}

/** Собираем сообщение
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

function getFunc(res, from, to) {
    res.write(JSON.stringify(messages.filter(queryCheck(from, to))));
    res.end();
}

function postFunc(req, res, from, to) {
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

function deleteFunc(req, res, from, to) {
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

server.on('request', (req, res) => {
    let query = urlapi.parse(req.url).query;
    let { from, to } = queryapi.parse(query);
    res.setHeader('content-type', 'application/json');

    switch (req.method) {
        case 'GET':
            getFunc(res, from, to);
            break;
        case 'POST':
            postFunc(req, res, from, to);
            break;
        case 'DELETE':
            deleteFunc(req, res, from, to);
            break;
        default:
            break;
    }
});

module.exports = server;
