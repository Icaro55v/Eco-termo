import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { User, Lock, RefreshCw, Star, Linkedin, Headphones, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    const cleanEmail = email.trim(); 

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, cleanEmail, password);
      } else {
        await signInWithEmailAndPassword(auth, cleanEmail, password);
      }
      onLoginSuccess();
    } catch (err: any) {
      console.error("Auth Error:", err);
      let msg = "Erro ao autenticar. Tente novamente.";
      
      // Tratamento robusto de erros do Firebase
      const code = err.code;
      if (code === 'auth/invalid-email') msg = "O formato do e-mail é inválido.";
      else if (code === 'auth/email-already-in-use') {
          msg = "Este e-mail já está cadastrado. Tente fazer login.";
          setTimeout(() => setIsRegistering(false), 2000);
      }
      else if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
          msg = "E-mail ou senha incorretos. Verifique suas credenciais.";
      }
      else if (code === 'auth/user-not-found') {
          msg = "Usuário não encontrado. Crie uma conta primeiro.";
      }
      else if (code === 'auth/weak-password') {
          msg = "A senha deve ter pelo menos 6 caracteres.";
      }
      else if (code === 'auth/too-many-requests') {
          msg = "Muitas tentativas falhas. Tente novamente mais tarde.";
      }
      
      setErrorMsg(msg);
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="min-h-screen bg-[#002e12] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-black opacity-20"></div>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-10 animate-in zoom-in duration-500 relative z-10 flex flex-col items-center">
        <div className="w-20 h-20 bg-[#002e12] rounded-2xl flex items-center justify-center shadow-lg text-white mb-6 transform rotate-3">
           <Star className="fill-red-600 text-red-600" size={40} />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">EcoTermo Intelligence</h1>
        <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-8">
          {isRegistering ? 'Criar Nova Conta' : 'Acesso Corporativo Seguro'}
        </p>
        
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 ml-1">E-mail</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-slate-400" size={18} />
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#008200] outline-none transition-all" placeholder="usuario@empresa.com" required />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#008200] outline-none transition-all" placeholder="••••••••" required />
            </div>
          </div>
          
          {errorMsg && (
            <div className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-lg border border-red-100 flex items-start gap-2">
               <AlertCircle size={16} className="shrink-0 mt-0.5" /> 
               <span>{errorMsg}</span>
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-[#008200] hover:bg-[#006000] text-white p-4 rounded-lg font-bold text-sm transition-all shadow-lg shadow-emerald-900/20 mt-4 uppercase">
            {loading ? <RefreshCw className="animate-spin mx-auto" size={20}/> : (isRegistering ? 'CRIAR CONTA' : 'ENTRAR NO SISTEMA')}
          </button>
        </form>

        <div className="mt-6 w-full text-center">
          <button 
            onClick={() => { setIsRegistering(!isRegistering); setErrorMsg(''); }}
            className="text-xs text-slate-500 hover:text-[#008200] font-semibold transition-colors uppercase tracking-wide"
          >
            {isRegistering ? 'Já tem uma conta? Fazer Login' : 'Não tem conta? Criar Conta'}
          </button>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-100 w-full flex justify-between items-center text-[10px] text-slate-400 font-medium">
           <span className="flex items-center gap-1.5 text-slate-300">
             <Linkedin size={12} /> Enterprise Edition
           </span>
           <span className="flex items-center gap-1.5 text-slate-300">
             <Headphones size={12} /> Support 24/7
           </span>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;