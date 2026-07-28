'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Users, Plus, Loader2, Mail, Phone, X, Edit3, Trash2, Save, Building2 } from 'lucide-react';
import { ClientCardDTO } from '@/types/dtos';

interface ClientsClientProps {
  initialClients: ClientCardDTO[];
}

export default function ClientsClient({ initialClients }: ClientsClientProps) {
  const router = useRouter();

  // Dialog / Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientCardDTO | null>(null);

  // Form Fields State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openAddModal = () => {
    setName('');
    setEmail('');
    setPhone('');
    setCompanyName('');
    setNotes('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (client: ClientCardDTO) => {
    setEditingClient(client);
    setName(client.name || '');
    setEmail(client.email || '');
    setPhone(client.phone || '');
    setCompanyName(client.companyName || '');
    setNotes(client.notes || '');
  };

  // Create Client Handler
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Client name is required.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, companyName, notes }),
      });
      if (res.ok) {
        toast.success(`Client "${name}" added successfully!`);
        setIsAddModalOpen(false);
        router.refresh();
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Failed to create client.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error.');
    } finally {
      setSubmitting(false);
    }
  };

  // Update Client Handler
  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    if (!name.trim()) {
      toast.error('Client name is required.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/clients/${editingClient.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, companyName, notes }),
      });
      if (res.ok) {
        toast.success(`Client details updated!`);
        setEditingClient(null);
        router.refresh();
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Failed to update client.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error.');
    } finally {
      setSubmitting(false);
    }
  };

  // Sonner Delete Confirmation Handler
  const handleDeletePrompt = (clientId: string, clientName: string) => {
    toast(`Delete client "${clientName}"?`, {
      description: 'This will remove the contact from CRM. Note: Clients with active bookings cannot be deleted.',
      action: {
        label: 'Confirm Delete',
        onClick: () => executeDeleteClient(clientId),
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {},
      },
      duration: 6000,
    });
  };

  const executeDeleteClient = async (clientId: string) => {
    setDeletingId(clientId);
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Client profile deleted successfully!');
        router.refresh();
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Failed to delete client.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-zinc-950 text-white font-sans">
      {/* HEADER */}
      <header className="h-16 border-b border-zinc-900 bg-zinc-950/80 px-8 flex items-center justify-between shrink-0 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-violet-400" />
          <div>
            <h2 className="text-white font-bold text-lg tracking-tight">Client Directory & CRM</h2>
            <p className="text-xs text-zinc-500">Manage individual contacts, hosts, and corporate clients</p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-violet-600/20"
        >
          <Plus className="w-4 h-4" /> Add Client
        </button>
      </header>

      {/* WORKSPACE */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {initialClients.length === 0 ? (
          <div className="text-center py-16 text-zinc-600 border border-dashed border-zinc-800 rounded-2xl p-8">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30 text-violet-400" />
            <h3 className="text-sm font-bold text-zinc-300">No Clients Registered</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Your CRM registry is empty. Click "Add Client" to register new client profiles.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {initialClients.map((c) => {
              const isDeleting = deletingId === c.id;

              return (
                <div
                  key={c.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4 hover:border-zinc-700 transition-all group"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-white font-bold text-lg group-hover:text-violet-300 transition-colors">
                          {c.name}
                        </h3>
                        <p className="text-xs text-violet-400 font-medium flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          {c.companyName || 'Individual Contact'}
                        </p>
                      </div>
                      <span className="text-[10px] bg-zinc-950 text-zinc-400 border border-zinc-800 font-bold px-2.5 py-1 rounded-full">
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

                    {c.notes && (
                      <p className="text-[11px] text-zinc-500 line-clamp-2 bg-zinc-950/60 p-2 rounded-lg border border-zinc-800/80 font-mono">
                        {c.notes}
                      </p>
                    )}
                  </div>

                  {/* CRM ACTIONS */}
                  <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
                    <button
                      onClick={() => openEditModal(c)}
                      className="text-xs font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1 bg-violet-500/10 hover:bg-violet-500/20 px-3 py-1.5 rounded-lg border border-violet-500/20 transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                    </button>

                    <button
                      disabled={isDeleting}
                      onClick={() => handleDeletePrompt(c.id, c.name)}
                      className="text-zinc-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
                      title="Delete Client"
                    >
                      {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE & EDIT CLIENT DIALOG */}
      {(isAddModalOpen || editingClient) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-violet-400" />
                {isAddModalOpen ? 'Add New Client' : 'Edit Client Profile'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingClient(null);
                }}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={isAddModalOpen ? handleCreateClient : handleUpdateClient} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 font-bold block mb-1">Full Name</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sofia Albuquerque"
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-bold block mb-1">Company / Corporate Entity (Optional)</label>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Standard Bank"
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 font-bold block mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 font-bold block mb-1">Phone Contact</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+258 84..."
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-bold block mb-1">CRM Notes & Preferences</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Preferences, allergy details, contract patterns..."
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-white text-xs outline-none focus:border-violet-500 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-violet-600/20"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {isAddModalOpen ? 'Create Client Profile' : 'Save CRM Profile'}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
