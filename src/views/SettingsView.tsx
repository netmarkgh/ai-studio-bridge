import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { Camera, Save, Lock, LayoutGrid, CreditCard, Eye, EyeOff } from 'lucide-react';

export function SettingsView() {
  const { profile, user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Profile State
  const [bizName, setBizName] = useState(profile?.biz_name || '');
  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [address, setAddress] = useState(profile?.address || '');
  
  // Payment Defaults
  const [payMethod, setPayMethod] = useState(profile?.pay_method || 'MTN Mobile Money');
  const [accNumber, setAccNumber] = useState(profile?.acc_number || '');
  const [accName, setAccName] = useState(profile?.acc_name || '');
  const [currency, setCurrency] = useState(profile?.currency || 'GHS');
  
  // Note/Terms
  const [note, setNote] = useState(profile?.default_note || '');
  const [terms, setTerms] = useState(profile?.default_terms || '');

  const [password, setPassword] = useState('');

  async function handleSaveProfile() {
    setLoading(true);
    const { error } = await supabase.from('profiles').update({
      biz_name: bizName, name, phone, address
    }).eq('id', user.id);
    if (!error) {
      alert('Profile updated');
      refreshProfile();
    }
    setLoading(false);
  }

  async function handleSavePayment() {
    setLoading(true);
    const { error } = await supabase.from('profiles').update({
      pay_method: payMethod, acc_number: accNumber, acc_name: accName,
      currency, default_note: note, default_terms: terms
    }).eq('id', user.id);
    if (!error) {
      alert('Payment defaults updated');
      refreshProfile();
    }
    setLoading(false);
  }

  async function handleUpdatePassword() {
    if (!password) return;
    const { error } = await supabase.auth.updateUser({ password });
    if (!error) {
      alert('Password updated');
      setPassword('');
    }
  }

  async function handleUploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop();
    const path = `logos/${user.id}/logo_${Date.now()}.${ext}`;
    const { error: ue } = await supabase.storage.from('logos').upload(path, file);
    if (!ue) {
      const { data: pub } = supabase.storage.from('logos').getPublicUrl(path);
      await supabase.from('profiles').update({ logo_url: pub.publicUrl }).eq('id', user.id);
      refreshProfile();
      alert('Logo updated');
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto pb-24">
      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Account Settings</h1>
        <p className="text-ink/40 text-sm mt-1">Manage your business profile and invoice defaults.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left Column: Profile */}
        <div className="space-y-8">
          <div className="bg-white border border-black/5 p-8 rounded-2xl shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-ink/80 mb-2">
              <LayoutGrid className="w-4 h-4 text-brand" />
              <div className="text-[10px] uppercase font-bold tracking-widest">Business profile</div>
            </div>
            
            <div className="flex items-center gap-6 pb-6 border-b border-black/5">
              <div className="relative group cursor-pointer">
                <div className="w-20 h-20 bg-paper rounded-2xl flex items-center justify-center text-ink/20 overflow-hidden border border-black/5">
                  {profile?.logo_url ? <img src={profile.logo_url} className="w-full h-full object-cover" /> : <ImageIcon className="w-8 h-8 opacity-40" />}
                </div>
                <div className="absolute inset-0 bg-brand/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-2xl">
                  <Camera className="text-white w-6 h-6" />
                </div>
                <input type="file" onChange={handleUploadLogo} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
              <div>
                <div className="text-sm font-bold text-ink">Business Logo</div>
                <div className="text-[10px] text-ink/40 mt-1 uppercase tracking-tight">PNG or JPG · Recommended size 200x200</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink/40 uppercase ml-1">Business Name</label>
                <input value={bizName} onChange={e => setBizName(e.target.value)} className="w-full px-4 py-2.5 bg-paper rounded-xl text-sm outline-none border border-transparent focus:border-brand" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink/40 uppercase ml-1">Your Name</label>
                <input value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 bg-paper rounded-xl text-sm outline-none border border-transparent focus:border-brand" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink/40 uppercase ml-1">Phone</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-2.5 bg-paper rounded-xl text-sm outline-none border border-transparent focus:border-brand" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink/40 uppercase ml-1">Email</label>
                <input value={user?.email} disabled className="w-full px-4 py-2.5 bg-black/5 rounded-xl text-sm text-ink/40 border border-transparent" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-ink/40 uppercase ml-1">Address</label>
              <input value={address} onChange={e => setAddress(e.target.value)} className="w-full px-4 py-2.5 bg-paper rounded-xl text-sm outline-none border border-transparent focus:border-brand" />
            </div>

            <button onClick={handleSaveProfile} className="w-full bg-brand text-white py-3 rounded-xl font-bold text-sm hover:bg-brand-dark transition-all flex items-center justify-center gap-2">
              <Save className="w-4 h-4" /> Save Profile
            </button>
          </div>

          <div className="bg-white border border-black/5 p-8 rounded-2xl shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-ink/80">
              <Lock className="w-4 h-4 text-brand" />
              <div className="text-[10px] uppercase font-bold tracking-widest">Change password</div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-ink/40 uppercase ml-1">New Password (min 6 characters)</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="w-full px-4 py-2.5 bg-paper rounded-xl text-sm outline-none border border-transparent focus:border-brand pr-10" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink/50 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button onClick={handleUpdatePassword} className="w-full bg-ink text-white py-3 rounded-xl font-bold text-sm hover:bg-black transition-all">Update Password</button>
          </div>
        </div>

        {/* Right Column: Payment Defaults */}
        <div>
           <div className="bg-white border border-black/5 p-8 rounded-2xl shadow-sm space-y-6 sticky top-8">
              <div className="flex items-center gap-2 text-ink/80 mb-2">
                <CreditCard className="w-4 h-4 text-brand" />
                <div className="text-[10px] uppercase font-bold tracking-widest">Payment defaults</div>
              </div>
              
              <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink/40 uppercase ml-1">Default Method</label>
                  <select value={payMethod} onChange={e => setPayMethod(e.target.value)} className="w-full px-4 py-2.5 bg-paper rounded-xl text-sm outline-none border border-transparent focus:border-brand">
                    <option>MTN Mobile Money</option>
                    <option>Vodafone Cash</option>
                    <option>Bank Transfer</option>
                    <option>Paystack Link</option>
                  </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink/40 uppercase ml-1">Account Number</label>
                  <input value={accNumber} onChange={e => setAccNumber(e.target.value)} className="w-full px-4 py-2.5 bg-paper rounded-xl text-sm outline-none border border-transparent focus:border-brand" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink/40 uppercase ml-1">Currency</label>
                  <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full px-4 py-2.5 bg-paper rounded-xl text-sm outline-none border border-transparent focus:border-brand">
                    <option>GHS</option><option>USD</option><option>NGN</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink/40 uppercase ml-1">Account Name</label>
                  <input value={accName} onChange={e => setAccName(e.target.value)} className="w-full px-4 py-2.5 bg-paper rounded-xl text-sm outline-none border border-transparent focus:border-brand" />
              </div>

              <div className="space-y-4 pt-4 border-t border-black/5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink/40 uppercase ml-1">Default Note</label>
                  <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} className="w-full px-4 py-2.5 bg-paper rounded-xl text-sm outline-none border border-transparent focus:border-brand resize-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink/40 uppercase ml-1">Default Terms</label>
                  <textarea value={terms} onChange={e => setTerms(e.target.value)} rows={3} className="w-full px-4 py-2.5 bg-paper rounded-xl text-sm outline-none border border-transparent focus:border-brand resize-none" />
                </div>
              </div>

              <button onClick={handleSavePayment} className="w-full bg-brand text-white py-3 rounded-xl font-bold text-sm hover:bg-brand-dark transition-all flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> Save Default Settings
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
