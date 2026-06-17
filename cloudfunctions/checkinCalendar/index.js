const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const { year, month } = event

  if (!year || !month) {
    return {
      code: -1,
      msg: '年份和月份不能为空'
    }
  }

  try {
    const records = await db.collection('checkin_records')
      .where({
        _openid: openid,
        year: year,
        month: month
      })
      .limit(100)
      .get()

    const recordList = records.data
    const dateMap = {}

    recordList.forEach(record => {
      if (!dateMap[record.date]) {
        dateMap[record.date] = { hasCheckin: true, duration: 0 }
      }
      dateMap[record.date].duration += (record.duration || 0)
    })

    const daysInMonth = new Date(year, month, 0).getDate()
    const calendar = []

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayInfo = dateMap[dateStr] || { hasCheckin: false, duration: 0 }
      calendar.push({
        date: dateStr,
        day: day,
        hasCheckin: dayInfo.hasCheckin,
        duration: dayInfo.duration
      })
    }

    return {
      code: 0,
      msg: '查询成功',
      data: { year, month, calendar, totalDays: daysInMonth }
    }
  } catch (err) {
    console.error('[checkinCalendar] 错误：', err)
    return {
      code: -1,
      msg: '查询失败：' + err.message
    }
  }
}
