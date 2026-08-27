import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, User, ArrowRight } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleDemoLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate network delay
    setTimeout(() => {
      login({ id: '1', name: 'Officer Demo', role: 'officer' });
      navigate('/');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-brand-600/20 blur-[120px]"></div>
        <div className="absolute top-[60%] -right-[10%] w-[60%] h-[60%] rounded-full bg-blue-600/20 blur-[100px]"></div>
      </div>

      <div className="w-full max-w-md z-10 p-6">
        <div className="glass-card bg-slate-800/80 border-slate-700/50 p-10 backdrop-blur-xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-500/20 text-brand-400 mb-6 border border-brand-500/30 shadow-inner">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">METRO-CHECK <span className="text-brand-400">AI</span></h1>
            <p className="text-slate-400 mt-3 text-sm leading-relaxed">
              Legal Metrology Compliance Intelligence Platform<br/>
              <span className="opacity-75 text-xs">Digital inspection and automated packaged commodity compliance assessment.</span>
            </p>
          </div>

          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            <div>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Officer ID / Email"
                  className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder:text-slate-500"
                />
              </div>
            </div>
            
            <div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center">
                Sign In
              </button>
            </div>
            
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-700"></div>
              <span className="flex-shrink-0 mx-4 text-slate-500 text-sm">or for prototype</span>
              <div className="flex-grow border-t border-slate-700"></div>
            </div>

            <button 
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-500 text-white font-medium py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:shadow-[0_0_30px_rgba(14,165,233,0.5)] flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <span className="animate-pulse">Authenticating...</span>
              ) : (
                <>
                  Demo Login
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-8 text-center text-xs text-slate-500">
            Secure Government Prototype Interface
          </div>
        </div>
      </div>
    </div>
  );
}
