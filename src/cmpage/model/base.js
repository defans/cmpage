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
 * 业务模块的基类，继承自 think.Model，配置在common/config/adapter.js中，
 * 系统需要链接多个数据库的时候，通过实例化本类时传入不同的数据库配置来实现 </br>
 * @class cmpage.model.base
 */

module.exports = class extends think.Model {

    // parseValue(value){
    //     if(think.isBoolean(value)){
    //         value = value ? 'TRUE' : 'FALSE';
    //     }else if(think.isDate(value)){
    //         value =`'${think.datetime(value)}'` ;
    //     }else {
    //         value = super.parseValue(value);
    //     }
    //     return value;
    // }


}
