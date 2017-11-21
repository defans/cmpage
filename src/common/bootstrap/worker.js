// invoked in worker
require('./global.js');


// 创建global.cmpage，以及常用的方法 cmpage.xxxx()
global.cmpage = require('../../cmpage/cmpage.js');

// 以下为了书写方便一点
global.debug = global.cmpage.debug;
