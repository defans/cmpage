'use strict';

module.exports = class extends think.Controller {
  constructor(ctx){
    super(ctx); // 调用父级的 constructor 方法，并把 ctx 传递进去
    // 其他额外的操作
    this.cmpage = require('../../cmpage/cmpage.js');
  }
  
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