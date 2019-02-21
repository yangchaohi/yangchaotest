//index.js
//获取应用实例
const app = getApp()
const socket = require('../js/socket.js')
Page({
  data: {
    StatusBar: app.globalData.StatusBar,
    CustomBar: app.globalData.CustomBar,
    talkMessage:[],
    talkMessagePreView:[],
    noPreMessage: true,
    motto: 'Hello World',
    userInfo: {},
    hasUserInfo: false,
    hiddenTalkBox:true,
    canIUse: wx.canIUse('button.open-type.getUserInfo')
  },
  //事件处理函数
  bindViewTap: function() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  //事件处理函数
  bindTestTap: function () {
    wx.navigateTo({
      url: '../test/test'
    })
  },
  bindDetailTap: function () {
    wx.navigateTo({
      url: '../detail/index'
    })
  },
  
  onLoad: function () {
    wx.showShareMenu({
      withShareTicket: true
    })
    
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse){
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
  },
  getUserInfo: function(e) {
    console.log(e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },
  onShow: function () {
    let that = this;
    wx.onSocketMessage(function (res) {
      console.log("onSocketMessage in common");
      let data = JSON.parse(res.data);
      let status = data['status'];
      if (status == 'talkMessage') {
        that.addTalkMessage(data);
      }
    });
  },
  addTalkMessage(data) {
    socket.addTalkMessage(this,data);
  },
  talkInput(e){
    socket.talkInput(this, e);
  },
  hiddenTalkBox(){
    socket.hiddenTalkBox(this);
  },
  showTalkBox(){
    socket.showTalkBox(this);
  },
  sendTalkMessage() {
    socket.sendTalkMessage(this);
  },
})
