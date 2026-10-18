import React, { useState, useEffect } from 'react';
import { Client } from '../types';
import { getClients, createClient, updateClient, deleteClient } from '../services/db';
import { cleanWhatsAppNumber } from '../utils/formatters';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  Building,
  MapPin,
  MessageCircle,
  Edit2,
  Trash2,
  X,
  FileText,
  AlertCircle,
} from 'lucide-react';

interface Props {
  businessId: string;
  onSelectClientForInvoice?: (client: Client) => void;
}

export const ClientManager: React.FC<Props> = ({ businessId, onSelectClientForInvoice }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [npwp, setNpwp] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const data = await getClients(businessId);
      setClients(data);
    } catch (err) {
      console.error('Failed to load clients', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [businessId]);

  const openAddModal = () => {
    setEditingClient(null);
    setName('');
    setCompany('');
    setEmail('');
    setPhone('');
    setAddress('');
    setNpwp('');
    setNotes('');
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setName(client.name);
    setCompany(client.company || '');
    setEmail(client.email || '');
    setPhone(client.phone);
    setAddress(client.address || '');
    setNpwp(client.npwp || '');
    setNotes(client.notes || '');
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama klien wajib diisi.');
      return;
    }
    if (!phone.trim()) {
      setError('Nomor HP / WhatsApp wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingClient) {
        await updateClient(businessId, editingClient.id, {
          name: name.trim(),
          company: company.trim(),
          email: email.trim(),
          phone: phone.trim(),
          address: address.trim(),
          npwp: npwp.trim(),
          notes: notes.trim(),
        });
      } else {
        await createClient(businessId, {
          name: name.trim(),
          company: company.trim(),
          email: email.trim(),
          phone: phone.trim(),
          address: address.trim(),
          npwp: npwp.trim(),
          notes: notes.trim(),
        });
      }
      setModalOpen(false);
      await fetchClients();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan klien.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (client: Client) => {
    if (confirm(`Apakah Anda yakin ingin menghapus klien "${client.name}"?`)) {
      try {
        await deleteClient(businessId, client.id);
        await fetchClients();
      } catch (err) {
        console.error('Failed to delete client', err);
      }
    }
  };

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.company && c.company.toLowerCase().includes(search.toLowerCase())) ||
      c.phone.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-400" />
            <span>Manajemen Klien Video</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Kelola data brand, agency, produser, atau individu yang menyewa jasa video Anda.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Klien Baru</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari berdasarkan nama klien, nama brand, atau nomor HP/WA..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white placeholder-slate-500"
        />
      </div>

      {/* Clients Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500">Memuat data klien...</div>
      ) : filteredClients.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 p-8">
          <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-300">Belum Ada Klien Terdaftar</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Tambahkan kontak klien untuk mempercepat pengisian data saat membuat invoice video baru.
          </p>
          <button
            onClick={openAddModal}
            className="mt-4 px-4 py-2 rounded-xl bg-indigo-600/80 hover:bg-indigo-500 text-white text-xs font-semibold transition"
          >
            Tambah Klien Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const waNumber = cleanWhatsAppNumber(client.phone);
            return (
              <div
                key={client.id}
                className="rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 p-5 flex flex-col justify-between transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-white">{client.name}</h4>
                      {client.company && (
                        <p className="text-xs font-medium text-sky-400 flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3" /> {client.company}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(client)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        title="Edit Klien"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(client)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                        title="Hapus Klien"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>{client.phone}</span>
                    </div>
                    {client.email && (
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                    {client.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{client.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <a
                    href={`https://wa.me/${waNumber}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-semibold transition"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>

                  {onSelectClientForInvoice && (
                    <button
                      onClick={() => onSelectClientForInvoice(client)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-xs font-semibold transition"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Buat Invoice</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Add / Edit Client */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl text-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-400" />
                <span>{editingClient ? 'Edit Data Klien' : 'Tambah Klien Baru'}</span>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nama Klien / PIC <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Perusahaan / Brand</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Contoh: PT Surya Media Prima"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    No. Telepon / WhatsApp <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Klien</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="klien@perusahaan.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Alamat Penagihan</label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Alamat kantor klien yang dicetak di invoice"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">NPWP Klien (Opsional)</label>
                  <input
                    type="text"
                    value={npwp}
                    onChange={(e) => setNpwp(e.target.value)}
                    placeholder="Contoh: 01.234.567.8-000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Catatan Tambahan</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ketentuan khusus klien"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                  />
                </div>
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
                  {submitting ? 'Menyimpan...' : editingClient ? 'Perbarui Klien' : 'Simpan Klien'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
