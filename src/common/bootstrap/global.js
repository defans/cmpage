/**
 * this file will be loaded before server started
 * you can define global functions used in controllers, models, templates
 * 定义了全局对象 cmpage， 把框架用到的参数设置和公共方法放入其中，统一用 cmpage.xxx 来调用
 */


import CMPageGlobal from '../../cmpage/cmpage_global.js';
global.cmpage = new CMPageGlobal();

//把工作流的全局参数和方法放入 cmpage 中
import CMPageGlobalFlow from '../../flow/cmpage_global_flow.js';    //工作流部分
Object.assign(global.cmpage, new CMPageGlobalFlow());

//把单据相关的全局参数和方法放入 cmpage 中
import CMPageGlobalDocu from '../../docu/cmpage_global_docu.js';    //单据部分
Object.assign(global.cmpage, new CMPageGlobalDocu());

//以下为了书写方便一点
global.debug = global.cmpage.debug;
