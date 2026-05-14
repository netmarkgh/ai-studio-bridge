import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Client } from '../types';
import { getInitials } from '../lib/utils';
import { Plus, Search, Mail, Phone, MapPin, Trash2, FilePlus, Users } from 'lucide-react';

export function ClientsView({ onNewInvoiceFor }: { onNewInvoiceFor: (name: string) => void }) {
  const { user, profile } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const isAdmin = profile?.role === 'admin';
  const canManageClients = isAdmin || profile?.permissions?.includes('can_manage_clients');

  // New Client Form
  const [newClient, setNewClient] = useState({
    name: '', biz_name: '', phone: '', email: '', address: ''
  });

  useEffect(() => {
    if (!canManageClients) return;
    fetchClients();
  }, [user.id, canManageClients]);

  async function fetchClients() {
    const { data } = await supabase.from('clients').select('*').eq('user_id', user.id).order('name');
    setClients(data || []);
    setLoading(false);
  }

  async function handleAdd() {
    if (!newClient.name) return;
    const { error } = await supabase.from('clients').insert({ user_id: user.id, ...newClient });
    if (!error) {
      setShowAdd(false);
      setNewClient({ name: '', biz_name: '', phone: '', email: '', address: '' });
      fetchClients();
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Remove this client?')) return;
    await supabase.from('clients').delete().eq('id', id);
    setClients(clients.filter(c => c.id !== id));
  }

  const filtered = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  if (!canManageClients) {
    return (
      <div className="p-20 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6">
          <Users className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-ink mb-2">Access Restricted</h1>
        <p className="text-ink/40 max-w-sm mx-auto">
          You do not have the <span className="font-bold text-ink/60">can_manage_clients</span> permission required to view the customer book.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto no-print">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Client Book</h1>
          <p className="text-ink/40 text-sm mt-1">{clients.length} clients registered</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients..."
              className="w-full sm:w-64 pl-10 pr-4 py-2 bg-white border border-black/5 rounded-xl text-sm focus:outline-none focus:border-brand"
            />
          </div>
          <button 
            onClick={() => setShowAdd(true)}
            className="w-full sm:w-auto justify-center bg-brand text-white px-5 py-2 rounded-xl font-semibold text-sm shadow-sm hover:bg-brand-dark transition-all"
          >
            + Add Client
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="mb-8 bg-white border border-brand/20 p-4 md:p-6 rounded-2xl shadow-xl animate-in slide-in-from-top duration-300">
           <div className="text-[10px] uppercase tracking-widest font-bold text-brand mb-4">Add New Client</div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input 
                placeholder="Full Name" 
                value={newClient.name}
                onChange={e => setNewClient({...newClient, name: e.target.value})}
                className="w-full px-4 py-2.5 bg-paper rounded-xl text-sm outline-none border border-transparent focus:border-brand"
              />
              <input 
                placeholder="Business Name" 
                value={newClient.biz_name}
                onChange={e => setNewClient({...newClient, biz_name: e.target.value})}
                className="w-full px-4 py-2.5 bg-paper rounded-xl text-sm outline-none border border-transparent focus:border-brand"
              />
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input 
                placeholder="Phone" 
                value={newClient.phone}
                onChange={e => setNewClient({...newClient, phone: e.target.value})}
                className="w-full px-4 py-2.5 bg-paper rounded-xl text-sm outline-none border border-transparent focus:border-brand"
              />
              <input 
                placeholder="Email" 
                value={newClient.email}
                onChange={e => setNewClient({...newClient, email: e.target.value})}
                className="w-full px-4 py-2.5 bg-paper rounded-xl text-sm outline-none border border-transparent focus:border-brand"
              />
           </div>
           <input 
              placeholder="Address" 
              value={newClient.address}
              onChange={e => setNewClient({...newClient, address: e.target.value})}
              className="w-full px-4 py-2.5 bg-paper rounded-xl text-sm outline-none border border-transparent focus:border-brand mb-4"
           />
           <div className="flex flex-col sm:flex-row gap-2">
              <button onClick={handleAdd} className="w-full sm:w-auto bg-brand text-white px-6 py-2.5 rounded-xl text-sm font-bold">Save Client</button>
              <button onClick={() => setShowAdd(false)} className="w-full sm:w-auto px-6 py-2.5 text-ink/40 text-sm font-bold hover:bg-paper rounded-xl transition-colors text-center">Cancel</button>
           </div>
        </div>
      )}

      <div className="grid gap-3">
        {loading ? (
          <div className="p-20 text-center text-ink/20 animate-pulse font-bold">Loading contacts...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-dashed border-black/10 p-20 rounded-2xl text-center text-ink/30 italic">No clients found.</div>
        ) : (
          filtered.map(c => (
            <div key={c.id} className="bg-white border border-black/5 p-4 md:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-4 md:gap-6 shadow-sm hover:border-brand/40 transition-all group">
               <div className="flex items-center gap-4 flex-1">
                 <div className="w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-2xl bg-paper flex items-center justify-center text-brand font-bold group-hover:bg-brand/10 transition-colors">
                    {getInitials(c.name)}
                 </div>
                 <div className="flex-1 min-w-0">
                    <div className="font-bold text-ink mb-1 truncate">{c.name}</div>
                    <div className="flex flex-col md:flex-row md:flex-wrap gap-x-4 gap-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-ink/50 truncate"><Mail className="w-3.5 h-3.5 opacity-40 shrink-0" /> {c.email || 'No email'}</div>
                      <div className="flex items-center gap-1.5 text-xs text-ink/50 truncate"><Phone className="w-3.5 h-3.5 opacity-40 shrink-0" /> {c.phone || 'No phone'}</div>
                    </div>
                 </div>
               </div>
               
               <div className="flex items-center justify-between sm:justify-end gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity pt-4 sm:pt-0 border-t sm:border-0 border-black/5">
                  <button 
                    onClick={() => onNewInvoiceFor(c.name)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-brand/10 text-brand px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-brand hover:text-white transition-all shadow-sm"
                  >
                    <FilePlus className="w-3.5 h-3.5" /> Invoice
                  </button>
                  <button 
                    onClick={() => handleDelete(c.id)}
                    className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 text-xs rounded-xl"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
