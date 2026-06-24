// 云函数：sendReminder - 发送打卡提醒
// 功能：定时触发，检查用户是否已打卡，未打卡则发送订阅消息提醒
// 参数：无（定时触发器调用）
// 返回：code（状态码）、msg（提示信息）
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const day = now.getDate()
    const todayStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    const usersResult = await db.collection('users').where({
      reminderTime: db.command.exists(true),
      reminderTime: db.command.neq('')
    }).get()

    const users = usersResult.data
    let sentCount = 0

    for (const user of users) {
      const lastCheckinDate = user.lastCheckinDate || ''
      
      if (lastCheckinDate !== todayStr) {
        try {
          const result = await cloud.openapi.subscribeMessage.send({
            touser: user._openid,
            templateId: '',
            page: '/pages/checkin/checkin',
            data: {
              date1: {
                value: todayStr
              }
            }
          })
          sentCount++
          console.log(`[sendReminder] 提醒已发送给用户: ${user._openid}`)
        } catch (sendErr) {
          console.error('[sendReminder] 发送提醒失败:', sendErr)
        }
      }
    }

    return {
      code: 0,
      msg: '提醒发送完成',
      data: {
        sentCount,
        totalUsers: users.length
      }
    }
  } catch (err) {
    console.error('[sendReminder] 错误：', err)
    return {
      code: -1,
      msg: '发送提醒失败：' + err.message
    }
  }
}