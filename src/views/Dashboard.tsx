import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Invoice } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { TrendingUp, CheckCircle2, Clock, FileStack, ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';

export function Dashboard({ onNewInvoice, onViewHistory }: { onNewInvoice: () => void, onViewHistory: () => void }) {
  const { profile, user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    async function loadData() {
      let q = supabase.from('invoices').select('*').order('created_at', { ascending: false });
      if (!isAdmin) q = q.eq('user_id', user.id);
      
      const { data } = await q;
      setInvoices(data || []);
      setLoading(false);
    }
    loadData();
  }, [user.id, isAdmin]);

  const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const totalPaid = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.total || 0), 0);
  const outstanding = totalInvoiced - totalPaid;

  const metrics = [
    { label: 'Total Invoiced', value: formatCurrency(totalInvoiced, profile?.currency), icon: FileStack, color: 'text-ink' },
    { label: 'Paid', value: formatCurrency(totalPaid, profile?.currency), icon: CheckCircle2, color: 'text-brand' },
    { label: 'Outstanding', value: formatCurrency(outstanding, profile?.currency), icon: Clock, color: 'text-amber-600' },
    { label: 'Invoices', value: invoices.length.toString(), icon: TrendingUp, color: 'text-ink' },
  ];

  const h = new Date().getHours();
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            {greeting}, {profile?.name?.split(' ')[0]}
          </h1>
          <p className="text-ink/50 text-sm mt-1">
            {isAdmin ? 'NMG community revenue overview' : `${profile?.biz_name} overview`}
          </p>
        </div>
        <button 
          onClick={onNewInvoice}
          className="bg-brand text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-brand/20 hover:bg-brand-dark transition-all flex items-center gap-2 text-sm"
        >
          <span>+</span> New Invoice
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {metrics.map((m, i) => (
          <motion.div 
            key={m.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white border border-black/5 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-paper rounded-lg group-hover:bg-brand/5 transition-colors">
                <m.icon className="w-5 h-5 text-ink/40 group-hover:text-brand" />
              </div>
            </div>
            <div className="text-xs font-semibold text-ink/40 uppercase tracking-widest mb-1.5">{m.label}</div>
            <div className={cn("text-xl font-bold font-mono tracking-tight", m.color)}>{m.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Recent Invoices */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-ink/80 text-sm">Recent Invoices</h3>
          <button 
            onClick={onViewHistory}
            className="text-brand text-xs font-semibold hover:underline flex items-center gap-1"
          >
            View all <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-20 text-ink/20">
            <div className="animate-spin text-2xl">◌</div>
          </div>
        ) : invoices.length === 0 ? (
          <div className="bg-white border border-dashed border-black/10 p-20 rounded-2xl text-center text-ink/30 italic text-sm">
            No invoices found. Create your first one to see stats.
          </div>
        ) : (
          <div className="grid gap-3">
            {invoices.slice(0, 5).map((inv) => (
              <div key={inv.id} className="bg-white border border-black/5 px-6 py-4 rounded-2xl flex items-center justify-between hover:border-brand/40 transition-all group">
                <div className="flex items-center gap-5">
                  <div className="w-10 h-10 rounded-xl bg-paper flex items-center justify-center text-xs font-bold text-ink/30 group-hover:bg-brand/5 group-hover:text-brand transition-colors">
                    {inv.client_name.slice(0, 1)}
                  </div>
                  <div>
                    <div className="font-mono text-xs text-ink/40 mb-0.5">{inv.inv_number}</div>
                    <div className="font-semibold text-sm">{inv.client_name}</div>
                    <div className="text-[10px] text-ink/40 mt-1">{inv.inv_date}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold font-mono group-hover:text-brand transition-colors">
                    {formatCurrency(inv.total, inv.currency)}
                  </div>
                  <div className="mt-1.5 flex justify-end">
                    <span className={cn(
                      "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md",
                      inv.status === 'paid' ? 'bg-brand/10 text-brand' : 
                      inv.status === 'overdue' ? 'bg-red-500/10 text-red-500' : 
                      'bg-amber-500/10 text-amber-500'
                    )}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
