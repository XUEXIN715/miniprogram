Page({
  data: {
    formData: {
      date: '',
      content: '',
      duration: 30
    },
    contentLength: 0,
    submitting: false
  },

  onLoad() {
    // 设置默认日期为今天
    const today = this.getToday()
    this.setData({
      'formData.date': today
    })
  },

  // 获取今天的日期 YYYY-MM-DD
  getToday() {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  // 日期选择
  onDateSelect() {
    const that = this
    wx.showModal({
      title: '选择日期',
      content: '当前日期: ' + this.data.formData.date,
      showCancel: false
    })
  },

  // 内容输入
  onContentInput(e) {
    const content = e.detail.value
    this.setData({
      'formData.content': content,
      contentLength: content.length
    })
  },

  // 时长输入
  onDurationInput(e) {
    let duration = parseInt(e.detail.value) || 0
    if (duration < 0) duration = 0
    this.setData({
      'formData.duration': duration
    })
  },

  // 时长减
  onDurationMinus() {
    let duration = this.data.formData.duration - 5
    if (duration < 5) duration = 5
    this.setData({
      'formData.duration': duration
    })
  },

  // 时长加
  onDurationPlus() {
    let duration = this.data.formData.duration + 5
    if (duration > 1440) duration = 1440
    this.setData({
      'formData.duration': duration
    })
  },

  // 预设时长点击
  onPresetTap(e) {
    const duration = e.currentTarget.dataset.duration
    this.setData({
      'formData.duration': duration
    })
  },

  // 提交打卡
  onSubmit() {
    const { content, duration, date } = this.data.formData

    // 表单验证
    if (!content || content.trim() === '') {
      wx.showToast({
        title: '请输入学习内容',
        icon: 'none'
      })
      return
    }

    if (duration <= 0) {
      wx.showToast({
        title: '学习时长必须大于0',
        icon: 'none'
      })
      return
    }

    this.setData({ submitting: true })

    wx.cloud.callFunction({
      name: 'checkinAdd',
      timeout: 30000,
      data: {
        content: content.trim(),
        duration,
        date
      }
    }).then(res => {
      const result = res.result
      if (result.code === 0) {
        wx.showToast({
          title: '打卡成功',
          icon: 'success'
        })
        // 延迟跳转回首页
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      } else {
        wx.showToast({
          title: result.msg || '打卡失败',
          icon: 'none'
        })
      }
    }).catch(err => {
      console.error('[checkin] 调用云函数失败:', err)
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      })
    }).finally(() => {
      this.setData({ submitting: false })
    })
  }
})
