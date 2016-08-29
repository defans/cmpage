var get_url;
var get_parm;
mui.init();


//B页面onload从服务器获取列表数据；
mui.plusReady(function() {
	//仅支持竖屏显示
	plus.screen.lockOrientation("portrait-primary");

	mui.previewImage();

	get_url = mui.currentWebview.get_url;
	get_parm = eval('(' + mui.currentWebview.get_parm + ')');

	//从服务器获取数据
	getFiles();
});

/**
 * 从服务器获取表单
 */
function getFiles() {
	mui.ajax(app.getDomain() + get_url, {
		data: get_parm,
		type: "post",
		dataType: 'json',
		timeout: 5000,
		error: function(request) {
			app.toast("服务器获取数据失败！");
		},
		success: function(data) {
			if (data.statusCode == 200) {
				var content = document.body.querySelector('.erp-commpage-file');
				content.innerHTML += data.listPage;
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


//右侧弹出按钮点击事件
document.getElementById("add").addEventListener('tap', function(e) {
	e.stopPropagation();
	mui.openWindow({
		id: "/html/commpage/commpage-uploader.html",
		url: "/html/commpage/commpage-uploader.html",
		extras: {
			mainid: get_parm.mainID,
			maintype: get_parm.mainType,
			status: get_parm.statusID
		}
	});
});


//添加自定义事件监听是否要显示数据
window.addEventListener('file_list_refresh', function(event) {
	setTimeout(function() {
		var content = document.body.querySelector('.erp-commpage-file');
		content.innerHTML = "";
		getFiles();
	}, 100);
});