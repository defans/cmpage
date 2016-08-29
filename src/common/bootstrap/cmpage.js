'use strict';
/**
 * model
 */

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

    /***************************对象处理 **************************************/
    //取对象的所有属性描述
    getOwnPropertyDescriptors = function(obj) {
        let result = {};
        for (let key of Reflect.ownKeys(obj)) {
            result[key] = Object.getOwnPropertyDescriptor(obj, key);
        }
        return result;
    };

    //拷贝对象的某些属性到另一个对象
    objPropertysFromOtherObj = function(toObj, fromObj, arrProps){
        let ret = {};
        Object.assign(ret,toObj);
        for(let key of arrProps){
            ret[key] = fromObj[key];
        }
        return ret;
    }

    /***************************其他的全局方法 **************************************/
    debug = (msg)=>{
        if(think.env === 'development')
            console.log(think.isObject(msg) ? JSON.stringify(msg).replace(/\"/g,'').replace(/\\/g,'').replace(/,/g,',  ') : msg);
    };
    log = (msg)=>{
        console.log(msg);
    };

    /******************************时间格式化输出 **********已经废弃 用 think.datetime() ************************************************/
    //datetime = (format,date) => {
    //    if(think.isEmpty(format)){
    //        format = 'YYYY-MM-DD';
    //    }
    //    if(think.isEmpty(date)){
    //        return moment().format(format.replace(/yyyy-MM-dd/,'YYYY-MM-DD').trim());
    //    }else{
    //        return moment(date).format(format.replace(/yyyy-MM-dd/,'YYYY-MM-DD').trim());
    //    }
    //};

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