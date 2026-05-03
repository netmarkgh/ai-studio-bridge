import React from 'react';
import { 
  LayoutDashboard, 
  FilePlus2, 
  History, 
  Users, 
  Settings, 
  TrendingUp, 
  ShieldCheck,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn, getInitials } from '../lib/utils';

export type TabId = 'dashboard' | 'new-invoice' | 'history' | 'clients' | 'items' | 'settings' | 'admin';

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { profile, signOut, user } = useAuth();
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new-invoice', label: 'New Invoice', icon: FilePlus2 },
    { id: 'history', label: 'History', icon: History },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'items', label: 'Items Sold', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  if (profile?.role === 'admin') {
    menuItems.push({ id: 'admin', label: 'Admin Panel', icon: ShieldCheck });
  }

  return (
    <aside className="w-64 bg-white border-r border-black/5 flex flex-col h-screen overflow-hidden">
      {/* Brand */}
      <div className="p-6 border-b border-black/5 flex items-center gap-3">
        <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center text-white font-bold text-lg overflow-hidden shrink-0 shadow-lg shadow-brand/20">
          {profile?.logo_url ? (
            <img src={profile.logo_url} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <span>{getInitials(profile?.biz_name || 'NMG')[0]}</span>
          )}
        </div>
        <div className="overflow-hidden">
          <div className="font-semibold text-sm truncate">{profile?.biz_name || 'NMG'}</div>
          <div className="text-[10px] text-ink/40 uppercase tracking-wider font-medium">
            {profile?.role === 'admin' ? 'Admin' : 'Member'}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id as TabId)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group",
              activeTab === item.id 
                ? "bg-brand/10 text-brand font-medium shadow-sm" 
                : "text-ink/60 hover:bg-black/5 hover:text-ink"
            )}
          >
            <item.icon className={cn("w-4.5 h-4.5 transition-opacity", activeTab === item.id ? "opacity-100" : "opacity-60")} />
            <span className="flex-1 text-left">{item.label}</span>
            {activeTab === item.id && <ChevronRight className="w-4 h-4 opacity-40" />}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-black/5 space-y-4">
        <div className="flex items-center gap-3 px-1">
          <div className="w-9 h-9 rounded-full bg-brand-light flex items-center justify-center text-brand font-bold text-xs shrink-0">
            {getInitials(profile?.name || '?')}
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-semibold truncate">{profile?.name || 'User'}</div>
            <div className="text-[10px] text-ink/40 truncate">{user?.email}</div>
          </div>
        </div>
        <button 
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-red-500 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
