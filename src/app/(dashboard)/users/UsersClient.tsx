'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Users, Plus, Pencil, Trash2, KeyRound, CheckCircle, XCircle, Search,
  ShieldCheck, User, ToggleLeft, ToggleRight, Clock, ScrollText, RefreshCw,
  Download, X, Info, MapPin, Layers, Settings, FileText, CheckSquare,
  Share2, Shield, HelpCircle, ExternalLink, Sparkles, ArrowUpDown, ArrowUp, ArrowDown, ShieldAlert,
  ChevronDown, Check
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { useMaster } from '@/context/MasterContext';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';

import {
  defaultRolePermissions, RolePermissionsConfig, hasPermission,
  PERMISSION_CATEGORIES, PERMISSION_FEATURE_DETAILS, PermissionFeatureDetail,
  getRoleIconName, getRoleColor
} from '@/lib/permissions';

const CustomSelect = ({ 
  value, 
  onChange, 
  options, 
  style,
  align = 'left'
}: { 
  value: string; 
  onChange: (val: string) => void; 
  options: { label: string, value: string }[]; 
  style?: React.CSSProperties;
  align?: 'left' | 'right';
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div style={{ position: 'relative', width: '100%', ...style }} ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          background: 'var(--input-bg)',
          border: '1px solid var(--border-color)',
          padding: '6px 12px',
          borderRadius: '8px',
          fontSize: '13px',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          boxShadow: isOpen ? '0 0 0 3px rgba(59, 130, 246, 0.15)' : 'none',
          borderColor: isOpen ? 'var(--accent-primary)' : 'var(--border-color)',
          transition: 'all 0.2s',
          whiteSpace: 'nowrap'
        }}
      >
        {options.find(o => o.value === value)?.label || value}
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} style={{ display: 'flex', flexShrink: 0 }}>
          <ChevronDown size={14} style={{ opacity: 0.5 }} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              ...(align === 'right' ? { right: 0 } : { left: 0 }),
              minWidth: '160px',
              background: 'var(--surface-color)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              zIndex: 9999,
              maxHeight: '220px',
              overflowY: 'auto',
              padding: '4px'
            }}
            className="custom-scrollbar"
          >
            {options.map((opt, idx) => {
              const isSelected = value === opt.value;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 10px',
                    background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                    border: 'none',
                    fontSize: '13px',
                    color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                    fontWeight: isSelected ? 600 : 500,
                    cursor: 'pointer',
                    borderRadius: '4px',
                    transition: 'background 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {opt.label}
                  {isSelected && <Check size={14} />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

import { useNotifications } from '@/context/NotificationContext';
import Avatar from '@/components/Avatar';
import RoleBadge, { RoleIconRenderer } from '@/components/RoleBadge';
import RoleCustomizationModal from '@/components/RoleCustomizationModal';

type UserData = { id: string; npk: string; name: string; role: string; status: string; email?: string; image?: string; lastActive?: string };
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

export default function UsersClient({ userRole: initialUserRole = '' }: { userRole?: string }) {
  const { data: session } = useSession();
  const { masterPicAvatars, masterColors, roleConfig: masterRoleConfig } = useMaster();
  const { addActivityLog, notifications, markAsRead } = useNotifications();
  const [profileRole, setProfileRole] = useState('');
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

  // Role Customization Modal state
  const [editingRoleCustomizationKey, setEditingRoleCustomizationKey] = useState<string | null>(null);

  // Sorting states
  const [userSortField, setUserSortField] = useState<'npk' | 'name' | 'role' | 'lastActive' | 'status'>('npk');
  const [userSortOrder, setUserSortOrder] = useState<'asc' | 'desc'>('asc');
  const [reqSortField, setReqSortField] = useState<'npk' | 'name' | 'createdAt' | 'status' | 'note'>('createdAt');
  const [reqSortOrder, setReqSortOrder] = useState<'asc' | 'desc'>('desc');
  const [logSortField, setLogSortField] = useState<'createdAt' | 'userName' | 'action' | 'message'>('createdAt');
  const [logSortOrder, setLogSortOrder] = useState<'asc' | 'desc'>('desc');
  const [fbSortField, setFbSortField] = useState<'createdAt' | 'sender' | 'message'>('createdAt');
  const [fbSortOrder, setFbSortOrder] = useState<'asc' | 'desc'>('desc');
  const [fbSearch, setFbSearch] = useState('');
  const [selectedFeedbackIds, setSelectedFeedbackIds] = useState<number[]>([]);

  const [roleConfig, setRoleConfig] = useState<RolePermissionsConfig>(masterRoleConfig || defaultRolePermissions);
  const [savingRoles, setSavingRoles] = useState(false);
  const [selectedFeatureInfo, setSelectedFeatureInfo] = useState<PermissionFeatureDetail | null>(null);

  useEffect(() => {
    fetch('/api/users/profile')
      .then(res => res.json())
      .then(data => {
        if (data && data.role) setProfileRole(data.role);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (masterRoleConfig && Object.keys(masterRoleConfig.labels || {}).length > 0) {
      setRoleConfig(masterRoleConfig);
    }
  }, [masterRoleConfig]);

  const userRole = profileRole || (session?.user as any)?.role || initialUserRole;

  const canUserMgmt = hasPermission(roleConfig, 'user_management', userRole);
  const canSystemLogs = hasPermission(roleConfig, 'system_logs', userRole);
  const canAdminFeedback = hasPermission(roleConfig, 'admin_feedback', userRole);

  const availableTabs: Tab[] = [
    ...(canUserMgmt ? (['users', 'requests', 'roles'] as Tab[]) : []),
    ...(canSystemLogs ? (['logs'] as Tab[]) : []),
    ...(canAdminFeedback ? (['feedbacks'] as Tab[]) : [])
  ];

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
    if (availableTabs.length > 0 && !availableTabs.includes(tab)) {
      setTab(availableTabs[0]);
    }
  }, [availableTabs, tab]);

  useEffect(() => {
    if (canUserMgmt) {
      fetchUsers();
      fetchRequests();
    }
    if (canSystemLogs) {
      fetchLogs();
    }
    if (canAdminFeedback) {
      fetchFeedbacks();
    }
    fetchRoles();
  }, [canUserMgmt, canSystemLogs, canAdminFeedback, fetchUsers, fetchRequests, fetchLogs, fetchFeedbacks, fetchRoles]);

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;

  const handleUserSort = (field: 'npk' | 'name' | 'role' | 'lastActive' | 'status') => {
    if (userSortField === field) {
      setUserSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setUserSortField(field);
      setUserSortOrder('asc');
    }
  };

  const handleReqSort = (field: 'npk' | 'name' | 'createdAt' | 'status' | 'note') => {
    if (reqSortField === field) {
      setReqSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setReqSortField(field);
      setReqSortOrder('asc');
    }
  };

  const handleLogSort = (field: 'createdAt' | 'userName' | 'action' | 'message') => {
    if (logSortField === field) {
      setLogSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setLogSortField(field);
      setLogSortOrder('asc');
    }
  };

  const handleFbSort = (field: 'createdAt' | 'sender' | 'message') => {
    if (fbSortField === field) {
      setFbSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setFbSortField(field);
      setFbSortOrder('asc');
    }
  };

  const renderSortHeader = (label: string, field: string, currentField: string, currentOrder: 'asc' | 'desc', onSort: (f: any) => void, width?: string) => {
    const isActive = currentField === field;
    return (
      <th
        onClick={() => onSort(field)}
        style={{
          padding: '10px 12px',
          width,
          textAlign: 'left',
          fontWeight: 600,
          color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
          fontSize: '12px',
          textTransform: 'uppercase',
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'all 0.15s ease'
        }}
        title={`Klik untuk mengurutkan berdasarkan ${label}`}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span>{label}</span>
          {isActive ? (
            currentOrder === 'asc' ? (
              <ArrowUp size={13} style={{ color: 'var(--accent-primary)' }} />
            ) : (
              <ArrowDown size={13} style={{ color: 'var(--accent-primary)' }} />
            )
          ) : (
            <ArrowUpDown size={12} style={{ opacity: 0.35 }} />
          )}
        </div>
      </th>
    );
  };

  const filtered = users.filter(u =>
    u.npk.toLowerCase().includes(search.toLowerCase()) ||
    (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (roleConfig.labels[u.role] || u.role).toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    let valA: any = (a as any)[userSortField] || '';
    let valB: any = (b as any)[userSortField] || '';
    if (userSortField === 'lastActive') {
      valA = (a as any).lastActive ? new Date((a as any).lastActive).getTime() : 0;
      valB = (b as any).lastActive ? new Date((b as any).lastActive).getTime() : 0;
      return userSortOrder === 'asc' ? valA - valB : valB - valA;
    }
    if (userSortField === 'role') {
      valA = roleConfig.labels[a.role] || a.role;
      valB = roleConfig.labels[b.role] || b.role;
    }
    valA = String(valA).toLowerCase();
    valB = String(valB).toLowerCase();
    if (valA < valB) return userSortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return userSortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const sortedRequests = [...requests].sort((a, b) => {
    let valA: any = '';
    let valB: any = '';
    if (reqSortField === 'npk') {
      valA = a.user.npk;
      valB = b.user.npk;
    } else if (reqSortField === 'name') {
      valA = a.user.name;
      valB = b.user.name;
    } else if (reqSortField === 'createdAt') {
      valA = new Date(a.createdAt).getTime();
      valB = new Date(b.createdAt).getTime();
      return reqSortOrder === 'asc' ? valA - valB : valB - valA;
    } else if (reqSortField === 'status') {
      valA = a.status;
      valB = b.status;
    } else if (reqSortField === 'note') {
      valA = a.note || '';
      valB = b.note || '';
    }
    valA = String(valA).toLowerCase();
    valB = String(valB).toLowerCase();
    if (valA < valB) return reqSortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return reqSortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const LOGS_PER_PAGE = 50;

  useEffect(() => {
    if (tab === 'feedbacks') {
      fetchFeedbacks();
      notifications.forEach((n: any) => {
        if (!n.isRead && n.title === 'Umpan Balik Baru') {
          markAsRead(n.id);
        }
      });
    } else if (tab === 'users') {
      notifications.forEach((n: any) => {
        if (!n.isRead && n.title === 'Registrasi User Baru') {
          markAsRead(n.id);
        }
      });
    } else if (tab === 'requests') {
      notifications.forEach((n: any) => {
        if (!n.isRead && n.title === 'Permintaan Reset Password') {
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
  }).sort((a, b) => {
    let valA: any = (a as any)[logSortField] || '';
    let valB: any = (b as any)[logSortField] || '';
    if (logSortField === 'createdAt') {
      valA = new Date(a.createdAt).getTime();
      valB = new Date(b.createdAt).getTime();
      return logSortOrder === 'asc' ? valA - valB : valB - valA;
    }
    valA = String(valA).toLowerCase();
    valB = String(valB).toLowerCase();
    if (valA < valB) return logSortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return logSortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredFeedbacks = feedbacks.filter((f: any) => {
    if (!fbSearch.trim()) return true;
    const q = fbSearch.toLowerCase();
    const matches = f.message.match(/Feedback dari ([^:]+): "([\s\S]+)"/);
    const sender = matches ? matches[1] : (f.userName || 'Anonim');
    const cleanMsg = matches ? matches[2] : f.message;
    return sender.toLowerCase().includes(q) || cleanMsg.toLowerCase().includes(q) || (f.createdAt && f.createdAt.toLowerCase().includes(q));
  }).sort((a: any, b: any) => {
    let valA: any = '';
    let valB: any = '';
    const matchesA = a.message.match(/Feedback dari ([^:]+): "([\s\S]+)"/);
    const senderA = matchesA ? matchesA[1] : (a.userName || 'Anonim');
    const msgA = matchesA ? matchesA[2] : a.message;

    const matchesB = b.message.match(/Feedback dari ([^:]+): "([\s\S]+)"/);
    const senderB = matchesB ? matchesB[1] : (b.userName || 'Anonim');
    const msgB = matchesB ? matchesB[2] : b.message;

    if (fbSortField === 'createdAt') {
      valA = new Date(a.createdAt).getTime();
      valB = new Date(b.createdAt).getTime();
      return fbSortOrder === 'asc' ? valA - valB : valB - valA;
    } else if (fbSortField === 'sender') {
      valA = senderA;
      valB = senderB;
    } else if (fbSortField === 'message') {
      valA = msgA;
      valB = msgB;
    }
    valA = String(valA).toLowerCase();
    valB = String(valB).toLowerCase();
    if (valA < valB) return fbSortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return fbSortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleDeleteSingleFeedback = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus log umpan balik ini?')) return;
    try {
      const res = await fetch('/api/admin/feedbacks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!res.ok) throw new Error('Gagal menghapus');
      toast.success('Log umpan balik berhasil dihapus');
      setSelectedFeedbackIds(prev => prev.filter(item => item !== id));
      fetchFeedbacks();
    } catch (e) {
      toast.error('Gagal menghapus log umpan balik');
    }
  };

  const handleBulkDeleteFeedbacks = async () => {
    if (selectedFeedbackIds.length === 0) return;
    if (!confirm(`Hapus ${selectedFeedbackIds.length} log umpan balik terpilih? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      const res = await fetch('/api/admin/feedbacks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedFeedbackIds })
      });
      if (!res.ok) throw new Error('Gagal menghapus');
      toast.success(`${selectedFeedbackIds.length} log umpan balik berhasil dihapus!`);
      setSelectedFeedbackIds([]);
      fetchFeedbacks();
    } catch (e) {
      toast.error('Gagal menghapus log umpan balik terpilih');
    }
  };

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

      {availableTabs.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 24px',
          background: 'var(--surface-color)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          marginTop: '20px'
        }}>
          <ShieldAlert size={48} style={{ color: '#ef4444', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Akses Ditolak
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '460px', margin: '0 auto 20px' }}>
            Role Anda saat ini tidak memiliki izin untuk mengakses menu Sistem User. Hubungi Administrator untuk memperbarui hak akses pada matriks role.
          </p>
          <Link href="/" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            Kembali ke Dashboard
          </Link>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div id="users-tabs-container" className="no-scrollbar" style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '2px solid var(--border-color)', paddingBottom: '0', overflowX: 'auto', whiteSpace: 'nowrap', WebkitOverflowScrolling: 'touch' }}>
            {availableTabs.map(t => (
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
              flexShrink: 0
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
                  {renderSortHeader('NPK', 'npk', userSortField, userSortOrder, handleUserSort, '120px')}
                  {renderSortHeader('Nama', 'name', userSortField, userSortOrder, handleUserSort)}
                  {renderSortHeader('Role', 'role', userSortField, userSortOrder, handleUserSort, '140px')}
                  {renderSortHeader('Terakhir Dilihat', 'lastActive', userSortField, userSortOrder, handleUserSort, '180px')}
                  {renderSortHeader('Status', 'status', userSortField, userSortOrder, handleUserSort, '130px')}
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', width: '130px' }}>Aksi</th>
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
                      <Avatar
                        name={u.name}
                        src={u.image || masterPicAvatars[u.name]}
                        size={28}
                        masterColors={masterColors}
                      />
                      <span>{u.npk}</span>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-primary)' }}>{u.name}</td>
                    <td style={{ padding: '12px' }}>
                      <RoleBadge role={u.role} config={roleConfig} />
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
                        {u.npk !== 'guest' && u.email !== 'guest@monitoring.internal' && (
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
        <div id="users-requests-container" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                {renderSortHeader('NPK', 'npk', reqSortField, reqSortOrder, handleReqSort, '120px')}
                {renderSortHeader('Nama', 'name', reqSortField, reqSortOrder, handleReqSort)}
                {renderSortHeader('Waktu Request', 'createdAt', reqSortField, reqSortOrder, handleReqSort, '180px')}
                {renderSortHeader('Status', 'status', reqSortField, reqSortOrder, handleReqSort, '130px')}
                {renderSortHeader('Catatan', 'note', reqSortField, reqSortOrder, handleReqSort)}
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', width: '150px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {sortedRequests.map(r => (
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
        <div id="users-logs-container">
          {/* Filters */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '10px', flex: '1', minWidth: '320px', maxWidth: '640px' }}>
              <div style={{ position: 'relative', flex: '1' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input className="input" value={logSearch} onChange={e => setLogSearch(e.target.value)} placeholder="Cari log..." style={{ paddingLeft: '32px' }} />
              </div>
              <CustomSelect 
                value={filterType} 
                onChange={setFilterType} 
                options={[
                  { label: 'Semua Tipe', value: 'all' },
                  { label: 'Info', value: 'info' },
                  { label: 'Success', value: 'success' },
                  { label: 'Warning', value: 'warning' },
                  { label: 'Error', value: 'error' }
                ]}
                style={{ width: '130px' }} 
              />
              <CustomSelect 
                value={filterUser} 
                onChange={setFilterUser} 
                options={[
                  { label: 'Semua User', value: 'all' },
                  ...Array.from(new Set(users.map(u => u.name).filter(Boolean))).map(uName => ({ label: uName as string, value: uName as string }))
                ]}
                style={{ width: '150px' }} 
                align="right"
              />
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
                  {renderSortHeader('Waktu', 'createdAt', logSortField, logSortOrder, handleLogSort, '180px')}
                  {renderSortHeader('User', 'userName', logSortField, logSortOrder, handleLogSort, '160px')}
                  {renderSortHeader('Aksi', 'action', logSortField, logSortOrder, handleLogSort, '140px')}
                  {renderSortHeader('Detail', 'message', logSortField, logSortOrder, handleLogSort)}
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
        </div>
      )}

      {/* Roles Tab */}
      {tab === 'roles' && (
        <div id="users-roles-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <ShieldCheck size={22} style={{ color: 'var(--accent-primary)' }} /> Matriks Akses Role & Hak Izin Fitur
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                  Kelola hak akses setiap role pengguna terhadap fitur aplikasi. Klik ikon <Info size={14} style={{ display: 'inline', verticalAlign: '-2px', color: 'var(--accent-primary)' }} /> untuk melihat lokasi menu dan rincian fungsinya.
                </p>
              </div>
              {canUserMgmt && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      const newKey = `ROLE_${Date.now()}`;
                      setRoleConfig(prev => ({
                        ...prev,
                        labels: { ...prev.labels, [newKey]: 'Role Baru' },
                        icons: { ...(prev.icons || {}), [newKey]: 'User' },
                        colors: { ...(prev.colors || {}), [newKey]: '#3b82f6' }
                      }));
                    }}
                    disabled={savingRoles}
                    style={{ padding: '6px 12px', fontSize: '12px', height: '32px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Plus size={14} /> Tambah Role
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
                        if (res.ok) {
                          toast.success('Matriks Role berhasil disimpan!');
                          localStorage.setItem('role_config', JSON.stringify(roleConfig));
                          window.dispatchEvent(new CustomEvent('masterUpdated', { detail: { roleConfig } }));
                          window.dispatchEvent(new Event('masterUpdated'));
                          fetchRoles();
                        } else {
                          const errData = await res.json().catch(() => ({}));
                          toast.error(errData.error || 'Gagal menyimpan matriks role');
                        }
                      } catch (e) {
                        toast.error('Gagal menyimpan matriks role');
                      } finally {
                        setSavingRoles(false);
                      }
                    }}
                    disabled={savingRoles}
                    style={{ padding: '6px 12px', fontSize: '12px', height: '32px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    {savingRoles ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              )}
            </div>

            <div style={{ overflowX: 'auto', margin: '0 -24px', padding: '0 24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)', borderRight: '1px solid var(--border-color)', width: '380px', minWidth: '320px' }}>
                    Fitur & Lokasi Menu
                  </th>
                  {Object.keys(roleConfig.labels).map(rk => (
                    <th key={rk} style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 700, borderRight: '1px solid var(--border-color)', minWidth: '135px' }}>
                      {canUserMgmt ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                            <button
                              type="button"
                              onClick={() => setEditingRoleCustomizationKey(rk)}
                              title="Klik untuk kustom ikon & warna role"
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '8px',
                                backgroundColor: `${getRoleColor(roleConfig, rk)}20`,
                                border: `1px solid ${getRoleColor(roleConfig, rk)}50`,
                                color: getRoleColor(roleConfig, rk),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                flexShrink: 0
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.12)')}
                              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                            >
                              <RoleIconRenderer iconName={getRoleIconName(roleConfig, rk)} size={14} color={getRoleColor(roleConfig, rk)} />
                            </button>
                            <input
                              className="input"
                              style={{ padding: '4px 6px', fontSize: '12px', textAlign: 'center', width: '82px', fontWeight: 600 }}
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
                                    const newIcons = { ...(roleConfig.icons || {}) };
                                    delete newIcons[rk];
                                    const newColors = { ...(roleConfig.colors || {}) };
                                    delete newColors[rk];
                                    const newPermissions = { ...(roleConfig.permissions || {}) };
                                    Object.keys(newPermissions).forEach(permKey => {
                                      newPermissions[permKey] = (newPermissions[permKey] || []).filter(roleKey => roleKey !== rk);
                                    });
                                    setRoleConfig({
                                      ...roleConfig,
                                      labels: newLabels,
                                      icons: newIcons,
                                      colors: newColors,
                                      permissions: newPermissions
                                    });
                                  }
                                }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '2px' }}
                                title="Hapus Role"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const res = await fetch('/api/users/profile', {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ role: rk })
                                });
                                if (!res.ok) throw new Error('Gagal berpindah role');
                                toast.success(`Berhasil berpindah ke role ${roleConfig.labels[rk] || rk}!`);
                                window.dispatchEvent(new Event('profileUpdated'));
                                window.dispatchEvent(new Event('masterUpdated'));
                              } catch (e: any) {
                                toast.error(e.message || 'Gagal berpindah role');
                              }
                            }}
                            style={{
                              background: userRole === rk ? 'var(--accent-primary)' : 'rgba(59, 130, 246, 0.08)',
                              color: userRole === rk ? '#ffffff' : 'var(--accent-primary)',
                              border: userRole === rk ? '1px solid var(--accent-primary)' : '1px solid rgba(59, 130, 246, 0.3)',
                              borderRadius: '6px',
                              padding: '2px 8px',
                              fontSize: '10.5px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s ease'
                            }}
                            title={`Uji coba / simulasikan role ${roleConfig.labels[rk] || rk} pada akun Anda saat ini`}
                          >
                            <Sparkles size={11} /> {userRole === rk ? 'Aktif Saat Ini' : 'Uji Coba Role'}
                          </button>
                        </div>
                      ) : (
                        <RoleBadge role={rk} config={roleConfig} />
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSION_CATEGORIES.map(cat => {
                  const catFeatures = PERMISSION_FEATURE_DETAILS.filter(f => f.category === cat.id);
                  return (
                    <React.Fragment key={cat.id}>
                      {/* Category Header Row */}
                      <tr style={{ backgroundColor: 'var(--bg-secondary, rgba(0,0,0,0.03))', borderBottom: '1px solid var(--border-color)' }}>
                        <td
                          colSpan={Object.keys(roleConfig.labels).length + 1}
                          style={{ padding: '10px 16px', fontWeight: 700, fontSize: '12.5px', color: 'var(--text-primary)', letterSpacing: '0.3px', textTransform: 'uppercase' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              background: 'var(--accent-primary)',
                              color: 'white',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 700
                            }}>
                              {catFeatures.length} Izin
                            </span>
                            <span>{cat.name}</span>
                          </div>
                        </td>
                      </tr>

                      {/* Feature Items */}
                      {catFeatures.map(feature => (
                        <tr key={feature.key} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.15s' }}>
                          <td style={{ padding: '12px 16px', borderRight: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                              <div>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span>{feature.label}</span>
                                </div>
                                <div style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '11px',
                                  color: 'var(--text-secondary)',
                                  marginTop: '4px',
                                  background: 'var(--bg-secondary, rgba(0,0,0,0.04))',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border-color)'
                                }}>
                                  <MapPin size={11} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                                  <span>{feature.menuLocation}</span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => setSelectedFeatureInfo(feature)}
                                title="Lihat detail penjelasan hak akses & dampak"
                                style={{
                                  background: 'rgba(59, 130, 246, 0.1)',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '24px',
                                  height: '24px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'var(--accent-primary)',
                                  cursor: 'pointer',
                                  flexShrink: 0,
                                  transition: '0.2s',
                                  marginTop: '2px'
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
                                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                              >
                                <Info size={14} />
                              </button>
                            </div>
                          </td>

                          {Object.keys(roleConfig.labels).map(rk => {
                            const hasPerm = !!roleConfig.permissions[feature.key]?.includes(rk);
                            return (
                              <td key={rk} style={{ padding: '12px', textAlign: 'center', borderRight: '1px solid var(--border-color)' }}>
                                {canUserMgmt ? (
                                  <input
                                    type="checkbox"
                                    checked={hasPerm}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      setRoleConfig(prev => {
                                        const list = prev.permissions[feature.key] || [];
                                        const updatedList = checked
                                          ? (list.includes(rk) ? list : [...list, rk])
                                          : list.filter(r => r !== rk);
                                        return {
                                          ...prev,
                                          permissions: {
                                            ...prev.permissions,
                                            [feature.key]: updatedList
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
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

      {/* Feature Information Modal */}
      {selectedFeatureInfo && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(6px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setSelectedFeatureInfo(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="glass"
            style={{
              width: '100%',
              maxWidth: '520px',
              padding: '24px',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  background: 'var(--accent-primary)',
                  color: 'white',
                  borderRadius: '12px',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--accent-primary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {PERMISSION_CATEGORIES.find(c => c.id === selectedFeatureInfo.category)?.name}
                  </span>
                  <h3 style={{ margin: '2px 0 0', fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {selectedFeatureInfo.label}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedFeatureInfo(null)}
                style={{
                  background: 'var(--bg-secondary)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              {/* Location */}
              <div style={{ background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={13} style={{ color: 'var(--accent-primary)' }} /> Lokasi Menu & Tampilan
                </div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  {selectedFeatureInfo.menuLocation}
                </div>
              </div>

              {/* Description */}
              <div style={{ background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={13} style={{ color: '#3b82f6' }} /> Fungsi & Cakupan Izin
                </div>
                <div style={{ color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {selectedFeatureInfo.description}
                </div>
              </div>

              {/* Impact */}
              <div style={{ background: 'rgba(239, 68, 68, 0.06)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <XCircle size={13} /> Dampak Jika Hak Akses Dinonaktifkan
                </div>
                <div style={{ color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {selectedFeatureInfo.impact}
                </div>
              </div>

              {/* Active Roles Overview */}
              <div>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Status Hak Akses Saat Ini:
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {Object.entries(roleConfig.labels).map(([rk, label]) => {
                    const isGranted = !!roleConfig.permissions[selectedFeatureInfo.key]?.includes(rk);
                    return (
                      <span
                        key={rk}
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 600,
                          padding: '4px 10px',
                          borderRadius: '20px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          background: isGranted ? 'rgba(16, 185, 129, 0.12)' : 'rgba(148, 163, 184, 0.12)',
                          color: isGranted ? '#059669' : 'var(--text-secondary)',
                          border: `1px solid ${isGranted ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-color)'}`
                        }}
                      >
                        {isGranted ? <CheckCircle size={13} /> : <XCircle size={13} />} {label}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setSelectedFeatureInfo(null)}
                style={{ padding: '8px 20px', fontSize: '13px' }}
              >
                Tutup Informasi
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Feedbacks Tab */}
      {tab === 'feedbacks' && canAdminFeedback && (
        <div id="users-feedbacks-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ScrollText size={20} style={{ color: 'var(--accent-primary)' }} />
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Log Umpan Balik Pengguna
                </h2>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', width: '280px', maxWidth: '100%' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input
                    className="input"
                    value={fbSearch}
                    onChange={e => setFbSearch(e.target.value)}
                    placeholder="Cari umpan balik..."
                    style={{ paddingLeft: '32px' }}
                  />
                </div>
                <button className="btn" onClick={fetchFeedbacks} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '13px', cursor: 'pointer' }}>
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>
            </div>

            {/* Bulk Actions for Feedbacks */}
            {selectedFeedbackIds.length > 0 && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(239,68,68,0.08)', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid rgba(239,68,68,0.2)', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginRight: 'auto' }}>
                  Terpilih: <strong>{selectedFeedbackIds.length}</strong> umpan balik
                </span>
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelectedFeedbackIds([])}
                  style={{ padding: '6px 12px', fontSize: '12px', cursor: 'pointer', borderRadius: '6px' }}
                >
                  Batal Pilihan
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleBulkDeleteFeedbacks}
                  style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Trash2 size={13} /> Hapus Terpilih
                </button>
              </div>
            )}

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                    <th style={{ padding: '10px 12px', width: '40px', textAlign: 'left' }}>
                      <input
                        type="checkbox"
                        checked={filteredFeedbacks.length > 0 && selectedFeedbackIds.length === filteredFeedbacks.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFeedbackIds(filteredFeedbacks.map((f: any) => f.id));
                          } else {
                            setSelectedFeedbackIds([]);
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                    </th>
                    {renderSortHeader('Tanggal', 'createdAt', fbSortField, fbSortOrder, handleFbSort, '180px')}
                    {renderSortHeader('Pengirim (Email / User)', 'sender', fbSortField, fbSortOrder, handleFbSort, '220px')}
                    {renderSortHeader('Pesan Umpan Balik', 'message', fbSortField, fbSortOrder, handleFbSort)}
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', width: '80px' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFeedbacks.map((f: any) => {
                    let sender = f.userName || 'Anonim';
                    let cleanMsg = f.message;
                    const matches = f.message.match(/Feedback dari ([^:]+): "([\s\S]+)"/);
                    if (matches) {
                      sender = matches[1];
                      cleanMsg = matches[2];
                    }
                    const isSelected = selectedFeedbackIds.includes(f.id);
                    return (
                      <tr key={f.id} style={{ borderBottom: '1px solid var(--border-color)', background: isSelected ? 'rgba(59,130,246,0.04)' : 'transparent' }}>
                        <td style={{ padding: '12px' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedFeedbackIds(prev => [...prev, f.id]);
                              } else {
                                setSelectedFeedbackIds(prev => prev.filter(id => id !== f.id));
                              }
                            }}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
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
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <button
                            className="btn"
                            onClick={() => handleDeleteSingleFeedback(f.id)}
                            title="Hapus Umpan Balik"
                            style={{ padding: '6px 10px', fontSize: '12px', color: '#ef4444', cursor: 'pointer' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredFeedbacks.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        {fbSearch ? 'Tidak ada umpan balik yang cocok dengan pencarian.' : 'Belum ada umpan balik yang dikirimkan.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah/Edit User */}
      {showModal && editUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <form 
            onSubmit={e => {
              e.preventDefault();
              saveUser();
            }}
            autoComplete="off"
            className="glass" 
            style={{ width: '100%', maxWidth: '460px', padding: '28px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>{isNew ? 'Tambah User Baru' : `Edit User: ${editUser.name}`}</h2>
            {[
              { label: 'NPK', key: 'npk', placeholder: 'PKT-001', type: 'text', autoComplete: 'new-npk-code-field' },
              { label: 'Nama', key: 'name', placeholder: 'Nama lengkap', type: 'text', autoComplete: 'new-name-code-field' },
              { label: 'Email (opsional)', key: 'email', placeholder: 'email@pkt.co.id', type: 'email', autoComplete: 'new-email-code-field' },
              { label: isNew ? 'Password' : 'Password Baru (kosongkan jika tidak diubah)', key: 'password', placeholder: '••••••', type: 'password', autoComplete: 'new-password' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>{f.label}</label>
                <input 
                  type={f.type} 
                  className="input" 
                  placeholder={f.placeholder} 
                  value={(editUser as any)[f.key] || ''} 
                  onChange={e => setEditUser({ ...editUser, [f.key]: e.target.value })} 
                  autoComplete={f.autoComplete}
                />
              </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>Role</label>
                <CustomSelect 
                  value={editUser.role || 'MEMBER'} 
                  onChange={val => setEditUser({ ...editUser, role: val })} 
                  options={Object.entries(roleConfig.labels).map(([key, label]) => ({ label, value: key }))}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>Status</label>
                <CustomSelect 
                  value={editUser.status || 'ACTIVE'} 
                  onChange={val => setEditUser({ ...editUser, status: val })} 
                  options={[
                    { label: 'ACTIVE', value: 'ACTIVE' },
                    { label: 'INACTIVE', value: 'INACTIVE' }
                  ]}
                  align="right"
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button type="button" className="btn" onClick={() => setShowModal(false)}>Batal</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </form>
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

      {/* Role Customization Modal */}
      {editingRoleCustomizationKey && (
        <RoleCustomizationModal
          isOpen={!!editingRoleCustomizationKey}
          onClose={() => setEditingRoleCustomizationKey(null)}
          roleKey={editingRoleCustomizationKey}
          config={roleConfig}
          onSave={(key, icon, color) => {
            setRoleConfig(prev => ({
              ...prev,
              icons: { ...(prev.icons || {}), [key]: icon },
              colors: { ...(prev.colors || {}), [key]: color }
            }));
            toast.success(`Ikon & warna role ${roleConfig.labels[key] || key} berhasil diperbarui! Jangan lupa simpan perubahan matriks.`);
          }}
        />
      )}
        </>
      )}
    </div>
  );
}
