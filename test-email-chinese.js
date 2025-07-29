// Test script to validate Chinese email sending functionality
// Run with: node test-email-chinese.js

const testEmail = async () => {
  const testEmailAddress = 'devinrcai@gmail.com'; // Replace with your test email
  
  console.log('🧪 Testing Chinese Email Functionality');
  console.log('=====================================');
  console.log(`📧 Target email: ${testEmailAddress}`);
  console.log('🇨🇳 Testing Chinese character encoding...');
  
  try {
    // Start the dev server first
    console.log('⚠️  Make sure the dev server is running with: pnpm dev');
    console.log('📬 Sending test email with Chinese content...');
    
    const response = await fetch('http://localhost:3001/api/email/test-simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        testEmail: testEmailAddress
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Test email sent successfully!');
      console.log(`📨 Message ID: ${result.messageId}`);
      console.log(`📑 Subject: ${result.testData.subject}`);
      console.log(`📅 Timestamp: ${result.testData.timestamp}`);
      console.log(`🌍 Content Type: ${result.testData.contentType}`);
      console.log('\n🎉 Chinese character handling verification complete!');
      console.log('📬 Please check your email inbox to verify:');
      console.log('   ✅ Chinese characters display correctly');
      console.log('   ✅ UTF-8 encoding is preserved');
      console.log('   ✅ HTML formatting renders properly');
    } else {
      console.error('❌ Test failed:', result.error);
      console.error('📝 Message:', result.message);
    }
    
  } catch (error) {
    console.error('💥 Error testing email:', error.message);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('   1. Make sure dev server is running: pnpm dev');
    console.log('   2. Check RESEND_API_KEY in .env file');
    console.log('   3. Verify you are authenticated (login to the app first)');
  }
};

// Test data preview
console.log('\n📋 Test Email Content Preview:');
console.log('================================');
console.log('Subject: 🐾 宠物护理提醒 - 小白的疫苗接种');
console.log('Content: Chinese pet care reminder with:');
console.log('  • 中文字符 (Chinese characters)');
console.log('  • 表情符号 (Emoji support)');
console.log('  • HTML格式 (HTML formatting)');
console.log('  • UTF-8编码 (UTF-8 encoding)');
console.log('\n🚀 Starting test...\n');

testEmail();