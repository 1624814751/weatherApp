//app.js
// 引入腾讯地图jssdk文件
import QQMapWX from "./util/qqmap-wx-jssdk.min"
App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        env: 'weather-4gv1vev89f9c2973',
        traceUser: true,
      })
    }

    this.getOpenid();
    this.autoUserLocation();

  },

  //获取openid顺序：globalData--storage--云函数login
  getOpenid: async function () {
    (this.globalData.openid = this.globalData.openid || wx.getStorageSync('openid')) || wx.setStorageSync('openid', this.globalData.openid = (await wx.cloud.callFunction({
      name: 'login'
    })).result.openid)
    return this.globalData.openid
  },

  //获取用户微信地址
  getWxLocation() {
    let that = this;
    let bmapsdk = new QQMapWX({
      key: that.globalData.mapKey,
    });
    wx.getLocation({
      type: 'gcj02',
      success(res) {
        const myLocation = `${res.longitude},${res.latitude}`;
        wx.setStorageSync('myLocation', myLocation);
        wx.setStorageSync('isLocation', true);
        let values = res;
        // 逆地址解析方法
        bmapsdk.reverseGeocoder({
          location: {
            latitude: res.latitude,
            longitude: res.longitude
          },
          success(res) {
            let result = res.result;
            let myCityName = result.address_component.city || result.address_component.district;
            wx.setStorageSync('myCityName', myCityName);
            Object.assign(values,{myCityName:myCityName})
            if (that.isLocationCallback) {
              that.isLocationCallback(values);
            }
          },
          fail(err) {}
        })
       
      }
    })
  },

  //授权用户位置-先判断
  autoUserLocation() {
    let that = this;
    wx.getSetting({
      success(res) {
        if (!res.authSetting['scope.userLocation']) {
          console.log('位置未授权')
          wx.setStorageSync('isLocation', false);
          wx.authorize({
            scope: 'scope.userLocation',
            success(res) {
              that.getWxLocation();
            },
            fail(res) {
              console.log('~~取消位置授权~~')
              wx.setStorageSync('myLocation', '');
              wx.setStorageSync('isLocation', false);
              wx.showModal({
                title: '定位失败',
                content: '请允许”使用我的地理位置“后，再查看定位城市信息，默认为您展示广州的天气信息。',
                showCancel: false,
                confirmText: '好的',
                success(res) {
                  if (res.confirm) {
                    if (that.isCancleCallback) {
                      that.isCancleCallback(true);
                    }
                  }
                }
              })
            }
          })
        } else {
          console.log('位置已授权')
          that.getWxLocation();
        }
      }
    })
  },

	//打开地址设置
  openSettingLocation( callback = () => {}) {
    let that = this;
    wx.openSetting({
      success(res) {
        console.log(res)
        if (!res.authSetting["scope.userLocation"]) {
          console.log('拒绝授权')
          wx.setStorageSync('isLocation', false);
        } else {
          that.getWxLocation();
          callback(true);
        }
      },fail(err){
        console.log(err)
      }
    })
  },


  globalData: {
    openid: '',
    keepscreenon: false,
    systeminfo: {},
    isIPhoneX: false,
    mapKey: 'XMBBZ-LHVKX-TI64A-TN2BC-Z7HQ7-DDBMB', //腾讯地图key
    key: '47239ca49943449791433c187c407355', //和风天气的key
    imgUrl:'cloud://weather-4gv1vev89f9c2973.7765-weather-4gv1vev89f9c2973-1305109682/weatherPic',//图片路径-云储图片的文件夹地址
    isLocation: false, //是否已授权地理位置 
    defalutCityName: '广州市', //默认城市广州
    defalutLocation: '113.265086,23.156042', //默认城市广州坐标
    cityName: '', //选中的城市名
    location: '', //选中的城市坐标
  },
})