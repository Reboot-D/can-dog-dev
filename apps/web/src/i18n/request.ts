import { getRequestConfig } from 'next-intl/server';
import { locales } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
  // This can either be defined statically at the top-level if no user
  // is involved, or as a side effect of calling a function, where it is
  // defined based on, for example, a user setting.
  let locale = await requestLocale;

  // Ensure that a valid locale is used
  if (!locale || !locales.includes(locale as typeof locales[number])) {
    locale = 'zh-CN';
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});