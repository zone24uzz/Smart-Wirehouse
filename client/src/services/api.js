import axios from 'axios';
export const api=axios.create({baseURL:import.meta.env.VITE_API_URL||'http://localhost:5000/api',timeout:12000});
api.interceptors.request.use(c=>{const t=localStorage.getItem('swc-token');if(t)c.headers.Authorization=`Bearer ${t}`;return c;});
api.interceptors.response.use(r=>r,err=>{if(err.response?.status===401){localStorage.removeItem('swc-token');localStorage.removeItem('swc-user');if(location.pathname!=='/login')location.assign('/login');}return Promise.reject(new Error(err.response?.data?.message||err.message||'Server bilan bogʻlanib boʻlmadi'));});
export const getData=async(url,config)=> (await api.get(url,config)).data.data;
