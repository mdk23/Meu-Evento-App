'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Plus, Loader2, Mail, Phone, X } from 'lucide-react';
import { ClientCardDTO } from '@/types/dtos';

interface ClientsClientProps {
  initialClients: ClientCardDTO[];
}

export default function ClientsClient({ initialClients }: ClientsClientProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, companyName, notes }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setName('');
        setEmail('');
        setPhone('');
        setCompanyName('');
        setNotes('');
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* HEADER */}
        <header className="h-16 border-b border-zinc-900 bg-zinc-950/50 flex items-center px-8 justify-between shrink-0">
          <div>
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-violet-400" /> Client Directory & CRM
            </h2>
            <p className="text-xs text-zinc-500">Manage individual contacts, hosts, and corporate clients.</p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-lg"
          >
            <Plus className="w-4 h-4" /> Add Client
          </button>
        </header>

        {/* WORKSPACE */}
        <div className="flex-1 overflow-auto p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {initialClients.map((c) => (
              <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-white font-bold text-lg">{c.name}</h3>
                    <p className="text-xs text-violet-400 font-medium">{c.companyName || 'Individual Contact'}</p>
                  </div>
                  <span className="text-[10px] bg-zinc-800 text-zinc-400 font-bold px-2 py-0.5 rounded-md">
                    {c.bookingCount} Bookings
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-zinc-400 pt-3 border-t border-zinc-850">
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-zinc-500" /> {c.email || 'No email registered'}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-zinc-500" /> {c.phone || 'No phone registered'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* CREATE CLIENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-violet-400" /> Add New Client
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 font-bold block mb-1">Full Name</label>
                <input
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. John Smith"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-bold block mb-1">Company Name (Optional)</label>
                <input
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="e.g. ACME Corp Ltd."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 font-bold block mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="email@domain.com"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 font-bold block mb-1">Phone</label>
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+258 84..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-bold block mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-violet-500"
                  placeholder="Client preferences or corporate details..."
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold flex items-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
