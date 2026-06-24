Page({
  data: {
    formData: {
      date: '',
      content: '',
      duration: 30,
      category: '其他',
      imageUrl: ''
    },
    contentLength: 0,
    submitting: false,
    // 分类列表
    categoryList: ['编程开发', '语言学习', '数学逻辑', '阅读写作', '考试备考', '其他'],
    categoryIndex: 5,
    // 图片预览
    tempImagePath: ''
  },

  onLoad() {
    // 设置默认日期为今天
    const today = this.getToday()
    this.setData({
      'formData.date': today
    })
    // 加载分类列表
    this.loadCategoryList()
  },

  // 获取今天的日期 YYYY-MM-DD
  getToday() {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  // 加载分类列表
  loadCategoryList() {
    wx.cloud.callFunction({
      name: 'getCategoryList',
      timeout: 30000,
      data: {}
    }).then(res => {
      if (res.result.code === 0) {
        const list = res.result.data.list.map(item => item.name)
        this.setData({
          categoryList: list
        })
      }
    }).catch(err => {
      console.error('[checkin] 加载分类失败:', err)
    })
  },

  // 日期选择
  onDateChange(e) {
    this.setData({
      'formData.date': e.detail.value
    })
  },

  // 分类选择
  onCategoryChange(e) {
    const index = parseInt(e.detail.value)
    this.setData({
      categoryIndex: index,
      'formData.category': this.data.categoryList[index]
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

  // 选择图片
  onChooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        this.setData({
          tempImagePath: tempFilePath
        })
        // 上传图片到云存储
        this.uploadImage(tempFilePath)
      }
    })
  },

  // 上传图片到云存储
  uploadImage(filePath) {
    wx.showLoading({ title: '上传中...' })

    const cloudPath = `checkin-images/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`

    wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: filePath,
      success: (res) => {
        this.setData({
          'formData.imageUrl': res.fileID
        })
        wx.showToast({
          title: '上传成功',
          icon: 'success'
        })
      },
      fail: (err) => {
        console.error('[checkin] 上传图片失败:', err)
        wx.showToast({
          title: '上传失败',
          icon: 'none'
        })
      },
      complete: () => {
        wx.hideLoading()
      }
    })
  },

  // 删除图片
  onRemoveImage() {
    this.setData({
      tempImagePath: '',
      'formData.imageUrl': ''
    })
  },

  // 预览图片
  onPreviewImage() {
    wx.previewImage({
      urls: [this.data.tempImagePath]
    })
  },

  // 提交打卡
  onSubmit() {
    const { content, duration, date, category, imageUrl } = this.data.formData

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
        date,
        category,
        imageUrl
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
