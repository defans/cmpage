///////////////////////////// cmpage/page 相关的界面处理 -- BEGIN ////////////////////////////
/* cmpage/page/edit 上一条，下一条 */
function pageGotoEdit(modulename,editID){
    $.CurrentDialog.dialog('reload',{ url:"/cmpage/page/edit?modulename="+ modulename +"&id="+ editID
        +"&listIds="+ $.CurrentDialog.find('#listIds').val(), type:"GET" });
    return true;
}

/* cmpage/page/edit 工作流相关编辑界面，保存 */
function pageSaveByTask(modulename,taskActID,status){
    //var page = pageGetCurrent(obj);
    BJUI.ajax('ajaxform', {
        url: '/cmpage/page/save',
        form: $('#edit'+modulename+'Form'),
        validate: true,
        loadingmask: true,
        okCallback: function(json, options) {
            //TODO: 关闭界面或者刷新 id>0 的编辑页
            var rec =json.data;
            var url = '/cmpage/page/edit?modulename='+modulename+'&id='+rec.id +'&taskID='+rec.c_task+'&taskActID='
                +taskActID+'&status='+status +'&listIds=';
            BJUI.dialog('reload', {url:url});
        }
    });
    return true;
}

/* cmpage/page/list -- delete record */
function pageDelete(id,obj,flag) {
    var page = pageGetCurrent(obj);
    var modulename = page.find('#modulename').val();
    BJUI.alertmsg("confirm", "是否确定要删除？",{
        okCall:function(){
            BJUI.ajax('doajax', {
                url: "/cmpage/page/delete?modulename="+ modulename +"&id=" + id+"&flag=" + flag,
                loadingmask: true,
                okCallback: function(json, options) {
                    BJUI.alertmsg(json.statusCode=="200" ? "info":"error",json.message);
                    $('#btnSearch'+ modulename).click();
                }
            });
        }
    });
    return false;
}

/* cmpage/page/list export data to excel file */
function pageExportData(){
    BJUI.alertmsg("confirm", "是否确定要导出数据？",{
        okCall:function(){
            $.fileDownload('/cmpage/page/excel_export?'+$.CurrentNavtab.find('#pagerForm').serialize(), {
                failCallback: function(responseHtml, url) {
                    BJUI.alertmsg("warn", "下载文件失败！");
                }
            });
        }
    });
    return false;
}

/* cmpage/page/list refresh list data */
function pageRefresh(modulename) {
    $("#btnSearch"+modulename).click();
}

/* cmpage/page/list(lookup) -- close current navtab or dialog */
function pageClose(obj) {
    if( $(obj).closest('.navtab-panel').length){
        BJUI.navtab('closeCurrentTab');
    }else{
        BJUI.dialog('closeCurrent');
    }
}

/* cmpage/page/list 鼠标单击显示选中行 */
function pageRowSelect(id,obj){
    var page = pageGetCurrent(obj);

    var oldRowID = page.find('#idSelect').val()
    if(oldRowID != id){
        page.find('#row'+oldRowID).removeClass('selected');
    }
    page.find('#idSelect').val(id);
    page.find('#row'+id).toggleClass('selected');
}

function pageGetCurrent(obj){
    return  $(obj).closest('.navtab-panel').length ? $.CurrentNavtab : $.CurrentDialog;
}

///////////////////////////// cmpage/page 相关的界面处理 -- END ////////////////////////////

/////////////////////////////业务相关的全局变量--BEGIN////尽量保持和后端一致////////////////////////////
var global = {};

global.enumTaskStatus = {
    INIT:1, INIT_name:'初始化',
    RUN:2, RUN_name:'运行中',
    SUSPEND:3, SUSPEND_name:'挂起',
    TERMINATE:4, TERMINATE_name:'终止',
    END:9, END_name:'完成'
};
global.enumTaskActStatus = {
    NO_BEGIN:1, NO_BEGIN_name:'未开始',
    INIT:2, INIT_name:'初始化',
    WAIT:3, WAIT_name:'等待中',
    RUN:4, RUN_name:'运行中',
    SUSPEND:5, SUSPEND_name:'挂起',
    PENDING:6, PENDING_name:'汇聚中',
    TERMINATE:7, TERMINATE_name:'终止',
    END:9, END_name:'完成'
};

