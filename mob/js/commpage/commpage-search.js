var modulename, id, main, firstPage;
var parms = "";
var content = document.body.querySelector('.erp-commpage-search');

mui.init();

mui.plusReady(function() {
	//仅支持竖屏显示
	plus.screen.lockOrientation("portrait-primary");
	currentView = plus.webview.currentWebview();	
	content.innerHTML = currentView.page;
	modulename = currentView.modulename;
	firstPage = currentView.firstpage;

	//关闭等待框
	plus.nativeUI.closeWaiting();
	//显示当前页面
	mui.currentWebview.show();
	
	main = plus.webview.currentWebview().opener();
	
	registJS();
});

$.fn.serializeObject = function()    
{    
   var o = {};    
   var a = this.serializeArray();    
   $.each(a, function() {    
       if (o[this.name]) {    
           if (!o[this.name].push) {    
               o[this.name] = [o[this.name]];    
           }    
           o[this.name].push(this.value || '');    
       } else {    
           o[this.name] = this.value || '';    
       }    
   });    
   return o;    
};  

/**
 * 提交表单
 */
function postData() {
	var value = $(".erp-commpage-search").serializeObject();
	mui.fire(main,"search_callback",{data: value});
	mui.back();
	
//	mui.ajax(app.getDomain() + "/Commpage/PageMobShow", {
//		data: value,
//		type: "post",
//		dataType: 'json',
//		timeout: 5000,
//		error: function(request) {
//			app.toast("服务器获取数据失败！");
//		},
//		success: function(data) {
//			if (data.statusCode == 200) {
//				setTimeout(function() {
//					mui.openWindow({
//						id: "../../html/commpage/commpage-searchresult.html",
//						url: "../../html/commpage/commpage-searchresult.html",
//						extras: {
//							modulename: modulename,
//							listPage: data.listPage
//						},
//						show: {
//							autoShow: false
//						}
//					});
//				}, 100);
//
//			} else {
//				app.toast(data.message);
//			}
//		}
//	});
}

function reset() {
	content.innerHTML = firstPage;
	registJS();
	app.toast("条件已重置");
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