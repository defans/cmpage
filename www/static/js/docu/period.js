function period_calc(){  
    $(this).alertmsg("confirm", "是否确定要重新核算当前库存以及进价？",{
        okCall:function(){                
            BJUI.ajax('ajaxform', {
                url: "/docu/period/period_calc",
                form: $('#editPeriodForm'),
                validate: true,
                loadingmask: true,
                okCallback: function (json, options) {
                    var rec = json.data;
                    BJUI.navtab('reload', {
                        url: '/cmpage/page/edit_ms?modulename=Period&c_id=' + rec.id, type:"GET"
                    });
                }
            });
        }
    });

    return false;   
} 

//结束某个期次的库存核算，通过动态调用后端方法进行
//@parm isClose     1:完成结转，0：重写核算
function period_finish(periodID,isClose){  
    $(this).alertmsg("confirm", "是否确定要结束该仓库的库存结转？",{
        okCall:function(){                
            $.ajax({
                type: "GET",
                url: "/cmpage/utils/callFunction",
                data: "modulename=Period&fn=periodFinish&parms="+ periodID+","+isClose, // 序列化参数，以FORM形式传到后端
                async: false,
                success: function (ret) {
                   // var ret =eval("("+data+")")
                    $(this).alertmsg(ret.statusCode=="200" ? "info":"error",ret.message);
                    if(ret.statusCode=="200")
                    {
                        BJUI.navtab('reload', { 
                            url:"/cmpage/page/edit_ms?modulename=Period&c_id="+periodID, type:"GET"
                        });   
                    }            
                }
            }); 
        }
    });

    return false;   
} 


//进行关账或者反关账操作
//@parm isClose     1:关账，0：反关账
function period_close(isClose){
    $(this).alertmsg("confirm", "是否确定要进行该操作？", {
        okCall: function () {
            $.ajax({
                type: "GET",
                url: "/cmpage/utils/callFunction",
                data: "modulename=Period&fn=periodClose&parms="+isClose, // 序列化参数，以FORM形式传到后端
                async: false,
                success: function (ret) {
                    //var ret = eval("(" + data + ")")
                    $(this).alertmsg(ret.statusCode == "200" ? "info" : "error", ret.message);
                    if (ret.statusCode == "200") {
                        $("#btnSearchPeriod").click();
                    }
                }
            });
        }
    });

    return false;   
}  

