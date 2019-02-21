//app.js
App({
  onLaunch: function () {
    wx.getSystemInfo({
      success: e => {
        this.globalData.StatusBar = e.statusBarHeight;
        this.globalData.CustomBar = e.platform == 'android' ? e.statusBarHeight + 50 : e.statusBarHeight + 45;
      }
    })
    
    var that = this;
    console.log("connectSocket")
    this.linkSocket();
    this.initEventHandle();

    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
    var code = "";
    // 登录
    wx.login({
      success: res => {
        console.log("login")
        console.log(res)
        if (res.code) {
            code = res.code;
　　　　　　} else {
　　　　　　　　console.log('获取用户登录态失败！' + res.errMsg);
　　　　　　}
      }
    })
    // 获取用户信息
    wx.getSetting({
      success: res => {
        //console.log(res);
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            withCredentials: true,
            success: res => {
              
              // 可以将 res 发送给后台解码出 unionId
              this.globalData.userInfo = res.userInfo
              console.log(res.userInfo)
              this.getNeededUserInfoWidthInfo(code, res.encryptedData, res.iv);
              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            }
          })
        }
      }
    })
  },
  linkSocket(){
    wx.connectSocket({
      url: 'ws://47.94.147.93:8282'
    });
  },
  initEventHandle() {
    var that = this
    wx.onSocketClose(function (res) {
      that.reconnect()
    });

    wx.onSocketOpen(function (res) {
      that.globalData.socketOpen = true;
      console.log("onSocketOpen");
      var app = getApp();
      if (app.globalData.openId){
        that.sendSocketMessage(app.globalData.openId);
      }
    })

    wx.onSocketMessage(function (res) {
      console.log("onSocketMessage");
      console.log(res);
    });

    wx.onSocketError(function (res) {
      that.reconnect()
    })
    wx.onSocketClose(function (res) {
      console.log('WebSocket 已关闭！')
      that.reconnect();
    })
  },
  reconnect() {
    if (this.lockReconnect) return;
    this.lockReconnect = true;
    clearTimeout(this.timer)
    this.timer = setTimeout(() => {
      this.linkSocket();
      this.lockReconnect = false;
    }, 2000);
  },
  sendSocketMessage:function(openId) {
    console.log("sendSocketMessage:"+this.globalData.socketOpen)
    var message = {};
    message["type"] = "init";
    message["openId"] = openId;
    console.log(message)
    if (this.globalData.socketOpen==true) {
      wx.sendSocketMessage({
        data: JSON.stringify(message)
      })
    } 
  },
  getNeededUserInfoWidthInfo: function (code, enc, iv) {
      var that = this;
　　　　wx.request({
        url: 'http://' + this.globalData.doamin+'/?c=api/oauth/initWeixin&debug=true',
  　　　　　　method: 'POST',
            header: {
              'content-type': 'application/x-www-form-urlencoded' // 默认值
            },
  　　　　　　data: {
    　　　　　　　　code: code,
    　　　　　　　　encryptedData: enc,
    　　　　　　　　iv: iv
  　　　　　　},
  　　　　　　success: function (res) {
                console.log("getNeededUserInfoWidthInfo")
                console.log(res)
                let uid = res.data.data.info.id;
                let openId = res.data.data.info.open_id;
                console.log(uid)
                var app = getApp();
                app.globalData.uid = uid;
                app.globalData.openId = openId;
                that.sendSocketMessage(openId);
    　　　　　　　　// 可以返回前端需要的用户信息（包括unionid、openid、user_id等）
  　　　　　　}
　　　　})
　　},
  globalData: {
    userInfo: null,
    uid:0,
    socketOpen:false,
    doamin:"47.94.147.93"
  }
})