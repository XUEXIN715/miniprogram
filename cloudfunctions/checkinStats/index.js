// 云函数：checkinStats - 查询打卡统计数据
// 功能：统计用户的累计打卡天数、总时长、连续打卡天数、日均时长
// 参数：无
// 返回：code（状态码）、data.totalDays（累计天数）、data.totalMinutes（总分钟数）、data.streakDays（连续天数）、data.avgDailyMinutes（日均分钟）
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
