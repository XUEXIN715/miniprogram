// my.js
Page({
  data: {
    userInfo: {
      nickName: '',
      openid: ''
    }
  },

  onLoad() {
    this.loadUserInfo()
  },

  onShow() {
    this.loadUserInfo()
  },

  loadUserInfo() {
    // 获取用户信息
    const that = this
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        that.setData({
          'userInfo.nickName': res.userInfo.nickName
        })
      },
      fail: () => {
        // 用户拒绝授权，使用默认名称
        that.setData({
          'userInfo.nickName': '微信用户'
        })
      }
    })

    // 获取 openid
    wx.cloud.callFunction({
      name: 'checkinList'
    }).then(res => {
      if (res.result && res.result.data) {
        that.setData({
          'userInfo.openid': res.result.openid || ''
        })
      }
    }).catch(() => {
      // 静默失败
    })
  },

  onClearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除本地缓存吗？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync()
          wx.showToast({
            title: '已清除',
            icon: 'success'
          })
        }
      }
    })
  },

  onFeedback() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  onAbout() {
    wx.showModal({
      title: '关于',
      content: '学习打卡小程序 v1.0.0\n\n帮助你记录每日学习情况，养成良好学习习惯。',
      showCancel: false
    })
  }
})
