var ws = null;
var scan = null;
var barcode = document.getElementById("barcode");
var parm,opener;
var flash = false;

// H5 plus事件处理
mui.init();
mui.plusReady(function() {

	opener = plus.webview.currentWebview().opener();
	// 获取窗口对象
	ws = mui.currentWebview;
	// 开始扫描
	ws.addEventListener('show', function() {
		scan = new plus.barcode.Barcode('bcid');
		scan.onmarked = onmarked;
		scan.start({
			conserve: true,
			filename: "_doc/barcode/"
		});		
	});
	ws.show();

	parm = eval('(' + ws.parm + ')');
});

// 二维码扫描成功
function onmarked(type, result, file) {
	switch (type) {
		case plus.barcode.QR:
			type = "QR";
			break;
		case plus.barcode.EAN13:
			type = "EAN13";
			break;
		case plus.barcode.EAN8:
			type = "EAN8";
			break;
		default:
			type = "其它";
			break;
	}
	result = result.replace(/\n/g, '');
	barcode.value = result;
};

function setFlash() {
	flash = !flash;
	scan.setFlash(flash);
}

/**
 * 从服务器获取表单
 */
function addStub() {
	var sno = barcode.value;
	if (sno == null || sno == "") {
		app.toast("请扫描或输入二维码！");
		return
	}
	parm.sno = sno;
	mui.ajax(app.getDomain() + "/Stub/StubAddMob", {
		data: parm,
		type: "post",
		dataType: 'json',
		timeout: 5000,
		error: function(request) {
			app.toast("服务器通信失败！");
		},
		success: function(data) {
			if(data.message){
				app.toast(data.message);
			}			
			if (data.statusCode == 200) {
				mui.fire(opener,"stub_list_refresh", data);
				mui.back();
			}
		}
	});
};