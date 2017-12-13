/////////////////////////////工作流相关页面操作////////////////////////////////
function fwStart(procID) {
    BJUI.alertmsg("confirm", "是否确定要启动该模板的一个新的实例？", {
        okCall: function () {
            $.ajax({
                url: "/flow/task/start?procID=" + procID,
                dataType: "json",
                success: function (ret) {
                    if (ret.statusCode == 200) {
                        //根据任务的当前状态分别处理
                        var currAct = ret.currAct;
                        if (ret.task.c_status === cmpage.enumTaskStatus.RUN) {
                            if (currAct.form) {
                                //根据当前节点的状态分别处理
                                if (ret.currTaskAct.c_status === cmpage.enumTaskActStatus.WAIT) {
                                    //根据设定弹出相关界面
                                    if (currAct.form.url) {
                                        if (currAct.form.opentype === 'dialog') {
                                            BJUI.dialog(currAct.form);
                                        } else {}
                                    }
                                } else {
                                    BJUI.alertmsg(ret.message);
                                }
                            } else {
                                BJUI.alertmsg('该流程当前没有节点需要您的处理！');
                            }
                        } else {
                            BJUI.alertmsg(ret.message);
                        }
                    }
                }
            });
        }
    });

    return false;
}

function fwRunAct(taskActID, isPass, modulename) {
    BJUI.alertmsg("confirm", "是否确定要继续运行本次操作？", {
        okCall: function () {
            BJUI.ajax('doajax', {
                url: "/flow/task_act/run?taskActID=" + taskActID + (isPass ? '&isPass=true' : ''),
                okCallback: function (json, options) {
                    BJUI.alertmsg(json.message);
                    if (json.statusCode == 200) {
                        pageRefresh(modulename);
                        BJUI.dialog('closeCurrent');
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
                url: "/flow/task_act/terminate?taskActID=" + taskActID,
                okCallback: function (json, options) {
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
                url: "/flow/task_act/suspend?taskActID=" + taskActID,
                okCallback: function (json, options) {
                    BJUI.alertmsg(json.message);
                }
            });
        }
    });
    return false;
}

function fwTerminate(taskID, modulename) {
    BJUI.alertmsg("confirm", "是否确定要终止本次流程？", {
        okCall: function () {
            BJUI.ajax('doajax', {
                url: "/flow/task/terminate?taskID=" + taskID,
                okCallback: function (json, options) {
                    BJUI.alertmsg(json.message);
                    if (json.statusCode == 200) pageRefresh(modulename);
                }
            });
        }
    });
    return false;
}

function fwSuspend(taskID, modulename) {
    BJUI.alertmsg("confirm", "是否确定要挂起本次流程？", {
        okCall: function () {
            BJUI.ajax('doajax', {
                url: "/flow/task/suspend?taskID=" + taskID,
                okCallback: function (json, options) {
                    BJUI.alertmsg(json.message);
                    if (json.statusCode == 200) pageRefresh(modulename);
                }
            });
        }
    });
    return false;
}

function fwRun(taskID, modulename) {
    BJUI.alertmsg("confirm", "是否确定要继续运行本次流程？", {
        okCall: function () {
            BJUI.ajax('doajax', {
                url: "/flow/task/run?taskID=" + taskID,
                okCallback: function (json, options) {
                    BJUI.alertmsg(json.message);
                    if (json.statusCode == 200) pageRefresh(modulename);
                }
            });
        }
    });
    return false;
}

/*刷新流程模板的缓存*/
function fwClearCache() {
    BJUI.ajax('doajax', {
        url: '/flow/proc/clear_cache',
        okCallback: function (json, options) {
            BJUI.alertmsg(json.message);
        }
    });
    return false;
}

//流程节点指派的关联方类型变化时触发，onChange
function actAssignChangeLink(obj, modulename) {
    var linkType = $(obj).val();
    var dataUrl = '';
    if (linkType == cmpage.enumActAssignType.DEPT) {
        dataUrl = '/admin/code/code_lookup?rootid=5&multiselect=false';
    } else if (linkType == cmpage.enumActAssignType.ROLE) {
        dataUrl = '/cmpage/page/lookup?modulename=CodeLookup&c_pid=3&multiselect=false';
    } else if (linkType == cmpage.enumActAssignType.TEAM) {
        dataUrl = '/cmpage/page/lookup?modulename=CodeLookup&c_pid=7&multiselect=false';
    } else if (linkType == cmpage.enumActAssignType.USER) {
        dataUrl = '/cmpage/page/lookup?modulename=UserLookup&multiselect=false';
    }
    $("#field" + modulename + "link_name").html('');
    if (dataUrl == '') {
        $("#field" + modulename + "link_name").html('<input id="FwActAssignlink_name" name="link_name" type="text" size="20" value=""  readonly="readonly" class="form-control" style="padding-right: 15px;">');
    } else {
        $("#field" + modulename + "link_name").html('<input id="FwActAssignlink_name" name="link_name" type="lookup" size="15" value="" data-width="800" data-height="600" ' +
            'data-toggle="lookup" data-title="执行者 选择" data-url=' + dataUrl + ' readonly="readonly" class="form-control" style="padding-right: 15px;">');
    }
    $("#field" + modulename + "link_name").initui();
    $("#field" + modulename + "c_link").val(0);

}

/////////////////////////////业务相关的全局变量--BEGIN////尽量保持和后端一致////////////////////////////

cmpage.enumTaskStatus = {
    INIT: 1,
    INIT_name: '初始化',
    RUN: 2,
    RUN_name: '运行中',
    SUSPEND: 3,
    SUSPEND_name: '挂起',
    TERMINATE: 4,
    TERMINATE_name: '终止',
    END: 9,
    END_name: '完成'
};
cmpage.enumTaskActStatus = {
    NO_BEGIN: 1,
    NO_BEGIN_name: '未开始',
    INIT: 2,
    INIT_name: '初始化',
    WAIT: 3,
    WAIT_name: '等待中',
    RUN: 4,
    RUN_name: '运行中',
    SUSPEND: 5,
    SUSPEND_name: '挂起',
    PENDING: 6,
    PENDING_name: '汇聚中',
    TERMINATE: 7,
    TERMINATE_name: '终止',
    END: 9,
    END_name: '完成'
};
cmpage.enumProcAssignType = {
    ALL: 1,
    ALL_name: '所有人',
    DEPT: 2,
    DEPT_name: '部门',
    ROLE: 3,
    ROLE_name: '角色',
    TEAM: 4,
    TEAM_name: '团队',
    USER: 5,
    USER_name: '用户',
    SELF: 6,
    SELF_name: '发起人',
    DEFINE: 9,
    DEFINE_name: '自定义'
};
cmpage.enumActAssignType = {
    DEPT: 2,
    DEPT_name: '部门',
    ROLE: 3,
    ROLE_name: '角色',
    TEAM: 4,
    TEAM_name: '团队',
    USER: 5,
    USER_name: '用户',
    SELF: 6,
    SELF_name: '发起人',
    PREV: 7,
    PREV_name: '同上一步',
    DEFINE: 9,
    DEFINE_name: '自定义'
};

/////////////////////////////业务相关的全局变量--END////////////////////////////////