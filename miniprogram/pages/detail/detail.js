Page({
  data: {
    detail: null,
    loading: true,
    editing: false,
    editContent: '',
    editDuration: 0,
    saving: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ recordId: options.id })
      this.loadDetail(options.id)
    } else {
      wx.showToast({
        title: '记录ID缺失',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  onShareAppMessage() {
    const { detail } = this.data
    if (!detail) return {}

    return {
      title: `我在学习打卡中记录了「${detail.content.substring(0, 20)}${detail.content.length > 20 ? '...' : ''}」`,
      path: `/pages/detail/detail?id=${detail._id}`,
      imageUrl: ''
    }
  },

  onShareTimeline() {
    const { detail } = this.data
    if (!detail) return {}

    return {
      title: `学习打卡：${detail.content.substring(0, 30)}${detail.content.length > 30 ? '...' : ''}`,
      imageUrl: ''
    }
  },

  onShare() {
    wx.showActionSheet({
      itemList: ['分享给朋友', '生成分享图片'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.shareToFriend()
        } else {
          this.generateShareImage()
        }
      }
    })
  },

  shareToFriend() {
    const { detail } = this.data
    wx.shareAppMessage({
      title: `我在学习打卡中记录了「${detail.content.substring(0, 20)}${detail.content.length > 20 ? '...' : ''}」`,
      path: `/pages/detail/detail?id=${detail._id}`
    })
  },

  generateShareImage() {
    const { detail } = this.data
    wx.showToast({
      title: '生成分享图片中...',
      icon: 'loading',
      duration: 2000
    })

    setTimeout(() => {
      wx.showModal({
        title: '分享成功',
        content: `已生成分享图片：\n日期：${detail.date}\n内容：${detail.content}\n时长：${detail.duration}分钟`,
        showCancel: false
      })
    }, 1500)
  },

  loadDetail(id) {
    this.setData({ loading: true })
    
    wx.cloud.callFunction({
      name: 'checkinDetail',
      timeout: 30000,
      data: { id }
    }).then(res => {
      const result = res.result
      if (result.code === 0) {
        const data = result.data
        data.createTimeText = this.formatDate(data.createTime)
        data.updateTimeText = this.formatDate(data.updateTime)
        
        this.setData({
          detail: data,
          loading: false
        })
      } else {
        wx.showToast({
          title: result.msg || '加载失败',
          icon: 'none'
        })
        this.setData({ loading: false })
      }
    }).catch(err => {
      console.error('[detail] 调用云函数失败:', err)
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      })
      this.setData({ loading: false })
    })
  },

  formatDate(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  },

  onEdit() {
    this.setData({
      editing: true,
      editContent: this.data.detail.content,
      editDuration: this.data.detail.duration
    })
  },

  onEditContentInput(e) {
    this.setData({
      editContent: e.detail.value
    })
  },

  onEditDurationInput(e) {
    this.setData({
      editDuration: parseInt(e.detail.value) || 0
    })
  },

  onCancelEdit() {
    this.setData({
      editing: false,
      editContent: '',
      editDuration: 0
    })
  },

  onSaveEdit() {
    const { editContent, editDuration, recordId } = this.data

    if (!editContent || editContent.trim() === '') {
      wx.showToast({
        title: '学习内容不能为空',
        icon: 'none'
      })
      return
    }

    if (editDuration <= 0) {
      wx.showToast({
        title: '学习时长必须大于0',
        icon: 'none'
      })
      return
    }

    this.setData({ saving: true })

    wx.cloud.callFunction({
      name: 'checkinUpdate',
      timeout: 30000,
      data: {
        id: recordId,
        content: editContent.trim(),
        duration: editDuration
      }
    }).then(res => {
      const result = res.result
      if (result.code === 0) {
        wx.showToast({
          title: '更新成功',
          icon: 'success'
        })
        this.setData({
          editing: false,
          'detail.content': editContent.trim(),
          'detail.duration': editDuration
        })
      } else {
        wx.showToast({
          title: result.msg || '更新失败',
          icon: 'none'
        })
      }
    }).catch(err => {
      console.error('[detail] 更新失败:', err)
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      })
    }).finally(() => {
      this.setData({ saving: false })
    })
  },

  onDelete() {
    const that = this
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这条打卡记录吗？',
      success(res) {
        if (res.confirm) {
          that.doDelete()
        }
      }
    })
  },

  doDelete() {
    wx.cloud.callFunction({
      name: 'checkinDelete',
      timeout: 30000,
      data: {
        id: this.data.recordId
      }
    }).then(res => {
      const result = res.result
      if (result.code === 0) {
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      } else {
        wx.showToast({
          title: result.msg || '删除失败',
          icon: 'none'
        })
      }
    }).catch(err => {
      console.error('[detail] 删除失败:', err)
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      })
    })
  }
})