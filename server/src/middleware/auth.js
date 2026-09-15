import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { readDb } from '../repositories/jsonRepository.js';
export const authenticate = async (req, res, next) => {
  try { const token = req.headers.authorization?.replace(/^Bearer\s+/i, ''); if (!token) return res.status(401).json({ success:false,message:'Tizimga kiring',data:null,meta:{} });
    const payload = jwt.verify(token, config.jwtSecret); const db = await readDb(); const user = db.users.find(u => u.id === payload.sub && u.active);
    if (!user) return res.status(401).json({ success:false,message:'Sessiya bekor qilingan',data:null,meta:{} }); req.user = user; next();
  } catch { res.status(401).json({ success:false,message:'Sessiya yaroqsiz yoki muddati tugagan',data:null,meta:{} }); }
};
export const allow = (...roles) => (req,res,next) => roles.includes(req.user?.role) ? next() : res.status(403).json({ success:false,message:'Bu amal uchun ruxsat yoʻq',data:null,meta:{} });
