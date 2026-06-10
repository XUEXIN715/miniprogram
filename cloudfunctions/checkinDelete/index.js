// 云函数: checkinDelete - 删除打卡记录
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
    // 检查记录是否存在且属于当前用户
    const checkResult = await db.collection('checkin_records').where({
      _id: id,
      _openid: openid
    }).get()

    if (checkResult.data.length === 0) {
      return {
        code: -1,
        msg: '记录不存在或无权限删除'
      }
    }

    await db.collection('checkin_records').doc(id).remove()

    return {
      code: 0,
      msg: '删除成功'
    }
  } catch (err) {
    console.error('[checkinDelete] 错误：', err)
    return {
      code: -1,
      msg: '删除失败：' + err.message
    }
  }
}
