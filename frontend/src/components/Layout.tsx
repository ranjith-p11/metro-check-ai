import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  ScanLine,
  History,
  Package,
  AlertOctagon,
  BarChart3,
  Scale,
  LogOut,
  Bell,
  Search,
  ShieldCheck
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'New Inspection', icon: ScanLine, path: '/inspection/new' },
    { name: 'History', icon: History, path: '/history' },
    { name: 'Products', icon: Package, path: '/products' },
    { name: 'Violations', icon: AlertOctagon, path: '/violations' },
    { name: 'Analytics', icon: BarChart3, path: '/analytics' },
    { name: 'Rule Engine', icon: Scale, path: '/rules' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <ShieldCheck className="w-8 h-8 text-brand-500 mr-2" />
          <span className="text-xl font-bold tracking-wider">METRO-CHECK</span>
        </div>
        <div className="flex-1 py-6 overflow-y-auto">
          <nav className="px-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-xl transition-colors duration-200 ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-lg'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-5 h-5 mr-3" />
                <span className="font-medium">{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-10">
          <div className="flex items-center w-96 relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3" />
            <input
              type="text"
              placeholder="Search inspections, products..."
              className="w-full bg-slate-100 border-transparent focus:bg-white focus:border-brand-500 rounded-full pl-10 pr-4 py-2 outline-none transition-all"
            />
          </div>
          <div className="flex items-center space-x-6">
            <button className="relative text-slate-500 hover:text-brand-600 transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center pl-6 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold mr-3">
                {user?.name?.charAt(0) || 'O'}
              </div>
              <div className="text-sm">
                <p className="font-semibold text-slate-700">{user?.name || 'Officer Demo'}</p>
                <p className="text-slate-500 text-xs">Enforcement Officer</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-slate-50 relative">
           <div className="p-8 max-w-7xl mx-auto">
             {children}
           </div>
        </div>
      </main>
    </div>
  );
}
