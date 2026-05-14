import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, cn } from '../lib/utils';
import { Search, LayoutGrid, List, BarChart3, Package } from 'lucide-react';

export function ItemsSoldView() {
  const { profile, user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [groupBy, setGroupBy] = useState<'item' | 'client'>('item');

  const isAdmin = profile?.role === 'admin';
  const canManageItems = isAdmin || profile?.permissions?.includes('can_manage_items');

  useEffect(() => {
    if (!canManageItems) return;
    async function fetchItems() {
      let q = supabase.from('invoice_items').select('description, quantity, unit_price, amount, invoices(user_id, client_name, inv_number, inv_date, currency)');
      if (!isAdmin) q = q.eq('invoices.user_id', user.id);
      
      const { data: rows, error } = await q;
      if (error) return;
      
      // Filter out mismatches from join
      const formatted = (rows || []).map((r: any) => ({
        ...r,
        invoices: Array.isArray(r.invoices) ? r.invoices[0] : r.invoices
      }));
      setData(formatted.filter(r => r.invoices && (isAdmin || r.invoices.user_id === user?.id)));
      setLoading(false);
    }
    fetchItems();
  }, [user.id, isAdmin]);

  const filtered = data.filter(r => 
    r.description?.toLowerCase().includes(search.toLowerCase()) ||
    r.invoices?.client_name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalQty = filtered.reduce((s, r) => s + (r.quantity || 0), 0);
  const totalVal = filtered.reduce((s, r) => s + (r.amount || 0), 0);

  const renderContent = () => {
    if (groupBy === 'item') {
      const grouped: any = {};
      filtered.forEach(r => {
        const key = r.description.trim() || 'Unnamed Item';
        if (!grouped[key]) grouped[key] = { desc: key, qty: 0, amount: 0, clients: new Set(), invoiceCount: 0 };
        grouped[key].qty += r.quantity;
        grouped[key].amount += r.amount;
        grouped[key].clients.add(r.invoices.client_name);
        grouped[key].invoiceCount++;
      });
      
      return Object.values(grouped).sort((a: any, b: any) => b.amount - a.amount).map((g: any) => (
        <div key={g.desc} className="bg-white border border-black/5 p-6 rounded-2xl flex items-center justify-between group hover:border-brand/40 transition-all">
          <div>
            <div className="font-bold text-ink">{g.desc}</div>
            <div className="text-[10px] text-ink/40 mt-1 uppercase tracking-tight flex items-center gap-2">
              <span className="text-brand font-bold">{g.invoiceCount} Sales</span> · {Array.from(g.clients).join(', ')}
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold font-mono text-brand text-lg">{formatCurrency(g.amount, profile?.currency)}</div>
            <div className="text-[10px] text-ink/40 font-bold uppercase tracking-widest mt-1">Total Qty: {g.qty}</div>
          </div>
        </div>
      ));
    } else {
      const grouped: any = {};
      filtered.forEach(r => {
        const key = r.invoices.client_name;
        if (!grouped[key]) grouped[key] = { client: key, items: [], amount: 0 };
        grouped[key].items.push(r);
        grouped[key].amount += r.amount;
      });
      
      return Object.values(grouped).sort((a: any, b: any) => b.amount - a.amount).map((g: any) => (
        <div key={g.client} className="bg-white border border-black/5 p-6 rounded-2xl shadow-sm">
           <div className="flex justify-between items-center mb-6">
             <div className="font-bold text-ink">{g.client}</div>
             <div className="text-right">
               <div className="font-bold font-mono text-brand text-lg">{formatCurrency(g.amount, profile?.currency)}</div>
               <div className="text-[9px] text-ink/40 font-bold uppercase tracking-widest leading-none">{g.items.length} items</div>
             </div>
           </div>
           <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-black/5">
                  <th className="py-2 text-[9px] font-bold text-ink/30 uppercase tracking-widest">Item</th>
                  <th className="py-2 text-[9px] font-bold text-ink/30 uppercase tracking-widest text-right">Qty</th>
                  <th className="py-2 text-[9px] font-bold text-ink/30 uppercase tracking-widest text-right">Value</th>
                  <th className="py-2 text-[9px] font-bold text-ink/30 uppercase tracking-widest text-right">Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {g.items.map((it: any, idx: number) => (
                  <tr key={idx}>
                    <td className="py-2.5 text-xs text-ink/70">{it.description}</td>
                    <td className="py-2.5 text-xs text-ink font-bold text-right">{it.quantity}</td>
                    <td className="py-2.5 text-xs text-brand font-mono font-bold text-right">{formatCurrency(it.amount, profile?.currency)}</td>
                    <td className="py-2.5 text-[10px] text-ink/30 font-mono text-right">{it.invoices.inv_number}</td>
                  </tr>
                ))}
              </tbody>
           </table>
        </div>
      ));
    }
  };

  if (!canManageItems) {
    return (
      <div className="p-20 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6">
          <Package className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-ink mb-2">Access Restricted</h1>
        <p className="text-ink/40 max-w-sm mx-auto">
          You do not have the <span className="font-bold text-ink/60">can_manage_items</span> permission required to view the items sold report. Please contact your administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Items Sold</h1>
          <p className="text-ink/40 text-sm mt-1">Inventory tracking and sales performance</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items or clients..."
              className="w-full sm:w-64 pl-10 pr-4 py-2 bg-white border border-black/5 rounded-xl text-sm focus:outline-none focus:border-brand"
            />
          </div>
          <div className="bg-white border border-black/5 p-1 rounded-xl flex gap-1">
             <button 
              onClick={() => setGroupBy('item')}
              className={cn("flex-1 sm:flex-none p-1.5 rounded-lg transition-all flex items-center justify-center", groupBy === 'item' ? "bg-brand text-white shadow-sm" : "hover:bg-paper text-ink/40")}
             >
               <Package className="w-4 h-4" />
               <span className="sm:hidden ml-2 text-xs font-bold uppercase tracking-wider">By Item</span>
             </button>
             <button 
              onClick={() => setGroupBy('client')}
              className={cn("flex-1 sm:flex-none p-1.5 rounded-lg transition-all flex items-center justify-center", groupBy === 'client' ? "bg-brand text-white shadow-sm" : "hover:bg-paper text-ink/40")}
             >
               <BarChart3 className="w-4 h-4" />
               <span className="sm:hidden ml-2 text-xs font-bold uppercase tracking-wider">By Client</span>
             </button>
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        <div className="bg-white border border-black/5 p-6 rounded-2xl shadow-sm">
           <div className="text-[10px] font-bold text-ink/40 uppercase tracking-widest mb-1">Total Lines</div>
           <div className="text-2xl font-bold text-ink">{filtered.length}</div>
        </div>
        <div className="bg-white border border-black/5 p-6 rounded-2xl shadow-sm">
           <div className="text-[10px] font-bold text-ink/40 uppercase tracking-widest mb-1">Total Qty</div>
           <div className="text-2xl font-bold text-brand">{totalQty}</div>
        </div>
        <div className="bg-white border border-black/5 p-6 rounded-2xl shadow-sm sm:col-span-2 md:col-span-1">
           <div className="text-[10px] font-bold text-ink/40 uppercase tracking-widest mb-1">Total Value</div>
           <div className="text-2xl font-bold font-mono text-brand">{formatCurrency(totalVal, profile?.currency)}</div>
        </div>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="p-20 text-center animate-pulse text-ink/20 font-bold">Scanning records...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-dashed border-black/10 p-20 rounded-2xl text-center text-ink/30 italic">No items found.</div>
        ) : renderContent()}
      </div>
    </div>
  );
}
