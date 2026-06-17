const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    const records = await db.collection('checkin_records')
      .where({ _openid: openid })
      .orderBy('date', 'desc')
      .limit(100)
      .get()

    const recordList = records.data
    const totalMinutes = recordList.reduce((sum, item) => sum + (item.duration || 0), 0)
    const uniqueDates = [...new Set(recordList.map(item => item.date))]
    const totalDays = uniqueDates.length

    return {
      code: 0,
      msg: '查询成功',
      data: {
        totalDays,
        totalMinutes,
        streakDays: 0,
        avgDailyMinutes: totalDays > 0 ? Math.round(totalMinutes / totalDays) : 0,
        type: 'all'
      }
    }
  } catch (err) {
    console.error('[checkinStats] 错误：', err)
    return {
      code: -1,
      msg: '查询失败：' + err.message
    }
  }
}
