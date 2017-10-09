/**
 * this file will be loaded before server started
 * you can define global functions used in controllers, models, templates
 * 定义了全局对象 cmpage， 把框架用到的参数设置和公共方法放入其中，统一用 cmpage.xxx 来调用
 */
global.cmpage = {};


// 以下是浮点数运算，一般用于解决数值比较的时候或者大的循环中由于精度所产生的问题
// 加法
Number.prototype.add = function(arg){
    var r1,r2,m;
    try{r1=this.toString().split(".")[1].length}catch(e){r1=0}
    try{r2=arg.toString().split(".")[1].length}catch(e){r2=0}
    m=Math.pow(10,Math.max(r1,r2))
    return (this*m+arg*m)/m
};

//减法
Number.prototype.sub = function (arg){
    return this.add(-arg);
};

//乘法
Number.prototype.mul = function (arg)
{
    var m=0,s1=this.toString(),s2=arg.toString();
    try{m+=s1.split(".")[1].length}catch(e){}
    try{m+=s2.split(".")[1].length}catch(e){}
    return Number(s1.replace(".",""))*Number(s2.replace(".",""))/Math.pow(10,m)
};

//除法
Number.prototype.div = function (arg){
    var t1=0,t2=0,r1,r2;
    try{t1=this.toString().split(".")[1].length}catch(e){}
    try{t2=arg.toString().split(".")[1].length}catch(e){}
        r1=Number(this.toString().replace(".",""))
        r2=Number(arg.toString().replace(".",""))
        return (r1/r2)*pow(10,t2-t1);
};
