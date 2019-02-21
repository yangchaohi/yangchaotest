const app= getApp();
// pages/video/upload.js
Page({
  
  /**
   * 页面的初始数据
   */
  data: {
    StatusBar: app.globalData.StatusBar,
    CustomBar: app.globalData.CustomBar,
    videoHeight:0,
    //videoUrl:"http://goumeng.oss-cn-hangzhou.aliyuncs.com/file/20181119/YY8GrasM8W.mp4"

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    wx.request({
      url: 'http://' + app.globalData.doamin + '/?c=api/video/videoList&openId=' + app.globalData.openId,
      method: 'get',
      header: {
        'content-type': 'application/x-www-form-urlencoded' // 默认值
      },
      success: function (res) {
        console.log("videoList")
        console.log(res)
        let videoList = res.data.data.list;
        console.log("videoList", videoList);
        that.setData({
          videoList: videoList
        });
        // 可以返回前端需要的用户信息（包括unionid、openid、user_id等）
      }
    });

  },
  
  preView(res){
    console.log("preView");
   
    let id = res.currentTarget.dataset.id;
    console.log(id);
    wx.redirectTo({
      url: '../detail/index?id=' + id
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    this.videoCtx = wx.createVideoContext('myVideo');
    this.init();

    var that = this;
    wx.getSystemInfo({
      success: function (res) {
        console.log("getSystemInfo")
        console.log(res);
        that.setData({
          windowHeight: (res.windowHeight),
        })
      }
    });
   
   
  },
  setVideoHeight(){
    const query = wx.createSelectorQuery();
    var that = this ;
    query.select('#videoDesc').boundingClientRect(function (res) {
      let windowHeight = that.data.windowHeight;
      console.log("myVideo")
      console.log(windowHeight + "_" + res.bottom)
      that.setData({
        videoHeight: windowHeight - res.bottom - 50
      });

    }).exec();
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  oss: function (token) {
    var _this = this;
    wx.request({
      url: kidUrl + 'JurisdictionOss/encryption',
      data: {
        token: token
      },
      method: 'POST',
      header: {
        'content-type': 'application/json'
      },
      success: res => {
        if (res.statusCode == 200) {
          _this.setData({
            accessid: res.data.accessid,
            policy: res.data.policy,
            signature: res.data.signature,
            uploadUrl: res.data.host,
            uploadUrlend: res.data.dir,
            expire: res.data.expire,
          })
        }
      }
    })
  },
  addVideo: function (res) {
    var fileName = app.globalData.uid+"_"+new Date().getTime();
    var this_ = this;
    wx.chooseVideo({
      sourceType: ['album', 'camera'],
      maxDuration: 60,
      camera: 'back',
      compressed: false,
      success(res) {
        console.log("视频信息-临时路径" + res.tempFilePath)
        console.log("视频信息-大小" + res.size)
        console.log("视频信息-时长" + res.duration)
        if (res.size > 1024 * 1024 * 200) {
          wx.showToast({
            title: "视频不能超过200M！",
            icon: 'none',
            duration: 1000 * 2,
            mask: true
          })
          return;
        }
        this_.upload_II_(fileName, res.tempFilePath, res.size);
      }
    })
  },
  upload_II_: function (fileName, filePath, fileSize) {

    wx.showToast({
      title: '正在上传',
      icon: 'loading',
      duration: 1000 * 100,
      mask: true
    })

    var this_ = this;
    //【1】获取oss信息
    wx.request({
      url: 'http://47.94.147.93/lib/ossh5/php/get.php',
      data: {
        fileSize: fileSize
      },
      method: 'POST',
      success: res => {
        if (res.statusCode == 200) {
          
          var accessid = res.data.accessid;
          var policy = res.data.policy;
          var signature = res.data.signature;
          var fPath = res.data.dir;
          var expire = res.data.expire;
          var uploadUrl = res.data.host;
          
          //【2】上传文件
          var fType = filePath.substring(filePath.lastIndexOf("."), filePath.length);
          console.log("类型 ：" + fType);

          //业务逻辑拼 key 和文件名称
          fileName = fileName + fType;
          fPath = fPath + '/' + fileName;

          //这里是进度条
          this_.setData({
            percent_: 0,
            display_: "display: block;"
          });

          const uploadTask = wx.uploadFile({
            url: uploadUrl,
            formData: {
              'Filename': fileName,
              'Content-Disposition': 'filename=' + fileName,  //文件描述 这里可以设置直接下载还是可以在线查看
              'key': fPath,    //key 是阿里云储存路径
              'policy': policy,
              'OSSAccessKeyId': accessid,
              'success_action_status': '200', //让服务端返回200,不然，默认会返回204
              'signature': signature
            },
            name: 'file',
            filePath: filePath,
            header: {
              'content-type': 'multipart/form-data;boundary=' + fileSize
            },
            success: res => {
              console.log(res);
              console.log("UPLOAD : " + new Date());
              if (res.statusCode == 200) {
                //上传成功
                //访问地址
                this.setVideoHeight()
                this.setData({ videoUrl: uploadUrl + "/" + fPath});
                wx.showToast({
                  title: '上传成功',
                  icon: 'success',
                  duration: 1000 * 1,
                  mask: true
                })
                //进度条
                this_.setData({
                  percent_: 100
                });


              } else {
                //系统错误
                wx.showToast({
                  title: '系统错误！',
                  icon: 'none',
                  duration: 1000 * 2,
                  mask: true
                })
              }

            }
          })

          uploadTask.onProgressUpdate((res) => {

            console.log('上传进度', res.progress + " " + new Date())
            console.log('已经上传的数据长度', res.totalBytesSent)
            console.log('预期需要上传的数据总长度', res.totalBytesExpectedToSend)
            console.log(new Date());
            this_.setData({
              percent_: res.progress - 1
            });
          })


        } else {
          var msg = '系统错误！';
          if (res.data.msg) {
            msg = res.data.msg;
          }
          //系统错误
          wx.showToast({
            title: '系统错误！',
            icon: 'none',
            duration: 1000 * 2,
            mask: true
          })
        }
      }
    })
  },

  formSubmit(e){

    console.log(e);
    var that = this;
    let videoUrl = this.data.videoUrl;
    let title = e.detail.value.title;
    let openId = app.globalData.openId;
    let action = this.data.action;
    let videoTime = this.data.videoTime;

    if (!openId){
      wx.showToast({
        title: "未登录",
        icon: 'none',
        duration: 1000 * 2,
        mask: true
      })
      return false;
    }
    if (!title) {
      wx.showToast({
        title: "标题未填写",
        icon: 'none',
        duration: 1000 * 2,
        mask: true
      })
      return false;
    }
    if (!videoUrl){
      wx.showToast({
        title: "视频未上传",
        icon: 'none',
        duration: 1000 * 2,
        mask: true
      })
      return false;
    }
    if (!videoTime) {
      wx.showToast({
        title: "视频时间异常",
        icon: 'none',
        duration: 1000 * 2,
        mask: true
      })
      return false;
    }
    if (!action) {
      wx.showToast({
        title: "未设置动作",
        icon: 'none',
        duration: 1000 * 2,
        mask: true
      })
      return false;
    }

    wx.request({
      url: "http://47.94.147.93/?c=api/video/postVideo", 
      header: {
        'content-type': 'application/x-www-form-urlencoded' // 默认值
      },
      method: 'POST',
      data: { title: title, videoUrl: videoUrl, openId: openId, action: JSON.stringify(action), videoTime: videoTime},
      success: function (res) {
        console.log(res)
        if (res.data.status == 0) {
          wx.showToast({
            title: res.data.errorMsg,
            icon: 'loading',
            duration: 1500
          })
        } else {
          
          if (res.data.errorCode==0){
            wx.showToast({
              title: "提交成功",//这里打印出登录成功
              icon: 'success',
              duration: 1500
            })
            let videoList = that.data.videoList;
            if (res.data.data.item){
              videoList.unshift(res.data.data.item);
            }
            
            that.setData({
              title: "",
              videoUrl: "",
              videoList: videoList
            })
          }else{
            wx.showToast({
              title: res.data.errorMsg,//这里打印出登录成功
              icon: 'none',
              duration: 1500
            })
          }
          
          
        }
      }
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
      action:[],
      point:0,
    });
  },
  end() {
    clearInterval(this.data.timerPlay);
    this.setData({
      videoInit: false,
      videoPlay: false,
      videoPause: false,
      videoEnd: true,
    })
  },
  restart() {
    clearInterval(this.data.timerPlay);
    console.log("video restart");
    this.videoCtx.pause();
    this.videoCtx.seek(0);
    //清理积分
    this.init();
  },
  bindended(res) {
    clearInterval(this.data.timerPlay);
    console.log("timeupdate bindended");
    console.log(res.detail.currentTime)
    this.setData({ videocurrentTime: 0});
    this.end();
  },
  //视频播放监听
  timeupdate(res) {
    clearInterval(this.data.timerPlay);
    console.log("timeupdate");
    console.log(res.detail.currentTime);
    this.setData({ 
      videocurrentTime: res.detail.currentTime,
      videoTime: res.detail.duration
     });
    if (this.data.videoPlay == false) {
      return;
    }
    var timeLast = res.detail.currentTime;
    var that = this;
    that.setData({
      timerPlay: setInterval(function () {
        timeLast = timeLast + 0.1;
        console.log("timeLast:" + timeLast);
        that.setData({ videocurrentTime: timeLast});
      }, 100)
    });
  },
  init() {
    this.setData({
      videoInit: true,
      videoPlay: false,
      videoPause: false,
      videoEnd: false,
      point: 0
    });
  },
  viewclick(res) {
    console.log("viewclick res:")
    console.log(res)
    var type = res.target.dataset.type;
    let action = this.data.action;
    if(!action){
      action=[];
    }
    let actionItem = {};
    actionItem['type'] = type;
    actionItem['time'] = this.data.videocurrentTime;
    action.push(actionItem);
    this.setData({ 
      action: action,
      point:action.length
    });
    console.log(action);
  }
})