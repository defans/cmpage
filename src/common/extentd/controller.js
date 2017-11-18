'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

/**

 @module cmpage.service
 */

/**
 * 普通页面的数据处理类，实现了具体的操作方法
 * @class common.extentd.controller
 */
module.exports = {
    successBJUI(data){
        
      return this.ctx.isMobile;
    }
  }