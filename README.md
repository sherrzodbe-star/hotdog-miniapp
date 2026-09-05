# American Hot Dog & Burger — Telegram Mini App

Bu versiyada:
- bir nechta mahsulotni tanlash va miqdorini +/− bilan o‘zgartirish;
- savatni telefon brauzeri qayta ochilganda saqlash;
- Menu Button orqali ochilgan Mini App'dan buyurtmani backend orqali botga yuborish;
- buyurtmani ADMIN_CHAT_ID va GROUP_CHAT_ID ga yuborish;
- Telegram `initData` imzosini tekshirish mavjud.

## 1. Xavfsizlik
Eski tokenni ishlatmang. BotFather orqali yangi token oling va faqat Render Environment Variables ichiga qo‘ying. Tokenni GitHub Pages fayllariga yozmang.

## 2. GitHub Pages
`web/index.html`, `web/style.css`, `web/app.js` fayllarini GitHub repo root'iga joylashtiring.

`web/app.js` ichidagi:
`const API_URL = "https://YOUR-RENDER-SERVICE.onrender.com/api/order";`
ni Render'dagi haqiqiy URL bilan almashtiring.

## 3. Render
GitHub repo'dan Web Service yarating.
Build command:
`pip install -r requirements.txt`
Start command:
`python bot.py`

Environment Variables:
- `BOT_TOKEN` = BotFather'dan yangi token
- `ADMIN_CHAT_ID` = admin Telegram ID
- `GROUP_CHAT_ID` = buyurtma guruhi ID
- `MINI_APP_URL` = `https://sherrzodbe-star.github.io/hotdog-miniapp/`

Deploy tugagach:
`https://RENDER-SERVICE.onrender.com/health`
ni oching. `{"ok":true}` chiqishi kerak.

## 4. Frontendni ulang
GitHub'dagi `app.js` faylida API_URL ni Render URL'iga qo‘ying. Commit qiling. GitHub Pages avtomatik yangilanadi.

## 5. BotFather
Menu Button URL sifatida:
`https://sherrzodbe-star.github.io/hotdog-miniapp/`
qoladi.

## 6. Muhim
Telegram Menu Button Mini App uchun faqat `tg.sendData()` ga tayanish to‘g‘ri emas. Shu sababli buyurtma tugmasi backend `/api/order` endpointiga HTTPS orqali yuboradi.
