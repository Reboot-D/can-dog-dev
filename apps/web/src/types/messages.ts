// Type definitions for i18n messages
// This file is auto-generated based on the messages in zh-CN.json

export type Messages = typeof import('../messages/zh-CN.json');

declare global {
  // Use type safe message keys with `next-intl`
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface IntlMessages extends Messages {}
}