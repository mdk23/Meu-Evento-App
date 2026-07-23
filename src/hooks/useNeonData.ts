'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Booking, 
  Client, 
  ServicePackage, 
  AddOnService, 
  Transaction, 
  StaffMember, 
  MenuItem, 
  InventoryItem 
} from '../types';
import { 
  mockBookings, 
  mockClients, 
  mockPackages, 
  mockAddOns, 
  mockTransactions, 
  mockStaffMembers, 
  mockMenuItems, 
  mockInventoryItems 
} from '../mockData';

export function useNeonData() {
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [packages, setPackages] = useState<ServicePackage[]>(mockPackages);
  const [addOns, setAddOns] = useState<AddOnService[]>(mockAddOns);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(mockStaffMembers);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(mockMenuItems);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(mockInventoryItems);

  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [resEvents, resClients] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/crm'),
      ]);

      if (resEvents.ok && resClients.ok) {
        const eventsData = await resEvents.json();
        const clientsData = await resClients.json();

        if (eventsData.events && Array.isArray(eventsData.events)) {
          setBookings(eventsData.events);
        }
        if (clientsData.clients && Array.isArray(clientsData.clients)) {
          setClients(clientsData.clients);
        }
        setIsConnected(true);
        setError(null);
      }
    } catch (err: unknown) {
      console.warn('Neon DB sync notice: using initial cached state', err);
      setIsConnected(false);
      setError(err instanceof Error ? err.message : 'Offline');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [resEvents, resClients] = await Promise.all([
          fetch('/api/events'),
          fetch('/api/crm'),
        ]);

        if (active && resEvents.ok && resClients.ok) {
          const eventsData = await resEvents.json();
          const clientsData = await resClients.json();

          if (eventsData.events && Array.isArray(eventsData.events)) {
            setBookings(eventsData.events);
          }
          if (clientsData.clients && Array.isArray(clientsData.clients)) {
            setClients(clientsData.clients);
          }
          setIsConnected(true);
          setError(null);
        }
      } catch (err: unknown) {
        if (active) {
          console.warn('Neon DB sync notice: using initial cached state', err);
          setIsConnected(false);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  // Bookings handlers
  const addBooking = async (newBooking: Booking) => {
    setBookings(prev => [newBooking, ...prev]);
    try {
      await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBooking),
      });
    } catch (err) {
      console.error('Error saving booking to Neon:', err);
    }
  };

  const updateBooking = async (updatedBooking: Booking) => {
    setBookings(prev => prev.map(b => (b.id === updatedBooking.id ? updatedBooking : b)));
    try {
      await fetch('/api/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBooking),
      });
    } catch (err) {
      console.error('Error updating booking in Neon:', err);
    }
  };

  const deleteBooking = async (id: string) => {
    setBookings(prev => prev.filter(b => b.id !== id));
    setTransactions(prev => prev.filter(t => t.bookingId !== id));
    try {
      await fetch(`/api/bookings?id=${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Error deleting booking in Neon:', err);
    }
  };

  // Clients handlers
  const addClient = async (newClient: Client) => {
    setClients(prev => [newClient, ...prev]);
    try {
      await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient),
      });
    } catch (err) {
      console.error('Error adding client to Neon:', err);
    }
  };

  const updateClient = async (updatedClient: Client) => {
    setClients(prev => prev.map(c => (c.id === updatedClient.id ? updatedClient : c)));
    try {
      await fetch('/api/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedClient),
      });
    } catch (err) {
      console.error('Error updating client in Neon:', err);
    }
  };

  const deleteClient = async (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    try {
      await fetch(`/api/clients?id=${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Error deleting client in Neon:', err);
    }
  };

  // Transactions handlers
  const addTransaction = async (newTx: Transaction) => {
    setTransactions(prev => [newTx, ...prev]);
    if (newTx.type === 'income' && newTx.bookingId) {
      setBookings(prev =>
        prev.map(b => (b.id === newTx.bookingId ? { ...b, paidAmount: b.paidAmount + newTx.amount } : b))
      );
    }
    try {
      await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTx),
      });
    } catch (err) {
      console.error('Error adding transaction to Neon:', err);
    }
  };

  const deleteTransaction = async (id: string) => {
    const tx = transactions.find(t => t.id === id);
    setTransactions(prev => prev.filter(t => t.id !== id));
    if (tx && tx.type === 'income' && tx.bookingId) {
      setBookings(prev =>
        prev.map(b =>
          b.id === tx.bookingId ? { ...b, paidAmount: Math.max(0, b.paidAmount - tx.amount) } : b
        )
      );
    }
    try {
      await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Error deleting transaction in Neon:', err);
    }
  };

  // Packages & Addons handlers
  const addPackage = async (newPkg: ServicePackage) => {
    setPackages(prev => [...prev, newPkg]);
    try {
      await fetch('/api/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPkg),
      });
    } catch (err) {
      console.error('Error adding package:', err);
    }
  };

  const updatePackage = async (updatedPkg: ServicePackage) => {
    setPackages(prev => prev.map(p => (p.id === updatedPkg.id ? updatedPkg : p)));
    try {
      await fetch('/api/packages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPkg),
      });
    } catch (err) {
      console.error('Error updating package:', err);
    }
  };

  const deletePackage = async (id: string) => {
    setPackages(prev => prev.filter(p => p.id !== id));
    try {
      await fetch(`/api/packages?id=${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Error deleting package:', err);
    }
  };

  const addAddOn = async (newAddOn: AddOnService) => {
    setAddOns(prev => [...prev, newAddOn]);
    try {
      await fetch('/api/addons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAddOn),
      });
    } catch (err) {
      console.error('Error adding addOn:', err);
    }
  };

  const updateAddOn = async (updatedAddOn: AddOnService) => {
    setAddOns(prev => prev.map(a => (a.id === updatedAddOn.id ? updatedAddOn : a)));
    try {
      await fetch('/api/addons', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedAddOn),
      });
    } catch (err) {
      console.error('Error updating addOn:', err);
    }
  };

  const deleteAddOn = async (id: string) => {
    setAddOns(prev => prev.filter(a => a.id !== id));
    try {
      await fetch(`/api/addons?id=${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Error deleting addOn:', err);
    }
  };

  return {
    bookings,
    clients,
    packages,
    addOns,
    transactions,
    staffMembers,
    menuItems,
    inventoryItems,
    isLoading,
    isConnected,
    error,
    refreshAll,
    addBooking,
    updateBooking,
    deleteBooking,
    addClient,
    updateClient,
    deleteClient,
    addTransaction,
    deleteTransaction,
    addPackage,
    updatePackage,
    deletePackage,
    addAddOn,
    updateAddOn,
    deleteAddOn,
    setInventoryItems,
  };
}
