'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

/**
 * 工具类，提供一些公用的方法
 */
export default class extends think.model.base  {
    /**
     * 从global的enum设置中提取name值
     */
    async getEnumName(id,enumObj){
        enumObj = (enumObj.indexOf('enum') !== 0 ? 'enum'+enumObj: enumObj);
        let obj = global[enumObj];
//        console.log(obj);
        if(think.isObject(obj)){
            for(let p in obj){
                //console.log(p);
                if(obj[p].id == id){
                    return obj[p].c_name;
                }
            }
        }
        return '';
    }
    async getEnum(enumObj){
        enumObj = (enumObj.indexOf('enum') !== 0 ? 'enum'+enumObj: enumObj);
        let obj = global[enumObj];
        let ret = [];
        if(think.isObject(obj)){
            for(let p in obj){
                ret.push( obj[p]);
            }
        }
        return ret;
    }

}