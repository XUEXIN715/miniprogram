// 云函数：checkinDetail - 查询打卡详情
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const { id } = event

  if (!id) {
    return {
      code: -1,
      msg: '记录ID不能为空'
    }
  }

  try {
    const result = await db.collection('checkin_records').where({
      _id: id,
      _openid: openid
    }).get()

    if (result.data.length === 0) {
      return {
        code: -1,
        msg: '记录不存在或无权限查看'
      }
    }

    return {
      code: 0,
      msg: '查询成功',
      data: result.data[0]
    }
  } catch (err) {
    console.error('[checkinDetail] 错误：', err)
    return {
      code: -1,
      msg: '查询失败：' + err.message
    }
  }
}
