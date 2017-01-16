module.exports = {
    //扫描的文件路径
    paths: ['src/admin/controller','src/admin/model','src/cmpage','src/flow'],
    demoDir:"",
    //文档页面输出路径
    outdir: 'www/static/doc/',
    //内置主题
    // theme:'ui',
    //自定义主题目录
    //themedir: 'theme-smart-ui/',
    //项目信息配置
    project: {
        //项目名称
        name: '',
        //项目描述，可以配置html，会生成到document主页
        description: '<h2>CmPage</h2> <p>企业信息化的NodeJS开源框架</p><p>其UI框架采用BJUI，后端采用ThinkJS，数据库采用MySql和Mssql，手机端采用MUI</p>' +
        '<br><p>本框架通过配置模块的显示列、编辑列、查询列、按钮等，可以从数据库的表或者视图取数据，生成页面，通过Url: /cmpage/page/list?modulename=User 可以访问User模块，实现了常用的分页列表、新增、编辑、查看、删除、条件查询等功能, 手机端页面功能类似</p>' +
        '<p>运行步骤简述如下（具体参照 thinkjs.org）： </p>' +
        '<p> 1、Mysql数据库备份文件（/db/cmpage_my.sql）  </p>' +
        '<p> 2、在/src/common/config/db.js 中配置数据库连接参数 </p>' +
        '<p> 3、运行：npm install --registry=https://registry.npm.taobao.org --verbose </p>' +
        '<p> 4、运行：npm start 5、手机端项目的目录：/mob，独立项目，非必需，请用HBuider打开，然后用USB连上手机就可以调试了，具体参见 http://www.dcloud.io/runtime.html, 也可以用手机扫描二维码(http://139.129.48.131:8300/admin/index/login ),安装Andriod版本的DEMO。</p>' +
        '<br>' +
        '<p> 建议二次开发之前先熟悉源代码，有更多注释，还可以打开其中的调试信息(//debug(xxx,xxx)) 看看运行时的各种返回信息' +
        '<br>',

        //版本信息
        version: '1.0.0',

        //地址信息
        url: '/static/doc/index.html',

        //导航信息
        navs: [{
            name: "首页",
            url: "/home/index/index"
        }, {
            name: "文档",
            url: "/static/doc/index.html"
        }, {
            name: "演示",
            url: "/admin/index/index"
        }, {
            name: "日志",
            url: "/home/index/log"
        }]
    },
    //demo页面需要加载的js库
    demo: {
        paths : [],
        link : []
    }
};
