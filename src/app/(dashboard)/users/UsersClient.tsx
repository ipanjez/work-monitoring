'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Pencil, Trash2, KeyRound, CheckCircle, XCircle, Search, ShieldCheck, User, ToggleLeft, ToggleRight, Clock, ScrollText, RefreshCw, Download, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMaster } from '@/context/MasterContext';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';

import { defaultRolePermissions, RolePermissionsConfig, hasPermission } from '@/lib/permissions';
import { useNotifications } from '@/context/NotificationContext';

type UserData = { id: string; npk: string; name: string; role: string; status: string; email?: string };
type ResetReq = { id: number; status: string; note: string | null; createdAt: string; user: { npk: string; name: string; role: string } };
type Log = { id: number; action: string; title: string; message: string; type: string; userId?: string; userName?: string; createdAt: string };
type Tab = 'users' | 'requests' | 'logs' | 'roles' | 'feedbacks';

const EMPTY_USER: Partial<UserData & { password: string }> = { npk: '', name: '', role: 'MEMBER', status: 'ACTIVE', password: '', email: '' };

const typeColor: Record<string, string> = {
  info: '#3b82f6',
  warning: '#f59e0b',
  success: '#22c55e',
  error: '#ef4444',
};

const actionLabel: Record<string, string> = {
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  CREATE_USER: 'Tambah User',
  EDIT_USER: 'Edit User',
  DELETE_USER: 'Hapus User',
  RESET_REQUEST: 'Request Reset PW',
  APPROVE_RESET: 'Approve Reset PW',
  REJECT_RESET: 'Tolak Reset PW',
  CREATE_TASK: 'Tambah Task',
  EDIT_TASK: 'Edit Task',
  DELETE_TASK: 'Hapus Task',
};

