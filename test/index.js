const assert = require('assert').strict;
const { NCALayerClient } = require('ncalayer-js-client');
const mocker = require('../ncalayer-mocker');

const documentInBase64 = 'MTEK';
const signature = 'MTEKA';

(async () => {
  mocker.start();

  try {
    const ncalayerClient = new NCALayerClient('ws://127.0.0.1:13579');
    await ncalayerClient.connect();

    const callWhenQueueIsEmpty = ncalayerClient.basicsSignCMS(
      NCALayerClient.basicsStorageAll,
      documentInBase64,
      NCALayerClient.basicsCMSParamsDetached,
      NCALayerClient.basicsSignerSignAny,
    );
    await assert.rejects(callWhenQueueIsEmpty);

    await mocker.registerResponseForBasicsSignCMS(signature);
    const base64EncodedSignature = await ncalayerClient.basicsSignCMS(
      NCALayerClient.basicsStorageAll,
      documentInBase64,
      NCALayerClient.basicsCMSParamsDetached,
      NCALayerClient.basicsSignerSignAny,
    );
    assert.equal(base64EncodedSignature, signature);
  } finally {
    mocker.stop();
  }
})();
