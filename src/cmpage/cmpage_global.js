'use strict';

/**
 @module cmpage.model
 */

/**
 * cmpage的全局方法和变量设置，置入（Object.assign）thinkjs 的 global 中
 * @class cmpage.cmpage_global
 */

import moment from 'moment';

export default class extends think.base {

    /************************************数字值的格式化输出 **************************************/
    _format = function(pattern,num,z){
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
    _formatNumber = function(numChar,pattern){
        let patterns = pattern.split(".");
        let numChars = numChar.split(".");
        let z = patterns[0].indexOf(",") == -1 ? -1 : patterns[0].length - patterns[0].indexOf(",") ;
        let num1 = this._format(patterns[0].replace(","),numChars[0],0);
        let num2 = this._format(patterns[1]?patterns[1].split('').reverse().join(''):"", numChars[1]?numChars[1].split('').reverse().join(''):"",1);
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
     * @param   {object} opt 格式化配置对象，一般中业务模块的列设置中制定格式如： #####0.00
     */
    formatNumber = function(num,opt){
        if(think.isEmpty(opt.pattern)){
            return num.toString();
        }
        let reCat = /[0#,.]{1,}/gi;
        let zeroExc = opt.zeroExc == undefined ? true : opt.zeroExc ;
        let pattern = opt.pattern.match(reCat)[0];
        let numChar = num.toString();
        return !(zeroExc && numChar == 0) ? opt.pattern.replace(pattern,this._formatNumber(numChar,pattern)) : opt.pattern.replace(pattern,"0");
    };

    /**
     * 取两个整数间的随机整数
     * @method  getRandomNum
     * @return  {int}  随机整数
     * @param   {int} Min 最小整数
     * @param   {int} Max 最大整数
     */
    getRandomNum = function(Min,Max)
    {
        if(Max <= Min){
            return Min;
        }
        var Range = Max - Min;
        var Rand = Math.random();
        return(Min + Math.round(Rand * Range));
    };

    /***************************对象处理 **************************************/
    //取对象的所有属性描述
    getOwnPropertyDescriptors = function(obj) {
        let result = {};
        for (let key of Reflect.ownKeys(obj)) {
            result[key] = Object.getOwnPropertyDescriptor(obj, key);
        }
        return result;
    };

    /**
     * 在目标对象上增加另一个对象的某些属性，如有重叠，则覆盖其值
     * @method  objPropertysFromOtherObj
     * @return  {object}  新的对象，其属性集是源对象的子集
     * @param   {object} toObj 目标对象
     * @param   {object} fromObj 源对象
     * @param   {Array} arrProps 需要COPY的熟悉数组
     */
    objPropertysFromOtherObj = function(toObj, fromObj, arrProps){
        let ret = {};
        Object.assign(ret,toObj);
        for(let key of arrProps){
            ret[key] = fromObj[key];
        }
        return ret;
    };
    /**
     * 对象转换成字符串，其中的属性不带双引号，字符串和时间类型带单引号，其余默认转换，可以用 eval 转成对象
     * @method  objToString
     * @return  {string}  序列化后的字符串
     * @param   {object} obj 源对象
     */
    objToString = function(obj){
        let ret = [];
        for(let key in obj){
            if(think.isDate(obj[key])){
                ret.push(`${key}:'${think.datetime(obj[key])}'`);
            }else if(think.isString(obj[key])) {
                ret.push(`${key}:'${obj[key]}'`);
            }else if(think.isObject(obj[key])) {
                ret.push(`${key}:${ this.objToString(obj[key]) }`);
            }else if(think.isArray(obj[key])) {
                let tmp = '';
                for(let item of obj[key]){
                    if(think.isObject(item)){
                        tmp += this.objToString(item);
                    }else{
                        tmp += item;
                    }
                }
                ret.push(`${key}:[${tmp}]`);
            }else {
                ret.push(`${key}:${obj[key]}`);
            }
        }
        return "{"+ret.join(', ')+"}";
    };

    /**
     * 进行CRUD之前转换成合适的值，用来匹配 thinkjs 的CRUD方法
     * @method  checksql
     * @return  {object}  新的对象，其属性已做SQL特性匹配
     * @param   {object} fromObj 记录对象
     */
    checksql = (obj) =>{
//        let ret = {};
        for (let key of Reflect.ownKeys(obj)) {
            let val =obj[key];
            if(think.isBoolean(val) && think.config("db.type")==='mysql'){
                obj[key] = val ? 1: 0;
            }
        }
        return obj;
    };

    /***************************其他的全局方法 **************************************/
    debug = (msg)=>{
        if(think.env === 'development')
            console.log(think.isObject(msg) ? JSON.stringify(msg).replace(/"/g,'').replace(/\\/g,'').replace(/,/g,',  ') : msg);
    };
    log = (msg)=>{
        console.log(msg);
    };

    /**
     * 通过形如：demo/customer 参数返回model，数据库配置采用model所在模块的配置
     * @method  model
     * @return  {object}  thinkjs.model 对象
     * @param   {string} path 业务模块的实现类设置
     * @param   {string} defaultPath 业务模块默认的实现类
     */
    model = (path, defaultPath) =>{
        defaultPath = think.isEmpty(defaultPath) ? 'cmpage/page':defaultPath;
        path = think.isEmpty(path) ? defaultPath : path;
        //console.log(path);
        let ps = path.split('/');
        let config =think.config('db',undefined,ps[0]);
        if(think.isEmpty(config)){
            config =think.config('db',undefined,'common');
        }
        return think.model(ps[1],config, ps[0]);
    };

    /**
     * 时间格式化输出
     * @method  model
     * @return  {string}  格式化输出
     * @param   {object} date 需要格式化的日期对象
     * @param   {string} format 格式： 如： yyyy-MM-dd HH:mm:ss
     */
    datetime = (date,format) => {
        if(think.isEmpty(format)){
            format = 'YYYY-MM-DD';
        }
        if(think.isEmpty(date)){
            return moment().format(format.replace(/yyyy-MM-dd/,'YYYY-MM-DD').trim());
        }else{
            return moment(date).format(format.replace(/yyyy-MM-dd/,'YYYY-MM-DD').trim());
        }
    };

    /**
     * cmpage的全局变量初始化，如enum等
     * @method  cmpageInit
     * @return  {无}
     */
    cmpageInit = () =>{
        //用 c_ 开头,值>0 ,是为了和数据库中一致
        global.enumStatusExecute = {
            SUCCESS: {id:1, c_name:'执行成功'},
            FAIL: {id:2, c_name:'执行失败'},
            ERROR: {id:3, c_name:'执行错误'}
        };

        global.enumLogType = {
            ADD: {id:1, c_name:'新增'},
            UPDATE: {id:2, c_name:'修改'}
        };

        //工作流相关参数
        global.enumProcType = {
            NORMAL: {id:1, c_name:'常规类型'},
            APPROVE: {id:2, c_name:'审核类型'}
        };
        global.enumProcWayCreate = {
            MAN: {id:1, c_name:'手动执行'},
            TRIGGER: {id:2, c_name:'自动触发'},
            DEFINE: {id:9, c_name:'自定义'}
        };
        global.enumProcAssignType = {
            ALL: {id:1, c_name:'所有人'},
            DEPT: {id:2, c_name:'部门'},
            ROLE: {id:3, c_name:'角色'},
            TEAM: {id:4, c_name:'团队'},
            USER: {id:5, c_name:'用户'},
            DEFINE: {id:9, c_name:'自定义'}
        };
        global.enumActType = {
            NORMAL_MAN: {id:1, c_name:'人为参与'},
            NORMAL_AUTO: {id:2, c_name:'自动执行'},
            START: {id:3, c_name:'开始节点'},
            DUMMY: {id:4, c_name:'哑活动'},
            END: {id:9, c_name:'结束节点'}
        };
        global.enumActFromRule = {
            ORDER: {id:1, c_name:'顺序'},
            AND_JOIN: {id:2, c_name:'与汇聚'},
            OR_JOIN: {id:3, c_name:'或汇聚'},
            VOTES_JOIN: {id:4, c_name:'投票汇聚'},
            DEFINE: {id:9, c_name:'自定义'}
        };
        global.enumActToRule = {
            ORDER: {id:1, c_name:'顺序'},
            AND_SPLIT: {id:2, c_name:'与分支'},
            OR_SPLIT: {id:3, c_name:'或分支'},
            DEFINE: {id:9, c_name:'自定义'}
        };
        global.enumActCcRule = {
            NO: {id:1, c_name:'不通知'},
            MAN: {id:2, c_name:'手动通知'},
            AUTO: {id:3, c_name:'自动发送'},
            MAN_AND_AUTO: {id:4, c_name:'手动和自动'},
            DEFINE: {id:9, c_name:'自定义'}
        };
        global.enumActAssignType = {
            DEPT: {id:2, c_name:'部门'},
            ROLE: {id:3, c_name:'角色'},
            TEAM: {id:4, c_name:'团队'},
            USER: {id:5, c_name:'用户'},
            SELF: {id:6, c_name:'发起人自己'},
            PREV: {id:7, c_name:'上一步执行人'},
            DEFINE: {id:9, c_name:'自定义'}
        };
        global.enumActAssignWay = {
            ALL: {id:1, c_name:'所有人'},
            LEAST_WORKING_LIST: {id:2, c_name:'最少工作量'},   //任务将分配给指定群体中的工作量最少的人员，工作量的多少可以通过TO_DO_TASK_LIST的统计数据得到
            FCFA: {id:3, c_name:'先来先分配'},   //（First Coming First Assigning）
            PRIORITY: {id:4, c_name:'优先数大者'},   //基于优先数分配（c_type==ROLE），每个角色中的人员都有一个优先数，数大者得
            ROUND_ROBIN: {id:5, c_name:'令牌轮转'},    //轮转法（c_type==ROLE），ROUND_ROBIN_TOKEN为轮转令牌，任务将分配给携有轮转令牌的人员
            SELECT: {id:6, c_name:'提供选择'}   //，上一个活动的执行人来选择
        };
        global.enumActAssignTypeExe = {
            EXE: {id:1, c_name:'执行'},
            EXE_AND_BEFORE_CC: {id:2, c_name:'执行并事前通知'},
            AFTER_CC: {id:3, c_name:'事后通知'}
        };
        global.enumTaskStatus = {
            INIT: {id:1, c_name:'初始化'},
            RUN: {id:2, c_name:'运行中'},
            SUSPEND: {id:3, c_name:'挂起'},
            TERMINATE: {id:4, c_name:'终止'},
            END: {id:9, c_name:'完成'}
        };
        global.enumTaskPriority = {
            NOMAL: {id:1, c_name:'一般'},
            HIGH: {id:2, c_name:'高'},
            HIGHER: {id:3, c_name:'很高'},
            HIGHEST: {id:4, c_name:'最高'},
            LOW: {id:5, c_name:'低'},
            LOWER: {id:6, c_name:'很低'},
            LOWEST: {id:7, c_name:'最低'}
        };
        global.enumTaskActStatus = {
            NO_BEGIN: {id:1, c_name:'未开始'},
            INIT: {id:2, c_name:'初始化'},
            WAIT: {id:2, c_name:'等待中'},
            RUN: {id:4, c_name:'运行中'},
            SUSPEND: {id:5, c_name:'挂起'},
            PENDING: {id:6, c_name:'汇聚中'},
            TERMINATE: {id:7, c_name:'终止'},
            END: {id:9, c_name:'完成'}
        };
        //暂时不考虑回退和跳转，如有必要，可继承task, task_act来实现具体的某一类业务流程模板
        //global.enumActJumpRule = {
        //    NO: {id:1, c_name:'不能跳转'},
        //    FORWARD: {id:2, c_name:'向前跳转'},
        //    BACK: {id:3, c_name:'向后跳转'},
        //    ANY: {id:4, c_name:'任意跳转'},
        //    DEFINE: {id:9, c_name:'自定义'}
        //};
        //global.enumActBackRule = {
        //    NO: {id:1, c_name:'不能回退'},
        //    PREV: {id:2, c_name:'退到上一步'},
        //    ANY: {id:4, c_name:'退到任意步'},
        //    DEFINE: {id:9, c_name:'自定义'}
        //};
    };

    /***************************根据参数对象生成新增和修改的SQL语句 ************ 已经废弃 **************************/
    //parseValue = function(value){
    //    if (think.isString(value)) {
    //        value = '\'' + value + '\'';
    //    }else if(think.isArray(value)){
    //        if (/^exp$/.test(value[0])) {
    //            value = value[1];
    //        }else{
    //            value = value.map(item => this.parseValue(item));
    //        }
    //    }else if(think.isBoolean(value)){
    //        value = value ? 'TRUE' : 'FALSE';
    //    }else if (value === null) {
    //        value = 'null';
    //    }
    //    return value;
    //};
    //
    ///**
    // * data: {c_id:0,c_name:'testName', ...}
    // * table: 表名
    // */
    //getInsertSql = function(data, table){
    //    let values = [];
    //    let fields = [];
    //    for(let key in data){
    //        if(/^c_\w+/.test(key) && key !='c_id') {
    //            let val = data[key];
    //            val = this.parseValue(val);
    //            values.push(val);
    //            fields.push(key);
    //        }
    //    }
    //    let sql =  'INSERT INTO ' + table + ' (' + fields.join(',') + ')';
    //    sql += ' VALUES (' + values.join(',') + ')';
    //    return sql;
    //};
    //
    //getUpdateSql = function(data, table){
    //    let sql ='';
    //    if(data.c_id >0) {
    //        let fields = [];
    //        for (let key in data) {
    //            if (/^c_\w+/.test(key) && key != 'c_id') {
    //                let val = data[key];
    //                val = this.parseValue(val);
    //                fields.push(key + '=' + val);
    //            }
    //        }
    //        sql = 'UPDATE ' + table +' SET '+ fields.join(',') +' WHERE c_id='+data.c_id;
    //    }
    //    return sql;
    //};

}