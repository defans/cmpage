'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

export default class extends think.controller.base {
  /**
   * some base method in here
   */
  async __before(){
    //部分 action 下不检查
    let blankActions = ["login"];
    if(blankActions.indexOf(this.http.action) >=0){
      return;
    }
    //console.log(this.http.url);
    let user = await this.session("user");
    //判断 session 里的 userInfo
    if(think.isEmpty(user)){
      return this.redirect("/admin/index/login");
    }
  }
}