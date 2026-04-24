/**
 * ملف إعدادات بوت تلجرام
 * يرجى تحديث البيانات التالية بقيمك الخاصة
 */

const TELEGRAM_CONFIG = {
  // استبدل هذا بـ Token الخاص ببوتك على تلجرام
  // احصل عليه من BotFather: https://t.me/botfather
  BOT_TOKEN: "8642789421:AAH5WVNFF0yxI-OIRjtsMPuBw3cSawVF1pk",
  
  // استبدل هذا بـ Chat ID الخاص بك
  // يمكنك الحصول عليه من @userinfobot على تلجرام
  CHAT_ID: "8642789421",
  
  // رابط API تلجرام (لا تغيره عادة)
  API_URL: "https://api.telegram.org/bot"
};

/**
 * دالة للتحقق من صحة الإعدادات
 */
function validateTelegramConfig() {
  if (TELEGRAM_CONFIG.BOT_TOKEN === "8642789421:AAH5WVNFF0yxI-OIRjtsMPuBw3cSawVF1pk" || 
      TELEGRAM_CONFIG.CHAT_ID === "8642789421") {
    console.warn("⚠️ تحذير: يرجى تحديث إعدادات تلجرام في ملف config.js");
    return false;
  }
  return true;
}

/**
 * دالة عامة لإرسال الرسائل إلى تلجرام
 * @param {string} message - محتوى الرسالة
 * @param {string} parseMode - نمط التنسيق (HTML أو Markdown)
 * @returns {Promise} وعد بنتيجة الإرسال
 */
function sendToTelegram(message, parseMode = 'HTML') {
  if (!validateTelegramConfig()) {
    return Promise.reject(new Error("إعدادات تلجرام غير صحيحة"));
  }

  const url = `${TELEGRAM_CONFIG.API_URL}${TELEGRAM_CONFIG.BOT_TOKEN}/sendMessage`;
  
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: TELEGRAM_CONFIG.CHAT_ID,
      text: message,
      parse_mode: parseMode
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    if (!data.ok) {
      throw new Error(`Telegram error: ${data.description}`);
    }
    return data;
  });
}
