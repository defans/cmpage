'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------


import Base from './base.js';

export default class extends Base {
  /**
   * index action
   * @return {Promise} []
   */
    async clearCacheAction(){
        //auto render template file index_index.html
        await this.model('admin/code').clearCodeCache();
        await this.model('module').clearModuleCache();
        await this.cache("users",null);

        return this.json({statusCode:200, message:'Cache is clear!'});
    }


}