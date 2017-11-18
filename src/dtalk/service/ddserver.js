'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

/**
 @module dtalk.model
 */
// import request from 'request';
 const https = require("https");

/**
 * 钉钉服务端的相关接口调用类，接口调用的参数和返回的信息具体请参见钉钉的开发文档：https://open-doc.dingtalk.com/
 * @class dtalk.model.ddserver
 */
 const Base = require('../../cmpage/service/base.js');

 module.exports = class extends Base {

     async getDtalkApi(api_name,parms){
         if(think.isEmpty(parms))    parms = {};
         if(think.isEmpty(cmpage.dd.access_token))   await this.getAccessToken();
         parms.access_token = cmpage.dd.access_token;

         let url = `https://oapi.dingtalk.com/${api_name}?${cmpage.parmsToUrl(parms)}`;
         return await this.get(url);
     }
     async postDtalkApi(api_name, parms, data){
         if(think.isEmpty(parms))    parms = {};
         if(think.isEmpty(cmpage.dd.access_token))   await this.getAccessToken();
         parms.access_token = cmpage.dd.access_token;

         let path = `/${api_name}?${cmpage.parmsToUrl(parms)}`;
         return await this.post(path,data);
     }


    /**
     * 在每次主动调用钉钉开放平台接口时需要带上AccessToken参数。AccessToken参数由CorpID和CorpSecret换取
     * @method  getAccessToken
     * @return {object}   token信息 {errcode: 0, errmsg: "ok", access_token: "fw8ef8we8f76e6f7s8df8s" }
     */
    async getAccessToken(){
        let url =`https://oapi.dingtalk.com/gettoken?corpid=${cmpage.dd.corpid}&corpsecret=${cmpage.dd.secret}`;
        let ret = await this.get(url);
        cmpage.dd.access_token = ret.access_token;
        //debug(cmpage.dd,'ddserver.getAccessToken - cmpage.dd');
        return ret;
    }

    /**
     * 企业在使用微应用中的JS API时，需要先从钉钉开放平台接口获取jsapi_ticket生成签名数据，并将最终签名用的部分字段及签名结果返回到H5中，<br/>
     * JS API底层将通过这些数据判断H5是否有权限使用JS API  <br/>
     * @method  getJsapiTicket
     * @return {object}   ticket信息 {errcode: 0, errmsg: "ok", ticket: "dsf8sdf87sd7f87sd8v8ds0vs09dvu09sd8vy87dsv87", expires_in: 7200 }
     */
    async getJsapiTicket(){
        return await this.getDtalkApi('get_jsapi_ticket',{type:'jsapi'});
    }

    /**
     * 简单调用，如获取部门列表等接口，采用 await getDtalkApi('department/list');
     * 如果是POST方式，采用 await getDtalkApi('xxxxxx',{pamrs},{data});
     * 对应接口URL片段请参见 钉钉的文档，https://open-doc.dingtalk.com/, 部分描述如下：
     * ------------------------------------------------------------------------------
     * 接口：获取部门详情（department/get）, GET
     * 参数：{id:xxx}  部门id
     * ------------------------------------------------------------------------------
     * 接口：创建部门（department/create）,  POST
     * 参数：{name:xxx, parentid:1}  parentid--父部门id。根部门id为1
     * ------------------------------------------------------------------------------
     * 接口：创建部门成员（user/create）,  POST
     * 参数：{userid:xxx, name:xxx, department:[1,xxx]}  userid--用户id。传入t_user.c_guid,
     * ------------------------------------------------------------------------------
     */

     async get(url){
         return new Promise((resolve, reject) => {
             //cmpage.debug(url,'dserver.getDtalkApi - url');
             https.get(url, function(response) {
               if (response.statusCode === 200) {
                 var body = '';
                 response.on('data', function (data) {
                   body += data;
                 }).on('end', function () {
                   var result = JSON.parse(body);
                   if (result && 0 === result.errcode) {
                       resolve(result);
                     //cb.success(result);
                   }
                   else {
                       reject(result);
                     //cb.error(result);
                   }
                 });
               }
               else {
                   reject(response);
                 //cb.error(response.statusCode);
               }
             });
         });
     }
     async post(path,data){
         return new Promise((resolve, reject) => {
             //cmpage.debug(url,'dserver.getDtalkApi - url');
             var opt = {
               method: 'POST',
               headers: {
                 'Content-Type': 'application/json'
               },
               host: 'oapi.dingtalk.com',
               path: path
             };
             var req = https.request(opt, function (response) {
               if (response.statusCode === 200) {
                 var body = '';
                 response.on('data', function (data) {
                   body += data;
                 }).on('end', function () {
                   var result = JSON.parse(body);
                   if (result && 0 === result.errcode) {
                     resolve(result);
                   }
                   else {
                     reject(result);
                   }
                 });
               }
               else {
                 reject(response.statusCode);
               }
             });
             req.write(JSON.stringify(data) + '\n');
             req.end();
         });
     }


}
