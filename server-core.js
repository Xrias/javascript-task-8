'use strict';

const http = require('http');
const server = http.createServer();
const urlapi = require('url');
const queryapi = require('querystring');
const commands = {
    GET: get,
    POST: post,
    DELETE: del,
    PATCH: patch
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

function get(req, res, data) {
    res.write(JSON.stringify(messages.filter(queryCheck(data))));
    res.end();
}

function post(req, res, data) {
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

function extractIdFromUrl(sourceUrl) {
    let splitedUrl = sourceUrl.split('/');

    return splitedUrl[splitedUrl.length - 1];
}

function del(req, res, data, url) {
    let msgId = extractIdFromUrl(url);
    let messageForDelete = messages.find(message => message.id === Number(msgId));
    if (messageForDelete) {
        messages = messages.filter(message => message.id !== Number(msgId));
        res.end(JSON.stringify({ status: 'ok' }));
    } else {
        res.statusCode = 404;
        res.end();
    }
}

function patch(req, res, data, url) {
    let msgId = extractIdFromUrl(url);
    let text = '';
    req.on('data', partOfText => {
        text += partOfText;
    });
    req.on('end', () => {
        let messageForEdit = messages.find(message => message.id === Number(msgId));
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
    if (regexp.test(url.pathname) || url.pathname === '/messages/:[object%20Undefined]') {
        if (req.method in commands) {

            return commands[req.method](req, res, data, url.pathname);
        }
    } else {
        res.statusCode = 404;
        res.end();
    }
});

module.exports = server;
