// 云函数：getImageUrl - 获取云存储图片的临时访问URL
// 功能：将云存储的fileID转换为可直接访问的临时URL，用于图片展示
// 参数：fileList（fileID数组，支持批量转换）
// 返回：code（状态码）、data.urlList（转换后的URL数组）
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  const { fileList } = event

  if (!fileList || !Array.isArray(fileList) || fileList.length === 0) {
    return {
      code: -1,
      msg: 'fileList参数不能为空'
    }
  }

  try {
    const result = await cloud.getTempFileURL({
      fileList: fileList
    })

    const urlList = result.fileList.map(item => ({
      fileID: item.fileID,
      tempFileURL: item.tempFileURL,
      status: item.status
    }))

    return {
      code: 0,
      msg: '获取成功',
      data: {
        urlList: urlList
      }
    }
  } catch (err) {
    console.error('[getImageUrl] 错误：', err)
    return {
      code: -1,
      msg: '获取失败：' + err.message
    }
  }
}
