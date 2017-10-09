// invoked in worker
require('./global.js');
// 创建global.cmpage，以及常用的方法 cmpage.xxxx()
require('../../cmpage/cmpage_global.js');

// 把工作流的全局参数和方法放入 cmpage 中
require('../../flow/cmpage_global_flow.js');

// 把单据相关的全局参数和方法放入 cmpage 中
require('../../docu/cmpage_global_docu.js');

// 把用户相关的全局参数和方法放入 cmpage 中
require('../../admin/cmpage_global_admin.js');

// 把钉钉相关的全局参数和方法放入 cmpage 中
require('../../dtalk/cmpage_global_dtalk.js');

// 以下为了书写方便一点
global.debug = global.cmpage.debug;
