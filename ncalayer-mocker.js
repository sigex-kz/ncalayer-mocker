const http = require('http');
const { WebSocketServer } = require('ws');

const controlServerPort = 8642;

let messageQueue;
let controlServer;
let wss;

module.exports.start = () => {
  messageQueue = [];

  controlServer = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/') {
      let messageBody = '';

      req.on('data', (chunk) => {
        messageBody += chunk;
      });

      req.on('end', () => {
        messageQueue.push(messageBody);
        res.statusCode = 200;
        res.end('OK');
      });
    } else {
      res.statusCode = 404;
      res.end('Not Found');
    }
  });
  controlServer.listen(controlServerPort);

  wss = new WebSocketServer({ port: 13579 });
  wss.on('connection', (ws) => {
    ws.send(JSON.stringify({ result: { version: 'ncalayer-mocker' } }));

    ws.on('message', (msg) => {
      if (msg === '{"module":"kz.digiflow.mobile.extensions","method":"getVersion"}') {
        ws.send('{}');
        return;
      }

      let responseMessage = '{}';
      if (messageQueue.length > 0) {
        responseMessage = messageQueue.shift();
      }

      ws.send(responseMessage);
    });
  });
};

module.exports.stop = () => {
  controlServer.close();
  controlServer = null;

  wss.clients.forEach((client) => {
    client.close();
  });
  wss.close();
  wss = null;

  messageQueue = null;
};

module.exports.registerResponseForBasicsSignCMS = async (base64EncodedSignature) => {
  const responseToRegister = JSON.stringify({
    status: true,
    body: { result: base64EncodedSignature },
  });

  const options = {
    hostname: '127.0.0.1',
    port: controlServerPort,
    path: '/',
    method: 'POST',
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      res.on('data', () => {});
      res.on('end', resolve);
    });

    req.on('error', reject);
    req.write(responseToRegister);
    req.end();
  });
};
