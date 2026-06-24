// 云函数：checkinAdd - 添加打卡记录
// 功能：接收用户提交的打卡内容、时长、日期、分类、图片等信息，存入数据库
// 参数：content（学习内容）、duration（时长，分钟）、date（日期）、category（分类）、imageUrl（图片fileID）
// 返回：code（状态码）、msg（提示信息）、data._id（新增记录ID）
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const { content, duration, date, category, imageUrl } = event

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
    const dateParts = date.split('-')
    const year = parseInt(dateParts[0])
    const month = parseInt(dateParts[1])
    const day = parseInt(dateParts[2])
    const dateObj = new Date(year, month - 1, day)
    const weekday = dateObj.getDay() === 0 ? 7 : dateObj.getDay()

    // 获取用户信息
    let nickName = ''
    let avatarUrl = ''
    try {
      const userResult = await db.collection('users').where({
        _openid: openid
      }).get()
      if (userResult.data.length > 0) {
        nickName = userResult.data[0].nickName || ''
        avatarUrl = userResult.data[0].avatarUrl || ''
      }
    } catch (e) {
      console.error('[checkinAdd] 获取用户信息失败:', e)
    }

    const addResult = await db.collection('checkin_records').add({
      data: {
        _openid: openid,
        content: content.trim(),
        duration: Number(duration),
        date: date,
        category: category || '其他',
        imageUrl: imageUrl || '',
        nickName: nickName,
        avatarUrl: avatarUrl,
        year: year,
        month: month,
        weekday: weekday,
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    })

    await updateUserStats(openid, Number(duration), date)

    return {
      code: 0,
      msg: '打卡成功',
      data: {
        _id: addResult._id
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

async function updateUserStats(openid, duration, date) {
  try {
    const userResult = await db.collection('users').where({
      _openid: openid
    }).get()

    if (userResult.data.length === 0) {
      return
    }

    const user = userResult.data[0]
    const updateData = {}

    updateData.totalCheckins = (user.totalCheckins || 0) + 1
    updateData.totalDuration = (user.totalDuration || 0) + duration
    updateData.lastCheckinDate = date

    const lastDate = user.lastCheckinDate || ''
    if (lastDate) {
      const lastDateObj = new Date(lastDate)
      const currentDateObj = new Date(date)
      const diffDays = (currentDateObj - lastDateObj) / (1000 * 60 * 60 * 24)

      if (diffDays === 1) {
        updateData.streakDays = (user.streakDays || 0) + 1
      } else if (diffDays > 1) {
        updateData.streakDays = 1
      }
    } else {
      updateData.streakDays = 1
    }

    updateData.updateTime = db.serverDate()

    await db.collection('users').where({
      _openid: openid
    }).update({
      data: updateData
    })
  } catch (err) {
    console.error('[updateUserStats] 错误：', err)
  }
}