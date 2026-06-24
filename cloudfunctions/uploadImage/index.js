// 云函数：uploadImage - 上传图片到云存储
// 功能：接收base64格式的图片内容，上传到云存储，返回fileID
// 参数：fileContent（base64图片内容）、cloudPath（云存储路径，可选）
// 返回：code（状态码）、data.fileID（云存储文件ID）
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  const { fileContent, cloudPath } = event

  if (!fileContent) {
    return {
      code: -1,
      msg: '图片内容不能为空'
    }
  }

  try {
    const buffer = Buffer.from(fileContent, 'base64')
    const result = await cloud.uploadFile({
      cloudPath: cloudPath || `checkin-images/${Date.now()}.png`,
      fileContent: buffer
    })

    return {
      code: 0,
      msg: '上传成功',
      data: {
        fileID: result.fileID
      }
    }
  } catch (err) {
    console.error('[uploadImage] 错误：', err)
    return {
      code: -1,
      msg: '上传失败：' + err.message
    }
  }
}
