export type UserRole = 'admin' | 'member';
export type UserStatus = 'active' | 'inactive';
export type InvoiceStatus = 'unpaid' | 'paid' | 'overdue' | 'draft';

export interface Profile {
  id: string;
  name: string | null;
  biz_name: string | null;
  phone: string | null;
  address: string | null;
  biz_type: string | null;
  role: UserRole;
  status: UserStatus;
  logo_url: string | null;
  sub_expires_at: string | null;
  sub_starts_at: string | null;
  sub_months: number | null;
  pay_method: string | null;
  currency: string;
  default_note: string | null;
  default_terms: string | null;
  acc_number: string | null;
  acc_name: string | null;
  created_at: string;
}

export interface Client {
  id: number;
  user_id: string;
  name: string;
  biz_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  created_at: string;
}

export interface Invoice {
  id: number;
  user_id: string;
  inv_number: string;
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  client_address: string | null;
  biz_name: string | null;
  biz_phone: string | null;
  biz_email: string | null;
  biz_address: string | null;
  inv_date: string | null;
  due_date: string | null;
  reference: string | null;
  status: InvoiceStatus;
  currency: string;
  subtotal: number;
  discount: number;
  discount_type: 'pct' | 'flat';
  discount_value: number;
  tax: number;
  tax_rate: number;
  total: number;
  pay_method: string | null;
  acc_number: string | null;
  acc_name: string | null;
  note: string | null;
  terms: string | null;
  created_at: string;
}

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  sort_order: number;
}
