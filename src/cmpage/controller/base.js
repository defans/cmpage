'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

/**
 业务模块配置和展示系统的controller模块，实现了对外的URL接口，包括PC端和移动端

 注意点 :
 1. base.js继承自 think.controller.base;
 2. 其他controller 继承自 base.js;
 3. 具体的业务模块可以继承并扩展 cmpage/model/page.js 来实现业务逻辑
 4. 移动端、主从页、查找带回等页面都是从 cmpage/model/page.js 继承，具体的业务模块请适当选择基类
 5. 使用cmpage的页面统一从 controller/page.js 提供URL接口调用，也可继承并重写相应方法来增加逻辑（但一般从model/page.js继承即可）

 @module cmpage.controller
 */

/**
 * cmpage.controller的基类，用于cmpage模块下的其他controller类的继承，
 * 提供一些子类的公共方法
 * @class cmpage.controller.base
 */
export default class extends think.controller.base {
    /**
     * 删除记录的URL接口，调用： /cmpage/xxx/delete?id=xxx
     * @method  delete
     * @return {json}  删除成功状态
     */
    async deleteAction(){
    let ret={statusCode:200,message:'',data:{}};
    let parms =this.http.query;
    global.debug(parms);

    let model = this.model(parms.table);
    if(parms.id >0){
      if(parms.flag == 'true'){
        await model.where({id: parms.id}).delete();
      }else {
        await model.where({id: parms.id}).update({c_status:-1});
      }

    }
    return this.json(ret);
  }

    /**
     本模块的所有action执行前的检查项
     @method  __before
     @return {promise} 当前用户未登录时，返回错误信息或者引导到登录页面
     */
  async __before(){
    //部分 action 下不检查,
    let blankActions = ["clear_cache"];
    if(blankActions.indexOf(this.http.action) >=0){
      return;
    }

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