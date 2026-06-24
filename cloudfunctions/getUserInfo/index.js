// 云函数：getUserInfo - 获取或创建用户信息
// 功能：根据openid查询用户信息，如果不存在则创建新用户
// 参数：nickName（昵称，可选）、avatarUrl（头像，可选）
// 返回：code（状态码）、data.userInfo（用户信息对象）
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const { nickName, avatarUrl } = event

  if (!openid) {
    return {
      code: -1,
      msg: '获取用户身份失败'
    }
  }

  try {
    // 查询用户是否已存在
    const userResult = await db.collection('users').where({
      _openid: openid
    }).get()

    if (userResult.data.length > 0) {
      // 用户已存在，更新信息
      const updateData = {}
      if (nickName !== undefined) updateData.nickName = nickName
      if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl
      updateData.updateTime = db.serverDate()

      await db.collection('users').doc(userResult.data[0]._id).update({
        data: updateData
      })

      const updatedUser = await db.collection('users').doc(userResult.data[0]._id).get()

      return {
        code: 0,
        msg: '用户信息更新成功',
        data: updatedUser.data
      }
    } else {
      // 新用户，创建记录
      const addResult = await db.collection('users').add({
        data: {
          _openid: openid,
          nickName: nickName || '微信用户',
          avatarUrl: avatarUrl || '',
          signature: '',
          totalCheckins: 0,
          totalDuration: 0,
          lastCheckinDate: '',
          streakDays: 0,
          reminderTime: '',
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      })

      const newUser = await db.collection('users').doc(addResult._id).get()

      return {
        code: 0,
        msg: '用户创建成功',
        data: newUser.data
      }
    }
  } catch (err) {
    console.error('[getUserInfo] 错误：', err)
    return {
      code: -1,
      msg: '获取用户信息失败：' + err.message
    }
  }
}
