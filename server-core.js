'use strict';

const http = require('http');
const server = http.createServer();
const urlapi = require('url');
const queryapi = require('querystring');
const commands = {
    GET: GET,
    POST: POST,
    DELETE: DELETE,
    PATCH: PATCH
};

let messages = [];
let id = 1;

/** Выбираем фильтр по сообщениям
 * @param {Array} data
 * @returns {Object}
 */
function queryCheck(data) {
    if (data.from && data.to) {
        return (note) => note.from === data.from && note.to === data.to;
    }
    if (data.from) {
        return (note) => note.from === data.from;
    }
    if (data.to) {
        return (note) => note.to === data.to;
    }

    return () => true;
}

/** Собираем сообщение
 * @param {Array} data
 * @param {string} text
 * @returns {Object}
 */
function prepareMessageToSend(data, text) {
    let note = {};
    if (data.from) {
        note.from = data.from;
    }
    if (data.to) {
        note.to = data.to;
    }
    if (data.edited) {
        note.edited = data.edited;
    }
    note.text = JSON.parse(text).text;

    return note;
}

function GET(req, res, data) {
    res.write(JSON.stringify(messages.filter(queryCheck(data))));
    res.end();
}

function POST(req, res, data) {
    let text = '';
    req.on('data', partOfText => {
        text += partOfText;
    });
    req.on('end', () => {
        let note = prepareMessageToSend(data, text);
        note.id = id++;
        messages.push(note);
        res.write(JSON.stringify(note));
        res.end();
    });
}

function DELETE(req, res, data) {
    let messageForDelete = messages.find(message => message.id === Number(data.id));
    if (messageForDelete) {
        messages = messages.filter(message => message.id !== Number(data.id));
        res.end(JSON.stringify({ status: 'ok' }));
    } else {
        res.statusCode = 404;
        res.end();
    }
}

function PATCH(req, res, data) {
    let text = '';
    req.on('data', partOfText => {
        text += partOfText;
    });
    req.on('end', () => {
        let messageForEdit = messages.find(message => message.id === Number(data.id));
        if (messageForEdit) {
            if (JSON.parse(text).text) {
                messageForEdit.text = JSON.parse(text).text;
                messageForEdit.edited = true;
                res.write(JSON.stringify(messageForEdit));
                res.end();
            } else {
                res.statusCode = 404;
                res.end();
            }
        }
        res.statusCode = 404;
        res.end();
    });
}

server.on('request', (req, res) => {
    let url = urlapi.parse(req.url);
    let query = urlapi.parse(req.url).query;
    let data = queryapi.parse(query);
    res.setHeader('content-type', 'application/json');
    var regexp = /^\/messages\/{0,2}$/;
    var regexp2 = /^\/messages\/\d$/;
    console.info(url);
    if (regexp.test(url.pathname) || regexp2.test(url.pathname)) {
        if (req.method in commands) {

            return commands[req.method](req, res, data);
        }
    } else {
        res.statusCode = 404;
        res.end();
    }
});

module.exports = server;