/////////////////////////////业务相关的全局变量--END////////////////////////////////

/////////////////////////////流程相关--BEGIN////////////////////////////////
function fwStart(procID) {
    BJUI.alertmsg("confirm", "是否确定要启动该模板的一个新的实例？", {
        okCall: function () {
            $.ajax({
                url:  "/flow/task/start?procID=" + procID,
                dataType: "json",
                success: function(ret) {
                    if(ret.statusCode == 200){
                        //根据任务的当前状态分别处理
                        var currAct = ret.currAct;
                        if(ret.task.c_status === global.enumTaskStatus.RUN){
                            if(currAct.form){
                                //根据当前节点的状态分别处理
                                if(ret.currTaskAct.c_status === global.enumTaskActStatus.WAIT){
                                    //根据设定弹出相关界面
                                    if(currAct.form.url){
                                        if(currAct.form.opentype ==='dialog'){
                                            BJUI.dialog(currAct.form);
                                        }else{
                                        }
                                    }
                                }else{
                                    BJUI.alertmsg(ret.message);
                                }
                            }else{
                                BJUI.alertmsg('该流程当前没有节点需要您的处理！');
                            }
                        }else {
                            BJUI.alertmsg(ret.message);
                        }
                    }
                }
        });
        }
    });

    return false;
}

function fwTerminateAct(taskActID) {
    BJUI.alertmsg("confirm", "是否确定要终止或取消本次操作？", {
        okCall: function () {
            BJUI.ajax('doajax', {
                url:  "/flow/task_act/terminate?taskActID=" + taskActID,
                okCallback: function(json, options) {
                    BJUI.alertmsg(json.message);
                }
            });
        }
    });
    return false;
}
function fwSuspendAct(taskActID) {
    BJUI.alertmsg("confirm", "是否确定要挂起本次操作？", {
        okCall: function () {
            BJUI.ajax('doajax', {
                url:  "/flow/task_act/suspend?taskActID=" + taskActID,
                okCallback: function(json, options) {
                    BJUI.alertmsg(json.message);
                }
            });
        }
    });
    return false;
}
function fwRunAct(taskActID,isPass,modulename) {
    BJUI.alertmsg("confirm", "是否确定要继续运行本次操作？", {
        okCall: function () {
            BJUI.ajax('doajax', {
                url:  "/flow/task_act/run?taskActID=" + taskActID+(isPass ? '&isPass=true':''),
                okCallback: function(json, options) {
                    BJUI.alertmsg(json.message);
                    if(json.statusCode == 200){
                        pageRefresh(modulename);
                        BJUI.dialog('closeCurrent');
                    }
                }
            });
        }
    });
    return false;
}

function fwTerminate(taskID) {
    BJUI.alertmsg("confirm", "是否确定要终止本次流程？", {
        okCall: function () {
            BJUI.ajax('doajax', {
                url: "/flow/task/terminate?taskID=" + taskID,
                okCallback: function(json, options) {
                    BJUI.alertmsg(json.message);
                }
            });
        }
    });
    return false;
}

function fwSuspend(taskID) {
    BJUI.alertmsg("confirm", "是否确定要挂起本次流程？", {
        okCall: function () {
            BJUI.ajax('doajax', {
                url: "/flow/task/suspend?taskID=" + taskID,
                okCallback: function(json, options) {
                    BJUI.alertmsg(json.message);
                }
            });
        }
    });
    return false;
}
function fwRun(taskID) {
    BJUI.alertmsg("confirm", "是否确定要继续运行本次流程？", {
        okCall: function () {
            BJUI.ajax('doajax', {
                url: "/flow/task/run?taskID=" + taskID,
                okCallback: function(json, options) {
                    BJUI.alertmsg(json.message);
                }
            });
        }
    });
    return false;
}

/*刷新流程模板的缓存*/
function fwClearCache(){
    BJUI.ajax('doajax', {
        url: '/flow/proc/clear_cache',
        okCallback: function(json, options) {
            BJUI.alertmsg(json.message);
        }
    });
    return false;
}
/////////////////////////////流程相关--END////////////////////////////////
