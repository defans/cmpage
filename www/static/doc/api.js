YUI.add("yuidoc-meta", function(Y) {
   Y.YUIDoc = { meta: {
    "classes": [
        "admin.controller.base",
        "admin.controller.code",
        "admin.controller.index",
        "admin.controller.mob",
        "admin.service.code",
        "admin.service.code_list",
        "admin.service.code_lookup",
        "admin.service.groupuser",
        "admin.service.groupuser_add",
        "admin.service.log",
        "admin.service.login",
        "admin.service.privilege",
        "admin.service.teamuser",
        "admin.service.teamuser_add",
        "admin.service.user",
        "cmpage.cmpage_global",
        "cmpage.cmpage_global_flow",
        "cmpage.controller.base",
        "cmpage.controller.mob",
        "cmpage.controller.module",
        "cmpage.controller.page",
        "cmpage.controller.utils",
        "cmpage.logic.page",
        "cmpage.service.appr",
        "cmpage.service.area",
        "cmpage.service.base",
        "cmpage.service.file_list",
        "cmpage.service.page",
        "cmpage.service.page_excel",
        "cmpage.service.page_lookup",
        "cmpage.service.page_mob",
        "cmpage.service.utils",
        "flow.controller.act",
        "flow.controller.base",
        "flow.controller.proc",
        "flow.controller.task",
        "flow.controller.task_act",
        "flow.model.act",
        "flow.model.act_path",
        "flow.model.proc",
        "flow.model.proc_assign",
        "flow.model.task",
        "flow.model.task_act",
        "flow.model.task_act_appr"
    ],
    "modules": [
        "admin.controller",
        "admin.service",
        "cmpage.controller",
        "cmpage.logic",
        "cmpage.service",
        "demo.model",
        "flow.controller",
        "flow.model"
    ],
    "allModules": [
        {
            "displayName": "admin.controller",
            "name": "admin.controller",
            "description": "用户及权限系统的controller模块，实现了对外的URL接口，包括PC端和移动端\n\n 注意点 :\n 1. base.js继承自 think.controller.base;\n 2. 其他controller 继承自 base.js;\n 3. 移动端APP的菜单是单独设置的，要单独配置各个角色和用户的权限；\n 4. 移动端和PC端的版本是分开设置的;",
            "classes": [
                {
                    "name": "admin.controller.base"
                },
                {
                    "name": "admin.controller.code"
                },
                {
                    "name": "admin.controller.index"
                },
                {
                    "name": "admin.controller.mob"
                }
            ]
        },
        {
            "displayName": "admin.service",
            "name": "admin.service",
            "description": "用户及权限系统模块的model部分，实现了实现了相关的数据操作和逻辑处理\n\n注意点 :\n1. 用户界面显示的类继承自cmpage/page;\n2. 树形结构的参数设置统一存放于t_code表中；\n3. 账套用户和团队用户的设置相仿，逻辑相似；",
            "classes": [
                {
                    "name": "admin.service.code"
                },
                {
                    "name": "admin.service.code_list"
                },
                {
                    "name": "admin.service.code_lookup"
                },
                {
                    "name": "admin.service.groupuser"
                },
                {
                    "name": "admin.service.groupuser_add"
                },
                {
                    "name": "admin.service.log"
                },
                {
                    "name": "admin.service.login"
                },
                {
                    "name": "admin.service.privilege"
                },
                {
                    "name": "admin.service.teamuser"
                },
                {
                    "name": "admin.service.teamuser_add"
                },
                {
                    "name": "admin.service.user"
                }
            ]
        },
        {
            "displayName": "cmpage.controller",
            "name": "cmpage.controller",
            "description": "业务模块配置和展示系统的controller模块，实现了对外的URL接口，包括PC端和移动端\n\n注意点 :\n1. base.js继承自 think.controller.base;\n2. 其他controller 继承自 base.js;\n3. 具体的业务模块可以继承并扩展 cmpage/model/page.js 来实现业务逻辑\n4. 移动端、主从页、查找带回等页面都是从 cmpage/model/page.js 继承，具体的业务模块请适当选择基类\n5. 使用cmpage的页面统一从 controller/page.js 提供URL接口调用，也可继承并重写相应方法来增加逻辑（但一般从model/page.js继承即可）",
            "classes": [
                {
                    "name": "cmpage.controller.base"
                },
                {
                    "name": "cmpage.controller.mob"
                },
                {
                    "name": "cmpage.controller.module"
                },
                {
                    "name": "cmpage.controller.page"
                },
                {
                    "name": "cmpage.controller.utils"
                }
            ]
        },
        {
            "displayName": "cmpage.logic",
            "name": "cmpage.logic",
            "description": "业务模块配置和展示系统的logic，实现了对前端传入的参数校验\n\n注意点 :\n1. 校验的错误提示已改为中文，配置在 common/config/zh-cn.js\n2. 一般不实现业务逻辑\n3. 由于cmpage的模块都是统一的URL接口，因此都可以按配置实现校验",
            "classes": [
                {
                    "name": "cmpage.logic.page"
                }
            ]
        },
        {
            "displayName": "cmpage.service",
            "name": "cmpage.service",
            "classes": [
                {
                    "name": "cmpage.service.area"
                },
                {
                    "name": "cmpage.service.base"
                },
                {
                    "name": "cmpage.service.file_list"
                },
                {
                    "name": "cmpage.service.page"
                },
                {
                    "name": "cmpage.service.page_excel"
                },
                {
                    "name": "cmpage.service.page_lookup"
                },
                {
                    "name": "cmpage.service.page_mob"
                },
                {
                    "name": "cmpage.service.utils"
                },
                {
                    "name": "cmpage.cmpage_global"
                },
                {
                    "name": "cmpage.cmpage_global_flow"
                }
            ]
        },
        {
            "displayName": "demo.model",
            "name": "demo.model",
            "description": "几种典型的业务模块演示，包括普通页面、主从页面、各种编辑类型、按钮调用方式及工作流的调用等",
            "classes": [
                {
                    "name": "flow.model.proc_assign"
                },
                {
                    "name": "cmpage.service.appr"
                },
                {
                    "name": "flow.model.proc"
                },
                {
                    "name": "flow.model.task"
                },
                {
                    "name": "flow.model.task_act"
                },
                {
                    "name": "flow.model.task_act_appr"
                }
            ]
        },
        {
            "displayName": "flow.controller",
            "name": "flow.controller",
            "description": "流程模板配置和引擎调用接口的controller模块，实现了对外的URL接口，包括PC端和移动端\n\n注意点 :\n1. base.js继承自 think.controller.base;\n2. 其他controller 继承自 base.js;\n3. 具体的业务模块可以继承并扩展 flow/model/act.js 来实现增加标准以外的逻辑\n4. 可以根据具体的业务模块选择适当基类，例如审核类:flow/model/act_appr.js\n5. 使用flow的页面统一从 controller/act.js, proc.js 提供的URL接口调用，也可继承并重写相应方法来增加逻辑（但一般从model/act.js, proc.js继承即可）",
            "classes": [
                {
                    "name": "flow.controller.act"
                },
                {
                    "name": "flow.controller.base"
                },
                {
                    "name": "flow.controller.proc"
                },
                {
                    "name": "flow.controller.task"
                },
                {
                    "name": "flow.controller.task_act"
                }
            ]
        },
        {
            "displayName": "flow.model",
            "name": "flow.model",
            "description": "流程模板配置和引擎调用接口的逻辑实现类\n\n注意点 :\n1. 工作流方法调用统一归口到proc.js 和 act.js ;\n2. 根据流程模板设置的实现类，proc.js 和 act.js 会调用该类\n3. 具体的业务逻辑实现类可以继承并扩展 task.js 和 task_act.js等 来实现增加标准以外的业务逻辑\n4. 可以根据具体的业务模块选择适当基类，例如审核类:flow/model/task_act_appr.js\n5. 原则上：业务无关的流程控制逻辑放于 proc.js 和 act.js ，业务相关的流程控制放于task_xxx.js 中",
            "classes": [
                {
                    "name": "flow.model.act"
                },
                {
                    "name": "flow.model.act_path"
                }
            ]
        }
    ]
} };
});