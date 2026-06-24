Page({
  data: {
    userInfo: null,
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
    calendarLoading: false,
    categoryList: ['全部', '编程开发', '语言学习', '数学逻辑', '阅读写作', '考试备考', '其他'],
    selectedCategory: '全部',
    selectedDate: '',
    showFilter: false
  },

  onLoad() {
    const now = new Date()
    const initYear = now.getFullYear()
    const initMonth = now.getMonth() + 1
    this.setData({
      'calendar.year': initYear,
      'calendar.month': initMonth,
      'calendar.data': this.buildEmptyCalendar(initYear, initMonth)
    })

    console.log('[index] 开始加载数据')
    this.loadUserInfo().catch(e => console.error('[index] loadUserInfo 失败:', e))
    this.loadRecordList().catch(e => console.error('[index] loadRecordList 失败:', e))
    this.loadStats().catch(e => console.error('[index] loadStats 失败:', e))
    this.loadCalendar().catch(e => console.error('[index] loadCalendar 失败:', e))
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

  // 加载用户信息
  loadUserInfo() {
    const app = getApp()
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo
      })
      return Promise.resolve()
    }

    return wx.cloud.callFunction({
      name: 'getUserInfo',
      timeout: 30000,
      data: {}
    }).then(res => {
      if (res.result.code === 0) {
        app.globalData.userInfo = res.result.data
        this.setData({
          userInfo: res.result.data
        })
      }
    }).catch(err => {
      console.error('[index] 加载用户信息失败:', err)
    })
  },

  // 获取用户信息（点击头像）
  onGetUserProfile() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        const userInfo = res.userInfo
        wx.cloud.callFunction({
          name: 'getUserInfo',
          timeout: 30000,
          data: {
            nickName: userInfo.nickName,
            avatarUrl: userInfo.avatarUrl
          }
        }).then(result => {
          if (result.result.code === 0) {
            const app = getApp()
            app.globalData.userInfo = result.result.data
            this.setData({
              userInfo: result.result.data
            })
          }
        })
      }
    })
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

    const data = {
      page: this.data.page,
      pageSize: this.data.pageSize
    }

    // 添加筛选条件
    if (this.data.selectedCategory && this.data.selectedCategory !== '全部') {
      data.category = this.data.selectedCategory
    }
    if (this.data.selectedDate) {
      data.startDate = this.data.selectedDate
      data.endDate = this.data.selectedDate
    }

    return wx.cloud.callFunction({
      name: 'checkinList',
      timeout: 30000,
      data
    }).then(res => {
      const result = res.result
      if (result.code === 0) {
        const { list, total, page, pageSize } = result.data

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

  loadCalendar(year, month) {
    this.setData({ calendarLoading: true })

    if (!year || !month) {
      const now = new Date()
      year = now.getFullYear()
      month = now.getMonth() + 1
    }

    return wx.cloud.callFunction({
      name: 'checkinCalendar',
      timeout: 30000,
      data: {
        year,
        month
      }
    }).then(res => {
      const result = res.result
      if (result && result.code === 0) {
        const { calendar } = result.data
        this.setData({
          'calendar.year': year,
          'calendar.month': month,
          'calendar.data': this.buildCalendarData(calendar, year, month)
        })
      } else {
        this.setData({
          'calendar.year': year,
          'calendar.month': month,
          'calendar.data': this.buildEmptyCalendar(year, month)
        })
      }
      this.setData({ calendarLoading: false })
    }).catch(err => {
      console.error('[index] 加载日历数据失败:', err)
      this.setData({
        'calendar.year': year,
        'calendar.month': month,
        'calendar.data': this.buildEmptyCalendar(year, month),
        calendarLoading: false
      })
    })
  },

  buildEmptyCalendar(year, month) {
    const daysInMonth = new Date(year, month, 0).getDate()
    const calendar = []
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      calendar.push({
        date: dateStr,
        day: day,
        hasCheckin: false,
        duration: 0
      })
    }
    return this.buildCalendarData(calendar, year, month)
  },

  onPrevMonth() {
    let year = this.data.calendar.year
    let month = this.data.calendar.month - 1
    if (month < 1) {
      month = 12
      year--
    }
    this.loadCalendar(year, month)
  },

  onNextMonth() {
    let year = this.data.calendar.year
    let month = this.data.calendar.month + 1
    if (month > 12) {
      month = 1
      year++
    }
    this.loadCalendar(year, month)
  },

  buildCalendarData(calendarData, year, month) {
    const now = new Date()
    const firstDay = new Date(year, month - 1, 1).getDay()
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    
    const result = []
    for (let i = 0; i < firstDay; i++) {
      result.push({ empty: true, idx: i })
    }
    
    calendarData.forEach((day, index) => {
      result.push({
        ...day,
        isToday: day.date === todayStr,
        idx: firstDay + index
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

  // 筛选相关方法
  onToggleFilter() {
    this.setData({
      showFilter: !this.data.showFilter
    })
  },

  onCategoryChange(e) {
    const category = this.data.categoryList[e.detail.value]
    this.setData({
      selectedCategory: category,
      page: 1,
      recordList: [],
      hasMore: true
    })
    this.loadRecordList()
  },

  onDateChange(e) {
    const date = e.detail.value
    this.setData({
      selectedDate: date,
      page: 1,
      recordList: [],
      hasMore: true
    })
    this.loadRecordList()
  },

  onClearFilter() {
    this.setData({
      selectedCategory: '全部',
      selectedDate: '',
      page: 1,
      recordList: [],
      hasMore: true
    })
    this.loadRecordList()
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
