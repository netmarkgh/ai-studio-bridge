import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Profile } from '../types';
import { formatCurrency, cn, getInitials } from '../lib/utils';
import { motion } from 'motion/react';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Shield, 
  Key, 
  ArrowUpRight,
  TrendingUp,
  Clock
} from 'lucide-react';

export function AdminView() {
  const { profile: loggedInProfile } = useAuth();
  const [members, setMembers] = useState<Profile[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Subscription Modal State
  const [pendingSub, setPendingSub] = useState<Profile | null>(null);
  const [subMonths, setSubMonths] = useState(1);
  const [subStart, setSubStart] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadAdminData();
  }, []);

  async function loadAdminData() {
    const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    const { data: invs } = await supabase.from('invoices').select('total, status');
    setMembers(profiles || []);
    setInvoices(invs || []);
    setLoading(false);
  }

  const totalRevenue = invoices.reduce((s, i) => s + parseFloat(i.total || 0), 0);
  const collected = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + parseFloat(i.total || 0), 0);
  const activeMembers = members.filter(m => m.status === 'active').length;

  const handleUpdateRole = async (id: string, role: string) => {
    await supabase.from('profiles').update({ role }).eq('id', id);
    setMembers(members.map(m => m.id === id ? { ...m, role: role as any } : m));
  };

  const handleToggleStatus = async (id: string, current: string) => {
    const status = current === 'active' ? 'inactive' : 'active';
    await supabase.from('profiles').update({ status }).eq('id', id);
    setMembers(members.map(m => m.id === id ? { ...m, status: status as any } : m));
  };

  const handleSetSubscription = async () => {
    if (!pendingSub) return;
    const end = new Date(subStart);
    end.setMonth(end.getMonth() + subMonths);
    
    const { error } = await supabase.from('profiles').update({
      status: 'active',
      sub_starts_at: new Date(subStart).toISOString(),
      sub_expires_at: end.toISOString()
    }).eq('id', pendingSub.id);

    if (!error) {
      alert('Subscription set successfully');
      setPendingSub(null);
      loadAdminData();
    }
  };

  if (loggedInProfile?.role !== 'admin') {
    return <div className="p-20 text-center font-bold text-red-500">Access Denied</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto pb-24">
      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight text-ink">NMG Admin Panel</h1>
        <p className="text-ink/40 text-sm mt-1">Community management and infrastructure health.</p>
      </div>

      {/* Admin Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-white border border-black/5 p-6 rounded-2xl shadow-sm">
           <div className="text-[10px] font-bold text-ink/40 uppercase tracking-widest mb-1">Members</div>
           <div className="text-2xl font-bold text-ink">{members.length}</div>
        </div>
        <div className="bg-white border border-black/5 p-6 rounded-2xl shadow-sm">
           <div className="text-[10px] font-bold text-ink/40 uppercase tracking-widest mb-1">Active</div>
           <div className="text-2xl font-bold text-brand">{activeMembers}</div>
        </div>
        <div className="bg-white border border-black/5 p-6 rounded-2xl shadow-sm">
           <div className="text-[10px] font-bold text-ink/40 uppercase tracking-widest mb-1">Community Revenue</div>
           <div className="text-2xl font-bold font-mono text-ink">{formatCurrency(totalRevenue)}</div>
        </div>
        <div className="bg-white border border-black/5 p-6 rounded-2xl shadow-sm">
           <div className="text-[10px] font-bold text-ink/40 uppercase tracking-widest mb-1">Collected</div>
           <div className="text-2xl font-bold font-mono text-brand">{formatCurrency(collected)}</div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-ink/80 text-sm">Community Members</h3>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {members.map((m) => (
            <div key={m.id} className="bg-white border border-black/5 p-6 rounded-2xl flex items-center justify-between shadow-sm group hover:border-brand/40 transition-all">
               <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-paper rounded-2xl flex items-center justify-center text-brand font-bold text-lg group-hover:bg-brand/10 transition-all">
                    {getInitials(m.name || '?')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                       <span className="font-bold text-ink text-sm">{m.name}</span>
                       <span className={cn(
                         "text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border",
                         m.role === 'admin' ? "bg-purple-50 text-purple-600 border-purple-100" : "bg-paper text-ink/30 border-black/5"
                       )}>
                         {m.role}
                       </span>
                    </div>
                    <div className="text-[10px] text-ink/50 mt-1 uppercase tracking-tight font-medium">
                      {m.biz_name} · {m.biz_type || 'General'}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={cn(
                        "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md",
                        m.status === 'active' ? "bg-brand/10 text-brand" : "bg-red-500/10 text-red-500"
                      )}>
                        {m.status}
                      </span>
                      {m.sub_expires_at && (
                        <div className="flex items-center gap-1 text-[9px] text-ink/40 font-bold uppercase">
                          <Clock className="w-2.5 h-2.5" /> 
                          Expires: {m.sub_expires_at.split('T')[0]}
                        </div>
                      )}
                    </div>
                  </div>
               </div>
               
               <div className="flex items-center gap-4">
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleUpdateRole(m.id, m.role === 'admin' ? 'member' : 'admin')}
                      className="p-2 hover:bg-paper rounded-xl text-ink/40 hover:text-ink transition-colors"
                      title="Toggle Admin"
                    >
                      <Shield className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setPendingSub(m)}
                      className="flex items-center gap-2 bg-brand/10 text-brand px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-brand hover:text-white transition-all shadow-sm"
                    >
                      <Calendar className="w-3.5 h-3.5" /> Subscription
                    </button>
                    <button 
                      onClick={() => handleToggleStatus(m.id, m.status)}
                      className={cn(
                        "p-2 rounded-xl transition-colors",
                        m.status === 'active' ? "hover:bg-red-50 text-red-400 hover:text-red-500" : "hover:bg-brand/10 text-brand/40 hover:text-brand"
                      )}
                      title={m.status === 'active' ? 'Deactivate' : 'Activate'}
                    >
                      {m.status === 'active' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    </button>
                  </div>
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subscription Modal */}
      {pendingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
           <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl space-y-6"
           >
              <div>
                <h3 className="text-xl font-bold text-ink">Set Subscription</h3>
                <p className="text-ink/40 text-sm mt-1">Update access for {pendingSub.name}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink/40 uppercase ml-1">Duration (Months)</label>
                  <select 
                    value={subMonths} 
                    onChange={e => setSubMonths(parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-paper rounded-xl text-sm focus:outline-none border border-transparent focus:border-brand"
                  >
                    <option value={1}>1 Month</option>
                    <option value={3}>3 Months</option>
                    <option value={6}>6 Months</option>
                    <option value={12}>12 Months</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink/40 uppercase ml-1">Start Date</label>
                  <input 
                    type="date" 
                    value={subStart} 
                    onChange={e => setSubStart(e.target.value)}
                    className="w-full px-4 py-3 bg-paper rounded-xl text-sm focus:outline-none border border-transparent focus:border-brand font-mono"
                  />
                </div>

                <div className="bg-brand-light p-4 rounded-xl text-brand text-xs font-semibold">
                  Access will extend until {(() => {
                    const d = new Date(subStart);
                    d.setMonth(d.getMonth() + subMonths);
                    return d.toLocaleDateString();
                  })()}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={handleSetSubscription} className="flex-1 bg-brand text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-brand/20 hover:bg-brand-dark transition-all">
                  Confirm Access
                </button>
                <button onClick={() => setPendingSub(null)} className="flex-1 bg-paper text-ink/40 py-3 rounded-xl font-bold text-sm hover:bg-black/5 transition-all">
                  Cancel
                </button>
              </div>
           </motion.div>
        </div>
      )}
    </div>
  );
}
