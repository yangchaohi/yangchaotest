const app = getApp()
const socket = require('../js/socket.js')
const moveTime = 1000;
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
    endLock: false,
    typeIndexClick:{},
    otherPoint:0,
    waitUserPic: "https://ss2.bdstatic.com/70cFvnSh_Q1YnxGkpoWK1HF6hhy/it/u=4001431513,4128677135&fm=27&gp=0.jpg",
    waitUserName: "???",
  },
  onLoad(params){
    console.log("onLoad")
    var that = this;
    let id = params.id;
    wx.request({
      url: 'http://yc.com:2017/?c=api/video/videoItem&id='+id,
      method: 'GET',
      header: {
        'content-type': 'application/x-www-form-urlencoded' // 默认值
      },
      success: function (res) {
        console.log("videoItem")
        console.log(res.data.data);
        params.id = res.data.data.item.id;
        that.setData({
          videoItem: res.data.data.item,
          params: params
        });
      }
    })
    
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
      } else if (status == 'singleplayend') {
        that.updateSinglePlayWinInfo(data);
      }
    });
  },
  updateSinglePlayWinInfo(data) {
    console.log("updateSinglePlayWinInfo");
    console.log(data);
    this.setData({ titlePoint: data.titlePoint,
      titleNear: data.titleNear
    });
    this.jiesuan();
  },
  //更新比赛两个的积分还有提示等等结束数据
  updatePlayWinInfo(data) {
    console.log("updatePlayWinInfo");
    console.log(data);
    this.setData({
      titleNear: "与" + this.data.waitUserName + "亲密度提升为" + data.nearPoint,
      otherEnd: true
    });
    this.jiesuan();
  },
  updateSignlePlayWinInfo(data) {
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
    /**that.data.timer= setInterval(function () {
      that.updatePointSendSocket();
    }, 5000);*/
    that.setData({
      timer: setInterval(function () {
        that.updatePointSendSocket();
      }, 5000)
    });
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
      },1000);
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
    if(this.data.isSinglePlay){
      message["room_id"] = 0;
      message['point'] = this.data.point;
    }else{
      message['point'] = this.data.point;
      message["room_id"] = this.data.roomId;
    }
    message["video_id"] = this.data.params.id;
    message["point"] = this.data.point
    socket.commonSocketMessage(message);
  },
  fullscreenchange(res){
    console.log("fullscreenchange");
    console.log(res);

    var that = this;
    if (res.detail.fullScreen==true){
      wx.getSystemInfo({
        success: function (res) {
          console.log("getSystemInfo")
          console.log(res);
          that.setData({
            //videoHeight: (res.windowHeight),
            videoHeight: (res.screenHeight),
            canUseFull:true,
            isFull: true
          })
        }
      });
    }else{
      wx.getSystemInfo({
        success: function (res) {
          console.log("getSystemInfo")
          console.log(res);
          that.setData({
            videoHeight: (res.windowHeight),
            canUseFull: true,
            isFull: false
            //videoHeight: (res.screenHeight),
          })
        }
      });
    }
  },
  exitFull(){
    console.log("exitFull");
    this.videoCtx.exitFullScreen();
    
  },
  goFull(){
    console.log("goFull");
    this.videoCtx.requestFullScreen();
  },
  onReady() {
    console.log("onReady")
    this.createRoomSocketInit();
    console.log(this.data.params);
    this.joinRoomSendSocket();
    this.videoCtx = wx.createVideoContext('myVideo');
    this.videoCtx.pause()
    this.videoCtx.requestFullScreen();
    //this.videoCtx.exitFullScreen()

    const query = wx.createSelectorQuery().in(this)
    let that  =this;

    /*let MOU = this.createAni()
    MOU.translate(0, -200).step();
    MOU.translate(0, 200).step({ duration: 10000});
    this.setData({
      animation: MOU.export()
    });*/
    query.select('#myVideo').boundingClientRect(function (res) {
      if (!res){
        return;
      }
      console.log(res)
      console.log("res.width:" + res.width + " res.height:" + res.height)
      if (that.data.videoHeight){
        that.setData({
          videoWidth: res.width,
        })
      }else{
        that.setData({
          videoWidth: res.width,
          videoHeight: res.height,
        })
      }
      
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
      timeList:{},
      styleClass: styleClass,
      point:0
    }) 
  },
  closeEndView(){
    this.restart();
  },
  //视频播放完的事件
  timeEnd(res){
    if(this.data.endLock==true){
      return;
    }
    this.setData({endLock:true})
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
    if(this.data.isSinglePlay==true){
      //单人模式
    }else{
      //多人模式
      let otherEnd = this.data.otherEnd;
      let myEnd = this.data.myEnd;
      console.log("jiesuan: otherEnd:" + otherEnd + " myEnd:" + myEnd);
      let winTitle = "平了";
      let titlePoint = "";
      if (otherEnd == false || myEnd == false) {
        winTitle = "结算中";
      } else {
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
        titlePoint = winTitle + "[" + this.data.waitUserName + "]" + " 比分:" + this.data.point + ":" + this.data.otherPoint;
      }
    
      this.setData({ 
        titlePoint: titlePoint,
        winTitle: winTitle
        });
    }
    
  },
  animationstart(res){
    console.log("animationstart")
    console.log(res)
  },
  animationend(res) {
    console.log("animationend:" + new Date().getTime())
    console.log(res)
    let num = res.currentTarget.dataset.num;
    let timeEndSave = this.data.timeEndSave;
    if (!timeEndSave){
      timeEndSave = [];
    }
    timeEndSave[num] = new Date().getTime();
    this.setData({ timeEndSave: timeEndSave});

    this.setPointData(num);
    var isave = num;
    var type = res.currentTarget.dataset.type;
    var that = this;
    var timeList = this.data.timeList;
    var itime = 0;
    if (timeList){
      if (timeList[type]){
        for (var i = 0; i < timeList[type].length;i++){
          if (num == timeList[type][i]['index']){
            itime = i;
          }
        }
      }
      console.log("动画 timeList type:" + type + " num:" + num + " itime:" + itime);
      console.log(timeList);

    }
    console.log("timeupdate setTimeout set i:" + (isave + 1) + " time:"+ new Date().getTime());
    var backstyle = "left:2500%;top:2500%;";
    var styleClass = that.data.styleClass
    var animationList = that.data.animationList;
    styleClass[isave] = backstyle;
    
    let MOU = that.createAni()
    animationList[isave] = MOU.translate(0).rotate(0).step({ duration: 0 });
    
    that.setData({
      styleClass: styleClass,
      animationList: animationList,
    });

    setTimeout(function(){
      let typeIndexClick = that.data.typeIndexClick;
      if (!typeIndexClick) {
        typeIndexClick = {};
      }
      typeIndexClick[type] = itime + 1;
      console.log("typeIndexClick update by 动画 end");
      console.log(typeIndexClick);
      that.setData({
        typeIndexClick: typeIndexClick
      });

      var clickedView = that.data.clickedView;
      if (!clickedView || !clickedView[isave]) {
        that.setData({
          noticeMessgae: "miss",
          noticeHidden: false
        });
        that.hiddenNotice();
      }
    },100);
    
  },
  //更新动画
  updateAnimation(videoTime){
    var indexi = this.data.indexi;
    if (indexi == undefined) {
      indexi = 0;
    }
    var videoWidth = this.data.videoWidth;
    var videoHeight = this.data.videoHeight;
    let viewBoxWidth = this.data.viewBoxWidth;
    let viewBoxHeight = this.data.viewBoxHeight;


    let that = this;
    for (var i = indexi; i < this.data.array.length; i++) {

      //如果当前时间已经超过了设置的time
      if (videoTime > this.data.array[i]["time"]) {
        this.setData({
          indexi: i + 1
        });
        console.log("set index i:" + i);
        let animationList = this.data.animationList
        let styleClass = this.data.styleClass
        let MOU = this.createAni()
        var centerWidth = videoWidth / 2;
        var centerheight = videoHeight / 2;
        var sideWay = this.data.sideHeight + (viewBoxHeight / 2);
        var style = "left:" + (centerWidth - (viewBoxWidth / 2)) + "px;" + "top:" + (centerheight - (viewBoxHeight / 2)) + "px;";
        console.log("style:" + style)
        let type = this.data.array[i]["type"];
        if (type == "left") {
          MOU.translate(-(videoWidth / 2 - sideWay), 0).step()
        } else if (type == "right") {
          MOU.translate(videoWidth / 2 - sideWay, 0).step()
        } else if (type == "top") {
          MOU.translate(0, -(videoHeight / 2 - sideWay)).step()
        } else if (type == "bottom") {
          MOU.translate(0, (videoHeight / 2 - sideWay)).step()
        }
        //MOU.rotate(180).step({ duration:100})
        animationList[i] = MOU.export()

        styleClass[i] = style;
        console.log("animationList size:" + animationList.length)
        console.log(styleClass)
        //用来控制展示的动画
        var isave = i;
        console.log("timeupdate i:" + isave + " timeList i:");
        this.setData({
          styleClass: styleClass
        }, function () {
          let timeList = this.data.timeList;
          let timeListType = [];
          if (timeList[type]) {
            timeListType = timeList[type];
          }
          let timeListItem = {}
          timeListItem['type'] = type;
          timeListItem['index'] = isave;
          timeListType.push(timeListItem);
          timeList[type] = timeListType;

          console.log("timeListItem----");
          console.log(timeListItem)
          console.log(timeList)
          //用来判断点击成功事件
          var itime = timeList[type].length - 1;
          that.setData({
            animationList: animationList,
            timeList: timeList
          });

        });
      } else {
        //如果当前时间还没有到还没有到，break
        break;
      }
    }
  },
  //视频播放监听
  timeupdate(res){
    clearInterval(this.data.timerPlay);
    console.log("timeupdate");
    console.log(res.detail.currentTime)
    //console.log(res.detail.duration)
    if (this.data.videoPlay==false){
      return;
    }
    if (res.detail.currentTime > (res.detail.duration-1) ){
      this.timeEnd(res);
      return;
    }
    this.updateAnimation(res.detail.currentTime);
    
    var timeLast = res.detail.currentTime;
    var that = this;
    that.setData({
      timerPlay: setInterval(function () {
        timeLast = timeLast+0.1;
        console.log("timeLast:"+timeLast);
        that.updateAnimation(timeLast);
      }, 100)
    });
  },
  createAni() {
    return wx.createAnimation({
      duration: moveTime,
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
    clearInterval(this.data.timerPlay);
    this.setData({
      videoInit: false,
      videoPlay: false,
      videoPause: false,
      videoEnd: true,
    })
  },
  play() {
    clearInterval(this.data.timerPlay);
    console.log("video play");
    this.videoCtx.play()
    this.setData({
      videoInit: false,
      videoPlay: true,
      videoPause: false,
      videoEnd: false,
    });
  },
  pause() {
    clearInterval(this.data.timerPlay);
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
      typeIndexClick: {},
      indexi: 0,
      styleClass: [],
      animationList: [],
      timeList:[],
      clickedView:0,
      timeEndSave:[],
      clickedView: [],
      poitDetail:[],

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
      endLock:false,
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

  setPointData(index){
    console.log("setPointData")
    //点击时间
    let clickedView = this.data.clickedView;
    //动画消失时间
    let timeEndSave = this.data.timeEndSave;
    if (!clickedView || !clickedView[index]){
      console.log("clickedView index null:"+index);
      return;
    }
    if (!timeEndSave || !timeEndSave[index]){
      console.log("timeEndSave index null:" + index);
      return;
    }
    let poitDetail = this.data.poitDetail;
    if (!poitDetail){
      poitDetail = [];
    }
    poitDetail[index] = 100 - Math.floor(Math.abs((clickedView[index] - timeEndSave[index])) / 10);
    if (poitDetail[index] > 100 || poitDetail[index]<0){
      console.log("poitDetail数据异常:" + poitDetail[index]);
      poitDetail[index] = 0;
    }
    var pointData = 0;
    for (var i = 0; i < poitDetail.length;i++){
      if (poitDetail[i]){
        pointData += parseInt(poitDetail[i]);
      }
    }
    console.log("poitDetail")
    console.log(poitDetail)
    console.log(pointData)
    this.setData({
      point: pointData,
      poitDetail: poitDetail,
      noticeMessgae: "nice",
      noticeHidden: false
    });
    this.hiddenNotice();
  },
  //行动点点击事件
  viewclick(res){
    console.log("viewclick res:"+res)
    var type = res.target.dataset.type;
    //根据类型存储的点击事件id
    var typeIndexClick = this.data.typeIndexClick;
    var dataIndexClick = 0;
    if (typeIndexClick && typeIndexClick[type]){
        dataIndexClick = typeIndexClick[type];
    }
    
    console.log("viewclick type:" + type+" indexClick:"+dataIndexClick)
    //match过的动画不分类型
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
    let timeListAll = this.data.timeList;
    let timeList = timeListAll[type];
    if (timeList){
      console.log("timeList.length:" + timeList.length + " type:" + type)
      for (var i = dataIndexClick; i < timeList.length; i++) {
        var allIndex = timeList[i]["index"];
        console.log("Click--all index:" + allIndex + " type time index:" + dataIndexClick)
        var point = 0;
        let timeListItem = timeList[i];
        if (type != timeListItem["type"]) {
          console.log(type + " not match" + timeListItem["type"]);
          continue;
        }
        let now = new Date().getTime();
        if (clickedView[allIndex]) {
          console.log("have get!")
        } else {
          pointData += (100 - point);
          clickedView[allIndex] = now;
        }
        let typeIndexClick = this.data.typeIndexClick;
        typeIndexClick[type] = i + 1;
        this.setData({
          clickedView: clickedView,
          typeIndexClick: typeIndexClick,
        });
        console.log("clickedView:" + clickedView + " typeIndexClick:");
        console.log(typeIndexClick);
        //计算积分
        this.setPointData(allIndex);
        break;
      }
    }else{
      console.log("timeList type null:"+type);
      console.log(timeList);

    }
    
    /*
    const query = wx.createSelectorQuery();
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
      */
  }
})