(function($, owner) {
	/**
	 * md5加密
	 **/
	owner.debug = function() {
		//调试模式
		return true;
		//return false;
	}
	
	/**
	 * md5加密
	 **/
	owner.md5 = function(value) {
		return hex_md5(value);
	}
	
	/**
	 * 判断对象是否为空
	 **/
	owner.isEmpty = function (obj)
	{
		for (var name in obj)
		{
			return false;
		}
		return true;
	}

	/**
	 * 获取domain
	 **/
	owner.getDomain = function() {
		return owner.debug() ? "http://192.168.2.132:8300": "http://139.129.48.131:8300";
	}

	/**
	 * 获取应用本地配置
	 **/
	owner.setSettings = function(settings) {
		settings = settings || {};
		localStorage.setItem('$settings', JSON.stringify(settings));
	}

	/**
	 * 设置应用本地配置
	 **/
	owner.getSettings = function() {
		var settingsText = localStorage.getItem('$settings') || "{}";
		var settings = JSON.parse(settingsText);
		settings.autoLogin = settings.autoLogin || false;
		return settings;
	}

	/**
	 * 消息提示
	 **/
	owner.toast = function(value) {
		plus.nativeUI.toast(value);
	}


	/**
	 * 百度定位
	 **/
	owner.getPosBaidu = function(callback) {
		//console.log('getPosBaidu: '+owner.getNowFormatDate());
		plus.geolocation.getCurrentPosition(function (position) {
			var codns = position.coords; //获取地理坐标信息；
			//console.log(JSON.stringify(position.coords));
			callback(codns.latitude,codns.longitude);
		}, function(e) {
			callback(0,0);
			outSet("获取百度定位位置信息失败：" + e.message);
		}, {
			provider: 'baidu'
		});
	}


	/**
	 * 获取日期
	 **/
	owner.getDate = function() {
		var d = new Date();
		var year = d.getFullYear();
		var month = d.getMonth() + 1;
		var date = d.getDate();
		if(month < 10) {
			month = "0" + month;
		}
		if(date < 10) {
			date = "0" + date;
		}
		return year+month+date;
	}
	
	/**
	 * 获取星期
	 **/
	owner.getWeek = function() {
		var d = new Date();		
		return d.getDay();
	}

	/**
	 * 获取时间
	 **/
	owner.getTime = function() {
		var d = new Date();
		var hour = d.getHours();
		var minutes = d.getMinutes();
		var date = d.getDate();
		if(hour < 10) {
			hour = "0" + hour;
		}
		if(minutes < 10) {
			minutes = "0" + minutes;
		}
		return hour+":"+minutes;
	}
	
	/**
	 * 获取时间
	 **/
	owner.getNowFormatDate = function() {
		var date = new Date();
    var seperator1 = "-";
    var seperator2 = ":";
    var month = date.getMonth() + 1;
    var strDate = date.getDate();
    if (month >= 1 && month <= 9) {
        month = "0" + month;
    }
    if (strDate >= 0 && strDate <= 9) {
        strDate = "0" + strDate;
    }
    var currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate
            + " " + date.getHours() + seperator2 + date.getMinutes()
            + seperator2 + date.getSeconds();
    return currentdate;
	}
}(mui, window.app = {}));


/**
 * 从后端取数据加载到某个DIV
 **/
function formDataFromSrv(srvUrl, data, errorMsg, divClass) {
	mui.ajax(app.getDomain() + srvUrl, {
		data: data,
		type: "post",
		dataType: 'json',
		timeout: 5000,
		error: function(request) {
			app.toast(errorMsg);
		},
		success: function(ret) {
			//console.log(JSON.stringify(ret));
			var content = document.body.querySelector('.' + divClass);
			//业务数据获取完毕，并已插入当前页面DOM；
			content.innerHTML += ret.listPage;
		}
	});
}