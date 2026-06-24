// 云函数：getCategoryList - 获取打卡分类列表
// 功能：从 categories 集合中读取所有分类，用于筛选和选择
// 参数：无
// 返回：code（状态码）、data.list（分类数组，按sort排序）
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const result = await db.collection('categories')
      .orderBy('sort', 'asc')
      .get()

    return {
      code: 0,
      msg: '查询成功',
      data: {
        list: result.data
      }
    }
  } catch (err) {
    console.error('[getCategoryList] 错误：', err)
    return {
      code: -1,
      msg: '查询失败：' + err.message
    }
  }
}
