export const locales = ['zh-CN'] as const;
export const defaultLocale = 'zh-CN' as const;

export type Locale = (typeof locales)[number];