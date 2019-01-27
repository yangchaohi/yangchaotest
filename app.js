//app.js
App({
  onLaunch: function () {
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

        console.log(res);
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            withCredentials: true,
            success: res => {
              
              // 可以将 res 发送给后台解码出 unionId
              this.globalData.userInfo = res.userInfo
              console.log(res.userInfo)
              this.getNeededUserInfoWidthInfo(code, res.encryptedData, res.encryptedData);
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
  getNeededUserInfoWidthInfo: function (code, enc, iv) {
　　　　wx.request({
      url: 'http://yc.com:2017/?c=api/oauth/initWeixin',
  　　　　　　method: 'POST',
  　　　　　　data: {
    　　　　　　　　code: code,
    　　　　　　　　encryptedData: enc,
    　　　　　　　　iv: iv
  　　　　　　},
  　　　　　　success: function (res) {
    　　　　　　　　// 可以返回前端需要的用户信息（包括unionid、openid、user_id等）
  　　　　　　}
　　　　})
　　},
  globalData: {
    userInfo: null
  }
})