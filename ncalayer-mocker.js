const http = require('http');
const https = require('https');
const path = require('path');
const util = require('util');
const { readFileSync } = require('fs');
const { WebSocketServer } = require('ws');

let messageQueue;
let controlServer;
let baseServer;
let wss;
let noTLS = false;

// NODE_DEBUG
const debugLogMessagesWsIn = util.debug('messages-ws-in');
const debugLogMessagesWsOut = util.debug('messages-ws-out');
const debugLogMessagesHttp = util.debug('messages-http');
const debugLogMessagesHttpSettings = util.debug('messages-http-settings');

function startNCALayerServer() {
  if (noTLS) {
    baseServer = http.createServer();
  } else {
    baseServer = https.createServer({
      cert: readFileSync(path.join(__dirname, 'tls/certificate.pem')),
      key: readFileSync(path.join(__dirname, 'tls/privateKey.pem')),
    });
  }

  wss = new WebSocketServer({ server: baseServer });
  wss.on('connection', (ws) => {
    ws.send(JSON.stringify({ result: { version: 'ncalayer-mocker' } }));

    ws.on('message', (msg) => {
      debugLogMessagesWsIn(msg.toString());

      if (msg === '{"module":"kz.digiflow.mobile.extensions","method":"getVersion"}') {
        ws.send('{}');
        return;
      }

      let responseMessage = '{}';
      if (messageQueue.length > 0) {
        responseMessage = messageQueue.shift();
      }

      debugLogMessagesWsOut(responseMessage);
      ws.send(responseMessage);
    });
  });

  baseServer.listen(13579);
}

function stopNCALayerServer() {
  wss.clients.forEach((client) => {
    client.close();
  });
  wss.close();
  wss = null;

  baseServer.close();
  baseServer = null;
}

module.exports.start = () => {
  messageQueue = [];

  controlServer = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/settings') {
      let requestBody = '';

      req.on('data', (chunk) => {
        requestBody += chunk;
      });

      req.on('end', () => {
        try {
          debugLogMessagesHttpSettings(requestBody);
          const settings = JSON.parse(requestBody);
          noTLS = settings.noTLS;

          stopNCALayerServer();
          startNCALayerServer();
        } catch (err) {
          res.statusCode = 500;
          res.end(`Bad request: ${err}`);
        }

        res.statusCode = 200;
        res.end('OK');
      });

      return;
    }

    if (req.method === 'POST' && req.url === '/') {
      let messageBody = '';

      req.on('data', (chunk) => {
        messageBody += chunk;
      });

      req.on('end', () => {
        debugLogMessagesHttp(messageBody);
        messageQueue.push(messageBody);
        res.statusCode = 200;
        res.end('OK');
      });

      return;
    }

    if (req.method === 'GET' && req.url === '/') {
      let messageBody = '';

      req.on('data', (chunk) => {
        messageBody += chunk;
      });

      req.on('end', () => {
        debugLogMessagesHttp(messageBody);
        res.statusCode = 200;
        res.end(JSON.stringify({
          messageQueue,
          noTLS,
        }));
      });
    }

    res.statusCode = 404;
    res.end('Not Found');
  });
  controlServer.listen(8642);

  startNCALayerServer();
};

module.exports.stop = () => {
  controlServer.close();
  controlServer = null;

  stopNCALayerServer();

  messageQueue = null;
};
