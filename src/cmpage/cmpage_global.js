'use strict';

/**
 @module cmpage.service
 */

/**
 * global.cmpage的全局方法和变量设置
 */

/**
 * 取对象的所有属性描述
 * @method  getOwnPropertyDescriptors
 * @param   {object} obj 对象
 */
cmpage.getOwnPropertyDescriptors = function(obj) {
    let result = {};
    for (let key of Reflect.ownKeys(obj)) {
        result[key] = Object.getOwnPropertyDescriptor(obj, key);
    }
    return result;
};

/**
 * 对象转换成字符串，其中的属性不带双引号，字符串和时间类型带单引号，其余默认转换，可以用 eval 转成对象<br/>
 * 一般用于 某数据表记录的字段替换 事先设置的子字符串，子字符串的格式如：#id#
 * @method  objPropertysReplaceToStr
 * @return  {string}  替换后的字符串
 * @param   {string} str 源字符串
 * @param   {object} obj 源对象
 */
    cmpage.objPropertysReplaceToStr = function(str, obj){
        if(think.isEmpty(str) || think.isEmpty(obj))  return str;

        let ret = [];
        let arr = str.split('');
        let key ='';
        let isKey = false;
        for(let s of arr){
            if(isKey){
                if(s === '#'){  //key 结束，替换值加入ret
                    isKey = false;
                    if(think.isEmpty(key)){
                        ret.push('#');
                    }else{
                        ret.push(obj.hasOwnProperty(key) ? obj[key] : '#'+key+'#');
                    }
                }else{
                    key += s;
                }
            }else{
                if(s === '#'){
                    isKey = true;
                    key ='';
                }else {
                    ret.push(s);
                }
            }
        }
        return ret.join('');
    };
    /**
     * 在目标对象上增加另一个对象的某些属性，如有重叠，则覆盖其值
     * @method  objPropertysFromOtherObj
     * @return  {object}  新的对象，其属性集是源对象的子集
     * @param   {object} toObj 目标对象
     * @param   {object} fromObj 源对象
     * @param   {Array} arrProps 需要COPY的熟悉数组
     */
    cmpage.objPropertysFromOtherObj = function(toObj, fromObj, arrProps){
        let ret = {};
        Object.assign(ret,toObj);
        let arr = think.isString(arrProps) ? arrProps.split(',') : arrProps;
        for(let key of arr){
            ret[key] = fromObj[key];
        }
        return ret;
    };
    /**
     * 对象转换成字符串，其中的属性不带双引号，字符串和时间类型带单引号，其余默认转换，可以用 eval 转成对象<br/>
     * 一般用 cmpage.objFromString(str) 进行转换
     * @method  objToString
     * @return  {string}  序列化后的字符串
     * @param   {object} obj 源对象
     */
    cmpage.objToString = function(obj){
        let ret = [];
        if(think.isObject(obj)) {
            for (let key in obj) {
                if (think.isDate(obj[key])) {
                    ret.push(`${key}:'${think.datetime(obj[key])}'`);
                } else if (think.isString(obj[key])) {
                    ret.push(`${key}:'${obj[key]}'`);
                } else if (think.isObject(obj[key])) {
                    ret.push(`${key}:${ cmpage.objToString(obj[key]) }`);
                } else if (think.isArray(obj[key])) {
                    let tmp = [];
                    for (let item of obj[key]) {
                        tmp.push(cmpage.objToString(item));
                    }
                    ret.push(`${key}:[${tmp.join(',')}]`);
                } else {
                    ret.push(`${key}:${obj[key]}`);
                }
            }
            return "{" + ret.join(', ') + "}";
        }else if(think.isArray(obj)){
            let tmp = [];
            for (let item of obj) {
                tmp.push(cmpage.objToString(item));
            }
            return `[${tmp.join(',')}]`;
        }else{
            return String(obj);
        }
    };

    /**
     * 把字符串转换成对象，一般该字符串是从 cmpage.objToString(obj) 转换而来 <br/>
     * @method  objFromString
     * @return   {object}  目标对象
     * @param  {string}  str 序列化后的字符串
     */
    cmpage.objFromString = function(str){
        //cmpage.debug(str,'cmpage_global.objFromString - str');
        if(think.isEmpty(str) || str.indexOf('{') !== 0)    return {};
        return eval("("+ str +")");
    };

    /**
     * 把字符串转换成数组对象，其元素是对象，一般该元素是从 cmpage.objToString(obj) 转换而来 <br/>
     * @method  arrFromString
     * @return   {Array}  JSON对象数组
     * @param  {string}  str 序列化后的字符串
     */
    cmpage.arrFromString = function(str){
        let arr = [];
        let obj = think.isEmpty(str) ? {} : cmpage.objFromString(str);
        if(think.isArray(obj)){
            for(let item of obj){
                if(!think.isEmpty(item)){    arr.push(item);  }
            }
        }else{
            if(!think.isEmpty(obj)){    arr.push(obj);  }
        }
        return arr;
    };
    /**
     * 从对象数组中查找符合匹配条件的元素，组成新的数组返回 <br/>
     × 一般用于从记录表中按条件删选出子表
     * @method  arrFromString
     * @return   {Array}  JSON对象数组
     * @param   {Array}  来源数组
     * @param  {object}  where 条件对象
     */
    cmpage.subArray = function(arr,where){
        if(think.isEmpty(where) || !think.isObject(where))  return arr;
        let ret = [];
        for(let a of arr){
            let isSame = true;
            for(let p in where){
                if(where[p] != a[p]){
                    isSame = false;
                    break;
                }
            }
            if(isSame){ ret.push(a);    }
        }
        return ret;
    };

    /**
     * 从一个对象数组中取某一列（属性）值组成的数组，一般用于处理select返回的结果集
     * @method  arrGetValuesByColumnName
     * @return  {Array}  新的数组，由源数组元素的某个属性值组成
     * @param   {Array} arr 对象数组
     * @param   {object} fromObj 源对象
     * @param   {string} columnName 属性名称
     */
    cmpage.arrGetValuesByColumnName = function(arr,columnName){
        let ret = [];
        for(let obj of arr){
            ret.push(obj[columnName]);
        }
        return ret;
    };

    /**
     * 从一个对象中取某些属性值组成的字符串，一般用于连接某条记录的某些值
     * @method  strGetValuesByPropertyName
     * @return  {string}  新的字符串，由指定的属性值组成
     * @param   {object} obj 源对象
     * @param   {object} fromObj 源对象
     * @param   {string} propertyNames 属性名称,逗号分隔
     * @param   {string} joinStr 连接的字符串
     */
    cmpage.strGetValuesByPropertyName = function(obj,propertyNames,joinStr){
        //debug(propertyNames);
        let ret = [];
        joinStr = joinStr || '';
        for(let p of propertyNames.split(',')){
            ret.push(obj[p]);
        }
        return ret.join(joinStr);
    };

    /**
     * 去除数组中的重复值
     * @method  arrGetUnique
     * @return  {Array}  新的数组
     * @param   {Array} arr 源数组
     */
    cmpage.arrGetUnique = function(arr){
        var n = {},ret=[]; //n为hash表
        for(var i = 0; i < arr.length; i++) //遍历当前数组
        {
            if (!n[arr[i]]) //如果hash表中没有当前项
            {
                n[arr[i]] = true; //存入hash表
                ret.push(arr[i]); //把当前数组的当前项push到临时数组里面
            }
        }
        return ret;
    };

    /**
     * 进行CRUD之前转换成合适的值，用来匹配 thinkjs 的CRUD方法
     * @method  checksql
     * @return  {object}  新的对象，其属性已做SQL特性匹配
     * @param   {object} fromObj 记录对象
     */
    cmpage.checksql = (obj) =>{
        for (let key of Reflect.ownKeys(obj)) {
            let val =obj[key];
            if(think.isBoolean(val) ){
                obj[key] = val ? 1: 0;
            }
        }
        return obj;
    };

    /***************************其他的全局方法 **************************************/
    cmpage.debug = (msg,desc)=>{
        if(think.env === 'development'){
            //let message = think.isObject(msg) ? JSON.stringify(msg).replace(/"/g,'').replace(/\\/g,'').replace(/,/g,',  ') : msg;
            let message = cmpage.objToString(msg);
            think.logger.debug((!think.isEmpty(desc) ? '['+desc+'] --> ':'[CMPAGE] ') + message);
            // think.logger.debug(message, think.isEmpty(desc) ? ' CMPAGE ':desc);
        }
    };

    /**
     * 从URL字符串中解析出参数对象
     * @method  parmsFromUrl
     * @return  {object}  url参数对象
     * @param   {string} url URL字符串
     */
    cmpage.parmsFromUrl = (url)=>{
        if(think.isEmpty(url))  return {};
        //cmpage.debug(url,'cmpage.parmsFromUrl - url');
        let parms = url.split('?')[1].split('&');
        let ret = {};
        for(let parm of parms){
            let p = parm.split('=');
            ret[p[0]] = String(think.isEmpty(p[1]) ? '':p[1]);
        }
        return ret;
    };
    cmpage.error = (msg,data) =>{
        //TODO: 可以考虑增加统一的错误处理逻辑
        let ret ={statusCode:300, message:msg, data:data};
        cmpage.debug(ret,'ERROR');
        return ret;
    };
    /**
     * 通过形如：demo/customer 参数，返回模块demo下面的业务实现类customer的实例
     * @method  model
     * @return  {object}  thinkjs.service 实例
     * @param   {string} path 业务模块的实现类设置
     * @param   {string} connStr 配置的数据库连接参数
     * @param   {string} defaultPath 业务模块默认的实现类
     */
    cmpage.service = (path,  defaultPath) =>{
        defaultPath = think.isEmpty(defaultPath) ? 'cmpage/page':defaultPath;
        path = think.isEmpty(path) ? defaultPath : path;
        //console.log(path);
        let ps = path.split('/');
        if(ps.length >1){
            return think.service(ps[1], ps[0]);
        }else{
            return think.service(path);
        }
    };

    /**
     * 时间格式化输出
     * @method  model
     * @return  {string}  格式化输出
     * @param   {object} date 需要格式化的日期对象
     * @param   {string} format 格式： 如： yyyy-MM-dd HH:mm:ss
     */
    cmpage.datetime = (date,format) => {
        if(think.isEmpty(format)){
            format = 'YYYY-MM-DD';
        }
        format = format.replace(/yyyy-MM-dd/,'YYYY-MM-DD').trim();
        if(think.isEmpty(date)){
            //return moment().format(format);
            return think.datetime(new Date(), format);
        }else{
            //return moment(date).format(format);
            return think.datetime(date, format);
        }
    };

    /**
     * cmpage的全局变量初始化，如enum等
     * 值>0 ,是为了和数据库中其他的参数值设置方式保持一致
     */
    cmpage.enumStatusExecute = {
        SUCCESS:1, SUCCESS_name:'执行成功',
        FAIL:2, FAIL_name:'执行失败',
        ERROR:3, ERROR_name:'执行错误'
    };

    cmpage.enumLogType = {
        ADD:1, ADD_name:'新增',
        UPDATE:2, UPDATE_name:'修改'
    };

    cmpage.ui = {
        enumListColumns : {     //其值表示页面列表的显示字段的数量
            MAX:100, MIDDLE:5, SMALL: 5, MOBILE: 3
        },
        enumListBtns : {     //其值表示页面列表的行按钮的数量
            MAX:100, MIDDLE:2, SMALL: 2, MOBILE: 1
        },
        enumQueryColumns : {     //其值表示页面列表的行按钮的数量
            MAX:5, MIDDLE:2, SMALL: 2, MOBILE: 1
        }

    };

    /************************************数字值的格式化输出 **************************************/
    cmpage._format = function(pattern,num,z){
        let j = pattern.length >= num.length ? pattern.length : num.length ;
        let p = pattern.split("");
        let n = num.split("");
        let bool = true,nn ="";
        for(let i=0;i<j;i++){
            let x = n[n.length-j+i];
            let y = p[p.length-j+i];
            if( z == 0){
                if(bool){
                    if( ( x && y && (x !="0"|| y =="0")) || ( x && x !="0"&& !y ) || ( y && y =="0"&& !x ) ){
                        nn += x ? x :"0";
                        bool = false;
                    }
                } else {
                    nn += x ? x :"0";
                }
            } else {
                if( y && ( y =="0"|| ( y =="#"&& x ) ))
                    nn += x ? x :"0";
            }
        }
        return nn;
    };
    cmpage._formatNumber = function(numChar,pattern){
        let patterns = pattern.split(".");
        let numChars = numChar.split(".");
        let z = patterns[0].indexOf(",") == -1 ? -1 : patterns[0].length - patterns[0].indexOf(",") ;
        let num1 = cmpage._format(patterns[0].replace(","),numChars[0],0);
        let num2 = cmpage._format(patterns[1]?patterns[1].split('').reverse().join(''):"", numChars[1]?numChars[1].split('').reverse().join(''):"",1);
        num1 = num1.split("").reverse().join('');
        let reCat = eval("/[0-9]{"+ (z-1) +","+ (z-1) +"}/gi");
        let arrdata = z > -1 ? num1.match(reCat) : undefined ;
        if( arrdata && arrdata.length > 0 ){
            let w = num1.replace(arrdata.join(''),'');
            num1 = arrdata.join(',') + ( w ==""?"":",") + w ;
        }
        num1 = num1.split("").reverse().join("");
        return (num1 ==""?"0": num1) + (num2 !=""?"."+ num2.split("").reverse().join('') :"");
    };

    /**
     * 有小数的格式化输出
     * @method  formatNumber
     * @return  {string}  格式化输出
     * @param   {float} mum 需要格式化的数值
     * @param   {object} opt 格式化配置对象，一般中业务模块的列设置中制定格式如： {pattern:'#####0.00'}
     */
    cmpage.formatNumber = function(num,opt){
        if(think.isEmpty(opt.pattern)){
            return num.toString();
        }
        let reCat = /[0#,.]{1,}/gi;
        let zeroExc = opt.zeroExc == undefined ? true : opt.zeroExc ;
        let pattern = opt.pattern.match(reCat)[0];
        let numChar = num.toString();
        return !(zeroExc && numChar == 0) ? opt.pattern.replace(pattern,cmpage._formatNumber(numChar,pattern)) : opt.pattern.replace(pattern,"0");
    };

    /**
     * 取两个整数间的随机整数
     * @method  getRandomNum
     * @return  {int}  随机整数
     * @param   {int} Min 最小整数
     * @param   {int} Max 最大整数
     */
    cmpage.getRandomNum = function(Min,Max)
    {
        if(Max <= Min){
            return Min;
        }
        var Range = Max - Min;
        var Rand = Math.random();
        return(Min + Math.round(Rand * Range));
    };

    /**
     * 过滤敏感字符串
     * @method
     * @return  {string}  过滤后的字符串
     * @param   {string} str 源字符串
     */
    cmpage.filterSensitiveString = function(str)
    {
        let arr = ['select ','update ','delete ','alter ','drop ','create ','exec ','execute '];
        let ret = str;
        for(let s of arr){
            ret = ret.replace(s,'');
        }
        return ret;
    };

    /**
     * 根据文件名称判断文件是否是图片类型
     * @method
     * @return  {boolean}  是否图片文件
     * @param   {string} filename 文件名称
     */
    cmpage.isImageFile = function(filename)
    {
        let arr = ['jpg','png','jpeg','gif','bmp'];
        let exts = filename.split('.');
        if(exts.length < 2)   return false;

        let fileExt = exts[exts.length -1];
        for(let s of arr){
            if(s == fileExt)    return true;
        }
        return false;
    };

    cmpage.sleep = function(milliSecond) {          
        var startTime = new Date().getTime();                  
        while(new Date().getTime() <= milliSecond + startTime) {              
        }  
     };
