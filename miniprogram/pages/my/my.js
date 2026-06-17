Page({
  data: {
    userInfo: {},
    stats: {},
    editing: false,
    editForm: {
      nickName: '',
      signature: ''
    },
    saving: false,
    loading: true
  },

  onLoad() {
    this.loadUserInfo()
    this.loadStats()
  },

  onShow() {
    this.loadUserInfo()
    this.loadStats()
  },

  loadUserInfo() {
    const app = getApp()
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        loading: false
      })
      return
    }

    wx.cloud.callFunction({
      name: 'userInit',
      timeout: 30000,
      data: {}
    }).then(res => {
      if (res.result.code === 0) {
        app.globalData.userInfo = res.result.data
        this.setData({
          userInfo: res.result.data,
          loading: false
        })
      }
    }).catch(() => {
      this.setData({ loading: false })
    })
  },

  loadStats() {
    wx.cloud.callFunction({
      name: 'checkinStats',
      timeout: 30000,
      data: { type: 'all' }
    }).then(res => {
      if (res.result.code === 0) {
        const { totalDays, totalMinutes, streakDays, avgDailyMinutes } = res.result.data
        this.setData({
          stats: {
            totalDays,
            totalHours: (totalMinutes / 60).toFixed(1),
            streakDays,
            avgDailyMinutes
          }
        })
      }
    }).catch(() => {
      // 静默失败
    })
  },

  onEdit() {
    this.setData({
      editing: true,
      editForm: {
        nickName: this.data.userInfo.nickName || '',
        signature: this.data.userInfo.signature || ''
      }
    })
  },

  onEditNickNameInput(e) {
    this.setData({
      'editForm.nickName': e.detail.value
    })
  },

  onEditSignatureInput(e) {
    this.setData({
      'editForm.signature': e.detail.value
    })
  },

  onCancelEdit() {
    this.setData({
      editing: false,
      editForm: {
        nickName: '',
        signature: ''
      }
    })
  },

  onSaveEdit() {
    const { nickName, signature } = this.data.editForm

    if (!nickName || nickName.trim() === '') {
      wx.showToast({
        title: '昵称不能为空',
        icon: 'none'
      })
      return
    }

    this.setData({ saving: true })

    wx.cloud.callFunction({
      name: 'userUpdate',
      timeout: 30000,
      data: {
        nickName: nickName.trim(),
        signature: signature.trim()
      }
    }).then(res => {
      if (res.result.code === 0) {
        const app = getApp()
        app.globalData.userInfo = res.result.data
        this.setData({
          userInfo: res.result.data,
          editing: false,
          saving: false
        })
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        })
      } else {
        wx.showToast({
          title: res.result.msg || '保存失败',
          icon: 'none'
        })
        this.setData({ saving: false })
      }
    }).catch(() => {
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      })
      this.setData({ saving: false })
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
      content: '学习打卡小程序 v2.0.0\n\n帮助你记录每日学习情况，养成良好学习习惯。\n\n升级内容：\n- 用户信息管理\n- 打卡统计分析\n- 打卡日历视图\n- 分享功能',
      showCancel: false
    })
  }
})