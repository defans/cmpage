const fileCache = require('think-cache-file');
const ejs = require('think-view-ejs');
const fileSession = require('think-session-file');
const mysql = require('think-model-mysql');
const {
  Console,
  File,
  DateFile
} = require('think-logger3');
const path = require('path');
const isDev = think.env === 'development';

/**
 * cache adapter config
 * @type {Object}
 */

exports.cache = {
  type: 'file',
  common: {
    timeout: 24 * 60 * 60 * 1000 // 单位：毫秒
  },
  file: {
    handle: fileCache,
    cachePath: path.join(think.ROOT_PATH, 'runtime/cache'), // 缓存文件存放的路径
    pathDepth: 1,
    gcInterval: 24 * 60 * 60 * 1000 // 清理过期缓存定时时间
  }
}
/**
 * model adapter config
 * @type {Object}
 */
exports.model = {
  type: 'admin', // 默认使用的类型，调用时可以指定参数切换  
  common: { // 通用配置
    logConnect: true, // 是否打印数据库连接信息
    logSql: true, // 是否打印 SQL 语句
    logger: msg => think.logger.info(msg) // 打印信息的 logger
  },
  admin: { // 业务数据库设置
    handle: mysql,
    type: "mysql",
    database: 'admin',
    prefix: '',
    encoding: 'utf8',
    host: '127.0.0.1',
    port: '',
    user: 'cmpage',
    password: 'defans',
    dateStrings: true
  },
  cmpage: { // 业务模块配置的数据库设置
    handle: mysql,
    type: "mysql",
    database: 'cmpage',
    prefix: '',
    encoding: 'utf8',
    host: '127.0.0.1',
    port: '',
    user: 'cmpage',
    password: 'defans',
    dateStrings: true
  },
  docu: { // 单据模块配置的数据库设置
    type: "mssql",
    database: 'docu',
    prefix: '',
    encoding: 'utf8',
    host: '10.9.39.27',
    port: '1433',
    user: 'sa',
    password: 'wanbang_123',
    dateStrings: true
  },
  sqlite: { // sqlite 配置

  },
  postgresql: { // postgresql 配置

  }
}
/**
 * session adapter config
 * @type {Object}
 */
exports.session = {
  type: 'file',
  common: {
    cookie: {
      name: 'cmpage'
      // keys: ['werwer', 'werwer'],
      // signed: true
    }
  },
  file: {
    handle: fileSession,
    sessionPath: path.join(think.ROOT_PATH, 'runtime/session')
  }
};

/**
 * view adapter config
 * @type {Object}
 */
exports.view = {
  type: 'ejs',
  common: {
    viewPath: path.join(think.ROOT_PATH, 'view'),
    sep: '_',
    extname: '.html'
  },
  // nunjucks: {
  //   handle: nunjucks
  // },
  ejs: {
    handle: ejs
  }
};

/**
 * logger adapter config
 * @type {Object}
 */
exports.logger = {
  type: isDev ? 'console' : 'dateFile',
  console: {
    handle: Console,
    layout: {
      type: 'pattern',
      pattern: '%[[%d{MM/dd-hh.mm.ss} %p]%] %m'
    }
  },
  file: {
    handle: File,
    backups: 10, // max chunk number
    absolute: true,
    maxLogSize: 50 * 1024, // 50M
    filename: path.join(think.ROOT_PATH, 'logs/app.log')
  },
  dateFile: {
    handle: DateFile,
    level: 'ALL',
    absolute: true,
    pattern: '-yyyy-MM-dd',
    alwaysIncludePattern: true,
    filename: path.join(think.ROOT_PATH, 'logs/app.log')
  }
};