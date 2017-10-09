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
				if (data.external)   liHtml.add(', external:true')

                liHtml.add('}"')
				//console.log(JSON.stringify(data))
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
                        upunit = options.upunit || '个文件'

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

/*!
 * B-JUI  v1.2 (http://b-jui.com)
 * Git@OSC (http://git.oschina.net/xknaan/B-JUI)
 * Copyright 2014 K'naan (xknaan@163.com).
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 */

/* ========================================================================
 * B-JUI: bjui-lookup.js  v1.2
 * @author K'naan (xknaan@163.com)
 * -- Modified from dwz.database.js (author:ZhangHuihua@msn.com)
 * http://git.oschina.net/xknaan/B-JUI/blob/master/BJUI/js/bjui-lookup.js
 * ========================================================================
 * Copyright 2014 K'naan.
 * Licensed under Apache (http://www.apache.org/licenses/LICENSE-2.0)
 * ======================================================================== */

+function ($) {
    'use strict';
    
    // LOOKUP GLOBAL ELEMENTS
    // ======================
    
    var group, suffix, $currentLookup
    
    // LOOKUP CLASS DEFINITION
    // ======================
    
    var Lookup = function(element, options) {
        this.$element = $(element)
        this.options  = options
        this.$lookBtn = null
    }
    
    Lookup.DEFAULTS = {
        url       : null,
        id        : null,
        mask      : true,
        width     : 600,
        height    : 400,
        title     : 'Lookup',
        maxable   : true,
        resizable : true
    }
    
    Lookup.EVENTS = {
        afterChange : 'afterchange.bjui.lookup'
    }
    
    Lookup.prototype.init = function() {
        var that = this, options = this.options, tools = this.tools
        
        if (!options.url) {
            BJUI.debug('Lookup Plugin: Error trying open a lookup dialog, url is undefined!')
            return false
        } else {
            options.url = decodeURI(options.url).replacePlh(that.$element.closest('.unitBox'))
            if (!options.url.isFinishedTm()) {
                that.$element.alertmsg('error', (options.warn || FRAG.alertPlhMsg.replace('#plhmsg#', BJUI.regional.plhmsg)))
                BJUI.debug('Lookup Plugin: The lookup\'s url is incorrect, url:'+ options.url)
                return false
            }
            options.url = encodeURI(options.url)
        }
        
        group          = this.options.group  || null
        suffix         = this.options.suffix || null
        $currentLookup = this.$element
        
        if (suffix) suffix = suffix.trim()
        
        this.open(that.$element)
    }
    
    Lookup.prototype.addBtn = function() {
        var that = this, $element = that.$element
        
        if (!this.$lookBtn && !$element.parent().hasClass('wrap_bjui_btn_box')) {
            this.$lookBtn = $(FRAG.lookupBtn)
            this.$element.css({'paddingRight':'15px'}).wrap('<span class="wrap_bjui_btn_box"></span>')
            
            var $box   = this.$element.parent()
            var height = this.$element.addClass('form-control').innerHeight()
            
            $box.css({'position':'relative', 'display':'inline-block'})
            
            $.each(that.options, function(key, val) {
                if (key != 'toggle') that.$lookBtn.data(key, val)
            })
            this.$lookBtn.css({'height':height, 'lineHeight':height +'px'}).appendTo($box)
            this.$lookBtn.on('selectstart', function() { return false })
        }
    }
    
    Lookup.prototype.open = function($obj) {
        var that = this, options = this.options
        
        $obj.dialog({id:options.id || 'lookup_dialog', url:options.url, title:options.title, width:options.width, height:options.height, mask:options.mask, maxable:options.maxable, resizable:options.resizable})
    }
    
    Lookup.prototype.getField = function(key) {
        return (group ? (group +'.') : '') + (key) + (suffix ? suffix : '')
    }
    
    Lookup.prototype.setSingle = function(args,type) {
        if (typeof args == 'string')
            args  = new Function('return '+ args)()
        this.setVal(args,type)
    }
    
    Lookup.prototype.setMult = function(id,type) {
        var args  = {}
        var $unitBox = this.$element.closest('.unitBox')
        
        $unitBox.find('[name="'+ id +'"]').filter(':checked').each(function() {
            var _args = new Function('return '+ $(this).val())()
            
            for (var key in _args) {
                var value = args[key] ? args[key] +',' : ''
                
                args[key] = value + _args[key]
            }
        })
        
        if ($.isEmptyObject(args)) {
            this.$element.alertmsg('error', this.$element.data('warn') || FRAG.alertSelectMsg)
            return
        }
        
        this.setVal(args,type)
    }
    
    Lookup.prototype.setVal = function(args, type) {
        var that = this
        var $box = $currentLookup.closest('.unitBox')
        var newValue  /* @description 增加 @author 小策一喋 */
        
        // for datagrid
        if ($currentLookup.data('customEvent')) {
            $currentLookup.trigger('customEvent.bjui.lookup', [args])
        } else {
            $box.find(':input').each(function() {
                var $input = $(this), inputName = $input.attr('name')
                
                for (var key in args) {
                    var name = that.getField(key)
                    
                    if (name == inputName) {

                        /* @description 增加 追加参数 @author 小策一喋 */
                        if(type == 1)
                            newValue = $input.val() ? $input.val() + ',' + args[key] : args[key]
                        else
                            newValue = args[key]

                        $input
                            .val(newValue) /* @description 修改 args[key] 为 newValue @author 小策一喋 */
                            .trigger(Lookup.EVENTS.afterChange, {value:args[key]})
                            
                        break
                    }
                }
            })
        }
        
        this.$element.dialog('closeCurrent')
    }
       
    // LOOKUP PLUGIN DEFINITION
    // =======================
    
    function Plugin(option) {
        var args     = arguments
        var property = option
        
        return this.each(function () {
            var $this   = $(this)
            var options = $.extend({}, Lookup.DEFAULTS, $this.data(), typeof option == 'object' && option)
            var data    = $this.data('bjui.lookup')
            
            if (!data) {
                $this.data('bjui.lookup', (data = new Lookup(this, options)))
            } else if ($this.data('newurl')) {
                data.options.url = $this.data('newurl')
                $this.data('bjui.dialog', null)
            }
            if (typeof property == 'string' && $.isFunction(data[property])) {
                [].shift.apply(args)
                if (!args) data[property]()
                else data[property].apply(data, args)
            } else {
                data.init()
            }
        })
    }

    var old = $.fn.lookup

    $.fn.lookup             = Plugin
    $.fn.lookup.Constructor = Lookup
    
    // LOOKUP NO CONFLICT
    // =================
    
    $.fn.lookup.noConflict = function () {
        $.fn.lookup = old
        return this
    }
    
    // LOOKUP DATA-API
    // ==============

    $(document).on(BJUI.eventType.initUI, function(e) {
        var $this = $(e.target).find('[data-toggle="lookup"]')
        
        if (!$this.length) return
        
        Plugin.call($this, 'addBtn')
    })
    
    $(document).on('click.bjui.lookup.data-api', '[data-toggle="lookupbtn"]', function(e) {
        var $this = $(this)
        
        if ($this.attr('href') && !$this.data('url')) $this.attr('data-url', $this.attr('href'))
        if (!$this.data('title')) $this.attr('data-title', $this.text())
        
        Plugin.call($this)
        
        e.preventDefault()
    })
    
    $(document).on('click.bjui.lookupback.data-api', '[data-toggle="lookupback"]', function(e) {
        var $this = $(this)
        var args  = $this.data('args')
        var mult  = $this.data('lookupid')
        var type = $('input[name="lookupType"]:checked').val() /* @description 新增 获取是否追加框值 @author 小策一喋 */
        
        if (args)
            Plugin.call($this, 'setSingle', args, type) /* @description 修改 增加type参数 @author 小策一喋 */
        else if (mult)
            Plugin.call($this, 'setMult', mult, type) /* @description 修改 增加type参数 @author 小策一喋 */
            
        e.preventDefault()
    })
    
}(jQuery);