export default function UsersClient({ userRole = 'ADMIN' }: { userRole?: string }) {
  const { masterPicAvatars } = useMaster();
  const { addActivityLog, notifications, markAsRead } = useNotifications();
  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<UserData[]>([]);
  const [requests, setRequests] = useState<ResetReq[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [logSearch, setLogSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [logPage, setLogPage] = useState(1);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<Partial<UserData & { password: string }> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [approveModal, setApproveModal] = useState<{ req: ResetReq; newPassword: string; note: string } | null>(null);
  const [rejectModal, setRejectModal] = useState<{ req: ResetReq; note: string } | null>(null);
  const [forceResetUser, setForceResetUser] = useState<UserData | null>(null);
  const [forceNewPassword, setForceNewPassword] = useState('');

  const [roleConfig, setRoleConfig] = useState<RolePermissionsConfig>(defaultRolePermissions);
  const [savingRoles, setSavingRoles] = useState(false);

  const fetchFeedbacks = useCallback(async () => {
    const res = await fetch('/api/admin/feedbacks');
    if (res.ok) setFeedbacks(await res.json());
  }, []);


  const fetchUsers = useCallback(async () => {
    const res = await fetch('/api/users');
    if (res.ok) setUsers(await res.json());
  }, []);

  const fetchRequests = useCallback(async () => {
    const res = await fetch('/api/users/reset-requests');
    if (res.ok) setRequests(await res.json());
  }, []);

  const fetchLogs = useCallback(async () => {
    const res = await fetch('/api/logs');
    if (res.ok) setLogs(await res.json());
  }, []);

  const fetchRoles = useCallback(async () => {
    const res = await fetch('/api/settings/permissions');
    if (res.ok) {
      setRoleConfig(await res.json());
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchRequests();
    fetchLogs();
    fetchRoles();
  }, [fetchUsers, fetchRequests, fetchLogs, fetchRoles]);

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;

  const filtered = users.filter(u =>
    u.npk.toLowerCase().includes(search.toLowerCase()) ||
    (u.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const LOGS_PER_PAGE = 50;

  useEffect(() => {
    if (tab === 'feedbacks') {
      fetchFeedbacks();
      notifications.forEach((n: any) => {
        if (!n.isRead && n.title === 'Umpan Balik Baru') {
          markAsRead(n.id);
        }
      });
    }
  }, [tab, fetchFeedbacks, notifications, markAsRead]);

  useEffect(() => {
    setLogPage(1);
  }, [filterType, filterUser, logSearch]);

  const filteredLogs = logs.filter(l => {
    const matchSearch = !logSearch || l.message.toLowerCase().includes(logSearch.toLowerCase()) || (l.userName || '').toLowerCase().includes(logSearch.toLowerCase()) || l.action.toLowerCase().includes(logSearch.toLowerCase());
    const matchType = filterType === 'all' || l.type === filterType;
    const matchUser = filterUser === 'all' || l.userName === filterUser;
    return matchSearch && matchType && matchUser;
  });

  const totalLogPages = Math.ceil(filteredLogs.length / LOGS_PER_PAGE) || 1;
  const paginatedLogs = filteredLogs.slice((logPage - 1) * LOGS_PER_PAGE, logPage * LOGS_PER_PAGE);

  const handleBulkStatus = async (status: 'ACTIVE' | 'INACTIVE') => {
    if (!confirm(`Ubah status ${selectedUserIds.length} user terpilih menjadi ${status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}?`)) return;
    setLoading(true);
    try {
      await Promise.all(selectedUserIds.map(id =>
        fetch(`/api/users/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        })
      ));
      toast.success('Status user terpilih berhasil diperbarui secara massal!');
      setSelectedUserIds([]);
      fetchUsers();
    } catch (e) {
      toast.error('Gagal memperbarui status user secara massal.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Hapus ${selectedUserIds.length} user terpilih secara permanen? Tindakan ini tidak dapat dibatalkan.`)) return;
    setLoading(true);
    try {
      await Promise.all(selectedUserIds.map(id =>
        fetch(`/api/users/${id}`, {
          method: 'DELETE'
        })
      ));
      toast.success('User terpilih berhasil dihapus secara massal!');
      setSelectedUserIds([]);
      fetchUsers();
    } catch (e) {
      toast.error('Gagal menghapus user secara massal.');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => { setEditUser({ ...EMPTY_USER }); setIsNew(true); setShowModal(true); };
  const openEdit = (u: UserData) => { setEditUser({ ...u, password: '' }); setIsNew(false); setShowModal(true); };

  const saveUser = async () => {
    if (!editUser?.npk || !editUser?.name) { toast.error('NPK dan Nama wajib diisi!'); return; }
    if (isNew && !editUser?.password) { toast.error('Password wajib diisi untuk user baru!'); return; }
    setLoading(true);
    try {
      const url = isNew ? '/api/users' : `/api/users/${editUser.id}`;
      const method = isNew ? 'POST' : 'PUT';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editUser) });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Gagal menyimpan.'); return; }
      toast.success(isNew ? 'User berhasil ditambahkan!' : 'User berhasil diperbarui!');
      setShowModal(false);
      fetchUsers();
    } finally { setLoading(false); }
  };

  const deleteUser = async (u: UserData) => {
    if (!confirm(`Hapus user ${u.name} (${u.npk})?`)) return;
    const res = await fetch(`/api/users/${u.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error || 'Gagal menghapus.'); return; }
    toast.success('User berhasil dihapus!');
    fetchUsers();
  };

  const toggleStatus = async (u: UserData) => {
    const newStatus = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const res = await fetch(`/api/users/${u.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
    if (res.ok) {
      const msg = u.status === 'PENDING' ? `Akun ${u.name} berhasil disetujui!` : `Status ${u.name} diubah ke ${newStatus}`;
      toast.success(msg);
      fetchUsers();
    }
    else toast.error('Gagal mengubah status.');
  };

  const submitForceReset = async () => {
    if (!forceResetUser) return;
    if (!forceNewPassword || forceNewPassword.trim().length < 6) {
      toast.error('Password baru wajib diisi minimal 6 karakter!');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${forceResetUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: forceNewPassword.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Gagal mengubah password.');
        return;
      }
      toast.success(`Password ${forceResetUser.name} berhasil diubah secara paksa!`);
      setForceResetUser(null);
      setForceNewPassword('');
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  };

  const approveRequest = async () => {
    if (!approveModal) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/reset-requests/${approveModal.req.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE', newPassword: approveModal.newPassword || undefined, note: approveModal.note }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Gagal menyetujui.'); return; }
      toast.success('Password berhasil direset!');
      setApproveModal(null);
      fetchRequests();
    } finally { setLoading(false); }
  };

  const rejectRequest = async () => {
    if (!rejectModal) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/reset-requests/${rejectModal.req.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REJECT', note: rejectModal.note }),
      });
      if (res.ok) { toast.success('Permintaan ditolak.'); setRejectModal(null); fetchRequests(); }
      else toast.error('Gagal menolak permintaan.');
    } finally { setLoading(false); }
  };

  const handleExportExcel = async () => {
    toast.loading('Mengekspor daftar user...', { id: 'export-excel-users' });
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Daftar User');

      // Define columns
      worksheet.columns = [
        { header: 'NPK', key: 'npk', width: 15 },
        { header: 'Nama Lengkap', key: 'name', width: 30 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Role', key: 'role', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Terakhir Dilihat', key: 'lastActive', width: 22 }
      ];

      // Style header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Calibri' };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF10B981' } // Emerald green
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.height = 25;

      // Add data rows
      users.forEach(u => {
        const row = worksheet.addRow({
          npk: u.npk,
          name: u.name,
          email: u.email || '—',
          role: u.role,
          status: u.status === 'ACTIVE' ? 'Aktif' : u.status === 'INACTIVE' ? 'Nonaktif' : u.status,
          lastActive: (u as any).lastActive ? new Date((u as any).lastActive).toLocaleString('id-ID') : 'Belum aktif'
        });

        // Set row heights and alignment
        row.height = 20;
        row.getCell('npk').alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell('name').alignment = { horizontal: 'left', vertical: 'middle' };
        row.getCell('email').alignment = { horizontal: 'left', vertical: 'middle' };
        row.getCell('role').alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell('status').alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell('lastActive').alignment = { horizontal: 'center', vertical: 'middle' };

        // Apply borders and fonts to cells
        row.eachCell((cell) => {
          cell.font = { size: 10, name: 'Calibri' };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
          };
        });
      });

      // Apply borders to header row
      headerRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF059669' } },
          left: { style: 'thin', color: { argb: 'FF059669' } },
          bottom: { style: 'medium', color: { argb: 'FF059669' } },
          right: { style: 'thin', color: { argb: 'FF059669' } }
        };
      });

      // Generate buffer and trigger download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Daftar_User_Monitoring_Kerja_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Daftar user berhasil diekspor ke Excel!', { id: 'export-excel-users' });
    } catch (e) {
      console.error(e);
      toast.error('Gagal mengekspor data ke Excel.', { id: 'export-excel-users' });
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const statusColor = (s: string) => s === 'PENDING' ? '#f59e0b' : s === 'APPROVED' ? '#22c55e' : '#ef4444';

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Users size={24} style={{ color: 'var(--accent-primary)' }} />
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Sistem User</h1>
        </div>
      </div>

      {/* Tabs */}
      <div id="users-tabs-container" style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '2px solid var(--border-color)', paddingBottom: '0' }}>
        {((['users', 'requests', 'logs', 'roles', ...(userRole === 'ADMIN' ? ['feedbacks'] : [])] as Tab[]).filter(t => t !== 'logs' || hasPermission(roleConfig, 'system_logs', userRole))).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 18px',
              fontWeight: 600,
              fontSize: '14px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: tab === t ? 'var(--accent-primary)' : 'var(--text-secondary)',
              borderBottom: tab === t ? '2px solid var(--accent-primary)' : '2px solid transparent',
              marginBottom: '-2px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {t === 'users' ? (
              <><User size={15} /> Daftar User {users.filter(u => u.status === 'PENDING').length > 0 && <span style={{ background: '#ef4444', color: 'white', borderRadius: '9999px', padding: '1px 7px', fontSize: '11px' }}>{users.filter(u => u.status === 'PENDING').length}</span>}</>
            ) : t === 'requests' ? (
              <><KeyRound size={15} /> Reset Requests {pendingCount > 0 && <span style={{ background: '#ef4444', color: 'white', borderRadius: '9999px', padding: '1px 7px', fontSize: '11px' }}>{pendingCount}</span>}</>
            ) : t === 'logs' ? (
              <><ScrollText size={15} /> Sistem Logs</>
            ) : t === 'roles' ? (
              <><ShieldCheck size={15} /> Edit Role</>
            ) : (
              <><ScrollText size={15} /> Log Umpan Balik {notifications.filter((n: any) => !n.isRead && n.title === 'Umpan Balik Baru').length > 0 && <span style={{ background: '#ef4444', color: 'white', borderRadius: '9999px', padding: '1px 7px', fontSize: '11px' }}>{notifications.filter((n: any) => !n.isRead && n.title === 'Umpan Balik Baru').length}</span>}</>
            )}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {tab === 'users' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div id="users-search-container" style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari NPK atau Nama..." style={{ paddingLeft: '32px' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button id="users-export-btn" className="btn" onClick={handleExportExcel} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', background: '#16a34a', color: 'white', border: 'none', cursor: 'pointer' }}>
                <Download size={16} /> Export Excel
              </button>
              <button id="users-add-btn" className="btn btn-primary" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', cursor: 'pointer' }}>
                <Plus size={16} /> Tambah User
              </button>
            </div>
          </div>

          {selectedUserIds.length > 0 && (
            <div id="users-bulk-bar" style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(59,130,246,0.1)', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid rgba(59,130,246,0.2)', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginRight: 'auto' }}>
                Terpilih: <strong>{selectedUserIds.length}</strong> user
              </span>
              <button
                className="btn btn-secondary"
                onClick={() => handleBulkStatus('ACTIVE')}
                style={{ padding: '6px 12px', fontSize: '12px', background: 'rgba(34,197,94,0.15)', color: '#16a34a', border: 'none', cursor: 'pointer', fontWeight: 600, borderRadius: '6px' }}
              >
                Aktifkan Semua
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => handleBulkStatus('INACTIVE')}
                style={{ padding: '6px 12px', fontSize: '12px', background: 'rgba(239,68,68,0.15)', color: '#dc2626', border: 'none', cursor: 'pointer', fontWeight: 600, borderRadius: '6px' }}
              >
                Nonaktifkan Semua
              </button>
              <button
                className="btn btn-danger"
                onClick={handleBulkDelete}
                style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', cursor: 'pointer' }}
              >
                Hapus Semua
              </button>
            </div>
          )}

          <div id="users-table-container" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '10px 12px', width: '40px', textAlign: 'left' }}>
                    <input
                      type="checkbox"
                      checked={filtered.length > 0 && selectedUserIds.length === filtered.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUserIds(filtered.map(u => u.id));
                        } else {
                          setSelectedUserIds([]);
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                  {['NPK', 'Nama', 'Role', 'Terakhir Dilihat', 'Status', 'Aksi'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px' }}>
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(u.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUserIds(prev => [...prev, u.id]);
                          } else {
                            setSelectedUserIds(prev => prev.filter(id => id !== u.id));
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {masterPicAvatars[u.name] ? (
                        <img
                          src={masterPicAvatars[u.name]}
                          alt={u.name}
                          style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                        />
                      ) : (
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', flexShrink: 0 }}>
                          {u.name ? u.name.charAt(0).toUpperCase() : '?'}
                        </div>
                      )}
                      <span>{u.npk}</span>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-primary)' }}>{u.name}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, background: u.role === 'ADMIN' ? 'rgba(139,92,246,0.15)' : 'rgba(59,130,246,0.12)', color: u.role === 'ADMIN' ? '#7c3aed' : '#2563eb' }}>
                        {u.role === 'ADMIN' ? <ShieldCheck size={12} /> : <User size={12} />} {roleConfig.labels[u.role] || u.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {(u as any).lastActive ? new Date((u as any).lastActive).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Belum aktif'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {u.status === 'PENDING' ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => toggleStatus(u)} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, border: 'none', cursor: 'pointer', background: 'rgba(34,197,94,0.12)', color: '#16a34a' }}>
                            <CheckCircle size={12} /> Setujui
                          </button>
                          <button onClick={() => deleteUser(u)} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, border: 'none', cursor: 'pointer', background: 'rgba(239,68,68,0.12)', color: '#dc2626' }}>
                            <XCircle size={12} /> Tolak
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => toggleStatus(u)} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', background: u.status === 'ACTIVE' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: u.status === 'ACTIVE' ? '#16a34a' : '#dc2626' }}>
                          {u.status === 'ACTIVE' ? <ToggleRight size={14} /> : <ToggleLeft size={14} />} {u.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                        </button>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn" onClick={() => openEdit(u)} title="Edit" style={{ padding: '6px 10px', fontSize: '12px', cursor: 'pointer' }}><Pencil size={13} /></button>
                        {u.role === 'MEMBER' && (
                          <button className="btn" onClick={() => setForceResetUser(u)} title="Ganti Password Paksa" style={{ padding: '6px 10px', fontSize: '12px', color: 'var(--accent-primary)', cursor: 'pointer' }}>
                            <KeyRound size={13} />
                          </button>
                        )}
                        <button className="btn" onClick={() => deleteUser(u)} title="Hapus" style={{ padding: '6px 10px', fontSize: '12px', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>Tidak ada user ditemukan.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Reset Requests Tab */}
      {tab === 'requests' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                {['NPK', 'Nama', 'Waktu Request', 'Status', 'Catatan', 'Aksi'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 600 }}>{r.user.npk}</td>
                  <td style={{ padding: '12px', color: 'var(--text-primary)' }}>{r.user.name}</td>
                  <td style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Clock size={12} /> {formatDate(r.createdAt)}</span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, background: `${statusColor(r.status)}22`, color: statusColor(r.status) }}>{r.status}</span>
                  </td>
                  <td style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '12px' }}>{r.note || '—'}</td>
                  <td style={{ padding: '12px' }}>
                    {r.status === 'PENDING' && (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-primary" onClick={() => setApproveModal({ req: r, newPassword: '', note: '' })} style={{ padding: '6px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={13} /> Setujui</button>
                        <button className="btn" onClick={() => setRejectModal({ req: r, note: '' })} style={{ padding: '6px 10px', fontSize: '12px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}><XCircle size={13} /> Tolak</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>Tidak ada permintaan reset password.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Logs Tab */}
      {tab === 'logs' && (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '10px', flex: '1', minWidth: '320px', maxWidth: '640px' }}>
              <div style={{ position: 'relative', flex: '1' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input className="input" value={logSearch} onChange={e => setLogSearch(e.target.value)} placeholder="Cari log..." style={{ paddingLeft: '32px' }} />
              </div>
              <select className="input" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ width: '130px' }}>
                <option value="all">Semua Tipe</option>
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
              <select className="input" value={filterUser} onChange={e => setFilterUser(e.target.value)} style={{ width: '150px' }}>
                <option value="all">Semua User</option>
                {Array.from(new Set(users.map(u => u.name).filter(Boolean))).map(uName => (
                  <option key={uName} value={uName}>{uName}</option>
                ))}
              </select>
            </div>
            <button className="btn" onClick={fetchLogs} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '13px', cursor: 'pointer' }}>
              <RefreshCw size={14} /> Refresh Logs
            </button>
          </div>

          {/* Logs Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', tableLayout: 'fixed' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '10px 12px', width: '160px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase' }}>Waktu</th>
                  <th style={{ padding: '10px 12px', width: '150px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase' }}>User</th>
                  <th style={{ padding: '10px 12px', width: '120px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase' }}>Aksi</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase' }}>Detail</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.map(l => (
                  <tr key={l.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontSize: '12px' }}>
                      {new Date(l.createdAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-primary)', fontWeight: 500 }}>{l.userName || '—'}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span
                        title={actionLabel[l.action] || l.action}
                        style={{ display: 'inline-block', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: `${typeColor[l.type] || '#6b7280'}20`, color: typeColor[l.type] || '#6b7280', whiteSpace: 'nowrap' }}
                      >
                        {actionLabel[l.action] || l.action}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', wordBreak: 'break-word', whiteSpace: 'normal' }}>{l.message}</td>
                  </tr>
                ))}
                {paginatedLogs.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Tidak ada log yang ditemukan.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Menampilkan {paginatedLogs.length} dari {filteredLogs.length} log (Halaman {logPage} dari {totalLogPages})
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn"
                onClick={() => setLogPage(prev => Math.max(prev - 1, 1))}
                disabled={logPage === 1}
                style={{ padding: '6px 12px', fontSize: '12px', cursor: logPage === 1 ? 'not-allowed' : 'pointer' }}
              >
                Sebelumnya
              </button>
              <button
                className="btn"
                onClick={() => setLogPage(prev => Math.min(prev + 1, totalLogPages))}
                disabled={logPage === totalLogPages}
                style={{ padding: '6px 12px', fontSize: '12px', cursor: logPage === totalLogPages ? 'not-allowed' : 'pointer' }}
              >
                Selanjutnya
              </button>
            </div>
          </div>
        </>
      )}

      {/* Roles Tab */}
      {tab === 'roles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} style={{ color: 'var(--accent-primary)' }} /> Matriks Akses Role
              </h2>
              {userRole === 'ADMIN' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      const newKey = `ROLE_${Date.now()}`;
                      setRoleConfig(prev => ({
                        ...prev,
                        labels: { ...prev.labels, [newKey]: 'Role Baru' }
                      }));
                    }}
                    disabled={savingRoles}
                  >
                    <Plus size={16} style={{ marginRight: '4px' }} /> Tambah Role
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={async () => {
                      setSavingRoles(true);
                      try {
                        const res = await fetch('/api/settings/permissions', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(roleConfig)
                        });
                        if (res.ok) toast.success('Matriks Role berhasil disimpan');
                        else toast.error('Gagal menyimpan matriks role');
                      } catch (e) {
                        toast.error('Gagal menyimpan matriks role');
                      } finally {
                        setSavingRoles(false);
                      }
                    }}
                    disabled={savingRoles}
                  >
                    {savingRoles ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              )}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)', borderRight: '1px solid var(--border-color)' }}>Fitur / Hak Akses</th>
                  {Object.keys(roleConfig.labels).map(rk => (
                    <th key={rk} style={{ padding: '12px', textAlign: 'center', fontWeight: 700, borderRight: '1px solid var(--border-color)' }}>
                      {userRole === 'ADMIN' ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <input
                            className="input"
                            style={{ padding: '4px 8px', fontSize: '13px', textAlign: 'center', width: '100px', fontWeight: 600 }}
                            value={roleConfig.labels[rk] || ''}
                            onChange={(e) => {
                              setRoleConfig({
                                ...roleConfig,
                                labels: { ...roleConfig.labels, [rk]: e.target.value }
                              });
                            }}
                          />
                          {rk !== 'ADMIN' && (
                            <button
                              onClick={() => {
                                if (confirm(`Hapus role ${roleConfig.labels[rk]}?`)) {
                                  const newLabels = { ...roleConfig.labels };
                                  delete newLabels[rk];
                                  setRoleConfig({ ...roleConfig, labels: newLabels });
                                }
                              }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      ) : (
                        roleConfig.labels[rk] || rk
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { key: 'view_dashboard', label: 'Melihat Dashboard & Board' },
                  { key: 'view_detail', label: 'Melihat Detail Tugas & Lampiran' },
                  { key: 'manage_task', label: 'Menambah/Mengedit Tugas' },
                  { key: 'delete_task', label: 'Hapus Tugas / Edit Massal (Bulk)' },
                  { key: 'upload_comment', label: 'Upload Lampiran & Komentar' },
                  { key: 'export_data', label: 'Export Data (Excel, PDF, Salin Gambar)' },
                  { key: 'master_data', label: 'Akses Pengaturan (Master Data)' },
                  { key: 'user_management', label: 'Manajemen User & Password' },
                  { key: 'system_logs', label: 'Melihat Sistem Log Lengkap' },
                  { key: 'admin_feedback', label: 'Akses Umpan Balik (Admin)' },
                  { key: 'database_backup', label: 'Cadangan & Pulihkan Database' },
                  { key: 'system_config', label: 'Konfigurasi Limit & Sesi (System Config)' }
                ].map(feature => (
                  <tr key={feature.key} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)', borderRight: '1px solid var(--border-color)' }}><strong>{feature.label}</strong></td>
                    {Object.keys(roleConfig.labels).map(rk => {
                      const hasPerm = !!roleConfig.permissions[feature.key]?.includes(rk);
                      return (
                        <td key={rk} style={{ padding: '12px', textAlign: 'center', borderRight: '1px solid var(--border-color)' }}>
                          {userRole === 'ADMIN' ? (
                            <input
                              type="checkbox"
                              checked={hasPerm}
                              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setRoleConfig(prev => {
                                  const list = prev.permissions[feature.key] || [];
                                  return {
                                    ...prev,
                                    permissions: {
                                      ...prev.permissions,
                                      [feature.key]: checked ? [...list, rk] : list.filter(r => r !== rk)
                                    }
                                  };
                                });
                              }}
                            />
                          ) : (
                            hasPerm ? <CheckCircle size={18} color="#10b981" style={{ margin: '0 auto' }} /> : <XCircle size={18} color="#ef4444" style={{ margin: '0 auto' }} />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Feedbacks Tab */}
      {tab === 'feedbacks' && userRole === 'ADMIN' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ScrollText size={20} style={{ color: 'var(--accent-primary)' }} /> Log Umpan Balik Pengguna
            </h2>
            {feedbacks.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Belum ada umpan balik yang dikirimkan.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>Tanggal</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>Pengirim (Email / User)</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>Pesan Umpan Balik</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbacks.map((f: any) => {
                    let sender = f.userName || 'Anonim';
                    let cleanMsg = f.message;
                    const matches = f.message.match(/Feedback dari ([^:]+): "([\s\S]+)"/);
                    if (matches) {
                      sender = matches[1];
                      cleanMsg = matches[2];
                    }
                    return (
                      <tr key={f.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {new Date(f.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--text-primary)' }}>
                          <span className={`badge ${sender === 'Anonim' ? 'badge-todo' : 'badge-success'}`}>
                            {sender}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                          {cleanMsg}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Modal Tambah/Edit User */}
      {showModal && editUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '460px', padding: '28px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>{isNew ? 'Tambah User Baru' : `Edit User: ${editUser.name}`}</h2>
            {[
              { label: 'NPK', key: 'npk', placeholder: 'PKT-001', type: 'text' },
              { label: 'Nama', key: 'name', placeholder: 'Nama lengkap', type: 'text' },
              { label: 'Email (opsional)', key: 'email', placeholder: 'email@pkt.co.id', type: 'email' },
              { label: isNew ? 'Password' : 'Password Baru (kosongkan jika tidak diubah)', key: 'password', placeholder: '••••••', type: 'password' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>{f.label}</label>
                <input type={f.type} className="input" placeholder={f.placeholder} value={(editUser as any)[f.key] || ''} onChange={e => setEditUser({ ...editUser, [f.key]: e.target.value })} />
              </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>Role</label>
                <select className="input" value={editUser.role || 'MEMBER'} onChange={e => setEditUser({ ...editUser, role: e.target.value })}>
                  {Object.entries(roleConfig.labels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>Status</label>
                <select className="input" value={editUser.status || 'ACTIVE'} onChange={e => setEditUser({ ...editUser, status: e.target.value })}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button className="btn" onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={saveUser} disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Approve Reset */}
      {approveModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '420px', padding: '28px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>Setujui Reset Password</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Atur password baru untuk <strong>{approveModal.req.user.name}</strong> ({approveModal.req.user.npk})</p>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>Password Baru (Opsional)</label>
              <input type="text" className="input" placeholder="Kosongkan untuk menggunakan password pilihan member" value={approveModal.newPassword} onChange={e => setApproveModal({ ...approveModal, newPassword: e.target.value })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>Catatan (opsional)</label>
              <input type="text" className="input" placeholder="Catatan untuk user" value={approveModal.note} onChange={e => setApproveModal({ ...approveModal, note: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setApproveModal(null)}>Batal</button>
              <button className="btn btn-primary" onClick={approveRequest} disabled={loading}>{loading ? 'Menyimpan...' : 'Setujui & Reset'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reject Reset */}
      {rejectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '420px', padding: '28px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>Tolak Permintaan Reset</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Permintaan dari <strong>{rejectModal.req.user.name}</strong> akan ditolak.</p>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>Alasan (opsional)</label>
              <input type="text" className="input" placeholder="Alasan penolakan" value={rejectModal.note} onChange={e => setRejectModal({ ...rejectModal, note: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setRejectModal(null)}>Batal</button>
              <button className="btn" onClick={rejectRequest} disabled={loading} style={{ color: '#ef4444' }}>{loading ? 'Memproses...' : 'Tolak Permintaan'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Force Reset Password */}
      {forceResetUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '420px', padding: '28px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>Ganti Password Paksa (Force Reset)</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Ubah password untuk <strong>{forceResetUser.name}</strong> ({forceResetUser.npk}) secara langsung.</p>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>Password Baru</label>
              <input type="text" className="input" placeholder="Minimal 6 karakter" value={forceNewPassword} onChange={e => setForceNewPassword(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => { setForceResetUser(null); setForceNewPassword(''); }}>Batal</button>
              <button className="btn btn-primary" onClick={submitForceReset} disabled={loading}>{loading ? 'Menyimpan...' : 'Ganti Password'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
