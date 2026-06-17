Page({
  data: {
    recordList: [],
    loading: false,
    stats: {
      totalDays: 0,
      totalHours: 0,
      streakDays: 0,
      avgDailyMinutes: 0
    },
    page: 1,
    pageSize: 20,
    hasMore: true,
    calendar: {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      data: []
    },
    weekDays: ['日', '一', '二', '三', '四', '五', '六'],
    calendarLoading: false
  },

  async onLoad() {
    console.log('[index] 开始加载数据')
    try {
      await this.loadRecordList()
      console.log('[index] loadRecordList 完成')
    } catch (e) {
      console.error('[index] loadRecordList 失败:', e)
    }
    try {
      await this.loadStats()
      console.log('[index] loadStats 完成')
    } catch (e) {
      console.error('[index] loadStats 失败:', e)
    }
    try {
      await this.loadCalendar()
      console.log('[index] loadCalendar 完成')
    } catch (e) {
      console.error('[index] loadCalendar 失败:', e)
    }
    console.log('[index] 数据加载全部完成')
  },

  onShow() {
    this.refreshData()
  },

  onPullDownRefresh() {
    this.refreshData()
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadRecordList()
    }
  },

  refreshData() {
    this.setData({
      page: 1,
      recordList: [],
      hasMore: true
    })
    this.loadRecordList()
    this.loadStats()
    this.loadCalendar()
  },

  loadRecordList() {
    this.setData({ loading: true })

    return wx.cloud.callFunction({
      name: 'checkinList',
      timeout: 30000,
      data: {
        page: this.data.page,
        pageSize: this.data.pageSize
      }
    }).then(res => {
      const result = res.result
      if (result.code === 0) {
        const { list, total, page, pageSize, debug } = result.data
        console.log('[index] checkinList debug:', debug)

        this.setData({
          recordList: page === 1 ? list : [...this.data.recordList, ...list],
          page: page + 1,
          hasMore: (page * pageSize) < total,
          loading: false
        })

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

  loadStats() {
    return wx.cloud.callFunction({
      name: 'checkinStats',
      timeout: 30000,
      data: {
        type: 'all'
      }
    }).then(res => {
      const result = res.result
      if (result.code === 0) {
        const { totalDays, totalMinutes, streakDays, avgDailyMinutes } = result.data
        
        this.setData({
          stats: {
            totalDays,
            totalHours: (totalMinutes / 60).toFixed(1),
            streakDays,
            avgDailyMinutes
          }
        })
      }
    }).catch(err => {
      console.error('[index] 加载统计数据失败:', err)
    })
  },

  loadCalendar() {
    this.setData({ calendarLoading: true })

    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1

    return wx.cloud.callFunction({
      name: 'checkinCalendar',
      timeout: 30000,
      data: {
        year,
        month
      }
    }).then(res => {
      const result = res.result
      if (result.code === 0) {
        const { calendar } = result.data
        this.setData({
          'calendar.year': year,
          'calendar.month': month,
          'calendar.data': this.buildCalendarData(calendar)
        })
      }
      this.setData({ calendarLoading: false })
    }).catch(err => {
      console.error('[index] 加载日历数据失败:', err)
      this.setData({ calendarLoading: false })
    })
  },

  buildCalendarData(calendarData) {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const firstDay = new Date(year, month - 1, 1).getDay()
    
    const result = []
    for (let i = 0; i < firstDay; i++) {
      result.push({ empty: true })
    }
    
    calendarData.forEach(day => {
      result.push({
        ...day,
        isToday: day.date === `${year}-${String(month).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      })
    })
    
    return result
  },

  onCalendarDayTap(e) {
    const day = e.currentTarget.dataset.day
    if (!day || day.empty) return
    
    const date = day.date
    const dayRecords = this.data.recordList.filter(item => item.date === date)
    
    if (dayRecords.length > 0) {
      wx.showActionSheet({
        itemList: dayRecords.map((r, i) => `${i + 1}. ${r.content.substring(0, 20)}...`),
        success: (res) => {
          const selectedRecord = dayRecords[res.tapIndex]
          wx.navigateTo({
            url: `/pages/detail/detail?id=${selectedRecord._id}`
          })
        }
      })
    }
  },

  onDetailTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  },

  onAddCheckin() {
    wx.navigateTo({
      url: '/pages/checkin/checkin'
    })
  }
})