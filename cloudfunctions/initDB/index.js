// 云函数：initDB - 初始化数据库
// 功能：初始化分类数据等基础配置，首次部署时调用一次
// 参数：无
// 返回：code（状态码）、data.categories（分类初始化结果）
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

const categories = [
  { _id: 'cat_1', name: '编程开发', icon: '💻', sort: 1 },
  { _id: 'cat_2', name: '语言学习', icon: '📚', sort: 2 },
  { _id: 'cat_3', name: '数学逻辑', icon: '🔢', sort: 3 },
  { _id: 'cat_4', name: '阅读写作', icon: '📖', sort: 4 },
  { _id: 'cat_5', name: '考试备考', icon: '📝', sort: 5 },
  { _id: 'cat_6', name: '其他', icon: '📌', sort: 6 }
]

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return {
      code: -1,
      msg: '未获取到用户身份'
    }
  }

  try {
    const results = []

    for (const cat of categories) {
      try {
        // 检查是否已存在
        const exist = await db.collection('categories').doc(cat._id).get()
        results.push({ name: cat.name, status: '已存在' })
      } catch (e) {
        // 不存在则添加
        await db.collection('categories').add({
          data: {
            _id: cat._id,
            name: cat.name,
            icon: cat.icon,
            sort: cat.sort,
            createTime: db.serverDate()
          }
        })
        results.push({ name: cat.name, status: '已添加' })
      }
    }

    return {
      code: 0,
      msg: '初始化完成',
      data: {
        categories: results
      }
    }
  } catch (err) {
    console.error('[initDB] 错误：', err)
    return {
      code: -1,
      msg: '初始化失败：' + err.message
    }
  }
}
