'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

/**
 @module cmpage.model
 */

/**
 * 工具类，提供一些公用的方法
 * @class cmpage.model.utils
 */
export default class extends think.model.base  {

    /**
     * 从global的enum设置中提取name值, 一般用于页面模块配置中的‘替换’调用: cmpage/utils:getEnumName
     * @method  getEnumName
     * @return  {string}  enum值的名称
     * @param   {int} id enum值
     * @param   {object} enumObj enum对象，在 cmpage/cmpage_global.js中配置
     */
    async getEnumName(id,enumObj){
        enumObj = (enumObj.indexOf('enum') !== 0 ? 'enum'+enumObj: enumObj);
        let obj = global[enumObj];
        if(think.isObject(obj)){
            for(let p in obj){
                if(obj[p]== id){
                    return obj[p+'_name'];
                }
            }
        }
        return '';
    }

    /**
     * 从global的enum设置中提取name值, 一般用于页面模块配置中的‘下拉框选择’调用: cmpage/utils:getEnum
     * @method  getEnum
     * @return  {Array}  enum值组成的数组
     * @param   {object} enumObj enum对象，在 cmpage/cmpage_global.js中配置
     */
    async getEnum(enumObj){
        enumObj = (enumObj.indexOf('enum') !== 0 ? 'enum'+enumObj: enumObj);
        let obj = global[enumObj];
        let ret = [];
        if(think.isObject(obj)){
            for(let p in obj){
                if(think.isNumber(obj[p])){
                    ret.push( {id:obj[p],c_name:obj[p+'_name']});
                }
            }
        }
        //console.log(ret);
        return ret;
    }

}