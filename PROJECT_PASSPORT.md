# Smart Warehouse Control — loyiha pasporti

## 1. Umumiy ma’lumot

| Maydon | Qiymat |
|---|---|
| Loyiha nomi | Smart Warehouse Control |
| Qisqa nomi | SWC |
| Tizim turi | Ombor va logistika jarayonlarini boshqaruvchi web ilova (WMS MVP) |
| Asosiy til | O‘zbek lotin |
| Loyiha papkasi | `D:\smart-warehouse-control` |
| Holati | Ishlaydigan lokal MVP |
| Ma’lumotlar ombori | `server/data/db.json` |
| Web interfeys | `http://127.0.0.1:5173` |
| REST API | `http://localhost:5000/api` |
| Sog‘liq endpointi | `GET /api/health` |

## 2. Maqsad va yechiladigan muammo

SWC koordinator yuborgan mahsulot zayavkasini ombor tekshiruvidan boshlab, yetishmovchilikni ta’minotga yuborish, mahsulotni rezerv qilish va yig‘ish, hujjat tayyorlash, transport belgilash, yuklash hamda yetkazib berishgacha kuzatadi. Jarayonlar rolga ajratilgan va muhim o‘zgarishlar audit jurnaliga yoziladi.

## 3. Foydalanuvchilar va rollar

| Rol | Asosiy vazifalar |
|---|---|
| Admin | Foydalanuvchilar, sozlamalar, audit va tizim bo‘limlarini boshqarish |
| Koordinator | Obyekt uchun zayavka yaratish va o‘z zayavkalari holatini kuzatish |
| Ombor xodimi | Qoldiqni tekshirish, rezerv, yig‘ish, kirim/chiqim va yuklash |
| Snabjeniye xodimi | Yetishmovchilik va ta’minot so‘rovlarini yuritish, mahsulot qabulini tasdiqlash |
| Logist | Transport so‘roviga mashina/haydovchi biriktirish va yetkazib berishni kuzatish |

Ruxsatlar frontendda navigatsiyani moslashtiradi va backend endpointlarida JWT hamda rol tekshiruvi bilan nazorat qilinadi.

## 4. Asosiy funksional modullar

- Dashboard, ko‘rsatkichlar, grafiklar va ogohlantirishlar.
- Zayavkalar: ro‘yxat, yaratish, tafsilotlar, mahsulot qatorlari, status va timeline.
- Inventar: mahsulotlar, kategoriyalar, ombor qoldig‘i, kirim, chiqim, rezervlar va harakatlar.
- Yetishmovchiliklar va ta’minot so‘rovlari.
- Nakladnoylar va PDF yuklab olish.
- Transport so‘rovlari, mashinalar, haydovchilar va jo‘natmalar.
- Obyektlar va foydalanuvchilar.
- AI yordamchi, bildirishnomalar, audit jurnali, sozlamalar va profil.

## 5. Zayavka jarayoni

1. Koordinator zayavka va kerakli mahsulotlarni kiritadi.
2. Ombor mahsulot qoldig‘ini tekshiradi; yetarli miqdor rezerv qilinadi.
3. Yetishmagan miqdor shortage va ta’minot so‘roviga aylantiriladi.
4. Mahsulot kelgach qoldiq yangilanadi va zayavka qayta tekshiriladi.
5. Ombor mahsulotlarni yig‘adi, nakladnoy tayyorlanadi.
6. Logist sig‘imi mos transport va haydovchini biriktiradi.
7. Yuklash tasdiqlanganda fizik qoldiq va rezerv kamayadi, jo‘natma qayd etiladi.
8. Yetkazib berish tasdiqlangach zayavka yopiladi.

Statuslar: `new`, `checking`, `shortage`, `sent_to_supply`, `supply_in_progress`, `ready_for_picking`, `picking`, `documents_ready`, `waiting_transport`, `ready_for_loading`, `loading`, `shipped`, `delivered`, `cancelled`. O‘tishlar backend workflow qoidalari bilan tekshiriladi.

## 6. Texnik arxitektura

```text
React + Vite web ilova
        │ Axios / REST / JWT
        ▼
Express API ── RBAC, validation, workflow, audit, PDF, AI, Telegram
        │ Repository pattern + ketma-ket atomik yozuv
        ▼
      db.json
```

**Frontend:** React, Vite, React Router, Tailwind CSS, Axios, React Hook Form, Zod, Recharts, Lucide React, Sonner, date-fns va i18next tuzilmasi.

**Backend:** Node.js, Express, CORS, Helmet, dotenv, bcryptjs, JWT, express-rate-limit, Zod, PDFKit va node-telegram-bot-api.

