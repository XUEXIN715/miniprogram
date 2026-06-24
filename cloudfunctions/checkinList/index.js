// 云函数：checkinList - 查询打卡列表（支持筛选）
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const { page = 1, pageSize = 10, category, startDate, endDate } = event

  try {
    // 构建查询条件
    const whereCondition = {
      _openid: openid
    }

    // 分类筛选
    if (category && category !== '全部') {
      whereCondition.category = category
    }

    // 日期范围筛选
    if (startDate || endDate) {
      whereCondition.date = {}
      if (startDate) {
        whereCondition.date = _.gte(startDate)
      }
      if (endDate) {
        whereCondition.date = _.lte(endDate)
      }
      if (startDate && endDate) {
        whereCondition.date = _.gte(startDate).and(_.lte(endDate))
      }
    }

    // 查询总数
    const countResult = await db.collection('checkin_records').where(whereCondition).count()
    const total = countResult.total

    // 查询列表
    const result = await db.collection('checkin_records')
      .where(whereCondition)
      .orderBy('date', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    // 转换云存储图片fileID为临时访问URL
    const list = result.data
    const imageFileIds = list.filter(item => item.imageUrl && item.imageUrl.startsWith('cloud://')).map(item => item.imageUrl)
    if (imageFileIds.length > 0) {
      try {
        const tempUrlResult = await cloud.getTempFileURL({
          fileList: imageFileIds
        })
        const urlMap = {}
        tempUrlResult.fileList.forEach(item => {
          urlMap[item.fileID] = item.tempFileURL
        })
        list.forEach(item => {
          if (item.imageUrl && urlMap[item.imageUrl]) {
            item.imageUrl = urlMap[item.imageUrl]
          }
        })
      } catch (urlErr) {
        console.error('[checkinList] 获取临时图片URL失败:', urlErr)
      }
    }

    return {
      code: 0,
      msg: '查询成功',
      data: {
        list: list,
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
