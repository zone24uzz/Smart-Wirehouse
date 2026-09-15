# Smart Warehouse Control

Ombor zayavkalari, zaxira, ta'minot va yetkazib berish ish oqimlarini birlashtiruvchi lokal JSON-backed MVP. Barcha yozuvlar `server/data/db.json` faylida atomik navbat orqali saqlanadi.

## Texnologiyalar va tuzilma

- `client/`: React, Vite, React Router, Tailwind, Axios, React Hook Form, Zod, Recharts, Lucide, Sonner.
- `server/`: Express REST API, JWT/bcrypt, RBAC, audit, JSON repository, PDFKit, ixtiyoriy Telegram polling.
- `server/data/`: ishchi JSON baza. `server/backups/` ga qo'lda zaxira olinadi.

## Talablar va ishga tushirish

Node.js 20+ va npm kerak. Ikki terminal oching:

```powershell
cd D:\smart-warehouse-control\server
npm install
Copy-Item .env.example .env
npm run seed
npm run dev
```

```powershell
cd D:\smart-warehouse-control\client
npm install
Copy-Item .env.example .env
npm run dev
```

Frontend: http://localhost:5173 · API: http://localhost:5000/api · sog'liq: http://localhost:5000/api/health

### Demo loginlar

| Rol | Login | Parol |
|---|---|---|
| Admin | `admin` | `Admin123!` |
| Koordinator | `coordinator` | `Coordinator123!` |
| Ombor | `warehouse` | `Warehouse123!` |
| Snabjeniye | `supply` | `Supply123!` |
| Logist | `logistics` | `Logistics123!` |

Seed parollarni bcrypt bilan hash qiladi. Ishlab chiqarish muhitida demo akkauntlarni o'chiring va `JWT_SECRET` ni almashtiring.

## Muhit sozlamalari

`server/.env.example` ichidagi `JWT_SECRET` uchun uzun tasodifiy qiymat kiriting. `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_IDS`, `TELEGRAM_WEBHOOK_URL`, `AI_API_KEY`, `AI_PROVIDER`, `AI_MODEL` ixtiyoriy va maxfiy qiymatlar bo'sh qolgan. Kalitlarni frontendga hech qachon qo'ymang. `DATABASE_PATH` persistent diskka yo'naltirilishi mumkin.

AI sozlanmaganda mock agent db.json ma'lumotlarini rollar kesimida tahlil qiladi; u bazani o'zgartirmaydi. Gemini uchun `AI_PROVIDER=gemini`, `AI_API_KEY` va `AI_MODEL` ni `server/.env` ga kiriting. Backend Gemini `generateContent` REST API ga faqat foydalanuvchi roliga ruxsat berilgan qisqartirilgan faktlarni yuboradi. OpenAI uchun `AI_PROVIDER=openai` ishlaydi va Responses API chaqiruvida `store:false` yoqilgan. Parol, token va API kalitlari AI kontekstiga qo'shilmaydi. Provider yoki kalit noto'g'ri bo'lsa, tizim mock tahliliga qaytadi. Adapter `server/src/ai/provider.js` da.

