'use strict';

module.exports = class extends think.Controller {
    /**
     本模块的所有action执行前的检查项
     @method  __before
     @return {promise} 当前用户未登录时，返回错误信息或者引导到登录页面
     */
  async __before(){
    //部分 action 下不检查
    let blankActions = ["login"];
    //console.log(this.ctx.action);
    if(blankActions.indexOf(this.ctx.action) >=0){
      return;
    }
    //console.log(this.ctx.url);
    let user = await this.session("user");
    //判断 session 里的 userInfo
    if(think.isEmpty(user)){
        return this.redirect("/dtalk/index/login");
    }
  }

}