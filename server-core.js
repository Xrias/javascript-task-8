'use strict';

const http = require('http');
const server = http.createServer();
const urlapi = require('url');
const queryapi = require('querystring');
const commands = {
    GET: getFunc,
    POST: postFunc,
    DELETE: deleteFunc,
    PATCH: patchFunc
};

let messages = [];
let id = 0;

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
    note.id = id++;

    return note;
}

function getFunc(req, res, data) {
    res.write(JSON.stringify(messages.filter(queryCheck(data))));
    res.end();
}

function postFunc(req, res, data) {
    let text = '';
    req.on('data', partOfText => {
        text += partOfText;
    });
    req.on('end', () => {
        let note = prepareMessageToSend(data, text);
        messages.push(note);
        res.write(JSON.stringify(note));
        res.end();
    });
}

function deleteFunc(req, res, data) {
    messages = messages.filter(message => message.id !== Number(data.id));
    res.write(JSON.stringify({ 'status': 'ok' }));
    res.end();
}

function patchFunc(req, res, data) {
    let text = '';
    req.on('data', partOfText => {
        text += partOfText;
    });
    req.on('end', () => {
        for (let message of messages) {
            if (message.id === Number(data.id)) {
                message.text = JSON.parse(text).text;
                message.edited = true;
                let note = prepareMessageToSend(message, text);
                res.write(JSON.stringify(note));
            }
        }
        res.end();
    });
}

server.on('request', (req, res) => {
    let url = urlapi.parse(req.url);
    let query = urlapi.parse(req.url).query;
    let data = queryapi.parse(query);
    res.setHeader('content-type', 'application/json');
    if (url.pathname === '/messages' || url.pathname === '/messages/' ||
        url.pathname === '/messages//' || '/messages/:[object%20Undefined]') {
        if (req.method in commands) {

            return commands[req.method](req, res, data);
        }
    } else {
        res.statusCode = 404;
        res.end();
    }
});

module.exports = server;
