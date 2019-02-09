//index.js
//获取应用实例
const app = getApp()
const socket = require('../js/socket.js')
Page({
  data: {
    talkMessage:[],
    talkMessagePreView:[],
    noPreMessage: true,
    motto: 'Hello World',
    userInfo: {},
    hasUserInfo: false,
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
      url: '../detail/index?id=333'
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
    let talkMessage = this.data.talkMessage;
    var that = this;
    if (data.fromUid == app.globalData.uid) {
      data.isOwner = true;
    }
    talkMessage.push(data);

    let talkMessagePreView = this.data.talkMessagePreView;
    let talkMessagePreViewNew = [];
    if (talkMessagePreView){
      talkMessagePreViewNew.push(talkMessagePreView[talkMessagePreView.length-1])
    }
    talkMessagePreViewNew.push(data);
    setTimeout(function () {
      that.setData({ talkMessagePreView: [],
        noPreMessage:true
        });
    }, 3000);
    this.setData({
      talkMessage: talkMessage,
      scrollTop: 1000 * talkMessage.length,
      talkMessagePreView: talkMessagePreViewNew,
      noPreMessage: false
    })
    console.log(talkMessage);
  },
  talkInput(e){
    this.setData({
      sendMessage: e.detail.value
    })
  },
  hiddenTalkBox(){
    this.setData({ hiddenTalkBox:true});
  },
  showTalkBox(){
    this.setData({ hiddenTalkBox: false });
  },
  sendTalkMessage() {
    var message = {};
    if (!this.data.sendMessage){
      return;
    }
    message["type"] = "talkall";
    message["openId"] = app.globalData.openId;
    message["message"] = this.data.sendMessage;
    socket.commonSocketMessage(message);
    this.setData({
      'inputValue': '',
       sendMessage:null,
    })
  },
})
