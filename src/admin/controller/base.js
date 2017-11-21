'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------
/**
    用户及权限系统的controller模块，实现了对外的URL接口，包括PC端和移动端

 注意点 :
 1. base.js继承自 think.Controller;
 2. 其他controller 继承自 base.js;
 3. 移动端APP的菜单是单独设置的，要单独配置各个角色和用户的权限；
 4. 移动端和PC端的版本是分开设置的;

    @module admin.controller
 */

/**
 * admin.controller的基类，用于admin模块下的其他controller类的继承，
 * 提供一些子类的公共方法
 * @class admin.controller.base
 */
module.exports =  class extends think.Controller {
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
    let blankActions = ["login","get_groups"];
    //console.log(this.ctx.action);
    if(blankActions.indexOf(this.ctx.action) >=0){
      return;
    }
    //console.log(this.ctx.url);
    let user = await this.session("user");
    //判断 session 里的 userInfo
    if(think.isEmpty(user)){
        if(this.ctx.url.indexOf('/mob/') >0){
            return this.json({ id :0, msg : "用户名或密码错误！" });
        }else{
            return this.redirect("/admin/index/login");
        }
    }
  }
};