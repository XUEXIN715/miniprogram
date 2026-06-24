App({
  onLaunch: function () {
    this.globalData = {
      env: "cloud1-d6gil20hm00cbde86",
      userInfo: null
    };
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    } else {
      wx.cloud.init({
        env: this.globalData.env,
        traceUser: true,
      });
    }
    
    this.initUser();
  },

  async initUser() {
    try {
      // 使用 wx.login 获取用户信息（替代已废弃的 wx.getUserInfo）
      const userInfo = await this.getUserInfo();
      
      const result = await wx.cloud.callFunction({
        name: 'userInit',
        timeout: 30000,
        data: {
          nickName: userInfo.nickName || '微信用户',
          avatarUrl: userInfo.avatarUrl || ''
        }
      });

      if (result.result.code === 0) {
        this.globalData.userInfo = result.result.data;
        console.log('[app.js] 用户初始化成功:', result.result.data);
      } else {
        console.error('[app.js] 用户初始化失败:', result.result.msg);
      }
    } catch (err) {
      console.error('[app.js] 用户初始化异常:', err);
    }
  },

  getUserInfo() {
    return new Promise((resolve) => {
      // 使用 wx.getUserProfile 获取用户信息（推荐方式）
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: (res) => {
          resolve(res.userInfo);
        },
        fail: () => {
          // 用户拒绝授权，使用默认信息
          resolve({ nickName: '微信用户', avatarUrl: '' });
        }
      });
    });
  },

  globalData: {
    env: "cloud1-d6gil20hm00cbde86",
    userInfo: null
  },
});