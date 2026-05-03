import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Invoice, InvoiceItem, Client } from '../types';
import { formatCurrency, cn, getInitials } from '../lib/utils';
import { 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Send, 
  FileText, 
  Smartphone,
  Save
} from 'lucide-react';
import { motion } from 'motion/react';

interface InvoiceBuilderProps {
  onSuccess: () => void;
  initialClientName?: string | null;
}

export function InvoiceBuilder({ onSuccess, initialClientName }: InvoiceBuilderProps) {
  const { profile, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);

  // Form State
  const [form, setForm] = useState({
    clientName: initialClientName || '',
    clientPhone: '',
    clientEmail: '',
    clientAddress: '',
    bizName: profile?.biz_name || '',
    bizPhone: profile?.phone || '',
    bizEmail: user?.email || '',
    bizAddress: profile?.address || '',
    invDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 864e5).toISOString().split('T')[0],
    currency: profile?.currency || 'GHS',
    status: 'unpaid' as const,
    reference: '',
    payMethod: profile?.pay_method || 'MTN Mobile Money',
    accNumber: profile?.acc_number || '',
    accName: profile?.acc_name || '',
    note: profile?.default_note || '',
    terms: profile?.default_terms || '',
    taxRate: 0,
    discountValue: 0,
    discountType: 'pct' as 'pct' | 'flat',
  });

  const [items, setItems] = useState<Partial<InvoiceItem>[]>([
    { id: Date.now(), description: '', quantity: 1, unit_price: 0, amount: 0 }
  ]);

  useEffect(() => {
    async function loadClients() {
      const { data } = await supabase.from('clients').select('*').eq('user_id', user.id);
      setClients(data || []);
      
      if (initialClientName) {
        const client = (data || []).find(c => c.name === initialClientName);
        if (client) {
          setForm(prev => ({
            ...prev,
            clientPhone: client.phone || '',
            clientEmail: client.email || '',
            clientAddress: client.address || ''
          }));
        }
      }
    }
    loadClients();
  }, [user.id, initialClientName]);

  const updateItem = (id: number, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unit_price') {
          updated.amount = (updated.quantity || 1) * (updated.unit_price || 0);
        }
        return updated;
      }
      return item;
    }));
  };

  const addItem = () => setItems([...items, { id: Date.now(), description: '', quantity: 1, unit_price: 0, amount: 0 }]);
  const removeItem = (id: number) => items.length > 1 && setItems(items.filter(i => i.id !== id));

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const discount = form.discountType === 'pct' ? (subtotal * form.discountValue / 100) : form.discountValue;
  const tax = (subtotal - discount) * form.taxRate / 100;
  const total = Math.max(0, subtotal - discount + tax);

  const handleSave = async () => {
    if (!form.clientName) return alert('Client name is required');
    setLoading(true);

    try {
      const { count } = await supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      const invNumber = `INV-${String((count || 0) + 1).padStart(4, '0')}`;

      const { data: inv, error: invError } = await supabase.from('invoices').insert({
        user_id: user.id,
        inv_number: invNumber,
        client_name: form.clientName,
        client_phone: form.clientPhone,
        client_email: form.clientEmail,
        client_address: form.clientAddress,
        biz_name: form.bizName,
        biz_phone: form.bizPhone,
        biz_email: form.bizEmail,
        biz_address: form.bizAddress,
        inv_date: form.invDate,
        due_date: form.dueDate,
        reference: form.reference,
        status: form.status,
        currency: form.currency,
        subtotal,
        discount,
        discount_type: form.discountType,
        discount_value: form.discountValue,
        tax,
        tax_rate: form.taxRate,
        total,
        pay_method: form.payMethod,
        acc_number: form.accNumber,
        acc_name: form.accName,
        note: form.note,
        terms: form.terms
      }).select().single();

      if (invError) throw invError;

      const itemsToInsert = items.map((it, i) => ({
        invoice_id: inv.id,
        description: it.description,
        quantity: it.quantity,
        unit_price: it.unit_price,
        amount: (it.quantity || 0) * (it.unit_price || 0),
        sort_order: i
      }));
      await supabase.from('invoice_items').insert(itemsToInsert);

      // Auto-save client
      const existingClient = clients.find(c => c.name.toLowerCase() === form.clientName.toLowerCase());
      if (!existingClient) {
        await supabase.from('clients').insert({
          user_id: user.id,
          name: form.clientName,
          phone: form.clientPhone,
          email: form.clientEmail,
          address: form.clientAddress
        });
      }

      onSuccess();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShareWA = () => {
    const phone = form.clientPhone.replace(/\D/g, '');
    const msg = `Hello ${form.clientName},\n\nPlease find your invoice from *${form.bizName}*:\n\n*Amount due:* ${formatCurrency(total, form.currency)}\n*Due date:* ${form.dueDate}\n\n*Payment:* ${form.payMethod} — ${form.accNumber}\nName: ${form.accName}\n\n${form.note}\n\n— ${form.bizName}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">New Invoice</h1>
          <p className="text-ink/40 text-sm mt-1">Fill in the details to generate a professional invoice.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleShareWA}
            className="bg-[#25D366] text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Smartphone className="w-4 h-4" /> WhatsApp
          </button>
          <button className="bg-white border border-black/5 text-ink px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-paper transition-colors">
            <FileText className="w-4 h-4" /> PDF Preview
          </button>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="bg-brand text-white px-6 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-brand-dark transition-colors disabled:opacity-50"
          >
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            Save Invoice
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        {/* Editor Side */}
        <div className="space-y-6">
          {/* Section: Client */}
          <div className="bg-white border border-black/5 p-6 rounded-2xl shadow-sm space-y-4">
            <div className="text-[10px] uppercase tracking-widest font-bold text-ink/30 mb-2">Billed To — Client</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink/40 uppercase ml-1">Client Name</label>
                <input 
                  list="clients-list"
                  value={form.clientName}
                  onChange={(e) => {
                    const name = e.target.value;
                    setForm(prev => ({ ...prev, clientName: name }));
                    const client = clients.find(c => c.name === name);
                    if (client) {
                      setForm(prev => ({
                        ...prev,
                        clientPhone: client.phone || '',
                        clientEmail: client.email || '',
                        clientAddress: client.address || ''
                      }));
                    }
                  }}
                  className="w-full px-4 py-2 bg-paper border border-black/5 rounded-xl text-sm focus:outline-none focus:border-brand"
                  placeholder="Who are you billing?"
                />
                <datalist id="clients-list">
                  {clients.map(c => <option key={c.id} value={c.name} />)}
                </datalist>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink/40 uppercase ml-1">Phone (WhatsApp)</label>
                <input 
                  value={form.clientPhone}
                  onChange={(e) => setForm(prev => ({ ...prev, clientPhone: e.target.value }))}
                  className="w-full px-4 py-2 bg-paper border border-black/5 rounded-xl text-sm focus:outline-none focus:border-brand"
                  placeholder="+233..."
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink/40 uppercase ml-1">Email</label>
                <input 
                  value={form.clientEmail}
                  onChange={(e) => setForm(prev => ({ ...prev, clientEmail: e.target.value }))}
                  className="w-full px-4 py-2 bg-paper border border-black/5 rounded-xl text-sm focus:outline-none focus:border-brand"
                  placeholder="client@email.com"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink/40 uppercase ml-1">Address</label>
                <input 
                  value={form.clientAddress}
                  onChange={(e) => setForm(prev => ({ ...prev, clientAddress: e.target.value }))}
                  className="w-full px-4 py-2 bg-paper border border-black/5 rounded-xl text-sm focus:outline-none focus:border-brand"
                  placeholder="City, Street"
                />
              </div>
            </div>
          </div>

          {/* Section: Items */}
          <div className="bg-white border border-black/5 p-6 rounded-2xl shadow-sm space-y-4">
            <div className="text-[10px] uppercase tracking-widest font-bold text-ink/30 mb-2 font-sans">Line Items</div>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-[1fr_60px_100px_80px_32px] gap-3 items-end">
                  <div className="space-y-1">
                    {index === 0 && <label className="text-[9px] font-bold text-ink/40 uppercase ml-1">Description</label>}
                    <input 
                      value={item.description}
                      onChange={(e) => updateItem(item.id!, 'description', e.target.value)}
                      className="w-full px-4 py-2 bg-paper border border-black/5 rounded-xl text-sm focus:outline-none focus:border-brand"
                    />
                  </div>
                  <div className="space-y-1">
                    {index === 0 && <label className="text-[9px] font-bold text-ink/40 uppercase ml-1 text-right">Qty</label>}
                    <input 
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id!, 'quantity', parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-paper border border-black/5 rounded-xl text-sm text-right focus:outline-none focus:border-brand"
                    />
                  </div>
                  <div className="space-y-1">
                    {index === 0 && <label className="text-[9px] font-bold text-ink/40 uppercase ml-1 text-right">Price</label>}
                    <input 
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => updateItem(item.id!, 'unit_price', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 bg-paper border border-black/5 rounded-xl text-sm text-right focus:outline-none focus:border-brand font-mono"
                    />
                  </div>
                  <div className="h-9 flex items-center justify-end font-mono text-xs font-bold text-ink/60">
                    {(item.amount || 0).toFixed(2)}
                  </div>
                  <button 
                    onClick={() => removeItem(item.id!)}
                    className="h-9 flex items-center justify-center text-red-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button 
                onClick={addItem}
                className="w-full py-2.5 border border-dashed border-black/10 rounded-xl text-xs font-semibold text-brand hover:bg-brand/5 hover:border-brand/40 transition-all"
              >
                + Add Another Item
              </button>
            </div>

            {/* Summary */}
            <div className="pt-6 mt-6 border-t border-black/5 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-ink/40">Subtotal</span>
                <span className="font-mono font-bold">{formatCurrency(subtotal, form.currency)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-ink/40">Discount</span>
                  <input 
                    type="number"
                    value={form.discountValue}
                    onChange={(e) => setForm(prev => ({ ...prev, discountValue: parseFloat(e.target.value) || 0 }))}
                    className="w-16 px-2 py-1 bg-paper border border-black/5 rounded-md text-xs text-right focus:outline-none"
                  />
                  <select 
                    value={form.discountType}
                    onChange={(e) => setForm(prev => ({ ...prev, discountType: e.target.value as any }))}
                    className="px-1 py-1 bg-paper border border-black/5 rounded-md text-[10px] focus:outline-none"
                  >
                    <option value="pct">%</option>
                    <option value="flat">Fixed</option>
                  </select>
                </div>
                <span className="font-mono text-brand font-bold">-{formatCurrency(discount, form.currency)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-ink/40">Tax Rate (%)</span>
                  <input 
                    type="number"
                    value={form.taxRate}
                    onChange={(e) => setForm(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                    className="w-16 px-2 py-1 bg-paper border border-black/5 rounded-md text-xs text-right focus:outline-none"
                  />
                </div>
                <span className="font-mono font-bold">+{formatCurrency(tax, form.currency)}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-black/5">
                <span className="font-bold text-ink">Total Amount</span>
                <span className="text-xl font-bold font-mono text-brand">{formatCurrency(total, form.currency)}</span>
              </div>
            </div>
          </div>
          
          {/* Section: Payment & Notes */}
          <div className="bg-white border border-black/5 p-6 rounded-2xl shadow-sm grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="text-[10px] uppercase tracking-widest font-bold text-ink/30">Payment Details</div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-ink/40 uppercase ml-1">Method</label>
                  <select 
                    value={form.payMethod}
                    onChange={(e) => setForm(prev => ({ ...prev, payMethod: e.target.value }))}
                    className="w-full px-3 py-2 bg-paper border border-black/5 rounded-xl text-sm focus:outline-none"
                  >
                    <option>MTN Mobile Money</option>
                    <option>Vodafone Cash</option>
                    <option>Bank Transfer</option>
                    <option>Paystack Link</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-ink/40 uppercase ml-1">Account Number</label>
                  <input 
                    value={form.accNumber}
                    onChange={(e) => setForm(prev => ({ ...prev, accNumber: e.target.value }))}
                    className="w-full px-3 py-2 bg-paper border border-black/5 rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="text-[10px] uppercase tracking-widest font-bold text-ink/30">Notes & Terms</div>
              <textarea 
                value={form.note}
                onChange={(e) => setForm(prev => ({ ...prev, note: e.target.value }))}
                className="w-full h-24 px-3 py-2 bg-paper border border-black/5 rounded-xl text-sm resize-none"
                placeholder="Note to client..."
              />
            </div>
          </div>
        </div>

        {/* Live Preview Side */}
        <div className="sticky top-8 space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] uppercase tracking-widest font-bold text-ink/30 font-sans">Live Preview</span>
            <div className={cn(
              "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider",
              form.status === 'paid' ? 'bg-brand/10 text-brand' : 'bg-amber-500/10 text-amber-500'
            )}>
              {form.status}
            </div>
          </div>
          
          <div className="bg-white border border-black/5 aspect-[1/1.414] shadow-2xl rounded-2xl p-10 font-sans overflow-hidden">
             {/* Header */}
             <div className="flex justify-between items-start border-b-[2.5px] border-brand pb-6 mb-6">
               <div className="flex gap-4">
                  <div className="w-12 h-12 bg-brand rounded-xl flex items-center justify-center text-white font-bold text-xl overflow-hidden shrink-0 shadow-lg shadow-brand/20">
                    {profile?.logo_url ? <img src={profile.logo_url} className="w-full h-full object-cover" /> : <span>{getInitials(form.bizName)[0]}</span>}
                  </div>
                  <div>
                    <div className="text-lg font-bold text-brand leading-tight">{form.bizName}</div>
                    <div className="text-[10px] text-ink/50 mt-1 max-w-[200px]">{form.bizAddress}</div>
                    <div className="text-[10px] text-ink/50">{form.bizEmail} · {form.bizPhone}</div>
                  </div>
               </div>
               <div className="text-right">
                 <div className="bg-brand-light text-brand px-3 py-1 rounded-md text-[10px] font-bold tracking-widest inline-block">INVOICE</div>
                 <div className="font-mono text-[11px] text-ink/40 mt-1.5 uppercase tracking-tighter">INV-Draft</div>
                 <div className="text-[10px] text-ink/40 mt-0.5">{form.invDate}</div>
               </div>
             </div>

             {/* Parties */}
             <div className="grid grid-cols-2 gap-8 mb-8">
               <div>
                 <div className="text-[9px] font-bold uppercase tracking-widest text-ink/30 mb-2">Bill To</div>
                 <div className="font-bold text-sm text-ink">{form.clientName || '—'}</div>
                 <div className="text-[10px] text-ink/50 mt-1">{form.clientEmail}</div>
                 <div className="text-[10px] text-ink/50">{form.clientPhone}</div>
                 <div className="text-[10px] text-ink/50">{form.clientAddress}</div>
               </div>
               <div className="text-right">
                 <div className="text-[9px] font-bold uppercase tracking-widest text-ink/30 mb-2">Due Date</div>
                 <div className="font-bold text-sm text-ink">{form.dueDate}</div>
                 {form.reference && (
                  <>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-ink/30 mb-2 mt-4">Reference</div>
                    <div className="text-xs text-ink/60">{form.reference}</div>
                  </>
                 )}
               </div>
             </div>

             {/* Table */}
             <table className="w-full text-left border-collapse mb-6">
                <thead>
                  <tr className="border-b border-black/5">
                    <th className="py-2 text-[9px] font-bold text-ink/30 uppercase tracking-wider">Item</th>
                    <th className="py-2 text-[9px] font-bold text-ink/30 uppercase tracking-wider text-right w-12">Qty</th>
                    <th className="py-2 text-[9px] font-bold text-ink/30 uppercase tracking-wider text-right w-24">Price</th>
                    <th className="py-2 text-[9px] font-bold text-ink/30 uppercase tracking-wider text-right w-24">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-3 text-[11px] font-medium text-ink pr-4">{it.description || '—'}</td>
                      <td className="py-3 text-[11px] text-ink text-right">{it.quantity}</td>
                      <td className="py-3 text-[11px] text-ink text-right font-mono">{formatCurrency(it.unit_price || 0, form.currency)}</td>
                      <td className="py-3 text-[11px] text-ink text-right font-mono font-bold">{formatCurrency(it.amount || 0, form.currency)}</td>
                    </tr>
                  ))}
                </tbody>
             </table>

             {/* Calculations */}
             <div className="flex flex-col items-end gap-1.5 mb-8">
               <div className="flex gap-10 text-[11px] text-ink/60">
                 <span>Subtotal</span>
                 <span className="font-mono text-right w-24">{formatCurrency(subtotal, form.currency)}</span>
               </div>
               {discount > 0 && (
                 <div className="flex gap-10 text-[11px] text-brand">
                   <span>Discount</span>
                   <span className="font-mono text-right w-24">-{formatCurrency(discount, form.currency)}</span>
                 </div>
               )}
               {tax > 0 && (
                 <div className="flex gap-10 text-[11px] text-ink/60">
                   <span>Tax ({form.taxRate}%)</span>
                   <span className="font-mono text-right w-24">+{formatCurrency(tax, form.currency)}</span>
                 </div>
               )}
               <div className="flex gap-10 pt-2 border-t border-black/5 mt-1">
                 <span className="font-bold text-ink">Total</span>
                 <span className="font-mono text-lg font-bold text-brand w-24 text-right leading-none">{formatCurrency(total, form.currency)}</span>
               </div>
             </div>

             {/* Footer Pay Info */}
             <div className="bg-paper rounded-xl p-4 text-xs space-y-1.5 mb-6">
                <div className="text-[8px] font-bold uppercase tracking-widest text-ink/30">Payment Info</div>
                <div className="font-bold text-ink">{form.payMethod}</div>
                <div className="font-mono text-ink/60 text-[10px]">{form.accNumber}</div>
                <div className="text-[10px] text-ink/40">{form.accName}</div>
             </div>

             <div className="mt-auto border-t border-black/5 pt-6 flex justify-between items-end">
               <div className="text-[10px] text-ink/40 leading-relaxed max-w-[280px]">
                 {form.note}
               </div>
               <div className="text-[8px] font-mono text-ink/20 text-right uppercase tracking-widest">
                 Generated via Net-Marketing Ghana Platform
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
