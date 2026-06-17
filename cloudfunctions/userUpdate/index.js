const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const { nickName, signature, reminderTime } = event

  try {
    const updateData = {}
    
    if (nickName !== undefined) {
      updateData.nickName = nickName.trim()
    }
    
    if (signature !== undefined) {
      updateData.signature = signature.trim()
    }
    
    if (reminderTime !== undefined) {
      updateData.reminderTime = reminderTime
    }
    
    updateData.updateTime = db.serverDate()

    const result = await db.collection('users').where({
      _openid: openid
    }).update({
      data: updateData
    })

    if (result.stats.updated === 0) {
      return {
        code: -1,
        msg: '用户不存在或未找到'
      }
    }

    const updatedUser = await db.collection('users').where({
      _openid: openid
    }).get()

    return {
      code: 0,
      msg: '更新成功',
      data: updatedUser.data[0]
    }
  } catch (err) {
    console.error('[userUpdate] 错误：', err)
    return {
      code: -1,
      msg: '更新失败：' + err.message
    }
  }
}