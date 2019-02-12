
const app = getApp();
function commonSocketMessage(message) {
  console.log("commonSocketMessage:")
  console.log(message)
  wx.sendSocketMessage({
    data: JSON.stringify(message)
  })
}

function addTalkMessage(that, data) {
  let talkMessage = that.data.talkMessage;
  if (data.fromUid == app.globalData.uid) {
    data.isOwner = true;
  }
  talkMessage.push(data);
  let talkMessagePreView = that.data.talkMessagePreView;
  let talkMessagePreViewNew = [];
  if (talkMessagePreView) {
    talkMessagePreViewNew.push(talkMessagePreView[talkMessagePreView.length - 1])
  }
  talkMessagePreViewNew.push(data);
  setTimeout(function () {
    that.setData({
      talkMessagePreView: [],
      noPreMessage: true
    });
  }, 3000);
  that.setData({
    talkMessage: talkMessage,
    scrollTop: 1000 * talkMessage.length,
    talkMessagePreView: talkMessagePreViewNew,
    noPreMessage: false
  })
  console.log(talkMessage);
}
function talkInput(that, e) {
  that.setData({
    sendMessage: e.detail.value
  })
}
function hiddenTalkBox(that) {
  that.setData({ hiddenTalkBox: true });
}
function showTalkBox(that) {
  that.setData({ hiddenTalkBox: false });
}
function sendTalkMessage(that) {
  var message = {};
  if (!that.data.sendMessage) {
    return;
  }
  message["type"] = "talkall";
  message["openId"] = app.globalData.openId;
  message["message"] = that.data.sendMessage;
  commonSocketMessage(message);
  that.setData({
    'inputValue': '',
    sendMessage: null,
  })
}



module.exports = {
  commonSocketMessage,
  addTalkMessage,
  talkInput,
  hiddenTalkBox,
  showTalkBox,
  sendTalkMessage
}