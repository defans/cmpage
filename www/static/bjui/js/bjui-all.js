/*!
 * B-JUI  v1.3 beta2 (http://b-jui.com)
 * Git@OSC (http://git.oschina.net/xknaan/B-JUI)
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 */

/* ========================================================================
 * B-JUI: bjui-core.js  v1.3 beta2
 * @author K'naan
 * -- Modified from dwz.core.js (author:ZhangHuihua@msn.com)
 * http://git.oschina.net/xknaan/B-JUI/blob/master/BJUI/js/bjui-core.js
 * ========================================================================
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 * ======================================================================== */

+function ($) {
    'use strict';
    
    var BJUI = {
        JSPATH     : 'BJUI/',
        PLUGINPATH : 'BJUI/plugins/',
        IS_DEBUG   : false,
        KeyPressed : { //key press state
            ctrl  : false,
            shift : false
        },
        keyCode: {
            ENTER : 13, ESC  : 27, END : 35, HOME : 36,
            SHIFT : 16, CTRL : 17, TAB : 9,
            LEFT  : 37, RIGHT: 39, UP  : 38, DOWN : 40,
            DELETE: 46, BACKSPACE: 8
        },
        eventType: {
            initUI         : 'bjui.initUI',         // When document load completed or ajax load completed, B-JUI && Plugins init 
            beforeInitUI   : 'bjui.beforeInitUI',   // If your DOM do not init [add to DOM attribute 'data-noinit="true"']
            afterInitUI    : 'bjui.afterInitUI',    // 
            ajaxStatus     : 'bjui.ajaxStatus',     // When performing ajax request, display or hidden progress bar
            resizeGrid     : 'bjui.resizeGrid',     // When the window or dialog resize completed
            beforeAjaxLoad : 'bjui.beforeAjaxLoad', // When perform '$.fn.ajaxUrl', to do something...
            
            beforeLoadNavtab  : 'bjui.beforeLoadNavtab',
            beforeLoadDialog  : 'bjui.beforeLoadDialog',
            afterLoadNavtab   : 'bjui.afterLoadNavtab',
            afterLoadDialog   : 'bjui.afterLoadDialog',
            beforeCloseNavtab : 'bjui.beforeCloseNavtab',
            beforeCloseDialog : 'bjui.beforeCloseDialog',
            afterCloseNavtab  : 'bjui.afterCloseNavtab',
            afterCloseDialog  : 'bjui.afterCloseDialog'
        },
        formColWidth: {L:900, M:680, S:360, SS:240},
        pageInfo: {pageCurrent:'pageCurrent', pageSize:'pageSize', orderField:'orderField', orderDirection:'orderDirection'},
        alertMsg: {displayPosition:'topcenter', alertTimeout: 6000}, //alertmsg display position && close timeout
        ajaxTimeout: 30000,
        statusCode: {ok:200, error:300, timeout:301},
        keys: {statusCode:'statusCode', message:'message'},
        ui: {
            windowWidth      : 0,
            showSideWidth    : 990,
            sidenavWidth     : 260,
            offsetWidth      : 15,
            displayFirst     : true,      
            showSlidebar     : true,      // After the B-JUI initialization, display slidebar
            clientPaging     : true,      // Response paging and sorting information on the client
            overwriteHomeTab : false      // When open an undefined id of navtab, whether overwrite the home navtab
        },
        debug: function(msg) {
            if (this.IS_DEBUG) {
                if (typeof(console) != 'undefined') console.log(msg)
                else alert(msg)
            }
        },
        loginInfo: {
            url    : 'login.html',
            title  : 'Login',
            width  : 420,
            height : 260,
            mask   : true
        },
        loadLogin: function() {
            var login = this.loginInfo
            
            BJUI.dialog({id:'bjui-login', url:login.url, title:login.title, width:login.width, height:login.height, mask:login.mask})
        },
        init: function(options) {
            var op = $.extend({}, options)
            
            $.extend(BJUI.keys, op.keys)
            $.extend(BJUI.statusCode, op.statusCode)
            $.extend(BJUI.pageInfo, op.pageInfo)
            $.extend(BJUI.formColWidth, op.formColWidth)
            $.extend(BJUI.alertMsg, op.alertMsg)
            $.extend(BJUI.loginInfo, op.loginInfo)
            $.extend(BJUI.ui, op.ui)
            
            if (op.JSPATH) this.JSPATH = op.JSPATH
            if (op.PLUGINPATH) this.PLUGINPATH = op.PLUGINPATH
            if (op.ajaxTimeout) this.ajaxTimeout = op.ajaxTimeout
            
            this.IS_DEBUG = op.debug || false
            this.initEnv()
            
            if ((!$.cookie || !$.cookie('bjui_theme')) && op.theme) $(this).theme('setTheme', op.theme)
        },
        initEnv: function() {
            $(window).resize(function() {
                BJUI.initLayout()
                
                setTimeout(function() {$(this).trigger(BJUI.eventType.resizeGrid)}, 30)
            })
            
            setTimeout(function() {
                $(document).initui()
                
                var $collapse = $('#bjui-navbar-collapse'), left = $collapse.prev().width()
                
                $collapse.css('left', left).data('position.left', left)
                
                BJUI.initLayout()
                
                $('#bjui-top-collapse').on('click.theme', '.dropdown-toggle', function() {
                    var $dropdown = $(this).next(), $topcollapse = $('#bjui-top-collapse')
                    
                    if (!$topcollapse.hasClass('navbar-show')) {
                        $topcollapse.attr('style', $dropdown.is(':visible') ? '' : 'overflow:visible !important;')
                    }
                })
                
                $('[data-toggle="collapsenavbar"]').click(function() {
                    var $this = $(this), $target = $($this.data('target')), $parent = $this.closest('.navbar-header')
                    
                    if ($target.length) {
                        $target.toggleClass('navbar-show')
                        $parent.toggleClass('navbar-show')
                        
                        $(document).on('click', function(e) {
                            if(!($target.has(e.target).length) && !($parent.has(e.target).length)) {
                                $target.removeClass('navbar-show')
                                $parent.removeClass('navbar-show')
                            }
                        })
                    }
                })
            }, 10)
        },
        initLayout: function() {
            var ww = $(window).width(), hh = $(window).height(),
                $top = $('#bjui-top'), $navbar = $('#bjui-navbar'), $collapse = $('#bjui-top-collapse, #bjui-navbar-collapse'),
                th = $top.height(), nh = parseInt($navbar.css('min-height'), 10),
                eventName = 'click.bjui.sidenav.hide', opts = {},
                $navtab  = $('#bjui-navtab'), $sidenav = $('#bjui-sidenav'), $sidenavcol = $('#bjui-sidenav-col'),
                $sidenavarrow = $('#bjui-sidenav-arrow'), $sidenavbtn = $('#bjui-sidenav-btn'), $sidenavbox = $('#bjui-sidenav-box'),
                tnh = $sidenavbtn.outerHeight() - 2
            
            $('#bjui-navtab .tabsPageContent').height(hh - th - nh - tnh)
            $sidenav.height(hh - th - nh - 1)
            $sidenavcol.width(BJUI.ui.sidenavWidth)
            
            $collapse.scrollTop(5).eq(0).removeAttr('style')
            $collapse.each(function() {
                var $this = $(this), $collapsebtn = $this.prev().find('.navbar-toggle'), isCollapse = ($this.scrollTop() == 5 || $this.hasClass('navbar-show'))
                
                isCollapse && $this.scrollTop(0)
                
                $this.toggleClass('position', isCollapse)
                $collapsebtn.toggleClass('position', isCollapse)
                
                if ($this.data('position.left') && (ww / 2) < $this.data('position.left')) {
                    $this.prev().find('> .navbar-brand').hide()
                    $this.css('left', 0)
                } else {
                    $this.prev().find('> .navbar-brand').show()
                    $this.css('left', $this.data('position.left'))
                }
            })
            
            if (ww < BJUI.ui.showSideWidth) {
                $sidenavcol.css('left', -(BJUI.ui.sidenavWidth + BJUI.ui.offsetWidth)).addClass('autohide')
                $navtab.css('margin-left', 0)
                $sidenavbtn.show()
            } else {
                $sidenavcol.css('left', 0).removeClass('autohide')
                $navtab.css('margin-left', (BJUI.ui.sidenavWidth + BJUI.ui.offsetWidth))
                $sidenavbtn.hide()
            }
            
            $sidenavarrow.off(eventName).on(eventName, function() {
                $sidenavcol
                    .stop()
                    .animate({
                        left: -(BJUI.ui.sidenavWidth + BJUI.ui.offsetWidth)
                    }, 'fast', function() {
                        $sidenavbtn.show()
                        
                        $(window).trigger(BJUI.eventType.resizeGrid)
                    })
                
                $navtab
                    .stop()
                    .animate({
                        'margin-left': 0
                    }, 'fast')
            })
            
            $sidenavbtn.off(eventName).on(eventName, function() {
                $sidenavbtn.hide()
                
                $sidenavcol
                    .stop()
                    .animate({
                        left: 0
                    }, 'fast', function() {
                        $(window).trigger(BJUI.eventType.resizeGrid)
                    })
                
                opts['margin-left'] = (BJUI.ui.sidenavWidth + BJUI.ui.offsetWidth)
                if (ww < BJUI.ui.showSideWidth)
                    opts['margin-left'] = 0
                
                $navtab
                    .stop()
                    .animate(opts, 'fast')
            })
            
            /* fixed pageFooter */
            setTimeout(function() {
                $('#bjui-navtab > .tabsPageContent > .navtabPage').resizePageH()
                $('#bjui-navtab > .tabsPageContent > .navtabPage').find('.bjui-layout').resizePageH()
            }, 10)
        },
        initLayout1: function(ww) {
            var iContentW = ww - (BJUI.ui.showSlidebar ? $('#bjui-sidebar').width() + 6 : 6),
                iContentH = $(window).height() - $('#bjui-header').height() - $('#bjui-footer').outerHeight(), 
                navtabH   = $('#bjui-navtab').find('.tabsPageHeader').height()
            
            if (BJUI.ui.windowWidth) $('#bjui-window').width(ww)
            BJUI.windowWidth = ww
            
            $('#bjui-container').height(iContentH)
            $('#bjui-navtab').width(iContentW)
            $('#bjui-leftside, #bjui-sidebar, #bjui-sidebar-s, #bjui-splitBar, #bjui-splitBarProxy').css({height:'100%'})
            $('#bjui-navtab .tabsPageContent').height(iContentH - navtabH)
            
            /* fixed pageFooter */
            setTimeout(function() {
                $('#bjui-navtab > .tabsPageContent > .navtabPage').resizePageH()
                $('#bjui-navtab > .tabsPageContent > .navtabPage').find('.bjui-layout').resizePageH()
            }, 10)
            
            /* header navbar */
            var navbarWidth = $('body').data('bjui.navbar.width'),
                $header = $('#bjui-header'), $toggle = $header.find('.bjui-navbar-toggle'), $logo = $header.find('.bjui-navbar-logo'), $navbar = $('#bjui-navbar-collapse'), $nav = $navbar.find('.bjui-navbar-right')
            
            if (!navbarWidth) {
                navbarWidth = {logoW:$logo.outerWidth() + 5, navW:ww - $logo.outerWidth() - 5}
                $('body').data('bjui.navbar.width', navbarWidth)
            }
            if (navbarWidth) {
                if (ww - navbarWidth.logoW - 5 < navbarWidth.navW) {
                    $toggle.show()
                    $navbar.addClass('collapse menu')
                } else {
                    $toggle.hide()
                    $navbar.removeClass('collapse menu in')
                }
            }
            /* horizontal navbar */
            var $hnavbox  = $('#bjui-hnav-navbar-box'),
                $hnavbar  = $hnavbox.find('> #bjui-hnav-navbar'),
                $hmoreL   = $hnavbox.prev(),
                $hmoreR   = $hnavbox.next(),
                hboxWidth = $hnavbox.width(),
                liW       = 0
            
            $hnavbar.find('> li').each(function(i) {
                var $li = $(this)
                
                liW += $li.outerWidth()
                
                if (liW > hboxWidth) {
                    $hmoreR.show()
                    $hnavbox.data('hnav.move', true).data('hnav.liw', liW)
                } else {
                    $hmoreL.hide()
                    $hmoreR.hide()
                    $hnavbox.removeData('hnav.move')
                }
            })
        },
        regional: {},
        setRegional: function(key, value) {
            BJUI.regional[key] = value
        },
        getRegional : function(key) {
            if (String(key).indexOf('.') >= 0) {
                var msg, arr = String(key).split('.')
                
                for (var i = 0; i < arr.length; i++) {
                    if (!msg) msg = BJUI.regional[arr[i]]
                    else msg = msg[arr[i]]
                }
                
                return msg
            } else {
                return BJUI.regional[key]
            }
        },
        doRegional: function(frag, regional) {
            $.each(regional, function(k, v) {
                frag = frag.replaceAll('#'+ k +'#', v)
            })
            
            return frag
        },
        // is ie browser
        isIE: function(ver) {
            var b = document.createElement('b')
            
            b.innerHTML = '<!--[if IE '+ ver +']><i></i><![endif]-->'
            
            return b.getElementsByTagName('i').length === 1
        },
        StrBuilder: function() {
            return new StrBuilder()
        }
    }
    
    function StrBuilder() {
        this.datas = new Array()
    }
    
    StrBuilder.prototype.add = function(str) {
        if (typeof str !== 'undefined') this.datas.push(str)
        return this
    }
    
    StrBuilder.prototype.toString = function(str) {
        var string = this.datas.join(str || '')
        
        this.clear()
        
        return string
    }
    
    StrBuilder.prototype.isEmpty = function(){
        return this.datas.length == 0
    }
    
    StrBuilder.prototype.clear = function(){
        this.datas = []
        this.datas.length = 0
    }
    
    window.BJUI = BJUI
    
}(jQuery);
/*!
 * B-JUI  v1.3 beta2 (http://b-jui.com)
 * Git@OSC (http://git.oschina.net/xknaan/B-JUI)
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 */

/* ========================================================================
 * B-JUI: bjui-regional.zh-CN.js  v1.3 beta2
 * @author K'naan
 * http://git.oschina.net/xknaan/B-JUI/blob/master/BJUI/js/bjui-regional.zh-CN.js
 * ========================================================================
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 * ======================================================================== */

+function ($) {
    'use strict';
    
    $(function() {
        
        /* 消息提示框 */
        BJUI.setRegional('alertmsg', {
            title  : {error : '错误提示', info : '信息提示', warn : '警告信息', correct : '成功信息', confirm : '确认信息', prompt : '确认信息'},
            btnMsg : {ok    : '确定', yes  : '是',   no   : '否',   cancel  : '取消'}
        })
        
        /* dialog */
        BJUI.setRegional('dialog', {
            close    : '关闭',
            maximize : '最大化',
            restore  : '还原',
            minimize : '最小化',
            title    : '弹出窗口'
        })
        
        /* order by */
        BJUI.setRegional('orderby', {
            asc  : '升序',
            desc : '降序'
        })
        
        /* 分页 */
        BJUI.setRegional('pagination', {
            total   : '总记录数/总页数',
            first   : '首页',
            last    : '末页',
            prev    : '上一页',
            next    : '下一页',
            jumpto  : '输入跳转页码，回车确认',
            jump    : '跳转',
            page    : '页',
            refresh : '刷新'
        })
        
        BJUI.setRegional('datagrid', {
            asc       : '升序',
            desc      : '降序',
            showhide  : '显示/隐藏 列',
            filter    : '过滤',
            clear     : '清除',
            lock      : '锁定列',
            unlock    : '解除锁定',
            add       : '添加',
            edit      : '编辑',
            save      : '保存',
            update    : '更新',
            cancel    : '取消',
            del       : '删除',
            prev      : '上一条',
            next      : '下一条',
            refresh   : '刷新',
            query     : '查询',
            'import'  : '导入',
            'export'  : '导出',
            exportf   : '导出筛选',
            all       : '全部',
            'true'    : '是',
            'false'   : '否',
            noData    : '没有数据！',
            fAndS     : '过滤和排序！',
            expandMsg : '点我展开行！',
            shrinkMsg : '点我收缩行！',
            selectMsg : '未选中任何行！',
            editMsg   : '请先保存编辑行！',
            saveMsg   : '没有需要保存的行！',
            delMsg    : '确定要删除该行吗？',
            delMsgM   : '确定要删除选中行？',
            errorData : '未获取到正确的数据！',
            failData  : '请求datagrid数据失败！'
        })
        
        BJUI.setRegional('findgrid', {
            choose : '选择选中项',
            append : '追加选择',
            empty  : '清空现有值'
        })
        
        /* ajax加载提示 */
        BJUI.setRegional('progressmsg', '正在努力加载数据，请稍等...')
        
        /* 日期选择器 */
        BJUI.setRegional('datepicker', {
            close      : '关闭',
            prev       : '上月',
            next       : '下月',
            clear      : '清空',
            ok         : '确定',
            dayNames   : ['日', '一', '二', '三', '四', '五', '六'],
            monthNames : ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
        })
        
        /* navtab右键菜单  */
        BJUI.setRegional('navtabCM', {
            refresh    : '刷新本标签',
            close      : '关闭本标签',
            closeother : '关闭其他标签',
            closeall   : '关闭所有标签'
        })
        
        /* dialog右键菜单 */
        BJUI.setRegional('dialogCM', {
            refresh    : '刷新本窗口',
            close      : '关闭本窗口',
            closeother : '关闭其他窗口',
            closeall   : '关闭所有窗口'
        })
    
        /* 503错误提示 */
        BJUI.setRegional('statusCode_503', '服务器当前负载过大或者正在维护！')
        
        /* AJAX 状态返回 0 提示 */
        BJUI.setRegional('ajaxnosend', '与服务器的通信中断，请检查URL链接或服务器状态！')
        
        /* timeout提示 */
        BJUI.setRegional('sessiontimeout', '会话超时，请重新登陆！')
        
        /* 占位符对应选择器无有效值提示 */
        BJUI.setRegional('plhmsg', '占位符对应的选择器无有效值！')
        
        /* 未定义复选框组名提示 */
        BJUI.setRegional('nocheckgroup', '未定义选中项的组名[复选框的"data-group"]！')
        
        /* 未选中复选框提示 */
        BJUI.setRegional('notchecked', '未选中任何一项！')
        
        /* 未选中下拉菜单提示 */
        BJUI.setRegional('selectmsg', '请选择一个选项！')
        
        /* 表单验证错误提示信息 */
        BJUI.setRegional('validatemsg', '提交的表单中 [{0}] 个字段有错误，请更正后再提交！')
        
        /* ID检查 */
        BJUI.setRegional('idChecked', '不规范，ID需以字母开头，组成部分包括（0-9，字母，中横线，下划线）')
        
        /* 框架名称 */
        BJUI.setRegional('uititle', 'B-JUI')
        
        /* 主navtab标题 */
        BJUI.setRegional('maintab', '我的主页')
        
        /**
         * 
         *  Plugins regional setting
         * 
         */
        /* nice validate - Global configuration */
        $.validator && $.validator.config({
            //stopOnError: false,
            //theme: 'yellow_right',
            defaultMsg: "{0}格式不正确",
            loadingMsg: "正在验证...",
            
            // Custom rules
            rules: {
                digits: [/^\d+$/, '请输入整数']
                ,number: [/^[\-\+]?((([0-9]{1,3})([,][0-9]{3})*)|([0-9]+))?([\.]([0-9]+))?$/, '请输入有效的数字']
                ,letters: [/^[a-z]+$/i, '{0}只能输入字母']
                ,upletterandnumber: [/^[A-Z0-9]+$/, '只能输入大写字母和数字']
                ,tel: [/^(?:(?:0\d{2,3}[\- ]?[1-9]\d{6,7})|(?:[48]00[\- ]?[1-9]\d{6}))$/, '电话格式不正确']
                ,mobile: [/^1[3-9]\d{9}$/, '手机号格式不正确']
                ,email: [/^[\w\+\-]+(\.[\w\+\-]+)*@[a-z\d\-]+(\.[a-z\d\-]+)*\.([a-z]{2,4})$/i, '邮箱格式不正确']
                ,qq: [/^[1-9]\d{4,}$/, 'QQ号格式不正确']
                //,date: [/^\d{4}-\d{1,2}-\d{1,2}$/, '请输入正确的日期,例:yyyy-mm-dd']
                ,date:[/^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/, '请输入正确的日期，例：yyyy-MM-dd']
                //,time: [/^([01]\d|2[0-3])(:[0-5]\d){1,2}$/, '请输入正确的时间,例:14:30或14:30:00']
                ,time: [/^(2[0123]|(1|0?)[0-9]){1}:([0-5][0-9]){1}:([0-5][0-9]){1}$/, '请输入正确的时间，例：HH:mm:ss']
                ,datetime: [/^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])\s+(2[0123]|(1|0?)[0-9]){1}:([0-5][0-9]){1}:([0-5][0-9]){1}$/,
                            '请输入正确的日期时间，例：yyyy-MM-dd HH:mm:ss']
                ,ID_card: [/^[1-9]\d{5}[1-9]\d{3}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])((\d{4})|\d{3}[A-Z])$/, '请输入正确的身份证号码']
                ,url: [/^(https?|ftp):\/\/[^\s]+$/i, '网址格式不正确']
                ,postcode: [/^[1-9]\d{5}$/, '邮政编码格式不正确']
                ,chinese: [/^[\u0391-\uFFE5]+$/, '请输入中文']
                ,username: [/^\w{3,12}$/, '请输入3-12位数字、字母、下划线']
                ,password: [/^[0-9a-zA-Z]{6,16}$/, '密码由6-16位数字、字母组成']
                ,pattern:function(element, params) {
                    if (!params) return true
                    
                    var date = element.value.parseDate(params)
                    
                    return (!date ? this.renderMsg('错误的日期时间格式！', params) : true)
                }
                ,accept: function(element, params) {
                    if (!params) return true
                    
                    var ext = params[0]
                    
                    return (ext === '*') ||
                           (new RegExp('.(?:' + (ext || 'png|jpg|jpeg|gif') + ')$', 'i')).test(element.value) ||
                           this.renderMsg('只接受{1}后缀', ext.replace('|', ','))
                }
                
            }
        })

        /* nice validate - Default error messages */
        $.validator && $.validator.config({
            messages: {
                required: '{0}不能为空',
                remote: '{0}已被使用',
                integer: {
                    '*': '请输入整数',
                    '+': '请输入正整数',
                    '+0': '请输入正整数或0',
                    '-': '请输入负整数',
                    '-0': '请输入负整数或0'
                },
                match: {
                    eq: '{0}与{1}不一致',
                    neq: '{0}与{1}不能相同',
                    lt: '{0}必须小于{1}',
                    gt: '{0}必须大于{1}',
                    lte: '{0}必须小于或等于{1}',
                    gte: '{0}必须大于或等于{1}'
                },
                range: {
                    rg: '请输入{1}到{2}的数',
                    gte: '请输入大于或等于{1}的数',
                    lte: '请输入小于或等于{1}的数'
                },
                checked: {
                    eq: '请选择{1}项',
                    rg: '请选择{1}到{2}项',
                    gte: '请至少选择{1}项',
                    lte: '请最多选择{1}项'
                },
                length: {
                    eq: '请输入{1}个字符',
                    rg: '请输入{1}到{2}个字符',
                    gte: '请至少输入{1}个字符',
                    lte: '请最多输入{1}个字符',
                    eq_2: '',
                    rg_2: '',
                    gte_2: '',
                    lte_2: ''
                }
            }
        })
    })
    
}(jQuery);
/*!
 * B-JUI  v1.3 beta2 (http://b-jui.com)
 * Git@OSC (http://git.oschina.net/xknaan/B-JUI)
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 */

/* ========================================================================
 * B-JUI: bjui-frag.js  v1.3 beta2
 * @author K'naan
 * http://git.oschina.net/xknaan/B-JUI/blob/master/BJUI/js/bjui-frag.js
 * ========================================================================
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 * ======================================================================== */

+function ($) {
    'use strict';
    
    BJUI.setRegional('alertmsg', {
        title  : {error : 'Error', info : 'Info', warn : 'Warning', correct : 'Correct', confirm : 'Confirm', prompt:'Prompt'},
        btnMsg : {ok    : 'OK',    yes  : 'YES',  no   : 'NO',      cancel  : 'Cancel'}
    })
    
    BJUI.setRegional('dialog', {
        close    : 'Close',
        maximize : 'Maximize',
        restore  : 'Restore',
        minimize : 'Minimize',
        title    : 'Popup window'
    })
    
    BJUI.setRegional('orderby', {
        asc  : 'Asc',
        desc : 'Desc'
    })
    
    BJUI.setRegional('pagination', {
        first  : 'First page',
        last   : 'Last page',
        prev   : 'Prev page',
        next   : 'Next page',
        jumpto : 'Jump page number',
        jump   : 'Jump'
    })
    
    BJUI.setRegional('datagrid', {
        asc       : 'ASC',
        desc      : 'DESC',
        showhide  : 'Show/Hide columns',
        filter    : 'Filter',
        clear     : 'Clear',
        lock      : 'Lock',
        unlock    : 'Unlock',
        add       : 'Add',
        edit      : 'Edit',
        save      : 'Save',
        update    : 'Update',
        cancel    : 'Cancel',
        del       : 'Delete',
        prev      : 'Prev',
        next      : 'Next',
        refresh   : 'Refresh',
        query     : 'Query',
        'import'  : 'Import',
        'export'  : 'Export',
        exportf   : 'Export filter',
        all       : 'All',
        'true'    : 'True',
        'false'   : 'False',
        noData    : 'No data!',
        fAndS     : 'Filter && Sort!',
        expandMsg : 'Click here to expand the tr!',
        shrinkMsg : 'Click here to shrink the tr!',
        selectMsg : 'Not selected any rows!',
        saveMsg   : 'No rows need to save!',
        editMsg   : 'Please save the edited row!',
        delMsg    : 'Sure you want to delete this row?',
        delMsgM   : 'Sure you want to delete selected rows?',
        errorData : 'Did not get the correct data!',
        failData  : 'Request data failed!'
    })
    
    BJUI.setRegional('findgrid', {
        choose : 'Choose the selected item',
        append : 'Append choose the selected item',
        empty  : 'Empty existing values'
    })
    
    BJUI.setRegional('progressmsg', 'Data loading, please waiting...')
    
    BJUI.setRegional('datepicker', {
        close      : 'Close',
        prev       : 'Prev month',
        next       : 'Next month',
        clear      : 'Clear',
        ok         : 'OK',
        dayNames   : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        monthNames : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    })
    
    BJUI.setRegional('navtabCM', {
        refresh    : 'Refresh navtab',
        close      : 'Close navtab',
        closeother : 'Close other navtab',
        closeall   : 'Close all navtab'
    })
    
    BJUI.setRegional('dialogCM', {
        refresh    : 'Refresh dialog',
        close      : 'Close dialog',
        closeother : 'Close other dialog',
        closeall   : 'Close all dialog'
    })
    
    BJUI.setRegional('statusCode_503', 'HTTP status 503, the current server load is too large or is down for maintenance!')
    
    BJUI.setRegional('ajaxnosend', 'Communication with the server is interrupted, please check the URL link or server status!')
    
    BJUI.setRegional('sessiontimout', 'Session timeout, please login!')
    
    BJUI.setRegional('plhmsg', 'Placeholder corresponding selector None Valid!')
    
    BJUI.setRegional('nocheckgroup', 'Undefined group name selected item [check box "data-group"]!')
    
    BJUI.setRegional('notchecked', 'Unchecked any one!')
    
    BJUI.setRegional('selectmsg', 'Please select one option!')
    
    BJUI.setRegional('validatemsg', 'Submitted form data has [{0}] field an error, please after modified submitting!')
    
    BJUI.setRegional('idChecked', 'is not standardized, ID need to start with a letter, components include (0-9, letters, hyphens, underscore)')
    
    BJUI.setRegional('uititle', 'B-JUI')
    
    BJUI.setRegional('maintab', 'My home')
    
    
    window.FRAG = {
        dialog: '<div class="bjui-dialog bjui-dialog-container" style="top:150px; left:300px;">' +
                '    <div class="dialogHeader" onselectstart="return false;" oncopy="return false;" onpaste="return false;" oncut="return false;">' +
                '        <a class="close" href="javascript:;" title="#close#"><i class="fa fa-times"></i></a>' +
                '        <a class="maximize" href="javascript:;" title="#maximize#"><i class="fa fa-square-o"></i></a>' +
                '        <a class="restore" href="javascript:;" title="#restore#"><i class="fa fa-clone fa-rotate-90"></i></a>' +
                '        <a class="minimize" href="javascript:;" title="#minimize#"><i class="fa fa-minus"></i></a>' +
                '        <h1><span><i class="fa fa-th-large"></i></span> <span class="title">#title#</span></h1>' +
                '    </div>' +
                '    <div class="dialogContent unitBox"></div>' +
                '    <div class="resizable_h_l" tar="nw"></div>' +
                '    <div class="resizable_h_r" tar="ne"></div>' +
                '    <div class="resizable_h_c" tar="n"></div>' +
                '    <div class="resizable_c_l" tar="w" style="height:100%;"></div>' +
                '    <div class="resizable_c_r" tar="e" style="height:100%;"></div>' +
                '    <div class="resizable_f_l" tar="sw"></div>' +
                '    <div class="resizable_f_r" tar="se"></div>' +
                '    <div class="resizable_f_c" tar="s"></div>' +
                '</div>'
        ,
        taskbar: '<div id="bjui-taskbar" style="left:0px; display:none;">' +
                 '    <div class="taskbarContent">' +
                 '        <ul></ul>' +
                 '    </div>' +
                 '    <div class="taskbarLeft taskbarLeftDisabled"><i class="fa fa-angle-double-left"></i></div>' +
                 '    <div class="taskbarRight"><i class="fa fa-angle-double-right"></i></div>' +
                 '</div>'
        ,
        splitBar: '<div id="bjui-splitBar"></div>',
        splitBarProxy: '<div id="bjui-splitBarProxy"></div>',
        resizable: '<div id="bjui-resizable" class="bjui-resizable"></div>',
        alertBackground: '<div class="bjui-alertBackground"></div>',
        maskBackground: '<div class="bjui-maskBackground bjui-ajax-mask"></div>',
        maskProgress: '<div class="bjui-maskProgress bjui-ajax-mask"><i class="fa fa-cog fa-spin"></i>&nbsp;&nbsp;#progressmsg#<div class="progressBg"><div class="progress"></div></div></div>',
        progressBar_custom: '<div id="bjui-progressBar-custom" class="progressBar"><i class="fa fa-cog fa-spin"></i> <span></span></div>',
        dialogMask: '<div class="bjui-dialogBackground"></div>',
        orderby: '<a href="javascript:;" class="order asc" data-order-direction="asc" title="#asc#"><i class="fa fa-angle-up"></i></a>' +
                 '<a href="javascript:;" class="order desc" data-order-direction="desc" title="#desc#"><i class="fa fa-angle-down"></i></a>'
        ,
        slidePanel: '<div class="panel panel-default">' +
                    '    <div class="panel-heading">' +
                    '        <h4 class="panel-title"><a data-toggle="collapse" data-parent="#bjui-accordionmenu" href="##id#" class="#class#">#icon#&nbsp;#title#<b>#righticon#</b></a></h4>' +
                    '    </div>' +
                    '    <div id="#id#" class="panel-collapse collapse#bodyclass#">' +
                    '        <div class="panel-body">' +
                    '        </div>' +
                    '    </div>' +
                    '</div>'
        ,                    
        pagination: '<ul class="pagination">' +
                    '    <li class="j-first">' +
                    '        <a class="first" href="javascript:;"><i class="fa fa-step-backward"></i> #first#</a>' +
                    '        <span class="first"><i class="fa fa-step-backward"></i> #first#</span>' +
                    '    </li>' +
                    '    <li class="j-prev">' +
                    '        <a class="previous" href="javascript:;"><i class="fa fa-backward"></i> #prev#</a>' +
                    '        <span class="previous"><i class="fa fa-backward"></i> #prev#</span>' +
                    '    </li>' +
                    '    #pageNumFrag#' +
                    '    <li class="j-next">' +
                    '        <a class="next" href="javascript:;">#next# <i class="fa fa-forward"></i></a>' +
                    '        <span class="next">#next# <i class="fa fa-forward"></i></span>' +
                    '    </li>' +
                    '    <li class="j-last">' +
                    '        <a class="last" href="javascript:;">#last# <i class="fa fa-step-forward"></i></a>' +
                    '        <span class="last">#last# <i class="fa fa-step-forward"></i></span>' +
                    '    </li>' +
                    '    <li class="jumpto"><span class="p-input"><input class="form-control input-sm-pages" type="text" size="2.6" value="#pageCurrent#" title="#jumpto#"></span><a class="goto" href="javascript:;" title="#jump#"><i class="fa fa-chevron-right"></i></a></li>' +
                    '</ul>'
        ,
        gridPaging: '<ul class="pagination">' +
                    '    <li class="page-total">' +
                    '        <span title="#total#">#count#</span>' +
                    '    </li>' +
                    '    <li class="page-jumpto"><span class="page-input"><input class="form-control input-sm-pages" type="text" size="3.2" value="#pageCurrent#" title="#jumpto#"></span></li>' +
                    '    <li class="page-first btn-nav">' +
                    '        <a href="javascript:;" title="#first#"><i class="fa fa-step-backward"></i></a>' +
                    '    </li>' +
                    '    <li class="page-prev btn-nav">' +
                    '        <a href="javascript:;" title="#prev#"><i class="fa fa-backward"></i></a>' +
                    '    </li>' +
                    '    #pageNumFrag#' +
                    '    <li class="page-next btn-nav">' +
                    '        <a href="javascript:;" title="#next#"><i class="fa fa-forward"></i></a>' +
                    '    </li>' +
                    '    <li class="page-last btn-nav">' +
                    '        <a href="javascript:;" title="#last#"><i class="fa fa-step-forward"></i></a>' +
                    '    </li>' +
                    '</ul>'
        ,
        gridPageNum : '<li class="page-num#active#"><a href="javascript:;">#num#</a></li>',
        gridMenu : '<div class="datagrid-menu-box">'
                 + '    <ul>'
                 + '        <li class="datagrid-li-asc"><a href="javascript:;"><span class="icon"><i class="fa fa-sort-amount-asc"></i></span><span class="title">#asc#</span></a></li>'
                 + '        <li class="datagrid-li-desc"><a href="javascript:;"><span class="icon"><i class="fa fa-sort-amount-desc"></i></span><span class="title">#desc#</span></a></li>'
                 + '        <li class="datagrid-li-filter"><a href="javascript:;"><span class="icon"><i class="fa fa-filter"></i></span><span class="title">#filter#</span><span class="arrow"></span></a></li>'
                 + '        <li class="datagrid-li-showhide"><a href="javascript:;"><span class="icon"><i class="fa fa-check-square-o"></i></span><span class="title">#showhide#</span><span class="arrow"></span></a></li>'
                 + '        <li class="datagrid-li-lock"><a href="javascript:;"><span class="icon"><i class="fa fa-lock"></i></span><span class="title">#lock#</span></a></li>'
                 + '        <li class="datagrid-li-unlock disable"><a href="javascript:;"><span class="icon"><i class="fa fa-unlock"></i></span><span class="title">#unlock#</span></a></li>'
                 + '    </ul>'
                 + '</div>'
        ,
        gridFilter: '<div class="datagrid-filter-box">'
                  + '<fieldset>'
                  + '<legend>#label#</legend>'
                  + '<span class="filter-a"></span>'
                  + '<span class="filter-and"><select data-toggle="selectpicker" data-container="true" data-width="100%"><option value="and">AND</option><option value="or">OR</option></select></span>'
                  + '<span class="filter-b"></span>'
                  + '<span class="filter-ok"><button type="button" class="btn-green ok" data-icon="check">#filter#</button><button type="button" class="btn-orange clear" data-icon="remove">#clear#</button></span>'
                  + '</fieldset>'
                  + '</div>'
        ,
        gridShowhide: '<li data-index="#index#" class="datagrid-col-check"><a href="javascript:;"><i class="fa fa-check-square-o"></i>#label#</a></li>',
        gridEditBtn : '<button type="button" class="btn btn-green bjui-datagrid-btn edit"><i class="fa fa-edit"></i> #edit#</button>'
                    + '<button type="button" class="btn btn-green bjui-datagrid-btn update"><i class="fa fa-edit"></i> #update#</button>'
                    + '<button type="button" class="btn btn-green bjui-datagrid-btn save"><i class="fa fa-check"></i> #save#</button>'
                    + '<button type="button" class="btn btn-orange bjui-datagrid-btn cancel"><i class="fa fa-undo"></i> #cancel#</button>'
                    + '<button type="button" class="btn btn-red bjui-datagrid-btn delete"><i class="fa fa-remove"></i> #del#</button>'
        ,
        gridDialogEditBtns: '<ul>'
                          + '    <li class="pull-left"><button type="button" class="btn btn-orange prev" data-icon="arrow-up">#prev#</button></li>'
                          + '    <li class="pull-left"><button type="button" class="btn btn-orange next" data-icon="arrow-down">#next#</button></li>'
                          + '    <li><button type="button" class="btn btn-red cancel" data-icon="remove">#cancel#</button></li>'
                          + '    <li><button type="button" class="btn btn-default save" data-icon="save">#save#</button></li>'
                          + '</ul>'
        ,
        gridExpandBtn: '<span title="#expandMsg#"><i class="fa fa-plus"></i></span>',
        gridShrinkBtn: '<span title="#shrinkMsg#"><i class="fa fa-minus"></i></span>',
        alertBoxFrag: '<div id="bjui-alertMsgBox" class="bjui-alert"><div class="alertContent"><div class="#type#"><div class="alertInner"><h1><i class="fa #fa#"></i>#title#</h1><div class="msg">#message##prompt#</div></div><div class="toolBar clearfix"><ul>#btnFragment#</ul></div></div></div></div>',
        alertBtnFrag: '<li><button class="btn btn-#class#" rel="#callback#" type="button">#btnMsg#</button></li>',
        calendarFrag: '<div id="bjui-calendar">' +
                      '    <div class="main">' +
                      '        <a class="close" href="javascript:;" title="#close#"><i class="fa fa-times-circle"></i></a>' +
                      '        <div class="head">' +
                      '            <table width="100%" border="0" cellpadding="0" cellspacing="2">' +
                      '                <tr>' +
                      '                    <td width="20"><a class="prev" href="javascript:;" title="#prev#"><i class="fa fa-arrow-left"></i></a></td>' +
                      '                    <td><select name="year"></select></td>' +
                      '                    <td><select name="month"></select></td>' +
                      '                    <td width="20"><a class="next" href="javascript:;" title="#next#"><i class="fa fa-arrow-right"></i></a></td>' +
                      '                </tr>' +
                      '            </table>' +
                      '        </div>' +
                      '        <div class="body">' +
                      '            <dl class="dayNames"><dt>7</dt><dt>1</dt><dt>2</dt><dt>3</dt><dt>4</dt><dt>5</dt><dt>6</dt></dl>' +
                      '            <dl class="days"><!-- date list --></dl>' +
                      '            <div style="clear:both;height:0;line-height:0"></div>' +
                      '        </div>' +
                      '        <div class="foot">' +
                      '            <table class="time">' +
                      '                <tr>' +
                      '                    <td>' +
                      '                        <input type="text" class="hh" maxlength="2" data-type="hh" data-start="0" data-end="23">:<input' +
                      '                         type="text" class="mm" maxlength="2" data-type="mm" data-start="0" data-end="59">:<input' +
                      '                         type="text" class="ss" maxlength="2" data-type="ss" data-start="0" data-end="59">' +
                      '                    </td>' +
                      '                    <td><ul><li class="up" data-add="1">&and;</li><li class="down">&or;</li></ul></td>' +
                      '                </tr>' +
                      '            </table>' +
                      '            <button type="button" class="clearBtn btn btn-orange">#clear#</button>' +
                      '            <button type="button" class="okBtn btn btn-default">#ok#</button>' +
                      '        </div>' +
                      '        <div class="tm">' +
                      '            <ul class="hh">' +
                      '                <li>0</li>' +
                      '                <li>1</li>' +
                      '                <li>2</li>' +
                      '                <li>3</li>' +
                      '                <li>4</li>' +
                      '                <li>5</li>' +
                      '                <li>6</li>' +
                      '                <li>7</li>' +
                      '                <li>8</li>' +
                      '                <li>9</li>' +
                      '                <li>10</li>' +
                      '                <li>11</li>' +
                      '                <li>12</li>' +
                      '                <li>13</li>' +
                      '                <li>14</li>' +
                      '                <li>15</li>' +
                      '                <li>16</li>' +
                      '                <li>17</li>' +
                      '                <li>18</li>' +
                      '                <li>19</li>' +
                      '                <li>20</li>' +
                      '                <li>21</li>' +
                      '                <li>22</li>' +
                      '                <li>23</li>' +
                      '            </ul>' +
                      '            <ul class="mm">' +
                      '                <li>0</li>' +
                      '                <li>5</li>' +
                      '                <li>10</li>' +
                      '                <li>15</li>' +
                      '                <li>20</li>' +
                      '                <li>25</li>' +
                      '                <li>30</li>' +
                      '                <li>35</li>' +
                      '                <li>40</li>' +
                      '                <li>45</li>' +
                      '                <li>50</li>' +
                      '                <li>55</li>' +
                      '            </ul>' +
                      '            <ul class="ss">' +
                      '                <li>0</li>' +
                      '                <li>10</li>' +
                      '                <li>20</li>' +
                      '                <li>30</li>' +
                      '                <li>40</li>' +
                      '                <li>50</li>' +
                      '            </ul>' +
                      '        </div>' +
                      '    </div>' +
                      '</div>'
        ,
        spinnerBtn:  '<ul class="bjui-spinner"><li class="up" data-add="1">&and;</li><li class="down">&or;</li></ul>',
        findgridBtn: '<a class="bjui-lookup" href="javascript:;" data-toggle="findgridbtn"><i class="fa fa-search"></i></a>',
        lookupBtn: '<a class="bjui-lookup" href="javascript:;" data-toggle="lookupbtn"><i class="fa fa-search"></i></a>',
        dateBtn:     '<a class="bjui-lookup" href="javascript:;" data-toggle="datepickerbtn"><i class="fa fa-calendar"></i></a>',
        navtabCM: '<ul id="bjui-navtabCM">' +
                  '    <li rel="reload"><span class="icon"><i class="fa fa-refresh"></i></span><span class="title">#refresh#</span></li>' +
                  '    <li rel="closeCurrent"><span class="icon"><i class="fa fa-remove"></i></span><span class="title">#close#</li>' +
                  '    <li rel="closeOther"><span class="icon"><i class="fa fa-remove"></i></span><span class="title">#closeother#</li>' +
                  '    <li rel="closeAll"><span class="icon"><i class="fa fa-remove"></i></span><span class="title">#closeall#</li>' +
                  '</ul>'
        ,
        dialogCM: '<ul id="bjui-dialogCM">' +
                  '    <li rel="reload"><span class="icon"><i class="fa fa-refresh"></i></span><span class="title">#refresh#</span></li>' +          
                  '    <li rel="closeCurrent"><span class="icon"><i class="fa fa-remove"></i></span><span class="title">#close#</span></li>' +
                  '    <li rel="closeOther"><span class="icon"><i class="fa fa-remove"></i></span><span class="title">#closeother#</span></li>' +
                  '    <li rel="closeAll"><span class="icon"><i class="fa fa-remove"></i></span><span class="title">#closeall#</span></li>' +
                  '</ul>'
        ,
        externalFrag: '<iframe src="{url}" style="width:100%;height:{height};" frameborder="no" border="0" marginwidth="0" marginheight="0"></iframe>'
    }
    
}(jQuery);
/*!
 * B-JUI  v1.3 beta2 (http://b-jui.com)
 * Git@OSC (http://git.oschina.net/xknaan/B-JUI)
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 */

/* ========================================================================
 * B-JUI: bjui-extends.js  v1.3 beta2
 * @author K'naan
 * http://git.oschina.net/xknaan/B-JUI/blob/master/BJUI/js/bjui-extends.js
 * ========================================================================
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 * ======================================================================== */

+function ($) {
    'use strict';
    
    $.fn.extend({
        /**
         * @param {Object} op: {type:GET/POST, url:ajax请求地址, data:ajax请求参数列表, callback:回调函数 }
         */
        ajaxUrl: function(op) {
            var $this = $(this), $target = $this//$this.closest('.bjui-pageContent')
            
            if (!$target.length)
                $target = $this
                
            $this.trigger(BJUI.eventType.beforeAjaxLoad)
            
            if (op.loadingmask) {
                $target.trigger(BJUI.eventType.ajaxStatus)
            }
            
            $.ajax({
                type     : op.type || 'GET',
                url      : op.url,
                data     : op.data || {},
                cache    : false,
                dataType : 'html',
                timeout  : BJUI.ajaxTimeout,
                success  : function(response) {
                    var json = response.toJson(), $ajaxMask = $target.find('> .bjui-ajax-mask')
                    
                    if (!json[BJUI.keys.statusCode]) {
                        $this.empty().html(response).initui()
                    } else {
                        if (json[BJUI.keys.statusCode] == BJUI.statusCode.error) {
                            if (json[BJUI.keys.message]) $this.alertmsg('error', json[BJUI.keys.message])
                            if (!$this.closest('.bjui-layout').length) {
                                if ($this.closest('.navtab-panel').length) $this.navtab('closeCurrentTab')
                                else $this.dialog('closeCurrent')
                            }
                        } else if (json[BJUI.keys.statusCode] == BJUI.statusCode.timeout) {
                            if ($this.closest('.bjui-dialog').length) $this.dialog('closeCurrent')
                            if ($this.closest('.navtab-panel').length) $this.navtab('closeCurrentTab')
                            
                            BJUI.alertmsg('info', (json[BJUI.keys.message] || BJUI.regional.sessiontimeout))
                            BJUI.loadLogin()
                        }
                        $ajaxMask.fadeOut('normal', function() {
                            $(this).remove()
                        })
                    }
                    
                    if ($.isFunction(op.callback)) op.callback(response)
                },
                error      : function(xhr, ajaxOptions, thrownError) {
                    $this.bjuiajax('ajaxError', xhr, ajaxOptions, thrownError)
                    if (!$this.closest('.bjui-layout').length) {
                        if ($this.closest('.navtab-panel').length) $this.navtab('closeCurrentTab')
                        else $this.dialog('closeCurrent')
                    }
                    $this.trigger('bjui.ajaxError')
                },
                statusCode : {
                    0  : function(xhr, ajaxOptions, thrownError) {
                        BJUI.alertmsg('error', BJUI.regional.ajaxnosend)
                    },
                    503: function(xhr, ajaxOptions, thrownError) {
                        BJUI.alertmsg('error', BJUI.regional.statusCode_503)
                    }
                }
            })
        },
        loadUrl: function(url,data,callback) {
            $(this).ajaxUrl({url:url, data:data, callback:callback})
        },
        doAjax: function(op) {
            var $this = $(this), $target, $ajaxMask
            
            $this.data('holdSubmit', true)
            
            if (!op.url) {
                BJUI.debug('The ajax url is undefined!')
                return
            }
            if (!op.callback) {
                BJUI.debug('The ajax callback is undefined!')
                return
            } else {
                op.callback = op.callback.toFunc()
            }
            if (op.loadingmask) {
                $target = $this.isTag('form') ? $this.closest('.bjui-pageContent') : $this
                
                if (!$target.length)
                    $target = $this
                
                $target.trigger(BJUI.eventType.ajaxStatus)
                $ajaxMask = $target.find('> .bjui-ajax-mask')
            }
            if (!op.type) op.type = 'POST'
            if (!op.dataType) op.dataType = 'json'
            if (!op.cache) op.cache = false
            op.timeout = op.ajaxTimeout || BJUI.ajaxTimeout
            op.success = function(response) {
                if ($ajaxMask) {
                    if (op.callback) {
                        $.when(op.callback(response)).done(function() {
                            $target.trigger('bjui.ajaxStop')
                        })
                    } else {
                        $target.trigger('bjui.ajaxStop')
                    }
                } else {
                    op.callback(response)
                }
                
                $this.data('holdSubmit', false)
            }
            op.error = function(xhr, ajaxOptions, thrownError) {
                if ($ajaxMask)
                    $target.trigger('bjui.ajaxError')
                
                $this.bjuiajax('ajaxError', xhr, ajaxOptions, thrownError)
                
                $this.data('holdSubmit', false)
            }
            op.statusCode = {
                0  : function(xhr, ajaxOptions, thrownError) {
                    BJUI.alertmsg('error', BJUI.regional.ajaxnosend)
                    
                    $this.data('holdSubmit', false)
                },
                503: function(xhr, ajaxOptions, thrownError) {
                    BJUI.alertmsg('error', BJUI.regional.statusCode_503)
                    
                    $this.data('holdSubmit', false)
                }
            }
            
            $.ajax(op)
        },
        getPageTarget: function() {
            var $target
            
            if (this.closest('.bjui-layout').length) $target = this.closest('.bjui-layout')
            else if (this.closest('.navtab-panel').length) $target = $.CurrentNavtab
            else $target = $.CurrentDialog
            
            return $target
        },
        resizePageH: function() {
            return this.each(function() {
                if ($(this).closest('.tab-content').length) return
                
                var $box         = $(this),
                    $pageHeader  = $box.find('> .bjui-pageHeader'),
                    $pageContent = $box.find('> .bjui-pageContent'),
                    $pageFooter  = $box.find('> .bjui-pageFooter'),
                    headH        = $pageHeader.outerHeight() || 0,
                    footH        = $pageFooter.outerHeight() || 0
                
                if ($pageFooter.css('bottom')) footH += parseInt($pageFooter.css('bottom')) || 0
                
                $pageContent.css({top:headH, bottom:footH})
                
                if ($box.hasClass('dialogContent') && !$pageContent.length) {
                    $box.css({padding:10, overflow:'auto'})
                }
            })
        },
        getMaxIndexObj: function($elements) {
            var zIndex = 0, index = 0
            
            $elements.each(function(i) {
                var newZIndex = parseInt($(this).css('zIndex')) || 1
                
                if (zIndex < newZIndex) {
                    zIndex = newZIndex
                    index  = i
                }
            })
            
            return $elements.eq(index)
        },
        /**
         * 将表单数据转成JSON对象 用法：$(form).serializeJson() Author: K'naan
         */
        serializeJson: function () {
            var o = {}
            var a = this.serializeArray()
            
            $.each(a, function () {
                if (o[this.name] !== undefined) {
                    if (!o[this.name].push) {
                        o[this.name] = [o[this.name]]
                    }
                    o[this.name].push(this.value || '')
                } else {
                   o[this.name] = this.value || ''
                }
            })
            
            return o
        },
        isTag: function(tn) {
            if (!tn) return false
            if (!$(this).prop('tagName')) return false
            return $(this)[0].tagName.toLowerCase() == tn ? true : false
        },
        /**
         * 判断当前元素是否已经绑定某个事件
         * @param {Object} type
         */
        isBind: function(type) {
            var _events = $(this).data('events')
            return _events && type && _events[type]
        },
        /**
         * 输出firebug日志
         * @param {Object} msg
         */
        log: function(msg) {
            return this.each(function() {
                if (console) console.log('%s: %o', msg, this)
            })
        }
    })
    
    /**
     * 扩展String方法
     */
    $.extend(String.prototype, {
        isPositiveInteger: function() {
            return (new RegExp(/^[1-9]\d*$/).test(this))
        },
        isInteger: function() {
            return (new RegExp(/^\d+$/).test(this))
        },
        isNumber: function() {
            return (new RegExp(/^([-]{0,1}(\d+)[\.]+(\d+))|([-]{0,1}(\d+))$/).test(this))
        },
        isNormalID: function() {
            return (new RegExp(/^[a-zA-Z][0-9a-zA-Z_-]*$/).test(this))
        },
        includeChinese: function() {
            return (new RegExp(/[\u4E00-\u9FA5]/).test(this))
        },
        trim: function() {
            return $.trim(this)
        },
        startsWith: function (pattern) {
            return this.indexOf(pattern) === 0
        },
        endsWith: function(pattern) {
            var d = this.length - pattern.length
            return d >= 0 && this.lastIndexOf(pattern) === d
        },
        replaceSuffix: function(index) {
            return this.replace(/\[[0-9]+\]/,'['+index+']').replace('#index#',index)
        },
        replaceSuffix2: function(index) {
            return this.replace(/\-(i)([0-9]+)$/, '-i'+ index).replace('#index#', index)
        },
        trans: function() {
            return this.replace(/&lt;/g, '<').replace(/&gt;/g,'>').replace(/&quot;/g, '"')
        },
        encodeTXT: function() {
            return (this).replaceAll('&', '&amp;').replaceAll('<','&lt;').replaceAll('>', '&gt;').replaceAll(' ', '&nbsp;')
        },
        replaceAll: function(os, ns) {
            return this.replace(new RegExp(os, 'gm'), ns)
        },
        /*替换占位符为对应选择器的值*/ //{^(.|\#)[A-Za-z0-9_-\s]*}
        replacePlh: function($box) {
            $box = $box || $(document)
            return this.replace(/{\/?[^}]*}/g, function($1) {
                var $input = $box.find($1.replace(/[{}]+/g, ''))
                
                return $input && $input.val() ? $input.val() : $1
            })
        },
        replaceMsg: function(holder) {
            return this.replace(new RegExp('({.*})', 'g'), holder)
        },
        replaceTm: function($data) {
            if (!$data) return this
            
            return this.replace(RegExp('({[A-Za-z_]+[A-Za-z0-9_-]*})','g'), function($1) {
                return $data[$1.replace(/[{}]+/g, '')]
            })
        },
        replaceTmById: function(_box) {
            var $parent = _box || $(document)
            
            return this.replace(RegExp('({[A-Za-z_]+[A-Za-z0-9_-]*})','g'), function($1) {
                var $input = $parent.find('#'+ $1.replace(/[{}]+/g, ''))
                return $input.val() ? $input.val() : $1
            })
        },
        isFinishedTm: function() {
            return !(new RegExp('{\/?[^}]*}').test(this))
        },
        skipChar: function(ch) {
            if (!this || this.length===0) return ''
            if (this.charAt(0)===ch) return this.substring(1).skipChar(ch)
            return this
        },
        isValidPwd: function() {
            return (new RegExp(/^([_]|[a-zA-Z0-9]){6,32}$/).test(this))
        },
        isValidMail: function() {
            return(new RegExp(/^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+$/).test(this.trim()))
        },
        isSpaces: function() {
            for (var i = 0; i < this.length; i += 1) {
                var ch = this.charAt(i)
                
                if (ch!=' '&& ch!='\n' && ch!='\t' && ch!='\r') return false
            }
            return true
        },
        isPhone:function() {
            return (new RegExp(/(^([0-9]{3,4}[-])?\d{3,8}(-\d{1,6})?$)|(^\([0-9]{3,4}\)\d{3,8}(\(\d{1,6}\))?$)|(^\d{3,8}$)/).test(this))
        },
        isUrl:function() {
            return (new RegExp(/^[a-zA-z]+:\/\/([a-zA-Z0-9\-\.]+)([-\w .\/?%&=:]*)$/).test(this))
        },
        isExternalUrl:function() {
            return this.isUrl() && this.indexOf('://'+ document.domain) == -1
        },
        toBool: function() {
            return (this.toLowerCase() === 'true') ? true : false
        },
        toJson: function() {
            var json = this
            
            try {
                if (typeof json === 'object') json = json.toString()
                if (!json.trim().match("^\{(.+:.+,*){1,}\}$")) return this
                else return JSON.parse(this)
            } catch (e) {
                return this
            }
        },
        toObj: function() {
            var obj = null
            
            try {
                obj = (new Function('return '+ this))()
            } catch (e) {
                obj = this
                BJUI.debug('String toObj：Parse "String" to "Object" error! Your str is: '+ this)
            }
            return obj
        },
        /**
         * String to Function
         * 参数(方法字符串或方法名)： 'function(){...}' 或 'getName' 或 'USER.getName' 均可
         * Author: K'naan
         */
        toFunc: function() {
            if (!this || !this.length) return undefined
            
            if (this.startsWith('function')) {
                return (new Function('return '+ this))()
            }
            
            try {
                var m_arr = this.split('.'), fn = window
                
                for (var i = 0; i < m_arr.length; i++) {
                    fn = fn[m_arr[i]]
                }
                
                if (typeof fn === 'function') {
                    return fn
                }
            } catch (e) {
                return undefined
            }
        }
    })
    
    /* Function */
    $.extend(Function.prototype, {
        //to fixed String.prototype -> toFunc
        toFunc: function() {
            return this
        }
    })
    
    /* Array */
    $.extend(Array.prototype, {
        remove: function(index) {
            if (index < 0) return this
            else return this.slice(0, index).concat(this.slice(index + 1, this.length))
        },
        swap: function(indexA, indexB) {
            var arr = this, temp = arr[indexA]
            
            arr[indexA] = arr[indexB]
            arr[indexB] = temp
            
            return this
        },
        move: function(old_index, new_index) {
            if (old_index < 0 || new_index < 0)
                return this
            
            if (new_index >= this.length) {
                var k = new_index - this.length
                
                while ((k--) + 1) {
                    this.push(undefined)
                }
            }
            
            this.splice(new_index, 0, this.splice(old_index, 1)[0])
            
            return this
        },
        // move continuous item
        moveItems: function(startIndex, newIndex, len) {
            if (!len || newIndex == startIndex) return this
            
            var moveArr = this.slice(startIndex, startIndex + len)
            
            if (startIndex > newIndex)
                this.splice(startIndex, len)
                
            this.splice.apply(this, [newIndex, 0].concat(moveArr))
            
            if (startIndex < newIndex)
                this.splice(startIndex, len)
            
            return this
        },
        unique: function() {
            var temp = new Array()
            
            this.sort()
            for (var i = 0; i < this.length; i++) {
                if (this[i] == this[i + 1]) continue
                temp[temp.length] = this[i]
            }
            
            return temp
        },
        myIndexOf: function(e) {
            if (!this || !this.length) return -1
            
            for (var i = 0, j; j = this[i]; i++) {
                if (j == e) return i
            }
            
            return -1
        },
        /* serializeArray to json */
        toJson: function() {
            var o = {}
            var a = this
            
            $.each(a, function () {
                if (o[this.name] !== undefined) {
                    if (!o[this.name].push) {
                        o[this.name] = [o[this.name]]
                    }
                    o[this.name].push(this.value || '')
                } else {
                   o[this.name] = this.value || ''
                }
            })
            
            return o
        }
    })
    
    /* Global */
    $.isJson = function(obj) {
        var flag = true
        
        try {
            flag = $.parseJSON(obj)
        } catch (e) {
            return false
        }
        return flag ? true : false
    }
    
}(jQuery);
/*!
 * B-JUI  v1.3 beta2 (http://b-jui.com)
 * Git@OSC (http://git.oschina.net/xknaan/B-JUI)
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 */

/* ========================================================================
 * B-JUI: bjui-basedrag.js  v1.3 beta2
 * @author K'naan
 * http://git.oschina.net/xknaan/B-JUI/blob/master/BJUI/js/bjui-basedrag.js
 * ========================================================================
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 * ======================================================================== */

+function ($) {
    'use strict';

    // BASEDRAG CLASS DEFINITION
    // ======================
    
    var Basedrag = function(element, options) {
        this.$element = $(element)
        this.options  = options
        this.tools    = this.TOOLS()
    }
    
    Basedrag.prototype.TOOLS = function() {
        var tools = {
            isOver: function($drop, x, y) {
                var offset = $drop.offset(),
                    left   = offset.left,
                    top    = offset.top,
                    width  = $drop.outerWidth(),
                    height = $drop.outerHeight()
                
                return (x > left && x < (left + width)) && (y > top && y < (top + height))
            },
            mouseDirection: function (element, opts) {
                var $element = $(element), dirs = ['top', 'right', 'bottom', 'left']
                var calculate = function (e) {
                    var w = $element.outerWidth(),
                        h = $element.outerHeight(),
                        offset = $element.offset(),
                        x = (e.pageX - offset.left - (w / 2)) * (w > h ? (h / w) : 1),
                        y = (e.pageY - offset.top - (h / 2)) * (h > w ? (w / h) : 1)
                    
                    return Math.round((((Math.atan2(y, x) * (180 / Math.PI)) + 180) / 90) + 3) % 4
                }
                
                //enter leave代表鼠标移入移出时的回调
                opts = $.extend({}, {
                    move: $.noop
                }, opts || {})
                
                var r = calculate(opts.e)
                
                opts.move($element, dirs[r])
                /*
                $element.off('mouseenter.basedrag.direction').on('mouseenter.basedrag.direction', function (e) {
                    var r = calculate(e)
                    
                    opts.enter($element, dirs[r])
                }).off('mouseleave.basedrag.direction').on('mouseleave.basedrag.direction', function (e) {
                    var r = calculate(e)
                    
                    opts.leave($element, dirs[r])
                })*/
            }
        }
        
        return tools
    }
    
    Basedrag.prototype.init = function() {
        var that = this
        
        that.$drag = this.$element
        that.options.$obj = this.$element
        if (that.options.obj) this.options.$obj = this.options.obj
        if (that.options.event) {
            that.hasEvent = true
            that.start(this.options.event)
        } else {
            if (that.options.selector)
                that.$drag = that.$element.find(that.options.selector)
                
            if (that.$drag.length) {
                that.$drag.on('mousedown', function(e) {
                    that.start.apply(that, [e])
                    that.options.event = e
                })
            }
        }
    }
    
    Basedrag.prototype.start = function(e) {
        $(document).on('selectstart', false)
        var that = this, options = that.options
        
        if (options.exclude) {
            var $exclude = that.$element.find(options.exclude)
            
            if ($exclude.length && $.inArray(e.target, $exclude.add($exclude.find('*'))) != -1) {
                return false
            }
        }
        
        if (this.$element.css('position') === 'static') {
            this.$element.css('position', 'absolute')
            !options.oleft && (options.oleft = this.$element.position().left)
            !options.otop  && (options.otop  = this.$element.position().top)
            this.$element.css('position', '')
        }
        if (!options.oleft) options.oleft = parseInt(this.$element.css('left')) || 0
        if (!options.otop)  options.otop  = parseInt(this.$element.css('top')) || 0
        
        $(document)
            .on('mouseup.bjui.basedrag', function(e) { that.stop.apply(that, [e]) })
            .on('mousemove.bjui.basedrag', function(e) { that.drag.apply(that, [e]) })
    }
    
    Basedrag.prototype.drop = function(e) {
        var that = this, options = that.options, $drop = options.drop
        
        if (!$drop instanceof jQuery)
            $drop = $($drop)
        
        if ($drop.length) {
            that.$drops = $drop
            $drop.each(function() {
                if (that.tools.isOver($(this), e.pageX, e.pageY)) {
                    $(this).trigger('dropover.bjui.basedrag', [e.pageX, e.pageY, that.$element])
                    
                    that.isDrop = true
                    that.$drop  = $(this)
                    
                    return false
                } else {
                    $(this).trigger('dropout.bjui.basedrag', [e.pageX, e.pageY, that.$element])
                    that.isDrop = false
                }
            }).css('-moz-user-select', 'none')
        }
    }
    
    Basedrag.prototype.drag = function(e) {
        if (!e) e = window.event
        
        BJUI['bjui.basedrag'] = this.$element
        
        var that       = this,
            options    = this.options,
            beforeDrag = options.beforeDrag,
            trData     = options.treeData,      // only for drop Datagrid
            dataIndex  = this.$element.index(), // only for drop Datagrid
            left       = options.oleft + (e.pageX - options.event.pageX),
            top        = options.otop + (e.pageY - options.event.pageY)
        
        if (beforeDrag && typeof beforeDrag === 'string')
            beforeDrag = beforeDrag.toFunc()
        if (beforeDrag && typeof beforeDrag === 'function') {
            if (this.$element.next().hasClass('datagrid-child-tr'))
                dataIndex = dataIndex / 2
            
            if (!beforeDrag.apply(this, [this.$element, (trData ? trData[dataIndex] : '')])) {
                return false
            }
        }
        
        if (options.drop) options.move = ''
        //if (top < 1) top = 0
        if (options.move === 'horizontal') {
            if ((options.minW && left >= parseInt(this.options.$obj.css('left')) + options.minW) && (options.maxW && left <= parseInt(this.options.$obj.css('left')) + options.maxW)) {
                this.$element.css('left', left)
            } else if (options.scop) {
                if (options.relObj) {
                    if ((left - parseInt(options.relObj.css('left'))) > options.cellMinW)
                        this.$element.css('left', left)
                    else
                        this.$element.css('left', left)
                }
            }
        } else if (options.move === 'vertical') {
            this.$element.css('top', top)
        } else {
            var $selector = options.selector ? this.options.$obj.find(options.selector) : this.options.$obj
            
            if (options.drop) {
                var $placeholder = $('#bjui-drag-placeholder')
                
                if (!$placeholder.length)
                    $placeholder = $('<div style="position:absolute; z-index:999;" id="bjui-drag-placeholder"></div>').appendTo($('body'))
                    
                $placeholder.css({left:e.pageX, top:e.pageY, opacity:1}).show().empty().append(this.$element.clone())
                
                this.$placeholder = $placeholder
            } else {
                this.$element.css({left:left, top:top})
            }
        }
        if (options.drag)
            options.drag.apply(this.$element, [this.$element, e, left, top])
        
        if (options.drop) {
            that.drop(e)
        }
        if (options.container) {
            if (!options.container instanceof jQuery)
                options.container = $(options.container)
            
            var scrollTop = options.container.scrollTop()
            
            if (!scrollTop) {
                options.container.scrollTop(1)
            }
            if (options.container.scrollTop()) {
                that.tools.mouseDirection(options.container, {
                    e: e,
                    move: function ($element, dir) {
                        if (dir === 'top' || dir === 'bottom') {
                            options.container.scrollTop(options.container.scrollTop() + (e.clientY - options.event.clientY) / 13)
                        }
                    }
                })
            }
        }
        
        return this.preventEvent(e)
    }
    
    Basedrag.prototype.stop = function(e) {
        var that = this
        
        $(document).off('mousemove.bjui.basedrag').off('mouseup.bjui.basedrag').off('mouseover.bjui.basedrag')
        
        that.options.drop && that.options.drop.off('mouseenter.bjui.basedrag')
        
        if (this.options.stop)
            this.options.stop.apply(this.$element, [this.$element, e])
        
        if (this.hasEvent)
            this.destroy()
        else {
            that.$drag.off('mousedown').on('mousedown', $.proxy(function(e) {
                that.options.event = e
                that.options.oleft = 0
                that.options.otop  = 0
                
                that.start(e)
            }, that))
        }
        
        if (that.options.drop && !that.isDrop) {
            var offset = that.$element.offset()
            
            that.$placeholder && that.$placeholder.animate({top:offset.top, left:offset.left, opacity:0.2}, 'normal', function() {
                that.$placeholder.hide()
            })
        }
        if (that.isDrop) {
            that.$placeholder && that.$placeholder.hide()
            that.$drop && that.$drop.trigger('drop.bjui.basedrag', [that.$element])
        }
        
        that.$drops && that.$drops.css('-moz-user-select', '')
        $(document).off('selectstart')
        return this.preventEvent(e)
    }
    
    Basedrag.prototype.preventEvent = function(e) {
        if (e.stopPropagation) e.stopPropagation()
        if (e.preventDefault) e.preventDefault()
        return false
    }
    
    Basedrag.prototype.destroy = function() {
        this.$element.removeData('bjui.basedrag')
        if (!this.options.nounbind) this.$element.off('mousedown')
    }
    
    // BASEDRAG PLUGIN DEFINITION
    // =======================
    
    function Plugin(option) {
        var args     = arguments
        var property = option
        
        return this.each(function () {
            var $this   = $(this)
            var options = $.extend({}, $this.data(), typeof option === 'object' && option)
            var data    = $this.data('bjui.basedrag')
            
            if (!data) $this.data('bjui.basedrag', (data = new Basedrag(this, options)))
            if (typeof property === 'string' && $.isFunction(data[property])) {
                [].shift.apply(args)
                if (!args) data[property]()
                else data[property].apply(data, args)
            } else {
                data.init()
            }
        })
    }

    var old = $.fn.basedrag

    $.fn.basedrag             = Plugin
    $.fn.basedrag.Constructor = Basedrag
    
    // BASEDRAG NO CONFLICT
    // =================
    
    $.fn.basedrag.noConflict = function () {
        $.fn.basedrag = old
        return this
    }
    
}(jQuery);
/*!
 * B-JUI  v1.3 beta2 (http://b-jui.com)
 * Git@OSC (http://git.oschina.net/xknaan/B-JUI)
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 */

/* ========================================================================
 * B-JUI: bjui-sidenav.js  v1.3 beta2
 * @author K'naan
 * http://git.oschina.net/xknaan/B-JUI/blob/master/BJUI/js/bjui-sidenav.js
 * ========================================================================
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 * ======================================================================== */

+function ($) {
    'use strict';
    
    // SLIDEBAR CLASS DEFINITION
    // ======================
    
    var Sidenav = function(element, options) {
        this.$element = $(element)
        this.options  = options
    }
    
    Sidenav.prototype.ajaxHnav = function() {
        var that = this, options = that.options, childKey = options.childKey || 'children', $li = that.$element.parent(), $box = $('#bjui-sidenav-box'), html = BJUI.StrBuilder(),
            $sidenavbtn = $('#bjui-sidenav-btn')
        var createA = function(data) {
            var liHtml = BJUI.StrBuilder(), target = data.target || 'navtab'
            
            liHtml.add('<a href="'+ (data.url || 'javascript:;') +'" ')
            
            if (data.url && (target === 'dialog' || target === 'navtab')) {
                liHtml.add('data-toggle="'+ target +'" data-options="{id:\''+ data.id +'\', title:\''+ (data.title || data.name) +'\'')
                
                if (data.width)  liHtml.add(', width:'+ data.width)
                if (data.height) liHtml.add(', height:'+ data.height)
                if (data.fresh)  liHtml.add(', fresh:'+ data.fresh)
                if (data.mask)   liHtml.add(', mask:'+ data.mask)
                
                liHtml.add('}"')
            } else if (data.url)
                liHtml.add('target="'+ target +'"')
            
            if (data[childKey])
                liHtml.add(' class="right-arrow"')
            
            liHtml.add('><i class="fa fa-'+ (data.icon || 'caret-right') +'"></i>&nbsp;'+ data.name)
            
            if (data[childKey])
                liHtml.add('<b><i class="fa fa-angle-right"></i></b>')
            
            liHtml
                .add('</a>')
                .add(createChild(data))
            
            return liHtml.toString()
        }
        var createChild = function(data) {
            var childHtml = BJUI.StrBuilder()
            
            if (data[childKey]) {
                childHtml.add('<ul class="nav">')
                
                $.each(data[childKey], function(i, m) {
                    var target = m.target || 'navtab', id = m.id && String(m.id).isNormalID && m.id
                    
                    childHtml.add('<li')
                    
                    if (target === 'navtab' && id && m.url)
                        childHtml.add(' class="'+ target +'-'+ id +'"')
                    
                    childHtml
                        .add('>')
                        .add(createA(m))
                        .add('</li>')
                })
                
                childHtml.add('</ul>')
            }
            
            return childHtml.toString()
        }
        var okCallback = function(json) {
            if (!$.isArray(json)) {
                json = [json]
            }
            
            html.add('<ul class="nav">')
            
            $.each(json, function(i, n) {
                var target = n.target || 'navtab', id = n.id && String(n.id).isNormalID && n.id
                
                html.add('<li')
                
                if (target === 'navtab' && id && n.url)
                    html.add(' class="'+ target +'-'+ id +'"')
                
                html.add('>')
                    .add(createA(n))
                    .add('</li>')
            })
            
            html.add('</ul>')
            
            $box.html(html.toString())
                .off('click').on('click', '.nav > li > a', function(e) {
                    var $this = $(this), $nav = $this.next('.nav'), $li = $this.closest('li'), $other = $li.siblings()
                    
                    if ($nav.length) {
                        $nav.stop().slideToggle(function() {
                            $li.toggleClass('open', $nav.is(':visible'))
                        })
                        
                        if (!$li.hasClass('open')) {
                            $other.find('> .nav').stop().slideUp(function() {
                                $(this).closest('li').removeClass('open')
                            })
                        }
                    }
                })
            
            $li.data('bjui.sidenav.hnav.panels', $box.find('> ul'))
            
            $(document).on('switch.bjui.navtab', function(e) {
                var datas = $('body').data('bjui.navtab'), $lis
                
                if (datas && datas.current) {
                    $box.find('li').removeClass('active').filter('.navtab-'+ datas.current).addClass('active')
                }
            })
            
            if (BJUI.ui.displayFirst)
                $box.find('> .nav > li:first > a').trigger('click')
            
            !$('body').data('bjui.sidenav.init') && $sidenavbtn.is(':visible') && ($sidenavbtn.trigger('click'))
        }
        var treeCallback = function(json) {
            var single = (typeof options.single === 'undefined' || single), $ul, html = BJUI.StrBuilder()
            
            $box.empty()
            
            if (single) {
                $ul = 
                    $('<ul class="ztree" data-toggle="ztree" id="bjui-sidenav-ztree-0"></ul>')
                    .data('options', options.treeOptions)
                    .data('nodes', json)
                
                $box.append($ul).initui()
            } else {
                if (!$.isArray(json))
                    json = [json]
                
                $.each(json, function(i, n) {
                    $ul = 
                        $('<ul class="ztree" data-toggle="ztree" id="bjui-sidenav-ztree-'+ i +'"></ul>')
                        .data('options', options.treeOptions)
                        .data('nodes', json)
                    
                    $box.append($ul)
                })
                
                $box.initui()
            }
            
            !$('body').data('bjui.sidenav.init') && $sidenavbtn.is(':visible') && ($sidenavbtn.trigger('click'))
        }
        
        BJUI.ajax('doajax', {
            url         : options.url,
            loadingmask : false,
            target      : $box,
            okCallback  : options.tree ? treeCallback : okCallback
        })
    }
    
    Sidenav.prototype.initHnav = function() {
        var that = this, options = that.options, childKey = options.childKey || 'children', targetKey = options.targetKey || 'target', idKey = options.idKey || 'id',
            $li = that.$element.parent(), $box = $('#bjui-sidenav-box'), $sidenavbtn = $('#bjui-sidenav-btn'),
            html = BJUI.StrBuilder(), json
        var createA = function(data) {
            if (!data) data = {}
            
            var liHtml = BJUI.StrBuilder(), target = data[targetKey] || 'navtab'
            
            liHtml.add('<a href="'+ (data.url || 'javascript:;') +'" ')
            
            if (data.url && (target === 'dialog' || target === 'navtab')) {
                liHtml.add('data-toggle="'+ target +'" data-options="{id:\''+ data[idKey] +'\', title:\''+ (data.title || data.name) +'\'')
                
                if (data.width)  liHtml.add(', width:'+ data.width)
                if (data.height) liHtml.add(', height:'+ data.height)
                if (data.fresh)  liHtml.add(', fresh:'+ data.fresh)
                if (data.mask)   liHtml.add(', mask:'+ data.mask)
                
                liHtml.add('}"')
            } else if (data.url)
                liHtml.add('target="'+ target +'"')
            
            if (data[childKey])
                liHtml.add(' class="right-arrow"')
            
            liHtml.add('><i class="fa fa-'+ (data.icon || 'caret-right') +'"></i>&nbsp;'+ data.name)
            
            if (data[childKey])
                liHtml.add('<b><i class="fa fa-angle-right"></i></b>')
            
            liHtml
                .add('</a>')
                .add(createChild(data))
            
            return liHtml.toString()
        }
        
        var createChild = function(data) {
            var childHtml = BJUI.StrBuilder()
            
            if (data[childKey]) {
                childHtml.add('<ul class="nav">')
                
                $.each(data[childKey], function(i, m) {
                    var target = m.target || 'navtab', id = m[idKey] && String(m[idKey]).isNormalID && m[idKey]
                    
                    childHtml.add('<li')
                    
                    if (target === 'navtab' && id && m.url)
                        childHtml.add(' class="'+ target +'-'+ id +'"')
                    
                    childHtml
                        .add('>')
                        .add(createA(m))
                        .add('</li>')
                })
                
                childHtml.add('</ul>')
            }
            
            return childHtml.toString()
        }
        var okCallback = function(json) {
            if (!$.isArray(json)) {
                json = [json]
            }
            
            html.add('<ul class="nav">')
            
            $.each(json, function(i, n) {
                var target = n.target || 'navtab', id = n[idKey] && String(n[idKey]).isNormalID && n[idKey]
                
                html.add('<li')
                
                if (target === 'navtab' && id && n.url)
                    html.add(' class="'+ target +'-'+ id +'"')
                
                html.add('>')
                    .add(createA(n))
                    .add('</li>')
            })
            
            html.add('</ul>')
            
            $box.html(html.toString())
                .off('click').on('click', '.nav > li > a', function(e) {
                    var $this = $(this), $nav = $this.next('.nav'), $li = $this.closest('li'), $other = $li.siblings()
                    
                    if ($nav.length) {
                        $nav.stop().slideToggle(function() {
                            $li.toggleClass('open', $nav.is(':visible'))
                        })
                        
                        if (!$li.hasClass('open')) {
                            $other.find('> .nav').stop().slideUp(function() {
                                $(this).closest('li').removeClass('open')
                            })
                        }
                    }
                })
            
            $li.data('bjui.sidenav.hnav.panels', $box.find('> ul'))
            
            $(document).on('switch.bjui.navtab', function(e) {
                var datas = $('body').data('bjui.navtab'), $lis
                
                if (datas && datas.current) {
                    $box.find('li').removeClass('active').filter('.navtab-'+ datas.current).addClass('active')
                }
            })
            
            if (BJUI.ui.displayFirst)
                $box.find('> .nav > li:first > a').trigger('click')
            
            !$('body').data('bjui.sidenav.init') && $sidenavbtn.is(':visible') && ($sidenavbtn.trigger('click'))
        }
        var treeCallback = function(json) {
            var single = (typeof options.single === 'undefined' || single), $ul, html = BJUI.StrBuilder()
            
            $box.empty()
            
            if (single) {
                $ul = 
                    $('<ul class="ztree" data-toggle="ztree" id="bjui-sidenav-ztree-0"></ul>')
                    .data('options', options.treeOptions)
                    .data('nodes', json)
                
                $box.append($ul).initui()
            } else {
                if (!$.isArray(json))
                    json = [json]
                
                $.each(json, function(i, n) {
                    $ul = 
                        $('<ul class="ztree" data-toggle="ztree" id="bjui-sidenav-ztree-'+ i +'"></ul>')
                        .data('options', options.treeOptions)
                        .data('nodes', json)
                    
                    $box.append($ul)
                })
                
                $box.initui()
            }
            
            !$('body').data('bjui.sidenav.init') && $sidenavbtn.is(':visible') && ($sidenavbtn.trigger('click'))
        }
        
        json = that.$element.next('.items').html()
        if (json) {
            json = $.parseJSON(json)
            options.tree ? treeCallback(json) : okCallback(json)
        }
    }
    
    // SLIDEBAR PLUGIN DEFINITION
    // =======================
    
    function Plugin(option) {
        var args     = arguments
        var property = option
        
        return this.each(function () {
            var $this   = $(this)
            var options = $.extend({}, $this.data(), typeof option === 'object' && option)
            var data    = $this.data('bjui.sidenav')
            
            if (!data) $this.data('bjui.sidenav', (data = new Sidenav(this, options)))
            
            if (typeof property === 'string' && $.isFunction(data[property])) {
                [].shift.apply(args)
                if (!args) data[property]()
                else data[property].apply(data, args)
            }
        })
    }

    var old = $.fn.sidenav

    $.fn.sidenav             = Plugin
    $.fn.sidenav.Constructor = Sidenav
    
    // SLIDEBAR NO CONFLICT
    // =================
    
    $.fn.basedrag.noConflict = function () {
        $.fn.sidenav = old
        return this
    }
    
    // SLIDEBAR DATA-API
    // ==============
    $(function() {
        $('#bjui-sidenav-col').on('click.bjui.sidenav', '.nav > li > a', function() {
            var $this = $('#bjui-sidenav-col')
            
            if ($(this).hasClass('right-arrow'))
                return false
            
            if ($this.hasClass('autohide'))
                $('#bjui-sidenav-arrow').trigger('click')
        })
    })
    
    $(document).on('click.bjui.sidenav.data-api', '[data-toggle="sidenav"]', function(e) {
        e.preventDefault()
        
        var $body = $('body'), $this = $(this), href = $this.data('url') || $this.attr('href'), cache = $this.data('cache'),
            $li   = $(this).parent(), $box = $('#bjui-sidenav-box'), $panels = $li.data('bjui.sidenav.hnav.panels')
        
        if (typeof $body.data('bjui.sidenav.init') === 'undefined')
            $body.data('bjui.sidenav.init', true)
        else
            $body.data('bjui.sidenav.init', false)
        
        $li.addClass('active').siblings().removeClass('active')
        
        if (href && !(href.startsWith('#') || href.startsWith('javascript'))) {
            if (cache && $panels && $panels.length) {
                $box.append($panels)
            } else {
                $this.data('url', href)
                Plugin.call($this, 'ajaxHnav')
            }
        } else {
            $box.find('> .nav').detach()
            
            if ($panels && $panels.length) {
                $box.append($panels)
            } else {
                Plugin.call($this, 'initHnav')
            }
        }
    })
    
}(jQuery);
/*!
 * B-JUI  v1.3 beta2 (http://b-jui.com)
 * Git@OSC (http://git.oschina.net/xknaan/B-JUI)
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 */

/* ========================================================================
 * B-JUI: bjui-contextmenu.js  v1.3 beta2
 * @author K'naan
 * http://git.oschina.net/xknaan/B-JUI/blob/master/BJUI/js/bjui-contextmenu.js
 * ========================================================================
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 * ======================================================================== */

+function ($) {
    'use strict';
    
    // CONTEXTMENU GLOBAL ELEMENTS
    // ======================
    
    var $menu, $shadow, hash
    
    $(function() {
        var INIT_CONTEXTMENU = function() {
            $menu   = $('<div id="bjui-contextmenu"></div>').hide()
            $shadow = $('<div id="bjui-contextmenuShadow"></div>').hide()
            hash    = []
            
            $('body').append('<!-- contextmenu -->').append($menu).append($shadow)
        }
        
        INIT_CONTEXTMENU()
    })
    
    // CONTEXTMENU CLASS DEFINITION
    // ======================
    var Contextmenu = function(element, options) {
        this.$element = $(element)
        this.options  = options
    }
    
    Contextmenu.DEFAULTS = {
        id       : undefined,
        shadow   : true,
        bindings : {},
        ctrSub   : null
    }
    
    Contextmenu.prototype.init = function() {
        var that  = this
        var op    = this.options
        
        if (!op.id) return
        hash.push({
            id       : op.id,
            shadow   : op.shadow,
            bindings : op.bindings || {},
            ctrSub   : op.ctrSub
        })
        
        var index = hash.length - 1
        
        this.$element.on('contextmenu', function(e) {
            that.display(index, this, e, op)
            return false
        })
    }
    
    Contextmenu.prototype.display = function(index, trigger, e, options) {
        var that    = this
        var cur     = hash[index]
        var cp      = BJUI.regional[cur.id]
        var content = FRAG[cur.id]
        
        $.each(cp, function(i, n) {
            content = content.replace('#'+ i +'#', cp[i])
        })
        
        // Send the content to the menu
        $menu.html(content)
        $.each(cur.bindings, function(id, func) {
            $('[rel="'+ id +'"]', $menu).on('click', function(e) {
                that.hide()
                func($(trigger), $('#bjui-'+ cur.id))
            })
        })
        
        var posX = e.pageX
        var posY = e.pageY
        
        if ($(window).width() < posX + $menu.width())   posX -= $menu.width()
        if ($(window).height() < posY + $menu.height()) posY -= $menu.height()
        
        $menu.css({'left':posX, 'top':posY}).show()
        if (cur.shadow)
            $shadow.css({width:$menu.width(), height:$menu.height(), left:posX + 3, top:posY + 3}).show()
        $(document).one('click', that.hide)
        
        if ($.isFunction(cur.ctrSub))
            cur.ctrSub($(trigger), $('#bjui-'+ cur.id))
    }
    
    Contextmenu.prototype.hide = function() {
        $menu.hide()
        $shadow.hide()
    }
    
    /* Custom contextmenu */
    Contextmenu.prototype.show = function(options) {
        var that = this
        
        if (options.items && options.items.length) {
            that.$element.on('contextmenu', function(e) {
                var isShow = true
                
                /*exclude*/
                if (options.exclude) {
                    that.$element.find(options.exclude).each(function() {
                        if (this == e.target || $(this).find(e.target).length) {
                            isShow = false
                            return
                        }
                    })
                }
                
                if (!isShow) {
                    e.stopPropagation()
                    return !isShow
                } else {
                    that.custom(options.items, e)
                }
                
                return false
            })
        }
    }
    
    Contextmenu.prototype.custom = function(items, e) {
        $menu.empty().html('<ul></ul>')
        
        var that    = this
        var options = that.options
        var $ul     = $menu.find('> ul'), $li
        
        $.each(items, function(i, n) {
            var icon = ''
            
            if (n.icon) icon = '<i class="fa fa-'+ n.icon +'"></i>'
            if (n.title == 'diver') {
                $li = $('<li class="diver"></li>')
            } else {
                $li = $('<li><span class="icon">'+ icon +'</span><span class="title">'+ n.title +'</span></li>')
                if (n.func && typeof n.func === 'string') n.func = n.func.toFunc()
                if (n.func) {
                    $li.on('click', function(evt) {
                        that.hide()
                        n.func(that.$element, $li)
                    })
                }
            }
            $li.appendTo($ul)
        })
        
        var posX = e.pageX
        var posY = e.pageY
        
        if ($(window).width() < posX + $menu.width())   posX -= $menu.width()
        if ($(window).height() < posY + $menu.height()) posY -= $menu.height()
        
        $menu.css({'left':posX, 'top':posY}).show()
        
        if (options.shadow)
            $shadow.css({width:$menu.width(), height:$menu.height(), left:posX + 3, top:posY + 3}).show()
        
        $(document).one('click', that.hide)
    }
    
    // CONTEXTMENU PLUGIN DEFINITION
    // =======================
    
    function Plugin(option) {
        var args     = arguments
        var property = option
        
        return this.each(function () {
            var $this   = $(this)
            var options = $.extend({}, Contextmenu.DEFAULTS, $this.data(), typeof option === 'object' && option)
            var data    = $this.data('bjui.contextmenu')
            
            if (!data) $this.data('bjui.contextmenu', (data = new Contextmenu(this, options)))
            if (typeof property === 'string' && $.isFunction(data[property])) {
                [].shift.apply(args)
                if (!args) data[property]()
                else data[property].apply(data, args)
            } else {
                data.init()
            }
        })
    }

    var old = $.fn.contextmenu

    $.fn.contextmenu             = Plugin
    $.fn.contextmenu.Constructor = Contextmenu
    
    // CONTEXTMENU NO CONFLICT
    // =================
    
    $.fn.contextmenu.noConflict = function () {
        $.fn.contextmenu = old
        return this
    }
    
}(jQuery);
/*!
 * B-JUI  v1.3 beta2 (http://b-jui.com)
 * Git@OSC (http://git.oschina.net/xknaan/B-JUI)
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 */

/* ========================================================================
 * B-JUI: bjui-navtab.js  v1.3 beta2
 * @author K'naan
 * http://git.oschina.net/xknaan/B-JUI/blob/master/BJUI/js/bjui-navtab.js
 * ========================================================================
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 * ======================================================================== */

+function ($) {
    'use strict';
    
    // NAVTAB GLOBAL ELEMENTS
    // ======================
    
    var currentIndex, $currentTab, $currentPanel, $box, $tabs, $panels, $prevBtn, $nextBtn, $moreBtn, $moreBox, $main, $mainLi,
        autorefreshTimer
    
    $(function() {
        var INIT_NAVTAB = function() {
            currentIndex = 0
            $box         = $('#bjui-navtab')
            $tabs        = $box.find('> .tabsPageHeader > .tabsPageHeaderContent > .navtab-tab')
            $panels      = $box.find('> .navtab-panel')
            $prevBtn     = $box.find('> .tabsPageHeader > .tabsLeft')
            $nextBtn     = $box.find('> .tabsPageHeader > .tabsRight')
            $moreBtn     = $box.find('> .tabsPageHeader > .tabsMore')
            $moreBox     = $box.find('> .tabsMoreList')
            $main        = $tabs.find('li:first')
            $mainLi      = $moreBox.find('li:first')
            
            $prevBtn.click(function() { $(this).navtab('scrollPrev') })
            $nextBtn.click(function() { $(this).navtab('scrollNext') })
            $moreBtn.click(function() {
                $moreBox.show()
                
                var hh = $(window).height(), mh = $moreBox.height(), th = $('#bjui-top').height() + $('#bjui-navbar').height(), sh = hh - th - 26
                
                if (sh < mh)
                    $moreBox.height(sh - 10)
                else
                    $moreBox.height('')
            })
            
            $(document).on('click.bjui.navtab.switchtab', function(e) {
                var $target = e.target.tagName == 'I' ? $(e.target).parent() : $(e.target)
                
                if ($moreBtn[0] != $target[0]) $moreBox.hide()
            })
            
            var mainTit, options = $.extend({}, Navtab.DEFAULTS, $main.data(), {id:'main', title:mainTit}), mainTab = new Navtab(options)
            
            $('body').data('bjui.navtab', {main:mainTab, current:'main'})
            
            if ($main.attr('data-url')) {
                $(document).one(BJUI.eventType.initUI, function(e) {
                    $main.removeAttr('data-url').navtab('reload', options)
                })
            }
            
            $main
                .data('options', $.extend({}, options))
                .navtab('contextmenu', $main)
                .click(function() { if (!$(this).hasClass('active')) BJUI.navtab('switchTab', 'main') })
                .find('> a > span').html(function(n, c) { return (mainTit = c.replace('#maintab#', BJUI.regional.maintab)) })
            
            if ($main.attr('data-url')) {
                $(document).one(BJUI.eventType.initUI, function(e) {
                    $main.removeAttr('data-url').navtab('reload', options)
                })
            }
            
            setTimeout(function() {
                $main.trigger('click')
            }, 100)
            
            $mainLi
                .click(function() {
                    if ($(this).hasClass('active')) $moreBox.hide()
                    else BJUI.navtab('switchTab', 'main')
                })
                .find('> a').html(function(n, c) { return c.replace('#maintab#', BJUI.regional.maintab) })
            
            $.CurrentNavtab = $panels.find('> .navtabPage').eq(0)
        }
        
        INIT_NAVTAB()
    })
    
    // NAVTAB CLASS DEFINITION
    // ======================
    
    var Navtab = function(options) {
        this.options  = options
        this.tools    = this.TOOLS()
    }
    
    Navtab.DEFAULTS = {
        id          : null,
        title       : 'New tab',
        url         : null,
        type        : 'GET',
        data        : {},
        loadingmask : true,
        fresh       : false,
        autorefresh : false,
        onLoad      : null,
        beforeClose : null,
        onClose     : null
    }
    
    Navtab.prototype.TOOLS = function() {
        var that = this
        var tools = {
            getDefaults: function() {
                return Navtab.DEFAULTS
            },
            getTabs: function() {
                return $tabs.find('> li')
            },
            getPanels: function() {
                return $panels.find('> div')
            },
            getMoreLi: function() {
                return $moreBox.find('> li')
            },
            getTab: function(tabid) {
                var index = this.indexTabId(tabid)
                
                if (index >= 0) return this.getTabs().eq(index)
            },
            getPanel: function(tabid) {
                var index = this.indexTabId(tabid)
                
                if (index >= 0) return this.getPanels().eq(index)
            },
            getTabsW: function(iStart, iEnd) {
                return this.tabsW(this.getTabs().slice(iStart, iEnd))
            },
            tabsW: function($tabs) {
                var iW = 0
                
                $tabs.each(function() {
                    iW += $(this).outerWidth(true)
                })
                
                return iW
            },
            indexTabId: function(tabid) {
                var iOpenIndex = -1
                
                if (!tabid) return iOpenIndex
                
                this.getTabs().each(function(index) {
                    if ($(this).data('options').id === tabid) {
                        iOpenIndex = index
                        return false
                    }
                })
                
                return iOpenIndex
            },
            getLeft: function() {
                return $tabs.position().left
            },
            getScrollBarW: function() {
                return $box.width() - 55
            },
            visibleStart: function() {
                var $tabs = this.getTabs(), iLeft = this.getLeft(), iW = 0, index = 0
                
                $tabs.each(function(i) {
                    if (iW + iLeft >= 0) {
                        index = i
                        return false
                    }
                    iW += $(this).outerWidth(true)
                })
                
                return index
            },
            visibleEnd: function() {
                var tools = this, $tabs = this.getTabs(), iLeft = this.getLeft(), iW = 0, index = $tabs.length
                
                $tabs.each(function(i) {
                    iW += $(this).outerWidth(true)
                    if (iW + iLeft > tools.getScrollBarW()) {
                        index = i
                        return false
                    }
                })
                
                return index
            },
            scrollPrev: function() {
                var iStart = this.visibleStart()
                
                if (iStart > 0)
                    this.scrollTab(- this.getTabsW(0, iStart - 1))
            },
            scrollNext: function() {
                var iEnd = this.visibleEnd()
                
                if (iEnd < this.getTabs().size())
                    this.scrollTab(- this.getTabsW(0, iEnd + 1) + this.getScrollBarW())
            },
            scrollTab: function(iLeft, isNext) {
                $tabs.animate({ left: iLeft }, 150, function() { that.tools.ctrlScrollBtn() })
            },
            scrollCurrent: function() { // auto scroll current tab
                var iW = this.tabsW(this.getTabs()), scrollW = this.getScrollBarW()
                
                if (iW <= scrollW)
                    this.scrollTab(0)
                else if (this.getLeft() < scrollW - iW)
                    this.scrollTab(scrollW-iW)
                else if (currentIndex < this.visibleStart())
                    this.scrollTab(- this.getTabsW(0, currentIndex))
                else if (currentIndex >= this.visibleEnd())
                    this.scrollTab(scrollW - this.getTabs().eq(currentIndex).outerWidth(true) - this.getTabsW(0, currentIndex))
            },
            ctrlScrollBtn: function() {
                var iW = this.tabsW(this.getTabs())
                
                if (this.getScrollBarW() > iW) {
                    $prevBtn.hide()
                    $nextBtn.hide()
                    $tabs.parent().removeClass('tabsPageHeaderMargin')
                } else {
                    $prevBtn.show().removeClass('tabsLeftDisabled')
                    $nextBtn.show().removeClass('tabsRightDisabled')
                    $tabs.parent().addClass('tabsPageHeaderMargin')
                    if (this.getLeft() >= 0)
                        $prevBtn.addClass('tabsLeftDisabled')
                    else if (this.getLeft() <= this.getScrollBarW() - iW)
                        $nextBtn.addClass('tabsRightDisabled')
                }
            },
            switchTab: function(iTabIndex) {
                var $tab = this.getTabs().removeClass('active').eq(iTabIndex).addClass('active'), $panels = this.getPanels(), $panel = $panels.eq(iTabIndex), onSwitch = that.options.onSwitch ? that.options.onSwitch.toFunc() : null
                var $ajaxBackground = $(FRAG.maskBackground)
                
                $panels.css({top:'-10000000px'})
                
                if ($tab.data('reloadFlag')) {
                    $panel.animate({top:0})
                    that.refresh($tab.data('options').id)
                } else {
                    if ($panel.find('.bjui-ajax-mask').length) {
                        $panel.css({top:0})
                    } else {
                        $panel
                            .css({top:0})
                            .append($ajaxBackground)
                        
                        $ajaxBackground.fadeOut('normal', function() {
                            $(this).remove()
                        })
                    }
                }
                
                this.getMoreLi().removeClass('active').eq(iTabIndex).addClass('active')
                currentIndex = iTabIndex
                this.scrollCurrent()
                $currentTab     = $tab
                $.CurrentNavtab = $currentPanel = $panel
                
                if (onSwitch) onSwitch.apply(that)
                
                // set current to body data
                var datas = $('body').data('bjui.navtab'), id = $tab.data('options').id
                
                if (id !== that.options.id)
                    datas.current = id
                else {
                    datas.current = that.options.id
                }
                
                // events
                $panel.trigger('switch.bjui.navtab')
            },
            closeTab: function(index, openTabid) {
                var $tab        = this.getTabs().eq(index),
                    $more       = this.getMoreLi().eq(index),
                    $panel      = this.getPanels().eq(index),
                    options     = $tab.data('options'),
                    beforeClose = options.beforeClose ? options.beforeClose.toFunc() : null,
                    onClose     = options.onClose ? options.onClose.toFunc() : null,
                    canClose    = true
                
                if (beforeClose) canClose = beforeClose.apply(that, [$panel])
                if (!canClose) {
                    that.tools.switchTab(index)
                    return
                }
                $tab.remove()
                $more.remove()
                $panel.trigger(BJUI.eventType.beforeCloseNavtab).remove()
                
                if (autorefreshTimer) clearInterval(autorefreshTimer)
                if (onClose) onClose.apply(that)
                if (currentIndex >= index) currentIndex--
                if (openTabid) {
                    var openIndex = this.indexTabId(openTabid)
                    
                    if (openIndex > 0) currentIndex = openIndex
                }
                
                // remove from body
                var datas = $('body').data('bjui.navtab')
                
                if (datas[options.id])
                    delete datas[options.id]
                
                this.scrollCurrent()
                this.switchTab(currentIndex)
            },
            closeOtherTab: function(index) {
                index = index || currentIndex
                
                this.getTabs().each(function(i) {
                    if (i > 0 && index != i) $(this).find('> .close').trigger('click')
                })
            },
            loadUrlCallback: function($panel) {
                $panel.find(':button.btn-close').click(function() { that.closeCurrentTab() })
            },
            updateTit: function(index, title) {
                this.getTabs().eq(index).find('> a').attr('title', title).find('> span').html(title)
                this.getMoreLi().eq(index).find('> a').attr('title', title).html(title)
            },
            reload: function($tab, flag) {
                flag = flag || $tab.data('reloadFlag')
                
                var options = $tab.data('options')
                
                if (flag) {
                    $tab.data('reloadFlag', false)
                    var $panel = that.tools.getPanel(options.id)
                    
                    if ($tab.hasClass('external')) {
                        that.openExternal(options.url, $panel, options.data)
                    } else {
                        that.tools.reloadTab($panel, options)
                    }
                }
            },
            reloadTab: function($panel, options) {
                var onLoad = options.onLoad ? options.onLoad.toFunc() : null,
                    arefre = options.autorefresh && (isNaN(String(options.autorefresh)) ? 15 : options.autorefresh)
                
                $panel
                    .trigger(BJUI.eventType.beforeLoadNavtab)
                    .ajaxUrl({
                        type:(options.type || 'GET'), url:options.url, data:options.data || {}, loadingmask:options.loadingmask, callback:function(response) {
                            that.tools.loadUrlCallback($panel)
                            if (onLoad) onLoad.apply(that, [$panel])
                            if (autorefreshTimer) clearInterval(autorefreshTimer)
                            if (arefre) autorefreshTimer = setInterval(function() { $panel.navtab('refresh') }, arefre * 1000)
                            if (BJUI.ui.clientPaging && $panel.data('bjui.clientPaging')) $panel.pagination('setPagingAndOrderby', $panel)
                        }
                    })
            }
        }
        
        return tools
    }
    
    Navtab.prototype.contextmenu = function($obj) {
        var that = this
        
        $obj.contextmenu({
            id: 'navtabCM',
            bindings: {
                reload: function(t, m) {
                    if (t.data('options').url)
                        that.refresh(t.data('options').id)
                },
                closeCurrent: function(t, m) {
                    var tabId = t.data('options').id
                    
                    if (tabId) that.closeTab(tabId)
                    else that.closeCurrentTab()
                },
                closeOther: function(t, m) {
                    if (!t.index()) {
                        that.closeAllTab()
                    } else {
                        var index = that.tools.indexTabId(t.data('options').id)
                        
                        that.tools.closeOtherTab(index > 0 ? index : currentIndex)
                    }
                },
                closeAll: function(t, m) {
                    that.closeAllTab()
                }
            },
            ctrSub: function(t, m) {
                var mReload = m.find('[rel="reload"]'),
                    mCur    = m.find('[rel="closeCurrent"]'),
                    mOther  = m.find('[rel="closeOther"]'),
                    mAll    = m.find('[rel="closeAll"]'),
                    $tabLi  = that.tools.getTabs()
                
                if (!t.index()) {
                    mCur.addClass('disabled')
                    if (!t.data('options').url) mReload.addClass('disabled')
                }
            }
        })
    }
    
    // if found tabid replace tab, else create a new tab.
    Navtab.prototype.openTab = function() {
        var that = this, options = this.options, tools = this.tools, iOpenIndex
        
        if (!options.url && options.href) options.url = options.href
        
        if (!options.url) {
            BJUI.debug('Navtab Plugin: Error trying to open a navtab, url is undefined!')
            return
        } else {
            options.url = decodeURI(options.url).replacePlh()
            
            if (!options.url.isFinishedTm()) {
                $('body').alertmsg('error', (options.warn || BJUI.regional.plhmsg))
                BJUI.debug('Navtab Plugin: The new navtab\'s url is incorrect, url: '+ options.url)
                return
            }
            
            options.url = encodeURI(options.url)
        }
        
        iOpenIndex = options.id ? tools.indexTabId(options.id) : currentIndex
        
        if (iOpenIndex >= 0) {
            var $tab   = tools.getTabs().eq(iOpenIndex),
                $panel = tools.getPanels().eq(iOpenIndex),
                op     = $tab.data('options')
            
            if (options.fresh || options.url != op.url)
                that.reload(options)
            else if (options.title != op.title) {
                op.title = options.title
                tools.updateTit(iOpenIndex, options.title)
            }
            
            currentIndex = iOpenIndex
            
            if (options.id == 'main') {
                this.contextmenu($tab)
            }
        } else {
            var tabFrag = '<li><a href="javascript:" title="#title#"><span>#title#</span></a><span class="close">&times;</span></li>',
                $tab = $(tabFrag.replaceAll('#title#', options.title)),
                $panel = $('<div class="navtabPage unitBox"></div>'),
                $more  = $('<li><a href="javascript:" title="#title#">#title#</a></li>'.replaceAll('#title#', options.title))
            
            $tab.appendTo($tabs)
            $panel.appendTo($panels)
            $more.appendTo($moreBox)
            
            $tab.data('options', $.extend({}, options))
            
            if (options.external || (options.url && options.url.isExternalUrl())) {
                $tab.addClass('external')
                this.openExternal(options.url, $panel, options.data)
            } else {
                $tab.removeClass('external')
                tools.reloadTab($panel, options)
            }
            
            currentIndex = tools.getTabs().length - 1
            this.contextmenu($tab)
            
            //events
            $tab.on('click', function(e) {
                if (!$(this).hasClass('active'))
                    that.switchTab(options.id)
            }).on('click.bjui.navtab.close', '.close', function(e) {
                that.closeTab(options.id)
            }).on('mousedown.bjui.navtab.drag', 'a', function(e) {
                $tab.data('bjui.navtab.drag', true)
                
                setTimeout($.proxy(function () {
                    if ($tab.data('bjui.navtab.drag')) that.drag(e, $tab, $panel, $more)
                }, that), 150)
                
                e.preventDefault()
            }).on('mouseup.bjui.navtab.drag', 'a', function(e) {
                $tab.data('bjui.navtab.drag', false)
            })
            
            $more.on('click', function() {
                that.switchTab(options.id)
            })
        }
        
        tools.switchTab(currentIndex)
        tools.scrollCurrent()
    }
    
    Navtab.prototype.closeTab = function(tabid) {
        var index = this.tools.indexTabId(tabid)
        
        if (index > 0)
            this.tools.closeTab(index)
    }
    
    Navtab.prototype.closeCurrentTab = function(openTabid) { //openTabid can be empty. close current tab by default, and open the last tab
        if (currentIndex > 0)
            this.tools.closeTab(currentIndex, openTabid)
    }
    
    Navtab.prototype.closeAllTab = function() {
        this.tools.getTabs().find('> .close').trigger('click')
    }
    
    Navtab.prototype.reloadFlag = function(tabids) {
        var arr = tabids.split(',')
        
        for (var i = 0; i < arr.length; i++) {
            var $tab = this.tools.getTab(arr[i].trim())
            
            if ($tab) {
                if (this.tools.indexTabId(arr[i]) == currentIndex) this.tools.reload($tab, true)
                else $tab.data('reloadFlag', true)
            }
        }
    }
    
    Navtab.prototype.switchTab = function(tabid) {
        var index = this.tools.indexTabId(tabid)
        
        this.tools.switchTab(index)
    }
    
    Navtab.prototype.scrollPrev = function() {
        this.tools.scrollPrev()
    }
    
    Navtab.prototype.scrollNext = function() {
        this.tools.scrollNext()
    }
    
    Navtab.prototype.refresh = function(tabid) {
        var $tab, $panel
        
        if (!tabid) {
            $tab = $currentTab
        } else if (typeof tabid === 'string') {
            $tab = this.tools.getTab(tabid)
        } else {
            $tab = tabid
        }
        
        if ($tab && $tab.length) {
            $panel = this.tools.getPanel($tab.data('options').id)
            $panel.removeData('bjui.clientPaging')
            
            this.reload($tab.data('options'))
        }
    }
    
    Navtab.prototype.reload = function(option) {
        var that    = this,
            options = $.extend({}, typeof option === 'object' && option),
            $tab    = options.id ? this.tools.getTab(options.id) : this.tools.getTabs().eq(currentIndex)
        
        if ($tab) {
            var op      = $tab.data('options')
            var _reload = function() {
                if (options.title && options.title != op.title) {
                    that.tools.updateTit($tab.index(), options.title)
                }
                $tab.data('options', $.extend({}, op, options))
                that.tools.reload($tab, true)
            }
            
            if (op.reloadWarn) {
                $('body').alertmsg('confirm', op.reloadWarn, {
                    okCall: function() {
                        _reload()
                    }
                })
            } else {
                _reload()
            }
        }
    }
    
    Navtab.prototype.reloadForm = function(clearQuery, option) {
        var options = $.extend({}, typeof option === 'object' && option),
            $tab    = options.id ? this.tools.getTab(options.id) : $currentTab,
            $panel  = options.id ? this.tools.getPanel(options.id) : $currentPanel
        
        if ($tab && $panel) {
            var op         = $tab.data('options'),
                data       = {},
                pageData   = {},
                $pagerForm = options.form || $panel.find('#pagerForm')
            
            if ($pagerForm && $pagerForm.length) {
                options.type = options.type || $pagerForm.attr('method') || 'POST'
                options.url  = options.url || $pagerForm.attr('action')
                
                pageData = $pagerForm.serializeJson()
                
                if (clearQuery) {
                    var pageInfo = BJUI.pageInfo
                    
                    for (var key in pageInfo) {
                        data[pageInfo[key]] = pageData[pageInfo[key]]
                    }
                } else {
                    data = pageData
                }
            }
            
            options.data = $.extend({}, options.data || {}, data)
            
            if (!$tab.hasClass('external')) {
                this.tools.reloadTab($panel, options)
            } else {
                this.openExternal(options.url, $panel, options.data)
            }
        }
    }
    
    Navtab.prototype.getCurrentPanel = function() {
        return this.tools.getPanels().eq(currentIndex)
    }
    
    Navtab.prototype.checkTimeout = function() {
        var json = JSON.parse($currentPanel.html())
        
        if (json && json[BJUI.keys.statusCode] == BJUI.statusCode.timeout) this.closeCurrentTab()
    }
    
    Navtab.prototype.openExternal = function(url, $panel, data) {
        var ih = $panel.closest('.navtab-panel').height()
        
        if (data && !$.isEmptyObject(data)) {
            url.indexOf('?') ? url += '&' : '?'
            url += $.param(data)
        }
        
        $panel.html(FRAG.externalFrag.replaceAll('{url}', url).replaceAll('{height}', ih +'px'))
    }
    
    Navtab.prototype.drag = function(e, $tab, $panel, $more) {
        var that  = this,
            $lis  = that.tools.getTabs(), $panels = that.tools.getPanels(), $mores = that.tools.getMoreLi(),
            $drag = $tabs.next('.bjui-navtab-drag'),
            $prev = $tab.prev(), $next  = $tab.next(),
            index = $tab.index(), width = $tab.width(),
            oleft = $tab.position().left,
            leftarr = [], newArr = [], newIndex
        
        if ($lis.length <= 2) return
        
        if (!$drag.length) {
            $drag = $('<div class="bjui-navtab-drag" style="position:absolute; top:0; left:1px; width:2px; height:25px; background:#ff6600; display:none;"></div>')
            $drag.insertAfter($tabs)
        }
        
        $drag.css('left', oleft - 2)
        
        $tabs.find('> li').each(function() {
            leftarr.push($(this).position().left)
        })
        
        $tab.find('> a').basedrag({
            move:'horizontal',
            oleft    : oleft,
            drag     : function($target, e, left, top) {
                $tab.addClass('navtab-drag')
                
                newArr = [left]
                $.merge(newArr, leftarr)
                newArr.sort(function(a, b) { return a - b })
                
                newIndex = $.inArray(left, newArr)
                if (!newIndex) newIndex = 1
                if (newIndex == $lis.length)
                    $drag.css('left', leftarr[newIndex - 1] - 2 + $lis.last().width())
                else
                    $drag.css('left', leftarr[newIndex] - 2)
                    
                $drag.show()
            },
            stop     : function() {
                $tab.removeClass('navtab-drag')
                $drag.hide()
                
                if (index != newIndex) {
                    if (newIndex == $lis.length) {
                        if (index != $lis.length - 1) {
                            $tab.insertAfter($lis.eq(newIndex - 1))
                            $panel.insertAfter($panels.eq(newIndex - 1))
                            $more.insertAfter($mores.eq(newIndex - 1))
                        }
                    } else {
                        $tab.insertBefore($lis.eq(newIndex))
                        $panel.insertBefore($panels.eq(newIndex))
                        $more.insertBefore($mores.eq(newIndex))
                    }
                }
            },
            event    : e,
            nounbind : true
        })
    }
    
    // NAVTAB PLUGIN DEFINITION
    // =======================
    
    function Plugin(option) {
        var args     = arguments,
            property = option,
            navtab   = 'bjui.navtab',
            $body    = $('body'),
            datas    = $body.data(navtab) || {}
        
        return this.each(function () {
            var $this   = $(this),
                options = $.extend({}, Navtab.DEFAULTS, typeof option === 'object' && option),
                id      = options && options.id,
                data    = datas && datas[datas.current]
            
            if (typeof property === 'string' && $.isFunction(data[property])) {
                if (!data) return
                
                [].shift.apply(args)
                if (!args) data[property]()
                else data[property].apply(data, args)
            } else {
                if (!id) {
                    id = datas ? datas.current : 'main'
                    
                    if (!BJUI.ui.overwriteHomeTab && id === 'main')
                        id = 'navtab'
                } else {
                    if (!id.isNormalID()) {
                        BJUI.debug('Navtab Plugin: ID ['+ id +'] '+ BJUI.regional.idChecked)
                        
                        return
                    }
                }
                
                options.id = id
                
                if (!datas[id]) {
                    datas[id] = (data = new Navtab(options))
                } else {
                    data = datas[id]
                    if (typeof option === 'object' && option)
                        $.extend(data.options, option)
                }
                
                $body.data(navtab, datas)
                
                data.openTab()
            }
        })
    }
    
    var old = $.fn.navtab
    
    $.fn.navtab             = Plugin
    $.fn.navtab.Constructor = Navtab
    
    // NAVTAB NO CONFLICT
    // =================
    
    $.fn.navtab.noConflict = function () {
        $.fn.navtab = old
        return this
    }
    
    // NOT SELECTOR
    // ==============
    
    BJUI.navtab = function() {
        Plugin.apply($('body'), arguments)
    }
    
    // NAVTAB DATA-API
    // ==============
    
    $(document).on('click.bjui.navtab.data-api', '[data-toggle="navtab"]', function(e) {
        e.preventDefault()
        
        var $this = $(this), href = $this.attr('href'), data = $this.data(), options = data.options
        
        if (options) {
            if (typeof options === 'string') options = options.toObj()
            if (typeof options === 'object')
                $.extend(data, options)
        }
        
        if (!data.title) data.title = $this.text()
        if (href && !data.url) data.url = href
        
        Plugin.call($this, data)
    })
    
}(jQuery);
/*!
 * B-JUI  v1.3 beta2 (http://b-jui.com)
 * Git@OSC (http://git.oschina.net/xknaan/B-JUI)
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 */

/* ========================================================================
 * B-JUI: bjui-dialog.js  v1.3 beta2
 * @author K'naan
 * http://git.oschina.net/xknaan/B-JUI/blob/master/BJUI/js/bjui-dialog.js
 * ========================================================================
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 * ======================================================================== */

+function ($) {
    'use strict';
    
    // DIALOG GLOBAL ELEMENTS
    // ======================
    
    var $resizable
    var $current, shadow, zindex
    
    $(function() {
        var INIT_DIALOG = function() {
            $resizable = $('#bjui-resizable')
            shadow     = 'dialogShadow'
            zindex     = Dialog.ZINDEX
            
            $('body').append('<!-- dialog resizable -->').append(FRAG.resizable)
        }
        
        INIT_DIALOG()
    })
    
    // DIALOG CLASS DEFINITION
    // ======================
    var Dialog = function(options) {
        this.$element = $('body')
        this.options  = options
        this.tools    = this.TOOLS()
    }
    
    Dialog.DEFAULTS = {
        id          : null,
        title       : 'New Dialog',
        url         : null,
        type        : 'GET',
        data        : {},
        loadingmask : true,
        width       : 500,
        height      : 300,
        minW        : 65,
        minH        : 40,
        max         : false,
        mask        : false,
        resizable   : true,
        drawable    : true,
        maxable     : true,
        minable     : true,
        fresh       : false,
        onLoad      : null,
        beforeClose : null,
        onClose     : null
    }
    
    Dialog.ZINDEX = 30
    
    Dialog.prototype.TOOLS = function() {
        var that  = this
        var tools = {
            getDefaults: function() {
                return Dialog.DEFAULTS
            },
            init: function($dialog) {
                var width  = that.options.width > that.options.minW ? that.options.width : that.options.minW
                var height = that.options.height > that.options.minH ? that.options.height : that.options.minH
                var wW     = $(window).width(),
                    wH     = $(window).height(),
                    iTop   = that.options.max ? 0 : ((wH - height) / 3)
                
                if (width > wW)  width  = wW
                if (height > wH) height = wH
                
                $dialog
                    .height(height)
                    .width(width)
                    .show()
                    .css({left:(wW - width) / 2, top:0, opacity:0.1})
                    .animate({top:iTop > 0 ? iTop : 0, opacity:1})
                    .addClass(shadow)
                    .find('> .dialogContent').height(height - $('> .dialogHeader', $dialog).outerHeight())
                
                $('body').find('> .bjui-dialog-container').not($dialog).removeClass(shadow)
            },
            reload: function($dialog, options) {
                var tools = this, $dialogContent = $dialog.find('> .dialogContent'), onLoad, data = options && options.data, html
                
                options = options || $dialog.data('options')
                onLoad  = options.onLoad ? options.onLoad.toFunc() : null
                
                $dialog.trigger(BJUI.eventType.beforeLoadDialog)
                
                if (options.url) {
                    if (data) {
                        if (typeof data === 'string') {
                            if (data.trim().startsWith('{')) {
                                data = data.toObj()
                            } else {
                                data = data.toFunc()
                            }
                        }
                        if (typeof data === 'function') {
                            data = data.apply()
                        }
                    }
                    $dialogContent.ajaxUrl({
                        type:options.type || 'GET', url:options.url, data:data || {}, loadingmask:options.loadingmask, callback:function(response) {
                            if (onLoad) onLoad.apply(that, [$dialog])
                            if (BJUI.ui.clientPaging && $dialog.data('bjui.clientPaging')) $dialog.pagination('setPagingAndOrderby', $dialog)
                            
                            tools.resizeBjuiRow($dialog)
                        }
                    })
                } else {
                    if (options.image) {
                        html = '<img src="'+ decodeURIComponent(options.image) +'" style="width:100%;">'
                    } else if (options.html) {
                        html = options.html
                        if (typeof html === 'string' && $.isFunction(html.toFunc()))
                            html = html.toFunc()
                    } else if (options.target) {
                        html = $(options.target).html() || $dialog.data('bjui.dialog.target')
                        $(options.target).empty()
                        $dialog.data('bjui.dialog.target', html)
                    }
                    
                    $dialogContent.trigger(BJUI.eventType.beforeAjaxLoad).html(html).initui()
                    
                    if (onLoad) onLoad.apply(that, [$dialog])
                    
                    this.resizeBjuiRow($dialog)
                }
            },
            resizeContent: function($dialog) {
                var $dialogContent = $dialog.find('> .dialogContent')
                
                $dialogContent
                    .css({height:($dialog.height() - $dialog.find('> .dialogHeader').outerHeight())}) 
                
                $(window).trigger(BJUI.eventType.resizeGrid)
            },
            resizeBjuiRow: function($dialog) {
                var width = $dialog.width(), colWidth = BJUI.formColWidth
                
                $dialog.find('.bjui-row').each(function() {
                    var $form = $(this)
                    
                    if (($form.attr('class')).indexOf('col-') === -1) {
                        $form.addClass('col-none')
                    }
                    
                    $form.filter('.col-4')
                        .toggleClass('col-3', (width < colWidth.L && width > colWidth.M))
                        .end()
                        .filter('.col-3, .col-4')
                        .toggleClass('col-2', (width < colWidth.M && width > colWidth.S))
                        .end()
                        .filter('.col-2, .col-3, .col-4')
                        .toggleClass('col-1', (width < colWidth.S && width > colWidth.SS))
                        .end()
                        .filter('.col-none, .col-1, .col-2, .col-3, .col-4')
                        .toggleClass('col-0', (width < colWidth.SS))
                })
            }
        }
        
        return tools
    }
    
    Dialog.prototype.open = function() {
        var that    = this,
            options = that.options,
            $body   = $('body'),
            datas   = $body.data('bjui.dialog'),
            data    = datas[options.id],
            $dialog = data && data.dialog
            
        if (!(options.target || $(options.target).length) && !(options.html || options.image)) {
            if (!options.url && options.href) options.url = options.href
            if (!options.url) {
                BJUI.debug('Dialog Plugin: Error trying to open a dialog, url is undefined!')
                return
            } else {
                options.url = decodeURI(options.url).replacePlh()
                
                if (!options.url.isFinishedTm()) {
                    BJUI.alertmsg('error', (options.warn || BJUI.regional.plhmsg))
                    BJUI.debug('Dialog Plugin: The new dialog\'s url is incorrect, url: '+ options.url)
                    return
                }
                
                options.url = encodeURI(options.url)
            }
        } else {
            options.url = undefined
        }
        if ($dialog) { //if the dialog id already exists
            var op = $dialog.data('options')
            
            this.switchDialog($dialog)
            
            if ($dialog.is(':hidden')) $dialog.show()
            if (options.fresh || options.url != op.url) {
                that.reload(options)
            }
        } else { //open a new dialog
            var dr     = BJUI.regional.dialog,
                dialog = FRAG.dialog
                    .replace('#close#', dr.close)
                    .replace('#maximize#', dr.maximize)
                    .replace('#restore#', dr.restore)
                    .replace('#minimize#', dr.minimize)
                    .replace('#title#', dr.title)
            
            $dialog = $(dialog)
                .data('options', $.extend({}, options))
                .css('z-index', (++ zindex))
                .hide()
                .appendTo($body)
            
            $dialog.find('> .dialogHeader > h1 > span.title').html(options.title)
            
            this.tools.init($dialog)
            
            if (options.maxable) $dialog.find('a.maximize').show()
            else $dialog.find('a.maximize').hide()
            if (options.minable) $dialog.find('a.minimize').show()
            else $dialog.find('a.minimize').hide()
            if (options.max) that.maxsize($dialog)
            if (options.mask) this.addMask($dialog)
            else if (options.minable && $.fn.taskbar) this.$element.taskbar({id:options.id, title:options.title})
            
            $dialog.on('click', function(e) {
                if (!$(e.target).data('bjui.dialog'))
                    if ($current && $current[0] != $dialog[0]) that.switchDialog($dialog)
            }).on('click', '.btn-close', function(e) {
                that.close($dialog)
                
                e.preventDefault()
            }).on('click', '.dialogHeader > a', function(e) {
                var $a = $(this)
                
                if ($a.hasClass('close')) that.close($dialog)
                if ($a.hasClass('minimize')) {
                    that.minimize($dialog)
                }
                if ($a.hasClass('maximize')) {
                    that.switchDialog($dialog)
                    that.maxsize($dialog)
                }
                if ($a.hasClass('restore')) that.restore($dialog)
                
                e.preventDefault()
                e.stopPropagation()
            }).on('dblclick', '.dialogHeader > h1', function(e) {
                if (options.maxable) {
                    if ($dialog.find('> .dialogHeader > a.restore').is(':hidden')) $dialog.find('a.maximize').trigger('click')
                    else $dialog.find('> .dialogHeader > a.restore').trigger('click')
                }
            }).on('mousedown.bjui.dialog.drag', '.dialogHeader > h1', function(e) {
                that.switchDialog($dialog)
                
                if (!options.drawable || $dialog.data('max')) return
                
                $dialog.data('bjui.dialog.task', true)
                setTimeout($.proxy(function () {
                    if ($dialog.data('bjui.dialog.task')) that.drag(e, $dialog)
                }, that), 150)
                
                e.preventDefault()
            }).on('mouseup.bjui.dialog.drag', '.dialogHeader > h1', function(e) {
                $dialog.data('bjui.dialog.task', false)
            }).on('mousedown.bjui.dialog.resize', 'div[class^="resizable"]', function(e) {
                if (!options.drawable || $dialog.data('max')) return false
                if (!options.resizable) return false
                
                var $bar = $(this)
                
                that.switchDialog($dialog)
                that.resizeInit(e, $('#bjui-resizable'), $dialog, $bar)
                $bar.show()
                
                e.preventDefault()
            }).on('mouseup.bjui.dialog.resize', 'div[class^="resizable"]', function(e) {
                e.preventDefault()
            })
            
            data.dialog = $dialog
            this.tools.reload($dialog, options)
        }
        
        $.CurrentDialog = $current = $dialog
        
        // set current to body data
        datas.current = options.id
    }
    
    Dialog.prototype.addMask = function($dialog) {
        var $mask = $dialog.data('bjui.dialog.mask')
        
        $dialog.wrap('<div style="z-index:'+ zindex +'" class="bjui-dialog-wrap"></div>')
        $dialog.find('> .dialogHeader > a.minimize').hide()
        if (!$mask || !$mask.length) {
            $mask = $(FRAG.dialogMask)
            $mask.css('z-index', 1).show().insertBefore($dialog)
            $dialog.data('bjui.dialog.mask', $mask)
        }
    }
    
    Dialog.prototype.refresh = function(id) {
        if (id && typeof id === 'string') {
            var arr = id.split(','), datas = $('body').data('bjui.dialog')
            
            for (var i = 0; i < arr.length; i++) {
                var $dialog = datas && datas[arr[i].trim()] && datas[arr[i].trim()].dialog
                
                if ($dialog) {
                    $dialog.removeData('bjui.clientPaging')
                    this.tools.reload($dialog)
                }
            }
        } else {
            if ($current) {
                $current.removeData('bjui.clientPaging')
                this.tools.reload($current)
            }
        }
    }
    
    Dialog.prototype.resize = function($dialog, width, height) {
        var that = this, options, $dialogContent, ww = $(window).width(), hh = $(window).height()
        
        if (!$dialog) {
            $dialog = $current
        }
        
        options = $dialog.data('options')
        $dialogContent = $dialog.find('> .dialogContent')
        
        if (width != options.width) {
            if (width > ww)
                width = ww
            
            if (options.max) {
                $dialog.animate({ width:width, left:(ww - width)/2 }, 'normal')
            } else {
                $dialog.width(width).css('left', (ww - width)/2)
            }
            
            options.width = width
        }
        if (height != options.height) {
            var itop = 0
            
            if (height < hh)
                itop = (hh - height) / 2 - 20
            if (itop < 0)
                itop = 0
            
            if (options.max) {
                $dialog.animate({ height:height, top:itop }, 'normal', function() {
                    $dialogContent.height(height - $dialog.find('> .dialogHeader').outerHeight())
                })
            } else {
                $dialog.height(height).css('top', itop)
                $dialogContent.height(height - $dialog.find('> .dialogHeader').outerHeight())
            }
            
            options.height = height
        }
    }
    
    Dialog.prototype.reload = function(option) {
        var that     = this,
            options  = $.extend({}, typeof option === 'object' && option),
            datas    = $('body').data('bjui.dialog'),
            $dialog  = (options.id && datas[options.id] && datas[options.id].dialog) || that.getCurrent()
        
        if ($dialog && $dialog.length) {
            var op = $dialog.data('options')
            
            options = $.extend({}, op, options)
            
            var _reload = function() {
                var $dialogContent = $dialog.find('> .dialogContent'), ww = $(window).width(), hh = $(window).height(), w = options.width, h = options.height
                
                if (w != op.width) {
                    if (w > ww)
                        w = ww
                    
                    if (options.max) {
                        $dialog.animate({ width:w, left:(ww - w)/2 }, 'normal'/*, function() { $dialogContent.width(options.width) }*/)
                    } else {
                        $dialog.width(w).css('left', (ww - w)/2)
                    }
                }
                if (h != op.height) {
                    var itop = 0
                    
                    if (h < hh)
                        itop = (hh - h) / 2 - 20
                    if (itop < 0)
                        itop = 0
                    
                    if (options.max) {
                        $dialog.animate({ height:h, top:itop }, 'normal', function() {
                            $dialogContent.height(h - $dialog.find('> .dialogHeader').outerHeight())
                        })
                    } else {
                        $dialog.height(h).css('top', itop)
                        $dialogContent.height(h - $dialog.find('> .dialogHeader').outerHeight())
                    }
                }
                if (options.maxable != op.maxable) {
                    if (options.maxable) $dialog.find('a.maximize').show()
                    else $dialog.find('a.maximize').hide()
                } 
                if (options.minable != op.minable) {
                    if (options.minable) $dialog.find('a.minimize').show()
                    else $dialog.find('a.minimize').hide()
                }
                if (options.max != op.max)
                    if (options.max)
                        setTimeout(that.maxsize($dialog), 10)
                if (options.mask != op.mask) {
                    if (options.mask) {
                        that.addMask($dialog)
                        if ($.fn.taskbar) that.$element.taskbar('closeDialog', options.id)
                    } else if (options.minable && $.fn.taskbar) {
                        that.$element.taskbar({id:options.id, title:options.title})
                    }
                }
                if (options.title != op.title) {
                    $dialog.find('> .dialogHeader > h1 > span.title').html(options.title)
                    $dialog.taskbar('changeTitle', options.id, options.title)
                }
                
                $dialog.data('options', $.extend({}, options))
                
                that.tools.reload($dialog, options)
            }
            
            if (options.reloadWarn) {
                $dialog.alertmsg('confirm', options.reloadWarn, {
                    okCall: function() {
                        _reload()
                    }
                })
            } else {
                _reload()
            }
        }
    }
    
    Dialog.prototype.reloadForm = function(clearQuery, option) {
        var options = $.extend({}, typeof option === 'object' && option),
            datas   = $('body').data('bjui.dialog'),
            $dialog
        
        if (options.id) {
            if (datas && datas[options.id])
                $dialog = datas[options.id].dialog
        } else {
            $dialog = $current
        }
        
        if ($dialog) {
            var op         = $dialog.data('options'),
                data       = {},
                pageData   = {},
                $pagerForm = options.form || $dialog.find('#pagerForm')
            
            if ($pagerForm && $pagerForm.length) {
                options.type = options.type || $pagerForm.attr('method') || 'POST'
                options.url  = options.url || $pagerForm.attr('action')
                
                pageData = $pagerForm.serializeJson()
                
                if (clearQuery) {
                    var pageInfo = BJUI.pageInfo
                    
                    for (var key in pageInfo) {
                        data[pageInfo[key]] = pageData[pageInfo[key]]
                    }
                } else {
                    data = pageData
                }
            }
            
            options.data = $.extend({}, options.data || {}, data)
            
            this.tools.reload($dialog, options)
        }
    }
    
    Dialog.prototype.getCurrent = function() {
        return $current
    }
    
    Dialog.prototype.switchDialog = function($dialog) {
        var index = $dialog.css('z-index')
        
        if ($current && $current != $dialog) {
            var cindex = $current.css('z-index'),
                datas  = $('body').data('bjui.dialog'),
                pindex
            
            if ($current.data('options').mask) {
                pindex = $current.parent().css('z-index')
                
                if (Number(pindex) > Number(index))
                    return
            }
            
            $current.css('z-index', index)
            $dialog.css('z-index', cindex)
            $.CurrentDialog = $current = $dialog
            
            // set current to body data
            datas.current = $dialog.data('options').id
            
            if ($.fn.taskbar) this.$element.taskbar('switchTask', datas.current)
        }
        
        $dialog.addClass(shadow)
        $('body').find('> .bjui-dialog-container, > .bjui-dialog-wrap > .bjui-dialog-container').not($dialog).removeClass(shadow)
    }
    
    Dialog.prototype.close = function(dialog) {
        var datas = $('body').data('bjui.dialog'), $dialog = (typeof dialog === 'string') ? datas[dialog].dialog : dialog
        
        if (!$dialog || !$dialog.length) {
            return
        }
        
        var that        = this,
            $mask       = $dialog.data('bjui.dialog.mask'),
            options     = $dialog.data('options'),
            target      = $dialog.data('bjui.dialog.target'),
            beforeClose = options.beforeClose ? options.beforeClose.toFunc() : null,
            onClose     = options.onClose ? options.onClose.toFunc() : null,
            canClose    = true,
            closeFunc   = function() {
                delete datas[options.id]
                
                if (onClose) onClose.apply(that)
                
                $.CurrentDialog = $current = null
                
                var $dialogs  = $('body').find('.bjui-dialog-container'),
                $_current = null
                
                if ($dialogs.length) {
                    $_current = that.$element.getMaxIndexObj($dialogs)
                } else {
                    zindex = Dialog.ZINDEX
                }
                if ($_current && $_current.is(':visible')) {
                    $.CurrentDialog = $current = $_current
                    that.switchDialog($_current)
                }
            }
        
        if (!$dialog || !options) return
        if (beforeClose) canClose = beforeClose.apply(that, [$dialog])
        if (!canClose) {
            that.switchDialog($dialog)
            return
        }
        if (options.target && target) $(options.target).html(target) 
        if ($mask && $mask.length) {
            $mask.remove()
            $dialog.unwrap()
        } else if ($.fn.taskbar) {
            this.$element.taskbar('closeDialog', options.id)
        }
        
        if (options.noanimate) {
            $dialog.trigger(BJUI.eventType.beforeCloseDialog).remove()
            closeFunc()
        } else {
            $dialog.animate({top:- $dialog.outerHeight(), opacity:0.1}, 'normal', function() {
                $dialog.trigger(BJUI.eventType.beforeCloseDialog).remove()
                closeFunc()
            })
        }
    }
    
    Dialog.prototype.closeCurrent = function() {
        this.close($current)
    }
    
    Dialog.prototype.checkTimeout = function() {
        var $dialogConetnt = $current.find('> .dialogContent'),
            json = JSON.parse($dialogConetnt.html())
        
        if (json && json[BJUI.keys.statusCode] == BJUI.statusCode.timeout) this.closeCurrent()
    }
    
    Dialog.prototype.maxsize = function($dialog) {
        var $taskbar = $('#bjui-taskbar'), taskH = ($taskbar.is(':visible') ? $taskbar.height() : 0) + 1
        
        $dialog.data('original', {
            top   : $dialog.css('top'),
            left  : $dialog.css('left'),
            width : $dialog.css('width'),
            height: $dialog.css('height')
        }).data('max', true)
        
        $dialog.find('> .dialogHeader > a.maximize').hide()
        $dialog.find('> .dialogHeader > a.restore').show()
        
        var iContentW = $(window).width() - 1,
            iContentH = $(window).height() - taskH
        
        $dialog.css({ top:0, right:0, left:0, bottom:taskH, width:'100%', height:'auto'})
        
        this.tools.resizeContent($dialog)
        this.tools.resizeBjuiRow($dialog)
    }
    
    Dialog.prototype.restore = function($dialog) {
        var original = $dialog.data('original'),
            dwidth   = original.width,
            dheight  = original.height
        
        $dialog.css({
            top   : original.top,
            right : '',
            bottom: '',
            left  : original.left,
            width : dwidth,
            height: dheight
        })
        
        this.tools.resizeContent($dialog)
        this.tools.resizeBjuiRow($dialog)
        
        $dialog.find('> .dialogHeader > a.maximize').show()
        $dialog.find('> .dialogHeader > a.restore').hide()
        $dialog.data('max', false)
    }
    
    Dialog.prototype.minimize = function($dialog) {
        $dialog.hide()
        if ($.fn.taskbar) this.$element.taskbar('minimize', $dialog)
        
        var $dialogs  = $('body').find('.bjui-dialog-container:visible'),
            $_current = null
        
        if ($dialogs.length) {
            $_current = this.$element.getMaxIndexObj($dialogs)
        }
        if ($_current) this.switchDialog($_current)
    }
    
    Dialog.prototype.drag = function(e, $dialog) {
        var $shadow = $('#bjui-dialogProxy')
        
        $dialog.find('> .dialogContent').css('opacity', '.3')
        $dialog.basedrag({
            selector : '> .dialogHeader',
            stop     : function() {
                $dialog
                    .css({left:$dialog.css('left'), top:$dialog.css('top')})
                    .find('> .dialogContent').css('opacity', 1)
            },
            event    : e,
            nounbind : true
        })
    }
    
    Dialog.prototype.resizeDialog = function($resizable, $dialog, target) {
        var oleft  = parseInt($resizable.css('left'), 10),
            otop   = parseInt($resizable.css('top'), 10),
            height = parseInt($resizable.css('height'), 10),
            width  = parseInt($resizable.css('width'), 10)
        
        if (otop < 0) otop = 0
        
        $dialog.css({top:otop, left:oleft, width:width, height:height})
        
        if (target != 'w' && target != 'e')
            this.tools.resizeContent($dialog)
        if (target != 'n' && target != 's') {
            this.tools.resizeBjuiRow($dialog)
            $(window).trigger(BJUI.eventType.resizeGrid)
        }
    }
    
    Dialog.prototype.resizeInit = function(e, $resizable, $dialog, $bar) {
        var that = this, target = $bar.attr('tar')
        
        $('body').css('cursor', target +'-resize')
        $resizable
            .css({
                top    : $dialog.css('top'),
                left   : $dialog.css('left'),
                height : $dialog.outerHeight(),
                width  : $dialog.css('width')
            })
            .show()
        
        if (!this.options.dragCurrent) {
            this.options.dragCurrent = {
                $resizable : $resizable,
                $dialog    : $dialog,
                target     : target,
                oleft      : parseInt($resizable.css('left'), 10)   || 0,
                owidth     : parseInt($resizable.css('width'), 10)  || 0,
                otop       : parseInt($resizable.css('top'), 10)    || 0,
                oheight    : parseInt($resizable.css('height'), 10) || 0,
                ox         : e.pageX || e.screenX,
                oy         : e.pageY || e.clientY
            }
            $(document).on('mouseup.bjui.dialog.resize', $.proxy(that.resizeStop, that))
            $(document).on('mousemove.bjui.dialog.resize', $.proxy(that.resizeStart, that))
        }
    }
    
    Dialog.prototype.resizeStart = function(e) {
        var current = this.options.dragCurrent
        
        if (!current) return
        if (!e) var e = window.event
        
        var lmove     = (e.pageX || e.screenX) - current.ox,
            tmove     = (e.pageY || e.clientY) - current.oy,
            $mask = current.$dialog.data('bjui.dialog.mask')
        
        if (!$mask || !$mask.length)
            if ((e.pageY || e.clientY) <= 0 || (e.pageY || e.clientY) >= ($(window).height() - current.$dialog.find('> .dialogHeader').outerHeight())) return
        
        var target = current.target,
            width  = current.owidth,
            height = current.oheight
        
        if (target != 'n' && target != 's')
            width += (target.indexOf('w') >= 0) ? -lmove : lmove
        if (width >= this.options.minW) {
            if (target.indexOf('w') >= 0)
                current.$resizable.css('left', (current.oleft + lmove))
            if (target != 'n' && target != 's')
                current.$resizable.css('width', width)
        }
        if (target != 'w' && target != 'e')
            height += (target.indexOf('n') >= 0) ? -tmove : tmove
        if (height >= this.options.minH) {
            if (target.indexOf('n') >= 0)
                current.$resizable.css('top', (current.otop + tmove))
            if (target != 'w' && target != 'e')
                current.$resizable.css('height', height)
        }
    }
    
    Dialog.prototype.resizeStop = function(e) {
        var current = this.options.dragCurrent
        
        if (!current) return false
        
        $(document).off('mouseup.bjui.dialog.resize').off('mousemove.bjui.dialog.resize')
        
        this.options.dragCurrent = null
        this.resizeDialog(current.$resizable, current.$dialog, current.target)
        
        $('body').css('cursor', '')
        current.$resizable.hide()
    }
    
    // DIALOG PLUGIN DEFINITION
    // =======================
    
    function Plugin(option) {
        var args     = arguments,
            property = option,
            dialog   = 'bjui.dialog',
            $body    = $('body'),
            datas    = $body.data(dialog) || {}
        
        return this.each(function () {
            var $this   = $(this),
                options = $.extend({}, Dialog.DEFAULTS, typeof option === 'object' && option),
                id      = options && options.id,
                data
            
            if (!id) {
                if (datas.current) id = datas.current
                else id = 'dialog'
            } else {
                if (!id.isNormalID()) {
                    BJUI.debug('Dialog Plugin: ID ['+ id +'] '+ BJUI.regional.idChecked)
                    
                    return
                }
            }
            
            options.id = id
            data = datas && datas[id]
            
            if (!data) {
                datas[id] = (data = new Dialog(options))
            } else {
                if (typeof option === 'object' && option)
                    $.extend(data.options, option)
            }
            
            $body.data(dialog, datas)
            
            if (typeof property === 'string' && $.isFunction(data[property])) {
                [].shift.apply(args)
                if (!args) data[property]()
                else data[property].apply(data, args)
            } else {
                data.open()
            }
        })
    }
    
    var old = $.fn.dialog
    
    $.fn.dialog             = Plugin
    $.fn.dialog.Constructor = Dialog
    
    // DIALOG NO CONFLICT
    // =================
    
    $.fn.dialog.noConflict = function () {
        $.fn.dialog = old
        return this
    }
    
    // NOT SELECTOR
    // ==============
    
    BJUI.dialog = function() {
        Plugin.apply($('body'), arguments)
    }
    
    // DIALOG DATA-API
    // ==============
    
    $(document).on('click.bjui.dialog.data-api', '[data-toggle="dialog"]', function(e) {
        var $this   = $(this), href = $this.attr('href'), data = $this.data(), options = data.options
        
        if (options) {
            if (typeof options === 'string') options = options.toObj()
            if (typeof options === 'object')
                $.extend(data, options)
        }
        
        if (!data.title) data.title = $this.text()
        if (href && !data.url) data.url = href
        
        Plugin.call($this, data)
        
        e.preventDefault()
    })
    
}(jQuery);
/*!
 * B-JUI  v1.3 beta2 (http://b-jui.com)
 * Git@OSC (http://git.oschina.net/xknaan/B-JUI)
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 */

/* ========================================================================
 * B-JUI: bjui-taskbar.js  v1.3 beta2
 * reference: bjui-dialog.js
 * @author K'naan
 * http://git.oschina.net/xknaan/B-JUI/blob/master/BJUI/js/bjui-taskbar.js
 * ========================================================================
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 * ======================================================================== */

+function ($) {
    'use strict';
    
    // TASKBAR GLOBAL ELEMENTS
    // ======================
    
    var $resizable
    var $taskBar, $taskBox, $taskList, $prevBtn, $nextBtn, taskDisabled, taskSelected, taskMargin
    
    $(function() {
        var INIT_TASKBAR = function() {
            $resizable   = $('#bjui-resizable')
            $taskBar     = $(FRAG.taskbar)
            $taskBox     = $taskBar.find('.taskbarContent')
            $taskList    = $taskBox.find('> ul')
            $prevBtn     = $taskBar.find('.taskbarLeft')
            $nextBtn     = $taskBar.find('.taskbarRight')
            taskDisabled = 'disabled'
            taskSelected = 'selected'
            taskMargin   = 'taskbarMargin'
            
            $('body').append('<!-- dialog task bar -->').append($taskBar)
            
            //events
            $prevBtn.click(function(e) { $(this).taskbar('scrollLeft') })
            $nextBtn.click(function(e) { $(this).taskbar('scrollRight') })
        }
        INIT_TASKBAR()
    })
    
    // TASKBAR CLASS DEFINITION
    // ======================
    
    var Taskbar = function(element, options) {
        this.$element = $(element)
        this.$task    = null
        this.options  = options
        this.tools    = this.TOOLS()
    }
    
    Taskbar.DEFAULTS = {
        id: undefined,
        title: undefined
    }
    
    Taskbar.prototype.init = function() {
        var that = this
        var $task = $taskList.find('#task-'+ this.options.id)
        
        this.show()
        if (!$task.length) {
            var taskFrag = '<li id="#taskid#"><div class="taskbutton"><span><i class="fa fa-th-large"></i></span> <span class="title">#title#</span></div><div class="close"><i class="fa fa-times-circle"></i></div></li>';
            
            $task = $(taskFrag.replace('#taskid#', 'task-'+ this.options.id).replace('#title#', this.options.title))
            $task.appendTo($taskList)
        } else {
            $task.find('> div > span.title').html(this.options.title)
        }
        this.contextmenu($task)
        this.switchTask($task)
        this.tools.scrollTask($task)
        
        //events
        $task.click(function(e) {
            if ($(e.target).closest('div').hasClass('close') || $(e.target).hasClass('close')) {
                $task.dialog('close', that.options.id)
            } else {
                var datas   = $('body').data('bjui.dialog'),
                    $dialog = datas[that.options.id].dialog
                
                if ($task.hasClass('selected')) {
                    $dialog.find('.dialogHeader a.minimize').trigger('click')
                } else {
                    if ($dialog.is(':hidden')) {
                        that.restoreDialog($dialog)
                    } else {
                        $dialog.trigger('click')
                        $task.addClass(taskSelected)
                    }   
                }
                that.scrollCurrent($task)
            }
            
            return false
        })
    }
    
    Taskbar.prototype.TOOLS = function() {
        var that  = this
        var tools = {
            scrollCurrent: function() {
                var iW = this.tasksW(this.getTasks())
                
                if (iW > this.getTaskBarW()) {
                    var $tools = this
                    var lTask  = $taskList.find('> li:last-child')
                    var left   = this.getTaskBarW() - lTask.position().left - lTask.outerWidth(true)
                    
                    $taskList.animate({left: left}, 200, function() {
                        $tools.ctrlScrollBtn()
                    })
                } else {
                    this.ctrlScrollBtn()
                }
            },
            getTaskBarW: function() {
                return $taskBox.width()- ($prevBtn.is(':hidden') ? $prevBtn.width() + 2 : 0) - ($nextBtn.is(':hidden') ? $nextBtn.width() + 2 : 0)
            },
            scrollTask: function($task) {
                var $tools = this
                
                if ($task.position().left + this.getLeft() + $task.outerWidth() > this.getBarWidth()) {
                    var left = this.getTaskBarW() - $task.position().left  - $task.outerWidth(true) - 2
                    
                    $taskList.animate({left:left}, 200, function() {
                        $tools.ctrlScrollBtn()
                    })
                } else if ($task.position().left + this.getLeft() < 0) {
                    var left = this.getLeft() - ($task.position().left + this.getLeft())
                    
                    $taskList.animate({left:left}, 200, function() {
                        $tools.ctrlScrollBtn()
                    })
                }
            },
            ctrlScrollBtn: function() {
                var iW = this.tasksW(this.getTasks())
                
                if (this.getTaskBarW() > iW) {
                    $taskBox.removeClass(taskMargin)
                    $nextBtn.hide()
                    $prevBtn.hide()
                    if (this.getTasks().eq(0).length) this.scrollTask(this.getTasks().eq(0))
                } else {
                    $taskBox.addClass(taskMargin)
                    $nextBtn.show().removeClass(taskDisabled)
                    $prevBtn.show().removeClass(taskDisabled)
                    if (this.getLeft() >= 0) $prevBtn.addClass(taskDisabled)
                    if (this.getLeft() <= this.getTaskBarW() - iW) $nextBtn.addClass(taskDisabled)
                }
            },
            getLeft: function(){
                return $taskList.position().left
            },
            visibleStart: function() {
                var iLeft = this.getLeft()
                var jTasks = this.getTasks()
                
                for (var i = 0; i < jTasks.size(); i++) {
                    if (jTasks.eq(i).position().left + jTasks.eq(i).outerWidth(true) + iLeft >= 0) return jTasks.eq(i)
                }
                
                return jTasks.eq(0)
            },
            visibleEnd: function() {
                var iLeft = this.getLeft()
                var jTasks = this.getTasks()
                
                for (var i = 0; i < jTasks.size(); i++) {
                    if (jTasks.eq(i).position().left + jTasks.eq(i).outerWidth(true) + iLeft > this.getBarWidth()) return jTasks.eq(i)
                }
                
                return jTasks.eq(jTasks.size() - 1)
            },
            getTasks: function() {
                return $taskList.find('> li')
            },
            tasksW: function(jTasks) {
                var iW = 0
                
                jTasks.each(function() {
                    iW += $(this).outerWidth(true)
                })
                
                return iW
            },
            getBarWidth: function() {
                return $taskBar.innerWidth()
            },
            getCurrent: function() {
                return $taskList.find('li.'+ taskSelected)
            }
        }
        
        return tools
    }
    
    Taskbar.prototype.contextmenu = function($obj) {
        var that = this
        
        $obj.contextmenu({
            id: 'dialogCM',
            bindings: {
                reload: function(t) {
                    t.dialog('refresh', that.options.id)
                },
                closeCurrent: function(t, m) {
                    var $obj = t.isTag('li') ? t : that.tools.getCurrent()
                    
                    $obj.find('.close').trigger('click')
                },
                closeOther: function(t, m){
                    var $tasks = $taskList.find('> li').not(t)
                    
                    $tasks.each(function(i) {
                        $(this).find('.close').trigger('click')
                    })
                },
                closeAll: function(t, m) {
                    var $tasks = that.tools.getTasks()
                    
                    $tasks.each(function(i) {
                        $(this).find('.close').trigger('click')
                    })
                }
            },
            ctrSub: function(t, m) {
                var mCur = m.find('[rel="closeCurrent"]')
                var mOther = m.find('[rel="closeOther"]')
                
                if (!that.tools.getCurrent().length) {
                    mCur.addClass(taskDisabled)
                    mOther.addClass(taskDisabled)
                } else {
                    if (that.tools.getTasks().size() == 1)
                        mOther.addClass(taskDisabled)
                }
            }
        })
    }
    
    Taskbar.prototype.closeDialog = function(task) {
        var $task = (typeof task === 'string') ? this.getTask(task) : task
        
        if (!$task || !$task.length) return
        
        $task.remove()
        if (!this.tools.getTasks().size()) {
            this.hide()
        }
        this.tools.scrollCurrent()
        this.$element.removeData('bjui.taskbar')
    }
    
    Taskbar.prototype.minimize = function(dialog) {
        var that    = this,
            datas   = $('body').data('bjui.dialog'),
            $dialog = (typeof dialog === 'string') ? datas[dialog].dialog : dialog,
            $task   = this.getTask($dialog.data('options').id)
        
        $resizable.css({
            top: $dialog.css('top'),
            left: $dialog.css('left'),
            height: $dialog.css('height'),
            width: $dialog.css('width')
        }).show().animate({top:$(window).height() - 60, left:$task.position().left, width:$task.outerWidth(), height:$task.outerHeight()}, 250, function() {
            $(this).hide()
            that.inactive($task)
        })
    }
    
    /**
     * @param {Object} id or dialog
     */
    Taskbar.prototype.restoreDialog = function($dialog) {
        var $task = this.getTask($dialog.data('options').id)
        
        $resizable.css({top:$(window).height() - 60, left:$task.position().left, height:$task.outerHeight(), width:$task.outerWidth()})
            .show()
            .animate({top:$dialog.css('top'), left:$dialog.css('left'), width:$dialog.css('width'), height:$dialog.css('height')}, 250, function() {
                $(this).hide()
                
                $dialog.show().trigger('click.bjui.taskbar.restore')
            })
        
        this.switchTask($task)
    }
    
    /**
     * @param {Object} id
     */
    Taskbar.prototype.inactive = function(task) {
        var $task = (typeof task === 'string') ? this.getTask(task) : task
        
        $task.removeClass(taskSelected)
    }
    
    Taskbar.prototype.scrollLeft = function() {
        var $task = this.tools.visibleStart()
        
        this.tools.scrollTask($task)
    }
    
    Taskbar.prototype.scrollRight = function() {
        var $task = this.tools.visibleEnd()
        
        this.tools.scrollTask($task)
    }
    
    Taskbar.prototype.scrollCurrent = function($task) {
        this.tools.scrollTask($task)
    }
    
    /**
     * @param {Object} id or $task
     */
    Taskbar.prototype.switchTask = function(task) {
        this.tools.getCurrent().removeClass(taskSelected)
        var $task = (typeof task === 'string') ? this.getTask(task) : task
        
        $task.addClass(taskSelected)
    }
    
    Taskbar.prototype.getTask = function(id) {
        return $taskList.find('#task-'+ id)
    }
    
    Taskbar.prototype.changeTitle = function(id, title) {
        var $task = this.getTask(id)
        
        if ($task && title) $task.find('.title').html(title)
    }
    
    Taskbar.prototype.show = function() {
        if ($taskBar.is(':hidden')) $taskBar.show().animate({bottom:0}, 500)
    }
    
    Taskbar.prototype.hide = function() {
        if ($taskBar.is(':visible')) $taskBar.animate({bottom:-50}, 500, function() { $taskBar.hide() })
    }
    
    // TASKBAR PLUGIN DEFINITION
    // =======================
    
    function Plugin(option) {
        var args = arguments
        var property = option
        
        return this.each(function () {
            var $this   = $(this)
            var options = $.extend({}, Taskbar.DEFAULTS, $this.data(), typeof option === 'object' && option)
            var data    = $this.data('bjui.taskbar')
            
            if (!data) $this.data('bjui.taskbar', (data = new Taskbar(this, options)))
            else if (data.options.id != options.id) $this.data('bjui.taskbar', (data = new Taskbar(this, options)))
            
            if (typeof property === 'string' && $.isFunction(data[property])) {
                [].shift.apply(args)
                if (!args) data[property]()
                else data[property].apply(data, args)
            } else {
                data.init()
            }
        })
    }

    var old = $.fn.taskbar

    $.fn.taskbar             = Plugin
    $.fn.taskbar.Constructor = Taskbar
    
    // TASKBAR NO CONFLICT
    // =================
    
    $.fn.taskbar.noConflict = function () {
        $.fn.taskbar = old
        return this
    }
    
}(jQuery);
/*!
 * B-JUI  v1.3 beta2 (http://b-jui.com)
 * Git@OSC (http://git.oschina.net/xknaan/B-JUI)
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 */

/* ========================================================================
 * B-JUI: bjui-ajax.js  v1.3 beta2
 * @author K'naan 
 * http://git.oschina.net/xknaan/B-JUI/blob/master/BJUI/js/bjui-ajax.js
 * ========================================================================
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 * ======================================================================== */

+function ($) {
    'use strict';
    
    // BJUIAJAX GLOBAL ELEMENTS
    // ======================
    
    var autorefreshTimer
    
    // BJUIAJAX CLASS DEFINITION
    // ======================
    
    var Bjuiajax = function(element, options) {
        var $this     = this
        
        this.$element = $(element)
        this.options  = options
        this.tools    = this.TOOLS()
    }
    
    Bjuiajax.DEFAULTS = {
        okalert         : true,
        reload          : true,
        loadingmask     : true,
        gridrefreshflag : true
    }
    
    Bjuiajax.NAVTAB = 'navtab'
    
    Bjuiajax.prototype.TOOLS = function() {
        var that  = this
        var tools = {
            getPagerForm: function($parent, args, form) {
                var pageInfo = $.extend({}, BJUI.pageInfo)
                
                if (!form)
                    form = $parent.find('#pagerForm:first')[0]
                
                if ($parent.data('bjui.clientPaging')) {
                    args = $.extend({}, $parent.data('bjui.clientPaging'), args)
                    $parent.data('bjui.clientPaging', args)
                }
                
                if (form) {
                    for (var key in pageInfo) {
                        var val = ''
                        
                        if (args && args[key]) val = args[key]
                        if (!form[pageInfo[key]]) $('<input type="hidden" name="'+ pageInfo[key] +'" value="'+ val +'">').appendTo($(form))
                        else if (val) form[pageInfo[key]].value = val
                    }
                }
                
                return form
            },
            getTarget: function() {
                if (that.$element.closest('.navtab-panel').length) return Bjuiajax.NAVTAB
                else return 'dialog'
            }
        }
        
        return tools
    }
    
    Bjuiajax.prototype.ajaxdone = function(json) {
        if (json[BJUI.keys.statusCode] == BJUI.statusCode.error) {
            if (json[BJUI.keys.message]) BJUI.alertmsg('error', json[BJUI.keys.message])
        } else if (json[BJUI.keys.statusCode] == BJUI.statusCode.timeout) {
            BJUI.alertmsg('info', (json[BJUI.keys.message] || BJUI.regional.sessiontimeout))
            BJUI.loadLogin()
        } else {
            if (json[BJUI.keys.message]) BJUI.alertmsg('correct', json[BJUI.keys.message])
        }
    }
    
    Bjuiajax.prototype.ajaxerror = function(xhr, ajaxOptions, thrownError) {
        var msg = xhr.responseText, that = this, options = that.$element.data('bjui.ajax.options') || that.options, failCallback = options.failCallback
        
        if (typeof msg === 'string' && msg.startsWith('{')) {
            this.ajaxdone(msg.toObj())
        } else {
            BJUI.alertmsg('error', '<div>Http status: ' + xhr.status + ' ' + xhr.statusText + '</div>' 
                + '<div>ajaxOptions: '+ ajaxOptions +' </div>'
                + '<div>thrownError: '+ thrownError +' </div>'
                + '<div>'+ msg +'</div>')
        }
        
        if (failCallback) {
            if (typeof failCallback === 'string')
                failCallback = failCallback.toFunc()
            if (typeof failCallback === 'function')
                failCallback.apply(that, [msg, options])
            else
                BJUI.debug('The callback function \'failCallback\' is incorrect: '+ failCallback)
        }
    }
    
    Bjuiajax.prototype.ajaxcallback = function(json) {
        var that = this, options = that.options,
            okCallback = options.okCallback, errCallback = options.errCallback, okAfterCallback = options.okAfterCallback,
            tabids = [], dialogids = [], divids = [], datagrids = []
        
        var okFunc = function() {
                if (typeof okCallback === 'string')
                    okCallback = okCallback.toFunc()
                if (typeof okCallback === 'function')
                    okCallback.apply(that, [json, options])
                else
                    BJUI.debug('The callback function \'okCallback\' is incorrect: '+ okCallback)
            },
            okAfterFunc = function() {
                if (typeof okAfterCallback === 'string')
                    okAfterCallback = okAfterCallback.toFunc()
                if (typeof okAfterCallback === 'function')
                    okAfterCallback.apply(that, [json, options])
                else
                    BJUI.debug('The callback function \'okAfterCallback\' is incorrect: '+ okAfterCallback)
            },
            errFunc = function() {
                if (typeof errCallback === 'string')
                    errCallback = errCallback.toFunc()
                if (typeof errCallback === 'function')
                    errCallback.apply(that, [json, options])
                else
                    BJUI.debug('The callback function \'errCallback\' is incorrect: '+ errCallback)
            }
        
        if (typeof json === 'string')
            json = json.toObj()
                
        if (options.okalert)
            that.ajaxdone(json)
        
        if (!json[BJUI.keys.statusCode]) {
            if (okCallback) {
                okFunc()
                return
            }
        }
        if (json[BJUI.keys.statusCode] == BJUI.statusCode.ok) {
            if (okCallback) {
                okFunc()
                return
            }
            
            if (json.tabid)
                $.merge(tabids, json.tabid.split(','))
            if (options.tabid)
                $.merge(tabids, options.tabid.split(','))
            
            if (json.dialogid)
                $.merge(dialogids, json.dialogid.split(','))
            if (options.dialogid)
                $.merge(dialogids, options.dialogid.split(','))
            
            if (json.divid)
                $.merge(divids, json.divid.split(','))
            if (options.divid)
                $.merge(divids, options.divid.split(','))
            
            if (json.datagrid)
                $.merge(datagrids, json.datagrid.split(','))
            if (options.datagrid)
                $.merge(datagrids, options.datagrid.split(','))
            
            // refresh
            if (tabids.length) {
                $.unique(tabids)
                setTimeout(function() { BJUI.navtab('reloadFlag', tabids.join(',')) }, 100)
            }
            if (dialogids.length) {
                $.unique(dialogids)
                setTimeout(function() { BJUI.dialog('refresh', dialogids.join(',')) }, 100)
            }
            if (divids.length) {
                $.unique(divids)
                setTimeout(function() { that.refreshdiv(divids.join(',')) }, 100)
            }
            if (datagrids.length) {
                setTimeout(function() {
                    $.each(datagrids, function(i, n) {
                        $('#'+ n.trim()).datagrid('refresh', options.gridrefreshflag)
                    })
                }, 100)
            }
            
            if (that.$target == $.CurrentNavtab) {
                that.navtabcallback(json)
            } else if (that.$target == $.CurrentDialog) {
                that.dialogcallback(json)
            } else {
                that.divcallback(json)
            }
            
            if (okAfterCallback) {
                okAfterFunc()
            }
        } else {
            if (errCallback) {
                errFunc()
            }
        }
    }
    
    Bjuiajax.prototype.divcallback = function(json, $target, options) {
        var that = this, options = that.options,
            forward = json.forward || options.forward || null,
            forwardConfirm = json.forwardConfirm || options.forwardConfirm || null
        
        
        if (options.reload && !forward) {
            that.refreshlayout()
        }
        
        if (options.reloadNavtab)
            setTimeout(function() { BJUI.navtab('refresh') }, 100)
        
        if (forward) {
            var _forward = function() {
                $.extend(options, {url: forward})
                that.refreshlayout()
            }
            
            if (forwardConfirm) {
                BJUI.alertmsg('confirm', forwardConfirm, {
                    okCall: function() { _forward() }
                })
            } else {
                _forward()
            }
        }
    }
    
    Bjuiajax.prototype.navtabcallback = function(json) {
        var that = this, options = that.options,
            closeCurrent = json.closeCurrent || options.closeCurrent || false,
            forward = json.forward || options.forward || null,
            forwardConfirm = json.forwardConfirm || options.forwardConfirm || null
        
        if (closeCurrent && !forward)
            BJUI.navtab('closeCurrentTab')
        else if (options.reload && !forward)
            setTimeout(function() { BJUI.navtab('refresh') }, 100)
        
        if (forward) {
            var _forward = function() {
                BJUI.navtab('reload', {url:forward})
            }
            
            if (forwardConfirm) {
                BJUI.alertmsg('confirm', forwardConfirm, {
                    okCall: function() { _forward() },
                    cancelCall: function() { if (closeCurrent) { BJUI.navtab('closeCurrentTab') } }
                })
            } else {
                _forward()
            }
        }
    }
    
    Bjuiajax.prototype.dialogcallback = function(json) {
        var that = this, options = that.options,
            closeCurrent = json.closeCurrent || options.closeCurrent || false,
            forward = json.forward || options.forward || null,
            forwardConfirm = json.forwardConfirm || options.forwardConfirm || null
        
        if (closeCurrent && !forward)
            BJUI.dialog('closeCurrent')
        else if (options.reload && !forward)
            setTimeout(function() { BJUI.dialog('refresh') }, 100)
        
        if (options.reloadNavtab)
            setTimeout(function() { BJUI.navtab('refresh') }, 100)
        if (forward) {
            var _forward = function() {
                BJUI.dialog('reload', {url:forward})
            }
            
            if (forwardConfirm) {
                BJUI.alertmsg('confirm', json.forwardConfirm, {
                    okCall: function() { _forward() },
                    cancelCall: function() { if (closeCurrent) { BJUI.dialog('closeCurrent') } }
                })
            } else {
                _forward()
            }
        }
    }
    
    Bjuiajax.prototype.pagecallback = function(options, target) {
        var that    = this
        var op      = $.extend({}, Bjuiajax.DEFAULTS, options)
        var $target = target || null
        var form    = null
        
        if ($target && $target.length) {
            form = that.tools.getPagerForm($target, op)
            if (form) {
                $.extend(op, $(form).data())
                that.reloadlayout({target:$target[0], type:$(form).attr('method') || 'POST', url:$(form).attr('action'), data:$(form).serializeArray(), loadingmask:op.loadingmask})
            }
        } else {
            if (that.tools.getTarget() == Bjuiajax.NAVTAB) {
                $target = $.CurrentNavtab
                form    = that.tools.getPagerForm($target, op)
                if (form) $.extend(op, $(form).data())
                that.$element.navtab('reloadForm', false, op)
            } else {
                $target = $.CurrentDialog
                form    = that.tools.getPagerForm($target, op)
                if (form) $.extend(op, $(form).data())
                that.$element.dialog('reloadForm', false, op)
            }
        }
    }
    
    Bjuiajax.prototype.doajax = function(options) {
        var that = this, $target, $element = that.$element
        
        if (!options) options = {}
        if (!options.loadingmask) options.loadingmask = false
        
        options = $.extend({}, Bjuiajax.DEFAULTS, typeof options === 'object' && options)
        that.options = options
        
        if (options.target) {
            if (options.target instanceof jQuery)
                $target = options.target
            else
                $target = $(options.target)
        } else {
            if ($element[0] !== $('body')[0]) {
                $target = $element.closest('.bjui-layout')
            }
        }
        
        if (!$target || !$target.length)
            $target = $.CurrentDialog || $.CurrentNavtab
        
        that.$target = $target
        
        if (!options.url) {
            BJUI.debug('Bjuiajax Plugin: \'doajax\' method: the url is undefined!')
            return
        } else {
            options.url = decodeURI(options.url).replacePlh($target)
            
            if (!options.url.isFinishedTm()) {
                BJUI.alertmsg('error', (options.warn || BJUI.regional.plhmsg))
                BJUI.debug('Bjuiajax Plugin: \'doajax\' method: The url is incorrect: '+ options.url)
                return
            }
            
            options.url = encodeURI(options.url)
        }
        
        var callback = options.callback && options.callback.toFunc()
        var todo     = function() {
            if (!options.callback)
                options.callback = $.proxy(function(data) {that.ajaxcallback(data)}, that)
            
            $target.data('bjui.ajax.options', options).doAjax(options)
        }
        
        if (options.confirmMsg) {
            BJUI.alertmsg('confirm', options.confirmMsg,
                {
                    okCall : function() {
                        todo()
                    }
                }
            )
        } else {
            todo()
        }
    }
    
    Bjuiajax.prototype.ajaxform = function(option) {
        var that         = this,
            options      = $.extend({}, typeof option === 'object' && option),
            $element     = that.$element,
            $target      = null,
            $form        = null,
            beforeSubmit = options.beforeSubmit,
            callback     = options.callback,
            enctype
        
        // form
        if ($element[0] === $('body')[0]) {
            $form = options.form
            
            if (!($form instanceof jQuery))
                $form = $(options.form)
        } else {
            $form   = $element
            $target = $form.closest('.bjui-layout')
        }
        
        if (!$form || !$form.length || !($form.isTag('form'))) {
            BJUI.debug('Bjuiajax Plugin: \'ajaxform\' method: Not set the form!')
            return
        }
        
        if ($form.data('holdSubmit')) {
            return
        }
        // beforeSubmit
        if (beforeSubmit) {
            if (typeof beforeSubmit === 'string')
                beforeSubmit = beforeSubmit.toFunc()
            if (typeof beforeSubmit === 'function') {
                if (!beforeSubmit.apply(that, [$form])) {
                    return
                }
            } else {
                BJUI.debug('Bjuiajax Plugin: \'ajaxform\' options \'beforeSubmit\': Not a function!')
                return
            }
        }
        
        // for webuploader
        var $uploaders = $form.find('input[data-toggle="webuploader"]'), requiredMsg, error4Uploader = false
        
        if ($uploaders.length && WebUploader) {
            $uploaders.each(function(i, n) {
                var uploader = $(this).data('webuploader'), $lis = $(this).data('webuploader.wrap').find('.filelist > li'), fileCount = $lis.length, waitCount = fileCount - $lis.filter('.uploaded').length 
                
                if (waitCount && uploader) {
                    if (waitCount !== uploader.getStats().successNum) {
                        // 自动上传
                        uploader.upload()
                        // 上传完成后触发
                        uploader.on('uploadFinished', function() {
                            $form.submit()
                        })
                        
                        error4Uploader = true
                        return false
                    }
                }
                if (uploader && uploader.options.required) {
                    if (!fileCount) {
                        requiredMsg = uploader.options.requiredMsg || '请上传图片！'
                        return false
                    }
                }
            })
        }
        
        if (requiredMsg) {
            BJUI.alertmsg('info', requiredMsg)
            return
        }
        if (error4Uploader) {
            BJUI.alertmsg('info', '表单将在图片上传完成后自动提交！')
            return
        }
        
        enctype = $form.attr('enctype')
        
        // target
        if (options.target) {
            $target = options.target
            
            if (!($target instanceof jQuery))
                $target = $($target)
        }
        
        if (!$target || !$target.length)
            $target = $.CurrentDialog || $.CurrentNavtab
        
        that.$target = $target
        
        options.url  = options.url || $form.attr('action')
        // for ie8
        if (BJUI.isIE(8) && !options.type) {
            if (!$form[0].getAttributeNode('method').specified) options.type = 'POST'
        }
        options.type = options.type || $form.attr('method') || 'POST'
        
        $.extend(that.options, options)
        
        if (callback) callback = callback.toFunc()
        
        var successFn = function(data, textStatus, jqXHR) {
            callback ? callback.apply(that, [data, $form]) : $.proxy(that.ajaxcallback(data), that)
        }
        var _submitFn = function() {
            var op = {loadingmask:that.options.loadingmask, type:that.options.type, url:that.options.url, callback:successFn}
            
            if (enctype && enctype == 'multipart/form-data') {
                if (window.FormData) {
                    $.extend(op, {data:new FormData($form[0]), contentType:false, processData:false}) 
                } else {
                    $.extend(op, {data:$form.serializeArray(), files:$form.find(':file'), iframe:true, processData:false})
                }
            } else {
                $.extend(op, {data:$form.serializeArray()})
            }
            
            if (that.options.ajaxTimeout) op.ajaxTimeout = that.options.ajaxTimeout
            
            $form.doAjax(op)
        }
        
        if (that.options.confirmMsg) {
            BJUI.alertmsg('confirm', that.options.confirmMsg, {okCall: _submitFn})
        } else {
            _submitFn()
        }
    }
    
    Bjuiajax.prototype.ajaxsearch = function(option) {
        var that = this, options = $.extend({}, typeof option === 'object' && option), $element = that.$element, form = null, op = {pageCurrent:1}, $form, $target, isValid = options.isValid
        
        if (options.target) $target = $(options.target)
        if ($element[0] === $('body')[0]) {
            $form = options.form
            
            if (!($form instanceof jQuery)) {
                $form = $(options.form)
            }
            if (!$form || !$form.length || !($form.isTag('form'))) {
                BJUI.debug('Bjuiajax Plugin: \'ajaxsearch\' method: Not set the form!')
                return
            }
            if (options.target) {
                $target = options.target
                
                if (!($target instanceof jQuery))
                    $target = $($target)
            } else {
                $target = $form.closest('.bjui-layout')
            }
            
            if (!$target || !$target.length)
                $target = $.CurrentDialog || $.CurrentNavtab
        } else {
            $form   = $element
            $target = $form.closest('.bjui-layout')
            
            if (!($form.isTag('form'))) {
                BJUI.debug('Bjuiajax Plugin: \'ajaxsearch\' method: Not set the form!')
                return
            }
            if (!$target || !$target.length) {
                $target = $.CurrentDialog || $.CurrentNavtab
            }
            
            if (!options.url)
                options.url = $form.attr('action')
        }
        
        that.$target = $target
        
        if (!options.url)
            options.url = $form.attr('action')
        
        if (!options.url) {
            BJUI.debug('Bjuiajax Plugin: \'ajaxsearch\' method: The form\'s action or url is undefined!')
            return
        } else {
            options.url = decodeURI(options.url).replacePlh($form.closest('.unitBox'))
            
            if (!options.url.isFinishedTm()) {
                BJUI.alertmsg('error', (options.warn || BJUI.regional.plhmsg))
                BJUI.debug('Bjuiajax Plugin: \'ajaxsearch\' method: The form\'s action or url is incorrect: '+ options.url)
                return
            }
            
            options.url = encodeURI(options.url)
        }
        
        if (!options.type)
            options.type = $form.attr('method') || 'POST'
        
        that.tools.getPagerForm($target, op, $form[0])
        options.form = $form
        
        $.extend(that.options, options)
        
        var search = function() {
            if ($target.hasClass('bjui-layout')) {
                var data = $form.serializeJson(), _data = {}
                
                if (options.clearQuery) {
                    var pageInfo = BJUI.pageInfo
                    
                    for (var key in pageInfo) {
                        _data[pageInfo[key]] = data[pageInfo[key]]
                    }
                    
                    data = _data
                }
                
                that.reloadlayout({target:$target[0], type:that.options.type, url:that.options.url, data:data, loadingmask:that.options.loadingmask})
            } else {
                if ($target[0] === ($.CurrentNavtab)[0]) {
                    BJUI.navtab('reloadForm', that.options.clearQuery, options)
                } else {
                    BJUI.dialog('reloadForm', that.options.clearQuery, options)
                }
            }
        }
        
        if (!isValid) {
            if ($.fn.validator) {
                $form.isValid(function(v) {
                    if (v) search()
                })
            } else {
                search()
            }
        } else {
            search()
        }
    }
    
    Bjuiajax.prototype.doload = function(option) {
        var that = this, $target = null, options = that.options
            
        $.extend(options, typeof option === 'object' && option)
        
        if (options.target) {
            $target = options.target
            
            if (!($target instanceof jQuery))
                $target = $($target)
        }
        
        if (!$target || !$target.length) {
            BJUI.debug('Bjuiajax Plugin: \'doload\' method: Not set loaded container, like [data-target].')
            return
        }
        
        if (!options.url) {
            BJUI.debug('Bjuiajax Plugin: \'doload\' method: The url is undefined!')
            return
        } else {
            options.url = decodeURI(options.url).replacePlh()
            
            if (!options.url.isFinishedTm()) {
                BJUI.alertmsg('error', (options.warn || BJUI.regional.plhmsg))
                BJUI.debug('Bjuiajax Plugin: \'doload\' method: The url is incorrect: '+ options.url)
                return
            }
            
            options.url = encodeURI(options.url)
        }
        
        $target.removeData('bjui.clientPaging').data('options', options)
        that.reloadlayout(options)
    }
    
    Bjuiajax.prototype.refreshlayout = function(target) {
        var that = this, $target
        
        if (target) {
            $target = target
            
            if (!($target instanceof jQuery))
                $target = $($target)
        } else {
            $target = that.$target
        }
        
        if (!$target || !$target.length) {
            if (autorefreshTimer) clearInterval(autorefreshTimer)
            BJUI.debug('Bjuiajax Plugin: \'refreshlayout\' method: No argument, can not refresh DIV.(parameters:[selector/jQuery object/element])')
            return
        }
        if ($target && $target.length) {
            if (!$target.data('options')) {
                BJUI.debug('Bjuiajax Plugin: \'refreshlayout\' method: The target(DIV) is not a reload layout!')
                return
            }
            $target.removeData('bjui.clientPaging')
            that.reloadlayout($target.data('options'))
        }
    }
    
    Bjuiajax.prototype.reloadlayout = function(option) {
        var $target = null,
            options = $.extend({}, typeof option === 'object' && option),
            arefre  = options && options.autorefresh && (isNaN(String(options.autorefresh)) ? 15 : options.autorefresh)
        
        if (options.target) {
            $target = options.target
            
            if (!($target instanceof jQuery))
                $target = $($target)
        }
        
        if (!$target || !$target.length) {
            if (autorefreshTimer) clearInterval(autorefreshTimer)
            BJUI.debug('Bjuiajax Plugin: \'refreshlayout\' method: Not set loaded container, like [data-target].')
            return
        } else {
            if (!$target.data('options')) {
                BJUI.debug('Bjuiajax Plugin: \'refreshlayout\' method: This target(DIV) is not initialized!')
                return
            }
            options = $.extend({}, $target.data('options'), options)
        }
        
        $target
            .addClass('bjui-layout')
            .data('options', options)
            .ajaxUrl({ type:options.type, url:options.url, data:options.data, loadingmask:options.loadingmask, callback:function(html) {
                    if (BJUI.ui.clientPaging && $target.data('bjui.clientPaging'))
                        $target.pagination('setPagingAndOrderby', $target)
                    if (options.callback)
                        options.callback.apply(this, [$target, html])
                    if (autorefreshTimer)
                        clearInterval(autorefreshTimer)
                    if (arefre)
                        autorefreshTimer = setInterval(function() { $target.bjuiajax('refreshlayout', $target) }, arefre * 1000)
                    if(!$target.height()) {
                        $target.css('position', 'static')
                    }
                }
            })
    }
    
    Bjuiajax.prototype.refreshdiv = function(divid) {
        if (divid && typeof divid === 'string') {
            var arr = divid.split(',')
            
            for (var i = 0; i < arr.length; i++) {
                this.refreshlayout('#'+ arr[i])
            }
        }
    }
    
    Bjuiajax.prototype.ajaxdownload = function(option) {
        var that = this, $target, options = $.extend({}, {loadingmask: false}, typeof option === 'object' && option)
        
        $.extend(that.options, options)
        
        if (options.target) {
            $target = options.target
            
            if (!($target instanceof jQuery))
                $target = $($target)
        }
        
        if (!$target || !$target.length)
            $target = $.CurrentDialog || $.CurrentNavtab
        
        that.$target = $target
        
        if (!options.url) {
            BJUI.debug('Bjuiajax Plugin: \'ajaxdownload\' method: The url is undefined!')
            return
        } else {
            options.url = decodeURI(options.url).replacePlh($target)
            
            if (!options.url.isFinishedTm()) {
                BJUI.alertmsg('error', (options.warn || BJUI.regional.plhmsg))
                BJUI.debug('Bjuiajax Plugin: \'ajaxdownload\' method: The url is incorrect: '+ options.url)
                return
            }
        }
        
        var todo = function() {
            var downloadOptions = {}
            
            downloadOptions.failCallback = function(responseHtml, url) {
                if (responseHtml.trim().startsWith('{')) responseHtml = responseHtml.toObj()
                that.ajaxdone(responseHtml)
                $target.trigger('bjui.ajaxError')
            }
            downloadOptions.prepareCallback = function(url) {
                if (options.loadingmask) {
                    $target.trigger('bjui.ajaxStart')
                }
            }
            downloadOptions.successCallback = function(url) {
                $target.trigger('bjui.ajaxStop')
            }
            
            if (options.type && !options.httpMethod)
                options.httpMethod = options.type
            
            $.extend(downloadOptions, options)
            
            if (!downloadOptions.data) downloadOptions.data = {}
            if (typeof downloadOptions.data.ajaxrequest === 'undefined') downloadOptions.data.ajaxrequest = true
            
            $.fileDownload(options.url, downloadOptions)
        }
        
        if (options.confirmMsg) {
            BJUI.alertmsg('confirm', options.confirmMsg, {
                okCall: function() {
                    todo()
                }
            })
        } else {
            todo()
        }
    }
    
    // Deprecated
    Bjuiajax.prototype.doexport = function(options) {
        var that = this, $element = that.$element, $target = options.target ? $(options.target) : null, form
        
        if (!options.url) {
            BJUI.debug('Error trying to open a ajax link: url is undefined!')
            return
        } else {
            options.url = decodeURI(options.url).replacePlh($element.closest('.unitBox'))
            
            if (!options.url.isFinishedTm()) {
                BJUI.alertmsg('error', (options.warn || BJUI.regional.plhmsg))
                BJUI.debug('The ajax url is incorrect: '+ options.url)
                return
            }
        }
        
        var todo = function() {
            if (!$target || !$target.length) {
                if (that.tools.getTarget() == Bjuiajax.NAVTAB) {
                    $target = $.CurrentNavtab
                } else {
                    $target = $.CurrentDialog
                }
            }
            form = that.tools.getPagerForm($target)
            
            if (form) {
                if (!options.data) options.data = {}
                $.extend(options.data, $(form).serializeJson())
            }
            
            $.fileDownload(options.url, {
                failCallback: function(responseHtml, url) {
                    if (responseHtml.trim().startsWith('{')) responseHtml = responseHtml.toObj()
                    that.ajaxdone(responseHtml)
                },
                data: options.data || {}
            })
        }
        
        if (options.confirmMsg) {
            BJUI.alertmsg('confirm', options.confirmMsg, {
                okCall: function() {
                    todo()
                }
            })
        } else {
            todo()
        }
    }
    
    // Deprecated
    Bjuiajax.prototype.doexportchecked = function(options) {
        var that = this, $element = that.$element, $target = options.target ? $(options.target) : null, idname
        
        if (!options.url) {
            BJUI.debug('Error trying to open a export link: url is undefined!')
            return
        } else {
            options.url = decodeURI(options.url).replacePlh($element.closest('.unitBox'))
            
            if (!options.url.isFinishedTm()) {
                BJUI.alertmsg('error', (options.warn || BJUI.regional.plhmsg))
                BJUI.debug('The ajax url is incorrect: '+ options.url)
                return
            }
        }
        
        var todo = function() {
            if (!options.group) {
                BJUI.alertmsg('error', options.warn || BJUI.regional.nocheckgroup)
                return
            }
            if (!$target || !$target.length) {
                if (that.tools.getTarget() == Bjuiajax.NAVTAB) {
                    $target = $.CurrentNavtab
                } else {
                    $target = $.CurrentDialog
                }
            }
            
            var ids     = [],
                $checks = $target.find(':checkbox[name='+ options.group +']:checked')
            
            if (!$checks.length) {
                BJUI.alertmsg('error', BJUI.regional.notchecked)
                return
            }
            $checks.each(function() {
                ids.push($(this).val())
            })
            
            idname = options.idname || 'ids'
            options.data = options.data || {}
            options.data[idname] = ids.join(',')
            
            $.fileDownload(options.url, {
                failCallback: function(responseHtml, url) {
                    if (responseHtml.trim().startsWith('{')) responseHtml = responseHtml.toObj()
                    that.ajaxdone(responseHtml)
                },
                data: options.data
            })
        }
        
        if (options.confirmMsg) {
            BJUI.alertmsg('confirm', options.confirmMsg, {
                okCall: function() {
                    todo()
                }
            })
        } else {
            todo()
        }
    }
    
    // Deprecated
    Bjuiajax.prototype.doajaxchecked = function(options) {
        var that = this, $element = that.$element, $target = options.target ? $(options.target) : null, idname
        
        options = $.extend({}, Bjuiajax.DEFAULTS, typeof options === 'object' && options)
        if (!options.url) {
            BJUI.debug('Error trying to open a del link: url is undefined!')
            return
        } else {
            options.url = decodeURI(options.url).replacePlh($element.closest('.unitBox'))
            
            if (!options.url.isFinishedTm()) {
                BJUI.alertmsg('error', (options.warn || BJUI.regional.plhmsg))
                BJUI.debug('The ajax url is incorrect: '+ options.url)
                return
            }
        }
        
        var todo = function() {
            if (!options.group) {
                BJUI.alertmsg('error', options.warn || BJUI.regional.nocheckgroup)
                return
            }
            if (!$target || !$target.length) {
                if (that.tools.getTarget() == Bjuiajax.NAVTAB) {
                    $target = $.CurrentNavtab
                } else {
                    $target = $.CurrentDialog
                }
            }
            
            var ids      = [],
                $checks  = $target.find(':checkbox[name='+ options.group +']:checked'),
                callback = options.callback && options.callback.toFunc()
            
            if (!$checks.length) {
                BJUI.alertmsg('error', BJUI.regional.notchecked)
                return
            }
            $checks.each(function() {
                ids.push($(this).val())
            })
            
            idname = options.idname || 'ids'
            options.data = options.data || {}
            options.data[idname] = ids.join(',')
            
            $element.doAjax({type:options.type, url:options.url, data:options.data, callback:callback ? callback : $.proxy(function(data) {that.ajaxcallback(data)}, that)})
        }
        
        if (options.confirmMsg) {
            BJUI.alertmsg('confirm', options.confirmMsg, {
                okCall: function() {
                    todo()
                }
            })
        } else {
            todo()
        }
    }
    
    // BJUIAJAX PLUGIN DEFINITION
    // =======================
    
    function Plugin(option) {
        var args     = arguments,
            property = option,
            ajax     = 'bjui.ajax',
            $body    = $('body')
        
        return this.each(function () {
            var $this   = $(this),
                options = $.extend({}, Bjuiajax.DEFAULTS, typeof option === 'object' && option),
                data    = $this.data(ajax),
                func
            
            if (!data) {
                data = new Bjuiajax(this, options)
            } else {
                if (this === $body[0]) {
                    data = new Bjuiajax(this, options)
                } else {
                    $.extend(data.options, typeof option === 'object' && option)
                }
            }
            
            $this.data(ajax, data)
            
            if (typeof property === 'string') {
                func = data[property.toLowerCase()]
                if ($.isFunction(func)) {
                    [].shift.apply(args)
                    if (!args) func()
                    else func.apply(data, args)
                }
            }
        })
    }
    
    var old = $.fn.bjuiajax
    
    $.fn.bjuiajax             = Plugin
    $.fn.bjuiajax.Constructor = Bjuiajax
    
    // BJUIAJAX NO CONFLICT
    // =================
    
    $.fn.bjuiajax.noConflict = function () {
        $.fn.bjuiajax = old
        return this
    }
    
    // NOT SELECTOR
    // ==============
    
    BJUI.ajax = function() {
        Plugin.apply($('body'), arguments)
    }
    
    // BJUIAJAX DATA-API
    // ==============
    
    $(document).on('submit.bjui.bjuiajax.data-api', 'form[data-toggle="ajaxform"]', function(e) {
        var $this = $(this), options = $this.data()
        
        Plugin.call($this, 'ajaxform', options)
        
        e.preventDefault()
    })
    
    /* ajaxsearch */
    $(function() {
        if ($.fn.validator) {
            $(document).on(BJUI.eventType.initUI, function(e) {
                $(e.target).find('form[data-toggle="ajaxsearch"]').each(function() {
                    var $form = $(this), options = $form.data()
                    
                    options.isValid = true
                    $form.validator({
                        valid: function(form) {
                            Plugin.call($form, 'ajaxsearch', options)
                        }
                    })
                })
            })
        } else {
            $(document).on('submit.bjui.bjuiajax.data-api', 'form[data-toggle="ajaxsearch"]', function(e) {
                var $this   = $(this), options = $this.data()
                
                Plugin.call($this, 'ajaxsearch', options)
                
                e.preventDefault()
            })
        }
    })
    
    $(document).on('click.bjui.bjuiajax.data-api', '[data-toggle="reloadsearch"]', function(e) {
        var $this = $(this), options
        var $form = $this.closest('form')
        
        if (!$form || !$form.length) return
        
        options = $form.data()
        options.clearQuery = $this.data('clearQuery') || true
        
        Plugin.call($form, 'ajaxsearch', options)
        
        e.preventDefault()
    })
    
    $(document).on('click.bjui.bjuiajax.data-api', '[data-toggle="ajaxload"]', function(e) {
        var $this = $(this), data = $this.data(), options = data.options
        
        if (options) {
            if (typeof options === 'string') options = options.toObj()
            if (typeof options === 'object') {
                delete data.options
                $.extend(data, options)
            }
        }
        
        if (!data.url) data.url = $this.attr('href')
        
        Plugin.call($this, 'doload', data)
        
        e.preventDefault()
    })
    
    $(document).on(BJUI.eventType.initUI, function(e) {
        $(e.target).find('[data-toggle="autoajaxload"]').each(function() {
            var $element = $(this), options = $element.data()
            
            options.target = this
            Plugin.call($element, 'doload', options)
        })
    })
    
    $(document).on('click.bjui.bjuiajax.data-api', '[data-toggle="refreshlayout"]', function(e) {
        var $this = $(this), target = $this.data('target')
        
        Plugin.call($this, 'refreshlayout', target)
        
        e.preventDefault()
    })
    
    $(document).on('click.bjui.bjuiajax.data-api', '[data-toggle="reloadlayout"]', function(e) {
        var $this = $(this), data = $this.data()
        
        Plugin.call($this, 'reloadlayout', data)
        
        e.preventDefault()
    })
    
    $(document).on('click.bjui.bjuiajax.data-api', '[data-toggle="doajax"]', function(e) {
        var $this = $(this), data = $this.data(), options = data.options
        
        if (options) {
            if (typeof options === 'string') options = options.toObj()
            if (typeof options === 'object') {
                delete data.options
                $.extend(data, options)
            }
        }
        
        if (!data.url) data.url = $this.attr('href')
        
        Plugin.call($this, 'doajax', data)
        
        e.preventDefault()
    })
    
    $(document).on('click.bjui.bjuiajax.data-api', '[data-toggle="ajaxdownload"]', function(e) {
        var $this = $(this), data = $this.data(), options = data.options
        
        if (options) {
            if (typeof options === 'string') options = options.toObj()
            if (typeof options === 'object') {
                delete data.options
                $.extend(data, options)
            }
        }
        if (!data.url) data.url = $this.attr('href')
        
        Plugin.call($this, 'ajaxdownload', data)
        
        e.preventDefault()
    })
    
    $(document).on('click.bjui.bjuiajax.data-api', '[data-toggle="doexport"]', function(e) {
        var $this = $(this), options = $this.data()
        
        if (!options.url) options.url = $this.attr('href')
        
        Plugin.call($this, 'doexport', options)
        
        e.preventDefault()
    })
    
    $(document).on('click.bjui.bjuiajax.data-api', '[data-toggle="doexportchecked"]', function(e) {
        var $this = $(this), options = $this.data()
        
        if (!options.url) options.url = $this.attr('href')
        
        Plugin.call($this, 'doexportchecked', options)
        
        e.preventDefault()
    })
    
    $(document).on('click.bjui.bjuiajax.data-api', '[data-toggle="doajaxchecked"]', function(e) {
        var $this = $(this), options = $this.data()
        
        if (!options.url) options.url = $this.attr('href')
        
        Plugin.call($this, 'doajaxchecked', options)
        
        e.preventDefault()
    })
    
}(jQuery);
/*!
 * B-JUI  v1.3 beta2 (http://b-jui.com)
 * Git@OSC (http://git.oschina.net/xknaan/B-JUI)
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 */

/* ========================================================================
 * B-JUI: bjui-alertmsg.js  v1.3 beta2
 * @author K'naan
 * http://git.oschina.net/xknaan/B-JUI/blob/master/BJUI/js/bjui-alertmsg.js
 * ========================================================================
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 * ======================================================================== */

+function ($) {
    'use strict';
    
    // ALERTMSG GLOBAL ELEMENTS
    // ======================
    
    var $box, $alertbg, timer
    
    $(function() {
        var INIT_ALERTMSG = function() {
            $box     = $(FRAG.alertBoxFrag).hide().html('')
            $alertbg = $(FRAG.alertBackground).hide().html('')
            $('body').append('<!-- alert msg box -->').append($box).append('<!-- alert msg box mask bg -->').append($alertbg)
        }
        
        INIT_ALERTMSG()
    })
    
    // ALERTMSG CLASS DEFINITION
    // ======================
    var Alertmsg = function(options) {
        this.options   = options
        this.tools     = this.TOOLS()
        this.clearTime = null
    }
    
    Alertmsg.DEFAULTS = {
        displayPosition : 'topcenter', // Optional 'topleft, topcenter, topright, middleleft, middlecenter, middleright, bottomleft, bottomcenter, bottomright'
        displayMode     : 'slide',     // Optional 'none, fade, slide'
        autoClose       : null,
        alertTimeout    : 3000,
        mask            : null,
        promptRequired  : 'required',
        types           : {error:'error', info:'info', warn:'warn', correct:'correct', confirm:'confirm', prompt:'prompt'},
        fas             : {error:'fa-times-circle', info:'fa-info-circle', warn:'fa-exclamation-circle', correct:'fa-check-circle', confirm:'fa-question-circle', prompt:'fa-paper-plane-o'}
    }
    
    Alertmsg.prototype.TOOLS = function() {
        var that  = this
        var tools = {
            getTitle: function(key){
                return that.options.title || BJUI.regional.alertmsg.title[key]
            },
            keydownOk: function(event) {
                if (event.which == BJUI.keyCode.ENTER) {
                    event.data.target.trigger('click')
                    return false
                }
                return true
            },
            keydownEsc: function(event) {
                if (event.which == BJUI.keyCode.ESC) event.data.target.trigger('click')
            },
            openPosition: function() {
                var position = BJUI.alertMsg.displayPosition, mode = BJUI.alertMsg.displayMode, width = 460, height = $box.outerHeight(), startCss = {}, endCss = {}
                
                if (position) {
                    if (that.options.displayPosition && that.options.displayPosition != 'topcenter')
                        position = that.options.displayPosition
                } else {
                    position = that.options.displayPosition
                }
                
                if (mode) {
                    if (that.options.displayMode && that.options.displayMode != 'slide')
                        mode = that.options.displayMode
                } else {
                    mode = that.options.displayMode
                }
                
                switch (position) {
                case 'topleft':
                    startCss = {top:0 - height, left:0, 'margin-left':0}
                    endCss   = {top:0}
                    
                    break
                case 'topcenter':
                    startCss = {top:0 - height}
                    endCss   = {top:0}
                    
                    break
                case 'topright':
                    startCss = {top:0 - height, left:'auto', right:0, 'margin-left':0}
                    endCss   = {top:0}
                    
                    break
                case 'middleleft':
                    startCss = {top:'50%', left:0 - width, 'margin-left':0, 'margin-top':0 - height/2}
                    endCss   = {left:0}
                    
                    break
                case 'middlecenter':
                    startCss = {top:'0', 'margin-top':0 - height/2}
                    endCss   = {top:'50%'}
                    
                    break
                case 'middleright':
                    startCss = {top:'50%', left:'auto', right:0 - width, 'margin-top':0 - height/2}
                    endCss   = {right:0}
                    
                    break
                case 'bottomleft':
                    startCss = {top:'auto', left:0, bottom:0 - height, 'margin-left':0}
                    endCss   = {bottom:0}
                    
                    break
                case 'bottomcenter':
                    startCss = {top:'auto', bottom:0 - height}
                    endCss   = {bottom:0}
                    
                    break
                case 'bottomright':
                    startCss = {top:'auto', left:'auto', right:0, bottom:0 - height, 'margin-left':0}
                    endCss   = {bottom:0}
                    
                    break
                }
                
                if (mode == 'slide') {
                    $box.css(startCss).show().animate(endCss, 500)
                } else if (mode == 'fade') {
                    startCss.opacity = 0.1
                    $box.css(startCss).css(endCss).show().animate({opacity:1}, 500)
                } else {
                    $box.css(startCss).css(endCss).show()
                }
            },
            closePosition: function() {
                var position = BJUI.alertMsg.displayPosition, mode = BJUI.alertMsg.displayMode, width = 460, height = $box.outerHeight(), endCss = {}
                
                if (position) {
                    if (that.options.displayPosition && that.options.displayPosition != 'topcenter')
                        position = that.options.displayPosition
                } else {
                    position = that.options.displayPosition
                }
                
                if (mode) {
                    if (that.options.displayMode && that.options.displayMode != 'slide')
                        mode = that.options.displayMode
                } else {
                    mode = that.options.displayMode
                }
                
                switch (position) {
                case 'topleft':
                    endCss   = {top:0 - height}
                    
                    break
                case 'topcenter':
                    endCss   = {top:0 - height}
                    
                    break
                case 'topright':
                    endCss   = {top:0 - height}
                    
                    break
                case 'middleleft':
                    endCss   = {left:0 - width}
                    
                    break
                case 'middlecenter':
                    endCss   = {top:0 - height}
                    
                    break
                case 'middleright':
                    endCss   = {right:0 - width}
                    
                    break
                case 'bottomleft':
                    endCss   = {bottom:0 - height}
                    
                    break
                case 'bottomcenter':
                    endCss   = {bottom:0 - height}
                    
                    break
                case 'bottomright':
                    endCss   = {bottom:0 - height}
                    
                    break
                }
                
                if (mode == 'slide') {
                    $box.animate(endCss, 500, function() {
                        $alertbg.hide()
                        $(this).hide().empty()
                    })
                } else if (mode == 'fade') {
                    $box.animate({opacity:0}, 500, function() {
                        $alertbg.hide()
                        $(this).hide().empty()
                    })
                } else {
                    $box.hide().remove()
                    $alertbg.hide()
                }
            },
            open: function(type, msg, buttons) {
                var tools = this, btnsHtml = '', $newbox, $btns, alertTimeout = BJUI.alertMsg.alertTimeout, input = ''
                
                if (buttons) {
                    for (var i = 0; i < buttons.length; i++) {
                        var sRel = buttons[i].call ? 'callback' : '',
                            sCls = buttons[i].cls  ? buttons[i].cls : 'default',
                            sIco = (buttons[i].cls && buttons[i].cls == 'green') ? 'check' : 'close'
                        
                        btnsHtml += FRAG.alertBtnFrag.replace('#btnMsg#', '<i class="fa fa-'+ sIco +'"></i> '+ buttons[i].name).replace('#callback#', sRel).replace('#class#', sCls)
                    }
                }
                if (type == that.options.types.prompt) {
                    input = '<p style="padding-top:5px;"><input type="text" class="form-control" name="'+ (that.options.promptname || 'prompt') +'" value=""></p>'
                }
                
                $newbox = 
                    $(FRAG.alertBoxFrag.replace('#type#', type)
                    .replace('#fa#', that.options.fas[type])
                    .replace('#title#', this.getTitle(type))
                    .replace('#message#', msg)
                    .replace('#prompt#', input)
                    .replace('#btnFragment#', btnsHtml))
                    .hide()
                    .appendTo('body')
                
                if ($box && $box.length) $box.remove()
                $box = $newbox
                
                tools.openPosition()
                
                if (timer) {
                    clearTimeout(timer)
                    timer = null
                }
                
                if (that.options.mask == null) {
                    if (!(that.options.types.info == type || that.options.types.correct == type))
                        $alertbg.show()
                }
                if (that.options.autoClose == null) {
                    if (that.options.types.info == type || that.options.types.correct == type) {
                        if (alertTimeout) { 
                            if (that.options.alertTimeout && that.options.alertTimeout != 3000)
                                alertTimeout = that.options.alertTimeout
                        } else {
                            alertTimeout = that.options.alertTimeout
                        }
                        timer = setTimeout(function() { tools.close() }, alertTimeout)
                    }
                }
                if (type == that.options.types.prompt) {
                    $box.find(':text').focus().val(that.options.promptval)
                }
                
                $btns = $box.find('.btn')
                
                $btns.each(function(i) {
                    $(this).on('click', $.proxy(function() {
                            if (type !== that.options.types.prompt || $btns.eq(i).hasClass('btn-red'))
                                that.tools.close()
                            
                            var call = buttons[i].call
                            
                            if (typeof call === 'string')   call = call.toFunc() 
                            if (typeof call === 'function') {
                                if (type == that.options.types.prompt) {
                                    var $input = $box.find('input'), value = $input.val()
                                    
                                    $input.focus(function() {
                                        $box.removeClass('has-error')
                                    })
                                    
                                    if (that.options.promptRequired === 'required' && !value) {
                                        $box.addClass('has-error')
                                    } else {
                                        that.tools.close()
                                        call.call(that, value)
                                    }
                                } else {
                                    call.call()
                                }
                            }
                        }, that)
                    )
                    
                    if (buttons[i].keyCode === BJUI.keyCode.ENTER) {
                        $(document).on('keydown.bjui.alertmsg.ok', {target:$btns.eq(i)}, tools.keydownOk)
                    }
                    if (buttons[i].keyCode === BJUI.keyCode.ESC) {
                        $(document).on('keydown.bjui.alertmsg.esc', {target:$btns.eq(i)}, tools.keydownEsc)
                    }
                })
            },
            alert: function(type, msg, btnoptions) {
                $.extend(that.options, typeof btnoptions === 'object' && btnoptions)
                
                var op      = $.extend({}, {okName:BJUI.regional.alertmsg.btnMsg.ok, okCall:null}, that.options)
                var buttons = [
                    {name:op.okName, call:op.okCall, cls:'default', keyCode:BJUI.keyCode.ENTER}
                ]
                
                this.open(type, msg, buttons)
            },
            close: function() {
                $(document).off('keydown.bjui.alertmsg.ok').off('keydown.bjui.alertmsg.esc')
                
                this.closePosition()
            }
        }
        
        return tools
    }
    
    Alertmsg.prototype.error = function(msg, btnoptions) {
        this.tools.alert(this.options.types.error, msg, btnoptions)
    }
    
    Alertmsg.prototype.info = function(msg, btnoptions) {
        this.tools.alert(this.options.types.info, msg, btnoptions)
    }
    
    Alertmsg.prototype.warn = function(msg, btnoptions) {
        this.tools.alert(this.options.types.warn, msg, btnoptions)
    }
    
    Alertmsg.prototype.ok = function(msg, btnoptions) {
        this.tools.alert(this.options.types.correct, msg, btnoptions)
    }
    
    Alertmsg.prototype.correct = function(msg, btnoptions) {
        this.tools.alert(this.options.types.correct, msg, btnoptions)
    }
    
    Alertmsg.prototype.confirm = function(msg, btnoptions) {
        $.extend(this.options, typeof btnoptions === 'object' && btnoptions)
        
        var op      = $.extend({}, {okName:BJUI.regional.alertmsg.btnMsg.ok, okCall:null, cancelName:BJUI.regional.alertmsg.btnMsg.cancel, cancelCall:null}, this.options)
        var buttons = [
            {name:op.okName, call:op.okCall, cls:'green', keyCode:BJUI.keyCode.ENTER},
            {name:op.cancelName, call:op.cancelCall, cls:'red', keyCode:BJUI.keyCode.ESC}
        ]
        
        this.tools.open(this.options.types.confirm, msg, buttons)
    }
    
    Alertmsg.prototype.prompt = function(msg, btnoptions) {
        $.extend(this.options, typeof btnoptions === 'object' && btnoptions)
        
        var that = this, op = $.extend({}, {okName:BJUI.regional.alertmsg.btnMsg.ok, okCall:null, cancelName:BJUI.regional.alertmsg.btnMsg.cancel, cancelCall:null}, this.options)
        
        if (op.okCall == null && (typeof that.options.prompt === 'object' && that.options.prompt)) {
            op.okCall = function(val) {
                var data = {}
                
                data[(that.options.promptname || 'prompt')] = val
                
                if (!that.options.prompt.data)
                    that.options.prompt.data = data
                else
                    $.extend(that.options.prompt.data, data)
                    
                BJUI.ajax('doajax', that.options.prompt)
            }
        }
        
        var buttons = [
            {name:op.okName, call:op.okCall, cls:'green', keyCode:BJUI.keyCode.ENTER},
            {name:op.cancelName, call:op.cancelCall, cls:'red', keyCode:BJUI.keyCode.ESC}
        ]
        
        this.tools.open(this.options.types.prompt, msg, buttons)
    }
    
    // ALERTMSG PLUGIN DEFINITION
    // =======================
    
    function Plugin(option) {
        var args     = arguments,
            property = option,
            alertmsg = 'bjui.alertmsg',
            $body    = $('body'),
            data     = $body.data(alertmsg)
        
        return this.each(function () {
            var $this   = $(this),
                options = $.extend({}, Alertmsg.DEFAULTS, typeof option === 'object' && option)
            
            if (!data) {
                data = new Alertmsg(options)
            } else {
                data.options = options
            }
            
            $body.data(alertmsg, data)
            
            if (typeof property === 'string' && $.isFunction(data[property])) {
                [].shift.apply(args)
                if (!args) data[property]()
                else data[property].apply(data, args)
            }
        })
    }
    
    var old = $.fn.alertmsg
    
    $.fn.alertmsg             = Plugin
    $.fn.alertmsg.Constructor = Alertmsg
    
    // ALERTMSG NO CONFLICT
    // =================
    
    $.fn.alertmsg.noConflict = function () {
        $.fn.alertmsg = old
        return this
    }
    
    // NOT SELECTOR
    // ==============
    
    BJUI.alertmsg = function() {
        Plugin.apply($('body'), arguments)
    }
    
    // NAVTAB DATA-API
    // ==============
    
    $(document).on('click.bjui.alertmsg.data-api', '[data-toggle="alertmsg"]', function(e) {
        var $this = $(this), data = $this.data(), options = data.options, type
        
        if (options) {
            if (typeof options === 'string') options = options.toObj()
            if (typeof options === 'object') {
                $.extend(data, options)
            }
        }
        
        type = data.type
        if (!type) return false
        if (!data.msg) {
            if (options.msg) data.msg = options.msg
        }
        
        Plugin.call($this, type, data.msg || type, data)
        
        e.preventDefault()
    })
    
}(jQuery);
/*!
 * B-JUI  v1.3 beta2 (http://b-jui.com)
 * Git@OSC (http://git.oschina.net/xknaan/B-JUI)
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 */

/* ========================================================================
 * B-JUI: bjui-pagination.js  v1.3 beta2
 * @author K'naan
 * http://git.oschina.net/xknaan/B-JUI/blob/master/BJUI/js/bjui-pagination.js
 * ========================================================================
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 * ======================================================================== */

+function ($) {
    'use strict';
    
    // PAGINATION CLASS DEFINITION
    // ======================
    
    var Pagination = function(element, options) {
        this.$element = $(element)
        this.options  = options
        this.tools    = this.TOOLS()
    }
    
    Pagination.DEFAULTS = {
        first : 'li.j-first',
        prev  : 'li.j-prev',
        next  : 'li.j-next',
        last  : 'li.j-last',
        nums  : 'li.j-num > a',
        jump  : 'li.jumpto',
        pageNumFrag : '<li class="#liClass#"><a href="javascript:;">#pageNum#</a></li>',
        total       : 0,
        pageSize    : 10,
        pageNum     : 10,
        pageCurrent : 1,
        callback    : function() { return false }
    }
    
    Pagination.prototype.TOOLS = function() {
        var that    = this
        var options = this.options
        var tools   = {
            pageNums: function() {
                return Math.ceil(options.total / options.pageSize)
            },
            getInterval: function() {
                var ne_half     = Math.ceil(options.pageNum / 2)
                var pn          = this.pageNums()
                var upper_limit = pn - options.pageNum
                var start       = this.getCurrentPage() > ne_half ? Math.max(Math.min(this.getCurrentPage() - ne_half, upper_limit), 0) : 0
                var end         = this.getCurrentPage() > ne_half ? Math.min(this.getCurrentPage() + ne_half, pn) : Math.min(options.pageNum, pn)
                
                return {start: start + 1, end:end + 1}
            },
            getCurrentPage: function() {
                var pageCurrent = parseInt(options.pageCurrent)
                
                return (isNaN(pageCurrent)) ? 1 : pageCurrent
            },
            hasPrev: function() {
                return this.getCurrentPage() > 1
            },
            hasNext: function() {
                return this.getCurrentPage() < this.pageNums()
            }
        }
        return tools
    }
    
    Pagination.prototype.init = function() {
        if (BJUI.ui.clientPaging && !this.getClientPaging()) this.setClientPaging({pageCurrent:this.options.pageCurrent, pageSize:this.options.pageSize})
        
        var that        = this,
            options     = this.options,
            tools       = this.tools,
            interval    = tools.getInterval(),
            pageNumFrag = '',
            pagination  = FRAG.pagination,
            pr          = BJUI.regional.pagination
        
        for (var i = interval.start; i < interval.end; i++) {
            pageNumFrag += options.pageNumFrag.replaceAll('#pageNum#', i).replaceAll('#liClass#', i == tools.getCurrentPage() ? 'selected j-num' : 'j-num')
        }
        
        pagination = 
            pagination
                .replaceAll('#pageNumFrag#', pageNumFrag)
                .replaceAll('#pageCurrent#', tools.getCurrentPage())
                .replaceAll('#first#', pr.first)
                .replaceAll('#last#', pr.last)
                .replaceAll('#prev#', pr.prev)
                .replaceAll('#next#', pr.next)
                .replaceAll('#jumpto#', pr.jumpto)
                .replaceAll('#jump#', pr.jump)
            
        this.$element.html(pagination)
        
        var $first = this.$element.find(options.first),
            $prev  = this.$element.find(options.prev),
            $next  = this.$element.find(options.next),
            $last  = this.$element.find(options.last)
        
        if (tools.hasPrev()){
            $first.add($prev).find('> span').hide()
            _bindEvent($prev, tools.getCurrentPage() - 1)
            _bindEvent($first, 1)
        } else {
            $first.add($prev).addClass('disabled').find('> a').hide()
        }
        if (tools.hasNext()) {
            $next.add($last).find('> span').hide()
            _bindEvent($next, tools.getCurrentPage() + 1)
            _bindEvent($last, tools.pageNums())
        } else {
            $next.add($last).addClass('disabled').find('> a').hide()
        }

        this.$element.find(options.nums).each(function(i) {
            _bindEvent($(this), i + interval.start)
        })
        
        this.$element.find(options.jump).each(function() {
            var $inputBox = $(this).find(':text'),
                $button   = $(this).find('.goto')
            
            $button.on('click', function() {
                var pageCurrent = $inputBox.val(), pagingInfo = {pageCurrent:pageCurrent, pageSize:options.pageSize}
                
                if (pageCurrent && pageCurrent.isPositiveInteger()) {
                    that.setClientPaging(pagingInfo)
                    $(this).bjuiajax('pageCallback', pagingInfo, that.$element.closest('.bjui-layout'))
                }
            })
            
            $inputBox.keyup(function(e) {
                if (e.keyCode == BJUI.keyCode.ENTER) $button.trigger('click')
            })
        })
        
        function _bindEvent($target, pageCurrent) {
            $target.on('click', function(e) {
                var pagingInfo = {pageCurrent:pageCurrent, pageSize:that.options.pageSize}
                
                that.setClientPaging(pagingInfo)
                $(this).bjuiajax('pageCallback', pagingInfo, that.$element.closest('.bjui-layout'))
                
                e.preventDefault()
            })
        }
    }
    
    Pagination.prototype.changePagesize = function() {
        var that = this, pageSize = that.$element.val(), pagingInfo = {pageSize:pageSize}
        
        if (!isNaN(pageSize)) {
            that.setClientPaging(pagingInfo)
            that.$element.bjuiajax('pageCallback', pagingInfo, that.$element.closest('.bjui-layout'))
        }
    }
    
    Pagination.prototype.orderBy = function(options) {
        var that = this
        
        that.$element.css({cursor:'pointer'}).click(function() {
            var orderField     = $(this).data('orderField'),
                orderDirection = $(this).data('orderDirection'),
                orderInfo      = {orderField:orderField, orderDirection:orderDirection}
            
            that.setClientPaging(orderInfo)
            $(this).bjuiajax('pageCallback', orderInfo, that.$element.closest('.bjui-layout'))
        })
    }
    
    Pagination.prototype.destroy = function() {
        this.$element.removeData('bjui.pagination').empty()
    }
    
    Pagination.prototype.getTarget = function() {
        var that = this, $target
        
        if (that.$element.closest('.bjui-layout').length) $target = that.$element.closest('.bjui-layout')
        else if (that.$element.closest('.navtab-panel').length) $target = $.CurrentNavtab
        else $target = $.CurrentDialog
        
        return $target
    }
    
    Pagination.prototype.getClientPaging = function() {
        return this.getTarget().data('bjui.clientPaging')
    }
    
    Pagination.prototype.setClientPaging = function(clientPaging) {
        if (BJUI.ui.clientPaging) {
            var $target = this.getTarget()
            
            $target.data('bjui.clientPaging', $.extend({}, $target.data('bjui.clientPaging') || {}, clientPaging))
        }
    }
    
    Pagination.prototype.setClientOrder = function(clientOrder) {
        if (BJUI.ui.clientPaging) {
            var clientPaging = this.getClientPaging()
            
            if (!clientPaging || !clientPaging.orderField) this.setClientPaging(clientOrder)
        }
    }
    
    Pagination.prototype.setPagingAndOrderby = function($target) {
        var clientPaging = $target.data('bjui.clientPaging')
        
        $target.find('[data-toggle="pagination"]')
            .pagination('destroy')
            .pagination(clientPaging)
        
        if (clientPaging.pageSize)
            $target.find('select[data-toggle-change="changepagesize"]').selectpicker('val', clientPaging.pageSize)
        if (clientPaging.orderField)
            $target.find('th[data-order-field="'+ clientPaging.orderField +'"]').addClass(clientPaging.orderDirection).siblings().removeClass('asc desc')
    }
    
    // PAGINATION PLUGIN DEFINITION
    // =======================
    
    function Plugin(option) {
        var args     = arguments,
            property = option
        
        return this.each(function () {
            var $this   = $(this),
                options = $.extend({}, Pagination.DEFAULTS, $this.data(), typeof option === 'object' && option),
                data    = $this.data('bjui.pagination')
            
            if (!data) $this.data('bjui.pagination', (data = new Pagination(this, options)))
            if (typeof property === 'string' && $.isFunction(data[property])) {
                [].shift.apply(args)
                if (!args) data[property]()
                else data[property].apply(data, args)
            } else {
                data.init()
            }
        })
    }
    
    var old = $.fn.pagination

    $.fn.pagination             = Plugin
    $.fn.pagination.Constructor = Pagination
    
    // PAGINATION NO CONFLICT
    // =================
    
    $.fn.pagination.noConflict = function () {
        $.fn.pagination = old
        return this
    }
    
    // PAGINATION DATA-API
    // ==============

    $(document).on(BJUI.eventType.initUI, function(e) {
        var $this = $(e.target).find('[data-toggle="pagination"]')
        
        if (!$this.length) return
        
        Plugin.call($this)
    })
    
    $(document).on('change.bjui.pagination.data-api', 'select[data-toggle-change="changepagesize"]', function(e) {
        var $this   = $(this)
        var options = $this.data()
        
        Plugin.call($this, 'changePagesize')
        
        e.preventDefault()
    })
    
}(jQuery);
/*!
 * B-JUI  v1.3 beta2 (http://b-jui.com)
 * Git@OSC (http://git.oschina.net/xknaan/B-JUI)
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 */

/* ========================================================================
 * B-JUI: bjui-util.date.js  v1.3 beta2
 * @author K'naan
 * http://git.oschina.net/xknaan/B-JUI/blob/master/BJUI/js/bjui-util.date.js
 * ========================================================================
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 * ======================================================================== */

+function ($) {
    'use strict';
    
    var MONTH_NAMES = new Array('January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec')

    var DAY_NAMES   = new Array('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat')

    function LZ(x) {
        return (x < 0 || x > 9 ? '' :'0') + x
    }

    /**
         * formatDate (date_object, format)
         * Returns a date in the output format specified.
         * The format string uses the same abbreviations as in parseDate()
         * @param {Object} date
         * @param {Object} format
         */
    function formatDate(date, format) {
        format       = format + ''
        var result   = ''
        var i_format = 0
        var c        = ''
        var token    = ''
        var y        = date.getYear() + ''
        var M        = date.getMonth() + 1
        var d        = date.getDate()
        var E        = date.getDay()
        var H        = date.getHours()
        var m        = date.getMinutes()
        var s        = date.getSeconds()
        var yyyy, yy, MMM, MM, dd, hh, h, mm, ss, ampm, HH, H, KK, K, kk, k
        // Convert real date parts into formatted versions
        var value = {}
        
        if (y.length < 4) {
            y = '' + (y - 0 + 1900)
        }
        value['y']    = '' + y
        value['yyyy'] = y
        value['yy']   = y.substring(2, 4)
        value['M']    = M
        value['MM']   = LZ(M)
        value['MMM']  = MONTH_NAMES[M - 1]
        value['NNN']  = MONTH_NAMES[M + 11]
        value['d']    = d
        value['dd']   = LZ(d)
        value['E']    = DAY_NAMES[E + 7]
        value['EE']   = DAY_NAMES[E]
        value['H']    = H
        value['HH']   = LZ(H)
        
        if (!H) {
            value['h'] = 12
        } else if (H > 12) {
            value['h'] = H - 12
        } else {
            value['h'] = H
        }
        value['hh'] = LZ(value['h'])
        
        if (H > 11) {
            value['K'] = H - 12
        } else {
            value['K'] = H
        }
        value['k']  = H + 1
        value['KK'] = LZ(value['K'])
        value['kk'] = LZ(value['k'])
        
        if (H > 11) {
            value['a'] = 'PM'
        } else {
            value['a'] = 'AM'
        }
        value['m']  = m
        value['mm'] = LZ(m)
        value['s']  = s
        value['ss'] = LZ(s)
        
        while (i_format < format.length) {
            c     = format.charAt(i_format)
            token = ''
            
            while (format.charAt(i_format) == c && i_format < format.length) {
                token += format.charAt(i_format++)
            }
            if (value[token] != null) {
                result += value[token]
            } else {
                result += token
            }
        }
        return result
    }

    function _isInteger(val) {
        return new RegExp(/^\d+$/).test(val)
    }

    function _getInt(str, i, minlength, maxlength) {
        for (var x = maxlength; x >= minlength; x--) {
            var token = str.substring(i, i + x)
            
            if (token.length < minlength) {
                return null
            }
            if (_isInteger(token)) {
                return token
            }
        }
        return null
    }

    /**
         * parseDate( date_string , format_string )
         * 
         * This function takes a date string and a format string. It matches
         * If the date string matches the format string, it returns the date. 
         * If it does not match, it returns 0.
         * @param {Object} val
         * @param {Object} format
         */
    function parseDate(val, format) {
        val          = val + ''
        format       = format + ''
        
        var i_val    = 0
        var i_format = 0
        var c        = ''
        var token    = ''
        var token2   = ''
        var x, y
        var now      = new Date(1900, 0, 1)
        var year     = now.getYear()
        var month    = now.getMonth() + 1
        var date     = 1
        var hh       = now.getHours()
        var mm       = now.getMinutes()
        var ss       = now.getSeconds()
        var ampm     = ''
        
        while (i_format < format.length) {
            // Get next token from format string
            c     = format.charAt(i_format)
            token = ''
            while (format.charAt(i_format) == c && i_format < format.length) {
                token += format.charAt(i_format++)
            }
            // Extract contents of value based on format token
            if (token == 'yyyy' || token == 'yy' || token == 'y') {
                if (token == 'yyyy') {
                    x = 4
                    y = 4
                }
                if (token == 'yy') {
                    x = 2
                    y = 2
                }
                if (token == 'y') {
                    x = 2
                    y = 4
                }
                year = _getInt(val, i_val, x, y)
                if (year == null) {
                    return 0
                }
                i_val += year.length
                if (year.length == 2) {
                    if (year > 70) {
                        year = 1900 + (year - 0)
                    } else {
                        year = 2e3 + (year - 0)
                    }
                }
            } else if (token == 'MMM' || token == 'NNN') {
                month = 0
                for (var i = 0; i < MONTH_NAMES.length; i++) {
                    var month_name = MONTH_NAMES[i]
                    
                    if (val.substring(i_val, i_val + month_name.length).toLowerCase() == month_name.toLowerCase()) {
                        if (token == 'MMM' || token == 'NNN' && i > 11) {
                            month = i + 1
                            if (month > 12) {
                                month -= 12
                            }
                            i_val += month_name.length
                            break
                        }
                    }
                }
                if (month < 1 || month > 12) {
                    return 0
                }
            } else if (token == 'EE' || token == 'E') {
                for (var i = 0; i < DAY_NAMES.length; i++) {
                    var day_name = DAY_NAMES[i]
                    
                    if (val.substring(i_val, i_val + day_name.length).toLowerCase() == day_name.toLowerCase()) {
                        i_val += day_name.length
                        break
                    }
                }
            } else if (token == 'MM' || token == 'M') {
                month = _getInt(val, i_val, token.length, 2)
                if (month == null || month < 1 || month > 12) {
                    return 0
                }
                i_val += month.length
            } else if (token == 'dd' || token == 'd') {
                date = _getInt(val, i_val, token.length, 2)
                if (date == null || date < 1 || date > 31) {
                    return 0
                }
                i_val += date.length
            } else if (token == 'hh' || token == 'h') {
                hh = _getInt(val, i_val, token.length, 2)
                if (hh == null || hh < 1 || hh > 12) {
                    return 0
                }
                i_val += hh.length
            } else if (token == 'HH' || token == 'H') {
                hh = _getInt(val, i_val, token.length, 2)
                if (hh == null || hh < 0 || hh > 23) {
                    return 0
                }
                i_val += hh.length
            } else if (token == 'KK' || token == 'K') {
                hh = _getInt(val, i_val, token.length, 2)
                if (hh == null || hh < 0 || hh > 11) {
                    return 0
                }
                i_val += hh.length
            } else if (token == 'kk' || token == 'k') {
                hh = _getInt(val, i_val, token.length, 2)
                if (hh == null || hh < 1 || hh > 24) {
                    return 0
                }
                i_val += hh.length
                hh--
            } else if (token == 'mm' || token == 'm') {
                mm = _getInt(val, i_val, token.length, 2)
                if (mm == null || mm < 0 || mm > 59) {
                    return 0
                }
                i_val += mm.length
            } else if (token == 'ss' || token == 's') {
                ss = _getInt(val, i_val, token.length, 2)
                if (ss == null || ss < 0 || ss > 59) {
                    return 0
                }
                i_val += ss.length
            } else if (token == 'a') {
                if (val.substring(i_val, i_val + 2).toLowerCase() == 'am') {
                    ampm = 'AM'
                } else if (val.substring(i_val, i_val + 2).toLowerCase() == 'pm') {
                    ampm = 'PM'
                } else {
                    return 0
                }
                i_val += 2
            } else {
                if (val.substring(i_val, i_val + token.length) != token) {
                    return 0
                } else {
                    i_val += token.length
                }
            }
        }
        // If there are any trailing characters left in the value, it doesn't match
        if (i_val != val.length) {
            return 0
        }
        // Is date valid for month?
        if (month == 2) {
            // Check for leap year
            if (year % 4 == 0 && year % 100 != 0 || year % 400 == 0) {
                // leap year
                if (date > 29) {
                    return 0
                }
            } else {
                if (date > 28) {
                    return 0
                }
            }
        }
        if (month == 4 || month == 6 || month == 9 || month == 11) {
            if (date > 30) {
                return 0
            }
        }
        // Correct hours value
        if (hh < 12 && ampm == 'PM') {
            hh = hh - 0 + 12
        } else if (hh > 11 && ampm == 'AM') {
            hh -= 12
        }
        
        return new Date(year, month - 1, date, hh, mm, ss)
    }

    Date.prototype.formatDate = function(dateFmt) {
        return formatDate(this, dateFmt)
    }

    String.prototype.parseDate = function(dateFmt) {
        if (this.length < dateFmt.length) {
            dateFmt = dateFmt.slice(0, this.length)
        }
        return parseDate(this, dateFmt)
    }

    /**
     * replaceTmEval('{1+2}-{2-1}')
     */
    function replaceTmEval(data) {
        return data.replace(RegExp('({[A-Za-z0-9_+-]*})', 'g'), function($1) {
            return eval('(' + $1.replace(/[{}]+/g, '') + ')')
        })
    }

    /**
     * dateFmt:%y-%M-%d
     * %y-%M-{%d+1}
     * ex: new Date().formatDateTm('%y-%M-{%d-1}')
     *     new Date().formatDateTm('2012-1')
     */
    Date.prototype.formatDateTm = function(dateFmt) {
        var y = this.getFullYear()
        var m = this.getMonth() + 1
        var d = this.getDate()
        var sDate = dateFmt.replaceAll('%y', y).replaceAll('%M', m).replaceAll('%d', d)
        
        sDate = replaceTmEval(sDate)
        
        var _y = 1900, _m = 0, _d = 1
        var aDate = sDate.split('-')
        
        if (aDate.length > 0) _y = aDate[0]
        if (aDate.length > 1) _m = aDate[1] - 1
        if (aDate.length > 2) _d = aDate[2]
        
        return new Date(_y, _m, _d).formatDate('yyyy-MM-dd')
    }
    
}(jQuery);
/*!
 * B-JUI  v1.3 beta2 (http://b-jui.com)
 * Git@OSC (http://git.oschina.net/xknaan/B-JUI)
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 */

/* ========================================================================
 * B-JUI: bjui-datepicker.js  v1.3 beta2
 * reference: util.date.js
 * @author K'naan
 * http://git.oschina.net/xknaan/B-JUI/blob/master/BJUI/js/bjui-datepicker.js
 * ========================================================================
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 * ======================================================================== */

+function ($) {
    'use strict';

    // DATEPICKER GLOBAL ELEMENTS
    // ======================
    
    var $box, $main, $prev, $next, $year, $month, $time, $timeinps, $spinner, $hh, $mm, $ss, $tm, $close, $days, $dayNames, $clearBtn, $okBtn
    
    $(function() {
        var INIT_DATEPICKER = function() {
            var cp       = BJUI.regional.datepicker
            var calendar = FRAG.calendarFrag
                .replace('#close#', cp.close)
                .replace('#prev#', cp.prev)
                .replace('#next#', cp.next)
                .replace('#clear#', cp.clear)
                .replace('#ok#', cp.ok)
            
            $box      = $(calendar).hide()
            $('body').append('<!-- datepicker -->').append($box)
            $main     = $box.find('> .main')
            $prev     = $box.find('a.prev')
            $next     = $box.find('a.next')
            $year     = $box.find('select[name=year]')
            $month    = $box.find('select[name=month]')
            $time     = $box.find('.time')
            $timeinps = $time.find(':text')
            $spinner  = $time.find('ul > li')
            $hh       = $time.find('.hh')
            $mm       = $time.find('.mm')
            $ss       = $time.find('.ss')
            $tm       = $main.find('> .tm')
            $close    = $box.find('.close')
            $days     = $main.find('> .body > .days')
            $dayNames = $main.find('> .body > .dayNames')
            $clearBtn = $box.find('.clearBtn')
            $okBtn    = $box.find('.okBtn')
            
            //regional
            var dayNames = '', dr = BJUI.regional.datepicker
            
            $.each(dr.dayNames, function(i, v) {
                dayNames += '<dt>'+ v +'</dt>'
            })
            $dayNames.html(dayNames)
            $.each(dr.monthNames, function(i, v) {
                var m = i + 1
                
                $month.append('<option value="'+ m +'">'+ v +'</option>')
            })
        
            $box.on('selectstart', function() { return false })
        }
        
        INIT_DATEPICKER()
    })
    
    // DATEPICKER CLASS DEFINITION
    // ======================
    var Datepicker = function(element, options) {
        this.$element = $(element)
        this.options  = options
        this.tools    = this.TOOLS()
        this.$dateBtn = null
                
        // minDate、maxDate
        var now = new Date()
        
        this.options.minDate = now.formatDateTm(this.options.minDate)
        this.options.maxDate = now.formatDateTm(this.options.maxDate)
        
        //events
        this.events = {
            focus_time    : 'focus.bjui.datepicker.time',
            click_prev    : 'click.bjui.datepicker.prev',
            click_next    : 'click.bjui.datepicker.next',
            click_ok      : 'click.bjui.datepicker.ok',
            click_days    : 'click.bjui.datepicker.days',
            click_clear   : 'click.bjui.datepicker.clear',
            click_close   : 'click.bjui.datepicker.close',
            click_tm      : 'click.bjui.datepicker.tm',
            click_spinner : 'click.bjui.datepicker.spinner',
            mousedown_sp  : 'mousedown.bjui.datepicker.spinner',
            mouseup_sp    : 'mouseup.bjui.datepicker.spinner',
            change_ym     : 'change.bjui.datepicker.ym',
            click_time    : 'click.bjui.datepicker.time',
            keydown_time  : 'keydown.bjui.datepicker.time',
            keyup_time    : 'keyup.bjui.datepicker.time'
        }
    }
    
    Datepicker.DEFAULTS = {
        pattern : 'yyyy-MM-dd',
        minDate : '1900-01-01',
        maxDate : '2099-12-31',
        mmStep  : 1,
        ssStep  : 1
    }
    
    Datepicker.EVENTS = {
        afterChange : 'afterchange.bjui.datepicker'
    }
    
    Datepicker.prototype.TOOLS = function() {
        var that  = this
        var tools = {
            changeTmMenu: function(sltClass) {
                $tm.removeClass('hh').removeClass('mm').removeClass('ss')
                if (sltClass) {
                    $tm.addClass(sltClass)
                    $timeinps.removeClass('slt').filter('.'+ sltClass).addClass('slt')
                }
            },
            clickTmMenu: function($input, type) {
                $tm
                    .find('> ul')
                    .hide()
                    .filter('.'+ type)
                    .show()
                    .find('> li')
                    .off(that.events.click_tm)
                    .on(that.events.click_tm, function() {
                        var $li = $(this)
                        var val = parseInt($li.text()) < 10 ? ('0'+ $li.text()) : $li.text()
                        
                        $input.val(val)
                    })
            },
            keydownInt: function(e) {
                if (!((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode == BJUI.keyCode.DELETE || e.keyCode == BJUI.keyCode.BACKSPACE))) { return false }
            },
            changeTm: function($input, $btn) {
                var ivalue = parseInt($input.val()), istart = parseInt($input.data('start')) || 0, iend = parseInt($input.data('end'))
                var istep  = parseInt($input.data('step') || 1)
                var type   = $btn ? ($btn.data('add') ? $btn.data('add') : -1) : 0
                var newVal = ivalue
                
                if (type == 1) {
                    if (ivalue <= iend - istep) 
                        newVal = ivalue + istep
                } else if (type == -1) {
                    if (ivalue >= (istart + istep))
                        newVal = ivalue - istep
                } else if (ivalue > iend) {
                    newVal = iend
                } else if (ivalue < istart) {
                    newVal = istart
                }
                if (newVal < 10) newVal = '0'+ newVal
                $input.val(newVal)
            },
            closeCalendar: function(flag) {
                tools.changeTmMenu()
                if (flag) {
                    $(document).off(that.events.click_close)
                    $box.hide()
                }
            },
            get: function(name) {
                return that.options[name]
            },
            getDays: function (y, m) {
                return m == 2 ? (y % 4 || (!(y % 100) && y % 400) ? 28 : 29) : (/4|6|9|11/.test(m) ? 30 : 31)
            },
            minMaxDate: function(sDate) {
                var _count  = sDate.split('-').length - 1
                var _format = 'y-M-d'
                
                if (_count == 1) _format = 'y-M'
                else if (!_count) _format = 'y'
                
                return sDate.parseDate(_format)
            },
            getMinDate: function() {
                return this.minMaxDate(that.options.minDate)
            },
            getMaxDate: function() {
                var _sDate = that.options.maxDate
                var _count = _sDate.split('-').length - 1
                var _date  = this.minMaxDate(_sDate)
                
                if (_count < 2) { //format:y-M、y
                    var _day = this.getDays(_date.getFullYear(), _date.getMonth() + 1)
                    _date.setDate(_day)
                    if (!_count)//format:y
                        _date.setMonth(11)
                }
                
                return _date
            },
            getDateWrap: function(date) {
                if (!date) date = this.parseDate(that.sDate) || new Date()
                
                var y = date.getFullYear(),
                    m = date.getMonth() + 1,
                    days = this.getDays(y, m)
                
                return {
                    year: y, month: m, day: date.getDate(),
                    hour: date.getHours(), minute: date.getMinutes(), second: date.getSeconds(),
                    days: days, date: date
                }
            },
            changeDate: function(y, m, d) {
                var date = new Date(y, m - 1, d || 1)
                
                that.sDate = this.formatDate(date)
                
                return date
            },
            changeDateTime: function(y, M, d, H, m, s) {
                var date    = new Date(y, M - 1, d, H, m, s)
                
                that.sDate = this.formatDate(date)
                return date
            },
            changeDay: function(day, chMonth) {
                if (!chMonth) chMonth = 0
                var dw = this.getDateWrap()
                
                return this.changeDate(dw.year, dw.month + parseInt(chMonth), day)
            },
            changeMonth: function(type) {
                var yearIndex = $year.get(0).selectedIndex
                var maxYear   = $year.find('option').length
                var month     = ($month.val() * 1) + type
                
                if (!month) {
                    if (!yearIndex) {
                        month = 1
                    } else {
                        month = 12
                        yearIndex--
                        $year.get(0).selectedIndex = yearIndex
                    }
                } else if (month == 13) {
                    if (yearIndex == (maxYear - 1)) {
                        month = 12
                    } else {
                        month = 1
                        yearIndex++
                        $year.get(0).selectedIndex = yearIndex
                    }
                }
                $month.val(month).change()
            },
            parseDate: function(sDate) {
                if (!sDate) return null
                return sDate.parseDate(that.options.pattern)
            },
            formatDate: function(date) {
                return date.formatDate(that.options.pattern)
            },
            hasHour: function() {
                return that.options.pattern.indexOf('H') != -1
            },
            hasMinute: function() {
                return that.options.pattern.indexOf('m') != -1
            },
            hasSecond: function() {
                return that.options.pattern.indexOf('s') != -1
            },
            hasTime: function() {
                return this.hasHour() || this.hasMinute() || this.hasSecond()
            },
            hasDate: function() {
                var _dateKeys = ['y','M','d','E']
                
                for (var i = 0; i < _dateKeys.length; i++) {
                    if (that.options.pattern.indexOf(_dateKeys[i]) != -1) return true
                }
                return false
            },
            afterChange: function(date) {
                var value = date ? this.formatDate(date) : ''
                
                that.$element
                    .trigger(Datepicker.EVENTS.afterChange, {date:date, value:value})
                    .trigger('change')
            }
        }
        return tools
    }
    
    Datepicker.prototype.addBtn = function() {
        var that = this, $element = that.$element, fluid = $element.attr('size') ? '' : ' fluid'
        
        if ($element.data('nobtn')) return
        
        if (!this.$dateBtn && !this.options.addbtn && !$element.parent().hasClass('wrap_bjui_btn_box')) {
            this.$dateBtn = $(FRAG.dateBtn)
            this.$element.css({'paddingRight':'15px'}).wrap('<span class="wrap_bjui_btn_box'+ fluid +'"></span>')
            
            var $box   = this.$element.parent()
            var height = this.$element.addClass('form-control').innerHeight()
            
            $box.css({'position':'relative', 'display':'inline-block'})
            
            this.$dateBtn.css({'height':height, 'lineHeight':height +'px'}).appendTo($box)
            this.$dateBtn.on('selectstart', function() { return false })
        }
    }
    
    Datepicker.prototype.init = function() {
        if (!this.$element.is(':text')) return
        if (this.$element.val()) this.sDate = this.$element.val().trim()
        
        var that      = this,
            options   = this.options,
            tools     = this.tools,
            dw        = tools.getDateWrap(),
            minDate   = tools.getMinDate(), maxDate = tools.getMaxDate(),
            yearstart = minDate.getFullYear(), yearend = maxDate.getFullYear()
        
        if (!options.toggle || options.toggle !== 'datepicker' && !that.JSAPI)
            that.$element.data('JSAPI', true)
        
        $year.empty()
        for (var y = yearstart; y <= yearend; y++) {
            $year.append('<option value="'+ y +'"'+ (dw.year == y ? ' selected' : '') +'>'+ y +'</option>')
        }
        
        $month.val(dw.month)
        $year.add($month).off(this.events.change_ym).on(this.events.change_ym, function() {
            if (tools.hasTime()) {
                var $day = $days.find('.slt')
                var date = tools.changeDateTime($year.val(), $month.val(), $day.data('day'), dw.hour, dw.minute, dw.second)
                
                that.create(tools.getDateWrap(date), minDate, maxDate)
            } else {
                var $day = $days.find('.slt')
                var date = tools.changeDate($year.val(), $month.val(), $day.data('day'))
                
                that.create(tools.getDateWrap(date), minDate, maxDate)
            }
        })
        $prev.off(this.events.click_prev).on(this.events.click_prev, function() {
            that.tools.changeMonth(-1)
        })
        $next.off(this.events.click_prev).on(this.events.click_prev, function() {
            that.tools.changeMonth(1)
        })
        $clearBtn.off(this.events.click_clear).on(this.events.click_clear, function() {
            that.$element.val('')
            tools.closeCalendar(true)
            tools.afterChange('')
        })
        $okBtn.off(this.events.click_ok).on(this.events.click_ok, function() {
            var $dd = $days.find('dd.slt')
            
            if ($dd.hasClass('disabled')) return false
            
            var date = tools.changeDay($dd.data('day'), $dd.data('month'))
            
            if (tools.hasTime()) {
                date.setHours(parseInt($hh.val()))
                date.setMinutes(parseInt($mm.val()))
                date.setSeconds(parseInt($ss.val()))
            }
            tools.closeCalendar(true)
            that.$element.val(tools.formatDate(date)).focus()
            
            //changedEvent
            tools.afterChange(date)
        })
        $close.off(this.events.click_close).on(this.events.click_close, function() {
            tools.closeCalendar(true)
        })
        $(document).off(this.events.click_close).on(this.events.click_close, function(e) {
            var $target = $(e.target)
            
            if (e.target == that.$element.get(0)) return
            if ($target.closest('#calendar').length) return
            if ($target.data('toggle') == 'datepicker' || $target.parent().data('toggle') == 'datepickerbtn' || $target.data('toggle') == 'datepickerbtn' || $target.data('JSAPI'))
                tools.closeCalendar(false)
            else
                tools.closeCalendar(true)
        })
        
        that.dw = dw
        that.minDate = minDate
        that.maxDate = maxDate
        
        // if js API
        if (that.$element.data('JSAPI')) {
            // add btn
            if (!options.nobtn)
                that.addBtn()
            // event
            that.$element.off('click.bjui.datepicker.data-api').on('click.bjui.datepicker.data-api', $.proxy(function(e) {
                that.create()
            }, that))
            
            if (!options.nobtn) {
                that.$element.parent('.wrap_bjui_btn_box').find('[data-toggle="datepickerbtn"]').off('click.bjui.datepicker.data-api').on('click.bjui.datepicker.data-api', $.proxy(function(e) {
                    that.create()
                }, that))
            }
        }
    }
    
    Datepicker.prototype.create = function(dw, minDate, maxDate) {
        if (!dw) {
            this.init()
            
            dw = this.dw
            minDate = this.minDate
            maxDate = this.maxDate
        }
        
        var that       = this,
            options    = this.options,
            tools      = this.tools,
            monthStart = new Date(dw.year, dw.month - 1, 1),
            startDay   = monthStart.getDay(),
            dayStr     = ''
        
        if (startDay > 0) {
            monthStart.setMonth(monthStart.getMonth() - 1)
            var prevDateWrap = tools.getDateWrap(monthStart)
            
            for (var t = prevDateWrap.days - startDay + 1; t <= prevDateWrap.days; t++) {
                var _date     = new Date(dw.year, dw.month - 2, t)
                var _ctrClass = (_date >= minDate && _date <= maxDate) ? '' : ' disabled'
                
                dayStr += '<dd class="other'+ _ctrClass +'" data-month="-1" data-day="'+ t +'">'+ t +'</dd>'
            }
        }
        for (var t = 1; t <= dw.days; t++) {
            var _date     = new Date(dw.year, dw.month - 1, t)
            var _ctrClass = (_date >= minDate && _date <= maxDate) ? '' : 'disabled'
            
            if (t == dw.day)
                _ctrClass += ' slt'
            dayStr += '<dd class="'+ _ctrClass +'" data-day="'+ t +'">'+ t +'</dd>'
        }
        for (var t = 1; t <= 42 - startDay - dw.days; t++) {
            var _date     = new Date(dw.year, dw.month, t)
            var _ctrClass = (_date >= minDate && _date <= maxDate) ? '' : ' disabled'
            
            dayStr += '<dd class="other'+ _ctrClass +'" data-month="1" data-day="'+ t +'">'+ t +'</dd>'
        }
        
        var $alldays = $days.html(dayStr).find('dd')
        
        $alldays.not('.disabled').off(this.events.click_days).on(this.events.click_days, function() {
            var $day = $(this)
            
            if (!tools.hasTime()) {
                var date = tools.changeDay($day.data('day'), $day.data('month'))
                
                tools.closeCalendar(true)
                that.$element.val(tools.formatDate(date)).focus()
                
                //changedEvent
                tools.afterChange(date)
            } else {
                $alldays.removeClass('slt')
                $day.addClass('slt')
            }
        })
        
        if (!tools.hasDate()) {
            $main.addClass('nodate') // only time
        } else {
            $main.removeClass('nodate')
        }
        if (tools.hasTime()) {
            $time.show()
            $hh.val(dw.hour < 10 ? ('0'+ dw.hour) : dw.hour).off(this.events.focus_time).on(this.events.focus_time, function() {
                tools.changeTmMenu('hh')
            })
            
            var iMinute = parseInt(dw.minute / options.mmStep) * options.mmStep
            
            $mm.val(iMinute < 10 ? ('0'+ iMinute) : iMinute).data('step', options.mmStep).off(this.events.focus_time).on(this.events.focus_time, function() {
                tools.changeTmMenu('mm')
            })
            $ss.val(tools.hasSecond() ? (dw.second < 10 ? ('0'+ dw.second) : dw.second) : '00').data('step', options.ssStep).off(this.events.focus_time).on(this.events.focus_time, function() {
                tools.changeTmMenu('ss')
            })
            $box.off('click').on('click', function(e) {
                if ($(e.target).closest('.time').length) return
                $tm.find('> ul').hide()
                tools.changeTmMenu()
            })
            $timeinps.off(this.events.keydown_time).on(this.events.keydown_time, tools.keydownInt).each(function() {
                var $input = $(this)
                
                $input.off(that.events.keyup_time).on(that.events.keyup_time, function() {
                    tools.changeTm($input)
                })
            }).off(this.events.click_time).on(this.events.click_time, function() {
                tools.clickTmMenu($(this), $(this).data('type'))
            })
            
            var timer = null
            
            $spinner.off(this.events.click_spinner).on(this.events.click_spinner, function(e) {
                var $btn = $(this)
                
                $timeinps.filter('.slt').each(function() {
                    tools.changeTm($(this), $btn)
                })
                
                e.preventDefault()
            }).off(this.events.mousedown_sp).on(this.events.mousedown_sp, function(e) {
                var $btn = $(this)
                
                timer = setInterval(function() {
                    $timeinps.filter('.slt').each(function() {
                        tools.changeTm($(this), $btn)
                    })
                }, 150)
            }).off(this.events.mouseup_sp).on(this.events.mouseup_sp, function(e) {
                clearTimeout(timer)
            })
            
            if (!tools.hasHour())   $hh.attr('disabled', true)
            if (!tools.hasMinute()) $mm.attr('disabled', true)
            if (!tools.hasSecond()) $ss.attr('disabled', true)
        } else {
            $time.hide()
        }
        this.show()
    }
    
    Datepicker.prototype.show = function() {
        var offset = this.$element.offset(),
            iTop   = offset.top + this.$element.get(0).offsetHeight,
            iLeft  = offset.left, 
            iBoxH  = $box.outerHeight(true),// fix top
            iBoxW  = $box.outerWidth(true), // fix left
            css    = {}
        
        if (iTop > iBoxH && iTop > $(window).height() - iBoxH)
            iTop = offset.top - iBoxH
        
        css.left = iLeft
        css.top  = iTop
            
        if (iLeft > $(window).width() - iBoxW) {
            delete css.left
            css.right = 10
        }
        
        $box.css(css).show().click(function(e) {
            e.stopPropagation()
        })
    }
    
    // DATEPICKER PLUGIN DEFINITION
    // =======================
    
    function Plugin(option) {
        var args     = arguments
        var property = option
        
        return this.each(function () {
            var $this   = $(this)
            var options = $.extend({}, Datepicker.DEFAULTS, $this.data(), typeof option === 'object' && option)
            var data    = $this.data('bjui.datepicker')
            
            if (!data) $this.data('bjui.datepicker', (data = new Datepicker(this, options)))
            if (typeof property === 'string' && $.isFunction(data[property])) {
                [].shift.apply(args)
                if (!args) data[property]()
                else data[property].apply(data, args)
            } else {
                data.init()
            }
        })
    }

    var old = $.fn.datepicker
    
    $.fn.datepicker             = Plugin
    $.fn.datepicker.Constructor = Datepicker
    
    // DATEPICKER NO CONFLICT
    // =================
    
    $.fn.datepicker.noConflict = function () {
        $.fn.datepicker = old
        return this
    }
    
    // DATEPICKER DATA-API
    // ==============
    
    $(document).on(BJUI.eventType.initUI, function(e) {
        $(e.target).find('[data-toggle="datepicker"]').each(function() {
            var $this = $(this)
            
            if (!$this.length) return
            if ($this.data('nobtn')) return
            
            Plugin.call($this, 'addBtn')
        })
    })
    
    $(document).on('click.bjui.datepicker.data-api', '[data-toggle="datepickerbtn"]', function(e) {
        var $date = $(this).prevAll('[data-toggle="datepicker"]')
        
        if (!$date || !$date.is(':text')) return
        Plugin.call($date, 'create')
        
        e.preventDefault()
    })
    
    $(document).on('click.bjui.datepicker.data-api', '[data-toggle="datepicker"]', function(e) {
        var $this = $(this)
        
        if ($this.data('onlybtn')) return
        if (!$this.is(':text')) return
        Plugin.call($this, 'create')
        
        e.preventDefault()
    })

}(jQuery);
/*!
 * B-JUI  v1.3 beta2 (http://b-jui.com)
 * Git@OSC (http://git.oschina.net/xknaan/B-JUI)
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 */

/* ========================================================================
 * B-JUI: bjui-ajaxtab.js  v1.3 beta2
 * @author K'naan
 * http://git.oschina.net/xknaan/B-JUI/blob/master/BJUI/js/bjui-ajaxtab.js
 * ========================================================================
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 * ======================================================================== */

+function ($) {
    'use strict';
    
    // AJAXTAB CLASS DEFINITION
    // ======================
    
    var Ajaxtab = function(element, options) {
        this.$element = $(element)
        this.options  = options
    }
    
    Ajaxtab.DEFAULTS = {
        url    : undefined,
        target : undefined,
        reload : false
    }
    
    Ajaxtab.prototype.init = function() {
        var options = this.options
        
        if (!(options.url)) {
            BJUI.debug('Ajaxtab Plugin: Error trying to open a tab, url is undefined!')
            return
        } else {
            options.url = decodeURI(options.url).replacePlh(this.$element.closest('.unitBox'))
            
            if (!options.url.isFinishedTm()) {
                this.$element.alertmsg('error', (options.warn || BJUI.regional.plhmsg))
                BJUI.debug('Ajaxtab Plugin: The new ajaxtab\'s url is incorrect, url: '+ options.url)
                return
            }
            
            options.url = encodeURI(options.url)
        }
        if (!options.target) {
            BJUI.debug('Ajaxtab Plugin: Attribute \'target\' is not defined!')
            return
        }
        if (options.reload) {
            this.load()
        } else {
            var reload = this.$element.data('bjui.ajaxtab.reload')
            
            if (!reload) this.load()
            else this.$element.tab('show')
        }
    }
    
    Ajaxtab.prototype.load = function() {
        var $element = this.$element
        var options  = this.options
        
        $(options.target).ajaxUrl({
            url      : options.url,
            data     : {},
            callback : function() {
                $element.data('bjui.ajaxtab.reload', true).tab('show')
            }
        })
    }
    
    // AJAXTAB PLUGIN DEFINITION
    // =======================
    
    function Plugin(option) {
        var args     = arguments
        var property = option
        
        return this.each(function () {
            var $this   = $(this)
            var options = $.extend({}, Ajaxtab.DEFAULTS, $this.data(), typeof option === 'object' && option)
            var data    = $this.data('bjui.ajaxtab')
            
            if (!data) $this.data('bjui.ajaxtab', (data = new Ajaxtab(this, options)))
            if (typeof property === 'string' && $.isFunction(data[property])) {
                [].shift.apply(args)
                if (!args) data[property]()
                else data[property].apply(data, args)
            } else {
                data.init()
            }
        })
    }

    var old = $.fn.ajaxtab

    $.fn.ajaxtab             = Plugin
    $.fn.ajaxtab.Constructor = Ajaxtab
    
    // AJAXTAB NO CONFLICT
    // =================
    
    $.fn.ajaxtab.noConflict = function () {
        $.fn.ajaxtab = old
        return this
    }
    
    // AJAXTAB DATA-API
    // ==============

    $(document).on('click.bjui.ajaxtab.data-api', '[data-toggle="ajaxtab"]', function(e) {
        var $this   = $(this)
        var options = $this.data()
        
        if (!options.url) options.url = $this.attr('href')
        Plugin.call($this, options)
        
        e.preventDefault()
    })
    
}(jQuery);
/*!
 * B-JUI  v1.3 beta2 (http://b-jui.com)
 * Git@OSC (http://git.oschina.net/xknaan/B-JUI)
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 */

/* ========================================================================
 * B-JUI: bjui-datagrid.js  v1.3 beta2
 * @author K'naan
 * http://git.oschina.net/xknaan/B-JUI/blob/master/BJUI/js/bjui-datagrid.js
 * ========================================================================
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 * ======================================================================== */

+function ($) {
    'use strict';
    
    // DATAGRID CLASS DEFINITION
    // ======================
    
    var Datagrid = function(element, options) {
        this.$element = $(element)
        this.options  = options
        this.tools    = this.TOOLS()
        
        this.datanames = {
            tbody      : 'bjui.datagrid.tbody.dom',
            td_html    : 'bjui.datagrid.td.html',
            changeData : 'bjui.datagrid.tr.changeData'
        }
        
        this.classnames = {
            s_checkbox    : 'datagrid-checkbox',
            s_linenumber  : 'datagrid-linenumber',
            s_edit        : 'datagrid-column-edit',
            s_lock        : 'datagrid-lock',
            s_menu        : 'datagrid-menu-box',
            s_filter      : 'datagrid-filter-box',
            s_showhide    : 'datagrid-showhide-box',
            th_cell       : 'datagrid-cell',
            th_menu       : 'datagrid-column-menu',
            btn_menu      : 'datagrid-column-menu-btn',
            th_col        : 'datagrid-col',
            th_field      : 'datagrid-col-field',
            th_sort       : 'datagrid-sortable',
            th_resize     : 'datagrid-resize-head',
            th_resizemark : 'datagrid-column-resizemark',
            tr_child      : 'datagrid-child-tr',
            tr_edit       : 'datagrid-edit-tr',
            tr_add        : 'datagrid-add-tr',
            tr_selected   : 'datagrid-selected-tr',
            td_edit       : 'datagrid-edit-td',
            td_changed    : 'datagrid-changed',
            td_child      : 'datagrid-child-td',
            td_linenumber : 'datagrid-linenumber-td',
            td_checkbox   : 'datagrid-checkbox-td',
            li_asc        : 'datagrid-li-asc',
            li_desc       : 'datagrid-li-desc',
            li_filter     : 'datagrid-li-filter',
            li_showhide   : 'datagrid-li-showhide',
            li_lock       : 'datagrid-li-lock',
            li_unlock     : 'datagrid-li-unlock'
        }
    }
    
    Datagrid.DEFAULTS = {
        gridTitle       : '',
        columns         : null,     // Thead column module
        data            : null,     // Data source
        dataUrl         : null,     // Request data source URL, for processing (filtering / sorting / paging) results
        updateRowUrl    : null,     // Update row data URL, return JSON data
        postData        : null,     // Send other data to server
        loadType        : 'POST',   // Ajax load request type
        dataType        : 'json',   // Data type of data source
        local           : 'remote', // Optional 'local' | 'remote'
        fieldSortable   : true,     // Click the field to sort
        filterThead     : true,     // Filter in the thead
        sortAll         : true,     // Sort scope, false = this page, true = all
        filterAll       : true,     // Filter scope, false = this page, true = all
        filterMult      : true,     // Filter multiple fileds, false = single, true = multiple
        initFilter      : {},       // 
        selectMult      : false,    // When clicked tr, multiple selected (Default need to press Ctrl or Shift or used checkbox)
        linenumberAll   : false,    // All data together numbers
        showLinenumber  : true,     // Display linenumber column, Optional 'true' | 'false' | 'lock', (Optional 'true, false' is a boolean)
        showCheckboxcol : false,    // Display checkbox column, Optional 'true' | 'false' | 'lock', (Optional 'true, false' is a boolean)
        showChildcol    : undefined,// Display child button column, Optional 'true' | 'false' | 'lock', (Optional 'true, false' is a boolean). If not set false and 'hasChild == true', showChildcol = true
        showEditbtnscol : false,    // Display edit buttons column, Optional 'true' | 'false' | 'edit', (Optional 'true, false' is a boolean, Optional 'edit' is custom column label)
        customEditbtns  : {         // Custom edit column buttons
            position    : 'after',  // Button inserted position, Optional 'after' | 'before' | 'replace'
            buttons     : null,     // Custom buttons, Set string or function
            width       : 0         // The edit column width, 0 = 'auto'
        },
        showTfoot       : false,    // Display the tfoot, Optional 'true' | 'false' | 'lock', (Optional 'true, false' is a boolean)
        showToolbar     : false,    // Display datagrid toolbar
        showNoDataTip   : true,     // Display 'no data' tips, Optional 'true' | 'false' | 'string', (Optional 'true, false' is a boolean, Optional 'string' is custom tips)
        toolbarItem     : '',       // Displayed on the toolbar elements, Optional 'all, add, edit, cancel, save, del, import, export, exportf |'
        toolbarCustom   : '',       // Html code || function || jQuery dom object, custom elements, displayed on the toolbar
        columnResize    : true,     // Allow adjust the column width
        columnMenu      : true,     // Display the menu button on the column
        columnShowhide  : true,     // On the menu display (show / hide columns)
        columnFilter    : false,    // On the menu display (filter form)
        columnLock      : true,     // On the menu display (lock / unlock columns)
        paging          : true,     // Display pagination component
        pagingAlign     : 'center', // The pagination component alignment
        keys            : {
            gridChild   : 'gridChild',
            gridNumber  : 'gridNumber',
            gridCheckbox: 'gridCheckbox',
            gridEdit    : 'gridEdit',
            gridIndex   : 'gridIndex',
            dropFlag    : 'dropFlag',
            treePTr     : 'datagrid.tree.parentTr',
            treePData   : 'datagrid.tree.parentData',
            childlen    : 'childlen',
            isExpand    : 'isExpand',
            isParent    : 'isparent'
        },
        hasChild        : false,    // It contains child data, Optional (true | false)
        childOptions    : {         // Child grid options
            width       : '100%',
            height      : 'auto',
            paging      : false,
            columnMenu  : false,
            filterThead : false,
            childUpdate : false     // This options only for childOptions, when the child grid data changes, update the parent row(!! The parent grid neeed option 'updateRowUrl' !!), Optional (Boolean: true | false, true = 'all') OR (String: 'all, add, edit, del')
        },
        isTree          : false,
        treeOptions     : {
            keys        : {
                key       : 'id',
                parentKey : 'pid',
                childKey  : 'children',
                childLen  : 'childlen',
                isParent  : 'isparent',
                level     : 'level',
                order     : 'order',
                isExpand  : 'isExpand'
            },
            simpleData  : true,
            expandAll   : false,
            add         : true
        },
        dropOptions     : {
            drop        : false,
            dropUrl     : null,
            paging      : true,     // send paging data
            scope       : 'drop',   // send data scope, Optional 'drop' | 'all'
            beforeDrag  : null,     // Function - before drag, return true can drag
            beforeDrop  : null,     // Function - before drop, return false cancel drop
            afterDrop   : 'POST'    // Post(Ajax) the current page data to server, request type = editType. Optional ('POST' | function), If set a function, doesn't post
        },
        tdTemplate      : '',
        editUrl         : null,     // An action URL, for processing (update / save), return results (json)
        editCallback    : null,     // Callback for save
        editMode        : 'inline', // Editing mode, Optional 'false' | 'inline' | 'dialog', (Optional 'false' is a boolean)
        editDialogOp    : null,     // For dialog edit, the dialog init options
        editType        : 'POST',   // Ajax request method of edit, Optional 'POST' | 'GET' | 'raw', (Optional 'raw' is post raw data)
        inlineEditMult  : true,     // Can inline edit multiple rows
        saveAll         : true,     // For inline edit, true = save current row, false = save all editing rows
        addLocation     : 'first',  // Add rows to datagrid location, Optional 'first' | 'last' | 'prev' | 'next'
        delUrl          : null,     // The delete URL, return delete tr results (json)
        delType         : 'POST',   // Delete URL of ajax request method
        delPK           : null,     // Ajax delete request to send only the primary key
        delConfirm      : true,     // Delete confirmation message, Optional 'true' | 'false' | 'message', (Optional 'true, false' is a boolean)
        delCallback     : null,     // Callback for delete
        jsonPrefix      : '',       // JSON object key prefix, for post data
        contextMenuH    : true,     // Right-click on the thead, display the context menu
        contextMenuB    : false,    // Right-click on the tbody tr, display the context menu
        templateWidth   : 600,      // 
        flowLayoutWidth : 0,        // 
        dialogFilterW   : 360,      // 
        hScrollbar      : false,    // Allowed horizontal scroll bar
        fullGrid        : false,    // If the table width below gridbox width, stretching table width
        importOption    : null,     // Import btn options
        exportOption    : null,     // Export btn options
        beforeEdit      : null,     // Function - before edit method, return true execute edit method
        beforeDelete    : null,     // Function - before delete method, return true execute delete method
        beforeSave      : null,     // Function - before save method, arguments($trs, datas)
        afterSave       : null,     // Function - after save method, arguments($trs, datas)
        afterDelete     : null      // Function - after delete method
    }
    
    Datagrid.renderItem = function(value, data, items) {
        if (!items || !items.length) return ''
        var label = ''
        
        $.each(items, function(i, n) {
            if (typeof n[value] !== 'undefined') {
                label = n[value]
                return false
            }
        })
        
        return label
    }
    
    Datagrid.renderItemMulti = function(value, data, items) {
        if (!items || !items.length) return ''
        var label = [], val = $.type(value) === 'array' ? value : String(value).split(',')
        
        $.each(items, function(i, n) {
            $.each(val, function(k, v) {
                if (typeof n[v] !== 'undefined') {
                    label.push(n[v])
                    return false
                }
            })
        })
        
        return label.join(',')
    }
    
    Datagrid.prototype.TOOLS = function() {
        var that  = this, options = that.options
        var tools = {
            getPageCount: function(pageSize, total) {
                return Math.ceil(total / pageSize)
            },
            getPageInterval: function(count, pageCurrent, showPageNum) {
                var half  = Math.ceil(showPageNum / 2), limit = count - showPageNum,
                    start = pageCurrent > half ? Math.max(Math.min(pageCurrent - half, limit), 0) : 0,
                    end   = pageCurrent > half ? Math.min((pageCurrent + half), count) : Math.min(showPageNum, count)
                
                if (end - start == showPageNum) end = end + 1
                if (end < showPageNum) end = end + 1
                if (start + 1 == end) end = end + 1
                
                return {start:start + 1, end:end}
            },
            getRight: function($obj) {
                var width = 0, index = $obj.data('index'), model = that.columnModel
                
                for (var i = index; i >= 0; i--) {
                    width += model[i].th.outerWidth()
                }
                
                return width
            },
            getRight4Lock: function(index) {
                var width = 0, $td = that.$lockTbody.find('> tr:first > td:eq('+ index +')'), $firstTds = $td && $td.prevAll().add($td)
                
                if (!$firstTds || !$firstTds.length) $firstTds = that.$lockColgroupH.filter(':lt('+ (index + 1) +')')
                $firstTds.each(function() {
                    var $td = $(this), w = $td.is(':hidden') ? 0 : $td.outerWidth()
                    
                    width += w
                })
                
                return width
            },
            beforeEdit: function($trs, datas) {
                var beforeEdit = options.beforeEdit
                
                if (beforeEdit) {
                    if (typeof beforeEdit === 'string') beforeEdit = beforeEdit.toFunc()
                    if (typeof beforeEdit === 'function') {
                        return beforeEdit.call(that, $trs, datas)
                    }
                }
                
                return true
            },
            beforeSave: function($trs, data) {
                var beforeSave = options.beforeSave
                
                if (beforeSave) {
                    if (typeof beforeSave === 'string') beforeSave = beforeSave.toFunc()
                    if (typeof beforeSave === 'function') {
                        return beforeSave.call(that, $trs, data)
                    }
                }
                
                return true
            },
            afterSave: function($trs, data) {
                var afterSave = options.afterSave, childUpdate = that.options.childUpdate, $parent = that.$element.data('bjui.datagrid.parent'),
                    updateParent = function($tr) {
                        $tr.closest('table').datagrid('updateRow', $tr)
                    }
                
                if (afterSave) {
                    if (typeof afterSave === 'string') afterSave = afterSave.toFunc()
                    if (typeof afterSave === 'function') {
                        afterSave.call(that, $trs, data)
                    }
                }
                
                // remove add data
                $trs.each(function() {
                    $(this).removeData('datagrid.addData')
                })
                
                // update child parent
                if ($parent && childUpdate) {
                    if (typeof childUpdate === 'string' && childUpdate.indexOf('all') === -1) {
                        if (data.addFlag && childUpdate.indexOf('add') !== -1)
                            updateParent($parent)
                        else if (childUpdate.indexOf('edit') !== -1)
                            updateParent($parent)
                    } else {
                        updateParent($parent)
                    }
                }
                
                if (that.needfixedWidth) {
                    that.fixedWidth()
                    that.needfixedWidth = false
                }
                
                // fixedH
                if (options.height === 'auto') {
                    var scrollTop = that.$boxB.scrollTop()
                    
                    that.$boxB.scrollTop(5)
                    if (that.$boxB.scrollTop()) {
                        that.fixedHeight()
                        that.$boxB.scrollTop(scrollTop)
                    }
                }
                
                that.$element.data('allData', that.allData)
            },
            afterDelete: function() {
                var afterDelete = options.afterDelete
                
                if (afterDelete) {
                    if (typeof afterDelete === 'string') afterDelete = afterDelete.toFunc()
                    if (typeof afterDelete === 'function') {
                        afterDelete.call(that)
                    }
                }
                
                that.$element.data('allData', that.allData)
            },
            // Correct colspan
            setColspan: function(column, colspanNum) {
                if (column.colspan) column.colspan = column.colspan + colspanNum - 1
                column.index = column.index + colspanNum - 1
                if (column.parent) this.setColspan(column.parent, colspanNum)
            },
            // set columns options
            setOp: function(op) {
                if (!op.name) {
                    op.menu = op.lock = op.edit = op.add = op.quickSort = op.quickfilter = false
                } else {
                    op.menu        = (typeof op.menu        === 'undefined') ? true  : op.menu
                    op.lock        = (typeof op.lock        === 'undefined') ? true  : op.lock
                    op.edit        = (typeof op.edit        === 'undefined') ? true  : op.edit
                    op.add         = (typeof op.add         === 'undefined') ? true  : op.add
                    op.quicksort   = (typeof op.quicksort   === 'undefined') ? true  : op.quicksort
                    op.quickfilter = (typeof op.quickfilter === 'undefined') ? true  : op.quickfilter
                    op.finalWidth  = (typeof op.finalWidth  === 'undefined') ? false : op.finalWidth
                }
                op.hide = (typeof op.hide === 'undefined') ? false : op.hide
                
                return op
            },
            json2Array4Tree: function (options, datas, level, pid) {
                if (!datas) return []
                if (!level) level = 0
                
                var k = options.key, pk = options.parentKey, childKey = options.childKey, childLen = options.childLen, levelKey = options.level, isParent = options.isParent, r = [], data
                
                if (datas) {
                    datas.sort(function(a, b) {
                        return a[options.order] - b[options.order]
                    })
                }
                
                if ($.isArray(datas)) {
                    for (var i = 0, l = datas.length; i < l; i++) {
                        data = $.extend({}, datas[i])
                        
                        data[levelKey] = level
                        r.push(data)
                        
                        if (data[childKey]) {
                            delete data[childKey]
                            data[isParent] = true
                            data[childLen] = datas[i][childKey].length
                            pid = data[k]
                            
                            r = r.concat(this.json2Array4Tree(options, datas[i][childKey], data[levelKey] + 1, pid))
                            
                            pid = null
                        }
                    }
                } else {
                    data = $.extend({}, datas)
                    
                    data[levelKey] = level
                    r.push(data)
                    
                    if (data[childKey]) {
                        delete data[childKey]
                        data[isParent] = true
                        data[childLen] = datas[childKey].length
                        pid = data[k]
                        
                        r = r.concat(this.json2Array4Tree(options, datas[childKey], data[levelKey] + 1))
                        
                        pid = null
                    }
                }
                
                return r
            },
            array2Json4Tree: function(options, datas) {
                var r = [], temp = [], keys = options.keys, key = keys.key, parentKey = keys.parentKey, childKey = keys.childKey
                
                if (!$.isArray(datas)) return [datas]
                
                for (var i = 0, l = datas.length; i < l; i++) {
                    temp[datas[i][key]] = datas[i]
                }
                for (var i = 0, l = datas.length; i < l; i++) {
                    if (datas[i][parentKey] && datas[i][key] !== datas[i][parentKey]) {
                        if (!temp[datas[i][parentKey]])
                            temp[datas[i][parentKey]] = []
                        if (!temp[datas[i][parentKey]][childKey])
                            temp[datas[i][parentKey]][childKey] = []
                        
                        temp[datas[i][parentKey]][childKey].push(datas[i])
                    } else {
                        r.push(datas[i])
                    }
                }
                
                return r
            },
            // create trs by data source
            createTrsByData: function(data, refreshFlag) {
                var list
                
                if (!that.$tbody) that.$tbody = $('<tbody></tbody>')
                if (data) {
                    if (data.list) list = data.list
                    else list = data
                    
                    that.paging.total = list.length || 0
                    
                    // for tree
                    if (that.options.isTree) {
                        if (that.options.treeOptions.simpleData) {
                            list = this.array2Json4Tree(that.options.treeOptions, list)
                            list = this.json2Array4Tree(that.options.treeOptions.keys, list)
                        } else {
                            list = this.json2Array4Tree(that.options.treeOptions.keys, list)
                        }
                    }
                    
                    if (list && !$.isArray(list))
                        list = [list]
                    
                    that.paging.total = (list && list.length) || 0
                    
                    if (!that.paging.total)
                        list = []
                    
                    if (typeof data === 'object' && that.paging.total) {
                        if (data[BJUI.pageInfo.total]) that.paging.total = parseInt(data[BJUI.pageInfo.total], 10)
                        if (data[BJUI.pageInfo.pageSize]) {
                            if (refreshFlag && that.paging.pageSize != data[BJUI.pageInfo.pageSize]) {
                                that.$boxP && that.$boxP.trigger('bjui.datagrid.paging.pageSize', data[BJUI.pageInfo.pageSize])
                            }
                            that.paging.pageSize = parseInt(data[BJUI.pageInfo.pageSize], 10)
                        }
                    }
                    
                    that.paging.pageCount = tools.getPageCount(that.paging.pageSize, that.paging.total)
                    
                    if (that.paging.pageCurrent > that.paging.pageCount) that.paging.pageCurrent = that.paging.pageCount
                    if (!that.paging.pageCurrent) that.paging.pageCurrent = 1
                    
                    this.initTbody(list, refreshFlag)
                }
                
                if (!that.init_tbody) that.$tbody.appendTo(that.$tableB)
                if (!that.init_thead) that.initThead()
            },
            // initTbody
            initTbody: function(data, refreshFlag) {
                var tools  = this, allData = that.allData, type = options.dataType || 'json', model = that.columnModel, hiddenFields = that.hiddenFields, regional = that.regional, newData = [], attach = that.attach, json
                var paging = that.paging, start = 0, end = paging.pageSize, keys = that.options.keys
                var doInit = function() {
                    type = type.toLowerCase()
                    if (data) allData = that.allData = data
                    
                    that.$element.data('allData', that.allData)
                    
                    if (!allData.length) {
                        end = 0
                    } else {
                        if (options.local === 'local') {
                            start = (paging.pageSize * (paging.pageCurrent - 1))
                            end   = start + paging.pageSize
                            if (paging.total != allData.length) paging.total = allData.length
                            if (start > allData.length) start = paging.pageSize * (paging.pageCount - 1)
                        } else {
                            if (allData.length > paging.pageSize) end = paging.pageSize
                        }
                    }
                    if (end > allData.length) end = allData.length
                    
                    // array to json
                    if (type === 'array' && data && data.length && $.type(data[0]) === 'array') {
                        var a1 = start, a2 = end, arrData = [], _index
                        
                        if (options.local === 'local') {
                            a1 = 0
                            a2 = allData.length
                        }
                        for (var i = a1; i < a2; i++) {
                            json   = {}
                            _index = 0
                            $.each(allData[i], function(k, v) {
                                var obj, val = v
                                
                                if (model[_index] && model[_index][keys.gridChild])    _index ++
                                if (model[_index] && model[_index][keys.gridNumber])   _index ++
                                if (model[_index] && model[_index][keys.gridCheckbox]) _index ++
                                if (typeof val === 'string') val = '"'+ val +'"'
                                
                                if (model[_index] && !model[_index][keys.gridEdit]) {
                                    obj = '{"'+ model[_index].name +'":'+ val +'}'
                                    $.extend(json, JSON.parse(obj))
                                } else { // init hidden fields
                                    if (model[_index] && model[_index][keys.gridEdit]) _index ++
                                    if (_index >= model.length && hiddenFields) {
                                        if (hiddenFields[k - model.length]) {
                                            obj = '{"'+ hiddenFields[k - model.length] +'":'+ val +'}'
                                            $.extend(json, JSON.parse(obj))
                                        }
                                    }
                                }
                                _index ++
                            })
                            
                            arrData.push(json)
                        }
                        
                        allData = that.allData = arrData
                    }
                    
                    // create cuttent page data
                    for (var i = start; i < end; i++) {
                        json = $.extend({}, that.allData[i], attach)
                        
                        /* for quickSort */
                        if (options.local === 'local' && !refreshFlag) {
                            that.allData[i]['bjui_local_index'] = i
                        }
                        
                        newData.push(json)
                    }
                    
                    tools.createTrs(newData, refreshFlag)
                    
                    that.data = newData
                    
                    that.$element.trigger('afterLoad.bjui.datagrid', {datas:newData})
                }
                
                if (refreshFlag && that.$boxM) {
                    that.$boxM.show().trigger('bjui.ajaxStop').trigger('bjui.ajaxStart', [50, doInit])
                } else {
                    doInit()
                }
            },
            // create tbody - tr
            createTrs: function(datas, refreshFlag) {
                var tools = this, keys = that.options.keys, model = that.columnModel, paging = that.paging, trs = [], editFrag = BJUI.doRegional(FRAG.gridEditBtn, that.regional), childFrag = BJUI.doRegional(FRAG.gridExpandBtn, that.regional), lockedCols = [], isRenderOnly = false,
                    customEditbtns = that.options.customEditbtns, editFrag2 = customEditbtns.buttons
                    
                // custom edit column buttons
                if (editFrag2) {
                    if (typeof editFrag2 === 'function')
                        editFrag2 = editFrag2.apply()
                    
                    if (editFrag2) {
                        if (customEditbtns.position === 'before')
                            editFrag = editFrag2 + editFrag
                        else if (customEditbtns.position === 'replace')
                            editFrag = editFrag2
                        else
                            editFrag += editFrag2
                    }
                }
                
                if (refreshFlag) {
                    // remebered lock columns
                    $.each(model, function(i, n) {
                        if (n.locked) {
                            that.colLock(n.th, false)
                            n.lock_refresh = true
                        }
                    })
                    
                    if (that.$tbody.find('> tr.datagrid-nodata').length) {
                        that.needfixedWidth = true
                    }
                    
                    that.$tbody.empty()
                    that.$lockTableH && that.$lockTableH.empty()
                    that.$lockTableB && that.$lockTableB.empty()
                }
                
                if (!datas.length && !refreshFlag) {
                    var emptyObj = {}
                    
                    emptyObj[model[0].name] = '0'
                    isRenderOnly = true
                    datas = []
                    datas.push(emptyObj)
                }
                
                for (var i = 0, l = datas.length; i < l; i++) {
                    var trData = datas[i], modellength = model.length, tempcolspan = modellength, linenumber = options.linenumberAll ? ((paging.pageCurrent - 1) * paging.pageSize + (i + 1)) : (i + 1),
                        tds = [], n, tdHtml = BJUI.StrBuilder(), $td, name, label, _label, render_label, align, cls, display, tree, hasTree = false, treeattr = '', tdTemplate = options.tdTemplate
                    
                    trData[keys.gridNumber] = linenumber
                    trData[keys.gridIndex]  = i
                    
                    if (that.options.hasChild && that.options.childOptions)
                        tempcolspan = tempcolspan - 1
                    if (that.options.showLinenumber)
                        tempcolspan = tempcolspan - 1
                    if (that.options.showCheckboxcol)
                        tempcolspan = tempcolspan - 1
                    
                    var tempData = $.extend({}, trData)
                    
                    for (var j = 0; j < modellength; j++) {
                        n       = model[j] 
                        name    = n.name || 'datagrid-noname'
                        label   = trData[name]
                        align   = ''
                        cls     = []
                        _label  = ''
                        display = ''
                        tree    = ''
                        render_label = undefined
                        
                        if (typeof label === 'undefined' || label === 'null' || label === null) label = ''
                        _label = label
                        
                        if (n.align) align = ' align="'+ n.align +'"'
                        if (n[keys.gridChild]) label = childFrag
                        if (n[keys.gridCheckbox]) label = '<div><input type="checkbox" data-toggle="icheck" name="datagrid.checkbox" value="true"></div>'
                        if (n[keys.gridEdit]) {
                            label = editFrag
                            cls.push(that.classnames.s_edit)
                        }
                        if (options.hScrollbar) {
                            if (!n.width || n.width === 'auto')
                                cls.push('nowrap')
                        }
                        
                        /* for tfoot */
                        /*if (n.calc) {
                            if (!n.calc_count) n.calc_count = datas.length
                            
                            var number = label ? (String(label).isNumber() ? Number(label) : 0) : 0
                            
                            if (n.calc === 'sum' || n.calc === 'avg') n.calc_sum = (n.calc_sum || 0) + number
                            else if (n.calc === 'max') n.calc_max = n.calc_max ? (n.calc_max < number ? number : n.calc_max) : number
                            else if (n.calc === 'min') n.calc_min = n.calc_min ? (n.calc_min > number ? number : n.calc_min) : number
                        }*/
                        
                        if (n[keys.gridChild])    cls.push(that.classnames.td_child)
                        if (n[keys.gridNumber])   cls.push(that.classnames.td_linenumber)
                        if (n[keys.gridCheckbox]) cls.push(that.classnames.td_checkbox)
                        
                        if (cls.length) cls = cls.join(' ')
                        else cls = ''
                        
                        if (refreshFlag && n.hidden) display = ' style="display:none;"'
                        
                        /* render */
                        if (n.items && !n.render) {
                            if (n.attrs && n.attrs['multiple'])
                                n.render = $.datagrid.renderItemMulti
                            else
                                n.render = $.datagrid.renderItem
                        }
                        if (n.render && typeof n.render === 'string') n.render = n.render.toFunc()
                        if (n.render && typeof n.render === 'function') {
                            if (n.items) {
                                if (typeof n.items === 'string') {
                                    if (n.items.trim().startsWith('[')) n.items = n.items.toObj()
                                    else n.items = n.items.toFunc()
                                }
                                
                                if (!that.renderTds) that.renderTds = []
                                
                                var delayRender = function(index, label, trData, n) {
                                    $.when(n.items.call(that)).done(function(item) {
                                        n.items = item
                                        
                                        that.delayRender --
                                    })
                                }
                                
                                if (typeof n.items === 'function') {
                                    if (!i) {
                                        if (!that.delayRender) that.delayRender = 0
                                        that.delayRender ++
                                        delayRender((i * j), _label, trData, n)
                                    }
                                    n.delayRender = true
                                    that.renderTds.push({trindex:i, tdindex:j, label:_label, data:trData, render:n.render})
                                } else {
                                    delete n.delayRender
                                    render_label = n.render.call(that, _label, trData, n.items)
                                }
                            } else {
                                render_label = n.render.call(that, _label, trData)
                            }
                        }
                        
                        if (options.isTree && !hasTree && (!(n === that.childColumn || n === that.linenumberColumn || n === that.checkboxColumn || n === that.editBtnsColumn) || that.treeColumn)) {
                            if (typeof options.isTree === 'string') {
                                if (n.name && n.name === options.isTree)
                                    hasTree = true
                            } else {
                                hasTree = true
                            }
                            
                            if (hasTree) {
                                !that.treeColumn && (that.treeColumn = n)
                                n.hasTree = true
                                !trData[options.treeOptions.keys.level] && (trData[options.treeOptions.keys.level] = 0)
                                tree  = that.tools.createTreePlaceholder(trData, (render_label || label))
                                align = ' align="left"'
                                
                                if (cls) {
                                    cls += ' datagrid-tree-td'
                                } else {
                                    cls = 'datagrid-tree-td'
                                }
                                
                                treeattr = ' data-child="'+ (trData[options.treeOptions.keys.childLen] || 0) +'" data-level="'+ trData[options.treeOptions.keys.level] +'" class="datagrid-tree-tr datagrid-tree-level-'+ trData[options.treeOptions.keys.level] +'"'
                            }
                        }
                        
                        cls && (cls = ' class="'+ cls +'"')
                        
                        if (that.isTemplate) {
                            if (!n.delayRender) {
                                tempData[n.name] = (typeof render_label === 'undefined' ? label : render_label)
                            } else {
                                delete tempData[n.name]
                            }
                            if (!tds[0] && j == (modellength - 1)) {
                                if (tdTemplate && typeof tdTemplate === 'function')
                                    tdTemplate = tdTemplate.apply(that, [trData])
                                
                                tdTemplate = that.tools.replacePlh4Template(tdTemplate, tempData, true)
                                
                                if (that.options.hasChild && that.options.childOptions) {
                                    display = that.childColumn.hidden ? ' style="display:none;"' : ''
                                    tds[0]  = ['<td data-title="..." align="center" class="datagrid-child-td"'+ display +'><div>'+ childFrag +'</div></td>']
                                }
                                if (that.options.showLinenumber) {
                                    display = that.linenumberColumn.hidden ? ' style="display:none;"' : ''
                                    
                                    var linenumbertd = ['<td data-title="No." align="center" class="datagrid-linenumber-td"'+ display +'>'+ linenumber +'</td>']
                                    
                                    tds[tds.length] = linenumbertd
                                }
                                if (that.options.showCheckboxcol) {
                                    display = that.checkboxColumn.hidden ? ' style="display:none;"' : ''
                                    
                                    var checkboxtd = ['<td data-title="Checkbox" align="center" class="datagrid-checkbox-td"'+ display +'><div><input type="checkbox" data-toggle="icheck" name="datagrid.checkbox" value="true"></div></td>']
                                    
                                    tds[tds.length] = checkboxtd
                                }
                                
                                var temptd = ['<td class="datagrid-template-td" colspan="'+ tempcolspan +'">'+ tdTemplate +'</td>']
                                
                                tds[tds.length] = temptd
                                
                                treeattr = ' class="datagrid-template-tr"'
                            }
                        } else {
                            tdHtml
                                .add('<td data-title="'+ n.label +'"')
                                .add(align)
                                .add(cls)
                                .add(display)
                                .add('>')
                            
                            if (tree) {
                                tdHtml.add(tree)
                            } else {
                                tdHtml
                                    .add('<div>')
                                    .add(typeof render_label === 'undefined' ? label : render_label)
                                    .add('</div>')
                            }
                            
                            tdHtml.add('</td>')
                            tds.push(tdHtml.toString())
                        }
                    }
                    
                    trs.push('<tr'+ treeattr +'>'+ tds.join('') +'</tr>')
                    
                    if (isRenderOnly) {
                        trs = []
                        trs.push(tools.createNoDataTr(true) || '')
                    } else {
                        trs.push(tools.createChildTr(null, trData))
                    }
                }
                
                that.$tbody.html(trs.join(''))
                
                if (refreshFlag) {
                    that.initEvents()
                    if (options.editMode) that.edit()
                    
                    if (!datas.length)
                        tools.createNoDataTr()
                    
                    that.$boxP && that.$boxP.trigger('bjui.datagrid.paging.jump')
                    
                    // locked
                    $.each(model, function(i, n) {
                        if (n.lock_refresh) {
                            that.colLock(n.th, true)
                            delete n.lock_refresh
                        }
                    })
                    
                    setTimeout(function() {
                        that.$tableB.initui()
                        that.$lockTableB && that.$lockTableB.initui()
                        
                        that.fixedHeight()
                        
                        if (that.needfixedWidth) {
                            that.fixedWidth()
                            that.needfixedWidth = null
                        }
                        
                        that.$boxM && that.$boxM.trigger('bjui.ajaxStop').hide()
                        
                        // for initFilter
                        if (that.doInitFilter) {
                            that.tools.initFilter()
                            that.doInitFilter = undefined
                        }
                    }, datas.length + 1)
                }
            },
            coverTemplate: function() {
                var tools = this, options = that.options, datas = that.data, model = that.columnModel, trs
                
                if (that.isTemplate) {
                    trs = that.$grid.data('bjui.datagrid.trs.template')
                    
                    if (!trs)
                        tools.createTrs(datas, true)
                    else {
                        that.$tbody.html(trs)
                        
                        that.initEvents()
                        if (options.editMode) that.edit()
                        
                        if (!datas.length)
                            tools.createNoDataTr()
                        
                        that.$boxP && that.$boxP.trigger('bjui.datagrid.paging.jump')
                        
                        // locked
                        $.each(model, function(i, n) {
                            if (n.lock_refresh) {
                                that.colLock(n.th, true)
                                delete n.lock_refresh
                            }
                        })
                        
                        setTimeout(function() {
                            that.$tableB.initui()
                            that.$lockTableB && that.$lockTableB.initui()
                            
                            that.fixedHeight()
                            
                            that.$boxM && that.$boxM.trigger('bjui.ajaxStop').hide()
                            
                            // for initFilter
                            if (that.doInitFilter) {
                                that.tools.initFilter()
                                that.doInitFilter = undefined
                            }
                        }, datas.length + 1)
                    }
                } else {
                    trs = that.$grid.data('bjui.datagrid.trs.normal')
                    
                    if (!trs)
                        this.createTrs(datas, true)
                    else {
                        that.$tbody.html(trs)
                        
                        that.initEvents()
                        if (options.editMode) that.edit()
                        
                        if (!datas.length)
                            tools.createNoDataTr()
                        
                        that.$boxP && that.$boxP.trigger('bjui.datagrid.paging.jump')
                        
                        // locked
                        $.each(model, function(i, n) {
                            if (n.lock_refresh) {
                                that.colLock(n.th, true)
                                delete n.lock_refresh
                            }
                        })
                        
                        setTimeout(function() {
                            that.$tableB.initui()
                            that.$lockTableB && that.$lockTableB.initui()
                            
                            that.fixedHeight()
                            
                            that.$boxM && that.$boxM.trigger('bjui.ajaxStop').hide()
                            
                            // for initFilter
                            if (that.doInitFilter) {
                                that.tools.initFilter()
                                that.doInitFilter = undefined
                            }
                        }, datas.length + 1)
                    }
                }
                
                setTimeout(function() {
                    that.initFixedW = false
                    that.hasAutoCol = true
                    that.fixedWidth(true)
                }, 300)
            },
            replacePlh: function(url, data) {
                return url.replace(/{\/?[^}]*}/g, function($1) {
                    var key = $1.replace(/[{}]+/g, ''), val = data[key]
                    
                    if (typeof val === 'undefined' || val === 'null' || val === null)
                        val = ''
                    
                    return val
                })
            },
            replacePlh4Template: function(html, data, replaceAll) {
                return html.replace(/{#\/?[^}]*}/g, function($1) {
                    var key = $1.replace(/[{#}]+/g, ''), val = data[key]
                    
                    if (replaceAll && typeof val === 'undefined')
                        return $1
                    
                    if (typeof val === 'undefined' || val === 'null' || val === null)
                        val = ''
                    
                    return val
                })
            },
            createNoDataTr: function(str) {
                if (that.options.showNoDataTip) {
                    if (str) {
                        return '<tr class="datagrid-nodata"><td colspan="'+ that.columnModel.length +'">'+ (typeof that.options.showNoDataTip === 'string' ? that.options.showNoDataTip : BJUI.getRegional('datagrid.noData')) +'</td></tr>'
                    } else if (!that.$tbody.find('> tr').length) {
                        $('<tr class="datagrid-nodata"></tr>').html('<td colspan="'+ that.columnModel.length +'">'+ (typeof that.options.showNoDataTip === 'string' ? that.options.showNoDataTip : BJUI.getRegional('datagrid.noData')) +'</td>').appendTo(that.$tbody)
                    }
                }
            },
            createTreePlaceholder: function(data, label, isExpand) {
                var keys = that.options.treeOptions.keys, str = BJUI.StrBuilder()
                var addIndent = function(level) {
                    var indent = []
                    
                    while (level--) {
                        indent.push('<span class="datagrid-tree-indent"></span>')
                    }
                    
                    return indent.join('')
                }
                
                str.add('<div class="datagrid-tree-box">')
                
                if (data[keys.level])
                    str.add(addIndent(data[keys.level]))
                
                str.add('<span class="datagrid-tree-switch'+ (typeof isExpand !== 'undefined' && !isExpand ? ' collapsed' : '') +'">')
                
                if (data[keys.isParent]) {
                    if (typeof isExpand === 'undefined') {
                        if (typeof data[keys.isExpand] === 'undefined')
                            data[keys.isExpand] = true
                            
                            if (!data[keys.isExpand]) {
                                if (!that.collapseIndex) that.collapseIndex = []
                                that.collapseIndex.push(data.gridIndex)
                            }
                        
                        str.add('<i class="fa fa-minus-square-o"></i>')
                    } else {
                        str.add('<i class="fa fa-'+ (isExpand ? 'minus' : 'plus') +'-square-o"></i>')
                    } 
                }
                
                str
                    .add('</span>')
                    .add('<span class="datagrid-tree-'+ (data[keys.isParent] ? 'branch' : 'leaf') +'"><i class="fa fa-'+ (data[keys.isParent] ? 'folder' : 'file') +'-o"></i></span>')
                    .add('<span class="datagrid-tree-title">')
                    .add(label)
                    .add('</span>')
                    .add('</div>')
                
                return str.toString()
            },
            createChildTr: function($tr, trData) {
                if ($tr && $tr.next() && $tr.next().hasClass(that.classnames.tr_child))
                    return
                
                if (options.hasChild && options.childOptions && options.childOptions.dataUrl) {
                    that.childOptions = $.extend(true, {}, Datagrid.DEFAULTS, options.childOptions)
                    
                    var child = '<tr class="'+ that.classnames.tr_child +'"><td colspan="'+ that.columnModel.length +'" style="width:100%; padding:10px;"><table class="table-child"></table></td></tr>'
                    
                    if ($tr && $tr.length)
                        $tr.after(child)
                    else
                        return child
                }
                
                return ''
            },
            // Parameters can be (jQuery Object || number)
            getNoChildTrIndex: function(row) {
                var index 
                
                if (isNaN(row)) {
                    if (!row || !row.length) return -1
                    index = row.index()
                } else {
                    index = parseInt(row, 10)
                }
                if (that.options.hasChild && that.options.childOptions)
                    index = index * 2
                
                return index
            },
            // Parameters can be (jQuery Object || number)
            getNoChildDataIndex: function(row) {
                var data_index
                
                if (isNaN(row))
                    data_index = this.getNoChildTrIndex(row)
                else
                    data_index = parseInt(row, 10)
                
                if (data_index === -1) return data_index
                if (that.options.hasChild && that.options.childOptions)
                    data_index = data_index / 2
                
                return data_index
            },
            // ajax load data by url
            loadData: function(data, refreshFlag) {
                var tools = this, url = options.dataUrl, dataType = options.dataType || 'json', model = that.columnModel
                
                that.$boxM && that.$boxM.show().trigger('bjui.ajaxStart')
                
                dataType = dataType.toLowerCase()
                if (dataType === 'array') dataType = 'text'
                
                if (options.postData) {
                    if (typeof options.postData === 'string') {
                        if (options.postData.trim().startsWith('{')) options.postData = options.postData.toObj()
                        else options.postData = options.postData.toFunc()
                    }
                    if (typeof options.postData === 'function') {
                        options.postData = options.postData.apply()
                    }
                    if (typeof options.postData === 'object') {
                        if (!data) data = options.postData
                        else data = $.extend({}, options.postData, data)
                    }
                }
                
                data = data || {}
                if (!data.pageSize && options.paging) {
                    data.pageSize = that.paging.pageSize
                    data.pageCurrent = that.paging.pageCurrent
                }
                
                if (!options.paging) {
                    delete data.pageSize
                    delete data.pageCurrent
                }
                
                BJUI.ajax('doajax', {
                    url       : url,
                    data      : data,
                    type      : options.loadType,
                    cache     : options.cache || false,
                    dataType  : dataType,
                    okCallback: function(response) {
                        if (dataType === 'json') {
                            tools.createTrsByData(response, refreshFlag)
                        } else if (dataType === 'text') {
                            if ($.type(response) !== 'array')
                                response = []
                            
                            tools.createTrsByData(response, refreshFlag)
                        } else if (dataType === 'xml') {
                            var xmlData = [], obj
                            
                            $(response).find('row').each(function() {
                                obj = {}
                                
                                $(this).find('cell').each(function(i) {
                                    var $cell = $(this), label = $cell.text(), name = $cell.attr('name')
                                    
                                    obj[name] = label
                                })
                                
                                xmlData.push(obj)
                            })
                            
                            if (xmlData.length) tools.createTrsByData(xmlData, refreshFlag)
                        } else {
                            BJUI.debug('Datagrid Plugin: The options \'dataType\' is incorrect!')
                        } 
                    },
                    errCallback: function(json) {
                        if (json && json[BJUI.keys.statusCode]) {
                            BJUI.alertmsg('error', json[BJUI.keys.message] || BJUI.getRegional('datagrid.errorData'))
                        } else {
                            BJUI.alertmsg('warn', BJUI.getRegional('datagrid.errorData'))
                        }
                        
                        tools.createTrsByData([], refreshFlag)
                    },
                    failCallback: function(msg) {
                        BJUI.alertmsg('warn', BJUI.getRegional('datagrid.failData'))
                        
                        tools.createTrsByData([], refreshFlag)
                    }
                })
            },
            // append columns
            appendColumns: function() {
                that.childColumn      = {name:that.options.keys.gridChild, gridChild:true, width:30, minWidth:30, label:'...', align:'center', menu:false, edit:false, quicksort:false}
                that.linenumberColumn = {name:that.options.keys.gridNumber, gridNumber:true, width:'auto', minWidth:80, label:'No.', align:'center', menu:false, edit:false, quicksort:false}
                that.checkboxColumn   = {name:that.options.keys.gridCheckbox, gridCheckbox:true, width:30, minWidth:30, label:'Checkbox', align:'center', menu:false, edit:false, quicksort:false}
                that.editBtnsColumn   = {name:that.options.keys.gridEdit, gridEdit:true, width:that.options.customEditbtns.width, minWidth:110, label:(typeof options.showEditbtnscol === 'string' ? options.showEditbtnscol : 'Edit'), align:'center', menu:false, edit:false, hide:false, quicksort:false}
            },
            // setBoxb - height
            setBoxbH: function(height) {
                var boxH = height || that.boxH || options.height, topM = 0, h
                
                if (boxH < 100) return
                if (isNaN(boxH)) {
                    if (boxH === 'auto') {
                        boxH = (that.$boxT ? that.$boxT.outerHeight() : 0)
                             + (that.$boxH ? that.$boxH.outerHeight() : 0)
                             + (that.$toolbar ? that.$toolbar.outerHeight() : 0) 
                             + (that.$boxP ? that.$boxP.outerHeight() : 0)
                             + (that.$boxB ? that.$boxB.outerHeight() : 0)
                             + (that.$boxF ? that.$boxF.outerHeight() : 0)
                             + 25
                        
                        if (options.maxHeight && Number(options.maxHeight) < boxH) {
                            boxH = Number(options.maxHeight)
                        }
                        that.$grid.height(boxH)
                        that.boxH = boxH
                    } else {
                        boxH = that.$grid.height()
                    }
                }
                
                if (that.$boxT) {
                    h     = that.$boxT.outerHeight()
                    boxH -= h
                    topM += h
                }
                if (that.$toolbar) {
                    h     = that.$toolbar.outerHeight()
                    boxH -= h
                    topM += h
                }
                if (that.$boxP)
                    boxH -= that.$boxP.outerHeight()
                if (that.$boxF)
                    boxH -= that.$boxF.outerHeight()
                
                topM += that.$tableH.outerHeight()
                boxH -= that.$boxH.outerHeight()
                
                if (boxH < 0) boxH = 0
                
                that.$boxB.height(boxH)
                that.$boxM.height(boxH).css({top:topM})
                that.$lockB && that.$lockB.height(boxH)
                
                if (that.$element.data('bjui.datagrid.parent'))
                    that.$element.data('bjui.datagrid.parent').closest('table').datagrid('fixedHeight')
            },
            // column menu - toggle show submenu
            showSubMenu: function($li, $menu, $submenu) {
                var left, width = $menu.outerWidth(), submenu_width = $submenu.data('width') || $submenu.outerWidth(), wh = that.$grid.height(), mt, submenu_height = $submenu.data('height'), animate_op, boxWidth = that.$boxH.width()
                var hidesubmenu = function($li, $menu, $submenu) {
                    left       = $menu.offset().left - that.$grid.offset().left - 1
                    animate_op = {left:'50%'}
                    
                    $li.removeClass('active')
                    
                    if ($menu.hasClass('position-right') || (boxWidth - left < width + submenu_width)) {
                        $submenu.css({left:'auto', right:'100%'})
                        animate_op = {right:'50%'}
                    } else {
                        $submenu.css({left:'100%', right:'auto'})
                    }
                    animate_op.opacity = 0.2
                    
                    $submenu.stop().animate(animate_op, 'fast', function() {
                        $(this).hide()
                    })
                }
                
                $li.hover(function() {
                    $submenu.appendTo($li)
                    if ($li.hasClass(that.classnames.li_filter) && $submenu.is(':visible')) {
                        return false
                    } else {
                        var $filterli = $li.siblings('.'+ that.classnames.li_filter)
                        
                        if ($filterli.length && $filterli.hasClass('active')) {
                            hidesubmenu($filterli, $menu, $filterli.find('> .'+ that.classnames.s_filter))
                        }
                    }
                    
                    if ($li.hasClass(that.classnames.li_showhide)) {
                        mt = $li.position().top + $menu.position().top
                        
                        if ((wh - mt) < submenu_height) {
                            if (submenu_height > wh) {
                                submenu_height = wh
                                $submenu.css('height', wh)
                            }
                            $submenu.css({top:(- (submenu_height - (wh - mt)))})
                        }
                    }
                    
                    left       = $menu.offset().left - that.$grid.offset().left - 1
                    animate_op = {left:'100%'}
                    
                    if ($menu.hasClass('position-right') || (boxWidth - left < width + submenu_width)) {
                        $submenu.css({left:'auto', right:'50%'})
                        animate_op = {right:'100%'}
                    } else {
                        $submenu.css({left:'50%', right:'auto'})
                    }
                    animate_op.opacity = 1
                    
                    $li.addClass('active')
                    $submenu.show().stop().animate(animate_op, 'fast')
                }, function() {
                    if ($li.hasClass(that.classnames.li_filter)) {
                        return false
                    }
                    hidesubmenu($li, $menu, $submenu)
                })
                
                $li.on('hidesubmenu.bjui.datagrid.th', function(e, menu, submenu) {
                    hidesubmenu($(this), menu, submenu)
                })
            },
            // column menu - lock/unlock
            locking: function($th) {
                var index= $th.data('index'), columnModel = that.columnModel[index], lockFlag = columnModel.lock, locked = columnModel.locked, $menu = that.$menu, $ul = $menu.find('> ul'), $lockli = $ul.find('> li.'+ that.classnames.li_lock), $unlockli = $lockli.next()
                    
                if (locked) {
                    $lockli.addClass('disable')
                    $unlockli.removeClass('disable')
                } else {
                    $unlockli.addClass('disable')
                    $lockli.removeClass('disable')
                }
                
                if (lockFlag) {
                    $lockli.show().off('click').on('click', function() {
                        if ($lockli.hasClass('disable')) return
                        
                        $menu.hide().data('bjui.datagrid.menu.btn').removeClass('active')
                        that.colLock($th, true)
                    })
                    
                    $unlockli.show().off('click').on('click', function() {
                        if ($unlockli.hasClass('disable')) return
                        
                        $menu.hide().data('bjui.datagrid.menu.btn').removeClass('active')
                        that.colLock($th, false)
                    })
                } else {
                    $lockli.hide().off('click')
                    $unlockli.hide().off('click')
                }
            },
            // create show/hide column panel
            createShowhide: function() {
                var $showhide, keys = that.options.keys
                
                if (!that.$showhide) {
                    that.col_showhide_count = that.columnModel.length
                    $showhide = $('<ul class="'+ that.classnames.s_showhide +'" role="menu"></ul>')
                    
                    $.each(that.columnModel, function(i, n) {
                        if (that.tools.isGridModel(n))
                            that.col_showhide_count --
                        
                        var $col = $(FRAG.gridShowhide.replaceAll('#index#', n.index).replaceAll('#label#', (n.label || ''))).attr('title', (n.label || '')).toggleClass('nodisable', !!(that.tools.isGridModel(n)))
                        var colClick = function(n) {
                            $col.click(function() {
                                if ($(this).hasClass('disable')) return false
                                
                                var $this = $(this), check = !$this.find('i').hasClass('fa-check-square-o'), index = n.index
                                
                                $this.toggleClass('datagrid-col-check')
                                    .find('i').attr('class', 'fa fa'+ (check ? '-check' : '') +'-square-o')
                                
                                that.showhideColumn(n.th, check)
                                
                                if (!(that.tools.isGridModel(n))) {
                                    that.col_showhide_count = check ? that.col_showhide_count + 1 : that.col_showhide_count - 1
                                }
                                
                                if (that.col_showhide_count == 1) $showhide.find('> li.datagrid-col-check').addClass('disable')
                                else $showhide.find('> li.disable').removeClass('disable')
                                
                                $showhide.find('> li.nodisable').removeClass('disable')
                            })
                        }
                        
                        colClick(n)
                        $col.appendTo($showhide)
                        
                        if (n.hide) $col.trigger('click')
                    })
                    
                    $showhide.appendTo(that.$grid)
                    $showhide.data('width', $showhide.outerWidth()).data('height', $showhide.outerHeight())
                    that.$showhide = $showhide
                }
            },
            // column - display/hide
            showhide: function(model, showFlag) {
                var keys = that.options.keys, index = model.index, $th = model.th, $trs = that.$tbody.find('> tr'), display = showFlag ? '' : 'none'
                var setColspan = function(column) {
                    var _colspan = column.colspan
                    
                    if (showFlag) _colspan ++
                    else _colspan --
                    
                    if (!_colspan) column.th.css('display', 'none')
                    else column.th.css('display', '')
                    
                    column.th.attr('colspan', _colspan)
                    column.colspan = _colspan
                    
                    if (column.parent) setColspan(column.parent)
                }
                
                if (typeof model.hidden === 'undefined') model.hidden = false
                if (model.hidden === !showFlag) return
                
                model.hidden = !showFlag
                
                $th.css('display', display)
                
                if (that.options.tdTemplate && !this.isGridModel(model)) {
                    var colspan = $trs.eq(0).find('> td.datagrid-template-td').attr('colspan')
                    
                    if (colspan) {
                        $trs.find('> td.datagrid-template-td').attr('colspan', parseInt(colspan, 10) + (model.hidden ? -1 : 1))
                    }
                } else {
                    $trs.find('> td:eq('+ index +')').css('display', display)
                }
                that.$colgroupH.find('> col').eq(index).css('display', display)
                that.$colgroupB.find('> col').eq(index).css('display', display)
                that.$thead.find('> tr.datagrid-filter > th:eq('+ index +')').css('display', display)
                if (that.$boxF) {
                    that.$tableF.find('> thead > tr > th:eq('+ index +')').css('display', display)
                    that.$colgroupF.find('> col').eq(index).css('display', display)
                }
                
                if (model.calc) {
                    that.$tfoot && that.$tfoot.trigger('resizeH.bjui.datagrid.tfoot')
                }
                
                if (model.parent) setColspan(model.parent)
                
                // fixed width && height for child datagrid
                that.$tbody.find('> tr.'+ that.classnames.tr_child +':visible > td table').trigger('bjui.datagrid.child.resize')
            },
            isGridModel: function(model) {
                var keys = that.options.keys
                
                if (!model || typeof model !== 'object') return false
                return (model[keys.gridChild] || model[keys.gridNumber] || model[keys.gridCheckbox] || model[keys.gridEdit])
            },
            isGridData: function(name) {
                var keys = that.options.keys, b = false
                
                for (var key in keys) {
                    if (keys[key] === name) {
                        b = true
                        
                        break
                    }
                }
                
                return b
            },
            // jump to page
            jumpPage: function(pageCurrent, pageSize) {
                var allData = that.allData, filterDatas
                
                if (pageCurrent) {
                    that.paging.oldPageCurrent = that.paging.pageCurrent
                    that.paging.pageCurrent    = pageCurrent
                }
                if (pageSize) {
                    that.paging.oldPageSize = that.paging.pageSize
                    
                    that.paging.pageSize  = pageSize
                    that.paging.pageCount = this.getPageCount(pageSize, that.paging.total)
                    
                    if (that.paging.pageCurrent > that.paging.pageCount)
                        that.paging.pageCurrent = that.paging.pageCount
                }
                
                if (options.local === 'remote') {
                    filterDatas = this.getRemoteFilterData(true)
                    
                    //if (that.sortData)
                    //    $.extend(filterDatas, that.sortData)
                    
                    this.loadData(filterDatas, true)
                } else {
                    this.initTbody(allData, true)
                }
            },
            // column - quicksort
            quickSort: function(model) {
                if (that.isDom) {
                    if (options.local === 'local') return
                    options.sortAll = true
                }
                if (!that.sortData) {
                    that.sortData = {}
                }
                if (that.$tbody.find('> tr.'+ that.classnames.tr_edit).length) {
                    that.$tbody.alertmsg('info', BJUI.getRegional('datagrid.editMsg'))
                    return
                }
                
                var $th = model.th, data = that.data, allData = that.allData, postData, direction, name = model.name, type = model.type, $ths = that.$thead.find('> tr > th.datagrid-quicksort-th')
                
                if (!name) name = 'datagrid-noname'
                
                var getOrders = function() {
                    var orders = []
                    
                    $.each(that.sortData, function(k, v) {
                        orders.push(k +' '+ v.direction)
                    })
                    
                    return orders
                }
                var sortData = function(data, orders) {
                    var localSort = function(a, b) {
                        var key_index = 0
                        
                        function doCompare() {
                            var keys = orders[key_index].split(' '), name = keys[0], direction = keys[1], typeA = (typeof a[name]), typeB = (typeof b[name])
                            
                            if (a[name] == b[name] && key_index < orders.length - 1) {
                                key_index ++
                                return doCompare()
                            }
                            
                            if (type === 'boolean' || type === 'number' || (typeA = typeB === 'number') || (typeA = typeB === 'boolean')) {
                                return direction === 'asc' ? (a[name] - b[name]) : (b[name] - a[name])
                            } else {
                                return direction === 'asc' ? (String(a[name]).localeCompare(b[name]) || String(a['xm']).localeCompare(b['xm'])) : String(b[name]).localeCompare(a[name])
                            }
                        }
                        
                        if (!orders || !orders.length) {
                            return (a['bjui_local_index'] - b['bjui_local_index'])
                        }
                        return doCompare()
                    }
                    
                    data.sort(localSort)
                }
                
                if (options.fieldSortable)
                    $th.find('> div > .datagrid-label > i').remove()
                else
                    that.$thead.find('> tr:not(.datagrid-filter) > th > div > .datagrid-label > i').remove()
                
                if (model.sortDesc) {
                    model.sortDesc = false
                } else {
                    if (model.sortAsc) {
                        direction = 'desc'
                            model.sortAsc  = false
                            model.sortDesc = true
                    } else {
                        direction = 'asc'
                            model.sortAsc = true
                    }
                    $th.find('> div > .datagrid-label').prepend('<i class="datagrid-sort-i fa fa-long-arrow-'+ (model.sortAsc ? 'up' : 'down') +'"></i>')
                    that.$boxH.find('.datagrid-thead-dialog-filter-msg > .msg-sort').html('<i class="datagrid-sort-i fa fa-long-arrow-'+ (model.sortAsc ? 'up' : 'down') +'"></i> '+ model.label)
                }
                
                //$th.find('> div > .datagrid-label').prepend('<i class="datagrid-sort-i fa fa-long-arrow-'+ (model.sortAsc ? 'up' : 'down') +'"></i>')
                
                if (direction) {
                    if (that.sortData[name]) {
                        that.sortData[name]['direction'] = direction
                    } else {
                        that.sortData[name] = {index:(Object.keys(that.sortData)).length, direction:direction}
                    }
                } else {
                    delete that.sortData[name]
                }
                if (options.sortAll) {
                    if (options.local === 'remote') {
                        postData = that.$element.data('filterDatas') || {}
                        //postData[BJUI.pageInfo.orderField]     = name
                        //postData[BJUI.pageInfo.orderDirection] = direction
                        postData[BJUI.pageInfo.pageSize]       = that.paging.pageSize
                        postData[BJUI.pageInfo.pageCurrent]    = that.paging.pageCurrent
                        
                        //that.sortData = {orderField:name, orderDirection:direction}
                        if (direction) {
                            postData[BJUI.pageInfo.orderField]     = name
                            postData[BJUI.pageInfo.orderDirection] = direction
                        } else {
                            postData[BJUI.pageInfo.orderField]     = ''
                            postData[BJUI.pageInfo.orderDirection] = ''
                        }
                        
                        postData['orders'] = getOrders().join(',')
                        that.orders = {orders : postData['orders']}
                        
                        this.loadData(that.tools.getRemoteFilterData(true), true)
                    } else {
                        sortData(allData, getOrders())
                        this.initTbody(allData, true)
                    }
                } else {
                    sortData(data, getOrders())
                    this.createTrs(data, true)
                }
            },
            showFilterMsg: function(msgs) {
                var $msg = that.$boxH.find('.datagrid-thead-dialog-filter-msg'), $filter = $msg.find('> .msg-filter'), html = BJUI.StrBuilder()
                
                $filter.html('')
                
                if (!msgs.length) return
                
                $.each(msgs, function(i, n) {
                    if (!n) return true
                    
                    var label = n.label, val = n.data.valA
                    
                    if (n.model.type === 'select' || n.model.type === 'boolean') {
                        val = n.model.render.call(that, val, {}, n.model.items)
                    }
                    
                    html.add('；')
                        .add(n.model.label +':'+ val)
                })
                
                html = html.toString()
                html.length > 1 && (html = html.substr(1))
                
                $filter.html(html)
            },
            quickFilter: function(model, filterDatas) {
                if (that.isDom) {
                    if (options.local != 'remote') {
                        BJUI.debug('Datagrid Plugin: Please change the local option is remote!')
                        return
                    }
                    if (!options.dataUrl) {
                        BJUI.debug('Datagrid Plugin: Not Set the dataUrl option!')
                        return
                    }
                }
                
                var tools = this, $th = model.th, data = that.data, allData = that.allData, name = model.name, postData, fDatas, msgs = []
                var switchOperator = function(operator, val1, val2, model) {
                    var compare = false
                    
                    switch (operator) {
                    case '=':
                        compare = String(val1) === String(val2)
                        break
                    case '!=':
                        compare = String(val1) !== String(val2)
                        break
                    case '>':
                        compare = parseFloat(val2) > parseFloat(val1)
                        break
                    case '<':
                        compare = parseFloat(val2) < parseFloat(val1)
                        break
                    case 'like':
                        if (model && model.type === 'select') {
                            compare = String(val1) === String(val2)
                            if (model.attrs && model.attrs.multiple) {
                                if ($.isArray(val1) && String(val2)) {
                                    $.each(String(val2).split(','), function(i, n) {
                                        compare = $.inArray(n, val1) != -1
                                        if (compare) return false
                                    })
                                }
                            }
                        } else {
                            compare = String(val2).indexOf(String(val1)) >= 0
                        }
                        break
                    default:
                        break
                    }
                    
                    return compare
                }
                var filterData = function(data, filterDatas) {
                    var grepFun = function(n) {
                        var count = 0
                        
                        $.each(filterDatas, function(name, v) {
                            var op = v.datas
                            
                            count ++
                            if (!op) {
                                count --
                                v.model.isFiltered = false
                                v.model.th.trigger('filter.bjui.datagrid.th', [false])
                                if (v.model.$quickfilter) v.model.$quickfilter.trigger('clearfilter.bjui.datagrid.thead')
                                
                                return true
                            }
                            
                            v.model.isFiltered = true
                            v.model.th.trigger('filter.bjui.datagrid.th', [true])
                            
                            if (!msgs[v.model.index])
                                msgs[v.model.index] = {model:v.model, data:v.datas}
                            
                            if (op.andor) {
                                if (op.andor === 'and') {
                                    if (switchOperator(op.operatorA, op.valA, n[name], v.model) && switchOperator(op.operatorB, op.valB, n[name], v.model)) {
                                        count --
                                    }
                                } else if (op.andor === 'or') {
                                    if (switchOperator(op.operatorA, op.valA, n[name], v.model) || switchOperator(op.operatorB, op.valB, n[name], v.model)) {
                                        count --
                                    }
                                }
                            } else {
                                if (op.operatorB) {
                                    if (switchOperator(op.operatorB, op.valB, n[name], v.model)) {
                                        count --
                                    }
                                } else {
                                    if (switchOperator(op.operatorA, op.valA, n[name], v.model)) {
                                        count --
                                    }
                                }
                            }
                        })
                        
                        return !count ? true : false
                    }
                    
                    return $.grep(data, function(n, i) {
                        return grepFun(n)
                    })
                }
                
                if (!that.filterDatas) that.filterDatas = {}
                if (options.filterMult) {
                    that.filterDatas[name] = {datas:filterDatas, model:model}
                } else {
                    that.filterDatas = {}
                    that.filterDatas[name] = {datas:filterDatas, model:model}
                }
                
                if (options.local !== 'remote' && allData) {
                    if (!that.oldAllData) that.oldAllData = allData.concat()
                    else allData = that.oldAllData.concat()
                }
                
                if (options.filterAll) {
                    if (options.local === 'remote') {
                        tools.loadData(tools.getRemoteFilterData(false, msgs), true)
                    } else {
                        fDatas = filterData(allData, that.filterDatas)
                        
                        that.tools.showFilterMsg(msgs)
                        
                        that.paging.pageCurrent = 1
                        that.paging.pageCount   = this.getPageCount(that.paging.pageSize, fDatas.length)
                        
                        this.initTbody(fDatas, true)
                    }
                } else {
                    if (that.isDom) {
                        tools.loadData(tools.getRemoteFilterData(false, msgs), true)
                    } else {
                        if (!that.oldData) that.oldData = data.concat()
                        else data = that.oldData.concat()
                        
                        fDatas = filterData(data, that.filterDatas)
                        
                        that.tools.showFilterMsg(msgs)
                        
                        this.createTrs(fDatas, true)
                    }
                }
            },
            getRemoteFilterData: function(isPaging, msgs) {
                var filterDatas = {}
                
                if (that.filterDatas && !$.isEmptyObject(that.filterDatas)) {
                    $.each(that.filterDatas, function(name, v) {
                        if (!v.datas) {
                            v.model.isFiltered = false
                            v.model.th.trigger('filter.bjui.datagrid.th', [false])
                            if (v.model.$quickfilter) v.model.$quickfilter.trigger('clearfilter.bjui.datagrid.thead')
                            msgs && msgs[v.model.index] && (msgs[v.model.index] = false)
                            return true
                        }
                        
                        v.model.isFiltered = true
                        v.model.th.trigger('filter.bjui.datagrid.th', [true])
                        
                        if (options.jsonPrefix)
                            name = options.jsonPrefix +'.'+ name
                        
                        if (v.datas.andor)
                            filterDatas['andor'] = v.datas.andor
                        if (v.datas.operatorA) {
                            filterDatas[name] = v.datas.valA
                            filterDatas[name +'.operator'] = v.datas.operatorA
                        }
                        if (v.datas.operatorB) {
                            if (filterDatas[name]) {
                                filterDatas[name] = [filterDatas[name], v.datas.valB]
                                filterDatas[name +'.operator'] = [filterDatas[name +'.operator'], v.datas.operatorB]
                            } else {
                                filterDatas[name] = v.datas.valB
                                filterDatas[name +'.operator'] = v.datas.operatorB
                            }
                        }
                    })
                    
                    if (!isPaging) that.paging.pageCurrent = 1
                }
                
                if (that.initFilter) {
                    var name = options.jsonPrefix ? options.jsonPrefix +'.' : ''
                    
                    $.each(that.initFilter, function(k, v) {
                        if (!that.filterDatas || typeof that.filterDatas[k] === 'undefined')
                            filterDatas[name + k] = v.value
                    })
                }
                
                // paging
                filterDatas[BJUI.pageInfo.pageSize]    = that.paging.pageSize
                filterDatas[BJUI.pageInfo.pageCurrent] = that.paging.pageCurrent || 1
                
                $.extend(filterDatas, that.orders || {})
                
                that.$element.data('filterDatas', filterDatas)
                
                return filterDatas
            },
            // set data for Dom
            setDomData: function(tr) {
                var columnModel = that.columnModel, data = {}, hideDatas = tr.attr('data-hidden-datas'), attach = that.attach
                    
                tr.find('> td').each(function(i) {
                    var $td = $(this), model = columnModel[i], val = $td.attr('data-val') || $td.text()
                    
                    if (!model.name) data['datagrid-noname'+ i] = val
                    else data[model.name] = val
                })
                
                if (hideDatas) hideDatas = hideDatas.toObj()
                
                attach[that.options.keys.gridNumber] = (tr.index() + 1)
                $.extend(data, attach, hideDatas)
                
                tr.data('initData', data)
                
                return data
            },
            // update linenumber
            updateLinenumber: function() {
                if ($.inArray(that.linenumberColumn, that.columnModel) == -1)
                    return
                
                var lock = false
                
                if (that.linenumberColumn.locked) {
                    that.colLock(that.linenumberColumn.th, false)
                    lock = true
                }
                
                that.$tbody.find('> tr:not(.'+ that.classnames.tr_child +')').each(function(i) {
                    var $tr = $(this)
                    
                    $tr.find('> td.'+ that.classnames.td_linenumber).text(i + 1)
                })
                
                if (lock)
                    that.colLock(that.linenumberColumn.th, true)
            },
            // update that.data gridIndex && gridNumber
            updateGridIndex: function() {
                var paging = that.paging, options = that.options, startNumber = (paging.pageCurrent - 1) * paging.pageSize
                
                $.each(that.data, function(i, data) {
                    var linenumber = options.linenumberAll ? (startNumber + (i + 1)) : (i + 1)
                    
                    data[options.keys.gridNumber] = linenumber
                    data[options.keys.gridIndex]  = i
                })
            },
            // init filter
            initFilter: function($input, model) {
                var initFilter = that.initFilter
                var doFilter = function($input, model) {
                    $input.val(String(that.options.initFilter[model.name]))
                    
                    if (that.$headFilterUl) {
                        var $headinput = that.$headFilterUl.find('> li.li-'+ model.index +'> '+ $input[0].tagName)
                        
                        if ($headinput.length) {
                            $headinput.val($input.val())
                            if ($headinput.isTag('select'))
                                $headinput.selectpicker('refresh')
                        }
                    }
                    
                    if (that.options.local === 'remote') {
                        model.isFiltered = true
                        model.th.trigger('filter.bjui.datagrid.th', [true])
                    } else {
                        that.tools.quickFilter(model, {operatorA:'like', valA:that.options.initFilter[model.name]})
                    }
                }
                
                if (!$input && !model) {
                    if (initFilter) {
                        $.each(initFilter, function(i, n) {
                            doFilter(n.input, n.model)
                        })
                    }
                    return
                }
                
                if (!initFilter) initFilter = {}
                
                if (!model) return
                
                doFilter($input, model)
                
                if (!initFilter[model.name]) {
                    initFilter[model.name] = {}
                    initFilter[model.name].input = $input
                    initFilter[model.name].model = model
                    initFilter[model.name].value = that.options.initFilter[model.name]
                }
                
                that.initFilter = initFilter
            },
            // init inputs array for edit
            initEditInputs: function() {
                var columnModel = that.columnModel
                
                that.inputs = []
                
                $.each(columnModel, function(i, op) {
                    var name = op.name, rule = '', pattern = '', selectoptions = [], attrs = ''
                    
                    if (!op) return
                    if (op.attrs && typeof op.attrs === 'object') {
                        $.each(op.attrs, function(i, n) {
                            if (typeof n === 'object') n = JSON.stringify(n).replaceAll('\"', '\'')
                            attrs += ' '+ i +'='+ n
                        })
                    }
                    
                    if (op === that.childColumn || op === that.linenumberColumn || op === that.checkboxColumn || op === that.editBtnsColumn) {
                        that.inputs.push('')
                    } else if (name) {
                        if (op.rule) rule = ' data-rule="'+ op.label +'：'+ op.rule +'"'
                        else if (op.type === 'date') rule = ' data-rule="pattern('+ (op.pattern || 'yyyy-MM-dd') +')"';
                        if (op.type) {
                            switch (op.type) {
                            case 'date':
                                if (!op.pattern) op.pattern = 'yyyy-MM-dd'
                                pattern = ' data-pattern="'+ op.pattern +'"'
                                that.inputs.push('<input type="text" name="'+ name +'" data-toggle="datepicker"'+ pattern + rule + attrs +'>')
                                
                                break
                            case 'select':
                                if (!op.items) return
                                
                                $.each(op.items, function(i, n) {
                                    $.each(n, function(key, value) {
                                        selectoptions.push('<option value="'+ key +'">'+ value +'</option>')
                                    })
                                })
                                
                                that.inputs.push('<select name="'+ name +'" data-toggle="selectpicker"'+ rule + attrs +' data-width="100%">'+ selectoptions.join('') +'</select>')
                                
                                break
                            case 'boolean':
                                that.inputs.push('<input type="checkbox" name="'+ name +'" data-toggle="icheck"'+ rule + attrs +' value="true">')
                                
                                break
                            case 'findgrid':
                                that.inputs.push('<input type="text" name="'+ name +'" data-toggle="findgrid" data-custom-event="true"'+ rule + attrs +'>')
                                
                                break
                            case 'tags':
                                that.inputs.push('<input type="text" name="'+ name +'" data-toggle="tags"'+ attrs +'>')
                                
                                break
                            case 'spinner':
                                that.inputs.push('<input type="text" name="'+ name +'" data-toggle="spinner"'+ rule + attrs +'>')
                                
                                break
                            case 'textarea':
                                that.inputs.push('<textarea data-toggle="autoheight" rows="1"'+ rule + attrs +'></textarea>')
                                
                                break
                            default:
                                that.inputs.push('<input type="text" name="'+ name +'"'+ rule + attrs +'>')
                                break
                            }
                        } else {
                            that.inputs.push('<input type="text" name="'+ name +'"'+ rule + attrs +'>')
                        }
                    } else {
                        that.inputs.push('')
                    }
                })
                
                return that.inputs
            },
            contextmenuH: function() {
                var tools = this
                
                that.$tableH.on('contextmenu', 'tr:not(.datagrid-filter)', function(e) {
                    if (!that.$showhide) tools.createShowhide()
                    
                    var posX = e.pageX, posY = e.pageY, wh = $(window).height(), mh = that.$showhide.data('height')
                    
                    if ($(window).width()  < posX + that.$showhide.width())  posX -= that.$showhide.width()
                    if (posY < 0 || (posY + mh) > wh)
                        posY = 0
                    if (mh > wh)
                        that.$showhide.css({height:wh})
                    else
                        that.$showhide.css({height:''})
                    if (that.$menu) {
                        that.$grid.trigger('click.bjui.datagrid.filter')
                    }
                    
                    that.$showhide
                        .appendTo('body')
                        .css({left:posX, top:posY, opacity:1, 'z-index':9999}).show()
                    
                    $(document).on('click', function(e) {
                        var $showhide = $(e.target).closest('.'+ that.classnames.s_showhide)
                        
                        if (!$showhide.length)
                            that.$showhide.css({left:'50%', top:0, opacity:0.2, 'z-index':''}).hide().appendTo(that.$grid)
                    })
                    
                    e.preventDefault()
                    e.stopPropagation()
                })
            },
            contextmenuB: function($tr, isLock) {
                $tr.contextmenu('show', 
                        {
                            exclude : 'input, .bootstrap-select',
                            items:[
                                {
                                    icon  : 'refresh',
                                    title : BJUI.getRegional('datagrid.refresh'),
                                    func  : function(parent, menu) {
                                        that.refresh()
                                    }
                                },
                                {
                                    title : 'diver'
                                },
                                {
                                    icon  : 'plus',
                                    title : BJUI.getRegional('datagrid.add'),
                                    func  : function(parent, menu) {
                                        that.add()
                                    }
                                },
                                {
                                    icon  : 'edit',
                                    title : BJUI.getRegional('datagrid.edit'),
                                    func  : function(parent, menu) {
                                        var $tr = parent
                                        
                                        if (isLock) $tr = that.$tbody.find('> tr:eq('+ $tr.index() +')')
                                        that.doEditRow($tr)
                                    }
                                },
                                {
                                    icon  : 'undo',
                                    title : BJUI.getRegional('datagrid.cancel'),
                                    func  : function(parent, menu) {
                                        var $tr = parent
                                        
                                        if (isLock) $tr = that.$tbody.find('> tr:eq('+ $tr.index() +')')
                                        
                                        if (!$tr.hasClass(that.classnames.tr_edit)) {
                                            $tr = that.$tbody.find('> tr.'+ that.classnames.tr_edit)
                                        }
                                        that.doCancelEditRow($tr)
                                    }
                                },
                                {
                                    icon  : 'remove',
                                    title : BJUI.getRegional('datagrid.del'),
                                    func  : function(parent, menu) {
                                        var $tr = parent
                                        
                                        if (isLock) $tr = that.$tbody.find('> tr:eq('+ $tr.index() +')')
                                        that.delRows($tr)
                                    }
                                }
                            ]
                        }
                    )
            }
        }
        
        return tools
    }
    
    Datagrid.prototype.init = function() {
        if (!this.$element.isTag('table')) return
        if (this.$element.data('bjui.datagrid.init')) return
        
        this.$element.data('bjui.datagrid.init', true)
        
        var that = this, options = that.options, keys = options.keys, tools = that.tools, $parent = that.$element.parent(), gridHtml = BJUI.StrBuilder()
        
        options.tableWidth = options.tableWidth || ''
        options.width      = options.width || '100%'
        options.height     = options.height || 'auto'
        that.isDom         = false
        that.columnModel   = []
        that.inputs        = []
        that.regional      = BJUI.regional.datagrid
        
        gridHtml
            .add('<div class="bjui-datagrid">')
            .add(options.gridTitle ? '<div class="datagrid-title">'+ options.gridTitle +'</div>' : '')
            .add(options.showToolbar ? '<div class="datagrid-toolbar"></div>' : '')
            .add('<div class="datagrid-box-h"><div class="datagrid-wrap-h"><table class="table table-bordered"><colgroup></colgroup></table></div></div>')
            .add('<div class="datagrid-box-b"><div class="datagrid-wrap-b"></div></div>')
            .add('<div class="datagrid-box-m"></div>')
            .add(options.paging ? '<div class="datagrid-paging-box"></div>' : '')
            .add('</div>')
        
        that.$grid    = $(gridHtml.toString()).insertAfter(that.$element).css('height', options.height)
        that.$boxH    = that.$grid.find('> div.datagrid-box-h')
        that.$boxB    = that.$boxH.next()
        that.$boxM    = that.$boxB.next().css('height', options.height)
        that.$boxP    = options.paging ? that.$boxM.next() : null
        that.$boxT    = options.gridTitle ? that.$grid.find('> div.datagrid-title') : null
        that.$toolbar = options.showToolbar ? that.$boxH.prev() : null
        that.$tableH  = that.$boxH.find('> div > table')
        that.$tableB  = that.$element
        // tdtemplate
        that.isTemplate = (options.tdTemplate && options.templateWidth) && options.templateWidth > that.$grid.width()
        
        that.$grid.data('bjui.datagrid.table', that.$element.clone())
        that.$boxB.find('> div').append(that.$element)
        
        that.initTop()
        
        if (typeof options.paging === 'string') options.paging = options.paging.toObj()
        that.paging = $.extend({}, {pageSize:30, selectPageSize:'30,60,90', pageCurrent:1, total:0, showPagenum:5}, (typeof options.paging === 'object') && options.paging)
        that.$thead = that.$element.find('> thead')
        that.$tbody = that.$element.find('> tbody')
        that.attach = {}
        
        that.attach[keys.gridNumber]   = 0
        that.attach[keys.gridCheckbox] = '#checkbox#'
        that.attach[keys.gridEdit]     = '#edit#'
        
        if (that.$tbody && that.$tbody.find('> tr').length) {
            that.isDom = true
            
            that.setColumnModel()
            
            that.$tbody.find('> tr > td').each(function() {
                var $td = $(this), html = $td.html()
                
                $td.html('<div>'+ html +'</div>')
            })
            
            if (!that.paging.total) {
                that.paging.total = that.$tbody.find('> tr').length
                that.paging.pageCount = 1
            } else {
                that.paging.pageCount = tools.getPageCount(that.paging.pageSize, that.paging.total)
            }
            
            that.paging.pageCurrent = 1
            that.initThead()
        } else {
            that.$tbody = null
            that.$element.find('> tbody').remove()
            
            if (options.columns) {
                if (typeof options.columns === 'string') {
                    if (options.columns.trim().startsWith('[')) {
                        options.columns = options.columns.toObj()
                    } else {
                        options.columns = options.columns.toFunc()
                    }
                }
                if (typeof options.columns === 'function') {
                    options.columns = options.columns.call()
                }
                
                that.$thead = null
                that.$element.find('> thead').remove()
                that.createThead()
            } else {
                if (that.$thead && that.$thead.length && that.$thead.find('> tr').length) {
                    that.setColumnModel()
                } else {
                    BJUI.debug('Datagrid Plugin: No set options \'columns\' !')
                    that.destroy()
                    return
                }
            }
            if (options.data || options.dataUrl) {
                that.createTbody()
            } else {
                BJUI.debug('Datagrid Plugin: No options \'data\' or \'dataUrl\'!')
                that.destroy()
            }
        }
    }
    
    // DOM to datagrid - setColumnModel
    Datagrid.prototype.setColumnModel = function() {
        var that = this, options = that.options, $trs = that.$thead.find('> tr'), rows = [], ths = [], trLen = $trs.length
        
        if (!that.isDom) {
            that.tools.appendColumns()
            
            var $th, _rowspan = trLen > 1 ? ' rowspan="'+ trLen +'"' : ''
            
            if (options.showCheckboxcol) {
                that.columnModel.push(that.checkboxColumn)
                if (options.showCheckboxcol === 'lock') that.checkboxColumn.initLock = true
                
                $th = $('<th class="'+ that.classnames.td_checkbox +'"'+ _rowspan +'><input type="checkbox" data-toggle="icheck"></th>')
                $th.prependTo($trs.first())
                if (_rowspan) $th.data('datagrid.column', that.checkboxColumn)
            }
            if (options.showLinenumber) {
                that.columnModel.unshift(that.linenumberColumn)
                if (options.showLinenumber === 'lock') that.linenumberColumn.initLock = true
                
                $th = $('<th class="'+ that.classnames.td_linenumber +'"'+ _rowspan +'>No.</th>')
                $th.prependTo($trs.first())
                if (_rowspan) $th.data('datagrid.column', that.linenumberColumn)
            }
            if (options.showChildcol || (options.showChildcol === undefined && options.hasChild && options.childOptions)) {
                that.columnModel.unshift(that.childColumn)
                
                $th = $('<th class="'+ that.classnames.td_child +'"'+ _rowspan +'>...</th>')
                $th.prependTo($trs.first())
                if (_rowspan) $th.data('datagrid.column', that.childColumn)
            }
            if (options.showEditbtnscol) {
                $th = $('<th'+ _rowspan +'>'+ that.editBtnsColumn.label +'</th>')
                $th.appendTo($trs.first())
                if (_rowspan) $th.data('datagrid.column', that.editBtnsColumn)
                that.columnModel[$th.index()] = that.editBtnsColumn
            }
        }
        
        if ($trs.length && trLen == 1) {
            $trs.find('> th').each(function(i) {
                var $th = $(this).addClass('single-row').data('index', i), op = $th.data('options'), oW = $th.attr('width') || 'auto', label = $th.html()
                
                if (that.columnModel.length && that.columnModel[i]) {
                    op = that.columnModel[i]
                    op.index = i
                } else {
                    if (op && typeof op === 'string') op = op.toObj()
                    if (typeof op !== 'object') op = {}
                    
                    op.index = i
                    op.label = label
                    op.width = (typeof op.width === 'undefined') ? oW : op.width
                    
                    op = that.tools.setOp(op)
                    
                    that.columnModel[i] = op
                }
                
                that.columnModel[i].th = $th
                
                $th.html('<div><div class="datagrid-space"></div><div class="datagrid-label">'+ label +'</div><div class="'+ that.classnames.th_cell +'"><div class="'+ that.classnames.th_resizemark +'"></div></div></div>')
                if (op.menu && options.columnMenu) $th.addClass(that.classnames.th_menu)
                if (options.fieldSortable && op.quicksort) $th.addClass('datagrid-quicksort-th')
                if (op.align) $th.attr('align', op.align)
            })
        } else { // multi headers
            $trs.each(function(len) {
                var next_rows = [], next_ths = [], index = -1, next_index = 0
                
                if (rows.length) {
                    next_rows = rows.concat()
                    next_ths  = ths.concat()
                }
                rows = []
                ths  = []
                
                $(this).find('> th').each(function(i) {
                    var $th = $(this), op = $th.data('options') || $th.data('datagrid.column') || {}, colspan = parseInt(($th.attr('colspan') || 0), 10), rowspan = parseInt(($th.attr('rowspan') || 0), 10), oW = $th.attr('width') || 'auto', label = $th.html()
                    
                    if (op && typeof op === 'string') op = op.toObj()
                    if (typeof op !== 'object') op = {}
                    if (BJUI.isIE(8) && colspan === 1) colspan = 0
                    
                    op.label = label
                    op.th    = $th
                    if (op[options.keys.gridCheckbox]) op.label = 'Checkbox'
                    
                    index++
                    if (colspan) {
                        op.colspan = colspan
                        for (var start_index = (next_rows.length ? next_rows[index] : index), k = start_index; k < (start_index + colspan); k++) {
                            rows[next_index++]  = k
                            ths[next_index - 1] = op
                        }
                        index += (colspan - 1)
                        
                        $th.data('index', index)
                        
                        if (next_rows.length) {
                            op.parent = next_ths[index]
                        }
                    }
                    if (!rowspan || rowspan == 1) $th.addClass('single-row')
                    if (!colspan) {
                        op.width = (typeof op.width === 'undefined') ? oW : op.width
                        
                        op = that.tools.setOp(op)
                        $th.html('<div><div class="datagrid-space"></div><div class="datagrid-label">'+ label +'</div><div class="'+ that.classnames.th_cell +'"><div class="'+ that.classnames.th_resizemark +'"></div></div></div>')
                        
                        if (op.menu && options.columnMenu) $th.addClass(that.classnames.th_menu)
                        if (options.fieldSortable && op.quicksort) $th.addClass('datagrid-quicksort-th')
                        if (op.align) $th.attr('align', op.align)
                        if (!next_rows.length) {
                            op.index = index
                            that.columnModel[index] = op
                        } else {
                            op.index  = next_rows[index]
                            op.parent = next_ths[index]
                            that.columnModel[next_rows[index]] = op
                        }
                        
                        $th.data('index', op.index)
                    } else {
                        $th.html('<div><div class="datagrid-space"></div><div class="datagrid-label">'+ label +'</div><div class="'+ that.classnames.th_cell +'"><div class="'+ that.classnames.th_resizemark +'"></div></div></div>')
                    }
                })
            })
        }
    }
    
    // create thead by columns
    Datagrid.prototype.createThead = function() {
        var that = this, options = that.options, keys = options.keys, columns = options.columns, rowArr = [], rows = [], label, align, width, colspan, rowspan, resize, menu,
            columns2Arr = function(columns, rowArr, index, parent) {
                if (!rowArr) rowArr = []
                if (!index)   index = 0
                if (!rowArr[index]) rowArr[index] = []
                
                $.each(columns, function(i, n) {
                    var len = rowArr[index].length, colspan
                    
                    if (parent) n.parent = parent
                    if (n.columns) {
                        colspan = n.columns.length
                        if (index && n.parent) {
                            that.tools.setColspan(n.parent, colspan)
                        }
                        
                        n.index     = that.columnModel.length + colspan - 1
                        n.colspan   = colspan
                        n.quicksort = false
                        rowArr[index][len++] = n
                        
                        return columns2Arr(n.columns, rowArr, index + 1, n)
                    } else {
                        n.rowspan = index
                        n.index   = that.columnModel.length
                        
                        n = that.tools.setOp(n)
                        
                        rowArr[index][len++] = n
                        that.columnModel.push(n)
                    }
                })
                
                return rowArr
            }
        
        that.tools.appendColumns()
        
        if (options.showCheckboxcol) {
            columns.unshift(that.checkboxColumn)
            if (options.showCheckboxcol === 'lock') that.checkboxColumn.initLock = true
        }
        if (options.showLinenumber) {
            columns.unshift(that.linenumberColumn)
            if (options.showLinenumber === 'lock') that.linenumberColumn.initLock = true
        }
        if (options.showChildcol || (options.showChildcol === undefined && options.hasChild && options.childOptions)) {
            columns.unshift(that.childColumn)
        }
        if (options.showEditbtnscol) columns.push(that.editBtnsColumn)
        
        rowArr = columns2Arr(columns, rowArr)
        // the last model can't lock
        that.columnModel[that.columnModel.length - (options.showEditbtnscol ? 2 : 1)].lock = false
        // hidden fields
        if (options.hiddenFields) that.hiddenFields = options.hiddenFields
        // create thead
        that.$thead  = $('<thead></thead>')
        $.each(rowArr, function(i, arr) {
            var $tr = $('<tr style="height:25px;"></tr>'), $num = '<th class="datagrid-number"></th>', $th
            
            $.each(arr, function(k, n) {
                label   = n.label || n.name
                align   = n.align ? (' align="'+ n.align +'"') : ''
                width   = n.width ? (' width="'+ n.width +'"') : ''
                colspan = n.colspan ? ' colspan="'+ n.colspan +'"' : ''
                rowspan = (rowArr.length - n.rowspan > 1) ? ' rowspan="'+ (rowArr.length - n.rowspan) +'"' : ''
                resize  = '<div class="'+ that.classnames.th_resizemark +'"></div>'
                menu    = ''
                
                if (n[keys.gridCheckbox]) label = '<input type="checkbox" data-toggle="icheck">'
                if (n.colspan) align = ' align="center"'
                if (n.thalign) align = ' align="'+ n.thalign +'"'
                if (n.menu && options.columnMenu) menu = ' class="'+ that.classnames.th_menu +'"'
                
                $th = $('<th'+ menu + width + align + colspan + rowspan +'><div><div class="datagrid-space"></div><div class="datagrid-label">'+ label +'</div><div class="'+ that.classnames.th_cell +'">'+ resize +'</div></div></th>')
                $th.data('index', n.index).appendTo($tr)
                
                if (!rowspan) $th.addClass('single-row')
                if (n[keys.gridChild]) $th.addClass(that.classnames.td_child)
                if (n[keys.gridNumber]) $th.addClass(that.classnames.td_linenumber)
                if (n[keys.gridCheckbox]) $th.addClass(that.classnames.td_checkbox)
                if (options.fieldSortable && n.quicksort) $th.addClass('datagrid-quicksort-th')
                
                n.th = $th
            })
            
            $tr.appendTo(that.$thead)
        })
        
        that.$thead.appendTo(that.$element).initui()
    }
    
    Datagrid.prototype.createTbody = function() {
        var that = this, options = that.options, data = options.data, model = that.columnModel, cols = []
        
        if (data) {
            if (typeof data === 'string') {
                if (data.trim().startsWith('[') || data.trim().startsWith('{')) {
                    data = data.toObj()
                } else {
                    data = data.toFunc()
                }
            }
            if (typeof data === 'function') {
                data = data.call()
            }
            
            options.data = data
            that.tools.createTrsByData(data)
        } else if (options.dataUrl) {
            var data = {}
            
            if (typeof options.initFilter === 'object' && options.initFilter && options.jsonPrefix) {
                $.each(options.initFilter, function(k, v) {
                    data[options.jsonPrefix +'.'+ k] = v
                })
            }
            
            that.$element.data('filterDatas', data)
            
            that.tools.loadData(data)
        }
    }
    
    Datagrid.prototype.refresh = function(filterFlag) {
        var that = this, options = that.options, tools = that.tools, isDom = that.isDom, pageInfo = BJUI.pageInfo, paging = that.paging, postData = {}
        
        if (!options.dataUrl) {
            if (options.data && options.data.length) {
                tools.initTbody(that.allData, true)
                return
            }
            
            BJUI.debug('Datagrid Plugin: Not Set the dataUrl option!')
            return
        }
        
        if (!options.postData || !options.postData[pageInfo.pageSize]) {
            postData[pageInfo.pageSize]    = paging.pageSize
            postData[pageInfo.pageCurrent] = paging.pageCurrent
        }
        if (options.initFilter && typeof options.initFilter === 'object') {
            if (typeof options.initFilter === 'object' && options.initFilter && options.jsonPrefix) {
                $.each(options.initFilter, function(k, v) {
                    postData[options.jsonPrefix +'.'+ k] = v
                })
            }
            that.doInitFilter = true
        }
        if (filterFlag)
            $.extend(postData, that.$element.data('filterDatas') || {})
        
        tools.loadData(postData, true)
        
        // clear fiter
        if (!filterFlag) {
            that.filterDatas = null
            $.each(that.columnModel, function(i, n) {
                n.th.trigger('filter.bjui.datagrid.th', [false])
                n.isFiltered = false
                if (n.$quickfilter) n.$quickfilter.trigger('clearfilter.bjui.datagrid.thead')
            })
            // clear sort
            that.$thead.find('> tr > th.datagrid-quicksort-th').find('> div > .datagrid-label > i').remove()
        }
    }
    
    Datagrid.prototype.refreshParent = function() {
        var that = this, $parent = that.$element.data('bjui.datagrid.parent')
        
        if ($parent && $parent.length)
            $parent.closest('table').datagrid('refresh')
    }
    
    Datagrid.prototype.refreshChild = function(row) {
        var that = this, $trs = that.$tbody.find('> tr'), $table,
            refresh = function(obj) {
                $table = obj.data('bjui.datagrid.child')
                
                if ($table && $table.length && $table.isTag('table'))
                    $table.datagrid('refresh')
            }
        
        if (row instanceof jQuery) {
            row.each(function() {
                refresh($(this))
            })
        } else if (isNaN(row)) {
            $.each(row.split(','), function(i, n) {
                if (n * 2 < $trs.length)
                    refresh($trs.eq(n * 2))
            })
        } else {
            if (row * 2 < $trs.length)
                refresh($trs.eq(row * 2))
        }
    }
    
    // api
    Datagrid.prototype.showChild = function(row, flag, func) {
        if (typeof flag === 'undefined')
            flag = 'toggle'
        
        var that   = this, options = that.options, $child, $td, $table, index, trData, childOptions, dataUrl, $trs = that.$tbody.find('> tr:not(.'+ that.classnames.tr_child +')'),
            fixedH = function() {
                //if (!options.fullGrid)
                    that.fixedWidth()
                
                that.fixedHeight()
            },
            fixedL = function(index, showorhide, height) {
                if (that.$lockTableB) {
                    var $locktr = that.$lockTableB.find('> tbody > tr:eq('+ index +')')
                    
                    $locktr.toggle(showorhide)
                    
                    if (height)
                        $locktr.height(height)
                    else if (!$locktr.height())
                        $locktr.height($child.height())
                }
            },
            show = function($tr, $child, $table) {
                $td.find('> div').html(BJUI.doRegional(FRAG.gridShrinkBtn, that.regional))
                
                $child.fadeIn('normal', function() {
                    if (!$table.data('bjui.datagrid.init')) {
                        childOptions = $.extend(true, {}, that.childOptions), dataUrl = childOptions.dataUrl
                        
                        if (that.isDom) trData = $tr.data('initData') || that.tools.setDomData($tr)
                        else {
                            trData = that.data[that.tools.getNoChildDataIndex($tr.index())]
                        }
                        
                        if (dataUrl && !dataUrl.isFinishedTm()) {
                            dataUrl = that.tools.replacePlh(dataUrl, trData)
                            
                            if (!dataUrl.isFinishedTm()) {
                                BJUI.debug('Datagrid Plugin: The datagrid options \'childOptions\' in the \'dataUrl\' options is incorrect: '+ dataUrl)
                            } else {
                                childOptions.dataUrl = dataUrl
                            }
                        }
                        
                        $table
                            .datagrid(childOptions)
                            .data('bjui.datagrid.parent', $tr)
                            .on('completed.bjui.datagrid', $.proxy(function() {
                                fixedH()
                                fixedL(index, true, $child.outerHeight())
                                
                                if (func)
                                    func.apply(that, [$table])
                            }, that))
                            .on('bjui.datagrid.child.resize', function() {
                                $table
                                    .datagrid('fixedWidth')
                                    .datagrid('fixedHeight')
                            })
                        
                        $tr.data('bjui.datagrid.child', $table)
                    } else {
                        fixedH()
                        fixedL(index, true)
                        
                        if (func)
                            func.apply(that, [$table])
                    }
                })
            },
            hide = function($tr, $child, $table) {
                $child.fadeOut('normal', function() {
                    $td.find('> div').html(BJUI.doRegional(FRAG.gridExpandBtn, that.regional))
                    
                    fixedH()
                    fixedL(index, false)
                    
                    if (func)
                        func.apply(that, [$table])
                })
            },
            showhide = function($tr) {
                $child = $tr.next('.'+ that.classnames.tr_child)
                
                if ($child && $child.length) {
                    $td    = $tr.find('> td.'+ that.classnames.td_child)
                    index  = $child.index()
                    $table = $child.find('> td').find('table.table-child')
                    
                    if ($table && $table.length) {
                        if (flag && flag === 'toggle') {
                            $child.is(':hidden') ? show($tr, $child, $table) : hide($tr, $child, $table)
                        } else {
                            flag ? show($tr, $child, $table) : hide($tr, $child, $table)
                        }
                    }
                }
            }
        
        if (func) {
            if (typeof func === 'string')
                func = func.toFunc()
            if (typeof func !== 'function')
                func = false
        }
        
        if (row instanceof jQuery) {
            row.each(function() {
                showhide($(this))
            })
        } else if (isNaN(row)) {
            $.each(row.split(','), function(i, n) {
                var tr = $trs.eq(parseInt(n.trim(), 10))
                
                if (tr && tr.length)
                    showhide(tr)
            })
        } else if (!isNaN(row)) {
            var tr = $trs.eq(row)
            
            if (tr && tr.length)
                showhide(tr)
        }
    }
    
    // api
    Datagrid.prototype.updateRow = function(row, updateData) {
        var that = this, options = that.options, data_index, data, url, $tr,
            doUpdate = function(tr, updateData) {
                $.extend(data, typeof updateData === 'object' && updateData)
                
                that.dialogEditComplete(tr, data)
                
                // refresh child
                if (data['refresh.datagrid.child']) {
                    var $child = tr.data('bjui.datagrid.child')
                    
                    if ($child && $child.length)
                        $child.datagrid('refresh')
                    else
                        that.showChild(row)
                }
                
                // fixedH
                if (options.height === 'auto') {
                    var scrollTop = that.$boxB.scrollTop()
                    
                    that.$boxB.scrollTop(5)
                    if (that.$boxB.scrollTop()) {
                        that.fixedHeight()
                        that.$boxB.scrollTop(scrollTop)
                    }
                }
            }
        
        if (row instanceof jQuery) {
            $tr = row
        } else if (!isNaN(row)) {
            $tr = that.$tbody.find('> tr:not(.'+ that.classnames.tr_child +')').eq(parseInt(row, 10))
        } else {
            BJUI.debug('Datagrid Plugin: Func \'updateRow\', Parameter \'row\' is incorrect!')
            return
        }
        
        if (that.isDom) data = $tr.data('initData') || that.tools.setDomData($tr)
        else {
            data_index = that.tools.getNoChildDataIndex($tr.index())
            data = that.data[data_index]
        }
        
        if (updateData) {
            if (typeof updateData === 'string') {
                if (updateData.trim().startsWith('{'))
                    updateData = updateData.toObj()
                else
                    updateData = updateData.toFunc()
            }
            if (typeof updateData === 'function')
                updateData = updateData.apply()
                
            if (typeof updateData !== 'object' && !options.updateRowUrl) {
                BJUI.debug('Datagrid Plugin: Func \'updateRow\', Parameter \'updateData\' is incorrect!')
                return
            }
            
            doUpdate($tr, updateData)
        } else if (options.updateRowUrl) {
            url = that.tools.replacePlh(options.updateRowUrl, data)
            
            if (!url.isFinishedTm()) {
                BJUI.debug('Datagrid Plugin: The datagrid options \'updateRowUrl\' is incorrect!')
            } else {
                BJUI.ajax('doajax', {
                    url       : url,
                    type      : options.loadType,
                    okCallback: function(json) {
                        doUpdate($tr, json)
                    }
                })
            }
        } else {
            BJUI.debug('Datagrid Plugin: The datagrid options \'updateRowUrl\' is not set!')
        }
    }
    
    // api
    Datagrid.prototype.doAjaxRow = function(row, opts) {
        var that = this, options = that.options, $tr, data, data_index, url
        
        if (row instanceof jQuery) {
            $tr = row
        } else if (!isNaN(row)) {
            $tr = that.$tbody.find('> tr:not(.'+ that.classnames.tr_child +')').eq(parseInt(row, 10))
        } else {
            BJUI.debug('Datagrid Plugin: Func \'doAjaxRow\', Parameter \'row\' is incorrect!')
            return
        }
        if (typeof opts === 'object' && opts.url) {
            if (typeof opts.reload === 'undefined')
                opts.reload = false
            if (!opts.callback && !opts.okCallback) {
                opts.okCallback = function(json, options) {
                    that.updateRow($tr, typeof json === 'object' && !json[BJUI.keys.statusCode] && json)
                }
            }
            
            if (that.isDom) data = $tr.data('initData') || that.tools.setDomData($tr)
            else {
                data_index = that.tools.getNoChildDataIndex($tr.index())
                data = that.data[data_index]
            }
            
            url = opts.url
            
            if (!data || data.addFlag)
                url = url.replace(/{\/?[^}]*}/g, '')
            else
                url = that.tools.replacePlh(url, data)
            
            if (!url.isFinishedTm()) {
                BJUI.debug('Datagrid Plugin: Func \'doAjaxRow\', options \'url\' is incorrect: '+ url)
            }
            
            opts.url = url
            opts.loadingmask = true
            opts.target = that.$boxB
            
            BJUI.ajax('doajax', opts)
        } else {
            BJUI.debug('Datagrid Plugin: Func \'doAjaxRow\', options is incorrect or the property \'url\' is not set!')
        }
    }
    
    Datagrid.prototype.reload = function(option) {
        var that = this, options = that.options
        
        if (option && typeof option === 'object') {
            if (option.clearOldPostData)
                delete options.postData
            
            $.extend(true, options, option)
        }
        
        if (!options.dataUrl && options.data) {
            this.allData = options.data
        }
        
        this.refresh()
    }
    
    Datagrid.prototype.destroy = function() {
        var that = this, $element = that.$grid.data('bjui.datagrid.table')
        
        if ($element) {
            that.$element.html($element.html()).insertBefore(that.$grid)
            that.$grid.remove()
        }
    }
    
    Datagrid.prototype.initTop = function() {
        var that = this, options = that.options, regional = that.regional, hastoolbaritem = false, $group, groupHtml = '<div class="btn-group" role="group"></div>', btnHtml = '<button type="button" class="btn" data-icon=""></button>'
        
        if (options.showToolbar) {
            if (options.toolbarItem || options.toolbarCustom) {
                if (options.toolbarItem) {
                    var itemFunc = options.toolbarItem.toFunc()
                    
                    if (typeof itemFunc === 'function') {
                        options.toolbarItem = itemFunc.apply()
                    }
                    
                    hastoolbaritem = true
                    if (options.toolbarItem.indexOf('all') >= 0) options.toolbarItem = 'add, edit, cancel, save, |, del, |, refresh, |, import, export, exportf'
                    $.each(options.toolbarItem.split(','), function(i, n) {
                        n = n.trim().toLocaleLowerCase()
                        if (!$group || n === '|') {
                            $group = $(groupHtml).appendTo(that.$toolbar)
                            if (n === '|') return true
                        }
                        
                        if (n === 'add') {
                            that.$toolbar_add = $(btnHtml).attr('data-icon', 'plus').addClass('btn-blue').text(options.addName || BJUI.getRegional('datagrid.add'))
                                .appendTo($group)
                                .on('click', function(e) {
                                    that.add()
                                })
                        } else if (n === 'edit') {
                            that.$toolbar_edit = $(btnHtml).attr('data-icon', 'edit').addClass('btn-green').text(options.editName || BJUI.getRegional('datagrid.edit'))
                                .appendTo($group)
                                .on('click', function(e) {
                                    var $selectTrs = that.$tbody.find('> tr.'+ that.classnames.tr_selected)
                                    
                                    if (!options.editMode) return false
                                    if (!$selectTrs.length) {
                                        $(this).alertmsg('info', BJUI.getRegional('datagrid.selectMsg'))
                                    } else {
                                        if (options.inlineEditMult) {
                                            that.doEditRow($selectTrs)
                                        } else {
                                            if (that.$lastSelect) that.doEditRow(that.$lastSelect)
                                            else that.doEditRow($selectTrs.first())
                                        }
                                    }
                                })
                        } else if (n === 'cancel') {
                            that.$toolbar_calcel = $(btnHtml).attr('data-icon', 'undo').addClass('btn-orange').text(options.cancelName || BJUI.getRegional('datagrid.cancel'))
                                .appendTo($group)
                                .on('click', function(e) {
                                    that.doCancelEditRow(that.$tbody.find('> tr.'+ that.classnames.tr_edit))
                                })
                        } else if (n === 'save') {
                            that.$toolbar_save = $(btnHtml).attr('data-icon', 'save').addClass('btn-default').text(options.saveName || BJUI.getRegional('datagrid.save'))
                                .appendTo($group)
                                .on('click', function(e) {
                                    that.doSaveEditRow()
                                })
                        } else if (n === 'del') {
                            that.$toolbar_del = $(btnHtml).attr('data-icon', 'times').addClass('btn-red').text(options.delName || BJUI.getRegional('datagrid.del'))
                                .appendTo($group)
                                .on('click', function(e) {
                                    var $selectTrs = that.$tbody.find('> tr.'+ that.classnames.tr_selected)
                                    
                                    if ($selectTrs.length) {
                                        that.delRows($selectTrs)
                                    } else {
                                        $(this).alertmsg('info', BJUI.getRegional('datagrid.selectMsg'))
                                    }
                                })
                        } else if (n === 'refresh') {
                            that.$toolbar_refresh = $(btnHtml).attr('data-icon', 'refresh').addClass('btn-green').text(options.refreshName || BJUI.getRegional('datagrid.refresh'))
                                .appendTo($group)
                                .on('click', function(e) {
                                    that.refresh()
                                })
                        } else if (n === 'import') {
                            that.$toolbar_add = $(btnHtml).attr('data-icon', 'sign-in').addClass('btn-blue').text(options.importName || BJUI.getRegional('datagrid.import'))
                                .appendTo($group)
                                .on('click', function(e) {
                                    if (options.importOption) {
                                        var opts = options.importOption
                                        
                                        if (typeof opts === 'string')
                                            opts = opts.toObj()
                                        
                                        if (opts.options && opts.options.url) {
                                            if (opts.type === 'dialog') {
                                                that.$grid.dialog(opts.options)
                                            } else if (opts.type === 'navtab') {
                                                that.$grid.navtab(opts.options)
                                            } else {
                                                that.$grid.bjuiajax('doajax', opts.options)
                                            }
                                        }
                                    }
                                })
                        } else if (n === 'export') {
                            that.$toolbar_add = $(btnHtml).attr('data-icon', 'sign-out').addClass('btn-green').text(options.exportName || BJUI.getRegional('datagrid.export'))
                                .appendTo($group)
                                .on('click', function(e) {
                                    if (options.exportOption) {
                                        var opts = options.exportOption
                                        
                                        if (typeof opts === 'string')
                                            opts = opts.toObj()
                                        
                                        if (opts.options && opts.options.url) {
                                            if (!opts.options.data)
                                                opts.options.data = {}
                                            
                                            $.extend(opts.options.data, that.$element.data('filterDatas') || {}, that.sortData || {})
                                            opts.options.type = 'POST'
                                            
                                            if (opts.type === 'dialog') {
                                                BJUI.dialog(opts.options)
                                            } else if (opts.type === 'navtab') {
                                                BJUI.navtab(opts.options)
                                            } else if (opts.type === 'file') {
                                                opts.options.target = that.$boxB
                                                BJUI.ajax('ajaxdownload', opts.options)
                                            } else {
                                                BJUI.ajax('doajax', opts.options)
                                            }
                                        }
                                    }
                                })
                        } else if (n === 'exportf') {
                            that.$toolbar_add = $(btnHtml).attr('data-icon', 'filter').addClass('btn-green').text(options.exportfName || BJUI.getRegional('datagrid.exportf'))
                                .appendTo($group)
                                .on('click', function(e) {
                                    if (options.exportOption) {
                                        var opts = options.exportOption, filterDatas = that.tools.getRemoteFilterData(true)
                                        
                                        if (typeof opts === 'string')
                                            opts = opts.toObj()
                                        
                                        if (opts.options && opts.options.url) {
                                            if (!opts.options.data)
                                                opts.options.data = {}
                                            
                                            $.extend(opts.options.data, filterDatas, that.sortData || {})
                                            
                                            opts.options.type = 'POST'
                                            
                                            if (opts.type === 'dialog') {
                                                BJUI.dialog(opts.options)
                                            } else if (opts.type === 'navtab') {
                                                BJUI.navtab(opts.options)
                                            } else if (opts.type === 'file') {
                                                opts.options.target = that.$boxB
                                                BJUI.ajax('ajaxdownload', opts.options)
                                            } else {
                                                BJUI.ajax('doajax', opts.options)
                                            }
                                        }
                                    }
                                })
                        }
                    })
                }
                
                if (options.toolbarCustom) {
                    var $custom, $custombox = $('<div style="display:inline-block;"></div>')
                    
                    if (typeof options.toolbarCustom === 'string') {
                        var custom = $(options.toolbarCustom)
                        
                        if (custom && custom.length) {
                            $custom = custom
                        } else {
                            custom = custom.toFunc()
                            if (custom) {
                                $custom = custom.call(that)
                                if (typeof $custom === 'string') $custom = $($custom)
                            }
                        }
                    } else if (typeof options.toolbarCustom === 'function') {
                        $custom = options.toolbarCustom.call(that)
                        if (typeof $custom === 'string') $custom = $($custom)
                    } else {
                        $custom = options.toolbarCustom
                    }
                    
                    if ($custom && $custom.length && typeof $custom !== 'string') {
                        if (hastoolbaritem) {
                            $custombox.css('margin-left', '5px')
                        }
                        $custombox.appendTo(that.$toolbar)
                        $custom.appendTo($custombox)
                    }
                }
                
                that.$toolbar.initui()
            }
        }
    }
    
    Datagrid.prototype.initThead = function() {
        var that = this, options = that.options, tools = that.tools, columnModel = that.columnModel, width, cols = []
        
        that.$tableH.append(that.$thead)
        
        that.init_thead    = true
        that.$trsH         = that.$thead.find('> tr')
        that.table_width   = 0
        that.$colgroupH    = that.$tableH.find('> colgroup')
        that.fixtedColumnWidthCount = 0
        
        $.each(that.columnModel, function(i, n) {
            var lockWidth = ''
            
            if (n === that.checkboxColumn || n === that.childColumn || n === that.editBtnsColumn || n.finalWidth)
                lockWidth = ' class="datagrid_col_lockwidth"'
            
            width = n.width
            
            if ((!width || width === 'auto') && !that.hasAutoCol) {
                that.hasAutoCol = true
            }
            
            cols.push('<col style="width:'+ (width && width !== 'auto' ? width +'px' : 'auto') +'"'+ lockWidth +'>')
            n.width = width
        })
        
        that.table_width = that.$grid.width()
        
        that.$colgroupH.html(cols.join(''))
        
        // thead - events
        var $ths = that.$trsH.find('> th')
        // events - quicksort
        $ths.filter('.datagrid-quicksort-th')
            .on('click.bjui.datagrid.quicksort', function(e) {
                var $target = $(e.target)
                
                if (!$target.closest('.'+ that.classnames.th_cell).length && !that.isResize)
                    tools.quickSort(columnModel[$(this).data('index')])
            })
        
        // events - filter
        $ths.filter('.datagrid-column-menu')
            .on('filter.bjui.datagrid.th', function(e, flag) {
                var $th = $(this), $btn = $th.find('> div > .'+ that.classnames.th_cell +'> .'+ that.classnames.btn_menu +'> .btn')
                
                if (flag) {
                    $th.addClass('filter-active')
                    $btn.find('> i').attr('class', 'fa fa-filter')
                } else {
                    $th.removeClass('filter-active')
                    $btn.find('> i').attr('class', 'fa fa-bars')
                }
            })
        
        // events - contextmenu
        if (options.contextMenuH) {
            tools.contextmenuH()
        }
        
        that.initTbody()
        
        if (options.columnResize) that.colResize()
        if (options.columnMenu)   that.colMenu()
        if (options.paging)       that.initPaging()
        if (options.editMode)     that.edit()
        
        var delayFunc = function() {
            if (options.showTfoot) that.initTfoot()
            
            /* render */
            if (that.renderTds && that.renderTds.length) {
                var $trs = that.$tbody.find('> tr:not(.'+ that.classnames.tr_child +', .datagrid-nodata)'), j = that.renderTds && that.renderTds.length, fixedWidthModel = {}
                var $tempTrs = $(), tempDatas = []
                
                for (var i = 0; i < j; i++) {
                    var obj = that.renderTds[i], label = obj.render.call(that, obj.label, obj.data, that.columnModel[obj.tdindex].items)
                    var tempData = $.extend({}, obj.data)
                    
                    if (!fixedWidthModel[obj.tdindex] && that.columnModel[obj.tdindex].fixedWidth)
                        fixedWidthModel[obj.tdindex] = that.columnModel[obj.tdindex]
                    
                    if (that.isTemplate) {
                        var tempData = {}, tempIndex = $.inArray($trs.eq(obj.trindex)[0], $tempTrs)
                        
                        if (tempIndex == -1) {
                            $tempTrs = $tempTrs.add($trs.eq(obj.trindex))
                            
                            tempData = $.extend({}, obj.data)
                            tempData[that.columnModel[obj.tdindex]['name']] = label
                            
                            tempDatas.push(tempData)
                        } else {
                            tempDatas[tempIndex][that.columnModel[obj.tdindex]['name']] = label
                        }
                    } else {
                        $trs.eq(obj.trindex).find('> td:eq('+ obj.tdindex +') > div:last').html(label)
                    }
                }
                
                // for tdTemplate
                $.each($tempTrs, function(i) {
                    var $td = $(this).find('> td.datagrid-template-td'), html = $td.html()
                    
                    if ($td.length) {
                        $td.html(tools.replacePlh4Template(html, tempDatas[i]))
                    }
                })
            }
            
            if (that.isTemplate)
                that.$grid.data('bjui.datagrid.trs.template', that.$tbody.html())
            else
                that.$grid.data('bjui.datagrid.trs.normal', that.$tbody.html())
            
            that.initEvents()
            that.$tableB.initui()
            that.$lockTableB && that.$lockTableB.initui()
            
            tools.setBoxbH()
            
            /* tree - collapse */
            if (that.collapseIndex && that.collapseIndex.length) {
                that.expand(that.collapseIndex.join(','), false)
                that.collapseIndex = null
            }
            
            setTimeout(function() {
                that.fixedWidth('init')
                that.initLock()
                that.$element.trigger('completed.bjui.datagrid', {datas:that.data})
                that.$boxM && that.$boxM.trigger('bjui.ajaxStop').hide()
                
                if (that.options.width.endsWith('%') && 
                    (that.options.flowLayoutWidth && that.$grid.width() < that.options.flowLayoutWidth)
                        || that.options.dialogFilterW && that.$grid.width() < that.options.dialogFilterW) {
                    $(window).resize()
                }
                
                that.resizeGrid()
            }, 50)
            
            that.delayFilterTimeout && clearInterval(that.delayFilterTimeout)
        }
        
        if (options.filterThead) {
            if (that.delayRender) {
                that.delayFilterTimeout = setInterval(function() {
                    if (!that.delayRender) {
                        that.filterInThead()
                        delayFunc()
                    }
                }, 100)
            } else {
                that.filterInThead()
                delayFunc()
            }
        } else {
            delayFunc()
        }
    }
    
    Datagrid.prototype.fixedWidth = function(isInit) {
        var that = this, options = that.options, bW, excludeW = 0, fixedW, columnModel = that.columnModel, length = columnModel.length
        
        if (isInit && that.initFixedW) return
        that.initFixedW = true
        
        var setNewWidth = function() {
            if (String(that.options.width).endsWith('%'))
                that.$grid.css('width', '')
            
            that.$boxH.find('> div').css('width', '')
            that.$boxB.find('> div').css('width', '')
            that.$boxF && that.$boxF.find('> div').css('width', '')
            that.$boxP && that.$boxP.find('> div.paging-content').css('width', '')
            
            bW = (that.$boxB.find('> div'))[0].clientWidth
            
            if (that.options.hasChild) {
                var scrollTop = that.$boxB.scrollTop()
                
                that.$boxB.scrollTop(1)
                
                if (that.$boxB.scrollTop()) {
                    that.$boxB.scrollTop(scrollTop)
                }
            }
            if (that.$element.hasClass('table-child'))
                bW = bW - 18
            
            that.$boxB.find('> div').width(bW)
            that.$boxH.find('> div').width(bW)
            that.$boxF && that.$boxF.find('> div').width(bW)
            
            if (that.table_width > bW || options.fullGrid)
                that.$boxP && that.$boxP.find('> div.paging-content').width(bW)
            else
                that.$boxP && that.$boxP.find('> div.paging-content').width(that.table_width)
            
            if (options.fullGrid || that.isTemplate || that.needfixedWidth || (that.hasAutoCol && isInit)) {
                $('body').find('> .bjui-datagrid').remove()
                
                var oldTheight = that.$tableH.height(),
                    $grid = $('<div class="bjui-datagrid forwidth"></div>'),
                    $tableB = that.$element.clone().addClass('table table-bordered').appendTo($grid)
                
                $tableB.find('> tbody').before(that.$thead.clone())
                
                $tableB.find('> colgroup > col').each(function(i) {
                    var $col = $(this)
                    
                    if ($col.hasClass('datagrid_col_lockwidth')) return true
                    if (columnModel[i] === that.linenumberColumn) {
                        $col.width(String(that.data[that.data.length - 1].gridNumber).length * 15)
                    } else if (!columnModel[i].width || columnModel[i].width === 'auto')
                        $col.width('')
                })
                
                $grid.width(bW + 17).height(that.$boxB.height()).prependTo($('body'))
                
                if (!(options.fullGrid || that.isTemplate) && options.hScrollbar) {
                    $grid.width('')
                }
                
                $tableB.attr('style', 'width:'+ (options.tableWidth || 'auto') +' !important;')
                $tableB.find('thead th > div').height('')
                
                var $tr = $tableB.find('> tbody > tr:first')
                
                if (!$tr.length || that.isTemplate || $tr.hasClass('datagrid-nodata')) {
                    var trHtml = BJUI.StrBuilder()
                    
                    trHtml.add('<tr>')
                    
                    for (var i = 0, j = $tableB.find('colgroup > col').length; i < j; i++) {
                        trHtml.add('<td></td>')
                    }
                    
                    trHtml.add('</tr>')
                    
                    $tableB.find('> tbody').prepend(trHtml.toString())
                    $tr = $tableB.find('> tbody > tr:first')
                }
                
                var $ths = that.$thead.find('th')
                
                $tableB.find('thead > tr:not(.datagrid-filter) > th').each(function(i) {
                    var $this = $(this), v = $this.is(':hidden')
                    
                    if (v) $this.show()
                    $ths.eq(i).find('> div').height($this.find('> div').height())
                    if (v) $this.hide()
                })
                
                that.$boxB.height(that.$boxB.height() + (oldTheight - $tableB.find('> thead').height()))
                that.$boxM && that.$boxM.height(that.$boxB.height()).css('top', that.$boxB.position().top)
                that.$lockB && that.$lockB.height(that.$boxB.height())
                
                $tr.find('> td').each(function(i) {
                    var $col = that.$colgroupB.find('> col:eq('+ i +')')
                    
                    !($col.hasClass('datagrid_col_lockwidth')) && $col.width($(this).outerWidth())
                })
                
                that.$colgroupH.html(that.$colgroupB.html())
                
                if (!that.options.noremove)
                    $grid.remove()
            }
        }
        
        setNewWidth()
    }
    
    Datagrid.prototype.fixedHeight = function(height) {
        var that = this, options = that.options
        
        if (options.height === 'auto') {
            that.boxH = 'auto'
            that.$grid.css('height', '')
            that.$boxB.css('height', '')
            that.tools.setBoxbH()
        } else
            that.tools.setBoxbH(height)
        
        // if scrollLeft
        var scrollLeft = that.$boxB.scrollLeft()
        
        that.$boxB.scrollLeft(5)
        
        if (that.$boxB.scrollLeft()) {
            that.fixedWidth()
            that.$boxB.scrollLeft(scrollLeft)
        }
    }
    
    Datagrid.prototype.initTbody = function() {
        var that = this, options = that.options, tools = that.tools, $trs = that.$tbody.find('> tr'), $tds = $trs.find('> td'), width = options.tableWidth || '0'
        
        that.init_tbody = true
        that.$colgroupB = that.$colgroupH.clone()
        
        //!options.tdTemplate && (that.$tableB.prepend(that.$colgroupB))
        that.$tableB.prepend(that.$colgroupB)
        
        if (options.fullGrid || that.isTemplate) width = '100%'
        
        that.$tableH.css('width', width)
        that.$tableB.css('width', width)
        
        // add class
        that.$tableB.removeAttr('data-toggle width').addClass('table table-bordered').removeClass('table-hover')
        
        that.$boxB
            .scroll(function() {
                that.$boxH.find('> div').prop('scrollLeft', this.scrollLeft)
                that.$boxF && that.$boxF.find('> div').prop('scrollLeft', this.scrollLeft)
                that.$lockB && that.$lockB.prop('scrollTop', this.scrollTop)
            })
        
        // if DOM to datagrid
        if (that.isDom) {
            if (options.showLinenumber) {
                that.showLinenumber(options.showLinenumber)
            }
            if (options.showCheckboxcol) {
                that.showCheckboxcol(options.showCheckboxcol)
            }
            if (options.showEditbtnscol) {
                that.showEditCol(options.showEditbtnscol)
            }
            
            that.$grid.data(that.datanames.tbody, that.$tbody.clone())
        }
    }
    
    // init events(only tbody)
    Datagrid.prototype.initEvents = function($trs) {
        var that = this, options = that.options, trs = that.$tbody.find('> tr')
        
        if (!$trs) $trs = trs
        
        $trs.on('click.bjui.datagrid.tr', function(e, checkbox) {
            var $tr = $(this), index = $tr.index(), data, $selectedTrs = that.$tbody.find('> tr.'+ that.classnames.tr_selected), $last = that.$lastSelect, checked, $lockTrs = that.$lockTbody && that.$lockTbody.find('> tr')
            
            if (checkbox) {
                checked = checkbox.is(':checked')
                if (!checked) that.$lastSelect = $tr
                that.selectedRows($tr, !checked)
            } else {
                if ($tr.hasClass(that.classnames.tr_edit)) return
                if (options.selectMult) {
                    that.selectedRows($tr)
                } else {
                    if (!BJUI.KeyPressed.ctrl && !BJUI.KeyPressed.shift) {
                        if ($selectedTrs.length > 1 && $tr.hasClass(that.classnames.tr_selected)) {
                            that.selectedRows($selectedTrs.not($tr))
                            that.$lastSelect = $tr
                        } else {
                            if ($selectedTrs.length && $selectedTrs[0] != this) that.selectedRows(null)
                            if (!$tr.hasClass(that.classnames.tr_selected)) that.$lastSelect = $tr
                            that.selectedRows($tr)
                        }
                    } else {
                        //window.getSelection ? window.getSelection().removeAllRanges() : document.selection.empty() //clear selection
                        
                        if (BJUI.KeyPressed.ctrl) {
                            if (!$tr.hasClass(that.classnames.tr_selected)) that.$lastSelect = $tr
                            that.selectedRows($tr)
                        } else if (BJUI.KeyPressed.shift) {
                            if (!$last) $last = that.$lastSelect = $tr
                            if ($last.length) {
                                that.selectedRows(null)
                                if ($last.index() != index) {
                                    if ($last.index() > index) {
                                        that.selectedRows($tr.nextUntil($last).add($tr).add($last), true)
                                    } else {
                                        that.selectedRows($tr.prevUntil($last).add($tr).add($last), true)
                                    }
                                } else {
                                    that.selectedRows(index)
                                }
                            }
                        }
                    }
                }
            }
            
            if (that.isDom)
                data = that.tools.setDomData($tr)
            else
                data = that.data[that.tools.getNoChildDataIndex(index)]
            
            that.$element.trigger('clicked.bjui.datagrid.tr', {target:e.target, tr:$tr, data:data})
        })
        .on('mouseenter.bjui.datagrid', function(e) {
            var $tr = $(this), index = $tr.index()
            
            if (that.isDrag) return false
            
            $tr.addClass('datagrid-hover')
            that.$lockTbody && that.$lockTbody.find('> tr:eq('+ index +')').addClass('datagrid-hover')
        })
        .on('mouseleave.bjui.datagrid', function(e) {
            var $tr = $(this), index = $tr.index()
            
            if (that.isDrag) return false
            
            $tr.removeClass('datagrid-hover')
            that.$lockTbody && that.$lockTbody.find('> tr:eq('+ index +')').removeClass('datagrid-hover')
        })
        // custom event - delete 
        .on('delete.bjui.datagrid.tr', function(e) {
            e.stopPropagation()
            
            var $tr = $(this), tr_index = $tr.index(), data_index = tr_index, data = that.data, gridIndex, allData = that.allData, $lockTrs = that.$lockTbody && that.$lockTbody.find('> tr')
            
            if ($tr.hasClass('datagrid-nodata')) return false
            
            if (that.options.hasChild && that.options.childOptions) {
                data_index = data_index / 2
                
                // remove child dom
                $tr.next().remove()
                $lockTrs && $lockTrs.eq(tr_index).next().remove()
            }
            
            /* remove tree - child */
            if (that.options.isTree) {
                var $childrens = that.getChildrens($tr, null, true), len = $childrens.length
                
                if (that.options.hasChild && that.options.childOptions)
                    len = len / 2
                
                $childrens.remove()
                
                if (!that.isDom) {
                    gridIndex    = data[data_index].gridIndex
                    
                    that.data.splice(data_index + 1, len)
                    that.allData.splice(gridIndex + 1, len)
                }
            }
            
            if (!that.isDom) {
                gridIndex    = data[data_index].gridIndex
                that.data    = data.remove(data_index)     // remove data in the current page data
                that.allData = allData.remove(gridIndex)   // remove data in allData
                
                that.tools.updateGridIndex()
            }
            
            /* update gridNumber */
            if ($.inArray(that.linenumberColumn, that.columnModel) != -1) {
                $tr.nextAll(':not(.'+ that.classnames.tr_child +')').each(function() {
                    var $td = $(this).find('> td.'+ that.classnames.td_linenumber), num = parseInt($td.text(), 10)
                    
                    $td.text(num - 1)
                })
                
                $lockTrs && $lockTrs.eq(tr_index).trigger('delete.bjui.datagrid.tr', [tr_index])
            }
            
            // remove dom
            $tr.remove()
            $lockTrs && $lockTrs.eq(tr_index).remove()
            
            // no data
            that.tools.createNoDataTr()
        })
        
        // child
        that.$grid.off('click.bjui.datagrid.tr.child').on('click.bjui.datagrid.tr.child', 'td.'+ that.classnames.td_child, function(e) {
            e.stopPropagation()
            
            var $this = $(this), $tr = $this.closest('tr'), $child = $tr.next('.'+ that.classnames.tr_child)
            
            if ($child && $child.length)
                that.showChild($tr, !$child.is(':visible'))
        })
        // td checkbox
        .off('ifClicked').on('ifClicked', 'td.'+ that.classnames.td_checkbox +' input', function(e) {
            e.stopPropagation()
            
            var $this = $(this), $tr = $this.closest('tr'), tr_index = $tr.index()
            
            that.$tbody.find('> tr:eq('+ tr_index +')').trigger('click.bjui.datagrid.tr', [$this])
        })
        // th checkbox - check all
        .off('ifChanged').on('ifChanged', 'th.'+ that.classnames.td_checkbox +' input', function(e) {
            e.stopPropagation()
            
            var checked = $(this).is(':checked'), $trs = that.$tbody.find('> tr:not(".'+ that.classnames.tr_child +'")')
            
            that.selectedRows($trs, checked)
        })
        
        
        //contextmenu
        if (options.contextMenuB) {
            $trs.each(function() {
                that.tools.contextmenuB($(this))
            })
        }
        
        // custom update
        that.$tableB.off('click.bjui.datagrid.refresh').on('click.bjui.datagrid.refresh', 'tbody > tr > td [data-toggle="update.datagrid.tr"]', function(e) {
            e.stopPropagation()
            e.preventDefault()
            
            that.updateRow($(this).closest('tr'))
        })
        // custom edit
        .off('click.bjui.datagrid.edit').on('click.bjui.datagrid.edit', 'tbody > tr > td [data-toggle="edit.datagrid.tr"]', function(e) {
            e.stopPropagation()
            e.preventDefault()
            
            var $this = $(this), opts = $this.data('options'), $tr = $this.closest('tr')
            
            if (opts && typeof opts === 'string') opts = opts.toObj()
            
            if (typeof opts === 'object')
                that.externalEdit($tr, opts)
            else
                that.doEditRow($tr)
        })
        // custom ajax
        .off('click.bjui.datagrid.ajax').on('click.bjui.datagrid.ajax', 'tbody > tr > td [data-toggle="ajax.datagrid.tr"]', function(e) {
            e.stopPropagation()
            e.preventDefault()
            
            var $this = $(this), opts = $this.data()
            
            if (opts.options && typeof opts.options === 'string') opts.options = opts.options.toObj()
            $.extend(opts, typeof opts.options === 'object' && opts.options)
            
            if (!opts.url && $this.attr('href'))
                opts.url = $this.attr('href')
            
            that.doAjaxRow($this.closest('tr'), opts)
        })
        // custom addChild
        .off('click.bjui.datagrid.addchild').on('click.bjui.datagrid.addchild', 'tbody > tr > td [data-toggle="addchild.datagrid.tr"]', function(e) {
            e.stopPropagation()
            e.preventDefault()
            
            var $this = $(this), $tr = $this.closest('tr'), $table = $tr.data('bjui.datagrid.child'), $child = $tr.next('.'+ that.classnames.tr_child), trData, data = $this.data('addData'), addData,
                replaceData = function(data) {
                    return data.replace(/#\/?[^#]*#/g, function($1) {
                        var key = $1.replace(/[##]+/g, ''), val = trData[key]
                        
                        if (typeof val === 'undefined' || val === 'null' || val === null)
                            val = ''
                        
                        return val
                    })
                },
                doAdd = function($table) {
                    if (data) {
                        if (typeof data === 'string') {
                            data = replaceData(data)
                            
                            if (data.trim().startsWith('{'))
                                data = data.toObj()
                            else
                                data = data.toFunc()
                        } else {
                            if (typeof data === 'function') {
                                data = data.toFunc()
                            }
                            if (typeof data === 'object') {
                                data = JSON.stringify(data)
                            }
                            
                            data = replaceData(data).toObj()
                        } 
                        
                        if (typeof data === 'object') {
                            addData = data
                        }
                    }
                    
                    $table.datagrid('add', false, addData)
                }
            
            if ($child && $child.length) {
                if (that.isDom) trData = $tr.data('initData') || tools.setDomData($tr)
                else trData = that.data[that.tools.getNoChildDataIndex($tr.index())]
                
                if ($table && $table.length) {
                    doAdd($table)
                } else {
                    that.showChild($tr, true, doAdd)
                }
            }
        })
        // custom delete
        .off('click.bjui.datagrid.del').on('click.bjui.datagrid.del', 'tbody > tr > td [data-toggle="del.datagrid.tr"]', function(e) {
            e.stopPropagation()
            e.preventDefault()
            
            that.delRows($(this).closest('tr'))
        })
        // tree expand || collapse
        .off('click.bjui.datagrid.tree').on('click.bjui.datagrid.tree', 'tbody > tr > td .datagrid-tree-switch', function(e) {
            e.stopPropagation()
            e.preventDefault()
            
            var $t = $(this), $tr = $t.closest('tr'), childLen = $tr.data('child'), level = $tr.data('level'), isExpand = !$t.hasClass('collapsed')
            
            if (childLen) {
                $tr.data('isExpand', !isExpand)
                    .nextAll('.datagrid-tree-level-'+ (level + 1)).slice(0, childLen).toggleClass('collapsed', isExpand).trigger('switch.child.bjui.datagrid.tree', {isExpand:isExpand})
                $t.toggleClass('collapsed', isExpand).find('> i').attr('class', 'fa '+ (isExpand ? 'fa-plus-square-o' : 'fa-minus-square-o'))
            }
            
            if (options.height === 'auto') {
                that.fixedHeight()
            }
        })
        .off('switch.child.bjui.datagrid.tree').on('switch.child.bjui.datagrid.tree', 'tbody > tr', function(e, data) {
            e.stopPropagation()
            e.preventDefault()
            
            var $tr = $(this), childLen = $tr.data('child'), level = $tr.data('level')
            
            if (childLen) {
                $tr.nextAll('.datagrid-tree-level-'+ (level + 1)).slice(0, childLen)
                    .toggleClass('collapsed-child', data[that.options.treeOptions.isExpand])
                    .trigger('switch.child.bjui.datagrid.tree', {isExpand:data[that.options.treeOptions.isExpand]})
            }
        })
        .off('expand.bjui.datagrid.tree').on('expand.bjui.datagrid.tree', 'tbody > tr', function(e) {
            e.stopPropagation()
            e.preventDefault()
            
            var $tr = $(this).data('isExpand', true), $t = $tr.find('> td.datagrid-tree-td .datagrid-tree-switch')
            
            if (!$t || !$t.length || !$t.hasClass('collapsed')) return false
            
            $t.trigger('click.bjui.datagrid.tree')
            
            if (options.height === 'auto') {
                that.fixedHeight()
            }
        })
        .off('collapse.bjui.datagrid.tree').on('collapse.bjui.datagrid.tree', 'tbody > tr', function(e) {
            e.stopPropagation()
            e.preventDefault()
            
            var $tr = $(this).data('isExpand', false), $t = $tr.find('> td.datagrid-tree-td .datagrid-tree-switch')
            
            if (!$t || !$t.length || $t.hasClass('collapsed')) return false
            
            $t.trigger('click.bjui.datagrid.tree')
            
            if (options.height === 'auto') {
                that.fixedHeight()
            }
        })
        // tree add btn
        .off('mouseover.bjui.datagrid.tree').on('mouseover.bjui.datagrid.tree', 'tbody > tr > td.datagrid-tree-td', function(e) {
            e.stopPropagation()
            e.preventDefault()
            
            if (!options.treeOptions.add || that.isDrag)
                return false
            
            var $td = $(this), $tr = $td.closest('tr'), $add = $td.find('.datagrid-tree-add')
            
            if (!$add || !$add.length)
                $td.find('> div').append('<a href="javascript:;" class="datagrid-tree-add" data-toggle="add.datagrid.tree" title="添加"><i class="fa fa-plus-circle"></i></a>')
            else
                $add.show()
        })
        .off('mouseout.bjui.datagrid.tree').on('mouseout.bjui.datagrid.tree', 'tbody > tr > td.datagrid-tree-td', function(e) {
            e.stopPropagation()
            e.preventDefault()
            
            if (!options.treeOptions.add || that.isDrag)
                return false
            
            var $td = $(this), $add = $td.find('.datagrid-tree-add')
            
            if ($add && $add.length)
                $add.hide()
        })
        // tree add
        .off('click.bjui.datagrid.tree.add').on('click.bjui.datagrid.tree.add', 'tbody > tr > td.datagrid-tree-td [data-toggle="add.datagrid.tree"]', function(e) {
            e.stopPropagation()
            e.preventDefault()
            
            var $add = $(this), $tr = $add.closest('tr'), opts = $add.data()
            
            if (opts.addData) {
                if (typeof opts.addData === 'string')
                    opts.addData = opts.addData.toObj()
            }
            
            that.addTree($tr, opts.addLocation || '', opts.addData || {})
        })
        
        if (options.dropOptions.drop) {
            var $trs = that.$tbody.find('> tr:not(.'+ that.classnames.tr_child +')'), beforeDrag = options.dropOptions.beforeDrag
            
            if (typeof beforeDrag === 'string')
                beforeDrag = beforeDrag.toFunc()
            
            if (typeof beforeDrag !== 'function')
                beforeDrag = false
            
            $trs
                .basedrag('destroy')
                .basedrag({
                    exclude: 'input, button, a, .bjui-lookup, .datagrid-tree-switch, .datagrid-tree-add, .datagrid-child-td',
                    drop: $trs,
                    container : that.$boxB,
                    beforeDrag: beforeDrag,
                    treeData: that.data,
                    drag: function() {
                        that.isDrag = true
                    },
                    stop: function() {
                        that.isDrag = false
                        
                        $(this).find('> td.datagrid-tree-td').trigger('mouseout.bjui.datagrid.tree')
                    }
                })
                .off('dropover.bjui.basedrag').on('dropover.bjui.basedrag', function(e, x, y, target) {
                    trs.removeClass('datagrid-hover datagrid-drop-over-after datagrid-drop-over-before').find('.datagrid-tree-box').removeClass('datagrid-drop-over-append')
                    
                    if (this === target[0] || target.hasClass(that.classnames.tr_edit)) {
                        return false
                    }
                    if (that.options.isTree) {
                        var $childrens = that.getChildrens(target)
                        
                        if ($.inArray(this, $childrens) !== -1)
                            return false
                    }
                    
                    var $this = $(this).addClass('datagrid-hover'), height = $this.outerHeight() / 2, top = $this.offset().top
                    
                    if (that.options.isTree)
                        height = 5
                    
                    if (y < (top + height)) {
                        $this.addClass('datagrid-drop-over-before').prevAll(':visible:first').addClass('datagrid-drop-over-after')
                    } else {
                        if (!that.options.isTree || (that.options.isTree && y > (top + $this.outerHeight() - height)))
                            $this.addClass('datagrid-drop-over-after')
                        else if (that.options.isTree) {
                            $this.find('.datagrid-tree-box').addClass('datagrid-drop-over-append')
                        }
                    }
                })
                .off('dropout.bjui.basedrag').on('dropout.bjui.basedrag', function(e, data) {
                    $trs.removeClass('datagrid-hover datagrid-drop-over-after datagrid-drop-over-before')
                    $trs.find('div.datagrid-drop-over-append').removeClass('datagrid-drop-over-append')
                })
                .off('drop.bjui.basedrag').on('drop.bjui.basedrag', function(e, target) {
                    var $this = $(this), position, beforeDrop = options.dropOptions.beforeDrop, afterDrop = options.dropOptions.afterDrop
                    
                    that.afterDrop = false
                    
                    if ($this.hasClass('datagrid-drop-over-before'))
                        position = 'top'
                    else if ($this.hasClass('datagrid-drop-over-after'))
                        position = 'bottom'
                    else if (that.options.isTree && $this.find('.datagrid-tree-box').hasClass('datagrid-drop-over-append'))
                        position = 'append'
                    
                    if (position) {
                        if (position != 'append')
                            that.insertTr(target, $this, position)
                        else {
                            var $parents = that.getParents(target, null, true)
                            
                            if ($.inArray(this, $parents) !== -1) {
                                $this.find('.datagrid-tree-box').removeClass('datagrid-drop-over-append')
                                
                                return false
                            }
                            
                            that.appendTr(target, $this)
                        }
                    }
                    
                    $trs.removeClass('datagrid-drop-over-after datagrid-drop-over-before').find('.datagrid-tree-box').removeClass('datagrid-drop-over-append')
                    
                    if (afterDrop && that.afterDrop) {
                        if (typeof afterDrop === 'function') {
                            afterDrop.apply(that, [target, $this])
                        } else if (options.dropOptions.dropUrl) {
                            var postData = {pageSize:that.paging.pageSize, pageCurrent:that.paging.pageCurrent}, type = options.editType, opts = {url:options.dropOptions.dropUrl, type:'POST', reload:false}
                            
                            postData['list'] = []
                            
                            $.each(that.data, function(i, data) {
                                var _data = $.extend({}, data)
                                
                                if (options.dropOptions.scope !== 'drop' || data[options.keys.dropFlag]) {
                                    for (var key in options.keys)
                                        delete _data[options.keys[key]]
                                }
                                if (options.dropOptions.scope === 'drop') {
                                    if (data[options.keys.dropFlag]) {
                                        postData['list'].push(_data)
                                    }
                                } else {
                                    postData['list'].push(_data)
                                }
                            })
                            
                            if (postData) {
                                postData = JSON.stringify(options.dropOptions.paging && options.paging ? postData : postData['list'])
                                
                                if (type && type === 'raw') {
                                    opts.data = postData
                                    opts.contentType = 'application/json'
                                } else {
                                    opts.data = {json:postData}
                                    type && (opts.type = type)
                                }
                                
                                BJUI.ajax('doajax', opts)
                            }
                        }
                    }
                })
        }
    }
    
    Datagrid.prototype.getChildrens = function(tr, childrens, hasChild, maxLevel) {
        var that = this, childLen = tr.data('child'), level = tr.data('level')
        
        if (maxLevel) maxLevel --
        if (!childrens) childrens = $()
        if (childLen) {
            tr.nextAll('.datagrid-tree-level-'+ (level + 1)).slice(0, childLen).each(function() {
                childrens = childrens.add(this)
                
                if (hasChild && $(this).next().hasClass(that.classnames.tr_child))
                    childrens = childrens.add($(this).next())
                
                if (maxLevel)
                    childrens = childrens.add(that.getChildrens($(this), childrens, hasChild, maxLevel))
            })
        }
        
        return childrens
    }
    
    Datagrid.prototype.getParents = function(tr, parents, onlyParent, hasChild) {
        var that = this, level = tr.data('level'), prev
        
        if (!parents) parents = $()
        if (level) {
            prev = tr.prevAll('.datagrid-tree-level-'+ (level - 1) +':first')
            if (prev.length) {
                parents = parents.add(prev)
                
                if (hasChild && prev.next().hasClass(that.classnames.tr_child))
                    parents = parents.add(prev.next())
                
                if (!onlyParent)
                    parents = parents.add(that.getParents(prev, parents, hasChild))
            }
        }
        
        return parents
    }
    
    // only for tree
    Datagrid.prototype.appendTr = function(sTr, dTr, option) {
        if (!this.options.isTree)
            return
        
        var that = this, options = that.options, sData, dData, sIndex = that.tools.getNoChildDataIndex(sTr.index()), dIndex = that.tools.getNoChildDataIndex(dTr.index()), hasChild = sTr.next().hasClass(that.classnames.tr_child),
            keys = options.treeOptions.keys,
            sParent, sParentData, sLevel = sTr.data('level'), dLevel = (dTr.data('level') + 1) || 0, dChildLen = dTr.data('child') + 1,
            dParent, dTd = dTr.find('> td.datagrid-tree-td'), moveIndex, len,
            _lastDTr
        var beforeDrop = options.dropOptions.beforeDrop
        
        if (hasChild) {
            sTr = sTr.add(sTr.next())
            dTr = dTr.add(dTr.next())
        }
        
        sData = that.data[sIndex]
        dData = that.data[dIndex]
        /* beforeDrop */
        if (beforeDrop && typeof beforeDrop === 'string')
            beforeDrop = beforeDrop.toFunc()
        if (beforeDrop && typeof beforeDrop === 'function') {
            if (!beforeDrop.apply(this, [sData, dData, 'append'])) {
                return
            }
        }
        
        sParent = that.getParents(sTr, null, true)
        if (sParent.length) {
            sParentData = that.data[that.tools.getNoChildDataIndex(sParent.index())]
            
            sParentData[keys.childLen] = sParentData[keys.childLen] - 1
            sParent.data('child', sParentData[keys.childLen]).attr('data-child', sParentData[keys.childLen])
            
            if (!sParentData[keys.childLen]) {
                delete sParentData[keys.isParent]
                delete sParentData[keys.isExpand]
                
                var sParentTd = sParent.find('> td.datagrid-tree-td')
                
                sParentTd.html(that.tools.createTreePlaceholder(sParentData, sParentTd.find('.datagrid-tree-title').html()), sParent.data('isExpand'))
            }
        }
        
        if (dTr.length) {
            dTr   = that.getChildrens(dTr, dTr, true)
            _lastDTr = that.getChildrens(dTr.last(), dTr.last(), true, true).last()
            //dData = that.data[dIndex]
            that.expand(dTr.first(), true)
            
            dData[keys.isParent] = true
            dData[keys.childLen] = dChildLen
            
            dTr.first().data('child', dChildLen).attr('data-child', dChildLen)
            dTd.html(that.tools.createTreePlaceholder(dData, dTd.find('.datagrid-tree-title').html(), dTr.first().data('isExpand')))
        }
        
        sTr = that.getChildrens(sTr, sTr, true)
        sTr.filter(':not(.'+ that.classnames.tr_child +')').each(function() {
            var $tr = $(this), level = $tr.data('level'), newLevel = level + (dLevel - sLevel), $td = $tr.find('> td.datagrid-tree-td'), label = $td.find('.datagrid-tree-title').html(),
                trIndex = $tr.index(), trData = that.data[that.tools.getNoChildDataIndex(trIndex)]
            
            if (option && option.isUp) {
                newLevel = dData[keys.level]
            }
            trData[keys.level] = newLevel
            
            $tr.removeClass('datagrid-tree-level-'+ level).addClass('datagrid-tree-level-'+ newLevel)
                .data('level', newLevel).attr('data-level', newLevel)
            
            $td.html(that.tools.createTreePlaceholder(trData, label, $tr.data('isExpand')))
        })
        
        if (option && option.dIndex)
            moveIndex = option.dIndex
        else {
            moveIndex = dTr.last().index() + 1
            if (hasChild)
                moveIndex = moveIndex / 2
        }
        
        //sData = that.data[sIndex]
        len   = (hasChild ? sTr.length / 2 : sTr.length)
        
        that.data.moveItems(sIndex, moveIndex, len)
        that.allData.moveItems(sData.gridIndex, (sData.gridIndex + (moveIndex - sIndex)), len)
        
        that.tools.updateGridIndex()
        
        if (option && option._dTr) {
            dParent = that.getParents(option._dTr, null, true, false)
            if (option.isBefore)
                sTr.insertBefore(option._dTr)
            else if (option.isUp) {
                sTr.insertAfter(_lastDTr)
            } else {
                sTr.insertAfter(option._dTr)
            }
        } else {
            sTr.insertAfter(_lastDTr)
        }
        
        // update the source seq
        if (sParent) {
            var _childs = that.getChildrens(sParent, null, false)
            
            _childs.each(function(i) {
                var _trData = that.data[that.tools.getNoChildDataIndex($(this).index())]
                
                if (_trData) {
                    _trData[keys.order] = i
                    _trData[options.keys.dropFlag] = true
                }
            })
        }
        
        // update this seq and parentid
        if (!dParent)
            dParent = dTr.first()
        
        if (dParent && dParent.length) {
            var _childs = that.getChildrens(dParent, null, false), dParentData = that.data[that.tools.getNoChildDataIndex(dParent.index())]
            
            sData[keys.parentKey] = dParentData[keys.key]
            
            _childs.each(function(i) {
                var _trData = that.data[that.tools.getNoChildDataIndex($(this).index())]
                
                if (_trData) {
                    _trData[keys.order] = i
                    _trData[options.keys.dropFlag] = true
                }
            })
        } else {
            var _trs = sTr.siblings('.datagrid-tree-level-'+ sData[keys.level]).addBack()
            
            sData[keys.parentKey] = null
            
            _trs.each(function(i) {
                var _trData = that.data[that.tools.getNoChildDataIndex($(this).index())]
                
                if (_trData) {
                    _trData[keys.order] = i
                    _trData[options.keys.dropFlag] = true
                }
            })
        }
        
        that.tools.updateLinenumber()
        
        that.afterDrop = true
    }
    
    Datagrid.prototype.insertTr = function(sTr, dTr, position) {
        var that = this, point, options = that.options, keys = options.treeOptions.keys, sData, dData, moveIndex,
            sIndex = that.tools.getNoChildDataIndex(sTr.index()), dIndex = that.tools.getNoChildDataIndex(dTr.index()), hasChild = sTr.next().hasClass(that.classnames.tr_child),
            _start, _end
        var beforeDrop = options.dropOptions.beforeDrop
        var insertTr = function(sTr, dTr, point) {
            if (position === 'bottom') {
                if (hasChild)
                    dTr = dTr.next()
                sTr.insertAfter(dTr)
            } else {
                sTr.insertBefore(dTr)
            }
        }
        
        sData = that.data[sIndex]
        dData = that.data[dIndex]
        
        /* beforeDrop */
        if (beforeDrop && typeof beforeDrop === 'string')
            beforeDrop = beforeDrop.toFunc()
        if (beforeDrop && typeof beforeDrop === 'function') {
            if (!beforeDrop.apply(this, [sData, dData, position])) {
                return
            }
        }
        
        if (sIndex > dIndex) {
            point = position === 'top' ? 0 : 1
        } else {
            point = position === 'top' ? -1 : 0
        }
        
        moveIndex = dIndex + point
        
        if (moveIndex == sIndex && !options.isTree) return
        
        if (hasChild)
            sTr = sTr.add(sTr.next())
        
        if (that.isDom) {
            insertTr(sTr, dTr, point)
        } else {
            sData = that.data[sIndex]
            dData = that.data[dIndex]
            
            if (options.isTree) {
                var len, option = {}, append = false, sParent = that.getParents(sTr.first(), null, true), dParent = that.getParents(dTr, null, true)
                
                if (dData[keys.level] === sData[keys.level] && dData[keys.order] == sData[keys.order] + (position === 'bottom' ? -1 : 1)) {
                    return
                }
                
                /* to append */
                // if bottom
                if (position === 'bottom' && dData[keys.isParent]) {
                    append        = true
                    option._dTr   = dTr
                    option.dIndex = dIndex + 1
                    option.isUp   = true
                }
                // if different level or not the same parent
                else if (sTr.data('level') != dTr.data('level') || sParent[0] !== dParent[0]) {
                    append        = true
                    option._dTr   = dTr
                    option.dIndex = moveIndex
                    dTr           = dParent
                    
                    if (position === 'top')
                        option.isBefore = true
                    
                    if (sIndex < dIndex) {
                        option.dIndex ++
                    }
                }
                if (append) {
                    that.appendTr(sTr, dTr, option)
                    
                    return
                }
                
                sTr = that.getChildrens(sTr, sTr, true)
                len = (hasChild ? sTr.length / 2 : sTr.length) 
                
                that.data.moveItems(sIndex, moveIndex, len)
                that.allData.moveItems(sData.gridIndex, (dData.gridIndex + point), len)
                
                _start = (sIndex > dIndex ? dIndex : sIndex)
                _end = (sIndex > dIndex ? sIndex : dIndex) + (len - 1)
            } else {
                that.data.move(sIndex, moveIndex)
                that.allData.move(sData.gridIndex, (dData.gridIndex + point))
                
                _start = sIndex > dIndex ? dIndex : sIndex
                _end = sIndex > dIndex ? sIndex : dIndex
            }
            
            that.tools.updateGridIndex()
            
            insertTr(sTr, dTr, point)
            
            // update the seqs
            if (sParent) {
                var _childs = that.getChildrens(sParent, null, false, 1)
                
                _childs.each(function(i) {
                    var _trData = that.data[that.tools.getNoChildDataIndex($(this).index())]
                    
                    if (_trData && (_trData[options.keys.gridIndex] >= _start && _trData[options.keys.gridIndex] <= _end)) {
                        _trData[keys.order] = i
                        _trData[options.keys.dropFlag] = true
                    }
                })
            } else {
                for (var i = _start; i <= _end; i++) {
                    var _trData = that.data[i]
                    
                    _trData[options.keys.dropFlag] = true
                }
            }
            
            that.tools.updateLinenumber()
            
            that.afterDrop = true
        }
    }
    
    Datagrid.prototype.addTree = function(row, addLocation, addData) {
        var that = this, options = that.options, $tr, data, tr_index, index
        
        if (options.isTree) {
            if (!addData || typeof addData !== 'object') {
                addData = {}
            }
            
            if (row instanceof jQuery) {
                $tr = row.first()
            } else {
                $tr = that.$tbody.find('> tr:not(.'+ that.classnames.tr_child +')').eq(parseInt(row, 10))
            }
            
            if ($tr && $tr.length) {
                that.$lastSelect = $tr
                that.add(addLocation, addData)
            }
        }
    }
    
    Datagrid.prototype.expand = function(rows, expandFlag) {
        var that = this, options = that.options, $trs = that.$tbody.find('> tr:not(.'+ that.classnames.tr_child +')'), event
        
        if (typeof expandFlag === 'undefined') expandFlag = true
        
        event = (expandFlag ? 'expand' : 'collapse') +'.bjui.datagrid.tree'
        
        if (options.isTree) {
            if (rows instanceof jQuery) {
                rows.trigger(event)
            } else if (isNaN(rows)) {
                $.each(rows.split(','), function(i, n) {
                    var tr = $trs.eq(parseInt(n.trim(), 10))
                    
                    if (tr && tr.length)
                        tr.trigger(event)
                })
            } else if (!isNaN(rows)) {
                var tr = $trs.eq(rows)
                
                if (tr && tr.length)
                    tr.trigger(event)
            }
        }
    }
    
    Datagrid.prototype.initTfoot = function() {
        var that = this, options = that.options, tools = that.tools, columnModel = that.columnModel, $tr = $('<tr></tr>')
        
        that.$boxF      = $('<div class="datagrid-box-f"></div>')
        that.$colgroupF = that.$colgroupH.clone()
        that.$tableF    = that.$tableH.clone().empty()
        that.$tableF.append(that.$colgroupF)
        that.$boxF.append($('<div class="datagrid-wrap-h"></div>').append(that.$tableF))
        that.$boxF.insertAfter(that.$boxB)
        
        that.$tfoot = $('<thead></thead>')
        $.each(columnModel, function(i, n) {
            var $th = $('<th><div></div></th>')
            
            if (n.calc) {
                var calc_html = '<div><div class="datagrid-calcbox">#tit#</div>#number#</div>'
                
                if (n.calc === 'avg')
                    $th.html(calc_html.replace('#tit#', (n.calcTit || 'AVG')).replace('#number#', (n.calc_sum / n.calc_count).toFixed(n.calcDecimal || 2)))
                else if (n.calc === 'count')
                    $th.html(calc_html.replace('#tit#', (n.calcTit || 'COUNT')).replace('#number#', (n.calc_count)))
                else if (n.calc === 'sum')
                    $th.html(calc_html.replace('#tit#', (n.calcTit || 'SUM')).replace('#number#', (n.calc_sum)))
                else if (n.calc === 'max')
                    $th.html(calc_html.replace('#tit#', (n.calcTit || 'MAX')).replace('#number#', (n.calc_max)))
                else if (n.calc === 'min')
                    $th.html(calc_html.replace('#tit#', (n.calcTit || 'MIN')).replace('#number#', (n.calc_min)))
            }
            
            if (n.hidden) $th.css('display', 'none')
            
            $th.appendTo($tr)
        })
        
        that.$tfoot.append($tr).appendTo(that.$tableF)
        
        // events
        that.$tfoot.on('resizeH.bjui.datagrid.tfoot', function() {
            tools.setBoxbH(options.height)
        })
    }
    
    // selected row
    Datagrid.prototype.selectedRows = function(rows, selected) {
        var that = this, $lockTrs = that.$lockTbody && that.$lockTbody.find('> tr'), $trs = that.$tbody.find('> tr')
        var selectedTr = function(n) {
            if (typeof selected === 'undefined') selected = true
            if ($trs.eq(n).hasClass(that.classnames.tr_child)) return
            
            $trs.eq(n)
                .toggleClass(that.classnames.tr_selected, selected)
                .find('> td.'+ that.classnames.td_checkbox +' input').iCheck(selected ? 'check' : 'uncheck')
            
            $lockTrs && $lockTrs.eq(n)
                .toggleClass(that.classnames.tr_selected, selected)
                .find('> td.'+ that.classnames.td_checkbox +' input').iCheck(selected ? 'check' : 'uncheck')
        }
        
        if (rows === null) {
            $trs.removeClass(that.classnames.tr_selected)
                .find('> td.'+ that.classnames.td_checkbox +' input').iCheck('uncheck')
                
            $lockTrs && $lockTrs.removeClass(that.classnames.tr_selected)
                .find('> td.'+ that.classnames.td_checkbox +' input').iCheck('uncheck')
        } else if (typeof rows === 'object') {
            rows.each(function() {
                var $row = $(this), index = $row.index()
                
                if ($row.hasClass(that.classnames.tr_child)) return true
                
                if (typeof selected !== 'undefined') {
                    selectedTr(index)
                } else {
                    $row.toggleClass(that.classnames.tr_selected)
                        .trigger('bjui.datagrid.tr.selected')
                        .find('> td.'+ that.classnames.td_checkbox +' input').iCheck(($row.hasClass(that.classnames.tr_selected) ? 'check' : 'uncheck'))
                    
                    $lockTrs && $lockTrs.eq(index)
                        .toggleClass(that.classnames.tr_selected)
                        .trigger('bjui.datagrid.tr.selected')
                        .find('> td.'+ that.classnames.td_checkbox +' input').iCheck(($row.hasClass(that.classnames.tr_selected) ? 'check' : 'uncheck'))
                }
            })
        } else if (isNaN(rows)) {
            $.each(rows.split(','), function(i, n) {
                selectedTr(parseInt(n.trim(), 10))
            })
        } else if (!isNaN(rows)) {
            selectedTr(parseInt(rows, 10))
        }
        
        if (that.$lastSelect && !that.$lastSelect.hasClass(that.classnames.tr_selected)) {
            that.$lastSelect = null
        }
        
        // selectedTrs
        var $selectedTrs = that.$tbody.find('> tr.'+ that.classnames.tr_selected), datas = []
        
        $selectedTrs.each(function() {
            var $tr = $(this), data_index = $tr.index(), data
            
            data_index = that.tools.getNoChildDataIndex(data_index)
            
            if (that.isDom) data = $tr.data('initData') || that.tools.setDomData($tr)
            else data = that.data[data_index]
            
            datas.push(data)
        })
        
        that.$element.data('selectedTrs', $selectedTrs).data('selectedDatas', datas)
    }
    
    //lock
    Datagrid.prototype.initLock = function() {
        var that = this, columnModel = that.columnModel
        
        that.col_lock_count = 0
        $.each(that.columnModel, function(i, n) {
            if (n.initLock) that.col_lock_count ++
        })
        
        if (that.col_lock_count) that.doLock()
    }
    
    //api - colLock
    Datagrid.prototype.colLock = function(column, lockFlag) {
        var that = this, $th, index, columnModel 
        
        if (that.isTemplate)
            return
        if ($.type(column) === 'number') {
            index = parseInt(column, 10)
            if (index < 0 || index > that.columnModel.length - 1) return
            columnModel = that.columnModel[index]
            $th         = columnModel.th
        } else {
            $th         = column
            index       = $th.data('index')
            columnModel = that.columnModel[index]
        }
        
        if (columnModel === that.editBtnsColumn) return // edit btn column
        else if (columnModel.index === that.columnModel.length - 1) return // last column
        if (typeof columnModel.locked === 'undefined') columnModel.locked = false
        if (columnModel.locked === lockFlag) return
        
        columnModel.initLock = lockFlag
        
        if (lockFlag) {
            that.col_lock_count ++
        } else {
            that.col_lock_count --
        }
        if (that.col_lock_count < 0) that.col_lock_count = 0
        
        that.doLock()
    }
    
    Datagrid.prototype.fixedLockItem = function(type) {
        var that = this, columnModel = that.columnModel, $filterThs = that.$thead.find('> tr.datagrid-filter > th'), $lockTrs = that.$lockTbody && that.$lockTbody.find('> tr')
        
        // out
        if (!type) {
            var fixedTh = function($th, $lockTh) {
                $lockTh.clone().insertAfter($lockTh)
                $lockTh.hide().insertAfter($th)
                $th.remove()
            }
            
            // filterThead
            if ($filterThs && $filterThs.length) {
                that.$lockThead && that.$lockThead.find('> tr.datagrid-filter > th:visible').each(function() {
                    var $lockTh = $(this), index = $lockTh.index(), $th = $filterThs.eq(index)
                    
                    fixedTh($th, $lockTh)
                })
            }
            
            //thead checkbox
            if (that.$lockThead) {
                // checkbox
                if ($.inArray(that.checkboxColumn, columnModel) != -1 && that.checkboxColumn.locked) {
                    var $lockTh = that.$lockThead.find('> tr:first > th.'+ that.classnames.td_checkbox), index = that.checkboxColumn.index, $th = that.$thead.find('> tr:first > th:eq('+ index +')')
                    
                    fixedTh($th, $lockTh)
                }
            }
            
            // inline edit && checkbox td
            if ($lockTrs && $lockTrs.length) {
                $lockTrs.each(function() {
                    var $lockTr = $(this), tr_index = $lockTr.index(), $tr, $td,
                        fixedTd = function($lockTd, tr_index, td_index) {
                            $tr = that.$tbody.find('> tr:eq('+ tr_index +')')
                            $td = $tr.find('> td:eq('+ td_index +')')
                            $lockTd.clone().insertAfter($lockTd)
                            $lockTd.hide().insertAfter($td)
                            $td.remove()
                        }
                    
                    if ($lockTr.hasClass(that.classnames.tr_edit)) {
                        var $lockTd = $lockTr.find('> td:eq('+ columnModel.lockIndex +')'), td_index = $lockTd.index()
                        
                        if ($lockTd.hasClass(that.classnames.td_edit)) {
                            fixedTd($lockTd, tr_index, td_index)
                        }
                    }
                    
                    if ($.inArray(that.checkboxColumn, columnModel) != -1 && that.checkboxColumn.locked) {
                        $lockTr.find('> td.'+ that.classnames.td_checkbox).each(function() {
                            var $lockTd = $(this), td_index = that.checkboxColumn.index
                            
                            fixedTd($lockTd, tr_index, td_index)
                        })
                    }
                })
            }
        } else { //in
            var fixedTh = function($th, $lockTh) {
                $th.clone().html('').insertAfter($th)
                $th.show().insertAfter($lockTh)
                $lockTh.remove()
            }
            
            // filterThead
            if ($filterThs && $filterThs.length) {
                that.$lockThead.find('> tr.datagrid-filter > th:visible').each(function() {
                    var $lockTh = $(this), index = $lockTh.index(), $th = $filterThs.eq(index)
                    
                    fixedTh($th, $lockTh)
                })
            }
            
            //thead checkbox
            if (that.$lockThead) {
                // checkbox
                if ($.inArray(that.checkboxColumn, columnModel) != -1 && that.checkboxColumn.locked) {
                    var $lockTh = that.$lockThead.find('> tr:first > th.'+ that.classnames.td_checkbox), index = that.checkboxColumn.index, $th = that.$thead.find('> tr:first > th:eq('+ index +')')
                    
                    fixedTh($th, $lockTh)
                }
            }
            
            // inline edit && checkbox td
            if ($lockTrs && $lockTrs.length) {
                $lockTrs.each(function() {
                    var $lockTr = $(this), tr_index = $lockTr.index(), $tr, $td,
                        fixedTd = function($lockTd, tr_index, td_index) {
                            $tr = that.$tbody.find('> tr:eq('+ tr_index +')')
                            $td = $tr.find('> td:eq('+ td_index +')')
                            $td.clone().insertAfter($td)
                            $td.show().insertAfter($lockTd)
                            $lockTd.remove()
                        }
                    
                    if ($lockTr.hasClass(that.classnames.tr_edit)) {
                        $lockTr.find('> td.'+ that.classnames.td_edit +':visible').each(function() {
                            var $lockTd = $(this), td_index = $lockTd.index(), model = columnModel[td_index]
                            
                            if (model.locked) {
                                fixedTd($lockTd, tr_index, td_index)
                            }
                        })
                    }
                    if ($.inArray(that.checkboxColumn, columnModel) != -1 && that.checkboxColumn.locked) {
                        $lockTr.find('> td.'+ that.classnames.td_checkbox).each(function() {
                            var $lockTd = $(this), td_index = that.checkboxColumn.index
                            
                            fixedTd($lockTd, tr_index, td_index)
                        })
                    }
                })
            }
        }
    }
    
    //locking
    Datagrid.prototype.doLock = function() {
        var that = this, options = that.options, tools = that.tools, columnModel = that.columnModel, tableW = that.$tableH.width(), width = 0, $trs, $lockTrs, lockedLen = 0
        var hasFoot = that.$boxF && true, top = 0
        
        if (!that.$lockBox || !that.$lockBox.length) {
            that.$lockBox = $('<div class="datagrid-box-l"></div>')
            that.$lockH   = $('<div class="datagrid-box-h"></div>')
            that.$lockB   = $('<div class="datagrid-box-b"></div>')
            that.$lockF   = $('<div class="datagrid-box-f"></div>')
            
            that.$lockTableH = $('<table class="table table-bordered"></table>')
            that.$lockTableB = $('<table></table>').addClass(that.$tableB.attr('class'))
            that.$lockTableF = $('<table class="table table-bordered"></table>')
            
            that.$lockH.append(that.$lockTableH)
            that.$lockB.append(that.$lockTableB)
            that.$lockF.append(that.$lockTableF)
            
            that.$lockBox.append(that.$lockH).append(that.$lockB).prependTo(that.$grid)
            if (hasFoot) {
                that.$lockBox.append(that.$lockF)
                that.$lockF.css('margin-top', (that.$boxB.outerHeight() - that.$boxB[0].clientHeight)).height(that.$boxF.outerHeight())
            }
        } else {
            that.fixedLockItem()
            that.$lockTableH.empty()
            that.$lockTableB.empty()
            that.$lockTableF && that.$lockTableF.empty()
        }
        
        if (that.$boxT)    top += that.$boxT.outerHeight()
        if (that.$toolbar) top += that.$toolbar.outerHeight()
        if (top) that.$lockBox.css({top:top})
        
        // display initLock columns, hide other
        $.each(columnModel, function(i, n) {
            n.lockShow = false
            n.lockHide = false
            if (n.initLock) {
                if (n.hidden) tools.showhide(n, true)
                n.lockHide  = true
                n.locked    = true
                n.lockIndex = lockedLen ++
                width      += n.width
            } else {
                n.lockShow = true
                if (!n.hidden) tools.showhide(n, false)
                else n.lockShow = false
                if (n.locked) n.lockShow = true
                n.locked   = false
            }
        })
        
        that.$lockThead     = that.$thead.clone(true)
        that.$lockTbody     = that.$tbody.clone()
        that.$lockColgroupH = that.$colgroupH.clone()
        that.$lockColgroupB = that.$colgroupB.clone()
        
        that.$lockTableH.append(that.$lockColgroupH).append(that.$lockThead).css('width', width)
        that.$lockTableB.append(that.$lockColgroupB).append(that.$lockTbody).css('width', width)
        
        if (hasFoot) {
            that.$lockTfoot     = that.$tableF.find('> thead').clone()
            that.$lockColgroupF = that.$colgroupF.clone()
            that.$lockTableF.append(that.$lockColgroupF).append(that.$lockTfoot).css('width', width)
        }
        
        // display unlock columns, hide locked columns
        $.each(that.columnModel, function(i, n) {
            if (n.lockShow) tools.showhide(n, true)
            if (n.lockHide) tools.showhide(n, false)
        })
        
        that.$boxH.find('> div').css('width', '')
        that.$boxB.find('> div').css('width', '')
        that.$boxF && that.$boxF.find('> div').css('width', '')
        
        setTimeout(function() {
            var bw = that.$boxB.find('> div').width()
            
            that.$boxB.find('> div').width(bw)
            that.$boxH.find('> div').width(bw)
            that.$boxF && that.$boxF.find('> div').width(bw)
        }, 50)
        
        if (!that.col_lock_count) that.$lockBox.hide()
        else that.$lockBox.show()
        
        // colspan for child tr && nodata tr
        that.$tbody.find('> .'+ that.classnames.tr_child +', .datagrid-nodata').each(function() {
            $(this).find('> td').attr('colspan', that.columnModel.length - that.col_lock_count)
        })
        
        if (width > 1) width = width - 1
        that.$boxH.css('margin-left', width)
        that.$boxB.css('margin-left', width)
        if (hasFoot) that.$boxF.css('margin-left', width)
        
        // fixed height
        that.$lockB.height(that.$boxB[0].clientHeight)
        that.$lockB.prop('scrollTop', that.$boxB[0].scrollTop)
        
        var lockH = that.$lockTableH.height(), H = that.$thead.height(), lockFH = that.$lockTableF && that.$lockTableF.height(), HF = that.$tableF && that.$tableF.height()
        
        if (lockH != H) {
            if (lockH < H) that.$lockTableH.height(H)
            else that.$tableH.height(lockH)
        }
        
        if (lockFH && HF && (lockFH != HF)) {
            if (lockFH < HF) that.$lockTableF.find('> thead > tr:first-child > th:visible:first').height(HF)
            else that.$tableF.find('> thead > tr:first-child > th:visible:first').height(lockFH)
        }
        
        $lockTrs = that.$lockTbody.find('> tr')
        $trs     = that.$tbody.find('> tr')
        
        setTimeout(function() {
            var lockBH = that.$lockTableB.height(), HB = that.$tableB.height()
            
            if (lockBH != HB) {
                if (lockBH > HB) {
                    $lockTrs.each(function(tr_index) {
                        var $lockTr = $(this), $lockTd = $lockTr.find('> td:visible:first'), newH = $lockTd.outerHeight()
                        
                        if (newH > 30) {
                            $lockTr.height(newH)
                            $trs.eq(tr_index).height(newH)
                        }
                    })
                } else {
                    $trs.each(function(tr_index) {
                        var $tr = $(this), $td = $tr.find('> td:visible:first'), newH = $td.outerHeight()
                        
                        if (newH > 30) {
                            $tr.height(newH)
                            $lockTrs.eq(tr_index).height(newH)
                        }
                    })
                }
            }
        }, 20)
        
        that.fixedLockItem(1)
        
        // remove hidden tds
        $lockTrs.find('> td:hidden').remove()
        
        // events
        that.initLockEvents($lockTrs)
    }
    
    // init lockTr Events
    Datagrid.prototype.initLockEvents = function($locktrs) {
        if (!this.$lockTbody) return
        
        var that = this, options = that.options
        
        if (!$locktrs) $locktrs = that.$lockTbody.find('> tr')
        
        $locktrs
            .on('click.bjui.datagrid.tr', function(e) {
                var index = $(this).index(), $td = $(e.target).closest('td')
                
                that.$tbody.find('> tr:eq('+ index +')').trigger('click.bjui.datagrid.tr')
            })
            .on('delete.bjui.datagrid.tr', function(e, index) {
                var $tr = $(this)
                
                if (that.linenumberColumn && that.linenumberColumn.locked) {
                    $tr.nextAll(':not(.'+ that.classnames.tr_child +')').each(function() {
                        var $td = $(this).find('> td.'+ that.classnames.td_linenumber), num = parseInt($td.text(), 10)
                        
                        $td.text(num - 1)
                    })
                }
            })
            .on('mouseenter.bjui.datagrid', function(e) {
                var $tr = $(this), index = $tr.index()
                
                $tr.addClass('datagrid-hover')
                that.$tbody.find('> tr:eq('+ index +')').addClass('datagrid-hover')
            })
            .on('mouseleave.bjui.datagrid', function(e) {
                var $tr = $(this), index = $tr.index()
                
                $tr.removeClass('datagrid-hover')
                that.$tbody.find('> tr:eq('+ index +')').removeClass('datagrid-hover')
            })
        
        //contextmenu
        if (options.contextMenuB) {
            $locktrs.each(function() {
                that.tools.contextmenuB($(this), true)
            })
        }
    }
    
    //api - filterInThead
    Datagrid.prototype.filterInThead = function(isDialog) {
        var that = this, options = that.options, tools = that.tools, regional = that.regional, columnModel = that.columnModel, filterData = {}
        var $tr = isDialog ? $('<ul class="datagrid-thead-dialog-view-ul"></ul>') : $('<tr class="datagrid-filter"></tr>')
        var onFilter = function($input, model, $th) {
            var type = model.type, $others
            
            if ($th.isTag('th')) {
                $others = that.$headFilterUl && that.$headFilterUl.find('> li.li-'+ model.index)
            } else if ($th.isTag('li')) {
                $others = that.$thead.find('> tr.datagrid-filter > th:eq('+ model.index +')')
            }
            
            if ($others) {
                $input.val($others.find('input').val())
                if ($input.isTag('select'))
                    $input.val($others.find('select').val()).selectpicker('refresh')
            }
            
            if (type === 'date') {
                $input.change(function() {
                    doFilter(model, $input.val())
                })
            } else if (type === 'findgrid') {
                $input.change(function() {
                    doFilter(model, $input.val())
                })
            } else if (type === 'tags') {
                $th.on('aftercreated.bjui.tags', '[data-toggle="tags"]', function(e, data) {
                    doFilter(model, data.value)
                })
                
                $input.change(function() {
                    doFilter(model, $input.val())
                })
            } else {
                $input.change(function() {
                    doFilter(model, $input.val())
                })
            }
            
            $input.change(function() {
                if ($th.isTag('th') && !$others) {
                    $others = that.$headFilterUl && that.$headFilterUl.find('> li.li-'+ model.index)
                }
                
                $others && $others.find('input').val($input.val())
                if ($input.isTag('select'))
                    $others && $others.find('select').val($input.val()).selectpicker('refresh')
            })
        }
        var doFilter = function(model, val) {
            tools.quickFilter(model, val ? {operatorA:'like', valA:val} : null)
        }
        var initFilter = (typeof options.initFilter === 'object') && options.initFilter
        
        if (!that.inputs || !that.inputs.length) tools.initEditInputs()
        
        $.each(columnModel, function(i, n) {
            if (isDialog) {
                if (n === that.linenumberColumn || n === that.checkboxColumn || n === that.editBtnsColumn || n === that.childColumn)
                    return true
            }
            
            var $input = $(that.inputs[i]), $th = isDialog ? $('<li></li>') : $('<th></th>'), attrs = ''
            
            if (!n.quickfilter) {
                $th.appendTo($tr)
                return true
            }
            else if (n.type === 'findgrid') $input.data('context', $tr)
            else if (n.type === 'spinner') $input = $('<input type="text" name="'+ n.name +'">')
            else if (n.type === 'boolean') $input = $(BJUI.doRegional('<select name="'+ n.name +'" data-toggle="selectpicker"><option value="">#all#</option><option value="true">#true#</option><option value="false">#false#</option></select>', regional))
            else if (n.type === 'select') {
                if (n.attrs && typeof n.attrs === 'object') {
                    $.each(n.attrs, function(i, n) {
                        attrs += ' '+ i +'='+ n
                    })
                }
                if ($input.find('> option:first-child').val() && (!n.attrs || !n.attrs.multiple)) {
                    $input = $('<select name="'+ n.name +'" data-toggle="selectpicker"'+ attrs +'></select>')
                        .append(BJUI.doRegional('<option value="">#all#</option>', regional))
                        .append($input.html())
                        
                    $input.val('') // for IE8
                }
            }
            
            if (isDialog)
                $th.data('index', i).addClass('li-'+ i).append('<a href="javascript:;" class="datagrid-thead-dialog-sort" title="'+ BJUI.getRegional('datagrid.asc') +'/'+ BJUI.getRegional('datagrid.desc') +'">'+ n.label +'</a>')
            
            $th.append($input)
            
            if (n.hidden) $th.hide()
            if (n.type === 'boolean' && !isDialog) $th.attr('align', 'center')
            $th.appendTo($tr)
            
            $input.data('clearFilter', false)
            
            onFilter($input, n, $th)
            
            // events - clear filter
            $input.on('clearfilter.bjui.datagrid.thead', function() {
                $input.val('')
                if (n.type === 'boolean' || n.type === 'select') $input.selectpicker('refresh')
            })
            
            n.$quickfilter = $input
            
            // init filter
            if (initFilter && typeof initFilter[n.name] !== 'undefined') {
                that.tools.initFilter($input, n)
            }
        })
        
        if (isDialog) {
            $tr.prepend('<li><label>'+ BJUI.getRegional('datagrid.asc') +'/'+ BJUI.getRegional('datagrid.desc') +'</label><span class="quicksort-title">'+ BJUI.getRegional('datagrid.filter') +'</span></li>')
            $tr.hide().appendTo(that.$grid).initui()
            
            that.$headFilterUl = $tr
            
            $tr.off('click.datagrid.thead.quicksort').on('click.datagrid.thead.quicksort', 'a.datagrid-thead-dialog-sort', function(e) {
                var $this = $(this), model = that.columnModel[$this.closest('li').data('index')]
                
                $this.find('> i').remove()
                $this.closest('li').siblings().find('> a > i').remove()
                
                if (model.sortAsc) {
                    $this.append('<i class="fa fa-long-arrow-down"></i>')
                } else {
                    $this.append('<i class="fa fa-long-arrow-up"></i>')
                }
                
                that.tools.quickSort(model)
            })
        } else
            $tr.appendTo(that.$thead).initui()
    }
    
    //api - showhide linenumber column
    Datagrid.prototype.showLinenumber = function(flag) {
        var that = this, options = that.options, model = that.columnModel, numberModel, modelOrder = -1, data = that.data, numberModel_index = $.inArray(that.linenumberColumn, model)
        
        if (numberModel_index != -1)
            numberModel = model[numberModel_index]
        
        if (numberModel) {
            if (typeof flag === 'string' && (flag === 'lock' || flag === 'unlock')) {
                that.colLock(numberModel.th, flag === 'lock' ? true : false)
            } else {
                that.showhideColumn(numberModel.th, flag ? true : false)
            }
        } else if (flag) {
            modelOrder = $.inArray(that.childColumn, model)
            
            modelOrder ++
            numberModel = that.linenumberColumn
            numberModel.index = modelOrder
            model.splice(modelOrder, 0, numberModel)
            
            if (that.inputs && that.inputs.length)
                that.inputs = that.inputs.splice(modelOrder, 0, '')
            
            var $trsH = that.$thead.find('> tr'), col = '<col style="width:30px;">', $th, $filterTr = $trsH.filter('.datagrid-filter'), rowspan = $trsH.length - $filterTr.length
            
            $th = $('<th align="center"'+ (rowspan > 1 ? ' rowspan="'+ rowspan +' "' : '') +'class="'+ that.classnames.td_linenumber + (rowspan == 1 ? ' single-row' : '') +'"><div><div class="datagrid-space"></div><div class="datagrid-label">'+ that.linenumberColumn.label +'</div></div></th>')
            
            that.$colgroupH.find('> col:eq('+ modelOrder +')').before(col)
            that.$colgroupB.find('> col:eq('+ modelOrder +')').before(col)
            that.$colgroupF && that.$colgroupF.find('> col:eq('+ modelOrder +')').before(col)
            $filterTr.length && $filterTr.find('> th:eq('+ modelOrder +')').before('<th></th>')
            $trsH.first().find('> th:eq('+ modelOrder +')').before($th)
            that.$tableF && that.$tableF.find('> thead > tr > th:eq('+ modelOrder +')').before('<th></th>')
            
            numberModel.th    = $th
            numberModel.width = 30
            
            that.$tbody.find('> tr').each(function(i) {
                var $tr = $(this), colspan = that.columnModel.length, linenumber = i, paging = that.paging
                
                if ($tr.hasClass(that.classnames.tr_child) || $tr.hasClass('datagrid-nodata'))
                    $tr.find('> td').attr('colspan', colspan)
                else {
                    linenumber = that.tools.getNoChildDataIndex(linenumber)
                    if (options.linenumberAll)
                        linenumber = ((paging.pageCurrent - 1) * paging.pageSize + (linenumber))
                    
                    $tr.find('> td:eq('+ modelOrder +')').before('<td align="center" class="'+ that.classnames.td_linenumber +'">'+ (linenumber + 1) +'</td>')
                }
            })
            
            that.$tableF && that.$tableF.find('> thead > tr > th:eq('+ modelOrder +')').before('<th></th>')
            
            $.each(model, function(i, n) {
                n.index = i
                if (n.th) n.th.data('index', i)
            })
            
            $th.find('> div').height($th.outerHeight())
            
            if (flag === 'lock') {
                that.colLock($th, true)
            }
            if (that.$showhide) {
                that.$showhide.remove()
                that.colShowhide(options.columnShowhide)
            }
        }
    }
    
    //api - showhide checkbox column
    Datagrid.prototype.showCheckboxcol = function(flag) {
        var that = this, options = that.options, model = that.columnModel, numberModel = model[0], checkModel, modelOrder = -1, checkModel_index = $.inArray(that.checkboxColumn, model)
        
        if (checkModel_index != -1)
            checkModel = that.columnModel[checkModel_index]
        
        if (checkModel) {
            if (typeof flag === 'string' && (flag === 'lock' || flag === 'unlock')) {
                that.colLock(checkModel.th, flag === 'lock' ? true : false)
            } else {
                that.showhideColumn(checkModel.th, flag)
            }
        } else if (flag) {
            modelOrder = $.inArray(that.linenumberColumn, model)
            if (modelOrder == -1)
                modelOrder = $.inArray(that.childColumn, model)
            
            modelOrder ++
            checkModel = that.checkboxColumn
            checkModel.index = modelOrder
            model.splice(modelOrder, 0, checkModel)
            
            if (that.inputs && that.inputs.length)
                that.inputs = that.inputs.splice(modelOrder, 0, '')
                
            var $trsH = that.$thead.find('> tr'), col = '<col style="width:30px;">', $th, $td, $filterTr = $trsH.filter('.datagrid-filter'), rowspan = $trsH.length - $filterTr.length
            
            $th = $('<th align="center"'+ (rowspan > 1 ? ' rowspan="'+ rowspan +' "' : '') +'class="'+ that.classnames.td_checkbox + (rowspan == 1 ? ' single-row' : '') +'"><div><div class="datagrid-space"></div><div class="datagrid-label"><input type="checkbox" data-toggle="icheck"></div></th>')
            
            that.$colgroupH.find('> col:eq('+ modelOrder +')').before(col)
            that.$colgroupB.find('> col:eq('+ modelOrder +')').before(col)
            that.$colgroupF && that.$colgroupF.find('> col:eq('+ modelOrder +')').before(col)
            $filterTr.length && $filterTr.find('> th:eq('+ modelOrder +')').before('<th></th>')
            $trsH.first().find('> th:eq('+ modelOrder +')').before($th)
            that.$tableF && that.$tableF.find('> thead > tr > th:eq('+ modelOrder +')').before('<th></th>')
            $th.initui()
            
            checkModel.th    = $th
            checkModel.width = 30
            
            that.$tbody.find('> tr').each(function(i) {
                var $tr = $(this), colspan = that.columnModel.length
                
                if ($tr.hasClass(that.classnames.tr_child) || $tr.hasClass('datagrid-nodata'))
                    $tr.find('> td').attr('colspan', colspan)
                else {
                    $td = $('<td align="center" class="'+ that.classnames.td_checkbox +'"><input type="checkbox" data-toggle="icheck" name="datagrid.checkbox"></td>')
                    $tr.find('> td:eq('+ modelOrder +')').before($td)
                    $td.initui()
                }
            })
            
            $.each(model, function(i, n) {
                n.index = i
                if (n.th) n.th.data('index', i)
            })
            
            $th.find('> div').height($th.outerHeight())
            
            if (flag === 'lock') {
                that.colLock($th, true)
            }
            if (that.$showhide) {
                that.$showhide.remove()
                that.colShowhide(options.columnShowhide)
            }
        }
    }
    
    //api - showhide checkbox column
    Datagrid.prototype.showEditCol = function(flag) {
        var that = this, options = that.options, model = that.columnModel, editModel = model[model.length - 1], data = that.data
        
        if (editModel === that.editBtnsColumn) {
            that.showhideColumn(editModel.th, flag ? true : false)
        } else if (flag) {
            var $trsH = that.$thead.find('> tr'), col = '<col style="width:110px;">', $th, $td, $filterTr = $trsH.filter('.datagrid-filter'), rowspan = $trsH.length - $filterTr.length
            
            editModel = that.editBtnsColumn
            model.push(editModel)
            
            that.$colgroupH.append(col)
            that.$colgroupB.append(col)
            that.$colgroupF && that.$colgroupF.append(col)
            $th = $('<th align="center" rowspan="'+ rowspan +'">'+ that.editBtnsColumn.label +'</th>')
            $trsH.first().append($th)
            $filterTr.length && $filterTr.append('<th></th>')
            $th.initui().data('index', model.length - 1)
            editModel.th    = $th
            editModel.width = 110
            editModel.index = model.length - 1
            
            that.$tbody.find('> tr').each(function(i) {
                var $tr = $(this), colspan = that.columnModel.length
                
                if ($tr.hasClass(that.classnames.tr_child) || $tr.hasClass('datagrid-nodata'))
                    $tr.find('> td').attr('colspan', colspan)
                else {
                    $td = $('<td align="center" class="'+ that.classnames.s_edit +'">'+ BJUI.doRegional(FRAG.gridEditBtn, that.regional) +'</td>')
                    $tr.append($td)
                    $td.initui()
                }
            })
            
            that.edit(that.$tbody.find('> tr'))
            
            that.$tableF && that.$tableF.find('> thead > tr').append('<th></th>')
            
            if (that.$showhide) {
                that.$showhide.remove()
                that.colShowhide(options.columnShowhide)
            }
        }
    }
    
    //resize
    Datagrid.prototype.colResize = function() {
        var that        = this,
            tools       = that.tools,
            columnModel = that.columnModel,
            $thead      = that.$thead,
            $resizeMark = that.$grid.find('> .resizeProxy')
        
        if (!$resizeMark.length) {
            $resizeMark = $('<div class="resizeProxy" style="left:0; display:none;"></div>')
            $resizeMark.appendTo(that.$grid)
        }
        
        $thead.find('> tr > th').each(function(i) {
            var $th = $(this),  $resize = $th.find('> div > .'+ that.classnames.th_cell +'> .'+ that.classnames.th_resizemark)
            
            $resize.on('mousedown.bjui.datagrid.resize', function(e) {
                var ofLeft = that.$boxH.scrollLeft(), marginLeft = parseInt(that.$boxH.css('marginLeft') || 0, 10), left, index = $th.data('index'), model = columnModel[index], width = model.th.width()
                    , $trs = that.$tbody.find('> tr'), $lockTrs = that.$lockTbody && that.$lockTbody.find('> tr'), lockH = that.$lockTableB && that.$lockTableB.height(), H = that.$tableB.height(), lockH_new, H_new
                
                if (isNaN(marginLeft)) marginLeft = 0
                left = tools.getRight($th) - ofLeft + marginLeft
                
                that.isResize = true
                
                if (model.locked) {
                    left = tools.getRight4Lock(model.lockIndex)
                    if (model.lockWidth) width = model.lockWidth
                }
                
                $resizeMark
                    .show()
                    .css({
                        left   : left,
                        bottom : (that.$boxP ? that.$boxP.outerHeight() : 0),
                        cursor : 'col-resize'
                    })
                    .basedrag({
                        scop  : true, cellMinW:20, relObj:$resizeMark,
                        move  : 'horizontal',
                        event : e,
                        stop  : function() {
                            var new_left = $resizeMark.position().left,
                                move     = new_left - left,
                                newWidth = move + width,
                                tableW   = that.$tableH.width() + move,
                                lockW    = that.$lockTableH && that.$lockTableH.width() + move
                            
                            if (newWidth < 5) newWidth = 20
                            if (model.minWidth && newWidth < model.minWidth) newWidth = model.minWidth
                            if (newWidth != width + move) {
                                tableW   = tableW - move + (newWidth - width)
                                lockW    = lockW - move + (newWidth - width)
                            }
                            
                            model.width = newWidth
                            
                            if (model.locked) {
                                if (lockW < (that.$grid.width() * 0.75)) {
                                    model.lockWidth = newWidth
                                    that.$lockColgroupH.find('> col:eq('+ index +')').width(newWidth)
                                    that.$lockColgroupB.find('> col:eq('+ index +')').width(newWidth)
                                    that.$lockColgroupF && that.$lockColgroupF.find('> col:eq('+ index +')').width(newWidth)
                                    
                                    that.$lockTableH.width(lockW)
                                    that.$lockTableB.width(lockW)
                                    that.$lockTableF && that.$lockTableF.width(lockW)
                                    
                                    var margin = that.$lockBox.width()
                                    
                                    that.$boxH.css('margin-left', margin - 1)
                                    that.$boxB.css('margin-left', margin - 1)
                                    that.$boxH.find('> div').width(that.$boxH.width())
                                    that.$boxB.find('> div').width(that.$boxH.width())
                                    that.$boxF && that.$boxF.css('margin-left', margin - 1)
                                    
                                    that.$colgroupH.find('> col:eq('+ index +')').width(newWidth)
                                    that.$colgroupB.find('> col:eq('+ index +')').width(newWidth)
                                    that.$colgroupF && that.$colgroupF.find('> col:eq('+ index +')').width(newWidth)
                                }
                            } else {
                                setTimeout(function() {
                                    that.$colgroupH.find('> col:eq('+ index +')').width(newWidth)
                                    that.$colgroupB.find('> col:eq('+ index +')').width(newWidth)
                                    that.$colgroupF && that.$colgroupF.find('> col:eq('+ index +')').width(newWidth)
                                }, 1) //setTimeout for chrome
                            }
                            
                            /* fixed height */
                            setTimeout(function() {
                                $trs.css('height', '')
                                H_new = that.$tableB.height()
                                
                                if (that.$lockTbody) {
                                    $lockTrs.css('height', '')
                                    lockH_new = that.$lockTableB.height()
                                    if (lockH_new != lockH || H_new != H) {
                                        if (lockH_new > H_new) {
                                            $lockTrs.each(function(tr_index) {
                                                var $lockTr = $(this), $lockTd = $lockTr.find('> td:eq('+ model.lockIndex +')'), newH = $lockTd.outerHeight()
                                                
                                                if (newH > 30) {
                                                    $lockTr.height(newH)
                                                    $trs.eq(tr_index).height(newH)
                                                }
                                            })
                                        } else {
                                            $trs.each(function(tr_index) {
                                                var $tr = $(this), $td = $tr.find('> td:eq('+ index +')'), newH = $td.outerHeight()
                                                
                                                if (newH > 30) {
                                                    $tr.height(newH)
                                                    $lockTrs.eq(tr_index).height(newH)
                                                }
                                            })
                                        }
                                    }
                                    
                                    that.$lockB.height(that.$boxB[0].clientHeight)
                                }
                                
                                if (model.calc) that.$tfoot && that.$tfoot.trigger('resizeH.bjui.datagrid.tfoot')
                                
                                that.isResize = false
                            }, 10)
                            
                            $resizeMark.hide()
                            that.resizeFlag = true
                        }
                    })
            })
        })
    }
    
    //column - add menu button
    Datagrid.prototype.colMenu = function() {
        var that = this, options = that.options, tools = that.tools, regional = that.regional, $ths = that.$trsH.find('> th.'+ that.classnames.th_menu), $menu = that.$grid.find('> .'+ that.classnames.s_menu)
        
        if (!$menu.legnth) {
            $menu = $(BJUI.doRegional(FRAG.gridMenu, regional))
            $menu.hide().appendTo(that.$grid)
            that.$menu = $menu
        }
        that.colShowhide(options.columnShowhide)
        
        $ths.each(function() {
            var $th     = $(this),
                index   = $th.data('index'),
                model   = that.columnModel[index],
                $cell   = $th.find('> div > .'+ that.classnames.th_cell),
                $btnBox = $cell.find('> .'+ that.classnames.btn_menu),
                $btn
            
            if (!$btnBox.length) {
                $btn    = $('<button type="button" class="btn btn-default"><i class="fa fa-bars"></button>'),
                $btnBox = $('<div class="'+ that.classnames.btn_menu +'"></div>').append($btn)
                
                $btnBox.appendTo($cell)
                
                $btn.click(function() {
                    var $tr = $th.closest('tr'), rowspan = parseInt(($th.attr('rowspan') || 1), 10), left = $(this).offset().left - that.$grid.offset().left - 1, top = (that.$trsH.length - rowspan) * 25 + (13 * rowspan) + 11, $showhide = $menu.find('> ul > li.datagrid-li-showhide'), menu_width, submenu_width 
                    var $otherBtn = $menu.data('bjui.datagrid.menu.btn')
                    
                    if ($otherBtn && $otherBtn.length) $otherBtn.removeClass('active')
                    $(this).addClass('active')
                    if ($showhide.length && that.$showhide) {
                        that.$showhide.appendTo($showhide)
                        submenu_width = that.$showhide.data('width')
                    }
                    $menu
                        .css({'position':'absolute', 'top':top, left:left})
                        .show()
                        .data('bjui.datagrid.menu.btn', $btn)
                        .siblings('.'+ that.classnames.s_menu).hide()
                    
                    menu_width = $menu.outerWidth()
                    
                    var position = function(left) {
                        if (that.$boxH.width() - left < menu_width) {
                            $menu.css({left:left - menu_width + 18}).addClass('position-right')
                        } else {
                            $menu.css({left:left}).removeClass('position-right')
                        }
                    }
                    var fixedLeft = function($btn) {
                        that.$boxB.scroll(function() {
                            var left = $btn.offset().left - that.$grid.offset().left - 1
                            
                            position(left)
                        })
                    }
                    
                    position(left)
                    fixedLeft($btn)
                    
                    if (options.columnFilter) that.colFilter($th)
                    else $menu.find('> ul > li.'+ that.classnames.li_filter).hide()
                    
                    tools.locking($th)
                    
                    // quick sort
                    var $asc  = $menu.find('> ul > li.'+ that.classnames.li_asc),
                        $desc = $asc.next()
                    
                    $asc.click(function() {
                        model.sortAsc = false
                        tools.quickSort(model)
                    })
                    
                    $desc.click(function() {
                        model.sortAsc = true
                        tools.quickSort(model)
                    })
                    
                    $menu.on('sort.bjui.datagrid.th', function(e, asc) {
                        $asc.toggleClass('sort-active', asc)
                        $desc.toggleClass('sort-active', !asc)
                    })
                })
            }
        })
        
        /* hide filterbox */
        that.$grid.on('click.bjui.datagrid.filter', function(e) {
            var $target = $(e.target), $menu = that.$grid.find('.'+ that.classnames.s_menu +':visible')
            
            if ($menu.length && !$target.closest('.'+ that.classnames.btn_menu).length) {
                if (!$target.closest('.'+ that.classnames.s_menu).length) {
                    $menu.hide().data('bjui.datagrid.menu.btn').removeClass('active')
                }
            }
        })
    }
    
    // show or hide columns on btn menu
    Datagrid.prototype.colShowhide = function(showFlag) {
        var that = this, options = that.options, tools = that.tools, $menu = that.$menu, $ul = $menu.find('> ul'), $showhideli = $ul.find('> li.'+ that.classnames.li_showhide)
        
        if (showFlag) {
            if (!that.$showhide) {
                tools.createShowhide()
                tools.showSubMenu($showhideli, $menu, that.$showhide)
            }
        } else {
            $showhideli.hide()
        }
    }
    
    // api - show or hide column
    Datagrid.prototype.showhideColumn = function(column, showFlag) {
        var that = this, tools = that.tools, index, model
        
        if ($.type(column) === 'number') {
            index = parseInt(column, 10)
            if (index < 0) return
        } else {
            index = column.data('index')
        }
        
        model = that.columnModel[index]
        
        if (model) {
            if (model.locked) {
                if (showFlag) return
                else that.colLock(model.th, showFlag)
            }
            tools.showhide(model, showFlag)
        }
    }
    
    // filter
    Datagrid.prototype.colFilter = function($th, filterFlag) {
        var that  = this, options = that.options, tools = that.tools, regional = that.regional, $filter = $th.data('bjui.datagrid.filter'), $menu = that.$menu, $filterli = $menu.find('> ul > li.'+ that.classnames.li_filter)
        var model = that.columnModel[$th.data('index')]
        
        if (!that.inputs || !that.inputs.length) tools.initEditInputs()
        if (model.quickfilter) {
            $filterli.show().find('.'+ that.classnames.s_filter).addClass('hide')
            
            if (!$filter || !$filter.length) {
                $filter = $(BJUI.doRegional(FRAG.gridFilter.replaceAll('#label#', $th.text()), regional)).hide().appendTo(that.$grid)
                
                var index = $th.data('index'), model = that.columnModel[index], type = model.type || 'string', operator = model.operator || [],
                    $filterA = $filter.find('span.filter-a'),
                    $filterB = $filter.find('span.filter-b'),
                    $select  = $('<select data-toggle="selectpicker" data-container="true"></select>'),
                    $input   = $(that.inputs[index]),
                    $valA, $valB
                
                $input.removeAttr('data-rule').attr('size', 10).addClass('filter-input')
                
                if (type === 'string' || type === 'findgrid' || type === 'tags') {
                    if (!operator.length) operator = ['=', '!=', 'like']
                    if (type === 'findgrid') {
                        $input.data('context', $filter)
                    }
                } else if (type === 'number' || type === 'int' || type === 'spinner') {
                    if (type === 'spinner') $input.removeAttr('data-toggle')
                    if (!operator.length) operator = ['=', '!=', '>', '<', '>=', '<=']
                } else if (type === 'date') {
                    if (!operator.length) operator = ['=', '!=']
                } else if (type === 'boolean') {
                    if (!operator.length) operator = ['=', '!=']
                    $input = $(BJUI.doRegional('<select name="'+ model.name +'" data-toggle="selectpicker"><option value="">#all#</option><option value="true">#true#</option><option value="false">#false#</option></select>', regional))
                } else if (type === 'select') {
                    if (!operator.length) operator = ['=', '!=']
                    $input.attr('data-width', '80')
                    if ($input.find('> option:first-child').val()) {
                        $input = $('<select name="'+ model.name +'" data-toggle="selectpicker" data-width="80"></select>')
                            .append(BJUI.doRegional('<option value="">#all#</option>', regional))
                            .append($input.html())
                    }
                }
                
                for (var i = 0, l = operator.length; i < l; i++) {
                    $select.append('<option value="'+ (operator[i]) +'">'+ (operator[i]) +'</option>')
                }
                
                $valA = $input
                $valB = $valA.clone()
                
                $filterA.append($select).append($input)
                $filterB.append($select.clone()).append($valB)
                
                $th.data('bjui.datagrid.filter', $filter)
                
                $filter.appendTo($filterli)
                $filter.data('width', $filter.outerWidth()).hide().initui()
                
                /* events */
                var $ok      = $filter.find('button.ok'),
                    $clear   = $filter.find('button.clear'),
                    $selects = $filter.find('select'),
                    $selA    = $selects.first(),
                    $selB    = $selects.last(),
                    $andOr   = $selects.eq(1)
                    
                $ok.click(function() {
                    var operatorA = $selA.val(), valA = $valA.val().trim(), operatorB = $selB.val(), valB = $valB.val().trim(), andor = $andOr.val()
                    var filterDatas = {}
                    
                    if (valA.length) {
                        $.extend(filterDatas, {operatorA:operatorA, valA:valA})
                    }
                    if (valB.length) {
                        if (valA.length) $.extend(filterDatas, {andor:andor})
                        $.extend(filterDatas, {operatorB:operatorB, valB:valB})
                    }
                    if (!$.isEmptyObject(filterDatas)) {
                        tools.quickFilter(that.columnModel[$th.data('index')], filterDatas)
                        that.$grid.trigger('click')
                        $filterli.trigger('hidesubmenu.bjui.datagrid.th', [$menu, $filter])
                    } else {
                        $clear.trigger('click')
                    }
                })
                
                $clear.click(function() {
                    var model = that.columnModel[$th.data('index')]
                    
                    $selects.find('> option:first').prop('selected', true)
                    $selects.selectpicker('refresh')
                    $valA.val('')
                    $valB.val('')
                    if (model.isFiltered) {
                        tools.quickFilter(model, null)
                        that.$grid.trigger('click')
                        $filterli.trigger('hidesubmenu.bjui.datagrid.th', [$menu, $filter])
                    }
                })
            }
            
            tools.showSubMenu($filterli, $menu, $filter.removeClass('hide'))
            
            $menu.find('> ul > li:not(".'+ that.classnames.li_filter +'")').on('mouseover', function() {
                if ($filterli.hasClass('active'))
                    $filterli.trigger('hidesubmenu.bjui.datagrid.th', [$menu, $filter])
            })
        } else {
            $filterli.hide()
        }
    }
    
    // paging
    Datagrid.prototype.initPaging = function() {
        var that = this, tools = that.tools, options = that.options, paging = that.paging, pr = BJUI.regional.pagination, btnpaging = FRAG.gridPaging, pageNums = [], pageCount = paging.pageCount, interval, selectPages = [], pagingHtml = BJUI.StrBuilder()
        
        interval = tools.getPageInterval(pageCount, paging.pageCurrent, paging.showPagenum)
        
        for (var i = interval.start; i < interval.end; i++) {
            pageNums.push(FRAG.gridPageNum.replace('#num#', i).replace('#active#', (paging.pageCurrent == i ? ' active' : '')))
        }
        
        btnpaging = BJUI.doRegional(btnpaging.replaceAll('#pageCurrent#', paging.pageCurrent).replaceAll('#count#', paging.total +'/'+ parseInt((pageCount || 0), 10)), pr)
        
        pagingHtml
            .add('<div class="paging-content" style="width:'+ that.$boxB.width() +'px;">')
            .add('<span></span><div class="datagrid-pagesize"><button type="button" class="btn-default btn-refresh" title="'+ pr.refresh +'" data-icon="refresh"></button>')
            .add('<select data-toggle="selectpicker"></select>')
            .add('</div>')
            .add('<div class="datagrid-paging">')
            .add(btnpaging.replace('#pageNumFrag#', pageNums.join('')))
            .add('</div>')
            .add('</div>')
        
        that.$boxP.html(pagingHtml.toString())
        that.$boxP.initui()
        
        //events
        var $select    = that.$boxP.find('div.datagrid-pagesize > select'),
            $pagenum   = that.$boxP.find('ul.pagination'),
            $pagetotal = $pagenum.find('> li.page-total'),
            $jumpto    = $pagetotal.next(),
            $first     = $jumpto.next(),
            $prev      = $first.next(),
            $next      = $prev.nextAll('.page-next'),
            $last      = $next.next()
        
        var disablePrev = function() {
            $first.addClass('disabled')
            $prev.addClass('disabled')
        }
        var enablePrev = function() {
            $first.removeClass('disabled')
            $prev.removeClass('disabled')
        }
        var disableNext = function() {
            $next.addClass('disabled')
            $last.addClass('disabled')
        }
        var enableNext = function() {
            $next.removeClass('disabled')
            $last.removeClass('disabled')
        }
        var pageFirst = function() {
            disablePrev()
            enableNext()
        }
        var pageLast = function() {
            enablePrev()
            disableNext()
        }
        var setPageSize = function(pageSize) {
            $select.empty()
            
            if (!pageSize) pageSize = that.paging.pageSize
            
            selectPages = paging.selectPageSize.split(',')
            selectPages.push(String(pageSize))
            
            $.unique(selectPages).sort(function(a, b) { return a - b })
            
            var opts = []
            
            $.each(selectPages, function(i, n) {
                opts.push('<option value="'+ n +'"'+ (n == paging.pageSize && 'selected') +'>'+ n +'/'+ pr.page +'</option>')
            })
            
            $select.html(opts.join('')).selectpicker('refresh')
        }
        
        if (paging.pageCurrent == 1) pageFirst()
        if (paging.pageCurrent == paging.pageCount) {
            pageLast()
            if (paging.pageCurrent == 1) disablePrev()
        }
        if (!paging.total) disableNext()
        setPageSize()
        
        that.$boxP.on('click.datagrid.pagenum', 'li.page-num', function(e) {
            var $num = $(this)
            
            if (!$num.hasClass('active')) {
                that.jumpPage($num.text())
            }
            
            e.preventDefault()
        }).on('click.datagrid.refresh', 'button.btn-refresh', function() {
            that.refresh()
        }).on('bjui.datagrid.paging.jump', function(e) {
            var pageCurrent = that.paging.pageCurrent, interval = tools.getPageInterval(that.paging.pageCount, pageCurrent, paging.showPagenum), pageNums = []
            
            for (var i = interval.start; i < interval.end; i++) {
                pageNums.push(FRAG.gridPageNum.replace('#num#', i).replace('#active#', (pageCurrent == i ? ' active' : '')))
            }
            
            $pagenum.find('> li.page-num').remove()
            $prev.after(pageNums.join(''))
            
            if (pageCurrent == 1) {
                pageFirst()
                if (pageCurrent == that.paging.pageCount) disableNext()
                if (!that.paging.total) disableNext()
            } else if (pageCurrent == that.paging.pageCount) {
                pageLast()
            } else {
                enablePrev()
                enableNext()
            }
            
            $jumpto.find('input').val(pageCurrent)
            $pagetotal.find('> span').html(that.paging.total +'/'+ that.paging.pageCount)
        }).on('bjui.datagrid.paging.pageSize', function(e, pageSize) {
            setPageSize(pageSize)
        }).on('change', 'div.datagrid-pagesize > select', function() {
            var pageSize = $(this).val()
            
            that.jumpPage(null, pageSize)
        })
        
        $jumpto.find('input').on('keyup', function(e) {
            if (e.which === BJUI.keyCode.ENTER) {
                var page = $(this).val()
                
                if (page) that.jumpPage(page)
            }
        })
        
        $first.on('click', function() {
            if (that.paging.pageCurrent > 1) 
                that.jumpPage(1)
        })
        
        $prev.on('click', function() {
            if (that.paging.pageCurrent > 1)
                that.jumpPage(that.paging.pageCurrent - 1)
        })
        
        $next.on('click', function() {
            if (that.paging.pageCurrent < that.paging.pageCount)
                that.jumpPage(that.paging.pageCurrent + 1)
        })
        
        $last.on('click', function() {
            if (that.paging.pageCurrent < that.paging.pageCount)
                that.jumpPage(that.paging.pageCount)
        })
    }
    
    Datagrid.prototype.jumpPage = function(pageCurrent, pageSize) {
        var that = this, paging = that.paging, pageCount = paging.pageCount
        
        if (pageCurrent && isNaN(pageCurrent)) return
        if (pageSize && isNaN(pageSize))       return
        if (pageCurrent) {
            pageCurrent = parseInt(pageCurrent, 10)
            
            if (pageCurrent < 1)         pageCurrent = 1
            if (pageCurrent > pageCount) pageCurrent = pageCount
            if (pageCurrent == paging.pageCurrent) return
        }
        if (pageSize) {
            pageSize = parseInt(pageSize, 10)
            
            if (that.options.local != 'remote') {
                if (paging.pageSize > paging.total) return
            }
        }
        
        that.tools.jumpPage(pageCurrent, pageSize)
    }
    
    // api - add
    Datagrid.prototype.add = function(addLocation, addData, noEdit) {
        if (!this.tools.beforeEdit() && !noEdit) return
        
        if (!this.options.editUrl && !noEdit) {
            BJUI.debug('Datagrid Plugin: Edit url is not set!')
            return
        }
        
        if (!this.options.editMode && !noEdit) return
        if (!this.options.inlineEditMult) {
            this.doCancelEditRow(this.$tbody.find('> tr.'+ this.classnames.tr_edit))
        } else if (!noEdit && this.options.editMode != 'inline' && this.$tbody.find('> tr.'+ this.classnames.tr_add).length) {
            return
        }
        
        if (!addData) {
            addData = {}
        } else {
            if (typeof addData === 'string') {
                addData = addData.toObj()
            }
            if (typeof addData !== 'object') {
                addData = {}
            }
        }
        
        var that = this, options = that.options, keys = options.keys, tools = that.tools, paging = that.paging, trs, obj = {}, data = [], addObj, startNumber = (paging.pageCurrent - 1) * paging.pageSize, linenumber
        
        var addTr = function() {
            var $tr = $('<tr></tr>').addClass(that.classnames.tr_add), $lockTr = $tr.clone()
            
            if (that.isTemplate) {
                var tdTemplate = options.tdTemplate, tempcolspan = that.columnModel.length
                
                if (typeof tdTemplate === 'function')
                    tdTemplate = tdTemplate.apply(that, [{}])
                
                //tdTemplate = that.tools.replacePlh4Template(tdTemplate, tempData, true)
                if (that.options.hasChild && that.options.childOptions) {
                    $tr.append('<td data-title="..." align="center" class="datagrid-child-td"><div>'+ BJUI.doRegional(FRAG.gridExpandBtn, that.regional) +'</div></td>')
                    tempcolspan --
                }
                if (that.options.showLinenumber) {
                    $tr.append('<td data-title="No." align="center" class="datagrid-linenumber-td">0</td>')
                    tempcolspan --
                }
                if (that.options.showCheckboxcol) {
                    $tr.append('<td data-title="Checkbox" align="center" class="datagrid-checkbox-td"><div><input type="checkbox" data-toggle="icheck" name="datagrid.checkbox" value="true"></div></td>')
                    tempcolspan --
                }
                
                $tr.append('<td class="datagrid-template-td" colspan="'+ tempcolspan +'">'+ tdTemplate +'</td>')
            } else {
                $.each(that.columnModel, function(i, n) {
                    var label = '', $td = $('<td></td>')
                    
                    if (n[keys.gridChild])
                        $td.addClass(that.classnames.td_child).html('<div>'+ BJUI.doRegional(FRAG.gridExpandBtn, that.regional) +'</div>')
                    else if (n[keys.gridNumber])
                        $td.addClass(that.classnames.td_linenumber).text(0)
                    else if (n[keys.gridCheckbox])
                        $td.addClass(that.classnames.td_checkbox).html('<div><input type="checkbox" data-toggle="icheck" name="datagrid.checkbox" value="true"></div>')
                    else if (n[keys.gridEdit])
                        $td.addClass(that.classnames.s_edit).data('isAdd', true).html(BJUI.doRegional(FRAG.gridEditBtn, that.regional))
                    else $td.text('')
                    
                    if (n.hidden) $td.css('display', 'none')
                    if (n.align)  $td.attr('align', n.align)
                    
                    if (n.name) obj[n.name] = ''
                    
                    if (n.locked) {
                        if (n[keys.gridCheckbox]) {
                            $td.clone().hide().appendTo($tr)
                            $td.show().appendTo($lockTr)
                        } else {
                            $td.clone().show().appendTo($lockTr)
                            $td.hide().appendTo($tr)
                        }
                    } else {
                        $td.appendTo($tr)
                    }
                })
            }
            //if (addData && typeof addData === 'object')
            //    $tr.data('datagrid.addData', addData)
            
            obj = $.extend({}, that.attach, obj)
            if (!that.emptyData) that.emptyData = obj
            
            return {tr:$tr, lockTr:$lockTr.find('> td').length ? $lockTr : null}
        }
        
        if (!addLocation) addLocation = options.addLocation || 'first'
        if (!that.$lastSelect) {
            if (addLocation === 'prev') addLocation = 'first'
            else if (addLocation === 'next') addLocation = 'last'
        }
        if ($.inArray(addLocation, ['first', 'last', 'prev', 'next']) === -1)
            addLocation = 'first'
        
        if (options.isTree && that.$lastSelect) {
            if (!(addLocation === 'first' || addLocation === 'last'))
                addLocation = 'first'
            
            var parentData = that.data[that.tools.getNoChildDataIndex(that.$lastSelect.index())]
            
            if (parentData) {
                addData[options.treeOptions.keys.level]     = parentData[options.treeOptions.keys.level] + 1
                addData[options.treeOptions.keys.parentKey] = parentData[options.treeOptions.keys.key]
                addData[options.keys.treePTr]               = that.$lastSelect
                addData[options.keys.treePData]             = parentData
                
                //parentData[options.treeOptions.keys.childLen] = (parentData[options.treeOptions.keys.childLen] || 0) + 1
                //that.$lastSelect.data('child', parentData[options.treeOptions.keys.childLen]).attr('data-child', parentData[options.treeOptions.keys.childLen])
            } else {
                addData['level'] = 0
            }
        }
        
        if (addLocation === 'first') {
            linenumber = 0
            trs = addTr()
            
            if (options.isTree && that.$lastSelect) {
                linenumber = that.tools.getNoChildDataIndex(that.$lastSelect.index()) + 1
                
                if (that.$lastSelect.next().hasClass(that.classnames.tr_child)) {
                    trs.tr.insertAfter(that.$lastSelect.next())
                    if (trs.lockTr) trs.lockTr.insertAfter(that.$lockTbody.find('> tr:eq('+ that.$lastSelect.next().index() +')'))
                } else {
                    trs.tr.insertAfter(that.$lastSelect)
                    if (trs.lockTr) trs.lockTr.insertAfter(that.$lockTbody.find('> tr:eq('+ that.$lastSelect.index() +')'))
                }
            } else {
                trs.tr.prependTo(that.$tbody)
                if (trs.lockTr) trs.lockTr.prependTo(that.$lockTbody)
            }
        } else if (addLocation === 'last') {
            linenumber = that.$tbody.find('> tr').length
            trs = addTr()
            
            if (options.isTree && that.$lastSelect) {
                var child = that.$lastSelect.data('child') || 0, level = that.$lastSelect.data('level'), $lastTr, hasChild = that.$lastSelect.next().hasClass(that.classnames.tr_child)
                
                $lastTr = that.getChildrens(that.$lastSelect, that.$lastSelect).last()
                
                if (hasChild) {
                    trs.tr.insertAfter($lastTr.next())
                    if (trs.lockTr) trs.lockTr.insertAfter(that.$lockTbody.find('> tr:eq('+ $lastTr.next().index() +')'))
                } else {
                    trs.tr.insertAfter($lastTr)
                    if (trs.lockTr) trs.lockTr.insertAfter(that.$lockTbody.find('> tr:eq('+ $lastTr.index() +')'))
                }
                
                linenumber = that.tools.getNoChildDataIndex($lastTr.index()) + 1
                
                addData[options.treeOptions.keys.order] = child
            } else {
                trs.tr.appendTo(that.$tbody)
                if (trs.lockTr) trs.lockTr.appendTo(that.$lockTbody)
            }
        } else if (addLocation === 'prev') {
            linenumber = that.tools.getNoChildDataIndex(that.$lastSelect.index())
            trs = addTr()
            
            trs.tr.insertBefore(that.$lastSelect)
            if (trs.lockTr) trs.lockTr.insertBefore(that.$lockTbody.find('> tr:eq('+ that.$lastSelect.index() +')'))
        } else if (addLocation === 'next') {
            linenumber = that.tools.getNoChildDataIndex(that.$lastSelect.index()) + 1
            trs = addTr()
            
            if (that.$lastSelect.next().hasClass(that.classnames.tr_child)) {
                trs.tr.insertAfter(that.$lastSelect.next())
                if (trs.lockTr) trs.lockTr.insertAfter(that.$lockTbody.find('> tr:eq('+ that.$lastSelect.next().index() +')'))
            } else {
                trs.tr.insertAfter(that.$lastSelect)
                if (trs.lockTr) trs.lockTr.insertAfter(that.$lockTbody.find('> tr:eq('+ that.$lastSelect.index() +')'))
            }
        }
        
        addData = $.extend({}, that.emptyData, addData, {addFlag:true})
        
        if (!that.data) that.data = []
        if (!that.allData) that.allData = []
        if (that.allData.length) {
            that.allData.splice(linenumber + startNumber, 0, addData)
        } else {
            that.allData.push(addData)
        }
        
        if (that.data.length) {
            that.data.splice(linenumber, 0, addData)
        } else {
            that.data.push(addData)
        }
        
        that.tools.updateGridIndex()
        
        trs.tr.initui()
        trs.lockTr && trs.lockTr.initui()
        
        if (addData[options.keys.treePTr])
            trs.tr.data(options.keys.treePTr, addData[options.keys.treePTr])
        //console.log(addData)
        if (options.showNoDataTip)
            that.$tbody.find('> tr.datagrid-nodata').remove()
        if (options.height === 'auto')
            that.fixedHeight()
        
        setTimeout(function() {
            that.initEvents(trs.tr)
        }, 20)
        
        if (trs.lockTr) that.initLockEvents(trs.lockTr)
        that.edit(trs.tr)
        
        if (options.hasChild && options.childOptions)
            trs.tr.after('<tr class="'+ that.classnames.tr_child +'"></tr>')
        
        if (noEdit) {
            that.inlineEditComplete(trs.tr, addData)
            if (that.data.length == 1)
                that.needfixedWidth = true
            that.tools.afterSave(trs.tr, addData)
        } else {
            if (options.editMode != 'dialog') {
                that.doEditRow(trs.tr, 'inline', true)
            } else {
                that.dialogEdit(trs.tr, true)
            }
        }
    }
    
    // edit
    Datagrid.prototype.edit = function($trs) {
        var that = this, options = that.options, tools = that.tools, type = options.editMode, columnModel = that.columnModel, $editTd
        
        that.editInit = false
        
        if (!type) return
        if (typeof type === 'object') {
            var editOptions = {}, types = ['dialog', 'navtab', 'div'], editFlag = false
            
            that.editOptions = null
            
            for (var key in type) {
                if ($.inArray(key, types) != -1) {
                    editOptions.type    = key
                    editOptions.options = type[key]
                    
                    editFlag = true
                    
                    break
                }
            }
            
            if (!editFlag) {
                BJUI.debug('Dialog Plugn: The options \'editModel\' set error!')
                return
            }
            
            if (!$.isEmptyObject(editOptions))
                that.editOptions = editOptions
            
        } else {
            if (that.options.editUrl)
                that.options.editUrl = that.options.editUrl.replace(/{\/?[^}]*}/g, '')
            
            if (type != 'dialog')
                type = 'inline'
        }
        
        if (!$trs) $trs = that.$tbody.find('> tr')
        
        $editTd = $trs.find('> td.'+ that.classnames.s_edit)
        
        that.editInit = true
        
        /* events */
        $editTd.each(function() {
            var $td = $(this), $btns = $td.find('button.bjui-datagrid-btn'), $edit = $btns.first(), $update = $edit.next(), $save = $update.next(), $cancel = $save.next(), $delete = $cancel.next()
            
            $edit.on('click', function(e, data) {
                var $btn = $(this), $tr = $btn.closest('tr'), data_index = $tr.index(), isAdd = $td.data('isAdd')
                
                data_index = that.tools.getNoChildDataIndex(data_index)
                
                if (!data) {
                    if (that.isDom) data = $tr.data('initData') || tools.setDomData($tr)
                    else data = that.data[data_index]
                }
                if (!tools.beforeEdit($tr, data)) {
                    return false
                }
                if (that.editOptions) {
                    that.externalEdit($tr, null, data)
                    return false
                }
                if (type != 'dialog') {
                    that.inlineEdit($tr, isAdd)
                    
                    $btns.hide()
                    $update.show()
                    $cancel.show()
                    
                    if (isAdd) {
                        $update.hide()
                        $save.show()
                    }
                } else {
                    that.dialogEdit($tr, isAdd)
                }
                
                e.stopPropagation()
            })
            
            $save.on('click', function(e) {
                var $btn = $(this), $tr = $btn.closest('tr')
                
                that.updateEdit($tr, $btn)
                
                e.stopPropagation()
            }).on('bjui.datagrid.update.tr', function() {
                $btns.hide()
                $edit.show()
                $delete.show()
            })
            
            $update.on('click', function(e) {
                var $btn = $(this), $tr = $btn.closest('tr')
                
                that.updateEdit($tr, $btn)
                
                e.stopPropagation()
            }).on('bjui.datagrid.update.tr', function() {
                $btns.hide()
                $edit.show()
                $delete.show()
            })
            
            $cancel.on('click', function(e) {
                var $btn = $(this), $tr = $btn.closest('tr')
                
                that.cancelEdit($tr)
                
                $btns.hide()
                $edit.show()
                $delete.show()
                
                e.stopPropagation()
            })
            
            $delete.on('click', function(e) {
                var $btn = $(this), $tr = $btn.closest('tr')
                
                that.delRows($tr)
                
                e.stopPropagation()
            })
        })
    }
    
    Datagrid.prototype.externalEdit = function(row, editOpts, data) {
        var that = this, options = that.options, editOptions = {}, $tr, data_index, editUrl, type, types = ['dialog', 'navtab', 'div']
        
        if (editOpts && typeof editOpts === 'object') {
            for (var key in editOpts) {
                if ($.inArray(key, types) != -1) {
                    editOptions.type    = key
                    editOptions.options = editOpts[key]
                    
                    break
                }
            }
        } else
            editOptions = $.extend({}, that.editOptions) 
        
        if (row instanceof jQuery) {
            $tr = row
        } else if (!isNaN(row)) {
            $tr = that.$tbody.find('> tr:not(.'+ that.classnames.tr_child +')').eq(parseInt(row, 10))
        } else {
            BJUI.debug('Datagrid Plugin: Func \'externalEdit\', Parameter \'row\' is incorrect!')
            return
        }
        
        if (typeof editOptions === 'undefined') {
            BJUI.debug('Datagrid Plugin: Func \'externalEdit\', Parameter \'editOptions\' is incorrect!')
            return
        }
        
        if (!$.isEmptyObject(editOptions)) {
            if (!data) {
                if (that.isDom) data = $tr.data('initData') || that.tools.setDomData($tr)
                else {
                    data_index = that.tools.getNoChildDataIndex($tr.index())
                    data = that.data[data_index]
                }
            }
            if (!editOptions.options.url || editOptions.options['datagrid.nourl']) {
                editOptions.options['datagrid.nourl'] = true
                editOptions.options.url = options.editUrl
            }
            
            editUrl = editOptions.options.url
            
            if (editUrl && !editUrl.isFinishedTm()) {
                if (!data || data.addFlag)
                    editUrl = editUrl.replace(/{\/?[^}]*}/g, '')
                else
                    editUrl = that.tools.replacePlh(editUrl, data)
                
                if (!editUrl.isFinishedTm()) {
                    BJUI.debug('Datagrid Plugin: Func \'externalEdit\', the property \'url\' of options \'editOptions\' is incorrect: '+ editUrl)
                } else {
                    editUrl = editUrl
                }
            }
            
            if (editUrl) {
                editOptions.options.url = editUrl
                type = editOptions.type
                
                if (typeof data === 'object' && data) {
                    if (editOptions.options.data)
                        $.extend(editOptions.options.data, data)
                    else
                        editOptions.options.data = $.extend({}, data)
                }
                
                for (var key in options.keys)
                    delete editOptions.options.data[key]
                
                if (!editOptions.options.id)
                    editOptions.options.id = 'datagrid-external-edit'+ (new Date().getTime())
                if (!editOptions.options.type)
                    editOptions.options.type = options.editType
                
                // onClose
                if (typeof options.extOnClose === 'undefined') {
                    options.extOnClose = (editOptions.options.onClose && editOptions.options.onClose.toFunc()) || false
                }
                // for dialog && navtab (if not save)
                editOptions.options.onClose = function() {
                    if ($tr.hasClass(that.classnames.tr_add))
                        that.cancelEdit($tr)
                    
                    if (typeof options.extOnClose !== 'undefined') {
                        if (options.extOnClose) {
                            options.extOnClose.apply(that)
                        }
                    }
                }
                
                var okCallback = function(json) {
                    var complete = false, returnData, fixedWidth = false
                    
                    if (editOptions.options.data['addFlag'] && that.data.length == 1)
                        that.needfixedWidth = true
                    if ($.type(json) === 'array') {
                        complete   = true
                        returnData = json[0]
                    } else if (typeof json === 'object') {
                        complete = true
                        returnData = json
                    }
                    
                    if (complete) {
                        $.extend(data, typeof returnData === 'object' && returnData)
                        
                        if (that.allData && that.allData[data.gridIndex]) {
                            $.extend(that.allData[data.gridIndex], data)
                        }
                        
                        // update allData for filter
                        if (that.oldAllData) that.oldAllData = that.allData.concat()
                        
                        // if add to the empty grid
                        /*if ($tr.hasClass(that.classnames.tr_add) && $tr.length === that.$tbody.find('> tr:not(.'+ that.classnames.tr_child +')').length && that.fixtedColumnWidthCount) {
                            that.fixedColumnWidth = true
                        }*/
                        
                        if (data.addFlag) data.addFlag = false
                        
                        that.dialogEditComplete($tr, data)
                        
                        if (type === 'dialog') {
                            if (editOptions.options.message)
                                BJUI.alertmsg('ok', editOptions.options.message)
                            if (typeof editOptions.options.closeCurrent === 'undefined' || editOptions.options.closeCurrent)
                                BJUI.dialog('close', editOptions.options.id)
                        }
                        else if (type === 'navtab')
                            BJUI.navtab('closeTab', editOptions.options.id)
                            
                        that.tools.afterSave($tr, data)
                        
                        // refresh child
                        if (data['refresh.datagrid.child']) {
                            var $child = $tr.data('bjui.datagrid.child')
                            
                            if ($child && $child.length)
                                $child.datagrid('refresh')
                            else
                                that.showChild($tr)
                        }
                        
                        /*if (fixedWidth) {
                            that.initFixedW = false
                            that.fixedWidth(true)
                        }*/
                    }
                }
                
                editOptions.options.onLoad = function($box) {
                    var $form = $box.find('form.datagrid-edit-form')
                    
                    if ($form && $form.length) {
                        $form = $form.first()
                        
                        $form
                            .removeAttr('okCallback')
                            .data('okCallback', $.proxy(okCallback, that))
                    }
                }
                
                if (type === 'dialog')
                    BJUI.dialog(editOptions.options)
                else if (type === 'navtab')
                    BJUI.navtab(editOptions.options)
                else if (type === 'div')
                    BJUI.ajax('doload', editOptions.options)
                
            }
        }
    }
    
    // Api - inline edit tr
    Datagrid.prototype.doEditRow = function(rows, type, isAdd) {
        if (!this.editInit) return
        
        var that = this, $trs, $editBtn, datas = []
        
        type = type || that.options.editMode
        
        if (typeof rows === 'object') {
            $trs = rows
        } else if (isNaN(rows)) {
            var $myTrs = that.$tbody.find('> tr:not(.'+ that.classnames.tr_child +')'), $editTrs, rows = rows.split(',')
            
            rows = rows.unique()
            rows.sort(function(a, b) {return a.trim() - b.trim()})
            
            $.each(rows, function(i, n) {
                var row = parseInt(n.trim(), 10), tr
                
                tr = $myTrs.eq(row)
                
                if (tr && tr.length) {
                    if (!$editTrs) $editTrs = tr
                    else $editTrs = $editTrs.add(tr)
                }
            })
            
            $trs = $editTrs
        } else if (!isNaN(rows)) {
            $trs = that.$tbody.find('> tr:not(.'+ that.classnames.tr_child +')').eq(rows)
        }
        
        if (!$trs.length) return
        
        $trs.each(function() {
            var $tr = $(this), data_index = $tr.index(), data
            
            data_index = that.tools.getNoChildDataIndex(data_index)
            
            if (that.isDom) data = $tr.data('initData') || tools.setDomData($tr)
            else data = that.data[data_index]
            
            datas.push(data)
        })
        
        if (!that.tools.beforeEdit($trs, datas)) {
            return
        }
        
        if (!that.options.editUrl) {
            BJUI.debug('Datagrid Plugin: Edit url is not set!')
            return
        }
        
        if (that.editOptions) {
            that.externalEdit($trs.last(), null, datas[$trs.length - 1])
        } else {
            $trs.each(function(i) {
                var $tr = $(this)
                
                $editBtn = $tr.find('> td.'+ that.classnames.s_edit +' button.bjui-datagrid-btn.edit')
                
                if (type != 'dialog') {
                    if ($editBtn.length) $editBtn.trigger('click', [datas[i]])
                    else that.inlineEdit($tr, isAdd, datas[i])
                } else {
                    that.dialogEdit($tr, isAdd, datas[i])
                    return false
                }
            })
        }
    }
    
    // Api - cancel edit
    Datagrid.prototype.doCancelEditRow = function(row) {
        var that = this, $trs
        
        if ($.type(row) === 'number') {
            $trs = this.$tbody.find('> tr').eq(row)
        } else {
            $trs = row
        }
        
        $trs.each(function() {
            var $tr = $(this), $cancelBtn = $tr.find('> td.'+ that.classnames.s_edit +' > button.bjui-datagrid-btn.cancel')
            
            if ($cancelBtn.length) {
                $cancelBtn.trigger('click')
            } else {
                that.cancelEdit($tr)
            }
        })
    }
    
    // Api - save edit tr
    Datagrid.prototype.doSaveEditRow = function(row) {
        var that = this, options = that.options, $tr
        
        if ($.type(row) === 'number') {
            $tr = this.$tbody.find('> tr').eq(row)
        } else if (row) {
            $tr = row
        } else {
            $tr = that.$tbody.find('> tr.'+ that.classnames.tr_edit)
        }
        
        if (!$tr.length) {
            that.$grid.alertmsg('info', BJUI.getRegional('datagrid.saveMsg'))
            return
        }
        if ($tr.length == 1) {
            if ($tr.hasClass(that.classnames.tr_edit))
                this.updateEdit($tr)
        } else {
            if (options.saveAll) {
                that.saveAll($tr)
            } else {
                $tr.each(function() {
                    that.updateEdit($(this))
                })
            }
        }
    }
    
    // Api - del tr
    Datagrid.prototype.delRows = function(rows) {
        var that  = this, options = that.options, keys = options.keys, beforeDelete = options.beforeDelete, confirmMsg = options.delConfirm, $trs
        
        if (beforeDelete) {
            if (typeof beforeDelete === 'string') beforeDelete = beforeDelete.toFunc()
            if (typeof beforeDelete === 'function') {
                if (!beforeDelete.call(this)) {
                    return
                }
            }
        }
        
        if (typeof rows === 'object') {
            $trs = rows
        } else if (isNaN(rows)) {
            var $myTrs = that.$tbody.find('> tr:not(.'+ that.classnames.tr_child +')'), $delTrs, rows = rows.split(',')
            
            rows = rows.unique()
            rows.sort(function(a, b) {return a.trim() - b.trim()})
            
            $.each(rows, function(i, n) {
                var tr = $myTrs.eq(parseInt(n.trim(), 10))
                
                if (tr && tr.length) {
                    if (!$delTrs) $delTrs = tr
                    else $delTrs = $delTrs.add(tr)
                }
            })
            
            $trs = $delTrs
        } else if (!isNaN(rows)) {
            $trs = this.$tbody.find('> tr:not(.'+ that.classnames.tr_child +')').eq(rows)
        }
        
        if (!$trs || !$trs.length) return
        
        var delEnd = function() {
            $trs.each(function() {
                var $tr = $(this), childUpdate = that.options.childUpdate, $parent = that.$element.data('bjui.datagrid.parent'),
                    updateParent = function($parent) {
                        $parent.closest('table').datagrid('updateRow', $parent)
                    }
                // update child parent
                if ($parent && childUpdate) {
                    if (typeof childUpdate === 'string') {
                        if (childUpdate.indexOf('all') !== -1 || childUpdate.indexOf('del') !== -1)
                            updateParent($parent)
                    } else {
                        updateParent($parent)
                    }
                }
                
                $tr.trigger('delete.bjui.datagrid.tr')
            })
            
            that.tools.afterDelete()
            
            if (options.height === 'auto')
                that.fixedHeight()
        }
        
        var doDel = function() {
            var $addTrs = $trs.filter('.'+ that.classnames.tr_add)
            
            if ($addTrs.length) {
                that.cancelEdit($addTrs)
                
                if (!$trs.not($addTrs).length)
                    return
            }
            
            // remote delete
            if (options.delUrl) {
                var postData = [], callback = options.delCallback
                
                $trs.not($addTrs).each(function() {
                    var $tr = $(this), index = $tr.index(), data, delData
                    
                    if (that.isDom) data = $tr.data('initData') || that.tools.setDomData($tr)
                    else data = that.data[that.tools.getNoChildDataIndex(index)]
                    
                    if (options.delPK) {
                        postData.push(data[options.delPK])
                    } else {
                        if (options.jsonPrefix) {
                            delData = {}
                            
                            $.each(data, function(name, value) {
                                if (!that.tools.isGridData(name))
                                    delData[options.jsonPrefix +'.'+ name] = value
                            })
                        } else {
                            delData = $.extend({}, data)
                            for (var key in keys)
                                delete delData[keys[key]]
                        }
                        
                        postData.push(delData)
                    }
                })
                
                if (typeof callback === 'string') callback = callback.toFunc()
                
                var type = options.delType, opts = {url:options.delUrl, data:(options.delPK ? [{ name:options.delPK, value:postData.join(',') }] : JSON.stringify(postData)), type:'POST', okCallback:callback || function(json) { delEnd() }}
                
                if (type && type === 'raw' && !options.delPK) {
                    opts.contentType = 'application/json'
                } else {
                    !options.delPK && (opts.data = {json:opts.data})
                    type && type !== 'raw' && (opts.type = type)
                }
                
                BJUI.ajax('doajax', opts)
            } else { // local delete
                delEnd()
            }
        }
        
        if (confirmMsg) {
            if (typeof confirmMsg !== 'string') confirmMsg = $trs.length == 1 ? BJUI.getRegional('datagrid.delMsg') : BJUI.getRegional('datagrid.delMsgM')
            
            that.$grid.alertmsg('confirm', confirmMsg, {
                okCall:function() {
                    doDel()
                }
            })
        } else {
            doDel()
        }
    }
    
    // inline edit
    Datagrid.prototype.inlineEdit = function($tr, isAdd, data) {
        if (!this.tools.beforeEdit($tr, data)) {
            return false
        }
        
        var that = this, options = that.options, tools = that.tools, columnModel = that.columnModel, $tds = $tr.find('> td'), tds_length = $tds.length, tr_index = $tr.index(), data_index = tr_index
        
        data_index = tools.getNoChildDataIndex(data_index)
        
        if (!data) {
            if (that.isDom) data = $tr.data('initData') || tools.setDomData($tr)
            else data = that.data[data_index]
        }
        
        if ($tr.hasClass(that.classnames.tr_edit)) return false
        if (!that.inputs || !that.inputs.length) tools.initEditInputs()
        
        $tr.addClass(that.classnames.tr_edit).data(that.datanames.changeData, {})
        if ($tr.data('validator')) $tr.validator('destroy') //remove old validate
        
        if (!options.inlineEditMult) {
            that.doCancelEditRow($tr.siblings('.'+ that.classnames.tr_edit))
        }
        
        that.$lastEditTr = $tr
        
        $tds.each(function(i) {
            var $td = $(this), op = columnModel[i], val = op && op.name && data[op.name], html = $td.html(), input = that.inputs[i], $input
            var onChange = function($el, $td, val) {
                var changeData = $tr.data(that.datanames.changeData), jsontype = op.jsontype, defaultVal = (typeof op.defaultVal === 'undefined') ? null : op.defaultVal
                
                switch (op.type) {
                case 'date':
                    $el
                        .change(function() {
                            $td.addClass(that.classnames.td_changed)
                            if ($el.val() == val) $td.removeClass(that.classnames.td_changed)
                            changeData[op.name] = $el.val()
                        })
                    
                    break
                case 'select':
                    $el.change(function() {
                        var value = $(this).val()
                        
                        $td.addClass(that.classnames.td_changed)
                        
                        if (value == String(val)) $td.removeClass(that.classnames.td_changed)
                        
                        if ($el.prop('multiple')) {
                            $.isArray(value) && (value = value.join(','))
                        } else if (jsontype) {
                            if (jsontype === 'boolean') {
                                value = Boolean(value)
                            } else if (jsontype === 'number') {
                                if (value.length)
                                    !isNaN(Number(value)) && (value = Number(value))
                                else
                                    value = null
                            }
                        }
                        
                        changeData[op.name] = value
                    })
                    
                    break
                case 'boolean':
                    $el.on('ifChanged', function() {
                        $td.toggleClass(that.classnames.td_changed)
                        
                        var checked = $(this).is(':checked')
                        
                        if (checked == val)
                            $td.removeClass(that.classnames.td_changed)
                        
                        changeData[op.name] = checked
                    })
                    
                    break
                case 'findgrid':
                    changeData[op.name] = $el.val()
                    
                    $el.change(function() {
                        var value = $(this).val()
                        
                        $td.addClass(that.classnames.td_changed)
                        
                        if (value == val)
                            $td.removeClass(that.classnames.td_changed)
                        if (jsontype && jsontype === 'number') {
                            if (value.length)
                                !isNaN(Number(value)) && (value = Number(value))
                            else
                                value = null
                        }
                        
                        changeData[op.name] = value
                    })
                    
                    $td.off('afterchange.bjui.findgrid').on('afterchange.bjui.findgrid', '[data-toggle="findgrid"]', function(e, data) {
                        var include = op.attrs && op.attrs['data-options'] && op.attrs['data-options']['include']
                        
                        if (include) {
                            $.each(include.split(','), function(i, n) {
                                var obj = n.trim().split(':'), name = obj[0], key = obj.length > 1 ? obj[1] : obj[0]
                                
                                data['data'] && (changeData[name] = data['data'][key])
                            })
                        }
                    })
                    
                    break
                case 'spinner':
                    $el.change(function() {
                        $td.addClass(that.classnames.td_changed)
                        if ($el.val() == val) $td.removeClass(that.classnames.td_changed)
                        changeData[op.name] = Number($el.val())
                    })
                    
                    break
                default:
                    $el.change(function() {
                        var value = $(this).val()
                        
                        $td.addClass(that.classnames.td_changed)
                        
                        if (value == val)
                            $td.removeClass(that.classnames.td_changed)
                        if (jsontype && jsontype === 'number') {
                            if (value.length)
                                !isNaN(Number(value)) && (value = Number(value))
                            else
                                value = null
                        }
                        
                        changeData[op.name] = value
                    })
                    
                    break
                }
                
                if (isAdd) {
                    if (op.type === 'boolean') {
                        defaultVal = Boolean(defaultVal)
                        changeData[op.name] = defaultVal
                        $el.prop('checked', defaultVal)
                    } else {
                        if (defaultVal != null) {
                            if ($el.isTag('select') && $el.prop('multiple')) {
                                $el.val($.isArray(defaultVal) ? defaultVal : defaultVal.split(','))
                            } else {
                                $el.val(String(defaultVal))
                            }
                            if (jsontype) {
                                if (jsontype === 'number') {
                                    if (defaultVal.length)
                                        !isNaN(Number(defaultVal)) && (defaultVal = Number(defaultVal))
                                    else
                                        defaultVal = null
                                }
                                else if (jsontype === 'boolean')
                                    defaultVal = Boolean(defaultVal)
                            }
                            
                            changeData[op.name] = defaultVal
                        } else {
                            if (($el.isTag('select') && !$el.prop('multiple'))) {
                                var $clone = $el.clone().appendTo('body'), val = $clone.val()
                                
                                changeData[op.name] = val
                                $clone.remove()
                            }
                        }
                    }
                } else if (jsontype) {
                    $el.trigger('change')
                }
            }
            
            $td.data(that.datanames.td_html, html)
            
            if (isAdd) {
                if (!op.add) input = ''
            } else {
                if (data.addFlag) data.addFlag = false
                if (!op.edit) input = ''
            }
            
            if (input) {
                $input = $(input)
                
                if (typeof val === 'undefined' || val === 'null' || val === null)
                    val = ''
                
                if (op.type === 'boolean')
                    $input.prop('checked', val)
                else if (op.type === 'findgrid')
                    $input.data('context', $tr).val(String(val))
                else {
                    $input.val(String(val))
                    
                    if ($input.isTag('select') && $input.prop('multiple') && val && !$.isArray(val)) {
                        $input.val(val.split(','))
                    }
                }
                
                if (isAdd) {
                    if (op.addAttrs && typeof op.addAttrs === 'object') {
                        $.each(op.addAttrs, function(i, n) {
                            $input.attr(i, n)
                        })
                    }
                } else {
                    if (op.editAttrs && typeof op.editAttrs === 'object') {
                        $.each(op.editAttrs, function(i, n) {
                            $input.attr(i, n)
                        })
                    }
                }
                
                $td
                    .empty()
                    .append($input)
                    .addClass(that.classnames.td_edit)
                
                if (that.treeColumn && that.treeColumn === op) {
                    var treeInput = that.tools.createTreePlaceholder(data, '')
                    
                    $td.attr('align', 'left').html(treeInput)
                    
                    $input.appendTo($td.find('.datagrid-tree-title'))
                }
                
                onChange($input, $td, val)
                
                if (op.locked) {
                    var $lockTr = that.$lockTbody.find('tr:eq('+ tr_index +')')
                    var $lockTd = $lockTr.find('> td:eq('+ op.lockIndex +')')
                    
                    $td.clone().html(html).insertAfter($td)
                    $td.show().insertAfter($lockTd).initui()
                    $lockTd.remove()
                }
            }
            
            if (!--tds_length) {
                $tr
                    .initui()
                    .validator({
                        msgClass : 'n-bottom',
                        theme    : 'red_bottom_effect_grid'
                    })
            }
        })
    }
    
    Datagrid.prototype.saveAll = function($trs) {
        var that = this, options = that.options, keys = options.keys, callback = options.editCallback, $tr, data, data_index, datas = [], changeData, tempData, postData = [], returnData = [], len = $trs && $trs.length
        
        if (!$trs || $trs.length) {
            $trs = that.$tbody.find('> tr.'+ that.classnames.tr_edit)
            len  = $trs.length
        }
        
        if (!len) return
        
        $trs.each(function() {
            $tr = $(this)
            
            data_index = that.tools.getNoChildDataIndex($tr.index())
            data = that.isDom ? $tr.data('initData') : that.data[data_index]
            datas.push(data)
            
            $tr.isValid(function(v) {
                if (v) {
                    // Update data
                    changeData = $tr.data(that.datanames.changeData)
                    $.extend(data, changeData)
                    // Specification post data
                    if (options.jsonPrefix) {
                        tempData = {}
                        
                        $.each(data, function(name, value) {
                            if (!that.tools.isGridData(name))
                                tempData[options.jsonPrefix +'.'+ name] = value
                        })
                    } else {
                        tempData = $.extend({}, data)
                        
                        for (var key in keys)
                            delete tempData[keys[key]]
                    }
                    
                    len --
                    postData.push(tempData)
                } else {
                    postData = []
                    
                    return false
                }
            })
        })
        
        // do save
        if (!len) {
            // Callback
            if (callback) {
                callback = callback.toFunc()
            } else {
                callback = function(json) {
                    if ($.type(json) === 'array') {
                        returnData = json
                    } else if (typeof json === 'object') {
                        returnData.push(json)
                    }
                    
                    // if add to the empty grid
//                    if ($trs.filter('.'+ that.classnames.tr_add).length === that.$tbody.find('> tr:not(.'+ that.classnames.tr_child +')').length && that.fixtedColumnWidthCount) {
//                        that.fixedColumnWidth = true
//                    }
                    
                    $trs.each(function(i) {
                        $tr = $(this)
                        data_index = $tr.index()
                        
                        if (that.columnModel[0] === that.childColumn)
                            data_index = data_index / 2
                        
                        data = that.isDom ? $tr.data('initData') : that.data[data_index]
                        
                        $.extend(data, typeof returnData[i] === 'object' && returnData[i])
                        
                        if (that.allData && that.allData[data.gridIndex]) {
                            $.extend(that.allData[data.gridIndex], data)
                        }
                        
                        // update allData for filter
                        if (that.oldAllData) that.oldAllData = that.allData.concat()
                        
                        that.inlineEditComplete($tr, data)
                    })
                    
                    that.tools.afterSave($trs, postData)
                }
            }
            if (that.options.saveLocal) {
                callback(postData)
            } else {
                // Do ajax
                if (that.tools.beforeSave($trs, datas)) {
                    var type = options.editType, opts = {url:options.editUrl, data:JSON.stringify(postData), type:'POST', okCallback:callback}
                    
                    if (type && type === 'raw') {
                        opts.contentType = 'application/json'
                    } else {
                        opts.data = {json:opts.data}
                        type && (opts.type = type)
                    }
                    
                    BJUI.ajax('doajax', opts)
                }
            }
        }
    }
    
    // update - inline edit
    Datagrid.prototype.updateEdit = function($tr, $btn) {
        var that = this, options = that.options, keys = options.keys, callback = options.editCallback, data, datas = [], changeData, tempData, postData = [], returnData, data_index = $tr.index()
        
        data_index = that.tools.getNoChildDataIndex(data_index)
        
        if (that.isDom) data = $tr.data('initData')
        else data = that.data[data_index]
        
        if ($tr.hasClass(that.classnames.tr_edit)) {
            // validate
            $tr.isValid(function(v) {
                if (v) {
                    // Update data
                    changeData = $tr.data(that.datanames.changeData)
                    $.extend(data, changeData)
                    // Specification post data
                    if (options.jsonPrefix) {
                        tempData = {}
                        $.each(data, function(name, value) {
                            if (!that.tools.isGridData(name))
                                tempData[options.jsonPrefix +'.'+ name] = value
                        })
                    } else {
                        tempData = $.extend({}, data)
                        
                        for (var key in keys) {
                            delete tempData[keys[key]]
                        }
                    }
                    // Callback
                    if (callback) {
                        callback = callback.toFunc()
                    } else {
                        callback = function(json) {
                            if ($.type(json) === 'array') {
                                returnData = json[0]
                            } else if (typeof json === 'object') {
                                returnData = json
                            }
                            
                            $.extend(data, typeof returnData === 'object' && returnData)
                            
                            if (that.allData && that.allData[data.gridIndex]) {
                                $.extend(that.allData[data.gridIndex], data)
                            }
                            
                            // update allData for filter
                            if (that.oldAllData) that.oldAllData = that.allData.concat()
                            
                            // if add to the empty grid
//                            if ($tr.hasClass(that.classnames.tr_add) && $tr.length === that.$tbody.find('> tr:not(.'+ that.classnames.tr_child +')').length && that.fixtedColumnWidthCount) {
//                                that.fixedColumnWidth = true
//                            }
                            
                            that.inlineEditComplete($tr, data, $btn)
                            that.tools.afterSave($tr, data)
                        }
                    }
                    // Do ajax
                    datas.push(data)
                    if (that.tools.beforeSave($tr, datas)) {
                        postData.push(tempData)
                        
                        var type = options.editType, opts = {url:options.editUrl, data:JSON.stringify(postData), type:'POST', okCallback:callback}
                        
                        if (type && type === 'raw') {
                            opts.contentType = 'application/json'
                        } else {
                            opts.data = {json:opts.data}
                            type && (opts.type = type)
                        }
                        
                        BJUI.ajax('doajax', opts)
                    }
                }
            })
        }
    }
    
    /* cancel - inline edit */
    Datagrid.prototype.cancelEdit = function($trs) {
        var that = this, columnModel = that.columnModel
        
        $trs.each(function() {
            var $tr = $(this), tr_index = $tr.index(), data_index = tr_index
            
            if ($tr.hasClass(that.classnames.tr_edit)) {
                $tr
                    .removeClass(that.classnames.tr_edit)
                    .find('> td.'+ that.classnames.td_edit).each(function() {
                        var $td = $(this), td_index = $td.index(), model = columnModel[td_index], html = $td.data(that.datanames.td_html)
                        
                        $td.removeClass(that.classnames.td_edit).removeClass(that.classnames.td_changed).html(html)
                        if (model.locked) {
                            var $lockTr = that.$lockTbody.find('tr:eq('+ tr_index +')')
                            var $lockTd = $lockTr.find('> td:eq('+ model.lockIndex +')')
                            
                            html = $lockTd.data(that.datanames.td_html)
                            
                            $lockTr.removeClass(that.classnames.tr_edit)
                            $lockTd.removeClass(that.classnames.td_edit).removeClass(that.classnames.td_changed).html(html)
                        }
                    })
            }
            
            if ($tr.hasClass(that.classnames.tr_add)) {
                data_index = that.tools.getNoChildDataIndex(data_index)
                
                if (!that.isDom) {
                    that.allData = that.allData.remove(that.data[data_index].gridIndex)   // remove data in allData
                    that.data    = that.data.remove(data_index)
                    
                    that.tools.updateGridIndex()
                    that.$element.data('allData', that.allData)
                }
                
                if ($tr.next().hasClass(that.classnames.tr_child)) {
                    $tr.next().remove()
                    that.$lockTbody && that.$lockTbody.find('> tr:eq('+ tr_index +')').next().remove()
                }
                
                that.$lockTbody && that.$lockTbody.find('> tr:eq('+ tr_index +')').remove()
                $tr.remove()
                
                that.tools.createNoDataTr()
                
                if (that.options.height === 'auto')
                    that.fixedHeight()
            }
        })
    }
    
    // inline editComplete
    Datagrid.prototype.inlineEditComplete = function($tr, trData, $btn) {
        var that = this, columnModel = that.columnModel, tr_index = $tr.index(), $tds = $tr.find('> td'), hasLinenumber = false, $lockTr = that.$lockTbody && that.$lockTbody.find('> tr:eq('+ tr_index +')')
        var tdTemplate = that.options.tdTemplate, tempData = $.extend({}, trData)
        
        $.each(columnModel, function(i, n) {
            if (n === that.linenumberColumn) hasLinenumber = true
            if (that.tools.isGridModel(n)) return true
            
            var label = n.name ? trData[n.name] : '', render_label, $td = $tds.eq(n.index)
            
            if (that.isTemplate)
                $td = null
            if (typeof label === 'undefined' || label === 'null' || label === null)
                label = ''
            
            $td && ($td.text(label).removeClass(that.classnames.td_edit).removeClass(that.classnames.td_changed))
            
            if (n.render && typeof n.render === 'function') {
                if (n.items) {
                    render_label = n.render.call(that, label, trData, n.items)
                    tempData[n.name] = render_label
                    $td && $td.html(render_label)
                } else {
                    render_label = n.render.call(that, label, trData)
                    tempData[n.name] = render_label
                    $td && $td.html(render_label)
                }
            } else if (n.items) {
                render_label = Datagrid.renderItem.call(that, label, trData, n.items)
                tempData[n.name] = render_label
                $td && $td.html(render_label)
            }
            
            if (that.options.isTree && n.hasTree) {
                $td && ($td.attr('align', 'left').addClass('datagrid-tree-td').html(that.tools.createTreePlaceholder(trData, (render_label || label))))
            }
            
            if (n.locked && $lockTr) {
                var $lockTd = $lockTr.find('> td:eq('+ n.lockIndex +')')
                
                $lockTd.removeClass(that.classnames.td_changed).html($td.html())
            }
        })
        
        if (that.isTemplate) {
            if (typeof tdTemplate === 'function')
                tdTemplate = tdTemplate.apply(that, [trData])
            
            tdTemplate = that.tools.replacePlh4Template(tdTemplate, tempData)
            
            $tr.find('> td.datagrid-template-td').html(tdTemplate)
        }
        
        $tr.removeClass(that.classnames.tr_edit).initui()
        if ($lockTr)
            $lockTr.removeClass(that.classnames.tr_edit).initui()
        
        if (!$btn) $btn = $tds.filter('.'+ that.classnames.s_edit).find('button.update')
        if ($btn && $btn.length)
            $btn.trigger('bjui.datagrid.update.tr')
        
        if ($tr.hasClass(that.classnames.tr_add)) {
            $tr.removeClass(that.classnames.tr_add)
            $tr.find('> td.'+ that.classnames.s_edit).removeData('isAdd')
            
            // update linenumber
            if (hasLinenumber) {
                that.tools.updateLinenumber()
            }
            
            // tree
            if (that.options.isTree) {
                var $parentTr = trData[that.options.keys.treePTr], parentData = trData[that.options.keys.treePData], keys = that.options.treeOptions.keys, $treePTd
                
                if ($parentTr && parentData) {
                    if (!parentData[keys.isParent]) {
                        parentData[keys.isParent] = true
                        $treePTd = $parentTr.find('> td.datagrid-tree-td')
                        $treePTd.html(that.tools.createTreePlaceholder(parentData, $treePTd.find('span.datagrid-tree-title').html()))
                    }
                    if (!parentData[keys.childLen]) {
                        parentData[keys.childLen] = 1
                    } else {
                        parentData[keys.childLen] ++
                    }
                    
                    $tr.data(that.options.keys.treePTr).data('child', parentData[keys.childLen]).attr('data-child', parentData[keys.childLen])
                }
                
                $tr.addClass('datagrid-tree-tr datagrid-tree-level-'+ trData[keys.level]).attr('data-child', 0).attr('data-level', trData[keys.level])
            }
            
            // child
            $tr.next('.'+ that.classnames.tr_child).remove()
            that.tools.createChildTr($tr, trData)
        }
    }
    
    // inline edit
    Datagrid.prototype.dialogEdit = function($tr, isAdd, data) {
        if (!this.tools.beforeEdit($tr, data)) {
            return false
        }
        
        var that = this, options = that.options, tools = that.tools, columnModel = that.columnModel, tr_index = $tr.index(), data_index = tr_index, $dialog, $form, html = '', title
        
        if (!data) {
            data_index = tools.getNoChildDataIndex(data_index)
            
            if (that.isDom) data = $tr.data('initData') || tools.setDomData($tr)
            else data = that.data[data_index]
        }
        
        if (!that.inputs || !that.inputs.length) tools.initEditInputs()
        
        title = options.gridTitle || 'datagrid'
        
        if (isAdd) {
            title += ' - '+ BJUI.getRegional('datagrid.add')
        } else {
            if (data.addFlag) data.addFlag = false
            title += ' - '+ BJUI.getRegional('datagrid.edit')
        }
        
        $dialog = $('<div><div class="bjui-pageContent"></div><div class="bjui-pageFooter"></div></div>')
        $form   = $('<form class="datagrid-dialog-edit-form"></form>')
        
        var onChange = function($tr, $form, $el, model) {
            var changeData = $tr.data(that.datanames.changeData), jsontype = model.jsontype, defaultVal = (typeof model.defaultVal === 'undefined') ? null : model.defaultVal
            
            switch (model.type) {
            case 'date':
                $el.change(function() {
                    changeData[model.name] = $(this).val()
                })
                
                break
            case 'select':
                $el.change(function() {
                    var $element = $(this), val = $element.val(), multiple = $element.prop('multiple')
                    
                    if (multiple && $.isArray(val)) {
                        val = val.join(',')
                    }
                    if (!multiple && jsontype) {
                        if (jsontype === 'boolean') {
                            val = Boolean(val)
                        } else if (jsontype === 'number') {
                            if (val.length)
                                !isNaN(Number(val)) && (val = Number(val))
                            else
                                val = null
                        }
                    }
                    
                    changeData[model.name] = val
                })
                
                break
            case 'boolean':
                $el.on('ifChanged', function() {
                    changeData[model.name] = $(this).is(':checked')
                })
                
                break
            case 'findgrid':
                $el.change(function() {
                    var val = data.value
                    
                    if (jsontype && jsontype === 'number') {
                        if (val.length)
                            !isNaN(Number(val)) && (val = Number(val))
                        else
                            val = null
                    }
                    
                    changeData[model.name] = $(this).val()
                })
                
                $form.off('afterchange.bjui.findgrid').on('afterchange.bjui.findgrid', '[data-toggle="findgrid"]', function(e, data) {
                    var include = model.attrs && model.attrs['data-options'] && model.attrs['data-options']['include']
                    
                    if (include) {
                        $.each(include.split(','), function(i, n) {
                            var obj = n.trim().split(':'), name = obj[0], key = obj.length > 1 ? obj[1] : obj[0]
                            
                            data['data'] && (changeData[name] = data['data'][key])
                        })
                    }
                })
                
                break
            case 'spinner':
                $el.change(function() {
                    changeData[model.name] = Number($(this).val())
                })
                
                break
            default:
                $el.change(function() {
                    var val = $(this).val()
                    
                    if (jsontype && jsontype === 'number') {
                        if (val.length)
                            !isNaN(Number(val)) && (val = Number(val))
                        else
                            val = null
                    }
                    
                    changeData[model.name] = val
                })
                
                break
            }
            
            if (isAdd) {
                if (model.type === 'boolean') {
                    defaultVal = Boolean(defaultVal)
                    changeData[model.name] = defaultVal
                    $el.prop('checked', defaultVal)
                } else {
                    if (defaultVal != null) {
                        if ($el.isTag('select') && $el.prop('multiple')) {
                            $el.val($.isArray(defaultVal) ? defaultVal : defaultVal.split(','))
                        } else {
                            $el.val(String(defaultVal))
                        }
                        if (jsontype) {
                            if (jsontype === 'number')
                                !isNaN(Number(defaultVal)) && (defaultVal = Number(defaultVal))
                            else if (jsontype === 'boolean')
                                defaultVal = Boolean(defaultVal)
                        }
                        
                        changeData[model.name] = defaultVal
                    } else {
                        //($el.isTag('select') && !$el.prop('multiple')) && (changeData[model.name] = $el.val())
                        if (($el.isTag('select') && !$el.prop('multiple'))) {
                            var $clone = $el.clone().appendTo('body'), val = $clone.val()
                            
                            changeData[model.name] = val
                            $clone.remove()
                        }
                    }
                }
            } else if (jsontype) {
                $el.trigger('change')
            }
        }
        
        var onLoad = function($dialog) {
            var $form   = $dialog.find('form.datagrid-dialog-edit-form'),
                $btns   = $dialog.find('div.bjui-pageFooter button'),
                $prev   = $btns.first(),
                $next   = $btns.eq(1),
                $cancel = $btns.eq(2),
                $save   = $btns.last(),
                trindex, dataindex
            
            var createForm = function(data, $form, $tr) {
                $form.empty()
                if (!$tr.data(that.datanames.changeData)) $tr.data(that.datanames.changeData, {})
                
                if ($form.data('validator')) $form.validator('destroy')
                
                $.each(columnModel, function(i, n) {
                    if (!n.name || that.tools.isGridModel(n)) return true
                    
                    var input = that.inputs[i], $input, $p = $('<p></p>'), id = 'datagrid-dialog-edit-column-'+ i, val = data[n.name]
                    
                    if (n.hide) $p.addClass('hide')
                    if (isAdd) {
                        if (!n.add) input = ''
                    } else {
                        if (!n.edit) input = ''
                    }
                    
                    if (typeof val === 'undefined' || val === 'null' || val === null)
                        val = ''
                    
                    if (input) {
                        $input = $(input).attr('id', id)
                        if ($input.isTag('select')) $input.attr('data-width', 'auto')
                        else if (!$input.isTag('checkbox')) $input.attr('size', 30)
                        
                        if (n.type === 'boolean') {
                            $input.prop('checked', val)
                        } else if (n.type === 'findgrid') {
                            $input.val(String(val)).data('context', $form)
                        } else {
                            $input.val(String(val))
                        }
                        
                        if ($input.isTag('select') && $input.prop('multiple') && val && !$.isArray(val)) {
                            $input.val(val.split(','))
                        }
                        
                        if (isAdd) {
                            if (n.addAttrs && typeof n.addAttrs === 'object') {
                                $.each(n.addAttrs, function(k, v) {
                                    $input.attr(k, v)
                                })
                            }
                        } else {
                            if (n.editAttrs && typeof n.editAttrs === 'object') {
                                $.each(n.editAttrs, function(k, v) {
                                    $input.attr(k, v)
                                })
                            }
                        }
                    } else if (!isAdd) {
                        if (!n.edit)
                            input = val
                    }
                    
                    $p
                        .append('<label class="control-label x120" for="'+ id +'">'+ n.label +'：</label>')
                        .append($('<span class="datagrid-dialog-column-span"></span>').append($input || input))
                        .appendTo($form)
                    
                    if ($input)
                        onChange($tr, $form, $input, n)
                })
                
                $form
                    .initui()
                    .validator({
                        msgClass : 'n-bottom',
                        theme    : 'red_bottom_effect_grid'
                    })
            }
            
            if ($form.is(':empty')) createForm(data, $form, $tr)
            
            trindex = $tr.index()
            
            if (that.columnModel[0] === that.childColumn)
                trindex = trindex * 2
            
            if (!trindex) $prev.addClass('disabled')
            if (trindex == that.data.length - 1) $next.addClass('disabled')
            
            $prev.click(function() {
                var $tr_prev = $tr.prev(), data
                
                if (that.options.hasChild && that.options.childOptions)
                    $tr_prev = $tr_prev.prev()
                if ($tr_prev.length) {
                    dataindex = that.tools.getNoChildDataIndex($tr_prev.index())
                        
                    if (that.isDom) {
                        data = $tr_prev.data('initData') || tools.setDomData($tr_prev)
                    } else {
                        data = that.data[dataindex]
                    }
                    
                    $tr = $tr_prev
                    createForm(data, $form, $tr)
                    $next.removeClass('disabled')
                    
                    if (!$tr_prev.prev().length) $prev.addClass('disabled')
                } else {
                    $prev.addClass('disabled')
                }
            })
            
            $next.click(function() {
                var $tr_next = $tr.next(), data, $next_next
                
                if (that.options.hasChild && that.options.childOptions)
                    $tr_next = $tr_next.next()
                if ($tr_next.length) {
                    $next_next = $tr_next.next()
                    dataindex  = that.tools.getNoChildDataIndex($tr_next.index())
                    
                    if (that.options.hasChild && that.options.childOptions)
                        $next_next = $next_next.length && $next_next.next()
                    if (that.isDom) {
                        data = $tr_next.data('initData') || tools.setDomData($tr_next)
                    } else {
                        data = that.data[dataindex]
                    }
                    
                    $tr = $tr_next
                    createForm(data, $form, $tr)
                    $form.initui()
                    $prev.removeClass('disabled')
                    
                    if (!$next_next || !$next_next.length) $next.addClass('disabled')
                } else {
                    $next.addClass('disabled')
                }
            })
            
            $save.click(function() {
                var changeData, data, datas = [], postData, returnData, callback = options.editCallback
                
                dataindex = that.tools.getNoChildDataIndex($tr.index())
                
                if (that.isDom) data = $tr.data('initData')
                else data = that.data[dataindex]
                
                $form.isValid(function(v) {
                    if (v) {
                        changeData = $tr.data(that.datanames.changeData)
                        $.extend(data, changeData)
                        
                        if (options.jsonPrefix) {
                            postData = {}
                            $.each(data, function(name, value) {
                                if (!that.tools.isGridData(name))
                                    postData[options.jsonPrefix +'.'+ name] = value
                            })
                        } else {
                            postData = $.extend({}, data)
                            
                            for (var key in that.options.keys)
                                delete postData[that.options.keys[key]]
                        }
                        
                        // Callback
                        if (callback) {
                            callback = callback.toFunc()
                        } else {
                            callback = function(json) {
                                if ($.type(json) === 'array') {
                                    returnData = json[0]
                                } else if (typeof json === 'object') {
                                    returnData = json
                                }
                                
                                $.extend(data, typeof returnData === 'object' && returnData)
                                
                                // if add to the empty grid
//                                if ($tr.hasClass(that.classnames.tr_add) && $tr.length === that.$tbody.find('> tr:not(.'+ that.classnames.tr_child +')').length && that.fixtedColumnWidthCount) {
//                                    that.fixedColumnWidth = true
//                                }
                                
                                that.dialogEditComplete($tr, data)
                                that.$grid.dialog('close', 'datagrid-dialog-edit')
                                that.tools.afterSave($tr, data)
                            }
                        }
                        
                        // Do ajax
                        datas.push(data)
                        if (that.tools.beforeSave($tr, datas)) {
                            var type = options.editType, opts = {url:options.editUrl, data:JSON.stringify(postData), type:'POST', okCallback:callback}
                            
                            if (type && type === 'raw') {
                                opts.contentType = 'application/json'
                            } else {
                                opts.data = {json:opts.data}
                                type && (opts.type = type)
                            }
                            
                            BJUI.ajax('doajax', opts)
                        }
                    }
                })
            })
            
            $cancel.click(function() {
                that.$grid.dialog('close', 'datagrid-dialog-edit')
            })
        }
        
        var onClose = function() {
            var addRemove = false
            
            that.$tbody.find('> tr.'+ that.classnames.tr_add).each(function() {
                var $tr = $(this), trindex = $tr.index(), dataindex = trindex
                
                dataindex = that.tools.getNoChildDataIndex(dataindex)
                
                that.data = that.data.remove(dataindex)
                
                if ($tr.next().hasClass(that.classnames.tr_child)) {
                    $tr.next().remove()
                    that.$lockTbody && that.$lockTbody.find('> tr:eq('+ trindex +')').next().remove()
                }
                
                that.$lockTbody && that.$lockTbody.find('> tr:eq('+ trindex +')').remove()
                $tr.remove()
                
                addRemove = true
            })
            
            if (addRemove && that.options.height === 'auto')
                that.fixedHeight()
        }
        
        $dialog.find('> div:first')
            .append($form)
            .next().append(BJUI.doRegional(FRAG.gridDialogEditBtns, that.regional))
        
        var dialog_options = $.extend({}, {id:'datagrid-dialog-edit', fresh:true, target:$dialog[0], width:520, height:400, mask:true, title:title, onLoad:onLoad, onClose:onClose}, (typeof options.editDialogOp === 'object' && options.editDialogOp))
        
        that.$grid.dialog(dialog_options)
    }
    
    // dialog editComplete
    Datagrid.prototype.dialogEditComplete = function($tr, trData) {
        var that = this, columnModel = that.columnModel, tr_index = $tr.index(), $tds = $tr.find('> td'), hasLinenumber = false, $trs = that.$tbody.find('> tr'), $lockTr = that.$lockTbody && that.$lockTbody.find('> tr:eq('+ tr_index +')')
        var tdTemplate = that.options.tdTemplate, tempData = $.extend({}, trData), treeOptions = that.options.treeOptions, treePData, treePTr, treePTd
        
        $.each(columnModel, function(i, n) {
            if (n === that.linenumberColumn) hasLinenumber = true
            if (that.tools.isGridModel(n)) return true
            
            var label = n.name ? trData[n.name] : '', render_label, $td = $tds.eq(n.index)
            
            if (that.isTemplate)
                $td = null
            if (typeof label === 'undefined' || label === 'null' || label === null)
                label = ''
            
            $td && ($td.text(label).removeClass(that.classnames.td_edit).removeClass(that.classnames.td_changed))
            
            if (n.render && typeof n.render === 'function') {
                if (n.items) {
                    render_label = n.render.call(that, label, trData, n.items)
                    tempData[n.name] = render_label
                    $td && $td.html(render_label)
                } else {
                    render_label = n.render.call(that, label, trData)
                    tempData[n.name] = render_label
                    $td && $td.html(render_label)
                }
            } else if (n.items) {
                render_label = Datagrid.renderItem.call(that, label, trData, n.items)
                tempData[n.name] = render_label
                $td && $td.html(render_label)
            }
            
            if (that.options.isTree && n.hasTree) {
                $td && ($td.attr('align', 'left').addClass('datagrid-tree-td').html(that.tools.createTreePlaceholder(trData, (render_label || label))))
            }
            
            if (n.locked && $lockTr && $td) {
                var $lockTd = $lockTr.find('> td:eq('+ n.lockIndex +')')
                
                $lockTd.removeClass(that.classnames.td_edit).removeClass(that.classnames.td_changed).html($td.html())
            }
        })
        
        if (that.isTemplate) {
            if (typeof tdTemplate === 'function')
                tdTemplate = tdTemplate.apply(that, [trData])
            
            tdTemplate = that.tools.replacePlh4Template(tdTemplate, tempData)
            
            $tr.find('> td.datagrid-template-td').html(tdTemplate)
        }
        
        $tr.initui()
        if ($lockTr)
            $lockTr.initui()
        
        if ($tr.hasClass(that.classnames.tr_add)) {
            $tr.removeClass(that.classnames.tr_add)
            
            // update linenumber
            if (hasLinenumber) {
                that.tools.updateLinenumber()
            }
            
            // tree
            if (that.options.isTree) {
                var $parentTr = trData[that.options.keys.treePTr], parentData = trData[that.options.keys.treePData], keys = that.options.treeOptions.keys, $treePTd
                
                if ($parentTr && parentData) {
                    if (!parentData[keys.isParent]) {
                        parentData[keys.isParent] = true
                        $treePTd = $parentTr.find('> td.datagrid-tree-td')
                        $treePTd.html(that.tools.createTreePlaceholder(parentData, $treePTd.find('span.datagrid-tree-title').html()))
                    }
                    if (!parentData[keys.childLen]) {
                        parentData[keys.childLen] = 1
                    } else {
                        parentData[keys.childLen] ++
                    }
                    
                    $tr.data(that.options.keys.treePTr).data('child', parentData[keys.childLen]).attr('data-child', parentData[keys.childLen])
                }
                
                $tr.addClass('datagrid-tree-tr datagrid-tree-level-'+ trData[keys.level]).attr('data-child', 0).attr('data-level', trData[keys.level])
            }
            
            // child
            $tr.next('.'+ that.classnames.tr_child).remove()
            that.tools.createChildTr($tr, trData)
        }
    }
    
    /* resize */
    Datagrid.prototype.resizeGrid = function() {
        var that = this, $target = that.$grid.getPageTarget(), parentW, parentH
        var _resizeGrid = function() {
            var ww = that.$grid.width(), $headDiv = that.$tableH.next('.datagrid-thead-dialog-div'),
                newTemplate = (that.options.tdTemplate && that.options.templateWidth) && that.options.templateWidth > ww
            
            // tdtemplate
            if (newTemplate !== that.isTemplate) {
                that.isTemplate = newTemplate
                that.tools.coverTemplate()
                return
            }
            
            if (String(that.options.width).endsWith('%') && (that.options.flowLayoutWidth && ww < that.options.flowLayoutWidth) || that.options.dialogFilterW && ww < that.options.dialogFilterW) {
                if (!that.isTemplate && !that.options.dialogFilterW)
                    that.$grid.addClass('datagrid-flowlayout')
                
                that.$tableH.hide()
                
                /*if (that.options.dialogFilterW && that.isTemplate) {
                    that.$colgroupB.hide()
                }*/
                
                if (!$headDiv.length) {
                    that.$tableH.after('<div class="datagrid-thead-dialog-div" style="padding:5px;"><button type="button" class="btn btn-orange datagrid-thead-dialog-view">'+ BJUI.getRegional('datagrid.fAndS') +'</button><span class="datagrid-thead-dialog-filter-msg"><span class="msg-sort"></span><span class="msg-filter"></span></span></div>')
                } else {
                    $headDiv.show()
                }
                
                if (!that.$headFilterUl)
                    that.filterInThead(true)
                
                that.$grid.off('click.datagrid.thead.view').on('click.datagrid.thead.view', '.datagrid-thead-dialog-view', function(e) {
                    BJUI.dialog({id:'datagrid-thead-view', html:'<div class="bjui-pageContent"></div><div class="bjui-pageFooter"><ul><li><button type="button" class="btn btn-close">关闭</button></li></ul></div>', width:360, height:300, title:'datagrid - thead - columns', 
                        onLoad: function($dialog) {
                            that.$headFilterUl.show().appendTo($dialog.find('.bjui-pageContent'))
                        },
                        beforeClose:function($dialog) {
                            that.$headFilterUl.hide().appendTo(that.$grid)
                            return true
                        }
                    })
                })
            } else {
                that.$grid.removeClass('datagrid-flowlayout')
                that.$tableH.show()
                $headDiv.hide()
                
                if (that.$colgroupB.is(':hidden')) {
                    that.$colgroupB.show()
                }
            }
            
            if (that.initFixedW && String(that.options.width).endsWith('%')) {
                parentW = that.$grid.parent().width()
                that.fixedWidth()
                
                if (that.options.hasChild && that.options.childOptions) {
                    that.$tbody.find('> tr.'+ that.classnames.tr_child +':visible').each(function() {
                        var $child = $(this), $tr = $child.prev(), $table = $tr.data('bjui.datagrid.child')
                        
                        if ($table && $table.length) {
                            $table.datagrid('fixedWidth')
                        }
                    })
                }
            }
            
            if (String(that.options.height).endsWith('%')) {
                that.tools.setBoxbH()
            }
        }
        
        // for tab
        $('a[data-toggle="tab"]').on('shown.bs.tab', $.proxy(function(e) {
            if (!that.$element.data('bjui.datagrid.init.tab')) {
                var $target = $(e.target), $box = $target.data('target'), href = $target.attr('href')
                
                if (!$box)
                    $box = $(href)
                
                if ($box && $box.length) {
                    if ($box.find(that.$element).length) {
                        that.$element.data('bjui.datagrid.init.tab', true)
                        that.$element.datagrid('fixedHeight')
                    }
                }
            }
        }, that))
        
        $(window).on(BJUI.eventType.resizeGrid, $.proxy(_resizeGrid, that))
    }
    
    
    // DATAGRID PLUGIN DEFINITION
    // =======================
    
    function Plugin(option) {
        var args     = arguments,
            property = option
        
        return this.each(function () {
            var $this   = $(this),
                options = $.extend(true, {}, Datagrid.DEFAULTS, typeof option === 'object' && option),
                data    = $this.data('bjui.datagrid')
            
            if (!data) $this.data('bjui.datagrid', (data = new Datagrid(this, options)))
            if (typeof property === 'string' && $.isFunction(data[property])) {
                [].shift.apply(args)
                if (!args) data[property]()
                else data[property].apply(data, args)
            } else {
                data.init()
            }
        })
    }

    var old = $.fn.datagrid

    $.fn.datagrid             = Plugin
    //$.fn.datagrid.Constructor = Datagrid
    $.datagrid                = Datagrid
    
    // DATAGRID NO CONFLICT
    // =================
    
    $.fn.datagrid.noConflict = function () {
        $.fn.datagrid = old
        return this
    }
    
    // DATAGRID DATA-API
    // ==============
    
    $(document).on(BJUI.eventType.initUI, function(e) {
        $(e.target).find('table[data-toggle="datagrid"]').each(function() {
            var $this = $(this), options = $this.data()
            
            if (!$this.length) return
            
            if (options.options && typeof options.options === 'string') options.options = options.options.toObj()
            $.extend(options, typeof options.options === 'object' && options.options)
            
            Plugin.call($this, options)
        })
    })
    
}(jQuery);
/*!
 * B-JUI  v1.3 beta2 (http://b-jui.com)
 * Git@OSC (http://git.oschina.net/xknaan/B-JUI)
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 */

/* ========================================================================
 * B-JUI: bjui-spinner.js  v1.3 beta2
 * @author K'naan
 * http://git.oschina.net/xknaan/B-JUI/blob/master/BJUI/js/bjui-spinner.js
 * ========================================================================
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 * ======================================================================== */

+function ($) {
    'use strict';
    
    // SPINNER CLASS DEFINITION
    // ======================
    var Spinner = function(element, options) {
        this.$element = $(element)
        this.options  = options
        this.tools    = this.TOOLS()
        this.$spinner = null
        this.height   = this.$element.addClass('form-control').innerHeight()
        this.ivalue   = Number(this.$element.val()) || 0
    }
    
    Spinner.DEFAULTS = {
        min: 0,
        max: 100,
        step: 1,
        decimalPlace: 0
    }
    
    Spinner.EVENTS = {
        afterChange : 'afterchange.bjui.spinner'
    }
    
    Spinner.prototype.TOOLS = function() {
        var that  = this
        var tools = {
            changeVal: function($btn) {
                var $input = that.$element
                var ivalue = Number($input.val()) || Number(that.ivalue)
                var type   = $btn.data('add') || -1
                var istart = that.options.min, iend = that.options.max, istep = that.options.step
                
                if (type == 1) {
                    if (ivalue <= iend - istep)
                        ivalue = ivalue + istep
                } else if (type == -1) {
                    if (ivalue >= (istart + istep))
                        ivalue = ivalue - istep
                } else if (ivalue > iend) {
                    ivalue = iend
                } else if (ivalue < istart) {
                    ivalue = istart
                }
                if (that.options.decimalPlace)
                    ivalue = new String(ivalue.toFixed(that.options.decimalPlace))
                
                that.ivalue = ivalue
                
                $input
                    .val(ivalue)
                    .trigger(Spinner.EVENTS.afterChange, {value:ivalue})
                    .trigger('change')
            }
        }
        
        return tools
    }
    
    Spinner.prototype.init = function() {
        var that     = this
        var $element = this.$element
        var options  = this.options
        
        if (isNaN(this.options.min) || isNaN(this.options.max) || isNaN(this.options.step)) {
            BJUI.debug('Spinner Plugin: Parameter is non-numeric type!')
            return
        }
        
        this.addBtn()
    }
    
    Spinner.prototype.addBtn = function() {
        var that = this, $element = that.$element, fluid = $element.attr('size') ? '' : ' fluid'
        
        if (!this.$lookBtn && !$element.parent().hasClass('wrap_bjui_btn_box')) {
            this.$spinner = $(FRAG.spinnerBtn)
            
            $element.css({'paddingRight':'13px'}).wrap('<span class="wrap_bjui_btn_box'+ fluid +'"></span>')
            
            var $box = $element.parent()
            
            $box.css('position', 'relative')
            this.$spinner.css({'height':this.height}).appendTo($box)
            this.$spinner.on('selectstart', function() { return false })
            
            var timer = null
            
            that.$spinner.find('li').on('click', function(e) {
                that.tools.changeVal($(this))
            }).on('mousedown', function() {
                var $btn = $(this)
                
                timer = setInterval(function() {
                    that.tools.changeVal($btn)
                }, 150)
            }).on('mouseup', function() { clearTimeout(timer) })
        }
    }
    
    Spinner.prototype.destroy = function() {
        if (this.$element.parent().hasClass('wrap_bjui_btn_box')) {
            this.$element.parent().find('.bjui-spinner').remove()
            this.$element.unwrap()
        }
    }
    
    // SPINNER PLUGIN DEFINITION
    // =======================
    
    function Plugin(option) {
        var args     = arguments
        var property = option
        
        return this.each(function () {
            var $this   = $(this)
            var options = $.extend({}, Spinner.DEFAULTS, $this.data(), typeof option === 'object' && option)
            var data    = $this.data('bjui.spinner')
            
            if (!data) $this.data('bjui.spinner', (data = new Spinner(this, options)))
            if (typeof property === 'string' && $.isFunction(data[property])) {
                [].shift.apply(args)
                if (!args) data[property]()
                else data[property].apply(data, args)
            } else {
                data.init()
            }
        })
    }
    
    var old = $.fn.spinner
    
    $.fn.spinner             = Plugin
    $.fn.spinner.Constructor = Spinner
    
    // SPINNER NO CONFLICT
    // =================
    
    $.fn.spinner.noConflict = function () {
        $.fn.spinner = old
        return this
    }
    
    // SPINNER DATA-API
    // ==============

    $(document).on(BJUI.eventType.initUI, function(e) {
        var $this = $(e.target).find('input[data-toggle="spinner"]')
        
        if (!$this.length) return
        
        Plugin.call($this)
    })

}(jQuery);
/*!
 * B-JUI  v1.3 beta2 (http://b-jui.com)
 * Git@OSC (http://git.oschina.net/xknaan/B-JUI)
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 */

/* ========================================================================
 * B-JUI: bjui-findgrid.js  v1.3 beta2
 * @author K'naan
 * http://git.oschina.net/xknaan/B-JUI/blob/master/BJUI/js/bjui-findgrid.js
 * ========================================================================
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 * ======================================================================== */

+function ($) {
    'use strict';
    
 // FINDGRID GLOBAL ELEMENTS
    // ======================
    
    var group, suffix, pk, include, exclude, append, oldData, beforeSelect, onSelect, afterSelect, $box, $currentFindGrid
    
    // FINDGRID CLASS DEFINITION
    // ======================
    
    var FindGrid = function(element, options) {
        this.$element = $(element)
        this.options  = options
        this.$findBtn = null
    }
    
    FindGrid.DEFAULTS = {
        pk           : null,
        oldData      : null,
        group        : null,
        suffix       : null,
        include      : null,
        exclude      : null,
        multiple     : false,
        append       : false,
        empty        : true,
        dialogOptions: {
            id        : null,
            mask      : true,
            width     : 600,
            height    : 400,
            title     : 'FindGrid',
            maxable   : true,
            resizable : true
        },
        gridOptions : {
            width      : '100%',
            height     : '100%',
            columnMenu : false,
            sortAll    : true,
            filterAll  : true,
            fullGrid   : true
        },
        context     : null,
        beforeSelect: null,
        onSelect    : null,
        afterSelect : null
    }
    
    FindGrid.EVENTS = {
        afterChange : 'afterchange.bjui.findgrid'
    }
    
    FindGrid.getField = function(key) {
        return (group ? (group +'.') : '') + (key) + (suffix ? suffix : '')
    }
    
    FindGrid.empty = function() {
        if (!include) {
            BJUI.debug('FindGrid Plugin: No set options \'include\' !')
            return
        }
        
        var that = this, includes = include.split(','), $inputs = $box.find(':text, :input:hidden, textarea, select'), includeKeys = {}
        
        for (var i = 0; i < includes.length; i++) {
            var arr = includes[i].split(':'), key, fieldKey
            
            if (arr.length == 2) {
                fieldKey = arr[0].trim()
                key      = arr[1].trim()
            } else {
                fieldKey = includes[i].trim()
                key      = fieldKey
            }
            
            includeKeys[that.getField(fieldKey)] = true
        }
        
        for (key in includeKeys) {
            $inputs.filter('[name="'+ key +'"]')
                .val('')
                .trigger(FindGrid.EVENTS.afterChange, {value:'', data:''})
                .trigger('focus')
                .trigger('change')
        }
    }
    
    FindGrid.setSingle = function(data) {
        if (typeof onSelect === 'function') {
            onSelect.call(this, data)
            return
        }
        
        var that   = this
        var setVal = function($input, fieldKey, value) {
            var name = that.getField(fieldKey)
            
            if (name == $input.attr('name')) {
                $input
                    .val(value)
                    .trigger(FindGrid.EVENTS.afterChange, {value:value, data:data})
                    .trigger('focus')
                    .trigger('change')
                
                if ($input.isTag('select') && $input.data('toggle') && $input.data('toggle') === 'selectpicker') {
                    $input.selectpicker('refresh')
                }
            }
        }
        
        $box.find('input:text, input:hidden, textarea, select').each(function() {
            var $input = $(this), fieldKey, excludeKeys = []
            
            if (include) {
                var includes = include.split(',')
                
                for (var i = 0; i < includes.length; i++) {
                    var arr = includes[i].split(':'), key
                    
                    if (arr.length == 2) {
                        fieldKey = arr[0].trim()
                        key      = arr[1].trim()
                    } else {
                        fieldKey = includes[i].trim()
                        key      = fieldKey
                    }
                    
                    if (data && typeof data[key] !== 'undefined')
                        setVal($input, fieldKey, data[key])
                }
            } else {
                for (var key in data) {
                    if (exclude) {
                        $.each(exclude.split(','), function(i, n) {
                            excludeKeys.push(n.trim())
                        })
                        
                        if ($.inArray(key, excludeKeys) != -1) {
                            continue
                        }
                    }
                    
                    setVal($input, key, data[key])
                }
            }
        })
        
        if (typeof afterSelect === 'function') {
            afterSelect.call(that, data)
            return
        }
    }
    
    FindGrid.setMult = function(gridId) {
        if (typeof onSelect === 'function') {
            onSelect.call(that, data.data)
            return
        }
        
        var that = this, datas = $('#'+ gridId).data('selectedDatas'), data, inputLen = 0, newVal
        var refreshSelect = function($input) {
            if ($input.isTag('select') && $input.data('toggle') && $input.data('toggle') === 'selectpicker') {
                $input.selectpicker('refresh')
            }
        }
        
        if (datas && datas.length) {
            var $inputs = $box.find('input:text, input:hidden, textarea, select'), fieldKey, includeKeys = {}, okObj = {}, excludeKeys = [], v
            
            if (!append && oldData)
                oldData = []
            
            if (include) {
                var includes = include.split(',')
                
                for (var i = 0; i < includes.length; i++) {
                    var arr = includes[i].split(':'), key, obj
                    
                    if (arr.length == 2) {
                        fieldKey = arr[0].trim()
                        key      = arr[1].trim()
                    } else {
                        fieldKey = includes[i].trim()
                        key      = fieldKey
                    }
                    
                    includeKeys[that.getField(fieldKey)] = key
                }
            } else {
                for (var key in datas[0]) {
                    if (exclude) {
                        $.each(exclude.split(','), function(i, n) {
                            excludeKeys.push(n.trim())
                        })
                        if ($.inArray(key, excludeKeys) === -1) {
                            includeKeys[that.getField(key)] = key
                        }
                    } else {
                        includeKeys[that.getField(key)] = key
                    }
                }
            }
            
            $inputs = $($.map($inputs, function(n) {
                var $n = $(n), name = $n.attr('name')
                
                if (!name) return null
                if (!includeKeys[name]) return null
                
                okObj[name] = includeKeys[name]
                
                return n
            }))
            
            for (var j = 0; j < datas.length; j++) {
                data = datas[j]
                
                if (oldData && $.inArray(data[pk], oldData) != -1)
                    continue
                
                $inputs.each(function(k) {
                    var $input = $(this), name = $input.attr('name'), value = $input.val()
                    
                    if (!newVal) newVal = new Array()
                    if (!newVal[k]) newVal[k] = []
                    
                    if (!append) {
                        $input.val('')
                        refreshSelect($input)
                    } else {
                        if (value) {
                            newVal[k].push(value)
                            
                            if ($input.isTag('select') && $input.prop('multiple')) {
                                newVal[k] = $.type(value) === 'array' ? value : []
                            }
                        }
                    }
                    
                    newVal[k].push(data[okObj[name]])
                    
                    if (oldData && $.inArray(data[pk], oldData) === -1)
                        oldData.push(data[pk])
                })
            }
            
            if (newVal) {
                $inputs.each(function(k) {
                    var $input = $(this)
                    
                    v = newVal[k].join(',')
                    
                    if ($input.isTag('select') && $input.prop('multiple'))
                        v = newVal[k]
                    
                    $input
                        .val(v)
                        .trigger(FindGrid.EVENTS.afterChange, {value:v, data:datas})
                        .trigger('change')
                    
                    $currentFindGrid.data('oldData', oldData)
                    
                    refreshSelect($input)
                })
            }
            
            if (typeof afterSelect === 'function') {
                afterSelect.call(that, data.data)
                return
            }
            
            BJUI.dialog('closeCurrent')
        }
    }
    
    FindGrid.prototype.init = function() {
        var that = this, options = this.options, gridOptions = options.gridOptions, tools = this.tools
        
        group            = options.group  || null
        suffix           = options.suffix || null
        $currentFindGrid = that.$element
        oldData          = options.oldData
        pk               = options.pk || null
        include          = options.include || null
        exclude          = options.exclude || null
        $box             = null
        
        if (options.context) {
            if (options.context instanceof jQuery)
                $box = options.context
            else
                $box = $(options.context)
        }
        if (!$box || !$box.length)
            $box = that.$element.closest('.unitBox')
        if (suffix)
            suffix = suffix.trim()
        
        if (pk) {
            if ($currentFindGrid.data('oldData')) {
                oldData = $currentFindGrid.data('oldData')
            } else {
                if (typeof oldData !== 'undefined') {
                    if (typeof oldData === 'string')
                        oldData = oldData.split(',')
                    else if (!$.isArray(oldData))
                        oldData = []
                } else {
                    oldData = []
                }
            }
        } else {
            oldData = null
        }
        
        if (gridOptions.dataUrl) {
            gridOptions.dataUrl = decodeURI(gridOptions.dataUrl).replacePlh($box)
            
            if (!gridOptions.dataUrl.isFinishedTm()) {
                BJUI.alertmsg('error', (options.warn || BJUI.regional.plhmsg))
                BJUI.debug('Findgrid Plugin: gridOptions -> dataUrl is incorrect: '+ gridOptions.dataUrl)
                return
            }
            
            gridOptions.dataUrl = encodeURI(gridOptions.dataUrl)
        }
        
        this.open(that.$element)
    }
    
    FindGrid.prototype.addBtn = function() {
        var that = this, $element = that.$element, options = $element.data('bjui.findgrid.options'), fluid = $element.attr('size') ? '' : ' fluid'
        
        if (!this.$findBtn && !$element.parent().hasClass('wrap_bjui_btn_box')) {
            this.$findBtn = $(FRAG.findgridBtn)
            this.$element.css({'paddingRight':'15px'}).wrap('<span class="wrap_bjui_btn_box'+ fluid +'"></span>')
            
            var $box   = this.$element.parent()
            var height = this.$element.addClass('form-control').innerHeight()
            
            $box.css({'position':'relative', 'display':'inline-block'})
            
            delete options.toggle
            
            that.$findBtn.data('bjui.findgrid.options', options)
            
            this.$findBtn.css({'height':height, 'lineHeight':height +'px'}).appendTo($box)
            this.$findBtn.on('selectstart', function() { return false })
        }
    }
    
    FindGrid.prototype.open = function($obj) {
        var that = this, options = this.options, dialogOptions = options.dialogOptions, gridOptions = options.gridOptions, timestamp = (new Date().getTime())
        
        if (!dialogOptions.id)
            dialogOptions.id = 'dialog_findgrid_'+ timestamp
        if (!options.gridId)
            options.gridId = 'datagrid_findgrid_'+ timestamp
        
        gridOptions.showToolbar = false
        
        if (options.empty) {
            if (!gridOptions.toolbarCustom) gridOptions.toolbarCustom = ''
            gridOptions.showToolbar = true
        }
        if (options.multiple) {
            gridOptions.showToolbar = true
            
            if (typeof gridOptions.showCheckboxcol === 'undefined') {
                gridOptions.showCheckboxcol = true
            }
            if (!gridOptions.toolbarCustom) gridOptions.toolbarCustom = ''
            
            gridOptions.selectMult  = true
            
            // set multiple
            gridOptions.toolbarCustom += '　<button type="button" class="btn-blue" onclick="$.fn.findgrid.Constructor.setMult(\''+ options.gridId +'\')">'+ (BJUI.getRegional('findgrid.choose')) +'</button>'
            gridOptions.toolbarCustom += '　<label class="ilabel"><input type="checkbox" data-toggle="icheck" id="checkbox_findgrid_'+ timestamp +'" '+ (options.append ? 'checked' : '') +'>&nbsp;'+ (BJUI.getRegional('findgrid.append')) +'</label>'
            
            append = options.append
        }
        
        if (options.empty)
            gridOptions.toolbarCustom += '　<button type="button" class="btn-orange" onclick="$.fn.findgrid.Constructor.empty(\''+ options.gridId +'\')">'+ (BJUI.getRegional('findgrid.empty')) +'</button>'
        
        delete dialogOptions.url
        delete dialogOptions.target
        
        if (options.onSelect) {
            onSelect = options.onSelect
            if (typeof onSelect === 'string') onSelect = onSelect.toFunc()
        } else {
            onSelect = null
        }
        if (options.beforeSelect) {
            beforeSelect = options.beforeSelect
            if (typeof beforeSelect === 'string') beforeSelect = beforeSelect.toFunc()
        } else {
            beforeSelect = null
        }
        if (options.afterSelect) {
            afterSelect = options.afterSelect
            if (typeof afterSelect === 'string') afterSelect = afterSelect.toFunc()
        } else {
            afterSelect = null
        }
        
        dialogOptions.html = '<div class="bjui-pageContent tableContent"><table id="'+ options.gridId +'"></table></div>'
        dialogOptions.onLoad = function($dialog) {
            var gridId = '#'+ options.gridId, $grid = $(gridId)
            
            $grid.datagrid(gridOptions)
            
            // after load - selected row by (oldData && pk)
            if ($.isArray(oldData) && oldData.length && pk) {
                $(document).on('afterLoad.bjui.datagrid', gridId, function(e, data) {
                    if (data.datas) {
                        $.each(data.datas, function(i, data) {
                            if (data[pk]) {
                                if ($.inArray(data[pk], oldData) != '-1') {
                                    $grid.datagrid('selectedRows', i, true)
                                }
                            }
                        })
                    }
                })
            }
            
            // set single
            if (!options.multiple) {
                $(document).on('clicked.bjui.datagrid.tr', gridId, function(e, data) {
                    if (typeof beforeSelect === 'function') {
                        if (!beforeSelect.apply(that, [data.data])) {
                            return false
                        }
                    }
                    if (typeof onSelect === 'function') {
                        onSelect.call(that, data.data)
                    } else {
                        FindGrid.setSingle(data.data)
                        BJUI.dialog('closeCurrent')
                    }
                })
            }
            
            // append checkbox
            $(document).on('ifChanged', '#checkbox_findgrid_'+ timestamp, function(e) {
                append = $(this).is(':checked')
            })
        }
        
        BJUI.dialog(dialogOptions)
    }
    
    // FINDGRID PLUGIN DEFINITION
    // =======================
    
    function Plugin(option) {
        var args     = arguments
        var property = option
        
        return this.each(function () {
            var $this   = $(this),
                options = {},
                data
            
            $.extend(true, options, FindGrid.DEFAULTS, typeof option === 'object' && option)
            
            data = new FindGrid(this, options)
            
            if (typeof property === 'string' && $.isFunction(data[property])) {
                [].shift.apply(args)
                if (!args) data[property]()
                else data[property].apply(data, args)
            } else {
                data.init()
            }
        })
    }
    
    var old = $.fn.findgrid
    
    $.fn.findgrid             = Plugin
    $.fn.findgrid.Constructor = FindGrid
    
    // FINDGRID NO CONFLICT
    // =================
    
    $.fn.findgrid.noConflict = function () {
        $.fn.findgrid = old
        return this
    }
    
    // NOT SELECTOR
    // ==============
    
    BJUI.findgrid = function() {
        Plugin.apply($('body'), arguments)
    }
    
    // FINDGRID DATA-API
    // ==============
    
    $(document).on(BJUI.eventType.initUI, function(e) {
        $(e.target).find('input[data-toggle="findgrid"]').each(function() {
            var $this = $(this), data = $this.data(), options = data.options
            
            if (options) {
                if (typeof options === 'string') {
                    if (options.trim().startsWith('{')) 
                        options = options.toObj()
                    else
                        options = options.toFunc()
                }
                if (typeof options === 'function') {
                    options = options.apply()
                }
                if (typeof options === 'object') {
                    delete data.options
                    
                    $.extend(data, options)
                }
            }
            
            $this.data('bjui.findgrid.options', data)
            Plugin.call($this, 'addBtn')
        })
    })
    
    $(document).on('click.bjui.findgrid.data-api', '[data-toggle="findgridbtn"]', function(e) {
        var $this = $(this), opts = $this.data('bjui.findgrid.options')
        
        if (!opts) {
            var data = $this.data(), options = data.options
            
            if (options) {
                if (typeof options === 'string') {
                    if (options.trim().startsWith('{')) 
                        options = options.toObj()
                    else
                        options = options.toFunc()
                }
                if (typeof options === 'function') {
                    options = options.apply()
                }
                if (typeof options === 'object') {
                    delete data.options
                    
                    $.extend(data, options)
                }
            }
            opts = data
        }
        
        delete opts['bjui.findgrid.options']
        
        Plugin.call($this, opts)
        
        e.preventDefault()
    })
    
}(jQuery);
/*!
 * B-JUI  v1.3 beta2 (http://b-jui.com)
 * Git@OSC (http://git.oschina.net/xknaan/B-JUI)
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 */

/* ========================================================================
 * B-JUI: bjui-suggest.js  v1.3 beta2
 * @author K'naan
 * http://git.oschina.net/xknaan/B-JUI/blob/master/BJUI/js/bjui-suggest.js
 * ========================================================================
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 * ======================================================================== */

+function ($) {
    'use strict';
    
 // FINDGRID GLOBAL ELEMENTS
    // ======================
    
    var group, suffix, keys, include, autofill, onSelect, $box, $currentSuggest
    
    // FINDGRID CLASS DEFINITION
    // ======================
    
    var Suggest = function(element, options) {
        this.$element = $(element)
        this.options  = options
        this.$findBtn = null
    }
    
    Suggest.DEFAULTS = {
        keys      : null,
        group     : null,
        suffix    : null,
        include   : null,
        context   : null,
        eventType : 'change',
        autofill  : false
    }
    
    Suggest.EVENTS = {
        afterChange : 'afterchange.bjui.suggest'
    }
    
    Suggest.getField = function(key) {
        return (group ? (group +'.') : '') + (key) + (suffix ? suffix : '')
    }
    
    Suggest.setSingle = function(datas) {
        var that   = this, items, menus = [], $parents, inputs = []
        var replacePlh = function(val, data) {
            return val.replace(/#\/?[^#]*#/g, function($1) {
                var key = $1.replace(/[##]+/g, ''), val = data[key]
                
                if (typeof val === 'undefined')
                    return $1
                
                if (typeof val === 'undefined' || val === 'null' || val === null)
                    val = ''
                
                return val
            })
        }
        var createMenu = function($input, value, label) {
            items = []
            
            var $suggest = $input.data('suggest.menu'), val, lab
            
            if (!$suggest || !$suggest.length) {
                $suggest = $('<ul class="bjui-suggest-menu"></ul>')
            }
            
            $.each(datas, function(i, n) {
                val = value
                lab = label
                val = replacePlh(val, n)
                lab = replacePlh(lab, n)
                
                if (val || lab)
                    items.push('<li data-value="'+ val +'">'+ lab +'</li>')
            })
            
            if (items.length) {
                $suggest
                    .html(items.join(''))
                    .appendTo('body').css({position:'absolute', top:$input.offset().top + $input.outerHeight(), left:$input.offset().left})
                    .on('click.bjui.suggest', 'li', function() {
                        $input.val($(this).attr('data-value'))
                    })
                    .on('mouseover.bjui.suggest', 'li', function() {
                        $(this).addClass('menu-highlight')
                    })
                    .on('mouseout.bjui.suggest', 'li', function() {
                        $(this).removeClass('menu-highlight')
                    })
                
                $input.addClass('bjui-suggest-input').attr('autocomplete', false).data('suggest.menu', $suggest).off('focus.bjui.suggest').on('focus.bjui.suggest', function() {
                    $suggest.css({top:$input.offset().top + $input.outerHeight(), left:$input.offset().left}).show()
                }).off('destroy.bjui.suggest').on('destroy.bjui.suggest', function() {
                    $suggest.remove()
                })
                
                menus.push($suggest)
            }
        }
        
        $.each(keys, function(k, v) {
            var name = that.getField(k), $input = $box.find('input[name="'+ name +'"], select[name="'+ name +'"], textarea[name="'+ name +'"]'), arr = v ? v.split('/') : ['#'+ k +'#'], item, value, label
            
            if ($input && $input.length) {
                if (arr.length > 1) {
                    value = arr[0]
                    label = arr[1]
                } else {
                    value = label = arr[0]
                }
                
                if (($input.isTag('select') || $input.isTag('textarea')) && autofill) {
                    $input.val(datas[0] ? datas[0][k] : '')
                    if ($input.isTag('select')) {
                        $input.selectpicker('refresh')
                    }
                }
                else {
                    createMenu($input, value, label)
                    if (autofill)
                        $input.val(datas[0] ? datas[0][k] : '')
                }
                
                inputs.push($input)
                
                if (!$parents)
                    $parents = $input.parents()
            }
        })
        
        $(document).on('click.bjui.suggest', function(e) {
            var $suggest = $(e.target).data('suggest.menu')
            
            if (!$suggest || !$suggest.length)
                $('body').find('> .bjui-suggest-menu').hide()
            else
                $suggest.siblings('.bjui-suggest-menu').hide()
        })
        
        $parents.on('scroll.bjui.suggest', function() {
            $.each(inputs, function(i, n) {
                var $suggest = n.data('suggest.menu')
                
                if ($suggest && $suggest.is(':visible')) {
                    $suggest.css({top:n.offset().top + n.outerHeight(), left:n.offset().left})
                }
            })
        })
        
        $currentSuggest.data('menus', menus)
    }
    
    Suggest.prototype.init = function() {
        var that = this, options = this.options, tools = this.tools
        
        keys            = options.keys     || null
        group           = options.group    || null
        suffix          = options.suffix   || null
        autofill        = options.autofill || false
        $currentSuggest = that.$element
        $box            = null
        
        if (options.context) {
            if (options.context instanceof jQuery)
                $box = options.context
            else
                $box = $(options.context)
        }
        if (!$box || !$box.length)
            $box = that.$element.closest('.unitBox')
        if (suffix)
            suffix = suffix.trim()
        
        if (!options.keys) {
            BJUI.debug('Suggest Plugin: options -> keys is not defined!')
            return
        }
        if (!options.url) {
            BJUI.debug('Suggest Plugin: options -> url is not defined!')
            return
        } else {
            options.url = decodeURI(options.url).replacePlh($box)
            
            if (!options.url.isFinishedTm()) {
                BJUI.alertmsg('error', (options.warn || BJUI.regional.plhmsg))
                BJUI.debug('Suggest Plugin: options -> url is incorrect: '+ options.url)
                return
            }
            
            options.url = encodeURI(options.url)
        }
        
        that.$element.on(options.eventType || 'change', function() {
            var val = $(this).val()
            
            if (val)
                that.load(val)
        })
    }
    
    Suggest.prototype.load = function(value) {
        var that = this, options = this.options, url = options.url
        
        if (url.indexOf('#val#') != -1) {
            url = url.replaceAll('#val#', value)
        }
        
        BJUI.ajax('doajax', {
            url   : url,
            data  : {value : value},
            type  : options.type,
            cache : options.cache,
            okCallback: function(json) {
                Suggest.setSingle(json)
            }
        })
    }
    
    Suggest.prototype.destroyMenu = function() {
        var menus = $currentSuggest.data('menus') || []
        
        if (menus.length) {
            $.each(menus, function(i, n) {
                n.remove()
            })
        }
    }
    
    // FINDGRID PLUGIN DEFINITION
    // =======================
    
    function Plugin(option) {
        var args     = arguments
        var property = option
        
        return this.each(function () {
            var $this   = $(this),
                options = {},
                data
            
            $.extend(true, options, Suggest.DEFAULTS, typeof option === 'object' && option)
            
            data = new Suggest(this, options)
            
            if (typeof property === 'string' && $.isFunction(data[property])) {
                [].shift.apply(args)
                if (!args) data[property]()
                else data[property].apply(data, args)
            } else {
                data.init()
            }
        })
    }
    
    var old = $.fn.suggest
    
    $.fn.suggest             = Plugin
    $.fn.suggest.Constructor = Suggest
    
    // FINDGRID NO CONFLICT
    // =================
    
    $.fn.suggest.noConflict = function () {
        $.fn.suggest = old
        return this
    }
    
    // FINDGRID DATA-API
    // ==============
    
    $(document).on(BJUI.eventType.initUI, function(e) {
        $(e.target).find('input[data-toggle="suggest"]').each(function() {
            var $this = $(this), data = $this.data(), options = data.options
            
            if (options) {
                if (typeof options === 'string') {
                    if (options.trim().startsWith('{')) 
                        options = options.toObj()
                    else
                        options = options.toFunc()
                }
                if (typeof options === 'function') {
                    options = options.apply()
                }
                if (typeof options === 'object') {
                    delete data.options
                    
                    $.extend(data, options)
                }
            }
            
            Plugin.call($this, data)
        })
    })
    
    $(document).on('click.bjui.suggest.data-api', '[data-toggle="suggestbtn"]', function(e) {
        var $this = $(this), opts = $this.data('bjui.suggest.options')
        
        if (!opts) {
            var data = $this.data(), options = data.options
            
            if (options) {
                if (typeof options === 'string') {
                    if (options.trim().startsWith('{')) 
                        options = options.toObj()
                    else
                        options = options.toFunc()
                }
                if (typeof options === 'function') {
                    options = options.apply()
                }
                if (typeof options === 'object') {
                    delete data.options
                    
                    $.extend(data, options)
                }
            }
            opts = data
        }
        
        delete opts['bjui.suggest.options']
        
        Plugin.call($this, opts)
        
        e.preventDefault()
    })
    
}(jQuery);
/*!
 * B-JUI  v1.3 beta2 (http://b-jui.com)
 * Git@OSC (http://git.oschina.net/xknaan/B-JUI)
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 */

/* ========================================================================
 * B-JUI: bjui-tags.js  v1.3 beta2
 * @author K'naan
 * http://git.oschina.net/xknaan/B-JUI/blob/master/BJUI/js/bjui-tags.js
 * ========================================================================
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 * ======================================================================== */

+function ($) {
    'use strict';
    
    // TAGS CLASS DEFINITION
    // ======================
    var Tags = function(element, options) {
        this.$element = $(element)
        this.options  = options
        this.tools    = this.TOOLS()
        this.$box     = $('<div></div>')
        this.timeout  = null
        this.$tagsArr = {}
        this.tags     = []
        
        if (options.istag) {
            this.$element.addClass('tag-input')
            this.$box.addClass('bjui-tags')
        } else {
            this.$box.addClass('bjui-autocomplete')
            if (!this.$element.attr('size'))
                this.$box.addClass('fluid')
        }
        
        this.$element.after(this.$box)
        this.$element.appendTo(this.$box)
    }
    
    Tags.DEFAULTS = {
        width     : 300,
        url       : '',
        global    : false,
        type      : 'GET',
        term      : 'term',
        tagname   : 'tag',     // Appended "<input type='hidden'>" name attribute
        max       : 0,         // The maximum allowable number of tags(0=unlimited)
        clear     : false,     // If not found, clear the input characters
        lightCls  : 'tags-highlight',
        istag     : true,      // If only need auto complete, set false
        data      : {},
        container : '',
        keys      : {
            value : 'value',
            label : 'label'
        }
    }
    
    Tags.EVENTS = {
        afterCreated : 'aftercreated.bjui.tags'
    }
    
    Tags.prototype.TOOLS = function() {
        var that  = this, options = this.options
        var tools = {
            keyDown: function(e) {
                if (e.which == 13) {
                    return false
                }
            },
            keyUp: function(e) {
                switch(e.which) {
                case BJUI.keyCode.BACKSPACE:
                    if (!$.trim(that.$element.val()).length) {
                        that.tools.removeMenu()
                        return false
                    }
                    break
                case BJUI.keyCode.ESC:
                    that.tools.removeMenu()
                    break
                case BJUI.keyCode.DOWN:
                    if (!that.$menu || !that.$menu.length) return
                    
                    var $highlight = that.$menu.find('> .'+ options.lightCls),
                        $first     = that.$menu.find('> li:first-child')
                    
                    if (!$highlight.length) {
                        $first.addClass(options.lightCls)
                    } else {
                        var $hight_next = $highlight.removeClass(options.lightCls).next()
                        
                        if ($hight_next.length) {
                            $hight_next.addClass(options.lightCls)
                        } else {
                            $first.addClass(options.lightCls)
                        }
                    }
                    return false
                    break
                case BJUI.keyCode.UP:
                    if (!that.$menu || !that.$menu.length) return
                    var $highlight = that.$menu.find('> .'+ options.lightCls),
                        $last      = that.$menu.find('> li:last-child')
                    
                    if (!$highlight.length) {
                        $last.addClass(options.lightCls)
                    } else {
                        var $hight_prev = $highlight.removeClass(options.lightCls).prev()
                        
                        if ($hight_prev.length) {
                            $hight_prev.addClass(options.lightCls)
                        } else {
                            $last.addClass(options.lightCls)
                        }
                    }
                    return false
                    break
                case BJUI.keyCode.ENTER:
                    if (options.max > 0 && that.$tagsArr.length >= options.max) return false
                    
                    var label = false, value = false, item = null
                    var $selectedItem = that.$menu && that.$menu.find('> .'+ options.lightCls)
                    
                    if ($selectedItem && $selectedItem.length) {
                        label = $selectedItem.text()
                        item  = $selectedItem.data('item')
                        value = item[options.keys.value]
                    } else {
                        label = $.trim(that.$element.val())
                        
                        if (!label.length) return false
                        if (options.clear) {
                            if ($.inArray(label, that.tags) == -1) {
                                options.istag && (that.$element.val(''))
                                return false
                            }
                        }
                        value = label
                    }
                    if (!label) return
                    
                    /* Check the repeatability */
                    var isRepeat = false
                    
                    that.$tagsArr.length && that.$tagsArr.each(function() {
                        if ($(this).val() == value) {
                            isRepeat = true
                            return
                        }
                    })
                    
                    if (isRepeat) {
                        options.istag && (that.$element.val(''))
                        return false
                    }
                    
                    that.tools.createTag(label, value)
                    that.tools.removeMenu()
                    options.istag && (that.$element.val(''))
                    
                    //events
                    $.proxy(that.tools.onAfterCreated(item, value), that)
                    
                    return false
                    break
                }
            },
            query: function() {
                if (that.timeout) clearTimeout(that.timeout)
                
                that.timeout = setTimeout(that.tools.doQuery, 300)
            },
            doQuery: function() {
                var options = that.options
                
                if (options.max > 0 && that.$tagsArr.length >= options.max) return
                
                var term = that.$element.val(), $menu = that.$menu, tags = [], $item = null
                var $parentBox = that.$element.closest('.navtab-panel').length ? $.CurrentNavtab : $.CurrentDialog
                var postData = {} 
                
                if (that.$element.closest('.bjui-layout').length) $parentBox = that.$element.closest('.bjui-layout')
                if (!term.length) return
                
                that.$element.one('ajaxStart', function() {
                    $parentBox.trigger('bjui.ajaxStart')
                }).one('ajaxStop', function() {
                    $parentBox.trigger('bjui.ajaxStop')
                })
                
                postData[options.term] = term
                $.extend(postData, typeof options.data === 'object' && options.data)
                
                options.url = decodeURI(options.url).replacePlh(that.$element.closest('.unitBox'))
                
                if (!options.url.isFinishedTm()) {
                    BJUI.alertmsg('error', (options.warn || BJUI.regional.plhmsg))
                    BJUI.debug('Tags Plugin: The query tags url is incorrect, url: '+ options.url)
                    return
                }
                
                options.url = encodeURI(options.url)
                
                $.ajax({
                    url      : options.url,
                    global   : options.global,
                    type     : options.type,
                    data     : postData,
                    dataType : 'json',
                    success  : function(json) {
                        if (json.length != 0) {
                            if (!$menu || !$menu.length) $menu = $('<ul class="bjui-tags-menu"></ul>')
                            
                            $menu.empty().hide();
                            
                            if (options.container)
                                $menu.css('position', 'absolute').appendTo(options.container)
                            else
                                $menu.appendTo(that.$box)
                            
                            for (var i = 0; i < json.length; i++) {
                                var obj = json[i]
                                
                                if (typeof obj === 'string') {
                                    obj = {}
                                    obj[options.keys.label] = json[i]
                                    obj[options.keys.value] = json[i]
                                }
                                
                                $item = $('<li class="tags-item">'+ obj[options.keys.label] + '</li>').data('item', obj)
                                $item.appendTo($menu)
                                
                                tags.push(obj[options.keys.label])
                            }
                            
                            that.tags = tags
                            
                            var h = $(window).height() - that.$element.offset().top - 50, top = 0, left = 0
                            
                            if (options.container) {
                                top  = that.$element.offset().top + that.$element.outerHeight()
                                left = that.$element.offset().left
                            } else {
                                top  = that.$element.position().top + that.$element.outerHeight()
                                left = that.$element.position().left
                            }
                            
                            $menu
                                .css({'top':top, 'left':left})
                                .fadeIn()
                                .find('> li')
                                    .hover(function() {
                                        $(this).addClass(options.lightCls).siblings().removeClass(options.lightCls)
                                    }, function() {
                                        $(this).removeClass(options.lightCls)
                                    })
                                    .click(function() {
                                        var label    = $(this).text()
                                        var item     = $(this).data('item')
                                        var value    = item[options.keys.value]
                                        var isRepeat = false
                                        
                                        that.$box.find('input:hidden').each(function() {
                                            if ($(this).val() == value) {
                                                isRepeat = true
                                                return
                                            }
                                        })
                                        
                                        if (isRepeat) {
                                            options.istag && (that.$element.val(''))
                                            $menu.remove()
                                            return
                                        }
                                        
                                        $.proxy(that.tools.createTag(label, value), that)
                                        
                                        $menu.remove()
                                        options.istag && (that.$element.val(''))
                                        
                                        //events
                                        $.proxy(that.tools.onAfterCreated(item, value), that)
                                    })
                            
                            if ($menu.height() > h) {
                                $menu.height(h - 10).css('overflow-y', 'scroll')
                            }
                            
                            that.$menu = $menu
                        }
                    }
                })
            },
            createTag: function(label, value) {
                if (!that.options.istag) {
                    that.$element.val(label)
                    
                    return
                }
                var $btn = $('<span class="label label-tag" data-value="' + value +'" style="margin-left: 1px; margin-top: 1px;"><i class="fa fa-tag"></i> ' + label + '&nbsp;&nbsp;<a href="#" class="close">&times;</a></span>')
                
                $btn
                    .insertBefore(that.$element)
                    .find('a.close')
                    .click(function() {
                        var value = $btn.data('value')
                        
                        that.$box.find('input:hidden').each(function() {
                            if ($(this).val() == value) {
                                $(this).remove()
                            }
                        })
                        
                        $btn.remove()
                        that.$tagsArr = that.$box.find('input[name="'+ that.options.tagname +'"]')
                    })
                
                var $hidden = $('<input type="hidden" name="'+ that.options.tagname +'">').val(value)
                
                $hidden.appendTo(that.$box)
                that.$tagsArr = that.$box.find('input[name="'+ that.options.tagname +'"]')
            },
            removeMenu: function() {
                if (that.$menu) that.$menu.remove()
            },
            onAfterCreated: function(item, value) {
                var alltags = []
                
                that.$tagsArr.length && that.$tagsArr.each(function() {
                    alltags.push($(this).val())
                })
                
                that.$element.trigger(Tags.EVENTS.afterCreated, {item:item, value:value, tags:alltags.join(',')})
            }
        }
        
        return tools
    }
    
    Tags.prototype.init = function() {
        var that     = this
        var $element = this.$element
        var options  = this.options
        
        if (!(options.url)) {
            BJUI.debug('Tags Plugin: Do query tags, url is undefined!')
            return
        }
        if (isNaN(this.options.max)) {
            BJUI.debug('Tags Plugin: Parameter \'max\' is non-numeric type!')
            return
        }
        
        that.$box.on('click', function() {
            $element.focus()
        })
        
        if (options.istag)
            that.$box.css('width', options.width)
        
        $element
            //.on('blur', $.proxy(this.tools.removeMenu, this))
            .on('keydown', $.proxy(this.tools.keyDown, this))
            .on('keyup', $.proxy(this.tools.keyUp, this))
        
        if (!$.support.leadingWhitespace) { // for ie8
            $element.on('propertychange', $.proxy(this.tools.query, this))
        } else {
            $element.on('input', $.proxy(this.tools.query, this))
        }
        
        $(document).on('click.bjui.tags', $.proxy(function(e) {
            if (!$(e.target).closest(this.$box).length) this.tools.removeMenu()
        }, this))
    }
    
    Tags.prototype.destroy = function() {
        if (this.$tags) {
            this.$element.upwrap()
            $tags.remove()
        }
    }
    
    // TAGS PLUGIN DEFINITION
    // =======================
    
    function Plugin(option) {
        var args     = arguments,
            property = option
        
        return this.each(function () {
            var $this   = $(this),
                options = {},
                data
            
            $.extend(true, options, Tags.DEFAULTS, typeof option === 'object' && option)
            
            data = new Tags(this, options)
            
            if (typeof property === 'string' && $.isFunction(data[property])) {
                [].shift.apply(args)
                if (!args) data[property]()
                else data[property].apply(data, args)
            } else {
                data.init()
            }
        })
    }
    
    var old = $.fn.tags
    
    $.fn.tags             = Plugin
    $.fn.tags.Constructor = Tags
    
    // TAGS NO CONFLICT
    // =================
    
    $.fn.tags.noConflict = function () {
        $.fn.tags = old
        return this
    }
    
    // TAGS DATA-API
    // ==============
    
    $(document).on(BJUI.eventType.initUI, function(e) {
        $(e.target).find('input[data-toggle="tags"]').each(function() {
            var $this = $(this), data = $this.data(), options = data.options
            
            if (options) {
                if (typeof options === 'string') {
                    if (options.trim().startsWith('{')) 
                        options = options.toObj()
                    else
                        options = options.toFunc()
                }
                if (typeof options === 'function') {
                    options = options.apply()
                }
                if (typeof options === 'object') {
                    delete data.options
                    
                    $.extend(data, options)
                }
            } else {
                if (data.keys)
                    data.keys = data.keys.toObj()
                if (data.data)
                    data.data = data.data.toObj()
            }
            
            Plugin.call($this, data)
        })
    })

}(jQuery);
/*!
 * B-JUI  v1.3 beta2 (http://b-jui.com)
 * Git@OSC (http://git.oschina.net/xknaan/B-JUI)
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 */

/* ========================================================================
 * B-JUI: bjui-theme.js  v1.3 beta2
 * @author K'naan
 * http://git.oschina.net/xknaan/B-JUI/blob/master/BJUI/js/bjui-theme.js
 * ========================================================================
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 * ======================================================================== */

+function ($) {
    'use strict';
    
    // THEME GLOBAL ELEMENTS
    // ======================
    
    var $themeLink, $themeLis, $fontLis
    
    $(function() {
        var INIT_THEME = function() {
            $themeLink = $('#bjui-link-theme')
            $themeLis  = $('#bjui-themes')
            $fontLis   = $('#bjui-fonts')
            
            if ($.cookie) {
                var themeName = $.cookie('bjui_theme') || 'blue'
                var $li = $themeLis.find('a.theme_'+ themeName)
                
                $li.theme({})
                
                /* font */
                var fontSize = $.cookie('bjui_font') || 'bjui-font-c'
                var $fontLi  = $fontLis.find('a.'+ fontSize)
                
                $fontLi.theme('setFont', fontSize)
            }
        }
        
        INIT_THEME()
    })
    
    // THEME CLASS DEFINITION
    // ======================
    var Theme = function(element, options) {
        this.$element = $(element)
        this.options  = options
    }
    
    Theme.DEFAULTS = {
        theme: 'purple'
    }
    
    Theme.prototype.init = function() {
        if (!$themeLink.length) return
        var themeHref = $themeLink.attr('href')
        
        themeHref = themeHref.substring(0, themeHref.lastIndexOf('/'))
        themeHref = themeHref.substring(0, themeHref.lastIndexOf('/'))
        themeHref += '/'+ this.options.theme +'/core.css'
        $themeLink.attr('href', themeHref)
        
        var $themeA = this.$element.closest('li').filter('.active')
        var classA  = $themeA.data('theme') || 'default'
        
        classA      = classA.replace(/(theme[\s][a-z]*)/g, '')
        $themeA.removeClass().addClass(classA).addClass('theme').addClass(this.options.theme)
        $themeLis.find('li').removeClass('active')
        this.$element.parent().addClass('active')
        this.cookie()
    }
    
    Theme.prototype.setTheme = function(themeName) {
        $themeLis.find('a.theme_'+ themeName).trigger('click')
    }
    
    Theme.prototype.setFont = function(fontSize) {
        $('html').removeClass().addClass(fontSize)
        
        this.$element.closest('ul').prev().html(this.$element.html()).removeClass().addClass('dropdown-toggle bjui-fonts-tit '+ fontSize)
        
        $('body').find('table').each(function() {
            var $table = $(this), datagrid = $table.data('bjui.datagrid')
            
            if (datagrid) {
                datagrid.needfixedWidth = true
                $table.datagrid('fixedWidth')
                datagrid.needfixedWidth = false
            }
        })
        
        $(window).trigger(BJUI.eventType.resizeGrid)
        
        if ($.cookie) $.cookie('bjui_font', fontSize, { path: '/', expires: 30 });
    }
    
    Theme.prototype.cookie = function() {
        var theme = this.options.theme
        
        if ($.cookie) $.cookie('bjui_theme', theme, { path: '/', expires: 30 });
    }
    
    // THEME PLUGIN DEFINITION
    // =======================
    
    function Plugin(option) {
        var args     = arguments
        var property = option
        
        return this.each(function () {
            var $this   = $(this)
            var options = $.extend({}, Theme.DEFAULTS, $this.data(), typeof option === 'object' && option)
            var data    = $this.data('bjui.theme')
            
            if (!data) $this.data('bjui.theme', (data = new Theme(this, options)))
            if (typeof property === 'string' && $.isFunction(data[property])) {
                [].shift.apply(args)
                if (!args) data[property]()
                else data[property].apply(data, args)
            } else {
                data.init()
            }
        })
    }
    
    var old = $.fn.theme
    
    $.fn.theme             = Plugin
    $.fn.theme.Constructor = Theme
    
    // THEME NO CONFLICT
    // =================
    
    $.fn.theme.noConflict = function () {
        $.fn.theme = old
        return this
    }
    
    // THEME DATA-API
    // ==============

    $(document).on('click.bjui.theme.data-api', '[data-toggle="theme"]', function(e) {
        Plugin.call($(this))
        
        e.preventDefault()
    })
    
    $(document).on('click.bjui.fonts.data-api', '[data-toggle="fonts"]', function(e) {
        Plugin.call($(this), 'setFont', $(this).attr('class'))
        
        e.preventDefault()
    })

}(jQuery);
/*!
 * B-JUI  v1.3 beta2 (http://b-jui.com)
 * Git@OSC (http://git.oschina.net/xknaan/B-JUI)
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 */

/* ========================================================================
 * B-JUI: bjui-initui.js  v1.3 beta2
 * @author K'naan
 * http://git.oschina.net/xknaan/B-JUI/blob/master/BJUI/js/bjui-initui.js
 * ========================================================================
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 * ======================================================================== */

+function ($) {
    'use strict';
    
    // INITUI CLASS DEFINITION
    // ======================
    var Initui = function(element, options) {
        var $this     = this
        this.$element = $(element)
        this.options  = options
    }
    
    Initui.DEFAULTS = {}
    
    Initui.prototype.init = function() {
        var that = this, $element = that.$element
        
        $.when(that.initUI()).done(function(){
            $element.trigger(BJUI.eventType.afterInitUI)
        })
    }
    
    Initui.prototype.initUI = function() {
        var $element = this.$element
        
        $.when($element.trigger(BJUI.eventType.beforeInitUI)).done(function(){
            $element.trigger(BJUI.eventType.initUI)
        })
    }
    
    // INITUI PLUGIN DEFINITION
    // =======================
    
    function Plugin(option) {
        var args     = arguments,
            property = option
        
        return this.each(function () {
            var $this   = $(this),
                options = $.extend({}, Initui.DEFAULTS, $this.data(), typeof option === 'object' && option),
                data    = $this.data('bjui.initui')
            
            if (!data) $this.data('bjui.initui', (data = new Initui(this, options)))
            
            if (typeof property === 'string' && $.isFunction(data[property])) {
                [].shift.apply(args)
                if (!args) data[property]()
                else data[property].apply(data, args)
            } else {
                data.init()
            }
        })
    }

    var old = $.fn.initui

    $.fn.initui             = Plugin
    $.fn.initui.Constructor = Initui
    
    // INITUI NO CONFLICT
    // =================
    
    $.fn.initui.noConflict = function () {
        $.fn.initui = old
        return this
    }
    
    // INITUI DATA-API
    // ==============

    $(document).on('click.bjui.initui.data-api', '[data-toggle="initui"]', function(e) {
        Plugin.call($this, $this.data())
        
        e.preventDefault()
    })
    
    /* beforeInitUI */
    $(document).on(BJUI.eventType.beforeInitUI, function(e) {
        var $box    = $(e.target),
            noinits = [],
            $noinit = $box.find('[data-noinit], pre')
        
        //progress
        $box.find('> .bjui-maskProgress').find('.progress').stop().animate({width:'85%'}, 'fast')
        
        // Hide not need to initialize the UI DOM
        $noinit.each(function(i) {
            var $this = $(this), pos = {}
                        
            pos.$target = $this
            pos.$next   = $this.next()
            pos.$prev   = $this.prev()
            pos.$parent = $this.parent()
            pos.visible = $this.is(':visible') ? true : false
            
            noinits.push(pos)
            $this.remove()
        })
        
        $box.data('bjui.noinit', noinits)
    })
    
    /* initUI */
    $(document).on(BJUI.eventType.initUI, function(e) {
        var $box    = $(e.target)
        
        //progress
        $box.find('> .bjui-maskProgress').find('.progress').stop().animate({width:'95%'}, 'fast')
    })
    
    /* afterInitUI */
    $(document).on(BJUI.eventType.afterInitUI, function(e) {
        var $box    = $(e.target),
            noinits = $box.data('bjui.noinit'),
            $form   = $box.find('> .bjui-pageContent').find('form')
        
        // Recovery not need to initialize the UI DOM
        if (noinits) {
            $.each(noinits, function(i, n) {
                if (n.$next.length) n.$next.before(n.$target)
                else if (n.$prev.length) n.$prev.after(n.$target)
                else if (n.$parent.length) n.$parent.append(n.$target)
                
                if (n.visible) n.$target.show()
                
                $box.removeData('bjui.noinit')
            })
        }
        
        /* resizePageH */
        $box.resizePageH()
        
        //submit
        if ($form.length) {
            $box.find('> .bjui-pageFooter').find(':submit').on('click.bjui.submit', function(e) {
                e.preventDefault()
                
                $form.submit()
            })
        }
        
        $box.find('> .bjui-pageFooter').find(':submit.btn-submit-header').on('click.bjui.submit', function(e) {
            e.preventDefault()
            
            var $form = $box.find('> .bjui-pageHeader').find('form')
            
            $form.length && $form.submit()
        })
        
        //progress
        $box.find('> .bjui-maskProgress').find('.progress').stop().animate({width:'100%'}, 'fast', function() {
            $box.find('> .bjui-ajax-mask').fadeOut('normal', function() { $(this).remove() })
        })
    })
    
    /* Lateral Navigation */
    $(document).one(BJUI.eventType.afterInitUI, function(e) {
        var $hnavbar = $('#bjui-hnav-navbar'), $active = $hnavbar.find('> li.active'), $a = $active.find('> a')
        
        if ($active.length) {
            if ($active.find('> .items').length) {
                $a.trigger('click')
            } else {
                var href = $a.attr('href')
                
                if (href && !(href.startsWith('#') || href.startsWith('javascript'))) {
                    $a.trigger('click')
                }
            }
        }
    })
    
    /* ajaxStatus */
    var bjui_ajaxStatus = function($target) {
        var $this    = $target,
            $offset  = $this,
            position = $this.css('position'),
            top      = $this.scrollTop() || 0,
            height   = ($this[0].clientHeight) / 2
        
        if (position == 'static') {
            $this.css('position', 'relative').data('bjui.ajax.static', true)
            $offset  = $this.offsetParent()
        }
        
        var zIndex   = parseInt($offset.css('zIndex')) || 0,
            $ajaxBackground = $this.find('> .bjui-maskBackground'),
            $ajaxProgress   = $this.find('> .bjui-maskProgress')
            
        if (!$ajaxBackground.length) {
            $ajaxBackground = $(FRAG.maskBackground)
            $ajaxProgress   = $(BJUI.doRegional(FRAG.maskProgress, BJUI.regional))
            $this.prepend($ajaxBackground).prepend($ajaxProgress)
        }
        
        var bgZindex = parseInt($ajaxBackground.css('zIndex')) || 0,
            prZindex = parseInt($ajaxProgress.css('zIndex')) || 0
        
        $ajaxBackground.css('zIndex', zIndex + 1).css('top', top)
        $ajaxProgress.css('zIndex', zIndex + 2)
        
        if (top)
            $ajaxProgress.css('top', top + height)
        
        if (height == 0) {
            setTimeout(function() {
                $ajaxProgress.css('top', $(this).scrollTop() + $this[0].clientHeight / 2)
            }, 50)
        }
        
        $this.off('scroll.ajaxmask').on('scroll.ajaxmask', function() {
            var top = $(this).scrollTop()
            
            $ajaxBackground.css('top', $this.scrollTop())
            $ajaxProgress.css('top', top + this.clientHeight / 2)
        })
        
        return {$bg:$ajaxBackground, $pr:$ajaxProgress}
    }
    
    $(document)
        .on('bjui.ajaxStart', function(e, timeout, callback) {
            var ajaxMask = bjui_ajaxStatus($(e.target))
            
            ajaxMask.$bg.fadeIn()
            ajaxMask.$pr.fadeIn()
            ajaxMask.$pr.find('.progress').animate({width:'80%'}, timeout || 500)
            
            if (callback) {
                setTimeout(function() {
                    callback.toFunc().call(this)
                }, 25)
            }
        })
        .on('bjui.ajaxStop', function(e) {
            var $target = $(e.target), ajaxMask = bjui_ajaxStatus($target)
            
            ajaxMask.$pr.find('.progress').animate({width:'100%'}, 'fast', function() {
                ajaxMask.$bg.remove()
                ajaxMask.$pr.remove()
                
                if ($target.data('bjui.ajax.static'))
                    $target.css('position', 'static')
            })
        })
        .on('bjui.ajaxError', function(e) {
            var $target = $(e.target), ajaxMask = bjui_ajaxStatus($target)
            
            ajaxMask.$bg.remove()
            ajaxMask.$pr.remove()
            
            if ($target.data('bjui.ajax.static'))
                $target.css('position', 'static')
        })
    
    $(document).on(BJUI.eventType.ajaxStatus, function(e) {
        var $target = $(e.target), ajaxMask = bjui_ajaxStatus($target)
        
        $target
            .one('ajaxStart', function() {
                ajaxMask.$bg.fadeIn()
                ajaxMask.$pr.fadeIn()
                
                ajaxMask.$pr.find('.progress').animate({width:'10%'}, 'fast')
            })
            .one('ajaxStop', function() {
                //ajaxMask.$bg.fadeOut()
                //ajaxMask.$pr.fadeOut()
                //ajaxMask.$pr.find('.progress').animate({width:'80%'}, 'fast')
            })
            .one('ajaxError', function() {
                ajaxMask.$bg.remove()
                ajaxMask.$pr.remove()
                
                if ($target.data('bjui.ajax.static'))
                    $target.css('position', 'static')
            })
    })
    
    /* Clean plugins generated 'Dom elements' in the body */
    var bodyClear = function($target) {
        $target.find('select[data-toggle="selectpicker"]').selectpicker('destroyMenu')
        $target.find('[data-toggle="selectztree"]').trigger('destroy.bjui.selectztree')
        $target.find('.bjui-suggest-input').trigger('destroy.bjui.suggest')
    }
    
    $(document).on(BJUI.eventType.beforeLoadDialog, function(e) {
        
    }).on(BJUI.eventType.beforeAjaxLoad, function(e) {
        bodyClear($(e.target))
    }).on(BJUI.eventType.beforeCloseNavtab, function(e) {
        bodyClear($(e.target))
    }).on(BJUI.eventType.beforeCloseDialog, function(e) {
        bodyClear($(e.target))
    })
    
    /* other */
    $(function() {
        $(document).on('keydown keyup', function(e) {
            if (e.which === BJUI.keyCode.CTRL) {
                BJUI.KeyPressed.ctrl = e.type == 'keydown' ? true : false
            }
            if (e.which === BJUI.keyCode.SHIFT) {
                BJUI.KeyPressed.shift = e.type == 'keydown' ? true : false
            }
        })
    })
    
}(jQuery);
/*!
 * B-JUI  v1.3 beta2 (http://b-jui.com)
 * Git@OSC (http://git.oschina.net/xknaan/B-JUI)
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 */

/* ========================================================================
 * B-JUI: bjui-plugins.js  v1.3 beta2
 * @author K'naan
 * http://git.oschina.net/xknaan/B-JUI/blob/master/BJUI/js/bjui-plugins.js
 * ========================================================================
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 * ======================================================================== */

+function ($) {
    'use strict';
    
    $(document).on(BJUI.eventType.initUI, function(e) {
        var $box    = $(e.target)
        
        // UI init begin...
        
        /* i-check */
        if ($.fn.iCheck) {
            var $icheck = $box.find('input[data-toggle="icheck"]')
            
            $icheck.each(function(i) {
                var $element = $(this),
                    id       = $element.attr('id'),
                    name     = $element.attr('name'),
                    label    = $element.data('label')
                
                if (label) $element.after('<label for="'+ id +'" class="ilabel">'+ label +'</label>')
                
                $element
                    .on('ifCreated', function(e) {
                        /* Fixed validate msgbox position */
                        var $parent = $(this).closest('div'),
                            $ilabel = $parent.next('[for="'+ id +'"]')
                        
                        $parent.attr('data-icheck', name)
                        $ilabel.attr('data-icheck', name)
                    })
                    .iCheck({
                        checkboxClass : 'icheckbox_minimal-purple',
                        radioClass    : 'iradio_minimal-purple',
                        increaseArea  : '20%' // optional
                    })
                    .on('ifChanged', function() {
                        /* Trigger validation */
                        $.fn.validator && $(this).trigger('validate')
                    })
                
                if ($element.prop('disabled')) $element.iCheck('disable')
            })
            /* i-check check all */
            $icheck.filter('.checkboxCtrl').on('ifChanged', function(e) {
                var checked = e.target.checked == true ? 'check' : 'uncheck'
                var group   = $(this).data('group')
                
                $box.find(':checkbox[name="'+ group +'"]').iCheck(checked)
            })
        }
        
        /* fixed ui style */
        $box.find('button').each(function() {
            var $element = $(this), icon = $element.data('icon')
            
            $element.addClass('btn')
            
            if (icon && !$element.find('> i').length) {
                icon = 'fa-'+ icon.replace('fa-', '')
                
                if (!$element.data('bjui.icon')) {
                    $element.html('<i class="fa '+ icon +'"></i> '+ $element.html()).data('bjui.icon', true)
                }
            }
        })
        
        $box.find('input:text, input:password').each(function() {
            var $element = $(this).addClass('form-control'), size = $element.attr('size') || 0, width = size * 10
                
            width && $element.css('width', width)
        })
        
        $box.find('textarea').each(function() {
            var $element = $(this).addClass('form-control'), cols = $element.attr('cols') || 0, width = cols * 10, toggle = $element.attr('data-toggle')
                
            width && $element.css('width', width)
            
            if (toggle && toggle == 'autoheight' && $.fn.autosize)
                $element.addClass('autosize').autosize()
        })
        
        $box.find('a.btn').each(function() {
            var $element = $(this), icon = $element.data('icon')
                
            if (icon && !$element.find('> i').length) {
                icon = 'fa-'+ icon.replace('fa-', '')
                
                if (!$element.data('bjui.icon')) {
                    $element.html('<i class="fa '+ icon +'"></i> '+ $element.html()).data('bjui.icon', true)
                }
            }
        })
        
        /* form validate */
        if ($.fn.validator) {
            $box.find('form[data-toggle="validate"]').each(function() {
                var $element = $(this), alertmsg = (typeof $element.data('alertmsg') == 'undefined') ? true : $element.data('alertmsg')
                
                $(this)
                    .validator({
                        valid: function(form) {
                            $(form).bjuiajax('ajaxForm', $(form).data())
                        },
                        validClass : 'ok',
                        msgClass   : 'n-bottom',
                        theme      : 'red_bottom_effect_grid'
                    })
                    .on('invalid.form', function(e, form, errors) {
                        if (alertmsg) $(form).alertmsg('error', BJUI.regional.validatemsg.replaceMsg(errors.length))
                    })
            })
        }
        
        /* moreSearch */
        $box.find('[data-toggle="moresearch"]').each(function() {
            var $element = $(this),
                $parent  = $element.closest('.bjui-pageHeader'),
                $more    = $parent && $parent.find('.bjui-moreSearch'),
                name     = $element.data('name')
            
            if (!$element.attr('title')) $element.attr('title', '更多查询条件')
            $element.click(function(e) {
                if (!$more.length) {
                    BJUI.debug('Not created \'moresearch\' box[class="bjui-moreSearch"]!')
                    return
                }
                $more.css('top', $parent.outerHeight() - 1)
                if ($more.is(':visible')) {
                    $element.html('<i class="fa fa-angle-double-down"></i>')
                    if (name) $('body').data('moresearch.'+ name, false)
                } else {
                    $element.html('<i class="fa fa-angle-double-up"></i>')
                    if (name) $('body').data('moresearch.'+ name, true)
                }
                $more.fadeToggle('slow', 'linear')
                
                e.preventDefault()
            })
            
            if (name && $('body').data('moresearch.'+ name)) {
                $more.css('top', $parent.outerHeight() - 1).fadeIn()
                $element.html('<i class="fa fa-angle-double-up"></i>')
            }
        })
        
        /* bootstrap - select */
        if ($.fn.selectpicker) {
            var $selectpicker       = $box.find('select[data-toggle="selectpicker"]')
            var bjui_select_linkage = function($obj, $next) {
                if (!$next || !$next.length) return
                
                var refurl    = $obj.data('refurl')
                var _setEmpty = function($select) {
                    var $_nextselect = $($select.data('nextselect'))
                    
                    if ($_nextselect && $_nextselect.length) {
                        var emptytxt = $_nextselect.data('emptytxt') || '&nbsp;'
                        
                        $_nextselect.html('<option>'+ emptytxt +'</option>').selectpicker('refresh')
                        _setEmpty($_nextselect)
                    }
                }
                
                if (($next && $next.length) && refurl) {
                    var val = $obj.data('val'), nextVal = $next.data('val'), keys = $obj.data('keys')
                    
                    if (keys && typeof keys === 'string')
                        keys = keys.toObj()
                    if (!keys)
                        keys = {}
                    
                    if (typeof val === 'undefined') val = $obj.val()
                    $.ajax({
                        type     : 'POST',
                        dataType : 'json', 
                        url      : refurl.replace('{value}', encodeURIComponent(val)), 
                        cache    : false,
                        data     : {},
                        success  : function(json) {
                            if (!json) return
                            
                            var html = '', selected = ''
                            
                            $.each(json, function(i) {
                                var value, label
                                
                                if (json[i] && json[i].length) {
                                    value = json[i][0]
                                    label = json[i][1]
                                } else {
                                    value = json[i][keys.value || 'value']
                                    label = json[i][keys.label || 'label']
                                }
                                if (typeof nextVal !== 'undefined') selected = value == nextVal ? ' selected' : ''
                                html += '<option value="'+ value +'"'+ selected +'>' + label + '</option>'
                            })
                            
                            $obj.removeAttr('data-val').removeData('val')
                            $next.removeAttr('data-val').removeData('val')
                            
                            if (!html) {
                                html = $next.data('emptytxt') || '&nbsp;'
                                html = '<option>'+ html +'</option>'
                            }
                            
                            $next.html(html).selectpicker('refresh')
                            _setEmpty($next)
                        },
                        error   : BJUI.ajaxError
                    })
                }
            }
            
            $selectpicker.each(function() {
                var $element  = $(this)
                var options   = $element.data()
                var $next     = $(options.nextselect)
                
                $element.addClass('show-tick')
                if (!options.style) $element.data('style', 'btn-default')
                if (!options.width) $element.data('width', 'auto')
                if (!options.container) $element.data('container', 'body')
                else if (options.container == true) $element.attr('data-container', 'false').data('container', false)
                
                $element.selectpicker()
                
                if ($next && $next.length && (typeof $next.data('val') != 'undefined'))
                    bjui_select_linkage($element, $next)
            })
            
            /* bootstrap - select - linkage && Trigger validation */
            $selectpicker.change(function() {
                var $element    = $(this)
                var $nextselect = $($element.data('nextselect'))
                
                bjui_select_linkage($element, $nextselect)
                
                /* Trigger validation */
                if ($element.attr('aria-required')) {
                    $.fn.validator && $element.trigger('validate')
                }
            })
        }
        
        if ($.fn.zTree) {
            /* zTree - plugin */
            $box.find('[data-toggle="ztree"]').each(function() {
                var $this = $(this), op = $this.data(), options = op.options, _setting
                
                if (options && typeof options === 'string') options = options.toObj()
                if (options) $.extend(op, typeof options === 'object' && options)
                
                _setting = op.setting
                
                if (!op.nodes) {
                    op.nodes = []
                    $this.find('> li').each(function() {
                        var $li   = $(this)
                        var node  = $li.data()
                        
                        if (node.pid) node.pId = node.pid
                        node.name = $li.html()
                        op.nodes.push(node)
                    })
                    $this.empty()
                } else {
                    if (typeof op.nodes === 'string') {
                        if (op.nodes.trim().startsWith('[') || op.nodes.trim().startsWith('{')) {
                            op.nodes = op.nodes.toObj()
                        } else {
                            op.nodes = op.nodes.toFunc()
                        }
                    }
                    if (typeof op.nodes === 'function') {
                        op.nodes = op.nodes.call(this)
                    }
                    
                    $this.removeAttr('data-nodes')
                }
                
                if (!op.showRemoveBtn) op.showRemoveBtn = false
                if (!op.showRenameBtn) op.showRenameBtn = false
                if (op.addHoverDom && typeof op.addHoverDom !== 'function')       op.addHoverDom    = (op.addHoverDom === 'edit')    ? _addHoverDom    : op.addHoverDom.toFunc()
                if (op.removeHoverDom && typeof op.removeHoverDom !== 'function') op.removeHoverDom = (op.removeHoverDom === 'edit') ? _removeHoverDom : op.removeHoverDom.toFunc()
                if (!op.maxAddLevel)   op.maxAddLevel   = 2
                
                var setting = {
                    view: {
                        addHoverDom    : op.addHoverDom || null,
                        removeHoverDom : op.removeHoverDom || null,
                        addDiyDom      : op.addDiyDom ? op.addDiyDom.toFunc() : null
                    },
                    edit: {
                        enable        : op.editEnable,
                        showRemoveBtn : op.showRemoveBtn,
                        showRenameBtn : op.showRenameBtn
                    },
                    check: {
                        enable    : op.checkEnable,
                        chkStyle  : op.chkStyle,
                        radioType : op.radioType
                    },
                    callback: {
                        onClick       : op.onClick      ? op.onClick.toFunc()      : null,
                        beforeDrag    : op.beforeDrag   ? op.beforeDrag.toFunc()   : _beforeDrag,
                        beforeDrop    : op.beforeDrop   ? op.beforeDrop.toFunc()   : _beforeDrop,
                        onDrop        : op.onDrop       ? op.onDrop.toFunc()       : null,
                        onCheck       : op.onCheck      ? op.onCheck.toFunc()      : null,
                        beforeRemove  : op.beforeRemove ? op.beforeRemove.toFunc() : null,
                        onRemove      : op.onRemove     ? op.onRemove.toFunc()     : null,
                        onNodeCreated : _onNodeCreated,
                        onCollapse    : _onCollapse,
                        onExpand      : _onExpand
                    },
                    data: {
                        simpleData: {
                            enable: op.simpleData || true
                        },
                        key: {
                            title: op.title || ''
                        }
                    }
                }
                
                if (_setting && typeof _setting === 'string') _setting = _setting.toObj()
                if (_setting) $.extend(true, setting, typeof _setting === 'object' && _setting)
                
                $.fn.zTree.init($this, setting, op.nodes)
                
                var IDMark_A = '_a'
                var zTree    = $.fn.zTree.getZTreeObj($this.attr('id'))
                
                if (op.expandAll) zTree.expandAll(true)
                
                // onCreated
                function _onNodeCreated(event, treeId, treeNode) {
                    if (treeNode.faicon) {
                        var $a    = $('#'+ treeNode.tId +'_a')
                        
                        if (!$a.data('faicon')) {
                            $a.data('faicon', true)
                              .addClass('faicon')
                              .find('> span.button').append('<i class="fa fa-'+ treeNode.faicon +'"></i>')
                        }
                    }
                    if (op.onNodeCreated) {
                        op.onNodeCreated.toFunc().call(this, event, treeId, treeNode)
                    }
                }
                // onCollapse
                function _onCollapse(event, treeId, treeNode) {
                    if (treeNode.faiconClose) {
                        $('#'+ treeNode.tId +'_ico').find('> i').attr('class', 'fa fa-'+ treeNode.faiconClose)
                    }
                    
                    if (op.onCollapse) {
                        op.onCollapse.toFunc().call(this, event, treeId, treeNode)
                    }
                }
                // onExpand
                function _onExpand(event, treeId, treeNode) {
                    if (treeNode.faicon && treeNode.faiconClose) {
                        $('#'+ treeNode.tId +'_ico').find('> i').attr('class', 'fa fa-'+ treeNode.faicon)
                    }
                    if (op.onExpand) {
                        op.onExpand.toFunc().call(this, event, treeId, treeNode)
                    }
                }
                // add button, del button
                function _addHoverDom(treeId, treeNode) {
                    var level = treeNode.level
                    var $obj  = $('#'+ treeNode.tId + IDMark_A)
                    var $add  = $('#diyBtn_add_'+ treeNode.id)
                    var $del  = $('#diyBtn_del_'+ treeNode.id)
                    
                    if (!$add.length) {
                        if (level < op.maxAddLevel) {
                            $add = $('<span class="tree_add" id="diyBtn_add_'+ treeNode.id +'" title="添加"></span>')
                            $add.appendTo($obj);
                            $add.on('click', function(){
                                zTree.addNodes(treeNode, {name:'新增Item'})
                            })
                        }
                    }
                    
                    if (!$del.length) {
                        var $del = $('<span class="tree_del" id="diyBtn_del_'+ treeNode.id +'" title="删除"></span>')
                        
                        $del
                            .appendTo($obj)
                            .on('click', function(event) {
                                var delFn = function() {
                                    $del.alertmsg('confirm', '确认要删除 '+ treeNode.name +' 吗？', {
                                        okCall: function() {
                                            zTree.removeNode(treeNode)
                                            if (op.onRemove) {
                                                var fn = op.onRemove.toFunc()
                                                
                                                if (fn) fn.call(this, event, treeId, treeNode)
                                            }
                                        },
                                        cancelCall: function () {
                                            return
                                        }
                                    })
                                }
                                
                                if (op.beforeRemove) {
                                    var fn = op.beforeRemove.toFunc()
                                    
                                    if (fn) {
                                        var isdel = fn.call(fn, treeId, treeNode)
                                        
                                        if (isdel && isdel == true) delFn()
                                    }
                                } else {
                                    delFn()
                                }
                            }
                        )
                    }
                }
                
                // remove add button && del button
                function _removeHoverDom(treeId, treeNode) {
                    var $add = $('#diyBtn_add_'+ treeNode.id)
                    var $del = $('#diyBtn_del_'+ treeNode.id)
                    
                    if ($add && $add.length) {
                        $add.off('click').remove()
                    }
                    
                    if ($del && $del.length) {
                        $del.off('click').remove()
                    }
                }
                
                // Drag
                function _beforeDrag(treeId, treeNodes) {
                    for (var i = 0; i < treeNodes.length; i++) {
                        if (treeNodes[i].drag === false) {
                            return false
                        }
                    }
                    return true
                }
                
                function _beforeDrop(treeId, treeNodes, targetNode, moveType) {
                    return targetNode ? targetNode.drop !== false : true
                }
            })
            
            /* zTree - drop-down selector */
            
            var $selectzTree = $box.find('[data-toggle="selectztree"]')
            
            $selectzTree.each(function() {
                var $this   = $(this)
                var options = $this.data(),
                    $tree   = $(options.tree),
                    w       = parseFloat($this.css('width')),
                    h       = $this.outerHeight()
                
                options.width   = options.width || $this.outerWidth()
                options.height  = options.height || 'auto'
                
                if (!$tree || !$tree.length) return
                
                var treeid = $tree.attr('id')
                var $box   = $('#'+ treeid +'_select_box')
                var setPosition = function($box) {
                    var top        = $this.offset().top,
                        left       = $this.offset().left,
                        $clone     = $tree.clone().appendTo($('body')),
                        treeHeight = $clone.outerHeight()
                    
                    $clone.remove()
                    
                    var offsetBot = $(window).height() - treeHeight - top - h,
                        maxHeight = $(window).height() - top - h
                    
                    if (options.height == 'auto' && offsetBot < 0) maxHeight = maxHeight + offsetBot
                    $box.css({top:(top + h), left:left, 'max-height':maxHeight})
                }
                
                $this.click(function() {
                    if ($box && $box.length) {
                        setPosition($box)
                        $box.show()
                        return
                    }
                    
                    var zindex = 2
                    var dialog = $.CurrentDialog
                    
                    if (dialog && dialog.length) {
                        zindex = dialog.css('zIndex') + 1
                    }
                    $box  = $('<div id="'+ treeid +'_select_box" class="tree-box"></div>')
                                .css({position:'absolute', 'zIndex':zindex, 'min-width':options.width, height:options.height, overflow:'auto', background:'#FAFAFA', border:'1px #EEE solid'})
                                .hide()
                                .appendTo($('body'))
                    
                    $tree.appendTo($box).css('width','100%').data('fromObj', $this).removeClass('hide').show()
                    setPosition($box)
                    $box.show()
                })
                
                $('body').on('mousedown', function(e) {
                    var $target = $(e.target)
                    
                    if (!($this[0] == e.target || ($box && $box.length > 0 && $target.closest('.tree-box').length > 0))) {
                        $box.hide()
                    }
                })
                
                var $scroll = $this.closest('.bjui-pageContent')
                
                if ($scroll && $scroll.length) {
                    $scroll.scroll(function() {
                        if ($box && $box.length) {
                            setPosition($box)
                        }
                    })
                }
                
                //destroy selectzTree
                $this.on('destroy.bjui.selectztree', function() {
                    $box.remove()
                })
            })
        }
        
        /* accordion */
        /*$box.find('[data-toggle="accordion"]').each(function() {
            var $this = $(this), hBox = $this.data('heightbox'), height = $this.data('height')
            var initAccordion = function(hBox, height) {
                var offsety   = $this.data('offsety') || 0,
                    height    = height || ($(hBox).outerHeight() - (offsety * 1)),
                    $pheader  = $this.find('.panel-heading'),
                    h1        = $pheader.outerHeight()
                
                h1 = (h1 + 1) * $pheader.length
                $this.css('height', height)
                height = height - h1
                $this.find('.panel-collapse').find('.panel-body').css('height', height)
            }
            
            if ($this.find('> .panel').length) {
                if (hBox || height) {
                    initAccordion(hBox, height)
                    $(window).resize(function() {
                        initAccordion(hBox, height)
                    })
                    
                    $this.on('hidden.bs.collapse', function (e) {
                        var $last = $(this).find('> .panel:last'), $a = $last.find('> .panel-heading > h4 > a')
                        
                        if ($a.hasClass('collapsed'))
                            $last.css('border-bottom', '1px #ddd solid')
                    })
                }
            }
        })*/
        
        /* Kindeditor */
        if (KindEditor) {
            $box.find('textarea[data-toggle="kindeditor"]').each(function() {
                var $editor = $(this).removeClass('form-control'), options = $editor.data(), _op = options.options
                
                if (_op && typeof _op === 'string') _op = _op.toObj()
                if (_op && typeof _op === 'object') {
                    $.extend(options, _op)
                    delete options.options
                }
                
                if (options.items && typeof options.items === 'string')
                    options.items = options.items.replaceAll('\'', '').replaceAll(' ', '').split(',')
                if (options.afterUpload)         options.afterUpload = options.afterUpload.toFunc()
                if (options.afterSelectFile) options.afterSelectFile = options.afterSelectFile.toFunc()
                if (options.confirmSelect)     options.confirmSelect = options.confirmSelect.toFunc()
                
                var htmlTags = {
                    font : [/*'color', 'size', 'face', '.background-color'*/],
                    span : ['.color', '.background-color', '.font-size', '.font-family'
                            /*'.color', '.background-color', '.font-size', '.font-family', '.background',
                            '.font-weight', '.font-style', '.text-decoration', '.vertical-align', '.line-height'*/
                    ],
                    div : ['.margin', '.padding', '.text-align'
                            /*'align', '.border', '.margin', '.padding', '.text-align', '.color',
                            '.background-color', '.font-size', '.font-family', '.font-weight', '.background',
                            '.font-style', '.text-decoration', '.vertical-align', '.margin-left'*/
                    ],
                    table: ['align', 'width'
                            /*'border', 'cellspacing', 'cellpadding', 'width', 'height', 'align', 'bordercolor',
                            '.padding', '.margin', '.border', 'bgcolor', '.text-align', '.color', '.background-color',
                            '.font-size', '.font-family', '.font-weight', '.font-style', '.text-decoration', '.background',
                            '.width', '.height', '.border-collapse'*/
                    ],
                    'td,th': ['align', 'valign', 'width', 'height', 'colspan', 'rowspan'
                            /*'align', 'valign', 'width', 'height', 'colspan', 'rowspan', 'bgcolor',
                            '.text-align', '.color', '.background-color', '.font-size', '.font-family', '.font-weight',
                            '.font-style', '.text-decoration', '.vertical-align', '.background', '.border'*/
                    ],
                    a : ['href', 'target', 'name'],
                    embed : ['src', 'width', 'height', 'type', 'loop', 'autostart', 'quality', '.width', '.height', 'align', 'allowscriptaccess'],
                    img : ['src', 'width', 'height', 'border', 'alt', 'title', 'align', '.width', '.height', '.border'],
                    'p,ol,ul,li,blockquote,h1,h2,h3,h4,h5,h6' : [
                        'class', 'align', '.text-align', '.color', /*'.background-color', '.font-size', '.font-family', '.background',*/
                        '.font-weight', '.font-style', '.text-decoration', '.vertical-align', '.text-indent', '.margin-left'
                    ],
                    pre : ['class'],
                    hr : ['class', '.page-break-after'],
                    'br,tbody,tr,strong,b,sub,sup,em,i,u,strike,s,del' : []
                }
                
                KindEditor.create($editor, {
                    pasteType                : options.pasteType,
                    minHeight                : options.minHeight || 260,
                    autoHeightMode           : options.autoHeight || false,
                    items                    : options.items || KindEditor.options.items,
                    uploadJson               : options.uploadJson,
                    fileManagerJson          : options.fileManagerJson,
                    allowFileManager         : options.allowFileManager || true,
                    //fillDescAfterUploadImage : options.fillDescAfterUploadImage || true, //上传图片成功后转到属性页，为false则直接插入图片[设为true方便自定义函数(X_afterSelect)]
                    afterUpload              : options.afterUpload,
                    afterSelectFile          : options.afterSelectFile,
                    //X_afterSelect            : options.confirmSelect,
                    //htmlTags                 : htmlTags,
                    /*
                    cssPath                  : [
                                                    BJUI.PLUGINPATH + 'kindeditor_4.1.10/editor-content.css', 
                                                    BJUI.PLUGINPATH + 'kindeditor_4.1.10/plugins/code/prettify.css'
                                               ],
                    */
                    afterBlur                : function() { this.sync() }
                })
            })
        }
        
        if ($.fn.colorpicker) {
            /* colorpicker */
            $box.find('[data-toggle="colorpicker"]').each(function() {
                var $this     = $(this)
                var isbgcolor = $this.data('bgcolor')
                
                $this.colorpicker()
                if (isbgcolor) {
                    $this.on('changeColor', function(ev) {
                        $this.css('background-color', ev.color.toHex())
                    })
                }
            })
            
            $box.find('[data-toggle="clearcolor"]').each(function() {
                var $this   = $(this)
                var $target = $this.data('target') ? $($this.data('target')) : null
                
                if ($target && $target.length) {
                    $this.click(function() {
                        $target.val('')
                        if ($target.data('bgcolor')) $target.css('background-color', '')
                    })
                }
            })
        }
        
        /* tooltip */
        $box.find('[data-toggle="tooltip"]').each(function() {
            $(this).tooltip()
        })
        
        $box.find('[data-toggle="popover"]').each(function() {
            var $element = $(this), target = $element.data('target')
            
            if (target && $(target).length) {
                $element.attr('data-content', $(target).html())
            }
            
            $element.popover()
        })
        
        /* WebUploader */
        if (WebUploader) {
            var initWebUploader = function($element, index) {
                var old = $element.data('webuploader'), options = $element.data('options')
                
                if (old) {
                    old.destroy()
                    $element.data('webuploader.wrap').remove()
                }
                
                if (options) {
                    if (typeof options === 'string') {
                        options = options.trim().toObj()
                    }
                    
                    if (typeof options === 'object') {
                        $element.hide()
                        
                        var $wrap = $('<div id="uploader" class="wu-example"><div class="queueList"><div id="dndArea" class="placeholder"><div id="filePicker"></div><p>或将文件拖到这里</p></div></div><div class="statusBar" style="display:none;"><div class="progress"><span class="text">0%</span><span class="percentage"></span></div><div class="info"></div><div class="btns"><div id="filePicker2"></div><div class="uploadBtn">开始上传</div></div></div>'),
                        // 图片容器
                        $queue = $('<ul class="filelist"></ul>').appendTo($wrap.find('.queueList')),
                        // 状态栏，包括进度和控制按钮
                        $statusBar = $wrap.find('.statusBar'),
                        // 文件总体选择信息。
                        $info = $statusBar.find('.info'),
                        // 上传按钮
                        $upload = $wrap.find('.uploadBtn'),
                        // 没选择文件之前的内容。
                        $placeHolder = $wrap.find('.placeholder'),
                        // 总体进度条
                        $progress = $statusBar.find('.progress').hide(),
                        // 添加的文件数量
                        fileCount = 0,
                        // 添加的文件总大小
                        fileSize = 0,
                        // 优化retina, 在retina下这个值是2
                        ratio = window.devicePixelRatio || 1,
                        // 缩略图大小
                        thumbnailWidth = 110 * ratio,
                        thumbnailHeight = 110 * ratio,
                        // 可能有pedding, ready, uploading, confirm, done.
                        state = 'pedding',
                        // 所有文件的进度信息，key为file id
                        percentages = {},
                        supportTransition = (function() {
                            var s = document.createElement('p').style,
                                r = 'transition' in s ||
                                    'WebkitTransition' in s ||
                                    'MozTransition' in s ||
                                    'msTransition' in s ||
                                    'OTransition' in s
                            
                            s = null
                            
                            return r
                        })(),
                        // 图片访问基地址
                        basePath = options.basePath || '',
                        // WebUploader实例
                        uploader,
                        // 上传文件的单位(单位 + 类型)
                        upunit = options.upunit || '张图片'
                        
                        // 当有文件添加进来时执行，负责view的创建
                        var addFile = function(file, isuploaded, _index) {
                            if (!file && options.uploaded) {
                                $.each(options.uploaded.split(','), function(i, n) {
                                    var uploadedFile = {id:'WU_FILE_UP_'+ i, name:n.trim(), src:basePath + n.trim()}
                                    
                                    addFile(uploadedFile, true, i)
                                    
                                    fileCount++
                                })
                                
                                if (fileCount) {
                                    $placeHolder.addClass('element-invisible');
                                    $statusBar.show()
                                    setState('uploaded')
                                }
                                
                                return
                            }
                            
                            if (fileCount >= options.fileNumLimit) {
                                $statusBar.find('#filePicker2').hide()
                            }
                            
                            var uploadedAttr = isuploaded && upunit === '张图片' ? ' style="cursor:pointer;" data-toggle="dialog" data-options="{id:\'bjui-dialog-view-upload-image\', image:\''+ encodeURIComponent(file.src) +'\', width:800, height:500, mask:true, title:\'查看已上传图片\'}"' : '',
                                $li = $('<li class="'+ (isuploaded ? 'uploaded' : '') +'" id="'+ file.id +'_'+ index +'">' +
                                    '<p class="title">' + file.name + '</p>' +
                                    '<p class="imgWrap" '+ uploadedAttr +'></p>'+
                                    '<p class="progress"><span></span></p>' +
                                    '</li>'),
                                $btns = $('<div class="file-panel">' +
                                    '<span class="cancel">删除</span>' +
                                    '<span class="rotateRight">向右旋转</span>' +
                                    '<span class="rotateLeft">向左旋转</span></div>').appendTo($li),
                                $prgress = $li.find('p.progress span'),
                                $imgWrap = $li.find('p.imgWrap'),
                                $info = $('<p class="error"></p>'),
                                text = '',
                                showError = function(code) {
                                    switch(code) {
                                        case 'exceed_size':
                                            text = '文件大小超出'
                                            
                                            break
                                        case 'interrupt':
                                            text = '上传暂停'
                                            
                                            break
                                        default:
                                            text = '上传失败，请重试'
                                            
                                            break
                                    }
                                    
                                    $info.text(text).appendTo($li)
                                }
                            
                            if (!isuploaded) {
                                if (file.getStatus() === 'invalid') {
                                    showError(file.statusText)
                                } else {
                                    // @todo lazyload
                                    $imgWrap.text('预览中')
                                    uploader.makeThumb(file, function(error, src) {
                                        if (error) {
                                            $imgWrap.text('不能预览')
                                            return
                                        }
                                        
                                        var img = $('<img src="'+src+'">')
                                        
                                        $imgWrap.empty().append(img)
                                    }, thumbnailWidth, thumbnailHeight)
                                    
                                    percentages[file.id] = [file.size, 0]
                                    file.rotation = 0
                                }
                                
                                file.on('statuschange', function(cur, prev) {
                                    if (prev === 'progress') {
                                        $prgress.hide().width(0)
                                    } else if (prev === 'queued') {
                                        
                                    }
                                    
                                    // 成功
                                    if (cur === 'error' || cur === 'invalid') {
                                        showError(file.statusText)
                                        percentages[file.id][1] = 1
                                    } else if (cur === 'interrupt') {
                                        showError('interrupt')
                                    } else if (cur === 'queued') {
                                        percentages[file.id][1] = 0
                                    } else if (cur === 'progress') {
                                        $info.remove()
                                        $prgress.css('display', 'block')
                                    } else if (cur === 'complete') {
                                        $li.append('<span class="success"></span>')
                                    }
                                    
                                    $li.removeClass('state-' + prev).addClass('state-' + cur)
                                })
                            } else {
                                $imgWrap.empty().append('<img src="'+ file.src +'">')
                                if (options.initUploaded) {
                                    var arr = options.initUploaded.split(',')
                                    
                                    $li.append('<input type="hidden" class="upload" name="'+ (options.upname || $element.data('name')) +'" value="'+ arr[_index] +'">')
                                }
                            }
                            
                            $li.on('mouseenter', function() {
                                $btns.stop().animate({height: 30})
                            })
                            
                            $li.on('mouseleave', function() {
                                $btns.stop().animate({height: 0})
                            })
                            
                            $btns.on('click', 'span', function() {
                                var index = $(this).index(),
                                    deg
                                
                                switch (index) {
                                    case 0:
                                        if (isuploaded) {
                                            fileCount --
                                            removeFile(file)
                                            
                                            if (!fileCount) {
                                                setState('pedding');
                                            }
                                            uploader.refresh()
                                            updateTotalProgress()
                                        } else {
                                            uploader.removeFile(file)
                                        }
                                        
                                        return
                                    case 1:
                                        file.rotation += 90
                                        
                                        break
                                    case 2:
                                        file.rotation -= 90
                                        
                                        break
                                }
                                
                                if (supportTransition) {
                                    deg = 'rotate(' + file.rotation + 'deg)'
                                    $imgWrap.css({
                                        '-webkit-transform': deg,
                                        '-mos-transform': deg,
                                        '-o-transform': deg,
                                        'transform': deg
                                    })
                                } else {
                                    $imgWrap.css('filter', 'progid:DXImageTransform.Microsoft.BasicImage(rotation='+ (~~((file.rotation/90)%4 + 4)%4) +')')
                                }
                            })
                            
                            $li.appendTo($queue)
                        }
                        
                        // 负责view的销毁
                        var removeFile = function(file) {
                            var $li = $wrap.find('#'+ file.id +'_'+ index)
                            
                            delete percentages[file.id]
                            updateTotalProgress()
                            
                            $li.off().find('.file-panel').off().end().remove()
                            
                            if (fileCount < options.fileNumLimit) {
                                $statusBar.find('#filePicker2').show()
                            }
                        }
                        
                        var updateTotalProgress = function() {
                            var loaded = 0,
                                total  = 0,
                                spans  = $progress.children(),
                                percent
                            
                            $.each(percentages, function(k, v) {
                                total  += v[0]
                                loaded += v[0] * v[1]
                            })
                            
                            percent = total ? loaded / total : 0
                            
                            spans.eq(0).text(Math.round(percent * 100) + '%')
                            spans.eq(1).css('width', Math.round(percent * 100) + '%')
                            updateStatus()
                        }
                        
                        var updateStatus = function() {
                            var text = '', stats;
                            
                            if (state === 'ready') {
                                text = '选中'+ fileCount + upunit + '，共'+ WebUploader.formatSize(fileSize) +'。'
                            } else if (state === 'confirm') {
                                stats = uploader.getStats()
                                if (stats.uploadFailNum) {
                                    text = '已成功上传'+ stats.successNum + upunit +'，'+
                                        stats.uploadFailNum + upunit +'上传失败，<a class="retry" href="#">重新上传</a> 或 <a class="ignore" href="#">忽略</a>'
                                }
                                
                            } else if (state === 'uploaded') {
                                text = '已上传'+ fileCount + upunit
                            } else {
                                stats = uploader.getStats()
                                text = '共'+ fileCount + upunit +'（' + WebUploader.formatSize(fileSize) +'），已上传' + stats.successNum
                                
                                if (stats.uploadFailNum) {
                                    text += '，失败' + stats.uploadFailNum
                                }
                            }
                            
                            $info.html(text)
                            $element.data('fileCount', fileCount)
                        }
                        
                        var setState = function(val) {
                            var file, stats
                            
                            if (val === state) {
                                return
                            }
                            
                            $upload.removeClass('state-' + state)
                            $upload.addClass('state-' + val)
                            state = val
                            
                            switch (state) {
                                case 'pedding':
                                    $placeHolder.removeClass('element-invisible')
                                    $queue.parent().removeClass('filled')
                                    $queue.hide();
                                    $statusBar.addClass('element-invisible')
                                    uploader.refresh()
                                    
                                    break
                                case 'ready':
                                    $placeHolder.addClass('element-invisible')
                                    $wrap.find('#filePicker2').removeClass('element-invisible')
                                    $queue.parent().addClass('filled')
                                    $queue.show()
                                    $statusBar.removeClass('element-invisible')
                                    uploader.refresh()
                                    $upload.removeClass('disabled')
                                    
                                    break
                                case 'uploading':
                                    $wrap.find('#filePicker2').addClass('element-invisible')
                                    $progress.show()
                                    $upload.text('暂停上传')
                                    
                                    break
                                case 'paused':
                                    $progress.show()
                                    $upload.text('继续上传')
                                    
                                    break
                                case 'confirm':
                                    $progress.hide()
                                    $upload.text('开始上传').addClass('disabled')
                                    
                                    stats = uploader.getStats()
                                    if (stats.successNum && !stats.uploadFailNum) {
                                        setState('finish')
                                        return
                                    }
                                    
                                    break
                                case 'finish':
                                    stats = uploader.getStats()
                                    if (stats.successNum) {
                                        
                                    } else {
                                        // 没有成功的图片，重设
                                        state = 'done'
                                        
                                        BJUI.alertmsg('info', '上传失败！')
                                    }
                                    
                                    break
                                case 'uploaded':
                                    $upload.text('开始上传').addClass('disabled')
                                    
                                    break
                            }
                            
                            if (state !== 'uploaded')
                                updateStatus()
                        }
                        
                        $wrap.insertAfter($element)
                        
                        if (!WebUploader.Uploader.support()) {
                            alert('Web Uploader 不支持您的浏览器！如果你使用的是IE浏览器，请尝试升级 flash 播放器');
                            throw new Error('WebUploader does not support the browser you are using.');
                        }
                        
                        // 是否允许重新上传
                        if (typeof options.reupload === 'undefined')
                            options.reupload = true
                        
                        options = $.extend(true, {}, {
                            pick: {
                                id: $wrap.find('#filePicker'),
                                label: '点击选择图片'
                            },
                            dnd: $wrap.find('.queueList'),
                            paste: false,
                            accept: {
                                title: 'Images',
                                extensions: 'gif,jpg,jpeg,bmp,png',
                                mimeTypes: 'image/*'
                            },
                            swf: BJUI.PLUGINPATH + 'webuploader/Uploader.swf', // swf文件路径
                            disableGlobalDnd: false,
                            chunked: false,
                            server: null,
                            fileNumLimit: 300,
                            fileSizeLimit: 200 * 1024 * 1024,        // 200 M
                            fileSingleSizeLimit: 50 * 1024 * 1024    // 50 M
                        }, options)
                        
                        // 实例化
                        uploader = WebUploader.create(options)
                        
                        // 如果有已上传的图片(编辑时)
                        if (typeof $element.data('uploaded') !== 'undefined')
                            options.uploaded = $element.data('uploaded')
                        if (options.uploaded) {
                            // 将已上传图片加到队列
                            addFile()
                            
                            $queue.parent().addClass('filled')
                        }
                        
                        // 上传成功
                        uploader.on('uploadSuccess', function(file, response) {
                            if (response[BJUI.keys.statusCode] != BJUI.statusCode.ok) {
                                BJUI.alertmsg('error', response.message)
                            } else {
                                var $li = $wrap.find('#'+ file.id +'_'+ index)
                                
                                $li.find('input.upload').remove().end()
                                    .append('<input type="hidden" class="upload" name="'+ (options.upname || $element.data('name')) +'" value="'+ response.filename +'">')
                            }
                        })
                        // 上传失败
                        uploader.on('uploadError', function(file, response) {
                            BJUI.alertmsg('error', response.message)
                        })
                        
                        // 添加“添加文件”的按钮，
                        if (options.fileNumLimit > 1) {
                            uploader.addButton({
                                id: $wrap.find('#filePicker2'),
                                label: '继续添加'
                            })
                            
                            if (fileCount >= options.fileNumLimit)
                                $statusBar.find('#filePicker2').hide()
                        }
                        
                        uploader.onUploadProgress = function(file, percentage) {
                            var $li = $wrap.find('#'+ file.id +'_'+ index),
                                $percent = $li.find('.progress span')
                            
                            $percent.css('width', percentage * 100 + '%')
                            percentages[file.id][1] = percentage
                            updateTotalProgress()
                        }
                        
                        uploader.onFileQueued = function(file) {
                            fileCount++
                            fileSize += file.size
                            
                            if (fileCount === 1) {
                                $placeHolder.addClass('element-invisible');
                                $statusBar.show()
                            }
                            
                            addFile(file)
                            setState('ready')
                            updateTotalProgress()
                        }
                        
                        uploader.onFileDequeued = function(file) {
                            fileCount--
                            fileSize -= file.size
                            
                            if (!fileCount) {
                                setState('pedding');
                            }
                            
                            removeFile(file)
                            updateTotalProgress()
                        }
                        
                        uploader.on('all', function(type) {
                            var stats
                            
                            switch(type) {
                                case 'uploadFinished':
                                    setState('confirm')
                                    
                                    break
                                case 'startUpload':
                                    setState('uploading')
                                    
                                    break
                                case 'stopUpload':
                                    setState('paused')
                                    
                                    break
                            }
                        })
                        
                        uploader.onError = function(code) {
                            if (code === 'Q_EXCEED_NUM_LIMIT') {
                                BJUI.alertmsg('info', '只允许上传'+ options.fileNumLimit + upunit +'！')
                            } else if (code === 'Q_TYPE_DENIED') {
                                BJUI.alertmsg('info', '不支持的文件类型！')
                            } else if (code === 'F_EXCEED_SIZE') {
                                BJUI.alertmsg('info', '文件太大了！')
                            } else if (code === 'F_DUPLICATE') {
                                BJUI.alertmsg('info', '已添加过该文件！')
                            } else {
                                BJUI.alertmsg('info', code)
                            }
                        }
                        
                        $upload.on('click', function() {
                            if ($(this).hasClass('disabled')) {
                                return false
                            }
                            
                            if (state === 'ready') {
                                uploader.upload()
                            } else if (state === 'paused') {
                                uploader.upload()
                            } else if (state === 'uploading') {
                                uploader.stop()
                            }
                        })
                        
                        $info.on('click', '.retry', function() {
                            uploader.retry()
                        })
                        
                        $info.on('click', '.ignore', function() {
                            alert('todo')
                        })
                        
                        $upload.addClass('state-' + state)
                        updateTotalProgress()
                        
                        $element.data('webuploader', uploader).data('webuploader.wrap', $wrap)
                    }
                }
            }
            
            $box.find('input[data-toggle="webuploader"]').each(function(i) {
                initWebUploader($(this), i)
                
                $(this).on('reload.webuploader', function() {
                    initWebUploader($(this), i)
                })
            })
        }
        
        /* fixed dropdown-menu width */
        $box.find('[data-toggle="dropdown"]').parent().on('show.bs.dropdown', function(e) {
            var $this = $(this), width = $this.outerWidth(), $menu = $this.find('> .dropdown-menu'), menuWidth = $menu.outerWidth()
            
            if (width > menuWidth) {
                $menu.css('min-width', width)
            }
        })
        
        /* not validate */
        if ($.fn.validator) {
            $box.find('form[data-toggle="ajaxform"]').each(function() {
                $(this).validator({ignore: ':input'})
                $(this).validator('destroy')
            })
        }
        
        /* ========================================================================
         * @description highCharts
         * @author 小策一喋 <xvpindex@qq.com>
         * @Blog http://www.topjui.com
         * ======================================================================== */
        var $highcharts = $box.find('[data-toggle="highcharts"]')
        
        $highcharts.each(function(){
            var $element = $(this)
            var options  = $element.data()
            
            $.get(options.url, function(chartData){
                $element.highcharts(chartData)
            }, 'json')
        })
        
        /* ========================================================================
         * @description ECharts
         * @author 小策一喋 <xvpindex@qq.com>
         * @Blog http://www.topjui.com
         * ======================================================================== */
        var $echarts = $box.find('[data-toggle="echarts"]')
        
        $echarts.each(function(){
            var $element = $(this)
            var options  = $element.data()
            var theme    = options.theme ? options.theme : 'default'
            var typeArr  = options.type.split(',')
            
            require.config({
                paths: {
                    echarts: BJUI.PLUGINPATH + 'echarts'
                }
            })
            
            require(
                [
                    'echarts',
                    'echarts/theme/' + theme,
                    'echarts/chart/' + typeArr[0],
                    typeArr[1] ? 'echarts/chart/' + typeArr[1] : 'echarts'
                ],
                function (ec,theme) {
                    var myChart = ec.init($element[0],theme)
                    
                    $.get(options.url, function(chartData){
                        myChart.setOption(chartData)
                    }, 'json')
                }
            )
        })
        
    })
    
}(jQuery);