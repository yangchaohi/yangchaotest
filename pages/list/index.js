var sliderWidth = 96; // 需要设置slider的宽度，用于计算中间位置
let col1H = 0;
let col2H = 0;
const app = getApp();
Page({

  data: {
    tabs: ["发现", "喜欢的", "玩过的"],
    activeIndex: 0,
    sliderOffset: 0,
    sliderLeft: 0,
    StatusBar: app.globalData.StatusBar,
    CustomBar: app.globalData.CustomBar,
    scrollH: 0,
    imgWidth: 0,
    loadingCount: 0,
    images: [],
    col1: [],
    col2: []
  },
  tabClick: function (e) {
    this.setData({
      sliderOffset: e.currentTarget.offsetLeft,
      activeIndex: e.currentTarget.id
    });
  },
  onLoad: function () {

    var that = this;
    wx.getSystemInfo({
      success: function (res) {
        that.setData({
          sliderLeft: (res.windowWidth / that.data.tabs.length - sliderWidth) / 2,
          sliderOffset: res.windowWidth / that.data.tabs.length * that.data.activeIndex
        });
      }
    });

    wx.getSystemInfo({
      success: (res) => {
        let ww = res.windowWidth;
        let wh = res.windowHeight;
        let imgWidth = ww * 0.48;
        let scrollH = wh;

        this.setData({
          scrollH: scrollH,
          imgWidth: imgWidth
        });

        this.loadImages();
      }
    })
  },

  onImageLoad: function (e) {
    let imageId = e.currentTarget.id;
    let oImgW = e.detail.width;         //图片原始宽度
    let oImgH = e.detail.height;        //图片原始高度
    let imgWidth = this.data.imgWidth;  //图片设置的宽度
    let scale = imgWidth / oImgW;        //比例计算
    let imgHeight = oImgH * scale;      //自适应高度

    let images = this.data.images;
    let imageObj = null;

    for (let i = 0; i < images.length; i++) {
      let img = images[i];
      if (img.id === imageId) {
        imageObj = img;
        break;
      }
    }

    imageObj.height = imgHeight;

    let loadingCount = this.data.loadingCount - 1;
    let col1 = this.data.col1;
    let col2 = this.data.col2;

    if (col1H <= col2H) {
      col1H += imgHeight;
      col1.push(imageObj);
    } else {
      col2H += imgHeight;
      col2.push(imageObj);
    }

    let data = {
      loadingCount: loadingCount,
      col1: col1,
      col2: col2
    };

    if (!loadingCount) {
      data.images = [];
    }

    this.setData(data);
  },
  viewClick(res){
     console.log(res);
    let id = res.currentTarget.dataset.id;
    console.log(id);
    wx.navigateTo({
      url: '../detail/index?id=' + id
    })
  },
  loadImages: function () {
    var that = this;
    var p = this.data.p;
    if(!p){
      p = 1;
    }
    console.log("p:" + p);
    wx.request({
      url: 'http://' + app.globalData.doamin + '/?c=api/video/videoList'+"&p="+p,
      method: 'get',
      header: {
        'content-type': 'application/x-www-form-urlencoded' // 默认值
      },
      success: function (res) {
        
        console.log("videoList")
        console.log(res)
        let images = res.data.data.list;
        console.log("images", images);
        
        let baseId = "img-" + (+new Date());

        for (let i = 0; i < images.length; i++) {
          images[i].id = baseId + "-" + i;
        }

        that.setData({
          loadingCount: images.length,
          images: images,
          p:p+1
        });


      }
    });
  }

})