module.exports = {
  NextIntlClientProvider: ({ children }) => children,
  useTranslations: (namespace) => {
    return (key) => {
      // Return the translation key path for testing
      return namespace ? `${namespace}.${key}` : key
    }
  },
}