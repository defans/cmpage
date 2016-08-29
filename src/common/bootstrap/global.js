/**
 * this file will be loaded before server started
 * you can define global functions used in controllers, models, templates
 */

/**
 * use global.xxx to define global functions
 * 
 * global.fn1 = function(){
 *     
 * }
 */

import CMPage from './cmpage.js';

let cmpage = new CMPage();

Object.assign(global,cmpage);

global.enumStatusExecute = {
        SUCCESS:{id:0,name:'执行成功'},
        FAIL:{id:1,name:'执行失败'},
        ERROR:{id:2,name:'执行错误'}
    };

global.enumLogType = {
    ADD:{id:0,name:'新增'},
    UPDATE:{id:1,name:'修改'}
};
