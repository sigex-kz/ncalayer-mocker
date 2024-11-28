# ncalayer-mocker
Настраиваемый сервис эмулирующий NCALayer для e2e тестирования интегрированных приложений

## Установка

```
npm install ncalayer-mocker
```

## Запуск

```
npm exec ncalayer-mocker
```

## Использование

В целях автоматизации тестирования предполагается следующий сценарий использования:

```
[код теста] ---(1)---> [ncalayer-mocker] <---(2)---> [код тестируемого приложения взаимодействующего с NCALayer]
```

- (1) - в тесте через HTTP интерфейс настраиваем поведение `ncalayer-mocker`, загружаем в него очередь ответов которые он должен будет возвращать;
- (2) - в процессе выполнения теста тестируемое приложение, интегрированное с NCALayer, обращается на `wss://127.0.0.1:13579` (стандартный URL для взаимодействия с NCALayer), подключается к `ncalayer-mocker` и он возвращает ранее зарегистрированные ответы по очереди не зависимо от того, какие ему приходят запросы.


Регистрацию ответов в `ncalayer-mocker` можно выполнять следующим образом:

```
const ncalayerMocker = require('ncalayer-mocker');

await ncalayerMocker.registerResponseForBasicsSignCMS(signatureB64);
await ncalayerMocker.registerResponseForBasicsSignCMSCanceledByUser();
```

## Отладочный вывод

Поддерживается отладочный вывод средствами [`util.debug(section)`](https://nodejs.org/docs/latest/api/util.html#utildebugsection):

```
NODE_DEBUG=messages* npm exec ncalayer-mocker
```