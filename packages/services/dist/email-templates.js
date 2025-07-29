function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
export function createTestEmailTemplate(data) {
    return {
        subject: `🐾 宠物护理提醒 - ${data.petName}的${data.eventType}`,
        html: `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>宠物护理提醒</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background-color: white;
            border-radius: 12px;
            padding: 32px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 32px;
          }
          .emoji {
            font-size: 48px;
            margin-bottom: 16px;
          }
          .title {
            color: #2563eb;
            font-size: 24px;
            font-weight: bold;
            margin: 0;
          }
          .content {
            margin-bottom: 24px;
          }
          .greeting {
            font-size: 18px;
            margin-bottom: 16px;
          }
          .event-details {
            background-color: #f1f5f9;
            border-left: 4px solid #2563eb;
            padding: 16px;
            margin: 16px 0;
            border-radius: 4px;
          }
          .event-title {
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 8px;
          }
          .footer {
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="emoji">🐾</div>
            <h1 class="title">宠物护理AI助手</h1>
          </div>
          
          <div class="content">
            <div class="greeting">
              您好，${escapeHtml(data.userName)}！
            </div>
            
            <p>这是一封来自宠物护理AI助手的测试邮件，用于验证我们的邮件发送功能是否正常工作。</p>
            
            <div class="event-details">
              <div class="event-title">📅 护理提醒详情</div>
              <p><strong>宠物名称：</strong>${escapeHtml(data.petName)}</p>
              <p><strong>护理类型：</strong>${escapeHtml(data.eventType)}</p>
              <p><strong>预定时间：</strong>${escapeHtml(data.eventDate)}</p>
            </div>
            
            <p>我们的系统能够：</p>
            <ul>
              <li>✅ 正确发送包含中文字符的邮件</li>
              <li>✅ 处理UTF-8编码的内容</li>
              <li>✅ 支持HTML格式的邮件模板</li>
              <li>✅ 集成Resend API进行邮件发送</li>
            </ul>
            
            <p>如果您收到此邮件，说明我们的邮件服务已经成功配置完成！🎉</p>
          </div>
          
          <div class="footer">
            <p>此邮件由宠物护理AI助手自动发送</p>
            <p>© 2024 PetCare AI. 保留所有权利。</p>
          </div>
        </div>
      </body>
      </html>
    `,
        text: `
宠物护理提醒 - ${data.petName}的${data.eventType}

您好，${data.userName}！

这是一封来自宠物护理AI助手的测试邮件，用于验证我们的邮件发送功能是否正常工作。

护理提醒详情：
- 宠物名称：${data.petName}
- 护理类型：${data.eventType}
- 预定时间：${data.eventDate}

我们的系统能够：
✅ 正确发送包含中文字符的邮件
✅ 处理UTF-8编码的内容
✅ 支持HTML格式的邮件模板
✅ 集成Resend API进行邮件发送

如果您收到此邮件，说明我们的邮件服务已经成功配置完成！🎉

此邮件由宠物护理AI助手自动发送
© 2024 PetCare AI. 保留所有权利。
    `
    };
}
export function createAINotificationEmailTemplate(data) {
    return {
        subject: data.subject,
        html: `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${escapeHtml(data.subject)}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background-color: white;
            border-radius: 12px;
            padding: 32px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 32px;
          }
          .emoji {
            font-size: 48px;
            margin-bottom: 16px;
          }
          .title {
            color: #2563eb;
            font-size: 24px;
            font-weight: bold;
            margin: 0;
          }
          .pet-info {
            background-color: #f0f9ff;
            border-left: 4px solid #0ea5e9;
            padding: 16px;
            margin: 16px 0;
            border-radius: 4px;
          }
          .reminder-section {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 16px;
            margin: 16px 0;
            border-radius: 4px;
          }
          .tip-section {
            background-color: #f0fdf4;
            border-left: 4px solid #22c55e;
            padding: 16px;
            margin: 16px 0;
            border-radius: 4px;
          }
          .section-title {
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 8px;
            font-size: 16px;
          }
          .footer {
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
          }
          .disclaimer {
            background-color: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 6px;
            padding: 12px;
            margin: 16px 0;
            font-size: 14px;
            color: #7f1d1d;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="emoji">🐾</div>
            <h1 class="title">宠物护理AI助手</h1>
          </div>
          
          <div class="pet-info">
            <div class="section-title">🐕 宠物信息</div>
            <p><strong>名称：</strong>${escapeHtml(data.petName)}</p>
            ${data.petBreed ? `<p><strong>品种：</strong>${escapeHtml(data.petBreed)}</p>` : ''}
            <p><strong>事件：</strong>${escapeHtml(data.eventTitle)}</p>
            <p><strong>日期：</strong>${escapeHtml(data.eventDate)}</p>
          </div>
          
          <div class="reminder-section">
            <div class="section-title">📅 友好提醒</div>
            <p>${escapeHtml(data.friendlyReminder)}</p>
          </div>
          
          <div class="tip-section">
            <div class="section-title">💡 护理建议</div>
            <p>${escapeHtml(data.careTip)}</p>
          </div>
          
          <div class="disclaimer">
            <strong>⚠️ 重要提醒：</strong>此邮件内容由AI助手生成，仅供参考。如果您的宠物出现任何健康问题或异常症状，请及时咨询专业兽医。
          </div>
          
          <div class="footer">
            <p>此邮件由宠物护理AI助手自动发送</p>
            <p>© 2024 PetCare AI. 保留所有权利。</p>
          </div>
        </div>
      </body>
      </html>
    `,
        text: `
${data.subject}

🐾 宠物护理AI助手

宠物信息：
- 名称：${data.petName}
${data.petBreed ? `- 品种：${data.petBreed}` : ''}
- 事件：${data.eventTitle}
- 日期：${data.eventDate}

📅 友好提醒：
${data.friendlyReminder}

💡 护理建议：
${data.careTip}

⚠️ 重要提醒：此邮件内容由AI助手生成，仅供参考。如果您的宠物出现任何健康问题或异常症状，请及时咨询专业兽医。

此邮件由宠物护理AI助手自动发送
© 2024 PetCare AI. 保留所有权利。
    `
    };
}
export function createNotificationEmailTemplate(data) {
    return {
        subject: `🔔 ${data.notificationTitle} - ${data.petName}`,
        html: `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${data.notificationTitle}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background-color: white;
            border-radius: 12px;
            padding: 32px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 32px;
          }
          .emoji {
            font-size: 48px;
            margin-bottom: 16px;
          }
          .title {
            color: #dc2626;
            font-size: 24px;
            font-weight: bold;
            margin: 0;
          }
          .message {
            background-color: #fef2f2;
            border-left: 4px solid #dc2626;
            padding: 16px;
            margin: 16px 0;
            border-radius: 4px;
          }
          .action-button {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 16px 0;
          }
          .footer {
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="emoji">🔔</div>
            <h1 class="title">${escapeHtml(data.notificationTitle)}</h1>
          </div>
          
          <p>您好，${escapeHtml(data.userName)}！</p>
          
          <div class="message">
            ${escapeHtml(data.notificationMessage)}
          </div>
          
          ${data.actionUrl ? `<a href="${escapeHtml(data.actionUrl)}" class="action-button">查看详情</a>` : ''}
          
          <div class="footer">
            <p>此邮件由宠物护理AI助手自动发送</p>
            <p>© 2024 PetCare AI. 保留所有权利。</p>
          </div>
        </div>
      </body>
      </html>
    `,
        text: `
${data.notificationTitle} - ${data.petName}

您好，${data.userName}！

${data.notificationMessage}

${data.actionUrl ? `查看详情：${data.actionUrl}` : ''}

此邮件由宠物护理AI助手自动发送
© 2024 PetCare AI. 保留所有权利。
    `
    };
}
