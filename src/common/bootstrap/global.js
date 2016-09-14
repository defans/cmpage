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

import CMPageGlobal from './../../cmpage/cmpage_global.js';

let cmpageGlobal = new CMPageGlobal();

Object.assign(global,cmpageGlobal);

cmpageGlobal.cmpageInit();
