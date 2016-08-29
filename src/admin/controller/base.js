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
    let blankActions = ["login","get_groups","keep_connect_db","timer_start","timer_stop"];
    //console.log(this.http.action);
    if(blankActions.indexOf(this.http.action) >=0){
      return;
    }
    //console.log(this.http.url);
    let user = await this.session("user");
    //判断 session 里的 userInfo
    if(think.isEmpty(user)){
        if(this.http.controller === 'mob'){
            return this.json({ id :0, msg : "用户名或密码错误！" });
        }else{
            return this.redirect("/admin/index/login");
        }
    }
  }
}