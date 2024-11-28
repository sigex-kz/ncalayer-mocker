const assert = require('assert').strict;
const { NCALayerClient } = require('ncalayer-js-client');
const mocker = require('../ncalayer-mocker');
const mockerClient = require('../ncalayer-mocker-client');

const documentInBase64 = 'MTEK';
const signature = 'MTEKA';

(async () => {
  mocker.start();

  try {
    await mockerClient.configureSettings({ noTLS: true });

    const ncalayerClient = new NCALayerClient('ws://127.0.0.1:13579');
    await ncalayerClient.connect();

    const callWhenQueueIsEmpty = ncalayerClient.basicsSignCMS(
      NCALayerClient.basicsStorageAll,
      documentInBase64,
      NCALayerClient.basicsCMSParamsDetached,
      NCALayerClient.basicsSignerSignAny,
    );
    await assert.rejects(callWhenQueueIsEmpty);

    await mockerClient.registerResponseForBasicsSignCMS(signature);
    const base64EncodedSignature = await ncalayerClient.basicsSignCMS(
      NCALayerClient.basicsStorageAll,
      documentInBase64,
      NCALayerClient.basicsCMSParamsDetached,
      NCALayerClient.basicsSignerSignAny,
    );
    assert.equal(base64EncodedSignature, signature);

    await mockerClient.registerResponseForBasicsSignCMSCanceledByUser();
    await assert.rejects(
      async () => {
        await ncalayerClient.basicsSignCMS(
          NCALayerClient.basicsStorageAll,
          documentInBase64,
          NCALayerClient.basicsCMSParamsDetached,
          NCALayerClient.basicsSignerSignAny,
        );
      },
      (err) => {
        assert.ok(err.canceledByUser);
        return true;
      }
    );
  } finally {
    mocker.stop();
  }
})();
