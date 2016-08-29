var modulename, editID;
var parmsUrl = "";
var locateBtn = document.getElementById("locateBtn");
mui.init();

//B页面onload从服务器获取列表数据；
mui.plusReady(function() {
	//仅支持竖屏显示
	plus.screen.lockOrientation("portrait-primary");

	modulename = mui.currentWebview.modulename;
	editID = mui.currentWebview.editID;
	if(editID == -1) {
		parmsUrl = mui.currentWebview.parmsUrl;
	}
	if (modulename == "StubGroup") {
		locateBtn.style.display = "";
	}

	//从服务器获取数据
	getEdit();
});

/**
 * 从服务器获取表单
 */
function getEdit() {
	//console.log(editID);
	mui.ajax(app.getDomain() + "/cmpage/mob/edit", {
		data: {
			modulename: modulename,
			parmsUrl: parmsUrl,
			editID: editID
		},
		type: "post",
		dataType: 'json',
		timeout: 5000,
		error: function(request) {
			app.toast("服务器获取数据失败！");
		},
		success: function(data) {
			if (data.statusCode == 200) {
				var content = document.body.querySelector('.erp-commpage-edit');
				//console.log(data.editHtml);
				content.innerHTML += data.editHtml;
				registJS();
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

function registJS() {
	var datepickerbts = $('.datepicker');
	datepickerbts.each(function(i, datepickerbt) {
		var optionsJson = datepickerbt.getAttribute('data-options') || '{}';
		var options = JSON.parse(optionsJson);
		var datapicker = new mui.DtPicker(options);
		var btn = datepickerbt;
		var ref = datepickerbt.getAttribute('data-ref');
		datepickerbt.addEventListener('tap', function() {
			datapicker.show(function(rs) {
				document.getElementById(ref).value = rs.text;
				btn.innerHTML = rs.text;
				//datapicker.dispose();
			});
		}, false);
	});
	var citypickerbts = $('.citypicker');
	citypickerbts.each(function(i, citypickerbt) {
		var cityPicker = new mui.PopPicker({
			layer: 3
		});
		cityPicker.setData(cityData3);
		var btn = citypickerbt;
		var ref = citypickerbt.getAttribute('data-ref');
		citypickerbt.addEventListener('tap', function() {
			cityPicker.show(function(items) {
				btn.innerHTML = (items[0] || {}).text + " " + (items[1] || {}).text + " " + (items[2] || {}).text;
				document.getElementById(ref).value = (items[0] || {}).value + "," + (items[1] || {}).value + "," + (items[2] || {}).value;
				//cityPicker.dispose();
			});
		}, false);
	});
}

/**
 * 提交表单  parma=vala&parmb=valb
 */
function postData() {
	mui.ajax(app.getDomain() + "/cmpage/mob/save", {
		data: $(".erp-commpage-edit").serialize(),
		type: "post",
		dataType: 'json',
		timeout: 5000,
		error: function(request) {
			app.toast("服务器获取数据失败！");
		},
		success: function(data) {
			if (data.statusCode == 200) {
				app.toast(data.message);
				mui.back();
			} else {
				app.toast(data.message);
			}
		}
	});
}

function locate() {
	plus.nativeUI.confirm("确定要定位吗?", function(e) {
		if (e.index == 0) {
			plus.nativeUI.showWaiting("定位中...");
			app.getPosBaidu(function(lat, lon) {
				if (lat == 0 && lon == 0) {
					app.toast("定位失败！");
				} else {
					app.toast("定位成功！");
					document.getElementsByName("c_gis_lat")[0].value = lat;
					document.getElementsByName("c_gis_lng")[0].value = lon;
				}
				plus.nativeUI.closeWaiting();
			});
		}
	}, this.innerHTML, ["确定", "取消"]);
}