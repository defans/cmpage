用Node.js重写的通用页面框架，原框架采用ASP.NET MVC。:smile: 
既然是开源嘛，自然都是采用开源的东西，其中UI框架还是采用的BJUI(http://b-jui.com/)，后端采用ThinkJS，数据库采用MySql，手机端采用MUI
本框架通过配置模块的显示列、编辑列、查询列、按钮等，可以从数据库的表或者视图取数据，生成页面，通过Url: /cmpage/page/list?modulename=User 可以访问User模块，实现了常用的分页列表、新增、编辑、查看、删除、条件查询等功能, 手机端页面功能类似

运行步骤简述如下（具体参照 thinkjs.org）：<br>
1、Mysql数据库备份文件（/db/cmpage_my.sql）<br>
2、在/src/common/config/db.js 中配置数据库连接参数<br>
3、运行：npm install --registry=https://registry.npm.taobao.org --verbose <br>
4、运行：npm start <br>
5、手机端项目的目录：/mob，独立项目，非必需，请用HBuider打开，然后用USB连上手机就可以调试了，具体参见 http://www.dcloud.io/runtime.html, 也可以用手机扫描二维码(http://139.129.48.131:8300/admin/login),安装Andriod版本的DEMO。
<br><br>
演示地址： http://139.129.48.131:8300/admin <br>
更新日志： http://139.129.48.131:8300/home/index/log <br>
<br><br>
![输入图片说明](http://git.oschina.net/uploads/images/2016/0407/171503_033281df_389947.png "模块列表")
-------------------------------------------------------------------------------------------------
![输入图片说明](http://git.oschina.net/uploads/images/2016/0407/171611_18aa7d89_389947.png "模块的显示列设置")
-------------------------------------------------------------------------------------------------
![输入图片说明](http://git.oschina.net/uploads/images/2016/0407/171717_a3be3142_389947.png "模块预览页面")

-------------------------------------------------------------------------------------------------

![输入图片说明](http://git.oschina.net/uploads/images/2016/0829/092044_88f3bf65_389947.png "手机端列表和编辑")
-------------------------------------------------------------------------------------------------
![输入图片说明](http://git.oschina.net/uploads/images/2016/0829/092112_4b930ea8_389947.png "手机端菜单和搜索")
