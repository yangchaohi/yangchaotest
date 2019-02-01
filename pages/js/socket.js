
function commonSocketMessage(message) {
  console.log("commonSocketMessage:")
  console.log(message)
  wx.sendSocketMessage({
    data: JSON.stringify(message)
  })
}

module.exports = {
  commonSocketMessage
}