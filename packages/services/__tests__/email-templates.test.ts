import { describe, it, expect } from '@jest/globals';
import { createTestEmailTemplate, createNotificationEmailTemplate } from '../email-templates';
import type { TestEmailTemplateData, NotificationEmailTemplateData } from '../email-types';

describe('Email Templates', () => {
  describe('createTestEmailTemplate', () => {
    const testData: TestEmailTemplateData = {
      userName: '张三',
      petName: '小白',
      eventType: '疫苗接种',
      eventDate: '2024年1月15日 星期一'
    };

    it('should create test email template with Chinese content', () => {
      const template = createTestEmailTemplate(testData);

      expect(template.subject).toBe('🐾 宠物护理提醒 - 小白的疫苗接种');
      expect(template.html).toContain('张三');
      expect(template.html).toContain('小白');
      expect(template.html).toContain('疫苗接种');
      expect(template.html).toContain('2024年1月15日 星期一');
      expect(template.text).toContain('张三');
      expect(template.text).toContain('小白');
    });

    it('should include proper UTF-8 encoding metadata', () => {
      const template = createTestEmailTemplate(testData);

      expect(template.html).toContain('lang="zh-CN"');
      expect(template.html).toContain('charset="UTF-8"');
    });

    it('should include Chinese font families', () => {
      const template = createTestEmailTemplate(testData);

      expect(template.html).toContain('PingFang SC');
      expect(template.html).toContain('Hiragino Sans GB');
      expect(template.html).toContain('Microsoft YaHei');
    });

    it('should have both HTML and text versions', () => {
      const template = createTestEmailTemplate(testData);

      expect(template.html).toBeDefined();
      expect(template.text).toBeDefined();
      expect(template.html!.length).toBeGreaterThan(0);
      expect(template.text!.length).toBeGreaterThan(0);
    });

    it('should handle emoji characters correctly', () => {
      const template = createTestEmailTemplate(testData);

      expect(template.subject).toContain('🐾');
      expect(template.html).toContain('🐾');
      expect(template.html).toContain('✅');
      expect(template.html).toContain('🎉');
    });
  });

  describe('createNotificationEmailTemplate', () => {
    const notificationData: NotificationEmailTemplateData = {
      userName: '李四',
      petName: '小花',
      notificationTitle: '紧急提醒',
      notificationMessage: '您的宠物需要立即就医',
      actionUrl: 'https://petcare-ai.com/emergency'
    };

    it('should create notification email template with Chinese content', () => {
      const template = createNotificationEmailTemplate(notificationData);

      expect(template.subject).toBe('🔔 紧急提醒 - 小花');
      expect(template.html).toContain('李四');
      expect(template.html).toContain('小花');
      expect(template.html).toContain('紧急提醒');
      expect(template.html).toContain('您的宠物需要立即就医');
    });

    it('should include action URL when provided', () => {
      const template = createNotificationEmailTemplate(notificationData);

      expect(template.html).toContain('https://petcare-ai.com/emergency');
      expect(template.html).toContain('查看详情');
      expect(template.text).toContain('https://petcare-ai.com/emergency');
    });

    it('should handle missing action URL gracefully', () => {
      const dataWithoutUrl = { ...notificationData };
      delete dataWithoutUrl.actionUrl;

      const template = createNotificationEmailTemplate(dataWithoutUrl);

      expect(template.html).not.toContain('查看详情');
      expect(template.text).not.toContain('查看详情：');
    });

    it('should use proper notification styling', () => {
      const template = createNotificationEmailTemplate(notificationData);

      expect(template.html).toContain('color: #dc2626'); // Red color for urgent notifications
      expect(template.html).toContain('background-color: #fef2f2'); // Light red background
    });

    it('should include proper Chinese typography', () => {
      const template = createNotificationEmailTemplate(notificationData);

      expect(template.html).toContain('lang="zh-CN"');
      expect(template.html).toContain('charset="UTF-8"');
      expect(template.html).toContain('font-family: -apple-system');
    });
  });

  describe('Template Content Validation', () => {
    it('should handle special Chinese characters', () => {
      const specialData: TestEmailTemplateData = {
        userName: '王小明',
        petName: '旺财',
        eventType: '体检・洗澡',
        eventDate: '２０２４年１月１５日'
      };

      const template = createTestEmailTemplate(specialData);

      expect(template.html).toContain('王小明');
      expect(template.html).toContain('旺财');
      expect(template.html).toContain('体检・洗澡');
      expect(template.html).toContain('２０２４年１月１５日');
    });

    it('should prevent XSS attacks in template data', () => {
      const maliciousData: TestEmailTemplateData = {
        userName: '<script>alert("xss")</script>',
        petName: '<img src="x" onerror="alert(1)">',
        eventType: '"><script>evil()</script>',
        eventDate: 'javascript:alert(1)'
      };

      const template = createTestEmailTemplate(maliciousData);

      // The template should contain escaped HTML, not execute scripts
      expect(template.html).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
      expect(template.html).toContain('&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;');
      expect(template.html).not.toContain('<script>alert("xss")</script>');
      expect(template.html).not.toContain('<img src="x" onerror="alert(1)">');
    });

    it('should maintain proper email structure', () => {
      const testData: TestEmailTemplateData = {
        userName: 'Test',
        petName: 'Pet',
        eventType: 'Event',
        eventDate: 'Date'
      };

      const template = createTestEmailTemplate(testData);

      expect(template.html).toContain('<!DOCTYPE html>');
      expect(template.html).toContain('<html lang="zh-CN">');
      expect(template.html).toContain('<head>');
      expect(template.html).toContain('<body>');
      expect(template.html).toContain('</html>');
    });
  });
});