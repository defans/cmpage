	mui('header').on('tap', '.cmpage-btn-search', function (e) {
		mui.fire(plus.webview.currentWebview(), "search_show", {});
	});

	/**
	 * 从服务器取分页列表
	 */
	function getListHtml() {
		//console.log(JSON.stringify(formdata));
		if (formdata.pageIndex * formdata.pageSize < formdata.pageTotal) {
			plus.nativeUI.showWaiting("数据加载中...");
			mui.ajax(app.getDomain() + "/cmpage/mob/list", {
				data: formdata,
				type: "post",
				dataType: 'json',
				timeout: 5000,
				error: function (request) {
					//console.log(JSON.stringify(request));
					app.toast("服务器获取数据失败！");
					plus.nativeUI.closeWaiting();
				},
				success: function (data) {
					//app.debug(JSON.stringify(data));
					if (data.statusCode == 200) {
						var table = document.body.querySelector('.cmpage-list');
						table.innerHTML += data.listHtml;
						formdata.pageTotal = data.count;
						searchHtml = data.queryHtml;
						if (searchInitHtml == null) {
							searchInitHtml = data.queryHtml;
						}
						document.body.querySelector('.cmpage-header').innerHTML = data.headerBtnsHtml;
					} else {
						app.toast("数据加载失败请稍后重试！");
					}
					formdata.pageIndex++;
					plus.nativeUI.closeWaiting();
				}
			});
		}
	}