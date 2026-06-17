const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const { nickName, avatarUrl } = event

  try {
    const existingUser = await db.collection('users').where({
      _openid: openid
    }).get()

    if (existingUser.data.length > 0) {
      return {
        code: 0,
        msg: '用户已存在',
        data: existingUser.data[0]
      }
    }

    const result = await db.collection('users').add({
      data: {
        nickName: nickName || '用户',
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

    const newUser = await db.collection('users').doc(result._id).get()

    return {
      code: 0,
      msg: '用户初始化成功',
      data: newUser.data
    }
  } catch (err) {
    console.error('[userInit] 错误：', err)
    return {
      code: -1,
      msg: '用户初始化失败：' + err.message
    }
  }
}