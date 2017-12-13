const path = require('path');
const isDev = think.env === 'development';

module.exports = [{
    handle: 'meta',
    options: {
      logRequest: isDev,
      sendResponseTime: isDev
    }
  },
  {
    handle: 'resource',
    enable: isDev,
    options: {
      root: path.join(think.ROOT_PATH, 'www'),
      publicPath: /^\/(static|favicon\.ico)/
    }
  },
  {
    handle: 'trace',
    enable: !think.isCli,
    options: {
      sourceMap: false,
      debug: isDev, // 是否打印详细的错误信息
      error(err) {
        // 这里可以根据需要对错误信息进行处理，如：上报到监控系统
        console.error(err);
      }
    }
  },
  {
    handle: 'payload',
    options: {}
  },
  {
    handle: 'router',
    options: {}
  },
  'logic',
  'controller'
];