**Saqlash:** JSON repository `fs/promises` orqali o‘qiydi; mutatsiyalar write queue va atomik vaqtinchalik fayl almashtirish bilan bajariladi. Seed va backup imkoniyatlari bor.

## 7. Ma’lumotlar

`db.json` ichidagi asosiy kolleksiyalar: users, products, categories, warehouses, objects, orders, orderItems, inventoryMovements, reservations, shortages, supplyRequests, suppliers, invoices, transportRequests, vehicles, drivers, shipments, notifications, aiConversations, auditLogs va settings.

Zaxira qoidasi: `availableQuantity = quantity - reservedQuantity`. Rezerv fizik qoldiqni o‘zgartirmaydi; yuklash fizik qoldiq va rezervni kamaytiradi. Harakatlar va muhim status o‘zgarishlari auditga yoziladi.

## 8. Integratsiyalar

**AI:** Gemini va OpenAI adapterlari backendda; provider sozlanmagan yoki so‘rov bajarilmagan holatda bazaga asoslangan mock tahlil ishlaydi. AI foydalanuvchi ruxsati doirasidagi faktlarni oladi va o‘zi database’ni o‘zgartirmaydi. Sozlamalar `server/.env` da: `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`.

**Telegram:** lokal polling rejimi; foydalanuvchilar Telegram ID va web profilidagi bir martalik kod orqali akkauntini bog‘laydi. Token faqat `server/.env` da bo‘lishi kerak. Buyruqlar: `/start`, `/help`, `/login`, `/profile`, `/status`, `/orders`, `/order`, `/shortages`, `/stock`, `/shipments`, `/report`, `/ai`, `/settings`, `/logout`.

## 9. Xavfsizlik

- Parollar bcrypt hash ko‘rinishida saqlanadi; kirish JWT bilan himoyalangan.
- API’da rol tekshiruvi, request validation, rate limit, Helmet va CORS bor.
- Maxfiy kalitlar `.env` da saqlanadi; `.env` Git’ga kiritilmasligi kerak.
- Demo parollar faqat lokal/sinov uchun; productionda akkauntlarni o‘zgartiring, `JWT_SECRET` ni kuchli tasodifiy qiymat bilan belgilang.
- Telegram/Gemini qiymatlarini README, issue yoki frontend kodiga qo‘ymang; oshkor bo‘lgan kalitlarni bekor qilib yangilang.

## 10. O‘rnatish va ishga tushirish

Talab: Node.js 20+ va npm. Server va web uchun alohida terminal ishlating.

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

Admin demo hisobi: `admin` / `Admin123!`. Qolgan demo hisoblar README’da berilgan. Lokal API: `http://localhost:5000/api`; health tekshiruvi: `http://localhost:5000/api/health`.

## 11. Sinov va joriy tekshiruv

```powershell
cd D:\smart-warehouse-control\server; npm test
cd D:\smart-warehouse-control\client; npm run build
```

Loyiha davomida backend testlari 8/8 o‘tgan. Login oqimida CORS tekshiruvi va admin API login tasdiqlangan; frontend production build muvaffaqiyatli. Lokal frontend va API ishga tushirilgan holatda tekshirilgan.

## 12. Joylashtirish

Frontendni Vercel’da `client/` papkasini root qilib joylash va `VITE_API_URL` ni backend manziliga sozlash mumkin. Backendni Render, Railway yoki VPS’da persistent disk bilan joylashtiring; `DATABASE_PATH` disk mount joyiga yo‘naltiriladi. Vercel serverless fayl tizimi `db.json` uchun doimiy saqlash bermaydi.

## 13. MVP chegaralari va keyingi bosqich

- Hozir mahsulot yozuvi SKU uchun bitta `warehouseId` saqlaydi; omborlararo `inventory/transfer` amali shu sabab hozircha bajarilmaydi.
- JSON baza bitta backend instance uchun mo‘ljallangan; bir nechta server orasida taqsimlangan lock yo‘q.
- Katta hajmli/yuqori parallellikdagi production uchun PostgreSQL yoki MongoDB migratsiyasi rejalashtirilishi kerak.
- Real-time websocket, elektron imzo va ko‘p ombor bo‘yicha alohida balanslar keyingi bosqichga qoldirilgan.

## 14. Aloqa va egasi

Loyiha egasi, kompaniya nomi va texnik aloqa shaxsi ushbu ishda berilmagan; rasmiy foydalanishga topshirishdan oldin tashkilot ma’lumotlari bilan to‘ldiriladi.
