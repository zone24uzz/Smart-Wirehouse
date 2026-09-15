import TelegramBot from 'node-telegram-bot-api';
import { config } from '../config/env.js';
import { readDb,mutateDb } from '../repositories/jsonRepository.js';
import { answerFor } from '../ai/agent.js';
import { getOrder,changeStatus,checkOrder } from '../services/workflow.js';
import { audit } from '../services/audit.js';
let bot=null;
export async function telegramNotify(db,roles,text){if(!bot)return;for(const user of db.users.filter(u=>roles.includes(u.role)&&u.telegramId)){try{await bot.sendMessage(user.telegramId,text,{parse_mode:'HTML'});}catch(e){console.error('Telegram yuborish xatosi:',e.message);}}}
const safe=(s='')=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const roleLabel={admin:'Administrator',coordinator:'Koordinator',warehouse:'Ombor xodimi',supply:'Taʼminot xodimi',logistics:'Logist'};
export function buildCommandGuide(user){const lines=[
  '<b>Buyruqlar va vazifalari</b>',
  '/start — botni ochish va akkaunt ulanganini tekshirish.',
  '/help — shu qo‘llanmani ko‘rsatish.',
  '/login KOD — web profildan olingan kod bilan akkauntni ulash.',
  '/profile — ulangan akkaunt va rolingizni ko‘rish.',
  '/status — faol zayavkalar holatini ko‘rish.',
  '/orders — ruxsatingiz doirasidagi zayavkalar ro‘yxati.',
  '/order Z-2026-0001 — bitta zayavkaning tafsilotlarini ko‘rish.',
  '/shortages — ochiq mahsulot yetishmovchiliklarini ko‘rish (admin, ombor, taʼminot).',
  '/stock — minimal qoldiqdan past mahsulotlarni ko‘rish (koordinatorga yopiq).',
  '/shipments — jo‘natmalar holatini ko‘rish.',
  '/report — qisqa ombor yoki shaxsiy zayavkalar hisoboti.',
  '/ai savol yoki oddiy matn — bazadagi maʼlumotlar bo‘yicha AI’dan so‘rash.',
  '/settings — bot sozlamalari haqida (faqat admin).',
  '/logout — Telegram akkaunt bog‘lanishini uzish.',
];if(!user)lines.push('', 'Avval web profilidan kod oling va /login KOD yuboring.');else lines.push('', 'Maʼlumotlar rolingizga qarab cheklanadi.');return lines.join('\n');}
export function buildStartMessage(user){if(!user)return '📦 <b>Smart Warehouse Control</b>\nBotga xush kelibsiz.\n\nAkkaunt ulanmagan. Web ilovadagi Profil → Telegram ulash bo‘limidan kod olib, <code>/login 123456</code> yuboring.\n\n'+buildCommandGuide(null);return `📦 <b>Smart Warehouse Control</b>\nXush kelibsiz, <b>${safe(user.name)}</b>!\n✅ Akkauntingiz ulangan · ${roleLabel[user.role]||'Foydalanuvchi'}\n\n${buildCommandGuide(user)}`; }
const beginTyping=chatId=>{let stopped=false;const send=()=>{if(!stopped)bot.sendChatAction(chatId,'typing').catch(()=>{});};send();const timer=setInterval(send,4000);timer.unref?.();return()=>{stopped=true;clearInterval(timer);};};
export function sanitizeTelegramPrompt(value=''){return String(value).replace(/\b(sk-[A-Za-z0-9_-]{12,}|Bearer\s+[A-Za-z0-9._-]{16,})\b/gi,'[REDACTED]').replace(/(password|parol|api[_ -]?key|token)\s*[:=]\s*\S+/gi,'$1=[REDACTED]').slice(0,1000).trim();}
export function formatTelegramAiAnswer(answer){const lines=[`<b>${safe(answer.summary||'Tahlil tayyor.')}</b>`];if(answer.metrics?.length)lines.push('', '<b>Ko‘rsatkichlar</b>',...answer.metrics.slice(0,6).map(x=>`• ${safe(x.label)}: ${safe(x.value)}`));if(answer.problems?.length)lines.push('', '<b>Eʼtibor kerak</b>',...answer.problems.slice(0,6).map(x=>`• ${safe(x)}`));if(answer.recommendation)lines.push('', `<b>Tavsiya:</b> ${safe(answer.recommendation)}`);if(answer.analysis)lines.push('', safe(answer.analysis));if(answer.asOf)lines.push('', `<i>Maʼlumot vaqti: ${safe(new Date(answer.asOf).toLocaleString('uz-UZ'))}</i>`);return lines.join('\n').slice(0,3900);}
const webAppUrl=()=>{try{const url=new URL(config.telegramWebAppUrl);return url.protocol==='https:'?url.toString():'';}catch{return '';}};
const botCommands=[
 {command:'start',description:'Botni ishga tushirish'},
 {command:'help',description:'Buyruqlar ro‘yxati va yordam'},
 {command:'login',description:'Web profil orqali akkauntni ulash'},
 {command:'profile',description:'Ulangan profilni ko‘rish'},
 {command:'status',description:'Faol zayavkalar holatini ko‘rish'},
 {command:'orders',description:'Zayavkalar ro‘yxatini ko‘rish'},
 {command:'order',description:'Zayavkani raqami bo‘yicha ko‘rish'},
 {command:'shortages',description:'Mahsulot yetishmovchiliklarini ko‘rish'},
 {command:'stock',description:'Ombordagi kam qolgan mahsulotlar'},
 {command:'shipments',description:'Jo‘natmalar holatini ko‘rish'},
 {command:'report',description:'Ombor bo‘yicha qisqa hisobot'},
 {command:'ai',description:'AI yordamchiga savol berish; oddiy matn ham mumkin'},
 {command:'settings',description:'Bot sozlamalari haqida'},
 {command:'logout',description:'Telegram akkauntni uzish'},
];
export function startTelegram(){if(!config.telegramToken){console.info('Telegram bot: token kiritilmagan, bot o‘chiq.');return null;}
 const polling=config.telegramMode==='polling';bot=new TelegramBot(config.telegramToken,polling?{polling:{autoStart:true,params:{allowed_updates:['message','callback_query']}}}:{polling:false});bot.setMyCommands(botCommands).catch(()=>console.error('Telegram command menu setup failed'));const appUrl=webAppUrl();if(appUrl)bot.setChatMenuButton({menu_button:{type:'web_app',text:'Web ilova',web_app:{url:appUrl}}}).catch(()=>console.error('Telegram Web App menu setup failed'));else if(config.telegramWebAppUrl)console.warn('TELEGRAM_WEB_APP_URL HTTPS manzil bo‘lishi kerak.');if(polling)bot.on('polling_error',e=>console.error('Telegram polling:',e.message));
 if(!polling){if(!config.telegramWebhookUrl||!config.telegramWebhookSecret){console.warn('Webhook uchun TELEGRAM_WEBHOOK_URL va TELEGRAM_WEBHOOK_SECRET kerak.');return null;}bot.setWebHook(`${config.telegramWebhookUrl.replace(/\/$/,'')}/api/telegram/webhook`,{secret_token:config.telegramWebhookSecret}).catch(e=>console.error('Telegram webhook:',e.message));}
 const linked=async msg=>{const db=await readDb(),u=db.users.find(x=>String(x.telegramId)===String(msg.from.id));if(!u&&!config.telegramAdmins.includes(String(msg.from.id)))await bot.sendMessage(msg.chat.id,'Akkaunt bog‘lanmagan. Web profilidan Telegram ulash kodini oling va /login 123456 yuboring.');return u;};
 bot.onText(/\/start(?:@\w+)?(?:\s+.*)?/,async msg=>{if(msg.chat.type!=='private')return bot.sendMessage(msg.chat.id,'Botni shaxsiy chatda oching.');try{const db=await readDb(),user=db.users.find(x=>String(x.telegramId)===String(msg.from.id));const replyMarkup=webAppUrl()?{inline_keyboard:[[{text:'🌐 Web ilovani ochish',web_app:{url:webAppUrl()}}]]}:undefined;return bot.sendMessage(msg.chat.id,buildStartMessage(user),{parse_mode:'HTML',...(replyMarkup?{reply_markup:replyMarkup}:{})});}catch(e){console.error('Telegram /start:',e.message);return bot.sendMessage(msg.chat.id,'Bot vaqtincha maʼlumotni o‘qiy olmadi. Birozdan so‘ng qayta urinib ko‘ring.');}});
 bot.onText(/\/help/,async msg=>{try{const db=await readDb(),user=db.users.find(x=>String(x.telegramId)===String(msg.from.id));return bot.sendMessage(msg.chat.id,buildCommandGuide(user),{parse_mode:'HTML'});}catch(e){console.error('Telegram /help:',e.message);return bot.sendMessage(msg.chat.id,'Yordamni hozir ko‘rsatib bo‘lmadi.');}});
 bot.onText(/\/login(?:\s+(\d{6}))?/,async(msg,match)=>{if(!match[1])return bot.sendMessage(msg.chat.id,'Web ilovadagi Profil → Telegram ulash tugmasidan olingan 6 raqamli kodni yuboring.');try{await mutateDb(db=>{const setting=db.settings.find(s=>s.key==='telegramLoginCodes'),entry=setting?.value?.find(x=>x.code===match[1]&&x.expiresAt>Date.now());if(!entry)throw new Error('Kod noto‘g‘ri yoki muddati tugagan');const u=db.users.find(x=>x.id===entry.userId);u.telegramId=String(msg.from.id);audit(db,{user:u,ip:'telegram',source:'telegram',get:()=> 'Telegram Bot'},'telegram.linked','user',u.id,null,{telegramId:'linked'});setting.value=setting.value.filter(x=>x!==entry);});bot.sendMessage(msg.chat.id,'Akkaunt muvaffaqiyatli bog‘landi.');}catch(e){bot.sendMessage(msg.chat.id,e.message);}});
 bot.onText(/\/logout/,async msg=>{await mutateDb(db=>{const u=db.users.find(x=>String(x.telegramId)===String(msg.from.id));if(u){u.telegramId=null;audit(db,{user:u,ip:'telegram',source:'telegram',get:()=> 'Telegram Bot'},'telegram.unlinked','user',u.id,{telegramId:'linked'},null);}});bot.sendMessage(msg.chat.id,'Telegram akkaunt uzildi.');});
 bot.onText(/\/(profile|status|orders|order|shortages|stock|shipments|report|ai|settings)(?:\s+([\s\S]+))?/,async(msg,match)=>{const [_,cmd,arg]=match;const stopTyping=beginTyping(msg.chat.id);try{const user=await linked(msg);if(!user)return;if(cmd==='logout'||cmd==='login')return;const db=await readDb();let text='';
   if(cmd==='profile')text=`${safe(user.name)} · ${safe(user.role)}`;
   if(cmd==='orders'||cmd==='status'){let os=user.role==='coordinator'?db.orders.filter(o=>o.coordinatorId===user.id):db.orders;text=os.filter(o=>!['delivered','cancelled'].includes(o.status)).slice(0,12).map(o=>`• ${o.orderNumber} — ${o.status}`).join('\n')||'Faol zayavka yo‘q';}
   let replyMarkup;if(cmd==='order'){const o=db.orders.find(x=>x.orderNumber===arg||x.id===arg);if(!o||(user.role==='coordinator'&&o.coordinatorId!==user.id))return bot.sendMessage(msg.chat.id,'Zayavka topilmadi yoki ruxsat yo‘q.');text=`<b>${o.orderNumber}</b> · ${o.status}\nMuddat: ${o.requiredDate}\n${safe(o.comment)}`;if(user.role==='warehouse'&&o.status==='new')replyMarkup={inline_keyboard:[[{text:'Tekshirishni boshlash',callback_data:`ask:check:${o.id}`}]]};}
   if(cmd==='shortages'){if(!['admin','warehouse','supply'].includes(user.role))return bot.sendMessage(msg.chat.id,'Bu buyruq uchun ruxsat yo‘q.');text=db.shortages.filter(s=>s.status==='open').map(s=>`• ${db.products.find(p=>p.id===s.productId)?.name}: ${s.shortageQuantity}`).join('\n')||'Ochiq yetishmovchilik yo‘q';}
   if(cmd==='stock'){if(user.role==='coordinator')return bot.sendMessage(msg.chat.id,'Ombor qoldig‘i sizga ko‘rsatilmaydi.');text=db.products.filter(p=>p.quantity-p.reservedQuantity<=p.minimumQuantity).slice(0,10).map(p=>`• ${p.name}: ${p.quantity-p.reservedQuantity} ${p.unit}`).join('\n')||'Minimal chegaradan past mahsulot yo‘q';}
   if(cmd==='shipments'){if(!['admin','warehouse','logistics','coordinator'].includes(user.role))return bot.sendMessage(msg.chat.id,'Ruxsat yo‘q.');text=db.shipments.slice(-10).map(s=>`• ${s.shipmentNumber} — ${s.status}`).join('\n')||'Jo‘natma yo‘q';}
   if(cmd==='report'){const own=user.role==='coordinator'?db.orders.filter(o=>o.coordinatorId===user.id):db.orders;text=`📊 <b>Ombor hisoboti</b>\nZayavkalar: ${own.length}\nFaol: ${own.filter(o=>!['delivered','cancelled'].includes(o.status)).length}\nPast qoldiq: ${user.role==='coordinator'?'cheklangan':db.products.filter(p=>p.quantity-p.reservedQuantity<=p.minimumQuantity).length}`;}
   if(cmd==='ai'){const a=await answerFor(user,arg||'Bugungi ombor holatini ko‘rsat');text=`<b>${safe(a.summary)}</b>\n${safe(a.recommendation)}`;}
   if(cmd==='settings'){if(user.role!=='admin')return bot.sendMessage(msg.chat.id,'Faqat admin uchun.');text='Bot sozlamalari web ilovasining Tizim sozlamalari bo‘limida boshqariladi.';}
    await bot.sendMessage(msg.chat.id,text||'Amal bajarildi',{parse_mode:'HTML',reply_markup:replyMarkup});
  }catch(e){const detail=String(e?.message||'').replace(/\b\d{8,12}:[A-Za-z0-9_-]{30,}\b/g,'[REDACTED]');console.error('Telegram command failed:',cmd,e.name||'Error',detail);await bot.sendMessage(msg.chat.id,'Buyruqni bajarishda vaqtinchalik xatolik. Iltimos, birozdan so‘ng qayta urinib ko‘ring.').catch(()=>{});}finally{stopTyping();}});
 bot.on('message',async msg=>{const raw=msg.text;if(msg.chat?.type!=='private'||typeof raw!=='string'||!raw.trim()||raw.trim().startsWith('/'))return;const prompt=sanitizeTelegramPrompt(raw);if(!prompt)return;const stopTyping=beginTyping(msg.chat.id);try{const user=await linked(msg);if(!user)return;const answer=await answerFor(user,prompt);await bot.sendMessage(msg.chat.id,formatTelegramAiAnswer(answer),{parse_mode:'HTML',disable_web_page_preview:true});}catch(e){const detail=String(e?.message||'').replace(/\b\d{8,12}:[A-Za-z0-9_-]{30,}\b/g,'[REDACTED]');console.error('Telegram free-text AI failed:',e.name||'Error',detail);await bot.sendMessage(msg.chat.id,'AI yordamchi hozir javob bera olmadi. Iltimos, birozdan so‘ng qayta urinib ko‘ring.').catch(()=>{});}finally{stopTyping();}});
 bot.on('callback_query',async q=>{try{const [action,kind,id]=String(q.data||'').split(':');const db=await readDb(),user=db.users.find(x=>String(x.telegramId)===String(q.from.id));if(!user)return bot.answerCallbackQuery(q.id,{text:'Akkaunt ulanmagan'});const order=db.orders.find(x=>x.id===id);if(!order)return bot.answerCallbackQuery(q.id,{text:'Zayavka topilmadi'});if(kind==='check'&&!['admin','warehouse'].includes(user.role))return bot.answerCallbackQuery(q.id,{text:'Ruxsat yo‘q'});
   if(action==='ask'){await bot.answerCallbackQuery(q.id);return bot.sendMessage(q.message.chat.id,`${order.orderNumber} zayavkasini tekshirishni boshlaysizmi?`,{reply_markup:{inline_keyboard:[[{text:'Tasdiqlash',callback_data:`run:${kind}:${id}`},{text:'Bekor qilish',callback_data:`cancel:${kind}:${id}`}]]}});}
   if(action==='cancel'){await bot.answerCallbackQuery(q.id,{text:'Amal bekor qilindi'});return bot.editMessageReplyMarkup({inline_keyboard:[]},{chat_id:q.message.chat.id,message_id:q.message.message_id});}
   if(action==='run'&&kind==='check'){const req={user,ip:'telegram',source:'telegram',get:()=> 'Telegram Bot'};await mutateDb(state=>{const o=getOrder(state,id);if(o.status==='new')changeStatus(state,req,o,'checking');checkOrder(state,req,o);});await bot.answerCallbackQuery(q.id,{text:'Tekshiruv boshlandi'});return bot.sendMessage(q.message.chat.id,`${order.orderNumber} tekshiruvga yuborildi.`);}
   await bot.answerCallbackQuery(q.id,{text:'Bu amal qo‘llanmagan'});
  }catch(e){console.error('Telegram callback:',e.message);try{await bot.answerCallbackQuery(q.id,{text:'Amal bajarilmadi'});}catch{}}});return bot;}
export function processTelegramUpdate(update){if(!bot)throw new Error('Telegram bot faollashtirilmagan');return bot.processUpdate(update);}
