'use strict';
/**

 @module flow.controller
 */

/**
 * flow.controller的基类，用于flow模块下的其他controller类的继承，
 * 提供一些子类的公共方法
 * @class flow.controller.base
 */
module.exports = class extends think.Controller {
  /**
   本模块的所有action执行前的检查项
   @method  __before
   @return {promise} 当前用户未登录时，返回错误信息或者引导到登录页面
   */
  async __before(){
    //部分 action 下不检查,
    let blankActions = ["clear_cache","auto_exec"];
    if(blankActions.indexOf(this.ctx.action) >=0){
      return;
    }

    let user = await this.session("user");
    //判断 session 里的 userInfo
    if(think.isEmpty(user)){
      if(this.ctx.controller === 'mob'){
        return this.json({ id :0, msg : "用户名或密码错误！" });
      }else{
        return this.redirect("/admin/index/login");
      }
    }
  }
}