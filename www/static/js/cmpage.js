
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
                url:  "/flow/task/start?proc_id=" + procID,
                dataType: "json",
                success: function(ret) {
                    if(ret.statusCode == 200){
                        //根据任务的当前状态分别处理
                        var task = ret.task;
                        if(task.c_status === global.enumTaskStatus.RUN){
                            if(task.currAct){
                                //根据当前节点的状态分别处理
                                if(task.currTaskAct.c_status === global.enumTaskActStatus.WAIT){
                                    //根据设定弹出相关界面
                                    if(task.currAct.form.url){
                                        if(task.currAct.form.opentype ==='dialog'){
                                            BJUI.dialog(task.currAct.form);
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

function fwTerminate(procID) {
    BJUI.alertmsg("confirm", "是否确定要终止本次流程？", {
        okCall: function () {
            $.ajax({
                url:  "/flow/task/terminate?proc_id=" + procID,
                dataType: "json",
                success: function(ret) {
                    if(ret.statusCode == 200){
                        BJUI.alertmsg(ret.message);
                    }
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
