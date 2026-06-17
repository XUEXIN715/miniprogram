// 云函数：checkinList - 查询打卡列表
console.log('[checkinList] 云函数启动加载')

const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  console.log('[checkinList] 收到请求, event:', JSON.stringify(event))
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  console.log('[checkinList] openid:', openid)

  const { page = 1, pageSize = 10 } = event

  try {
    // 测试：先查询所有记录，确认数据是否存在
    const allResult = await db.collection('checkin_records').limit(100).get()
    console.log('[checkinList] 所有记录条数:', allResult.data.length)
    console.log('[checkinList] 所有记录_openid:', allResult.data.map(r => r._openid))

    const countResult = await db.collection('checkin_records').where({
      _openid: openid
    }).count()
    console.log('[checkinList] count结果:', countResult)

    const total = countResult.total

    const result = await db.collection('checkin_records').where({
      _openid: openid
    }).orderBy('date', 'desc').skip((page - 1) * pageSize).limit(pageSize).get()
    console.log('[checkinList] get结果条数:', result.data.length)

    return {
      code: 0,
      msg: '查询成功',
      data: {
        list: result.data,
        total,
        page,
        pageSize,
        debug: {
          openid,
          allCount: allResult.data.length,
          allOpenids: allResult.data.map(r => r._openid)
        }
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
