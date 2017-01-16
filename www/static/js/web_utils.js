/////////////////////////////FORM相关--BEGIN////////////////////////////////

//从FORM中的INPUT的值生成JSON对象
function formGetInputValue(form,prefix){
	var obj ='{';
	var len = prefix.length;

	$.each(form.serializeArray(),function(i,n){
		if(prefix =='' || n.name.substr(0,len) == prefix){
			obj += '"'+n.name.substring(len)+'":"' + n.value + '",';
		}
	});
    obj =obj.substr(0,obj.length -1) +'}';
    //console.log(obj);
    return $.parseJSON(obj);
}

//从JSON对象中取值，赋值给FORM中的INPUT
function formSetInputValue(obj){
	$('form input,select,textarea').each(function(i,n){
    	for (var it in obj) {
    		if($(n).attr('name') == it){
    			$(n).val(obj[it]);
    		}
    	}
    });
}
jQuery.download = function (url, data, method) {
// 获取url和data
    if (url && data) {
        // data 是 string 或者 array/object
        data = typeof data == 'string' ? data : jQuery.param(data);
        // 把参数组装成 form的  input
        var inputs = '';
        jQuery.each(data.split('&'), function () {
            var pair = this.split('=');
            inputs += '<input type="hidden" name="' + pair[0] + '" value="' + pair[1] + '" />';
        });
        // request发送请求
        jQuery('<form action="' + url + '" method="' + (method || 'post') + '">' + inputs + '</form>')
            .appendTo('body').submit().remove();
    };
};
/////////////////////////////FORM相关--END////////////////////////////////

/////////////////////////////JSON相关--BEGIN////////////////////////////////

//克隆JS对象
function clone (jsonObj)
{
    var buf;
    if (jsonObj instanceof Array) {
        buf = [];
        var i = jsonObj.length;
        while (i--) {
            buf[i] = arguments.callee(jsonObj[i]);
        }
        return buf;
    }else if (typeof jsonObj == "function"){
        return jsonObj;
    }else if (jsonObj instanceof Object){
        buf = {};
        for (var k in jsonObj) {
            buf[k] = arguments.callee(jsonObj[k]);
        }
        return buf;
    }else{
        return jsonObj;
    }
}

//遍历json对象生成用于post提交的url字串
function json2PostData(obj) {
    var s = ""
    for (var itm in obj) {
        if (obj[itm] instanceof Array == true) {
            //是数组
            s += "&" + itm + "_count=" + obj[itm].length
            for (var i = 0; i < obj[itm].length; i++) {
                if (obj[itm][i] instanceof Array == true) {
                    s += ergodicJson2(obj[itm][i]);
                } else if (obj[itm][i] instanceof Object == true) {
                    s += ergodicJson2(obj[itm][i]);
                } else {
                    s += "&" + encodeURI(obj[itm][i]) + "=" + encodeURI(obj[itm][i]);
                }
            }
        } else if (obj[itm] instanceof Object == true) {
            //是json对象。
            s += json2PostData(obj[itm]);
        }
        else {
            //是简单数值
            s += "&" + encodeURI(itm) + "=" + encodeURI(obj[itm]);
        }
    }
    //从位置1开始返回字符串
    return s.substring(1);
}
/////////////////////////////JSON相关--END////////////////////////////////



function testIntNum(obj) //整型
{
    obj.value = obj.value.replace(/[^\d]/g, "");
    obj.value = obj.value.replace(/^\./g, "");
    obj.value = obj.value.replace(/\.{2,}/g, ".");
    obj.value = obj.value.replace(".", "$#$").replace(/\./g, "").replace("$#$", ".");
    if (obj.value == "") {
        obj.value = "0";
    }
}

function testNum(obj)//数字
{
    obj.value = obj.value.replace(/[^\d.]/g, "");
    //    obj.value = obj.value.replace(/^\./g,"");
    //    obj.value = obj.value.replace(/\.{2,}/g,".");
    obj.value = obj.value.replace(".", "$#$").replace(/\./g, "").replace("$#$", ".");
    if (obj.value == "")
        obj.value = "0";
    if (obj.value == "0")
        obj.select();
    //    obj.value=Number(obj.value);
}
