var formdata = {
    pageIndex: 1,
    pageSize: 10,
    pageTotal: 11
};
var searchHtml;
var searchInitHtml = null;

mui.init({
    swipeBack: false,
    pullRefresh: {
        container: '#listPage',
        down: {
            callback: pulldownRefresh
        },
        up: {
            contentrefresh: '正在加载...',
            callback: pullupRefresh
        }
    }
});

mui.ready(function () {

    //框架参数初始化设置
    cmpage.init();

    formdata.parmsUrl = JSON.stringify(mui("#parmsUrl")[0].value);
    formdata.modulename = mui("#modulename")[0].value;
    //formdata.gps = cmpage.gps;

    mui('#listPageHeight')[0].style.height = (document.documentElement.clientHeight - 50) + 'px';

    getListHtml();

});

/**
 * 下拉刷新具体业务实现
 */
function pulldownRefresh() {
    setTimeout(function () {
        document.body.querySelector('.cmpage-list').innerHTML = "";
        formdata.pageTotal = 11;
        formdata.pageIndex = 1;
        getListHtml();
        mui('#listPage').pullRefresh().endPulldownToRefresh(); //refresh completed
    }, 100);
}

/**
 * 上拉加载具体业务实现
 */
function pullupRefresh() {
    setTimeout(function () {
        //mui('#pullrefresh').pullRefresh().endPullupToRefresh(((formdata.pageIndex+1) * formdata.pageSize >= formdata.pageTotal)); //参数为true代表没有更多数据了。
        mui('#listPage').pullRefresh().endPullupToRefresh(false);
        getListHtml();
    }, 100);
}

/**
 * 从服务器取分页列表
 */
function getListHtml() {
    //console.log(JSON.stringify(formdata));
    if (formdata.pageIndex * formdata.pageSize < formdata.pageTotal) {
        mui.ajax("/cmpage/mob/list", {
            data: formdata,
            type: "post",
            dataType: 'json',
            timeout: 5000,
            error: function (request) {
                //console.log(JSON.stringify(request));
                mui.toast("服务器获取数据失败！");
            },
            success: function (data) {
                //app.debug(JSON.stringify(data));
                if (data.statusCode == 200) {
                    var list = document.body.querySelector('.cmpage-list');
                    list.innerHTML += data.listHtml;
                    formdata.pageTotal = data.count;
                    if (searchInitHtml == null) {
                        searchInitHtml = data.queryHtml;
                    }
                    //					document.body.querySelector('.cmpage-search').innerHTML = data.queryHtml;
                    cmpage.addEventListener();
                } else {
                    mui.toast("数据加载失败请稍后重试！");
                }
                formdata.pageIndex++;
            }
        });
    }
}

//搜索页面返回后的刷新
function doSearch() {
    document.body.querySelector('.cmpage-list').innerHTML = "";
    formdata = app.serializeToOjb(mui('#searchForm')[0]);
    formdata.pageIndex = 1;
    formdata.pageSize = 10;
    formdata.pageTotal = 11;
    //console.log(JSON.stringify(formdata));

    mui.trigger(document.getElementById("listTabIcon"), mui.EVENT_START)
    mui.trigger(document.getElementById("listTabIcon"), 'tap')
    //mui.trigger(document.getElementById("listTabIcon"),mui.EVENT_END)
    getListHtml();
    return false;
}

function resetSearch() {
    console.log(searchInitHtml);
    document.body.querySelector('.cmpage-search').innerHTML = searchInitHtml;
    cmpage.addEventListener();
    mui.toast("条件已重置");
}

//新增按钮的处理
mui('body').on('tap', '.cmpage-btn-add', function (e) {
    var elem = this;
    window.open(this.getAttribute('href'));

});