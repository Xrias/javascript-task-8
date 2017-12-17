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

function getFunc(req, res, data) {
    res.write(JSON.stringify(messages.filter(queryCheck(data.from, data.to))));
    res.end();
}

function postFunc(req, res, data) {
    let text = '';
    req.on('data', partOfText => {
        text += partOfText;
    });
    req.on('end', () => {
        let note = prepareMessageToSend(data.from, data.to, text);
        messages.push(note);
        res.write(JSON.stringify(note));
        res.end();
    });
}

function deleteFunc(req, res, data) {
    messages = messages.filter(message => message.id !== data.id);
    res.statusCode = 'ok';
    res.end();
}

function patchFunc(req, res, data) {
    messages.map(function (message) {
        if (message.id === data.id) {
            return {};
        }

        return message;
    });
    let text = '';
    req.on('data', partOfText => {
        text += partOfText;
    });
    req.on('end', () => {
        let note = prepareMessageToSend(data.from, data.to, text);
        messages.push(note);
        res.write(JSON.stringify(note));
        res.end();
    });
}


server.on('request', (req, res) => {
    let url = urlapi.parse(req.url);
    let query = urlapi.parse(req.url).query;
    let data = queryapi.parse(query);
    res.setHeader('content-type', 'application/json');
    console.info(url.pathname);
    if (url.pathname === '/messages' || url.pathname === '/messages/' ||
        url.pathname === '/messages//') {
        if (req.method in commands) {

            return commands[req.method](req, res, data);
        }
    } else {
        res.statusCode = 404;
        res.end();
    }
});

module.exports = server;
