export class AppError extends Error { constructor(message, status = 400) { super(message); this.status = status; } }
export const notFound = (res, message = 'Maʼlumot topilmadi') => res.status(404).json({ success: false, message, data: null, meta: {} });
