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

    const detail = result.data[0]

    // 转换云存储图片fileID为临时访问URL
    if (detail.imageUrl && detail.imageUrl.startsWith('cloud://')) {
      try {
        const tempUrlResult = await cloud.getTempFileURL({
          fileList: [detail.imageUrl]
        })
        if (tempUrlResult.fileList && tempUrlResult.fileList.length > 0) {
          detail.imageUrl = tempUrlResult.fileList[0].tempFileURL
        }
      } catch (urlErr) {
        console.error('[checkinDetail] 获取临时图片URL失败:', urlErr)
      }
    }

    return {
      code: 0,
      msg: '查询成功',
      data: detail
    }
  } catch (err) {
    console.error('[checkinDetail] 错误：', err)
    return {
      code: -1,
      msg: '查询失败：' + err.message
    }
  }
}
