import React, { useState, useEffect } from 'react';
import { ServiceItem } from '../types';
import { getServices, createService, updateService, deleteService } from '../services/db';
import { formatIDR } from '../utils/formatters';
import { Film, Plus, Edit2, Trash2, X, Tag, DollarSign, AlertCircle } from 'lucide-react';

interface Props {
  businessId: string;
}

export const ServiceCatalogManager: React.FC<Props> = ({ businessId }) => {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Production');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('shift');
  const [defaultPrice, setDefaultPrice] = useState(1500000);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const data = await getServices(businessId);
      setServices(data);
    } catch (err) {
      console.error('Failed to load services', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [businessId]);

  const categories = ['Semua', 'Pre-Production', 'Production', 'Post-Production', 'Sound', 'Equipment', 'Studio'];

  const openAddModal = () => {
    setEditingService(null);
    setName('');
    setCategory('Production');
    setDescription('');
    setUnit('shift');
    setDefaultPrice(1500000);
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (service: ServiceItem) => {
    setEditingService(service);
    setName(service.name);
    setCategory(service.category);
    setDescription(service.description || '');
    setUnit(service.unit);
    setDefaultPrice(service.defaultPrice);
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama jasa video wajib diisi.');
      return;
    }
    if (defaultPrice <= 0) {
      setError('Tarif standar harus lebih dari 0.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingService) {
        await updateService(businessId, editingService.id, {
          name: name.trim(),
          category,
          description: description.trim(),
          unit,
          defaultPrice: Number(defaultPrice),
        });
      } else {
        await createService(businessId, {
          name: name.trim(),
          category,
          description: description.trim(),
          unit,
          defaultPrice: Number(defaultPrice),
        });
      }
      setModalOpen(false);
      await fetchServices();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan jasa.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (service: ServiceItem) => {
    if (confirm(`Apakah Anda yakin ingin menghapus jasa "${service.name}"?`)) {
      try {
        await deleteService(businessId, service.id);
        await fetchServices();
      } catch (err) {
        console.error('Failed to delete service', err);
      }
    }
  };

  const filtered = categoryFilter === 'Semua' ? services : services.filter((s) => s.category === categoryFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Film className="w-5 h-5 text-sky-400" />
            <span>Katalog Jasa & Tarif Video Production</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Daftar paket jasa kru, sewa kamera/lighting, dan editing untuk disisipkan otomatis ke invoice.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Jasa Baru</span>
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition ${
              categoryFilter === cat
                ? 'bg-sky-500 text-white shadow-sm'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid of Services */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500">Memuat katalog jasa video...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 p-8">
          <Film className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-300">Belum Ada Jasa di Kategori Ini</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Tambahkan paket jasa video baru untuk memudahkan pembuatan penawaran dan invoice.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 p-5 flex flex-col justify-between transition"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {item.category}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-white mt-2">{item.name}</h4>
                {item.description && (
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Tarif Standar</span>
                  <p className="text-sm font-black text-sky-400">{formatIDR(item.defaultPrice)}</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] font-semibold text-slate-300 capitalize">
                  / {item.unit}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add / Edit Service */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl text-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Film className="w-4 h-4 text-sky-400" />
                <span>{editingService ? 'Edit Jasa Video' : 'Tambah Jasa Video Baru'}</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Layanan / Peralatan <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Drone Shooting 4K + Pilot"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                  >
                    <option value="Pre-Production">Pre-Production</option>
                    <option value="Production">Production</option>
                    <option value="Post-Production">Post-Production</option>
                    <option value="Sound">Sound</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Studio">Studio</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Satuan Hitung (Unit)</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                  >
                    <option value="shift">Shift (Max 10 Jam)</option>
                    <option value="hari">Hari</option>
                    <option value="project">Project</option>
                    <option value="video">Video</option>
                    <option value="jam">Jam</option>
                    <option value="track">Track / Lagu</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tarif Standar (IDR) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-500">Rp</span>
                  <input
                    type="number"
                    min={0}
                    step={50000}
                    required
                    value={defaultPrice}
                    onChange={(e) => setDefaultPrice(Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Deskripsi & Kelengkapan</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Spesifikasi alat, jumlah crew, atau batasan revisi"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : editingService ? 'Perbarui Jasa' : 'Simpan Jasa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
