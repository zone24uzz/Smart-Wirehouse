import React from 'react';import{createRoot}from'react-dom/client';import{BrowserRouter}from'react-router-dom';import i18n from 'i18next';import{initReactI18next}from'react-i18next';import uz from './locales/uz';import ru from './locales/ru';import App from './App';import './index.css';
i18n.use(initReactI18next).init({resources:{uz:{translation:uz},ru:{translation:ru}},lng:localStorage.getItem('swc-lang')||'uz',fallbackLng:'uz',interpolation:{escapeValue:false}});
window.Telegram?.WebApp?.ready();window.Telegram?.WebApp?.expand();
createRoot(document.getElementById('root')).render(<React.StrictMode><BrowserRouter><App/></BrowserRouter></React.StrictMode>);
