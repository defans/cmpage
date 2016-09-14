YUI.add("yuidoc-meta", function(Y) {
   Y.YUIDoc = { meta: {
    "classes": [
        "admin.controller.base",
        "admin.controller.code",
        "admin.controller.index",
        "admin.controller.mob",
        "admin.model.code",
        "admin.model.code_list",
        "admin.model.groupuser",
        "admin.model.groupuser_add",
        "admin.model.log",
        "admin.model.login",
        "admin.model.privilege",
        "admin.model.teamuser",
        "admin.model.teamuser_add",
        "admin.model.user",
        "cmpage.cmpage_global",
        "cmpage.controller.base",
        "cmpage.controller.mob",
        "cmpage.controller.module",
        "cmpage.controller.page",
        "cmpage.controller.utils",
        "cmpage.logic.page",
        "cmpage.model.area",
        "cmpage.model.page",
        "cmpage.model.page_excel",
        "cmpage.model.page_lookup",
        "cmpage.model.page_mob",
        "cmpage.model.utils"
    ],
    "modules": [
        "admin.controller",
        "admin.model",
        "cmpage.controller",
        "cmpage.logic",
        "cmpage.model"
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
            "displayName": "admin.model",
            "name": "admin.model",
            "description": "用户及权限系统模块的model部分，实现了实现了相关的数据操作和逻辑处理\n\n注意点 :\n1. 用户界面显示的类继承自cmpage/page;\n2. 树形结构的参数设置统一存放于t_code表中；\n3. 账套用户和团队用户的设置相仿，逻辑相似；",
            "classes": [
                {
                    "name": "admin.model.code"
                },
                {
                    "name": "admin.model.code_list"
                },
                {
                    "name": "admin.model.groupuser"
                },
                {
                    "name": "admin.model.groupuser_add"
                },
                {
                    "name": "admin.model.log"
                },
                {
                    "name": "admin.model.login"
                },
                {
                    "name": "admin.model.privilege"
                },
                {
                    "name": "admin.model.teamuser"
                },
                {
                    "name": "admin.model.teamuser_add"
                },
                {
                    "name": "admin.model.user"
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
            "displayName": "cmpage.model",
            "name": "cmpage.model",
            "classes": [
                {
                    "name": "cmpage.model.area"
                },
                {
                    "name": "cmpage.model.page"
                },
                {
                    "name": "cmpage.model.page_excel"
                },
                {
                    "name": "cmpage.model.page_lookup"
                },
                {
                    "name": "cmpage.model.page_mob"
                },
                {
                    "name": "cmpage.model.utils"
                },
                {
                    "name": "cmpage.cmpage_global"
                }
            ]
        }
    ]
} };
});