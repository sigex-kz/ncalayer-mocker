const http = require('http');

async function postData(path, data) {
  const options = {
    hostname: '127.0.0.1',
    port: 8642,
    path,
    method: 'POST',
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      res.on('data', () => {});
      res.on('end', resolve);
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

module.exports.registerResponseForBasicsSignCMS = async (base64EncodedSignature) => {
  const responseToRegister = JSON.stringify({
    status: true,
    body: { result: base64EncodedSignature },
  });

  return postData('/', responseToRegister);
};

module.exports.registerResponseForBasicsSignCMSCanceledByUser = async () => {
  const responseToRegister = JSON.stringify({
    status: true,
    body: {},
  });

  return postData('/', responseToRegister);
};

module.exports.configureSettings = async (settings) => postData('/settings', JSON.stringify(settings));
