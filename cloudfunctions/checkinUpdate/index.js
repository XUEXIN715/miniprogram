// 云函数: checkinUpdate - 更新打卡记录
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const { id, content, duration, category, imageUrl } = event

  if (!id) {
    return {
      code: -1,
      msg: '记录ID不能为空'
    }
  }

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

  try {
    // 检查记录是否存在且属于当前用户
    const checkResult = await db.collection('checkin_records').where({
      _id: id,
      _openid: openid
    }).get()

    if (checkResult.data.length === 0) {
      return {
        code: -1,
        msg: '记录不存在或无权限编辑'
      }
    }

    const updateData = {
      content: content.trim(),
      duration: Number(duration),
      updateTime: db.serverDate()
    }

    if (category !== undefined) {
      updateData.category = category
    }

    if (imageUrl !== undefined) {
      updateData.imageUrl = imageUrl
    }

    await db.collection('checkin_records').doc(id).update({
      data: updateData
    })

    return {
      code: 0,
      msg: '更新成功'
    }
  } catch (err) {
    console.error('[checkinUpdate] 错误：', err)
    return {
      code: -1,
      msg: '更新失败：' + err.message
    }
  }
}
