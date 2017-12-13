var modulename, id;
var parms = "";
mui.init();

//B页面onload从服务器获取列表数据；
mui.plusReady(function () {
	//仅支持竖屏显示
	plus.screen.lockOrientation("portrait-primary");

	cmpage.init();

	//从服务器获取数据
	getView();
});

/**
 * 从服务器获取表单
 */
function getView() {
	mui.ajax(app.getDomain() + "/cmpage/mob/view", {
		data: {
			modulename: cmpage.modulename,
			curID: cmpage.curID
		},
		type: "post",
		dataType: 'json',
		timeout: 5000,
		error: function (request) {
			//console.log(JSON.stringify(request));
			app.toast("服务器获取数据失败！");
			plus.nativeUI.closeWaiting();
		},
		success: function (data) {
			//			console.log(JSON.stringify(data));
			if (data.statusCode == 200) {
				var content = document.body.querySelector('.erp-cmpage-view');
				content.innerHTML += data.viewHtml;
			} else {
				app.toast("数据加载失败请稍后重试！");
			}

			//关闭等待框
			plus.nativeUI.closeWaiting();
			//显示当前页面
			mui.currentWebview.show();
		}
	});
}