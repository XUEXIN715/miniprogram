// 云函数：checkinList - 查询打卡列表
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const { page = 1, pageSize = 10 } = event

  try {
    const countResult = await db.collection('checkin_records').where({
      _openid: openid
    }).count()

    const total = countResult.total

    const result = await db.collection('checkin_records').where({
      _openid: openid
    }).orderBy('date', 'desc').skip((page - 1) * pageSize).limit(pageSize).get()

    return {
      code: 0,
      msg: '查询成功',
      data: {
        list: result.data,
        total,
        page,
        pageSize
      }
    }
  } catch (err) {
    console.error('[checkinList] 错误：', err)
    return {
      code: -1,
      msg: '查询失败：' + err.message
    }
  }
}
