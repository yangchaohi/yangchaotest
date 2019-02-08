const app = getApp()
const socket = require('../js/socket.js')
Page({
  data: {
    videoPause:true,
    //config
    viewBoxWidth:44,
    viewBoxHeight:44,
    sideHeight:44,
    roomId:0,
    isSinglePlay:true,
    timer: '',
    countDownNum:5,
    hiddenTimer:true,
    userInfo: {},
    createRoomLock:false,
    //默认提示隐藏
    noticeHidden: true,
    //刚进入或初始化
    videoInit: true,
    //暂停
    videoPause: false,
    //视频结束
    videoEnd: false,
    //视频播放中
    videoPlay: false,
    //是否等待用户加入中
    isWait:false,
    otherEnd:false,
    otherPoint:0,
    waitUserPic: "https://ss2.bdstatic.com/70cFvnSh_Q1YnxGkpoWK1HF6hhy/it/u=4001431513,4128677135&fm=27&gp=0.jpg",
    waitUserName: "???",
  },
  onLoad(params){
    this.setData({ params: params});

    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse) {
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
  onShow(params) {
    console.log("onShow")
    var that = this;
    //监听socket返回
    wx.onSocketMessage(function (res) {
      console.log("onSocketMessage in detail");
      let data = JSON.parse(res.data);
      let status = data['status'];
      if (status =='wait'){
        that.createRoomBack(data);
      } else if (status =='matched'){
        that.matchedRoomAndStart(data);
      } else if (status == 'uppoint') {
        that.updateOtherPoint(data);
      } else if (status == 'playend') {
        that.updatePlayWinInfo(data);
      }

    });

  },
  //更新比赛两个的积分还有提示等等结束数据
  updatePlayWinInfo(data) {
    console.log("updatePlayWinInfo");
    console.log(data);
    this.setData({ otherEnd: true});
    this.jiesuan();
  },
  //更新其他用户的分数
  updateOtherPoint(data){
    console.log("updateOtherPoint");
    console.log(data);
    let apiPoint = parseInt(data.data.point);
    let oldPoint = parseInt(this.data.otherPoint)
    if (apiPoint > oldPoint || !this.data.otherPoint){
      this.setData({ otherPoint: apiPoint })
    }else{
      console.log("分数有问题 apiPoint:" + apiPoint + " oldPoint:" + oldPoint);
    }
  },
  //其他用户加入后开始游戏
  matchedRoomAndStart(data) {
    if (!this.data.isWait){
      console.log("not wait");
       return;
    }
    let name = data.other_user.name;
    let pic = data.other_user.pic;
    var that = this;
    let countDownNum = this.data.countDownNum;
    this.setData({
      waitUserPic: pic,
      waitUserName: name,
      timer: setInterval(function () {//这里把setInterval赋值给变量名为timer的变量
        //每隔一秒countDownNum就减一，实现同步
        countDownNum--;
        //然后把countDownNum存进data，好让用户知道时间在倒计着
        that.setData({
          hiddenTimer:false,
          countDownNum: countDownNum
        })
        //在倒计时还未到0时，这中间可以做其他的事情，按项目需求来
        if (countDownNum == 0) {
          //这里特别要注意，计时器是始终一直在走的，如果你的时间为0，那么就要关掉定时器！不然相当耗性能
          //因为timer是存在data里面的，所以在关掉时，也要在data里取出后再关闭
          clearInterval(that.data.timer);
          //关闭定时器之后，可作其他处理codes go here
          that.videoWaitShow(false);
          that.play();
          //开始播放后同步分数
          that.updatePointToOther();
          that.setData({ isSinglePlay:false});
        }
      }, 1000)
    });
    //这里还要设置下左上角的两个分数，然后做定时同步
    console.log(data);
  },
  //push当前用户给另外的用户(5s触发一次)
  updatePointToOther() {
    var that = this;
    that.data.timer= setInterval(function () {
      that.updatePointSendSocket();
    }, 5000)
  }, 
  //删除定时器
  removerTimer() {
    var that = this;
    clearInterval(that.data.timer);
  },
  //创建房间后等待其他用户加入
  createRoomBack(data){
    console.log("createRoomBack");
    console.log(data);
    this.setData({ roomId: data.room_id})
  },
  //创建房间发起socket请求
  createRoomSocketInit(){
    console.log("createRoomSocket ")
    var that = this;
    var createRoomLock = this.data.createRoomLock
    if (!app.globalData.openId){
      setTimeout(function () {
        console.log("createRoomSocket retry");
        that.createRoomSocketInit();
      },100000);
    } else if (createRoomLock==false){
      this.setData({ createRoomLock:true})
      that.createRoomSocket();
    }
  },
  createRoomSocket(){
    var message = {};
    message["type"] = "create_room";
    message["openId"] = app.globalData.openId;
    message["video_id"] = this.data.params.id;
    socket.commonSocketMessage(message);
  },
  //加入房间消息
  joinRoomSendSocket(){
    if (this.data.params.roomId>0){
      var message = {};
      message["type"] = "join_room";
      message["openId"] = app.globalData.openId;
      message["room_id"] = this.data.params.roomId;
      socket.commonSocketMessage(message);
      this.setData({ roomId: this.data.params.roomId});
    }
  },
  //更新分数消息
  updatePointSendSocket() {
    console.log("updatePointSendSocket");
    if (this.data.roomId > 0) {
      var message = {};
      message["type"] = "update_point";
      message["openId"] = app.globalData.openId;
      message["room_id"] = this.data.roomId;
      message["point"] = this.data.point
      console.log(message);
      socket.commonSocketMessage(message);
    }
  },
  //播放结束消息
  playEndSendSocket(){
    var message = {};
    message["type"] = "play_end";
    message["openId"] = app.globalData.openId;
    message["room_id"] = this.data.roomId;
    message["point"] = this.data.point
    socket.commonSocketMessage(message);
  },
  onReady() {
    console.log("onReady")
    this.createRoomSocketInit();
    console.log(this.data.params);
    this.joinRoomSendSocket();
    this.videoCtx = wx.createVideoContext('myVideo');
    this.videoCtx.pause()
    this.videoCtx.requestFullScreen();
    const query = wx.createSelectorQuery().in(this)
    let that  =this;

    /*wx.getSystemInfo({
      success: function (res) {
        console.log("getSystemInfo")
        console.log(res);
        that.setData({
          videoHeight: (res.windowHeight),
          //videoHeight: (res.screenHeight),
        })
      }
    })*/

    query.select('#myVideo').boundingClientRect(function (res) {
      that.setData({
        videoWidth: res.width,
        videoHeight:res.height,
      })
    }).exec()
    //初始化行动点
    var action = [{ "time": "1.4", "type": "left" },
      { "time": "2.4", "type": "right" },
      { "time": "3.4", "type": "top" },
      { "time": "4.4", "type": "top" },
      { "time": "5.4", "type": "top" },
      { "time": "6.4", "type": "top" },
      { "time": "7.4", "type": "top" },
    ];

    var animationList = []
    var styleClass = []
    this.setData({
      array: action,
      animationList: animationList,
      styleClass: styleClass,
      point:0
    }) 
  },
  closeEndView(){
    this.restart();
  },
  //视频播放完的事件
  timeEnd(res){
    //先考虑多人
    console.log("video time end");
    //删除5s一次的定时器
    this.removerTimer();
    //发一个当前用户已经完成的消息
    this.playEndSendSocket();
    //当前用户播放已经结束
    this.setData({myEnd: true })
    //展示出结束页面
    this.jiesuan();
    //set值
    this.end();
  },
  //结算
  jiesuan(){
    //多人模式
    let otherEnd = this.data.otherEnd;
    let myEnd = this.data.myEnd;
    console.log("jiesuan: otherEnd:" + otherEnd + " myEnd:" + myEnd);
    let winTitle = "平了";
    if (otherEnd == false || myEnd == false) {
      winTitle="结算中";
    }else{
      let point = this.data.point;
      let otherPoint = this.data.otherPoint;
      if (!point) {
        point = 0;
      }
      if (!otherPoint) {
        otherPoint = 0;
      }
      if (point > otherPoint) {
        winTitle = "赢了";
      } else if (point < otherPoint) {
        winTitle = "输了";
      }
    }
    this.setData({ winTitle: winTitle});

  },
  //视频播放监听
  timeupdate(res){
    var indexi = this.data.indexi;
    console.log(res.detail.currentTime)
    console.log(res.detail.duration)
    if (res.detail.currentTime > (res.detail.duration-1) ){
      this.timeEnd(res);
      return;
    }
    if (indexi == undefined){
      indexi = 0;
    }
    var videoWidth = this.data.videoWidth;
    var videoHeight = this.data.videoHeight;
    let viewBoxWidth = this.data.viewBoxWidth;
    let viewBoxHeight = this.data.viewBoxHeight;


    let that = this;
    for (var i = indexi; i < this.data.array.length;i++){

      //如果当前时间已经超过了设置的time
      if (res.detail.currentTime > this.data.array[i]["time"]){
        this.setData({
          indexi: i+1
        });
        console.log("set index i" + i);
        let animationList = this.data.animationList
        let styleClass = this.data.styleClass
        let MOU = this.createAni()
        var centerWidth = videoWidth / 2;
        var centerheight = videoHeight / 2;
        var sideWay = this.data.sideHeight + (viewBoxHeight/2);
        var style = "left:" + (centerWidth - (viewBoxWidth / 2)) + "px;" + "top:" + (centerheight - (viewBoxHeight/2))+"px;";
        console.log("style:" + style)

        if (this.data.array[i]["type"]=="left"){
          MOU.translate(-(videoWidth / 2 - sideWay), 0).step()
        } else if (this.data.array[i]["type"] == "right") {
          MOU.translate(videoWidth / 2 - sideWay, 0).step()
        } else if (this.data.array[i]["type"] == "top") {
          MOU.translate(0, -(videoHeight / 2 - sideWay)).step()
        } else if (this.data.array[i]["type"] == "bottom") {
          MOU.translate(0, (videoHeight / 2 - sideWay)).step()
        }
        //MOU.rotate(180).step({ duration:100})
        animationList[i] = MOU.export()
        styleClass[i] = style;
        console.log("animationList size:" + animationList.length)
        console.log(styleClass)
        var isave = i;
        console.log("timeupdate geti:" + isave);
          this.setData({
            styleClass: styleClass
          }, function () {
            that.setData({
              animationList: animationList,
            });
            setTimeout(function(){
              console.log("timeupdate setTimeout seti:" + (isave+1));
              var backstyle = "left:2500%;top:2500%;";
              styleClass[isave] = backstyle;
              var clickedView = that.data.clickedView;
              if (!clickedView || !clickedView[isave]) {
                that.setData({
                  noticeMessgae: "miss",
                  noticeHidden: false
                  });
                that.hiddenNotice();
              } 
              animationList[isave] = MOU.translate(0).rotate(0).step({ duration: 0 })
              that.setData({
                styleClass: styleClass,
                indexClick: isave + 1,
                animationList: animationList,
              });
            },1200);
           });
      }else{
        //如果当前时间还没有到还没有到，break
        break;
      }
    }
   
  },
  createAni() {
    return wx.createAnimation({
      duration: 1000,
      timingFunction: 'linear',
      delay: 0,
      transformOrigin: '"50% 50% 0"',
    })
  },
  //切换等待提示
  videoWaitShow(isWait){
    this.setData({ isWait: isWait});
  },
  //隐藏等待提示
  videoWaitCannel(){
    this.videoWaitShow(false);
    //重新生成roomid
    this.createRoomSocket();
  },
  onShareAppMessage(res){
    console.log("onShareAppMessage")
     //展示等待提示
    this.videoWaitShow(true);
    // 来自页面内转发按钮
    console.log(res)
    var app = getApp();
    return {
      title: '自定义转发标题:' + this.data.roomId + " id:" + this.data.params.id,
      path: '/page/detail/index?fromuid=' + app.globalData.uid + "&id="+this.data.params.id
    }
  },
  end(){
    this.setData({
      videoInit: false,
      videoPlay: false,
      videoPause: false,
      videoEnd: true,
    })
  },
  play() {
    console.log("video play");
    this.videoCtx.play()
    this.setData({
      videoInit: false,
      videoPlay: true,
      videoPause: false,
      videoEnd: false,
    })
  },
  pause() {
    console.log("video pause");
    this.videoCtx.pause();
    this.setData({
      videoInit: false,
      videoPlay: false,
      videoPause: true,
      videoEnd: false,
    })
  },
  restart(){
    
    console.log("video restart");
    this.videoCtx.seek(0);
    //清理积分
    this.init();
  },
  init(){
    this.setData({
      //动态参数
      point: 0,
      indexClick: 0,
      indexi: 0,
      styleClass: [],
      animationList: [],
      clickedView:0,

      //默认兜底参数初始化
      isSinglePlay: true,
      timer: '',
      countDownNum: 5,
      hiddenTimer: true,
      userInfo: {},
      //刚进入或初始化
      videoInit: true,
      //暂停
      videoPause: false,
      //视频结束
      videoEnd: false,
      //视频播放中
      videoPlay: false,
      //是否等待中
      isWait: false,
      waitUserPic: "https://ss2.bdstatic.com/70cFvnSh_Q1YnxGkpoWK1HF6hhy/it/u=4001431513,4128677135&fm=27&gp=0.jpg",
      waitUserName: "???",
    })
  },
  hiddenNotice(){
    let that = this;
    setTimeout(function () {
      that.setData({
        noticeHidden: true
      });
    }, 300);
  },
  //行动点点击事件
  viewclick(res){
    console.log("viewclick res:"+res)
    var dataIndexClick = this.data.indexClick;
    if (!dataIndexClick){
      dataIndexClick = 0;
    }
    var type = res.target.dataset.type;
    const query = wx.createSelectorQuery();
    console.log("viewclick data indexClick:"+dataIndexClick)
    var clickedView = this.data.clickedView;
    if (!clickedView){
      clickedView = [];
    }
    var videoHeight = this.data.videoHeight;
    var videoWidth = this.data.videoWidth;
    var pointData = this.data.point;
    if (!pointData){
      pointData = 0
    }
    query.selectAll('.viewbox')
      .boundingClientRect(res => {
        console.log("viewclick  dataIndexClick res:")
        console.log(res[dataIndexClick])
        if (res.length == dataIndexClick) {
          console.log("res size empty");
          return;
        }
        for (var i = dataIndexClick; i < dataIndexClick+1;i++){
          var indexClick = i;
          console.log("indexClick:" + indexClick)
          var point = 0;
          if (type == "left") {
            point = res[indexClick]["left"] - 40;
          } else if (type == 'right') {
            point = (videoWidth - res[indexClick]["left"] - res[indexClick]["width"]-40);
          } else if (type == 'top') {
            point = res[indexClick]["top"] - 40;
          } else if (type == 'bottom') {
            point = videoHeight - res[indexClick]["top"] - res[indexClick]["height"]-40;
          }
          point = parseInt(Math.abs(point));
          console.log("point:" + point)
          if (point > 100) {
            continue;
          }
          if (clickedView[indexClick]) {
            console.log("have get!")
          } else {
            pointData += (100 - point);
            clickedView[indexClick] = point;
          }
          this.setData({
            clickedView: clickedView,
            indexClick:indexClick+1,
            point: pointData,
            noticeMessgae:"nice",
            noticeHidden:false
          });
          this.hiddenNotice();
          console.log("clickedView:" + clickedView + " indexClick:" + indexClick)
        }
        
      }).exec()
  }
})