import React, { useState } from 'react';
import {
  ReceiptText,
  Search,
  Plus,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Banknote,
  Shield,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/database';
import { Invoice, InvoiceItem, Patient } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { exportToCSV } from '../../lib/exportService';
import { openPrintWindow } from '../../lib/printService';

export const BillingOverviewPage: React.FC = () => {
  const { user, activeHospital } = useAuth();
  const hospId = activeHospital?.id;
  const isSuper = user?.is_super_admin;

  const [invoices, setInvoices] = useState<Invoice[]>(db.getInvoices(hospId, isSuper));
  const [patients] = useState<Patient[]>(db.getPatients(hospId, isSuper));

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showNewBillModal, setShowNewBillModal] = useState(false);
  const [collectTarget, setCollectTarget] = useState<Invoice | null>(null);

  // New Invoice Form State
  const [patientId, setPatientId] = useState(patients[0]?.id || '');
  const [billItems, setBillItems] = useState<{ desc: string; qty: number; rate: number; cat: string }[]>([
    { desc: 'Specialist Consultation Fee', qty: 1, rate: 1200, cat: 'opd' }
  ]);
  const [itemDesc, setItemDesc] = useState('');
  const [itemRate, setItemRate] = useState(500);
  const [itemCat, setItemCat] = useState('ipd');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'card' | 'upi' | 'insurance'>('upi');

  const refreshList = () => {
    setInvoices(db.getInvoices(hospId, isSuper));
  };

  const filteredInvoices = invoices.filter(i => {
    const matchesSearch =
      i.invoice_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.patient_uhid.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCollected = invoices.reduce((acc, i) => acc + i.paid_amount, 0);
  const totalReceivables = invoices.reduce((acc, i) => acc + i.balance_amount, 0);

  const handleAddItemToBill = () => {
    if (!itemDesc) return;
    setBillItems([...billItems, { desc: itemDesc, qty: 1, rate: Number(itemRate), cat: itemCat }]);
    setItemDesc('');
  };

  const handleGenerateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const pat = patients.find(p => p.id === patientId);
    if (!pat || billItems.length === 0) return;

    const subtotal = billItems.reduce((acc, item) => acc + (item.rate * item.qty), 0);
    const tax = Math.round(subtotal * 0.05); // 5% Hospital Service GST
    const grand = subtotal + tax;
    const invNo = `COROT-BILL-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const items: InvoiceItem[] = billItems.map((b, idx) => ({
      id: String(idx + 1),
      description: b.desc,
      quantity: b.qty,
      unit_price: b.rate,
      total_price: b.rate * b.qty,
      category: b.cat as any
    }));

    const newInv: Invoice = {
      id: `inv-${Date.now()}`,
      hospital_id: hospId || 'hosp-apex-01',
      invoice_no: invNo,
      patient_id: pat.id,
      patient_uhid: pat.uhid,
      patient_name: pat.name,
      total_amount: subtotal,
      tax_amount: tax,
      discount_amount: 0,
      grand_total: grand,
      paid_amount: grand,
      balance_amount: 0,
      payment_mode: paymentMode,
      status: 'paid',
      created_at: new Date().toISOString(),
      items
    };

    db.saveInvoice(newInv);
    db.addAuditLog({
      hospital_id: hospId,
      hospital_name: activeHospital?.name,
      user_id: user?.id || 'usr-anon',
      user_email: user?.email || '',
      user_role: user?.role || 'accountant',
      action: 'CREATE',
      module: 'Hospital Billing Desk',
      record_id: newInv.id,
      details: `Generated Invoice ${invNo} for ₹${grand} (${pat.name})`
    });

    handlePrintInvoice(newInv);
    refreshList();
    setShowNewBillModal(false);
  };

  const handlePrintInvoice = (inv: Invoice) => {
    const html = `
      <div style="margin-bottom: 20px;">
        <div style="text-align: center; border-bottom: 2px solid #0f2444; padding-bottom: 8px; margin-bottom: 15px;">
          <div style="font-size: 16px; font-weight: 800; color: #0f2444;">OFFICIAL HOSPITAL TAX INVOICE</div>
          <div style="font-size: 11px; color: #0284c7; font-weight: 600;">CENTRAL BILLING & CASHIER SETTLEMENT</div>
        </div>

        <div class="patient-box">
          <div><span class="label">Patient Name</span><span class="value">${inv.patient_name}</span></div>
          <div><span class="label">UHID</span><span class="value">${inv.patient_uhid}</span></div>
          <div><span class="label">Invoice No</span><span class="value">${inv.invoice_no}</span></div>
          <div><span class="label">Date & Time</span><span class="value">${new Date(inv.created_at).toLocaleString()}</span></div>
          <div><span class="label">Payment Mode</span><span class="value">${inv.payment_mode.toUpperCase()}</span></div>
          <div><span class="label">Status</span><span class="value">${inv.status.toUpperCase()}</span></div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Service / Item Description</th>
              <th>Category</th>
              <th>Qty</th>
              <th>Rate (₹)</th>
              <th>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${inv.items.map((item, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td><strong>${item.description}</strong></td>
                <td>${item.category.toUpperCase()}</td>
                <td>${item.quantity}</td>
                <td>₹${item.unit_price}</td>
                <td>₹${item.total_price.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="margin-top: 15px; text-align: right; font-size: 13px;">
          <div>Subtotal: <strong>₹${inv.total_amount.toFixed(2)}</strong></div>
          <div>Hospital Surcharge / GST (5%): <strong>₹${inv.tax_amount.toFixed(2)}</strong></div>
          <div style="font-size: 16px; font-weight: bold; color: #0f2444; margin-top: 5px;">Grand Total: ₹${inv.grand_total.toFixed(2)}</div>
          <div style="font-size: 12px; color: #16a34a; font-weight: bold; margin-top: 2px;">PAID IN FULL: ₹${inv.paid_amount.toFixed(2)}</div>
        </div>

        <div style="border-top: 1px dashed #cbd5e1; padding-top: 10px; margin-top: 25px; display: flex; justify-content: space-between; font-size: 10px; color: #64748b;">
          <div>Authorized Cashier Signature</div>
          <div>Computer Generated Invoice • Valid without physical seal</div>
        </div>
      </div>
    `;

    openPrintWindow('OFFICIAL HOSPITAL TAX INVOICE', html, activeHospital || undefined);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="emerald" size="sm">CASHIER & BILLING SUITE</Badge>
            <span className="text-xs text-slate-400 font-mono">FINANCIAL CONTROL</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Hospital Billing & Cashier Desk</h1>
          <p className="text-xs text-slate-400 mt-1">
            Unified billing across OPD, IPD, ICU, Pharmacy, Lab, Radiology, and TPA Insurance pre-authorization.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => exportToCSV(invoices, 'Hospital_Invoices_Master')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900/60 border border-white/5 text-slate-300 hover:text-white text-xs font-semibold"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Invoices CSV</span>
          </button>

          <button
            onClick={() => setShowNewBillModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-[0_0_20px_rgba(16,185,129,0.4)]"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Bill</span>
          </button>
        </div>
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4">
          <div className="text-xs text-emerald-400 font-mono font-bold">TOTAL REALIZED REVENUE</div>
          <div className="text-2xl font-bold text-white font-mono mt-1">₹{totalCollected.toLocaleString()}</div>
          <div className="text-[10px] text-emerald-300 mt-1">Settled across Cash, Card & UPI</div>
        </div>

        <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-4">
          <div className="text-xs text-amber-400 font-mono font-bold">PENDING RECEIVABLES / TPA</div>
          <div className="text-2xl font-bold text-white font-mono mt-1">₹{totalReceivables.toLocaleString()}</div>
          <div className="text-[10px] text-amber-300 mt-1">Insurance & Interim IPD bills</div>
        </div>

        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4">
          <div className="text-xs text-slate-400 font-mono">TOTAL INVOICES ISSUED</div>
          <div className="text-2xl font-bold text-white font-mono mt-1">{invoices.length} Invoices</div>
          <div className="text-[10px] text-slate-500 mt-1">Tax compliant records</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 border border-white/5 rounded-2xl p-4 backdrop-blur-md">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search Invoice No, Patient Name, UHID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-mono">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="All">All Invoices</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="unpaid">Unpaid</option>
          </select>
          <span className="text-xs font-mono text-slate-500">{filteredInvoices.length} Bills</span>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 text-slate-400 font-mono uppercase text-[11px]">
                <th className="pb-3 px-3">Invoice No & Date</th>
                <th className="pb-3 px-3">Patient & UHID</th>
                <th className="pb-3 px-3">Grand Total</th>
                <th className="pb-3 px-3">Paid Amount</th>
                <th className="pb-3 px-3">Payment Mode</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 px-3">
                    <div className="font-mono font-bold text-white">{inv.invoice_no}</div>
                    <div className="text-[10px] text-slate-400">{new Date(inv.created_at).toLocaleDateString()}</div>
                  </td>
                  <td className="py-4 px-3">
                    <div className="font-bold text-white text-sm">{inv.patient_name}</div>
                    <div className="text-[10px] font-mono text-blue-400">{inv.patient_uhid}</div>
                  </td>
                  <td className="py-4 px-3 font-mono font-bold text-white">
                    ₹{inv.grand_total.toLocaleString()}
                  </td>
                  <td className="py-4 px-3 font-mono text-emerald-400 font-bold">
                    ₹{inv.paid_amount.toLocaleString()}
                  </td>
                  <td className="py-4 px-3 font-mono uppercase text-slate-300">
                    {inv.payment_mode}
                  </td>
                  <td className="py-4 px-3">
                    <Badge variant={inv.status === 'paid' ? 'emerald' : 'amber'} size="sm">
                      {inv.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-4 px-3 text-right">
                    <button
                      onClick={() => handlePrintInvoice(inv)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white font-semibold transition-all text-[11px]"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Tax Bill</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Bill Modal */}
      <Modal
        isOpen={showNewBillModal}
        onClose={() => setShowNewBillModal(false)}
        title="Generate Hospital Invoice & Collect Payment"
        subtitle={`Creates official receipt under ${activeHospital?.name}`}
        maxWidth="2xl"
      >
        <form onSubmit={handleGenerateInvoice} className="space-y-4 text-xs">
          <div>
            <label className="block font-mono uppercase text-slate-400 mb-1">Select Patient *</label>
            <select
              value={patientId}
              onChange={e => setPatientId(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-emerald-500 cursor-pointer"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.uhid})</option>
              ))}
            </select>
          </div>

          {/* Add Line Item */}
          <div className="bg-slate-900/60 p-3 rounded-2xl border border-white/5 space-y-2">
            <h4 className="font-mono uppercase text-slate-400 font-bold text-[10px]">Add Billable Line Item</h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <input
                type="text"
                placeholder="Service (e.g. ICU Day Charge)"
                value={itemDesc}
                onChange={e => setItemDesc(e.target.value)}
                className="sm:col-span-2 bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-white"
              />
              <input
                type="number"
                placeholder="Rate (₹)"
                value={itemRate}
                onChange={e => setItemRate(Number(e.target.value))}
                className="bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-white"
              />
              <button
                type="button"
                onClick={handleAddItemToBill}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl py-1.5"
              >
                + Add
              </button>
            </div>

            {/* Added Items */}
            <div className="space-y-1 pt-2">
              {billItems.map((b, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-slate-900 text-slate-200">
                  <span>{b.desc} ({b.cat.toUpperCase()})</span>
                  <span className="font-mono font-bold text-emerald-400">₹{b.rate * b.qty}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-slate-400">Payment Mode:</span>
            <div className="flex items-center gap-2">
              {['upi', 'card', 'cash', 'insurance'].map(m => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setPaymentMode(m as any)}
                  className={`px-3 py-1 rounded-xl uppercase font-mono font-semibold text-[11px] border ${
                    paymentMode === m
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-900 text-slate-400 border-white/5'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
            <button
              type="button"
              onClick={() => setShowNewBillModal(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-[0_0_15px_rgba(16,185,129,0.4)]"
            >
              Settle Invoice & Print Receipt
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
