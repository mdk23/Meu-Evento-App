'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Users, Plus, Loader2, Mail, Phone, X, Edit3, Trash2, Save, Building2 } from 'lucide-react';
import { ClientCardDTO, ClientListPageDTO } from '@/types/dtos';
import PaginationControls from '../shared/PaginationControls';
import Topbar from '@/components/aurelia/Topbar';

interface ClientsClientProps {
  data: ClientListPageDTO;
}

export default function ClientsClient({ data }: ClientsClientProps) {
  const initialClients = data.items;
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

  // Sonner Deactivate Confirmation Handler
  const handleDeletePrompt = (clientId: string, clientName: string) => {
    toast(`Deactivate client "${clientName}"?`, {
      description: 'This hides them from new booking creation. Their existing bookings and history stay intact and unaffected.',
      action: {
        label: 'Confirm Deactivate',
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
        toast.success('Client deactivated successfully!');
        router.refresh();
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Failed to deactivate client.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="aurelia-shell flex-1 flex flex-col h-screen overflow-hidden">
      <Topbar crumb="Client Directory & CRM" note="Manage individual contacts, hosts, and corporate clients.">
        <button onClick={openAddModal} className="btn primary sm">
          <Plus className="w-3.5 h-3.5" /> Add Client
        </button>
      </Topbar>

      <div className="flex-1 overflow-y-auto page space-y-6">
        {initialClients.length === 0 ? (
          <div className="empty">
            <Users className="w-12 h-12 mx-auto mb-3" style={{ opacity: 0.3 }} />
            <h3 className="h-sm">No Clients Registered</h3>
            <p className="mini dim" style={{ marginTop: 4, maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>
              Your CRM registry is empty. Click &ldquo;Add Client&rdquo; to register new client profiles.
            </p>
          </div>
        ) : (
          <div className="grid g3">
            {initialClients.map((c, i) => {
              const isDeleting = deletingId === c.id;

              return (
                <div key={c.id} className={`card plain f-in d${(i % 4) + 1} flex flex-col justify-between`} style={{ gap: 16 }}>
                  <div className="stack">
                    <div className="between items-start">
                      <div>
                        <h3 className="h-sm">{c.name}</h3>
                        <p className="mini row" style={{ color: 'var(--accent)', gap: 6, marginTop: 2 }}>
                          <Building2 className="w-3.5 h-3.5" />
                          {c.companyName || 'Individual Contact'}
                        </p>
                      </div>
                      <span className="badge b-mute">{c.bookingCount} Bookings</span>
                    </div>

                    <div className="stack" style={{ gap: 6, paddingTop: 12, borderTop: '1px solid var(--rule)' }}>
                      <p className="mini dim row" style={{ gap: 8 }}>
                        <Mail className="w-3.5 h-3.5" /> {c.email || 'No email registered'}
                      </p>
                      <p className="mini dim row" style={{ gap: 8 }}>
                        <Phone className="w-3.5 h-3.5" /> {c.phone || 'No phone registered'}
                      </p>
                    </div>

                    {c.notes && (
                      <p className="mini dim" style={{ padding: 8, borderRadius: 'var(--radius-sm)', background: 'var(--bg-deep)', border: '1px solid var(--rule)' }}>
                        {c.notes}
                      </p>
                    )}
                  </div>

                  <div className="between" style={{ paddingTop: 12, borderTop: '1px solid var(--rule)' }}>
                    <button onClick={() => openEditModal(c)} className="btn ghost sm">
                      <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                    </button>

                    <button
                      disabled={isDeleting}
                      onClick={() => handleDeletePrompt(c.id, c.name)}
                      className="icon-btn"
                      style={{ width: 30, height: 30 }}
                      title="Deactivate Client"
                    >
                      {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <PaginationControls
          page={data.page}
          totalPages={data.totalPages}
          total={data.total}
          buildHref={(page) => (page > 1 ? `/clients?page=${page}` : '/clients')}
        />
      </div>

      {/* CREATE & EDIT CLIENT DIALOG */}
      {(isAddModalOpen || editingClient) && (
        <div className="modal-scrim">
          <div className="modal">
            <div className="card-h" style={{ borderBottom: '1px solid var(--rule)', paddingBottom: 16 }}>
              <h3 className="h-md" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                {isAddModalOpen ? 'Add New Client' : 'Edit Client Profile'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingClient(null);
                }}
                className="icon-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={isAddModalOpen ? handleCreateClient : handleUpdateClient} className="stack" style={{ marginTop: 20 }}>
              <div className="field">
                <label className="label">Full Name</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sofia Albuquerque"
                  className="input"
                />
              </div>

              <div className="field">
                <label className="label">Company / Corporate Entity (Optional)</label>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Standard Bank"
                  className="input"
                />
              </div>

              <div className="grid g2">
                <div className="field">
                  <label className="label">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="input"
                  />
                </div>

                <div className="field">
                  <label className="label">Phone Contact</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+258 84..."
                    className="input"
                  />
                </div>
              </div>

              <div className="field">
                <label className="label">CRM Notes & Preferences</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Preferences, allergy details, contract patterns..."
                  className="input"
                />
              </div>

              <button type="submit" disabled={submitting} className="btn primary" style={{ justifyContent: 'center' }}>
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
    </main>
  );
}
