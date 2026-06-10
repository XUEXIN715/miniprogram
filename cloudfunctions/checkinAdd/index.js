// 云函数：checkinAdd - 新增打卡记录
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const { content, duration, date } = event

  // 参数校验
  if (!content || content.trim() === '') {
    return {
      code: -1,
      msg: '学习内容不能为空'
    }
  }

  if (!duration || duration <= 0) {
    return {
      code: -1,
      msg: '学习时长必须大于0'
    }
  }

  if (!date) {
    return {
      code: -1,
      msg: '打卡日期不能为空'
    }
  }

  try {
    const result = await db.collection('checkin_records').add({
      data: {
        content: content.trim(),
        duration: Number(duration),
        date: date,
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    })

    return {
      code: 0,
      msg: '打卡成功',
      data: {
        _id: result._id
      }
    }
  } catch (err) {
    console.error('[checkinAdd] 错误：', err)
    return {
      code: -1,
      msg: '打卡失败：' + err.message
    }
  }
}
