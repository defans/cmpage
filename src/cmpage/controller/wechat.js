'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------


 //  微信的URL接口, 待定

import Base from './base.js';

const DEFULT_AUTO_REPLY = '功能正在开发中~';

export default class extends Base {
  /**
   * index action
   * @return {Promise} []
   */
  indexAction(){
    let echostr = this.get('echostr');
    return this.end(echostr);
  }
  reply(message){
    this.http.res.reply(message);
  }
  textAction(){
    var message = this.post();
    var msg = message.Content.trim();
    this.reply('测试成功:'+msg);
  }
  eventAction(){
    var message = this.post();
    this.reply(JSON.stringify(message));
  }
  __call(){
    this.reply(DEFULT_AUTO_REPLY);
  }
  //不验证登陆
    async __before(){
      //部分 action 下不检查,
    }
}
