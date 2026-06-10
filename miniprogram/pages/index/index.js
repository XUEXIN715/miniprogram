// index.js - 打卡列表页
Page({
  data: {
    recordList: [],
    loading: false,
    stats: {
      totalDays: 0,
      totalHours: 0
    },
    page: 1,
    pageSize: 20,
    hasMore: true
  },

  onLoad() {
    this.loadRecordList()
  },

  onShow() {
    // 每次页面显示时刷新数据
    this.refreshData()
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.refreshData()
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadRecordList()
    }
  },

  // 刷新数据
  refreshData() {
    this.setData({
      page: 1,
      recordList: [],
      hasMore: true
    })
    this.loadRecordList()
  },

  // 加载打卡列表
  loadRecordList() {
    this.setData({ loading: true })

    wx.cloud.callFunction({
      name: 'checkinList',
      data: {
        page: this.data.page,
        pageSize: this.data.pageSize
      }
    }).then(res => {
      const result = res.result
      if (result.code === 0) {
        const { list, total, page, pageSize } = result.data
        
        // 计算统计数据
        this.calculateStats(list, total)

        this.setData({
          recordList: page === 1 ? list : [...this.data.recordList, ...list],
          page: page + 1,
          hasMore: (page * pageSize) < total,
          loading: false
        })

        // 停止下拉刷新
        wx.stopPullDownRefresh()
      } else {
        wx.showToast({
          title: result.msg || '加载失败',
          icon: 'none'
        })
        this.setData({ loading: false })
        wx.stopPullDownRefresh()
      }
    }).catch(err => {
      console.error('[index] 调用云函数失败:', err)
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      })
      this.setData({ loading: false })
      wx.stopPullDownRefresh()
    })
  },

  // 计算统计数据
  calculateStats(list, total) {
    // 如果是第一页，计算完整统计
    if (this.data.page === 1 && total <= this.data.pageSize) {
      // 统计唯一日期数
      const uniqueDates = new Set(list.map(item => item.date))
      const totalMinutes = list.reduce((sum, item) => sum + item.duration, 0)
      
      this.setData({
        'stats.totalDays': uniqueDates.size,
        'stats.totalHours': (totalMinutes / 60).toFixed(1)
      })
    }
  },

  // 点击记录跳转到详情
  onDetailTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  },

  // 点击右上角"+"跳转到打卡页
  onAddCheckin() {
    wx.navigateTo({
      url: '/pages/checkin/checkin'
    })
  }
})