Google AI Studio'dan Gemini API kalitini oling, uni faqat `server/.env` ichiga kiriting va rasmiy modellar sahifasida mavjud model ID sini belgilang (masalan, `AI_MODEL=gemini-3.8-flash`). Model ro'yxati o'zgarishi mumkin. Kalit frontend `.env` fayliga kiritilmaydi. [Gemini rasmiy API kalit qo'llanmasi](https://ai.google.dev/gemini-api/docs/generate-content/api-key), [matn generatsiyasi REST hujjati](https://ai.google.dev/gemini-api/docs/generate-content/text-generation) va [joriy model ro'yxati](https://ai.google.dev/gemini-api/docs/models) formatlarini ko'ring.

## Telegram

1. Telegramda BotFather orqali bot yarating, tokenni `server/.env` ga kiriting.
2. Bot bilan `/start` yuboring va Telegram ID ni aniqlang (`/login` bot hisobini tizim foydalanuvchisiga bog'lash uchun bir martalik kod beradi; webdagi profil sozlamasida kodni tasdiqlang).
3. Ruxsatlangan foydalanuvchi `/status`, `/orders`, `/stock`, `/report`, `/ai savol` buyruqlaridan foydalanishi yoki buyruqsiz oddiy matn yozib AI yordamchiga savol berishi mumkin. Telegram ID admin ruxsati `.env` orqali beriladi; qolgan foydalanuvchilar akkaunt bog'lanmaguncha ma'lumot olmaydi.
4. Localda `TELEGRAM_MODE=polling`; productionda `TELEGRAM_MODE=webhook`, HTTPS `TELEGRAM_WEBHOOK_URL` va maxfiy `TELEGRAM_WEBHOOK_SECRET` kiriting. Vercel frontend deploy qilingach, uning HTTPS manzilini `TELEGRAM_WEB_APP_URL` ga yozing. Bot restart qilinganda `/start` xabarida va Telegram chatining menu tugmasida Web App ochish havolasi paydo bo‘ladi. Web App ichida kirish uchun odatiy tizim login/paroli talab qilinadi. Token yo'q bo'lsa bot o'chirilgan holda API ishlayveradi.

## Asosiy API

`POST /api/auth/login`, `GET /api/auth/me`, `/api/dashboard/{summary,charts,alerts}`, CRUD `/api/{orders,products,users}`, order workflow `/api/orders/:id/{check-stock,reserve,pick,load,ship,deliver,cancel}`, `/api/inventory/{income,outcome,adjustment,movements}`, `/api/supply-requests`, `/api/transport-requests`, `/api/invoices/:id/pdf`, `/api/ai/{chat,daily-report,weekly-report,analyze-risks}`, `/api/notifications`, `/api/audit-logs`. Barcha API javoblari `success/message/data/meta` formatida. `server/README.md` va koddagi `routes` to'liq ro'yxatni beradi.

## Build, test va deploy

```powershell
cd D:\smart-warehouse-control\server; npm test
cd D:\smart-warehouse-control\client; npm run build
```

Frontendni GitHub'dagi repodan Vercelga import qiling va **Root Directory** ni `client` qilib tanlang. Build command `npm run build`, Output Directory `dist`; Environment Variables ichida `VITE_API_URL=https://<render-api-domain>/api` kiriting.

Backend uchun Render'da Blueprint sifatida repositoryni ulang. Root'tagi `render.yaml` Node web service'i `server/` root katalogidan build qiladi, `/api/health` health check o'rnatadi va doimiy diskni `/var/data` ga ulab `DATABASE_PATH=/var/data/db.json` ishlatadi. Birinchi ishga tushishda Render env sozlamalarida `CLIENT_URL` ni Vercel production HTTPS domeniga tenglang. Ixtiyoriy Telegram/Gemini uchun `TELEGRAM_BOT_TOKEN`, `TELEGRAM_MODE`, `TELEGRAM_WEBHOOK_URL`, `TELEGRAM_WEBHOOK_SECRET`, `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL` ni faqat Render Environment Variables'da kiriting; maxfiy kalitlarni Vercelga qo'ymang. Dastlabki demo bazani yaratish uchun Render Shell'da service root'dan `npm run seed` ni bir marta bajaring. Har deploy yoki restartda seed buyrug'ini build/start ichiga qo'shmang.

**Vercel serverless fayl tizimi `db.json` uchun doimiy saqlash bermaydi**; JSON bazani Vercel'da ishlatmang. Render persistent diskdagi fayllargina restart va deploylar orasida saqlanadi; disk ulash uchun qo'llab-quvvatlanadigan pullik web-service plan kerak bo'lishi mumkin. Bir nechta backend instance bir xil JSON bazani xavfsiz boshqarmaydi; production jamoaviy ishlatishda PostgreSQL tavsiya qilinadi.

### Backup va ma'lumot yaxlitligi

`POST /api/admin/backup` admin rolida timestamp bilan JSON snapshot yozadi. Repository har bir mutatsiyani ketma-ket bajarib vaqtinchalik faylga yozadi, so'ng rename qiladi. Bu JSON MVP yengil ichki jamoa uchun; ko'p backend instance o'rnatmang, chunki JSON fayl locking distributed emas.

## MVP chegarasi

Login, RBAC, JSON persistence, zayavka/rezerv/yetishmovchilik/yig'ish/yuklash oqimi, taʼminot statuslari, transport sig'imi va lifecycle, audit, dashboard, AI mock/OpenAI adapter, notification inbox, CSV export va invoice PDF amalda ishlaydi. Telegram xabarlari uchun bot tokeni va akkaunt bog'lanishi kerak. `inventory/transfer` endpointi 501 qaytaradi: mahsulot modeli hozir SKU uchun bitta warehouseId saqlaydi, qisman omborlararo balansni noto'g'ri simulyatsiya qilmaslik uchun transfer to'xtatilgan. Ko'p omborli real stock-balans, websocket va e-imzo keyingi integratsiya bosqichlaridir.
