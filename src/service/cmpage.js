'use strict';

/**
 @module cmpage.service
 */
``
/**
 * 由原先的全局方式，转成基类成员的方式来引用，这样 vscode 可以有智能提示
 * cmpage的全局方法和常量设置，在基类中引入，通过 this.cmpage.xxxx 来访问
 */

/**
 * 取对象的所有属性描述
 * @method  getOwnPropertyDescriptors
 * @param   {object} obj 对象
 */
exports.getOwnPropertyDescriptors = function(obj) {
    let result = {};
    for (let key of Reflect.ownKeys(obj)) {
        result[key] = Object.getOwnPropertyDescriptor(obj, key);
    }
    return result;
};

/**
 * 用对象的属性值，替换字符串中的相应设置 <br/>
 * 一般用于 某数据表记录的字段替换 事先设置的子字符串，子字符串的格式如：#id#
 * @method  objPropertysReplaceToStr
 * @return  {string}  替换后的字符串
 * @param   {string} str 源字符串
 * @param   {object} obj 源对象
 */
    exports.objPropertysReplaceToStr = function(str, obj){
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
    exports.objPropertysFromOtherObj = function(toObj, fromObj, arrProps){
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
     * @param   {string} defaultString 当返回值为空时，返回此默认值
     */
    var objToString = function(obj, defaultString){
        let ret = [];
        if(think.isObject(obj)) {
            for (let key in obj) {
                if (think.isDate(obj[key])) {
                    ret.push(`${key}:'${think.datetime(obj[key])}'`);
                } else if (think.isString(obj[key])) {
                    ret.push(`${key}:'${obj[key]}'`);
                } else if (think.isObject(obj[key])) {
                    ret.push(`${key}:${ objToString(obj[key]) }`);
                } else if (think.isArray(obj[key])) {
                    let tmp = [];
                    for (let item of obj[key]) {
                        tmp.push(objToString(item));
                    }
                    ret.push(`${key}:[${tmp.join(',')}]`);
                } else {
                    ret.push(`${key}:${obj[key]}`);
                }
            }
            if(ret.length ===0){
                return defaultString || '{}';
            }else {
                return "{" + ret.join(', ') + "}";                
            }
        }else if(think.isArray(obj)){
            let tmp = [];
            for (let item of obj) {
                tmp.push(objToString(item));
            }
            if(tmp.length ===0){
                return defaultString || '[]';
            }else {
                return `[${tmp.join(',')}]`;
            }
        }else{
            return String(obj) || defaultString || '';
        }
    };
    exports.objToString = objToString;

    /**
     * 把字符串转换成对象，一般该字符串是从 cmpage.objToString(obj) 转换而来 <br/>
     * @method  objFromString
     * @return   {object}  目标对象
     * @param  {string}  str 序列化后的字符串
     */
    var objFromString = function(str){
        //cmpage.debug(str,'cmpage_global.objFromString - str');
        if(think.isEmpty(str) || str.indexOf('{') !== 0)    return {};
        return eval("("+ str +")");
    };
    exports.objFromString = objFromString;
    /**
     * 把字符串转换成数组对象，其元素是对象，一般该元素是从 cmpage.objToString(obj) 转换而来 <br/>
     * @method  arrFromString
     * @return   {Array}  JSON对象数组
     * @param  {string}  str 序列化后的字符串
     */
    exports.arrFromString = function(str){
        let arr = [];
        let obj = think.isEmpty(str) ? {} : objFromString(str);
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
     * @method  subArray
     * @return   {Array}  JSON对象数组
     * @param   {Array}  来源数组
     * @param  {object}  where 条件对象
     */
    exports.subArray = function(arr,where){
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
    exports.arrGetValuesByColumnName = function(arr,columnName){
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
    exports.strGetValuesByPropertyName = function(obj,propertyNames,joinStr){
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
    exports.arrGetUnique = function(arr){
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
    exports.checksql = (obj) =>{
        for (let key of Reflect.ownKeys(obj)) {
            let val =obj[key];
            if(think.isBoolean(val) ){
                obj[key] = val ? 1: 0;
            }
        }
        return obj;
    };

    /***************************其他的全局方法 **************************************/
    exports.debug = (msg,desc)=>{
        if(think.env === 'development'){
            //let message = think.isObject(msg) ? JSON.stringify(msg).replace(/"/g,'').replace(/\\/g,'').replace(/,/g,',  ') : msg;
            let message = objToString(msg);
            think.logger.debug((!think.isEmpty(desc) ? '['+desc+'] --> ':'[CMPAGE] ') + message);
            // think.logger.debug(message, think.isEmpty(desc) ? ' CMPAGE ':desc);
        }
    };
    exports.warn = (msg,desc)=>{
        let message = objToString(msg);
        think.logger.warn((!think.isEmpty(desc) ? '['+desc+'] --> ':'[CMPAGE] ') + message);
    };

    /**
     * 从URL字符串中解析出参数对象
     * @method  parmsFromUrl
     * @return  {object}  url参数对象
     * @param   {string} url URL字符串
     */
    exports.parmsFromUrl = (url)=>{
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
    exports.error = (msg,data) =>{
        //TODO: 可以考虑增加统一的错误处理逻辑
        let ret ={statusCode:300, message:msg, data:data};
        debug(ret,'ERROR');
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
    exports.service = (path,  defaultPath) =>{
        defaultPath = think.isEmpty(defaultPath) ? 'cmpage/page':defaultPath;
        path = think.isEmpty(path) ? defaultPath : path;
        //console.log(path);
        return think.service(path);
        // let ps = path.split('/');
        // if(ps.length >1){
        //     return think.service(ps[1], ps[0]);
        // }else{
        //     return think.service(path);
        // }
    };

    /**
     * 时间格式化输出
     * @method  model
     * @return  {string}  格式化输出
     * @param   {object} date 需要格式化的日期对象
     * @param   {string} format 格式： 如： yyyy-MM-dd HH:mm:ss
     */
    exports.datetime = (date,format) => {
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
    exports.enumStatusExecute = {
        SUCCESS:1, SUCCESS_name:'执行成功',
        FAIL:2, FAIL_name:'执行失败',
        ERROR:3, ERROR_name:'执行错误'
    };

    exports.enumLogType = {
        ADD:1, ADD_name:'新增',
        UPDATE:2, UPDATE_name:'修改'
    };

    exports.ui = {
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
    exports._format = function(pattern,num,z){
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
    exports._formatNumber = function(numChar,pattern){
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
    exports.formatNumber = function(num,opt){
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
    exports.getRandomNum = function(Min,Max)
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
    exports.filterSensitiveString = function(str)
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
    exports.isImageFile = function(filename)
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

    exports.sleep = function(milliSecond) {          
        var startTime = new Date().getTime();                  
        while(new Date().getTime() <= milliSecond + startTime) {              
        }  
     };


          //用户状态
          exports.enumUserStatus = {
            NORMAL:1,   NORMAL_name:'正常',
            NOAUDIT:2,  NOAUDIT_name:'待审核',
            FREEZE:8,   FREEZE_name:'冻结',
            DELETED:-1,  DELETED_name:'删除'
        };
    
        //  //定时任务循环类型
        //  exports.enumCrontabCycleType = {
        //     MONTH:1,   MONTH_name:'每月',
        //     DAY:2,  DAY_name:'每日',
        //     WEEK:8,   WEEK_name:'每周'
        // };
    
        //  //定时任务执行类型
        //  exports.enumCrontabExeType = {
        //     ONECE:1,   ONECE_name:'单次',
        //     CYCLE:2,  CYCLE_name:'循环'
        // };
    
         //定时任务的执行状态
         exports.enumCrontabStatus = {
            NORMAL:1,   NORMAL_name:'正常',
            SUSPEND:2,  SUSPEND_name:'挂起',
            TERMINATE:3,  TERMINATE_name:'终止'
        };
    
         //定时任务错误通知类型
         exports.enumCrontabNoteType = {
            DD:1,   DD_name:'钉钉',
            SMS:2,  SMS_name:'短信',
            ALL:3,  ALL_name:'全部'
        };
    
    
        //题型
        exports.enumQuestionWay = {
            SINGLE:1,   SINGLE_name:'单选题',
            MULTIPLE:2,  MULTIPLE_name:'多选题',
            JUDGE:3,   JUDGE_name:'判断题',
            ANSWER:4,   ANSWER_name:'问答题'
        };
        //考生考试状态
        exports.enumExamStudentStatus = {
            NODO:1,   NODO_name:'待考试',
            DONE:2,  DONE_name:'已考试',
            MARKED:3,   MARKED_name:'已阅卷',
            DELETED:-1,  DELETED_name:'删除'
        };

        exports.enumDocuType = {
            OrderApply:1, OrderApply_name:'采购申请单', OrderApply_header:'PR',
            Order:2, Order_name:'采购订单', Order_header:'PO',
            DocuArrive:3, DocuArrive_name:'到货通知单',DocuArrive_header:'DD',
            DocuCheck:4, DocuCheck_name:'外购入库单',DocuCheck_header:'GR',
            DocuSale:5, DocuSale_name:'销售出库单',DocuSale_header:'XC',
            DocuPick:6, DocuPick_name:'领料出库单',DocuPick_header:'LC',
            DocuStock:7, DocuStock_name:'盘点单',DocuStock_header:'PD',
            DocuTransfer:8, DocuTransfer_name:'调拨单',DocuTransfer_header:'DB',
            DocuBill:20, DocuBill_name:'采购单发票',DocuBill_header:'FP'
        };
        
        exports.enumOrderWay = {
            SELF:1, SELF_name:'分部自采',
            HQ:2,HQ_name:'总部采购'
        };
        

            //工作流相关参数
    exports.enumProcType = {
        NORMAL:1, NORMAL_name:'常规类型',
        APPROVE:2, APPROVE_name:'审核类型',
        STATUSCHANGE:8, STATUSCHANGE_name:'状态流转'
    };
    exports.enumProcWayCreate = {
        MAN:1, MAN_name:'手动执行',
        TRIGGER:2, TRIGGER_name:'自动触发',
        DEFINE:9, DEFINE_name:'自定义'
    };
    exports.enumProcAssignType = {
        ALL:1, ALL_name:'所有人',
        DEPT:2, DEPT_name:'部门',
        ROLE:3, ROLE_name:'角色',
        TEAM:4, TEAM_name:'团队',
        USER:5, USER_name:'用户',
        SELF:6, SELF_name:'发起人',
        DEFINE:9, DEFINE_name:'自定义'
    };
    exports.enumActType = {
        NORMAL_MAN:1, NORMAL_MAN_name:'人为参与',
        NORMAL_AUTO:2, NORMAL_AUTO_name:'自动执行',
        START:3, START_name:'开始节点',
        DUMMY:4, DUMMY_name:'哑活动',
        END:9, END_name:'结束节点'
    };
    exports.enumActFromRule = {
        ORDER:1, ORDER_name:'顺序',
        AND_JOIN:2, AND_JOIN_name:'与汇聚',
        OR_JOIN:3, OR_JOIN_name:'或汇聚',
        VOTES_JOIN:4, VOTES_JOIN_name:'投票汇聚',
        DEFINE:9, DEFINE_name:'自定义'
    };
    exports.enumActToRule = {
        ORDER:1, ORDER_name:'顺序',
        AND_SPLIT:2, AND_SPLIT_name:'与分支',
        OR_SPLIT:3, OR_SPLIT_name:'或分支',
        DEFINE:9, DEFINE_name:'自定义'
    };
    exports.enumActCcRule = {
        NO:1, NO_name:'不通知',
        MAN:2, MAN_name:'手动通知',
        AUTO:3, AUTO_name:'自动发送',
        MAN_AND_AUTO:4, MAN_AND_AUTO_name:'手动和自动',
        DEFINE:9, DEFINE_name:'自定义'
    };
    exports.enumActAssignType = {
        DEPT:2, DEPT_name:'部门',     //可以考虑加入岗位等类型
        ROLE:3, ROLE_name:'角色',
        TEAM:4, TEAM_name:'团队',
        USER:5, USER_name:'用户',
        SELF:6, SELF_name:'发起人',
        PREV:7, PREV_name:'上一步执行者',
        DEFINE:9, DEFINE_name:'自定义'
    };
    exports.enumActAssignWay = {
        ALL:1, ALL_name:'所有人',
        LEAST_WORKING_LIST:2, LEAST_WORKING_LIST_name:'最少工作量',   //任务将分配给指定群体中的工作量最少的人员，工作量的多少可以通过TO_DO_TASK_LIST的统计数据得到
        FCFA:3, FCFA_name:'先来先分配',   //（First Coming First Assigning）
        PRIORITY:4, PRIORITY_name:'优先数大者',   //基于优先数分配（c_type==ROLE），每个角色中的人员都有一个优先数，数大者得
        ROUND_ROBIN:5, ROUND_ROBIN_name:'令牌轮转',    //轮转法（c_type==ROLE），ROUND_ROBIN_TOKEN为轮转令牌，任务将分配给携有轮转令牌的人员
        SELECT:6, SELECT_name:'提供选择',   //，上一个活动的执行人来选择
        MANAGER:7, MANAGER_name:'主管'
    };
    exports.enumActAssignTypeExe = {
        EXE:1, EXE_name:'执行并无通知',
        EXE_AND_BEFORE_CC:2, EXE_AND_BEFORE_CC_name:'执行并事前通知',
        AFTER_CC:3, AFTER_CC_name:'执行并事后通知'
    };
    exports.enumTaskStatus = {
        INIT:1, INIT_name:'初始化',
        RUN:2, RUN_name:'运行中',
        SUSPEND:3, SUSPEND_name:'挂起',
        TERMINATE:4, TERMINATE_name:'终止',
        END:9, END_name:'完成'
    };
    exports.enumTaskPriority = {
        NOMAL:1, NOMAL_name:'一般',
        HIGH:2, HIGH_name:'高',
        HIGHER:3, HIGHER_name:'很高',
        HIGHEST:4, HIGHEST_name:'最高',
        LOW:5, LOW_name:'低',
        LOWER:6, LOWER_name:'很低',
        LOWEST:7, LOWEST_name:'最低'
    };
    exports.enumTaskActStatus = {
        NO_BEGIN:1, NO_BEGIN_name:'未开始',
        INIT:2, INIT_name:'初始化',
        WAIT:3, WAIT_name:'等待中',
        RUN:4, RUN_name:'运行中',
        SUSPEND:5, SUSPEND_name:'挂起',
        PENDING:6, PENDING_name:'汇聚中',
        TERMINATE:7, TERMINATE_name:'终止',
        END:9, END_name:'完成'
    };

    exports.flow = {
        autoExecuting:false
    };

        //暂时不考虑回退和跳转，如有必要，可继承task, task_act来实现具体的某一类业务流程模板
        //exports.enumActJumpRule = {
        //    NO: {id:1, c_name:'不能跳转'},
        //    FORWARD: {id:2, c_name:'向前跳转'},
        //    BACK: {id:3, c_name:'向后跳转'},
        //    ANY: {id:4, c_name:'任意跳转'},
        //    DEFINE: {id:9, c_name:'自定义'}
        //};
        //exports.enumActBackRule = {
        //    NO: {id:1, c_name:'不能回退'},
        //    PREV: {id:2, c_name:'退到上一步'},
        //    ANY: {id:4, c_name:'退到任意步'},
        //    DEFINE: {id:9, c_name:'自定义'}
        //};
