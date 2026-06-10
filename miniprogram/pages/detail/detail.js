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

  // 加载详情
  loadDetail(id) {
    this.setData({ loading: true })
    
    wx.cloud.callFunction({
      name: 'checkinDetail',
      data: { id }
    }).then(res => {
      const result = res.result
      if (result.code === 0) {
        const data = result.data
        // 格式化时间
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

  // 格式化时间
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

  // 编辑按钮
  onEdit() {
    this.setData({
      editing: true,
      editContent: this.data.detail.content,
      editDuration: this.data.detail.duration
    })
  },

  // 编辑内容输入
  onEditContentInput(e) {
    this.setData({
      editContent: e.detail.value
    })
  },

  // 编辑时长输入
  onEditDurationInput(e) {
    this.setData({
      editDuration: parseInt(e.detail.value) || 0
    })
  },

  // 取消编辑
  onCancelEdit() {
    this.setData({
      editing: false,
      editContent: '',
      editDuration: 0
    })
  },

  // 保存编辑
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

  // 删除按钮
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

  // 执行删除
  doDelete() {
    wx.cloud.callFunction({
      name: 'checkinDelete',
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
