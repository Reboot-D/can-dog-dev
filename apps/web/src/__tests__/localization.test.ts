import zhCN from '../messages/zh-CN.json'

describe('Localization Files', () => {
  it('contains all required message keys', () => {
    // Test common messages
    expect(zhCN.common).toBeDefined()
    expect(zhCN.common.appName).toBe('宠爱AI')
    expect(zhCN.common.loading).toBe('加载中...')
    expect(zhCN.common.error).toBe('出错了')
    
    // Test navigation messages
    expect(zhCN.navigation).toBeDefined()
    expect(zhCN.navigation.home).toBe('首页')
    expect(zhCN.navigation.dashboard).toBe('控制台')
    
    // Test forms messages
    expect(zhCN.forms).toBeDefined()
    expect(zhCN.forms.email).toBe('电子邮箱')
    expect(zhCN.forms.password).toBe('密码')
    
    // Test home page messages
    expect(zhCN.home).toBeDefined()
    expect(zhCN.home.title).toBe('宠爱AI')
    expect(zhCN.home.status.systemStatus).toBe('系统状态')
    
    // Test auth messages
    expect(zhCN.auth).toBeDefined()
    expect(zhCN.auth.loginTitle).toBe('登录到您的账户')
    
    // Test pets messages
    expect(zhCN.pets).toBeDefined()
    expect(zhCN.pets.title).toBe('我的宠物')
  })

  it('has properly structured nested messages', () => {
    // Check nested structure
    expect(typeof zhCN.home.status).toBe('object')
    expect(zhCN.home.status.healthy).toBe('正常')
    expect(zhCN.home.status.connected).toBe('已连接')
  })

  it('contains Chinese characters in all message values', () => {
    // Helper function to check if string contains Chinese characters
    const containsChinese = (str: string) => /[\u4e00-\u9fa5]/.test(str)
    
    // Check some key messages contain Chinese
    expect(containsChinese(zhCN.common.appName)).toBe(true)
    expect(containsChinese(zhCN.navigation.home)).toBe(true)
    expect(containsChinese(zhCN.auth.loginTitle)).toBe(true)
    expect(containsChinese(zhCN.pets.addPet)).toBe(true)
  })
})