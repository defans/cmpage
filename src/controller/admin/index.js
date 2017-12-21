'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------
/**
    @module admin.controller
 */

/**
 * admin.controller的index类，提供了PC端后台管理系统的用户登录、菜单显示等URL接口
 * @class admin.controller.index
 */
const Base = require('./base.js');

module.exports = class extends Base {
    /**
     * 系统首页，加载符合权限的菜单、加载前端BJUI框架等
     * @method  index
     * @return {Promise}
     */
    async indexAction() {
        //auto render template file index_index.html
        let user = await this.session('user');
        debug(user, 'admin.C.index - index.user');
        let codeMd = await cmpage.service('admin/code').getCodeById(344); //系统版本
        let vb = {
            groupName: user.groupName || "",
            version: codeMd.c_desc,
            title: 'CmPage by defans'
        };
        user.roleName = await cmpage.service('admin/code').getNameById(user.c_role);
        vb.userName = `${user.c_name} [${user.groupName}--${user.roleName}]`;
        let menus = await cmpage.service('admin/privilege').userGetPrivilegeTree(user.id, user.c_role);

        //取主菜单
        let menuHtml = [];
        if (think.env === 'development') {
            menuHtml.push(`<li>
              <a data-toggle="navtab" style="cursor: pointer;"
                      data-options="{id:'module_setting', url:'/cmpage/module/index', title:'模块配置', external:true}">模块界面配置</a>
          </li>`);
        }
        let firstMenu = true;
        for (let menu of menus) {
            if (menu.c_type === 'N' && menu.c_pid === 1 && menu.isAllow) {
                menuHtml.push(`<li ${firstMenu ? 'class="active"':''}><a href="/admin/index/get_menu?root_id=${menu.id}" data-toggle="sidenav"
                     data-tree-options="{onClick:MainMenuClick}" data-id-key="targetid" >${menu.c_name}</a></li>`)
                firstMenu = false;
            }
        }
        vb.menuHtml = menuHtml;
        let cnt = await cmpage.service('flow/msg').getUnReadCount(user.id);
        vb.msgCount = cnt.data;

        cmpage.warn(vb);
        this.assign('vb', vb);
        return this.display();
    }
    /**
     * 用户密码修改页面，get方式显示编辑页面，post方式执行密码修改
     * @method  loginPwdEdit
     * @return {Promise}
     */
    async get_menuAction() {
        let user = await this.session('user');
        let rootID = this.get('root_id');
        let menus = await cmpage.service('admin/privilege').userGetPrivilegeTree(user.id, user.c_role, rootID);
        //debug(menus,'admin.index.getMenuAction - menus');
        let ret = [];
        let nav = [];
        for (let menu of menus) {
            if (menu.c_pid === rootID && menu.c_type === 'M' && menu.isAllow) {
                menu.external = (menu.c_object === 'Module') || (menu.c_desc.indexOf('http') == 0);
                nav.push({
                    id: `page${menu.c_object.split('.').join('')}`,
                    name: menu.c_name,
                    target: 'navtab',
                    url: menu.c_desc,
                    external: menu.external
                });
            }
        }
        if (nav.length > 0) {
            ret.push({
                name: await cmpage.service('admin/code').getNameById(rootID),
                children: nav
            });
        }
        let navs = [];
        for (let menu of menus) {
            if (menu.c_type === 'N') {
                navs.push(menu);
            }
        }
        for (let n of navs) {
            nav = [];
            for (let menu of menus) {
                if (menu.c_pid === n.id && menu.c_type === 'M' && menu.isAllow) {
                    menu.external = (menu.c_object === 'Module') || (menu.c_desc.indexOf('http') == 0);
                    nav.push({
                        id: `page${menu.c_object.split('.').join('')}`,
                        name: menu.c_name,
                        target: 'navtab',
                        url: menu.c_desc,
                        external: menu.external
                    });
                }
            }
            if (nav.length > 0) {
                ret.push({
                    name: n.c_name,
                    children: nav
                });
            }
        }

        return this.json(ret);
    }

    /**
     * 用户登录界面，get方式显示登录页面，post方式执行用户登录，如果成功则将用户信息写入session并引导到index页面,
     * 期间判断是否有权限登录所选择的账套
     * @method  login
     * @return {Promise}
     */
    async loginAction() {
        //let vb ={msg:'请选择您有权限登录的账套。'};
        let vb = {
            msg: '演示账号：defans，密码：123456'
        };
        //vb.groups = await cmpage.service('admin/code').getGroups();
        if (this.isGet) {
            let user = await this.session('user');
            if (think.isEmpty(user)) {
                vb.loginName = 'defans';
                vb.loginPwd = '123456';
            } else {
                vb.loginName = user.c_login_name;
                vb.loginPwd = '';
            }
            // cmpage.debug(vb);
        } else {
            let user = await cmpage.service('admin/user').getUserByLogin(this.post('loginName'), this.post('loginPwd'));
            cmpage.debug(user);
            if (!think.isEmpty(user)) {
                if (user.c_status != 1) {
                    vb.loginName = this.post('loginName');
                    vb.msg = '请等候管理员审核，谢谢！';
                    this.assign('vb', vb);
                    return this.display();
                }
                //判断是否有权限登录所选择的账套
                user.groupID = await cmpage.service('admin/groupuser').getDefaultGroupID(user.id, user.c_group); //默认的账套ID
                if (think.isEmpty(user.groupID)) {
                    vb.loginName = this.post('loginName');
                    vb.msg = '请等候管理员分配账套，谢谢！';
                    this.assign('vb', vb);
                    return this.display();
                }
                debug(user, 'admin.C.index - login.user');
                let groups = await cmpage.service('admin/groupuser').getLoginGroups(user.groupID, user.id);
                debug(groups, 'admin.C.index - login.groups');
                if (think.isEmpty(groups)) {
                    vb.loginName = this.post('loginName');
                    vb.msg = '对不起，您不能登录该账套！';
                    this.assign('vb', vb);
                    return this.display();
                } else {
                    user.ip = this.ip;
                    user.urlLast = '/admin/index/index';
                    user.groupName = await cmpage.service('admin/code').getNameById(user.groupID);
                    user.groups = groups;
                    let width = think.isEmpty(this.post('clientWidth')) ? 1200 : this.post('clientWidth');
                    user.listColumns = width >= 1200 ? cmpage.ui.enumListColumns.MAX : (width >= 970 ? cmpage.ui.enumListColumns.MIDDLE :
                        (width >= 768 ? cmpage.ui.enumListColumns.SMALL : cmpage.ui.enumListColumns.MOBILE));
                    user.listBtns = width >= 1200 ? cmpage.ui.enumListBtns.MAX : (width >= 970 ? cmpage.ui.enumListBtns.MIDDLE :
                        (width >= 768 ? cmpage.ui.enumListBtns.SMALL : cmpage.ui.enumListBtns.MOBILE));
                    user.queryColumns = width >= 1200 ? cmpage.ui.enumQueryColumns.MAX : (width >= 970 ? cmpage.ui.enumQueryColumns.MIDDLE :
                        (width >= 768 ? cmpage.ui.enumQueryColumns.SMALL : cmpage.ui.enumQueryColumns.MOBILE));

                    debug(user, 'admin.index.C.login - user');
                    await cmpage.service('admin/login').addLogin(user);
                    await this.session('user', user);
                    let index_name = await this.session('index_name');
                    if (!think.isEmpty(index_name)) {
                        await this.session('index_name', null);
                        return this.redirect(`/${index_name}/index/index`);
                    }
                    if (width < 768) {
                        return this.redirect('/cmpage/hh/index');
                    } else {
                        return this.redirect('/admin/index/index');
                    }
                }
            } else {
                vb.loginName = this.post('loginName');
                vb.msg = '用户名或密码错误！';
                this.assign('vb', vb);
                return this.display();
            }
        }
        vb.msgCount = 0;
        this.assign('vb', vb);
        return this.display();
    }

    /**
     * 切换账套
     * @method  groupChange
     * @return {Promise}
     */
    async group_changeAction() {
        let groupID = this.get('groupID');
        let user = await this.session('user');
        let groups = await cmpage.service('admin/groupuser').getLoginGroups(groupID, user.id);
        if (!think.isEmpty(groups)) {
            user.groupID = groupID;
            user.groupName = await cmpage.service('admin/code').getNameById(groupID);
            user.groups = groups;
            await this.session('user', user);
        }
        return this.redirect('/admin/index/index');
    }

    /**
     * 用户登出，清除session中的用户信息并引导至用户登录页面
     * @method  exitLogin
     * @return {Promise}
     */
    async exit_loginAction() {
        await cmpage.service('admin/login').exitLogin(await this.session('user'));
        await this.session('user', null);
        return this.redirect('/admin/index/login');
    }

    /**
     * 用户密码修改页面，get方式显示编辑页面，post方式执行密码修改
     * @method  loginPwdEdit
     * @return {Promise}
     */
    async login_pwd_editAction() {
        if (this.method() === 'get') {
            return this.display();
        } else {
            let user = await this.session('user');
            await this.model('t_user').where({
                id: user.id
            }).update({
                c_login_pwd: think.md5(this.post('newPwd'))
            });
            await this.cache("users", null); //清除users缓存
            return this.json({
                statusCode: 200,
                message: '密码已修改，请牢记！',
                closeCurrent: true
            });
        }
    }

    async set_client_widthAction() {
        let user = await this.session('user');
        let width = think.isEmpty(this.get('width')) ? 1200 : this.get('width');
        user.listColumns = width >= 1200 ? cmpage.ui.enumListColumns.MAX : (width >= 970 ? cmpage.ui.enumListColumns.MIDDLE :
            (width >= 768 ? cmpage.ui.enumListColumns.SMALL : cmpage.ui.enumListColumns.MOBILE));
        user.listBtns = width >= 1200 ? cmpage.ui.enumListBtns.MAX : (width >= 970 ? cmpage.ui.enumListBtns.MIDDLE :
            (width >= 768 ? cmpage.ui.enumListBtns.SMALL : cmpage.ui.enumListBtns.MOBILE));
        user.queryColumns = width >= 1200 ? cmpage.ui.enumQueryColumns.MAX : (width >= 970 ? cmpage.ui.enumQueryColumns.MIDDLE :
            (width >= 768 ? cmpage.ui.enumQueryColumns.SMALL : cmpage.ui.enumQueryColumns.MOBILE));
        await this.session('user', user);
        return this.json({
            statusCode: 200,
            message: ''
        });
    }

    //刷新任务列表的缓存
    async refresh_crontabAction() {
        await cmpage.service('admin/crontab').setConfig(true);        
        return this.success_bjui_doajax("执行成功，定时任务列表已经刷新!");
    }
    //刷新任务列表的缓存
    async stop_crontabAction() {
        await cmpage.service('admin/crontab').setConfig(false);        
        return this.success_bjui_doajax("执行成功，定时任务列表已经清空!");
    }

    //刷新任务列表的缓存
    async crontab_exeAction() {
        // 如果不是定时任务调用，则拒绝
        if (!this.isCli) {
            return false;
        }
        const fn = this.get('fn');
        const id = this.get('id');
        const app = cmpage.service('admin/crontab_exe');
        if(think.isFunction(app[fn])){
            await app[fn](id);
        }
        return this.fail();
    }


    installAction() {
        if (this.ip() != "127.0.0.1") {
            return this.json({
                statusCode: 300,
                message: "You should install on localhost! " + this.ip()
            });
        }
        return this.display();
    }

    homeAction() {
        return this.display();
    }
    gitAction() {
        return this.display();
    }

}