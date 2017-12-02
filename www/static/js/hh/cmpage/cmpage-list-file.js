var formdata = {
	pageIndex: 1,
	pageSize: 10,
	pageTotal:11
};
mui.init();


//B页面onload从服务器获取列表数据；
mui.plusReady(function() {
	//仅支持竖屏显示
	plus.screen.lockOrientation("portrait-primary");

	mui.previewImage();

	cmpage.init();
	cmpage.addEventListener();
	
	formdata.modulename = cmpage.modulename;
	formdata.parmsUrl = JSON.stringify(cmpage.parmsUrl);
	formdata.gps = cmpage.gps;

	//从服务器获取数据
	getFiles();
});

/**
 * 从服务器获取表单
 */
function getFiles() {
	mui.ajax(app.getDomain() + '/cmpage/mob/list', {
		data: formdata,
		type: "post",
		dataType: 'json',
		timeout: 5000,
		error: function(request) {
			app.toast("服务器获取数据失败！");
		},
		success: function(data) {
			if (data.statusCode == 200) {
				var listHtml = data.listHtml.replace(/#domainName#/g,app.getDomain());
				document.body.querySelector('.cmpage-file').innerHTML += listHtml;
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


//添加自定义事件监听是否要显示数据
window.addEventListener('file_list_refresh', function(event) {
	setTimeout(function() {
		var content = document.body.querySelector('.cmpage-file');
		content.innerHTML = "";
		getFiles();
	}, 100);
});


