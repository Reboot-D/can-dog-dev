module.exports = {
  getRequestConfig: (fn) => fn,
  getMessages: async () => ({
    common: { appName: '宠爱AI' }
  }),
}