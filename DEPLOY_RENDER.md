# النشر على Render (نسخة مجانية)

## 1) ارفع المشروع إلى GitHub

- أنشئ مستودع GitHub جديد
- ارفع كل محتويات المشروع فيه

## 2) اذهب إلى Render

- سجل الدخول إلى https://render.com
- اختر: New -> Web Service
- اربط مستودع GitHub
- اختر المشروع

## 3) إعدادات النشر

### Build Command
```bash
npm install && npm run build
```

### Start Command
```bash
npm run start
```

### Environment Variables
```bash
NODE_ENV=production
PORT=10000
```

## 4) بعد النشر

سيرجع لك Render رابطًا مثل:

```text
https://returning-balloon-tts.onrender.com
```

اختبر الرابط:

```text
https://returning-balloon-tts.onrender.com/api/health
```

إذا ظهر JSON يحتوي على `status: ok` فالأمر صحيح.

## 5) ربط اللعبة بالـ TTS

في اللعبة، استخدم الرابط التالي داخل المتصفح قبل التشغيل:

```html
<script>
  window.GAME_CONFIG = {
    ttsBaseUrl: 'https://returning-balloon-tts.onrender.com'
  };
</script>
```

أو في بيئة Vite:

```bash
VITE_TTS_BASE_URL=https://returning-balloon-tts.onrender.com
```

## 6) ملاحظات مهمة

- Render Free قد ينام الخادم بعد فترة عدم استخدام
- أول تشغيل قد يستغرق بعض الوقت
- إذا أردت استقرار أفضل، استخدم خطة مدفوعة لاحقًا

## 7) هل هذه النسخة مجانية؟

نعم، في Render هناك نسخة مجانية مناسبة للتجربة والتشغيل الشخصي.

---

إذا أردت، أستطيع أيضًا تجهيز نسخة خاصة لـ Railway أو VPS، أو إنشاء ملف `env.example` جاهز للاستخدام.
