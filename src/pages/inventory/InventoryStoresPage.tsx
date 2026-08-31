import React, { useState } from 'react';
import {
  Boxes,
  Search,
  Plus,
  Printer,
  FileSpreadsheet,
  Package,
  AlertTriangle,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/database';
import { InventoryItem } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { exportToCSV } from '../../lib/exportService';

export const InventoryStoresPage: React.FC = () => {
  const { user, activeHospital } = useAuth();
  const hospId = activeHospital?.id;
  const isSuper = user?.is_super_admin;

  const [items, setItems] = useState<InventoryItem[]>(db.getInventoryItems(hospId, isSuper));
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Surgical');
  const [quantity, setQuantity] = useState(100);
  const [unit, setUnit] = useState('Pcs');
  const [unitCost, setUnitCost] = useState(250);
  const [reorderThreshold, setReorderThreshold] = useState(20);

  const refreshList = () => {
    setItems(db.getInventoryItems(hospId, isSuper));
  };

  const filteredItems = items.filter(i =>
    i.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.item_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const newItem: InventoryItem = {
      id: `inv-item-${Date.now()}`,
      hospital_id: hospId || 'hosp-apex-01',
      item_code: `STORE-${Math.floor(100 + Math.random() * 900)}`,
      item_name: name,
      category,
      quantity: Number(quantity),
      unit,
      unit_cost: Number(unitCost),
      reorder_threshold: Number(reorderThreshold),
      status: 'in_stock'
    };

    db.saveInventoryItem(newItem);
    refreshList();
    setShowAddModal(false);
    setName('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="blue" size="sm">SUPPLY CHAIN & LOGISTICS</Badge>
            <span className="text-xs text-slate-400 font-mono">CENTRAL STORES & CONSUMABLES</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Central Store & Inventory</h1>
          <p className="text-xs text-slate-400 mt-1">
            Surgical disposables, PPE kits, diagnostic reagents, biomedical supplies, and departmental stock allocation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => exportToCSV(items, 'Hospital_Inventory_Stock')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900/60 border border-white/5 text-slate-300 hover:text-white text-xs font-semibold"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Stock CSV</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-[0_0_20px_rgba(37,99,235,0.4)]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Stock Item</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 text-slate-400 font-mono uppercase text-[11px]">
                <th className="pb-3 px-3">Item Code & Name</th>
                <th className="pb-3 px-3">Category</th>
                <th className="pb-3 px-3">Available Quantity</th>
                <th className="pb-3 px-3">Unit Cost (₹)</th>
                <th className="pb-3 px-3">Reorder Alert</th>
                <th className="pb-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredItems.map((item) => {
                const isLow = item.quantity <= item.reorder_threshold;
                return (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-3">
                      <div className="font-bold text-white text-sm">{item.item_name}</div>
                      <div className="text-[10px] font-mono text-blue-400">{item.item_code}</div>
                    </td>
                    <td className="py-4 px-3 text-slate-300">{item.category}</td>
                    <td className="py-4 px-3 font-mono font-bold text-white">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="py-4 px-3 font-mono text-slate-200">₹{item.unit_cost}</td>
                    <td className="py-4 px-3 font-mono text-slate-400">&lt; {item.reorder_threshold} {item.unit}</td>
                    <td className="py-4 px-3">
                      <Badge variant={isLow ? 'amber' : 'emerald'} size="sm">
                        {isLow ? 'LOW STOCK' : 'AVAILABLE'}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Item Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Inventory / Consumable SKU"
        subtitle={`Registers central stock in ${activeHospital?.name}`}
      >
        <form onSubmit={handleAddItem} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono uppercase text-slate-400 mb-1">Item Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Sterile Latex Surgical Gloves 7.5"
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-mono uppercase text-slate-400 mb-1">Category *</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-blue-500"
              >
                <option value="Surgical">Surgical Supplies</option>
                <option value="PPE">PPE & Infection Control</option>
                <option value="Laboratory">Lab Reagents</option>
                <option value="Biomedical">Biomedical Spares</option>
                <option value="Linens">Hospital Linens</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-mono uppercase text-slate-400 mb-1">Quantity *</label>
              <input
                type="number"
                required
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-mono uppercase text-slate-400 mb-1">Unit</label>
              <input
                type="text"
                value={unit}
                onChange={e => setUnit(e.target.value)}
                placeholder="Pcs / Box / Kits"
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-mono uppercase text-slate-400 mb-1">Unit Cost (₹) *</label>
              <input
                type="number"
                required
                value={unitCost}
                onChange={e => setUnitCost(Number(e.target.value))}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
            >
              Save Stock Item
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
