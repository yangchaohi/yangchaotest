Page({

  data: {
    noticeHidden: true,
    hiddenStop: true,
    hiddenPlayingAndInit: true,
    hiddenInit: true,
    noticeHidden: true,
  },
  onReady() {
    this.videoCtx = wx.createVideoContext('myVideo');
    const query = wx.createSelectorQuery().in(this)
    let that  =this;

    wx.getSystemInfo({
      success: function (res) {
        that.setData({
          videoHeight: (res.windowHeight),
          //videoHeight: (res.screenHeight),
        })
      }
    })

    
    query.select('#myVideo').boundingClientRect(function (res) {
      that.setData({
        videoWidth: res.width,
      })
    }).exec()
    

    var action = [{ "time": "2.4", "type": "left" },
      { "time": "3.4", "type": "right" },
      { "time": "4.4", "type": "top" },
      { "time": "5.4", "type": "bottom" },
      { "time": "6.4", "type": "top" },
      { "time": "7.4", "type": "top" },
      { "time": "8.4", "type": "top" },
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
  timeupdate(res){
    var indexi = this.data.indexi;
    //console.log(res.detail.currentTime)
    if (indexi == undefined){
      indexi = 0;
    }
    var videoWidth = this.data.videoWidth;
    var videoHeight = this.data.videoHeight;
   
    let that = this;
    for (var i = indexi; i < this.data.array.length;i++){

      //如果当前时间已经超过了设置的time
      if (res.detail.currentTime > this.data.array[i]["time"]){
        this.setData({
          indexi: i+1
        });
        //console.log("set index i" + i);
        let animationList = this.data.animationList
        let styleClass = this.data.styleClass
        let MOU = this.createAni()
        var centerWidth = videoWidth / 2;
        var centerheight = videoHeight / 2;
          var style = "left:" + (centerWidth - 20) + "px;" + "top:" + (centerheight - 20)+"px;";
          
          if (this.data.array[i]["type"]=="left"){
            MOU.translate(-(videoWidth / 2 -59), 0).step()
          } else if (this.data.array[i]["type"] == "right") {
            MOU.translate(videoWidth / 2 - 59, 0).step()
          } else if (this.data.array[i]["type"] == "top") {
            MOU.translate(0, -(videoHeight / 2 - 59)).step()
          } else if (this.data.array[i]["type"] == "bottom") {
            MOU.translate(0, (videoHeight / 2 - 59)).step()
          }
          MOU.rotate(180).step({ duration:100})
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
  play() {
    this.videoCtx.play()
    this.setData({
      hiddenStop: false,
      hiddenPlaying: true,
      hiddenPlayingAndInit:true,
      hiddenInit:false,
    })
  },
  pause() {
    this.videoCtx.pause();
    this.setData({
      hiddenPlayingAndInit: false,
    })
  },
  restart(){
    this.videoCtx.seek(0);
    //清理积分
    this.init();
  },
  init(){
    this.setData({
      point: 0,
      indexClick: 0,
      indexi: 0,
      styleClass: [],
      animationList: [],
      hiddenPlayingAndInit: true,
      hiddenPlaying: false,
      clickedView:0,
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