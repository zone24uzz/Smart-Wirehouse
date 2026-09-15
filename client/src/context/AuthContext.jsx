import {createContext,useContext,useEffect,useMemo,useState} from 'react';
import {api} from '../services/api';
const C=createContext(null);export const useAuth=()=>useContext(C);
export function AuthProvider({children}){const [user,setUser]=useState(()=>{try{return JSON.parse(localStorage.getItem('swc-user'));}catch{return null;}}),[checking,setChecking]=useState(Boolean(localStorage.getItem('swc-token')));
 useEffect(()=>{if(!checking)return;api.get('/auth/me').then(r=>{setUser(r.data.data);localStorage.setItem('swc-user',JSON.stringify(r.data.data));}).catch(()=>{setUser(null);localStorage.removeItem('swc-token');localStorage.removeItem('swc-user');}).finally(()=>setChecking(false));},[]);
 const login=async(username,password)=>{const r=await api.post('/auth/login',{username,password});localStorage.setItem('swc-token',r.data.data.token);localStorage.setItem('swc-user',JSON.stringify(r.data.data.user));setUser(r.data.data.user);return r.data.data.user;};
 const logout=async()=>{try{await api.post('/auth/logout');}catch{}localStorage.removeItem('swc-token');localStorage.removeItem('swc-user');setUser(null);};
 const value=useMemo(()=>({user,checking,login,logout,setUser}),[user,checking]);return <C.Provider value={value}>{children}</C.Provider>;}
