import React, { useState } from 'react';
import {
  Pill,
  Search,
  Plus,
  Printer,
  FileSpreadsheet,
  ShoppingCart,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Package,
  Calendar,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/database';
import { Medicine, Patient, Invoice, InvoiceItem } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { exportToCSV } from '../../lib/exportService';
import { openPrintWindow } from '../../lib/printService';

export const PharmacyPosPage: React.FC = () => {
  const { user, activeHospital } = useAuth();
  const hospId = activeHospital?.id;
  const isSuper = user?.is_super_admin;

  const [medicines, setMedicines] = useState<Medicine[]>(db.getMedicines(hospId, isSuper));
  const [patients] = useState<Patient[]>(db.getPatients(hospId, isSuper));

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showAddMedModal, setShowAddMedModal] = useState(false);
  const [showPosModal, setShowPosModal] = useState(false);

  // POS State
  const [cart, setCart] = useState<{ medicine: Medicine; quantity: number }[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('walkin');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'card' | 'upi'>('upi');

  // Add Medicine Form State
  const [name, setName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [category, setCategory] = useState('Cardiovascular');
  const [batchNo, setBatchNo] = useState('');
  const [expiryDate, setExpiryDate] = useState('2027-12-31');
  const [stockQuantity, setStockQuantity] = useState(500);
  const [unitPrice, setUnitPrice] = useState(15);
  const [reorderLevel, setReorderLevel] = useState(50);

  const refreshList = () => {
    setMedicines(db.getMedicines(hospId, isSuper));
  };

  const categories = ['All', ...Array.from(new Set(medicines.map(m => m.category)))];

  const filteredMeds = medicines.filter(m => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.generic_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'All' || m.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const lowStockMeds = medicines.filter(m => m.stock_quantity <= m.reorder_level);
  const nearExpiryMeds = medicines.filter(m => {
    const exp = new Date(m.expiry_date);
    const now = new Date();
    const diffDays = (exp.getTime() - now.getTime()) / (1000 * 3600 * 24);
    return diffDays < 90;
  });

  const handleAddToCart = (med: Medicine) => {
    const existing = cart.find(c => c.medicine.id === med.id);
    if (existing) {
      if (existing.quantity >= med.stock_quantity) return;
      setCart(cart.map(c => c.medicine.id === med.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { medicine: med, quantity: 1 }]);
    }
  };

  const handleRemoveFromCart = (medId: string) => {
    setCart(cart.filter(c => c.medicine.id !== medId));
  };

  const cartSubtotal = cart.reduce((acc, item) => acc + (item.medicine.unit_price * item.quantity), 0);
  const cartTax = Math.round(cartSubtotal * 0.12);
  const cartTotal = cartSubtotal + cartTax;

  const handleProcessCheckout = () => {
    if (cart.length === 0) return;
    const pat = patients.find(p => p.id === selectedPatientId);
    const invoiceNo = `PHARM-INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const items: InvoiceItem[] = cart.map(c => ({
      id: String(Date.now() + Math.random()),
      description: `${c.medicine.name} (Batch: ${c.medicine.batch_no})`,
      quantity: c.quantity,
      unit_price: c.medicine.unit_price,
      total_price: c.medicine.unit_price * c.quantity,
      category: 'pharmacy'
    }));

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      hospital_id: hospId || 'hosp-apex-01',
      invoice_no: invoiceNo,
      patient_id: pat ? pat.id : 'pat-walkin',
      patient_uhid: pat ? pat.uhid : 'WALKIN-CUSTOMER',
      patient_name: pat ? pat.name : 'Walk-in Retail Customer',
      total_amount: cartSubtotal,
      tax_amount: cartTax,
      discount_amount: 0,
      grand_total: cartTotal,
      paid_amount: cartTotal,
      balance_amount: 0,
      payment_mode: paymentMode,
      status: 'paid',
      created_at: new Date().toISOString(),
      items
    };

    db.saveInvoice(newInvoice);

    // Decrement stock in database
    cart.forEach(c => {
      const updatedMed: Medicine = {
        ...c.medicine,
        stock_quantity: Math.max(0, c.medicine.stock_quantity - c.quantity)
      };
      db.saveMedicine(updatedMed);
    });

    db.addAuditLog({
      hospital_id: hospId,
      hospital_name: activeHospital?.name,
      user_id: user?.id || 'usr-anon',
      user_email: user?.email || '',
      user_role: user?.role || 'pharmacist',
      action: 'CREATE',
      module: 'Pharmacy POS',
      record_id: newInvoice.id,
      details: `Generated Pharmacy Invoice ${invoiceNo} (₹${cartTotal}) for ${newInvoice.patient_name}`
    });

    // Print Receipt
    handlePrintPharmacyBill(newInvoice, cart);

    setCart([]);
    setShowPosModal(false);
    refreshList();
  };

  const handlePrintPharmacyBill = (inv: Invoice, cartItems?: { medicine: Medicine; quantity: number }[]) => {
    const html = `
      <div style="margin-bottom: 20px;">
        <div style="text-align: center; border-bottom: 1.5px solid #0f2444; padding-bottom: 8px; margin-bottom: 15px;">
          <div style="font-size: 16px; font-weight: 800; color: #0f2444;">TAX INVOICE - PHARMACY DISPENSARY</div>
          <div style="font-size: 11px; color: #0284c7; font-weight: 600;">DRUG LIC NO: MH-MZ1-2024-99881A</div>
        </div>

        <div class="patient-box">
          <div><span class="label">Patient Name</span><span class="value">${inv.patient_name}</span></div>
          <div><span class="label">UHID / ID</span><span class="value">${inv.patient_uhid}</span></div>
          <div><span class="label">Invoice No</span><span class="value">${inv.invoice_no}</span></div>
          <div><span class="label">Date & Time</span><span class="value">${new Date(inv.created_at).toLocaleString()}</span></div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Medicine Description</th>
              <th>Qty</th>
              <th>Unit Rate</th>
              <th>Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${inv.items.map((item, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td><strong>${item.description}</strong></td>
                <td>${item.quantity}</td>
                <td>₹${item.unit_price}</td>
                <td>₹${item.total_price.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="margin-top: 15px; text-align: right; font-size: 13px;">
          <div>Subtotal: <strong>₹${inv.total_amount.toFixed(2)}</strong></div>
          <div>GST (12%): <strong>₹${inv.tax_amount.toFixed(2)}</strong></div>
          <div style="font-size: 16px; font-weight: bold; color: #0f2444; margin-top: 5px;">Grand Total: ₹${inv.grand_total.toFixed(2)}</div>
          <div style="font-size: 11px; color: #16a34a; font-weight: bold; margin-top: 2px;">PAID IN FULL (${inv.payment_mode.toUpperCase()})</div>
        </div>

        <div style="border-top: 1px dashed #cbd5e1; padding-top: 10px; margin-top: 20px; font-size: 10px; color: #64748b; text-align: center;">
          Medicines once sold cannot be taken back or exchanged after 48 hours. Store in a cool, dry place.
        </div>
      </div>
    `;

    openPrintWindow('PHARMACY TAX INVOICE', html, activeHospital || undefined);
  };

  const handleCreateMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !batchNo) return;

    const newMed: Medicine = {
      id: `med-${Date.now()}`,
      hospital_id: hospId || 'hosp-apex-01',
      code: `DRUG-${Math.floor(100 + Math.random() * 900)}`,
      name,
      generic_name: genericName,
      category,
      batch_no: batchNo,
      expiry_date: expiryDate,
      stock_quantity: Number(stockQuantity),
      unit_price: Number(unitPrice),
      reorder_level: Number(reorderLevel),
      status: 'in_stock'
    };

    db.saveMedicine(newMed);
    refreshList();
    setShowAddMedModal(false);
    setName('');
    setGenericName('');
    setBatchNo('');
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="emerald" size="sm">PHARMACY & CHEMIST ERP</Badge>
            <span className="text-xs text-slate-400 font-mono">INTEGRATED RETAIL POS</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Pharmacy & Formulations Master</h1>
          <p className="text-xs text-slate-400 mt-1">
            Batch tracking, near-expiry alerts, stock replenishment, and instant POS dispensary checkout.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => exportToCSV(medicines, 'Pharmacy_Stock_Master')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900/60 border border-white/5 text-slate-300 hover:text-white text-xs font-semibold"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Stock CSV</span>
          </button>

          <button
            onClick={() => setShowPosModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(20,184,166,0.4)]"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>POS Counter ({cart.length})</span>
          </button>

          <button
            onClick={() => setShowAddMedModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(37,99,235,0.4)]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Medicine</span>
          </button>
        </div>
      </div>

      {/* Stock Alerts Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-mono">TOTAL MEDICINES</div>
            <div className="text-2xl font-bold text-white font-mono mt-1">{medicines.length}</div>
          </div>
          <Package className="w-8 h-8 text-blue-400 opacity-60" />
        </div>

        <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-amber-400 font-mono font-bold">LOW STOCK WARNINGS</div>
            <div className="text-2xl font-bold text-white font-mono mt-1">{lowStockMeds.length} Items</div>
          </div>
          <AlertTriangle className="w-8 h-8 text-amber-400 opacity-80" />
        </div>

        <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-rose-400 font-mono font-bold">NEAR EXPIRY (&lt; 90 DAYS)</div>
            <div className="text-2xl font-bold text-white font-mono mt-1">{nearExpiryMeds.length} Batches</div>
          </div>
          <Calendar className="w-8 h-8 text-rose-400 opacity-80" />
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 border border-white/5 rounded-2xl p-4 backdrop-blur-md">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search Medicine, Generic name or Code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-mono">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <span className="text-xs font-mono text-slate-500">{filteredMeds.length} Items</span>
        </div>
      </div>

      {/* Medicines Table */}
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 text-slate-400 font-mono uppercase text-[11px]">
                <th className="pb-3 px-3">Brand & Generic Name</th>
                <th className="pb-3 px-3">Category</th>
                <th className="pb-3 px-3">Batch & Expiry</th>
                <th className="pb-3 px-3">Unit Price (MRP)</th>
                <th className="pb-3 px-3">Available Stock</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3 text-right">POS Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredMeds.map((med) => {
                const isLow = med.stock_quantity <= med.reorder_level;
                return (
                  <tr key={med.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-3">
                      <div className="font-bold text-white text-sm">{med.name}</div>
                      <div className="text-[11px] text-slate-400">{med.generic_name}</div>
                    </td>
                    <td className="py-4 px-3 text-slate-300">{med.category}</td>
                    <td className="py-4 px-3 font-mono">
                      <div className="text-white font-bold">{med.batch_no}</div>
                      <div className="text-[10px] text-slate-400">Exp: {med.expiry_date}</div>
                    </td>
                    <td className="py-4 px-3 font-mono font-bold text-emerald-400">
                      ₹{med.unit_price}
                    </td>
                    <td className="py-4 px-3 font-mono font-bold">
                      <span className={isLow ? 'text-amber-400' : 'text-white'}>
                        {med.stock_quantity} Units
                      </span>
                    </td>
                    <td className="py-4 px-3">
                      <Badge variant={isLow ? 'amber' : 'emerald'} size="sm">
                        {isLow ? 'REORDER' : 'IN STOCK'}
                      </Badge>
                    </td>
                    <td className="py-4 px-3 text-right">
                      <button
                        onClick={() => handleAddToCart(med)}
                        disabled={med.stock_quantity <= 0}
                        className="px-3 py-1.5 rounded-xl bg-teal-600/20 text-teal-400 border border-teal-500/30 hover:bg-teal-600 hover:text-white font-semibold transition-all disabled:opacity-40"
                      >
                        + Dispense
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* POS Cart Modal */}
      <Modal
        isOpen={showPosModal}
        onClose={() => setShowPosModal(false)}
        title="Pharmacy POS Retail Dispensary"
        subtitle={`Fast checkout for ${activeHospital?.name}`}
        maxWidth="2xl"
      >
        <div className="space-y-4 text-xs">
          {/* Patient Selection */}
          <div>
            <label className="block font-mono uppercase text-slate-400 mb-1">Customer / Patient UHID</label>
            <select
              value={selectedPatientId}
              onChange={e => setSelectedPatientId(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-teal-500"
            >
              <option value="walkin">Walk-in Customer (Retail)</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.uhid})</option>
              ))}
            </select>
          </div>

          {/* Cart Table */}
          <div className="bg-slate-900/80 rounded-2xl p-4 border border-white/5 max-h-60 overflow-y-auto space-y-2">
            {cart.length === 0 ? (
              <div className="py-6 text-center text-slate-500">Cart is empty. Click '+ Dispense' on any medicine.</div>
            ) : (
              cart.map((item) => (
                <div key={item.medicine.id} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02]">
                  <div>
                    <div className="font-bold text-white">{item.medicine.name}</div>
                    <div className="text-[10px] text-slate-400">Batch: {item.medicine.batch_no} • ₹{item.medicine.unit_price} / unit</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-white">{item.quantity} Qty</span>
                    <span className="font-mono font-bold text-emerald-400">₹{item.medicine.unit_price * item.quantity}</span>
                    <button
                      onClick={() => handleRemoveFromCart(item.medicine.id)}
                      className="p-1 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bill Calculation */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 space-y-1.5 font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal:</span>
              <span>₹{cartSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>GST (12%):</span>
              <span>₹{cartTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-white/5">
              <span>Net Payable:</span>
              <span className="text-emerald-400">₹{cartTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Mode */}
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-slate-400">Payment Mode:</span>
            <div className="flex items-center gap-2">
              {['upi', 'card', 'cash'].map(m => (
                <button
                  key={m}
                  onClick={() => setPaymentMode(m as any)}
                  className={`px-3 py-1 rounded-xl uppercase font-mono font-semibold text-[11px] border ${
                    paymentMode === m
                      ? 'bg-teal-600 text-white border-teal-500'
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
              onClick={() => setShowPosModal(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleProcessCheckout}
              disabled={cart.length === 0}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold shadow-[0_0_15px_rgba(20,184,166,0.4)] disabled:opacity-40"
            >
              Complete Sale & Print Bill
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Medicine Modal */}
      <Modal
        isOpen={showAddMedModal}
        onClose={() => setShowAddMedModal(false)}
        title="Add Formulation / Medicine Batch"
        subtitle={`Registers drug batch in ${activeHospital?.name}`}
      >
        <form onSubmit={handleCreateMedicine} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono uppercase text-slate-400 mb-1">Brand Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Lipitor 20mg"
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-mono uppercase text-slate-400 mb-1">Generic Name *</label>
              <input
                type="text"
                required
                value={genericName}
                onChange={e => setGenericName(e.target.value)}
                placeholder="e.g. Atorvastatin Calcium"
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-mono uppercase text-slate-400 mb-1">Category</label>
              <input
                type="text"
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-mono uppercase text-slate-400 mb-1">Batch Number *</label>
              <input
                type="text"
                required
                value={batchNo}
                onChange={e => setBatchNo(e.target.value)}
                placeholder="e.g. LP-2026-X9"
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-mono uppercase text-slate-400 mb-1">Expiry Date *</label>
              <input
                type="date"
                required
                value={expiryDate}
                onChange={e => setExpiryDate(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-mono uppercase text-slate-400 mb-1">Stock Quantity *</label>
              <input
                type="number"
                required
                value={stockQuantity}
                onChange={e => setStockQuantity(Number(e.target.value))}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-mono uppercase text-slate-400 mb-1">Unit Price (MRP ₹) *</label>
              <input
                type="number"
                required
                value={unitPrice}
                onChange={e => setUnitPrice(Number(e.target.value))}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-mono uppercase text-slate-400 mb-1">Reorder Level *</label>
              <input
                type="number"
                required
                value={reorderLevel}
                onChange={e => setReorderLevel(Number(e.target.value))}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
            <button
              type="button"
              onClick={() => setShowAddMedModal(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
            >
              Save Medicine Batch
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
