'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, CalendarDays, Copy, Check, ExternalLink, Globe, 
  Filter, Sparkles, Download, Clock, RefreshCw, AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useMaster } from '@/context/MasterContext';
import { Task, handleExportICS, getTaskLocationString } from '@/utils/taskUtils';

interface CalendarSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks?: Task[];
}

const TIMEZONE_OPTIONS = [
  { group: 'Indonesia (WITA / WIB / WIT)', items: [
    { label: 'WITA (UTC+08:00) — Makassar / Bali / Balikpapan / Bontang (Default)', value: 'Asia/Makassar' },
    { label: 'WIB (UTC+07:00) — Jakarta / Surabaya / Medan / Pontianak', value: 'Asia/Jakarta' },
    { label: 'WIT (UTC+09:00) — Jayapura / Ambon / Maluku / Papua', value: 'Asia/Jayapura' },
  ]},
  { group: 'Zona Waktu Universal (UTC / GMT Negatif: Benua Amerika & Pasifik)', items: [
    { label: 'UTC-12:00 — Baker Island, Howland Island', value: 'Etc/GMT+12' },
    { label: 'UTC-11:00 — Pago Pago, Niue, American Samoa', value: 'Pacific/Pago_Pago' },
    { label: 'UTC-10:00 — Honolulu, Hawaii, Papeete (HST)', value: 'Pacific/Honolulu' },
    { label: 'UTC-09:30 — Marquesas Islands', value: 'Pacific/Marquesas' },
    { label: 'UTC-09:00 — Anchorage, Alaska (AKST)', value: 'America/Anchorage' },
    { label: 'UTC-08:00 — Los Angeles, San Francisco, Vancouver (PST)', value: 'America/Los_Angeles' },
    { label: 'UTC-07:00 — Denver, Phoenix, Calgary, Salt Lake City (MST)', value: 'America/Denver' },
    { label: 'UTC-06:00 — Chicago, Dallas, Mexico City (CST)', value: 'America/Chicago' },
    { label: 'UTC-05:00 — New York, Washington DC, Toronto, Bogota (EST)', value: 'America/New_York' },
    { label: 'UTC-04:00 — Santiago, Caracas, Halifax, La Paz (AST)', value: 'America/Santiago' },
    { label: 'UTC-03:30 — St. John’s, Newfoundland (NST)', value: 'America/St_Johns' },
    { label: 'UTC-03:00 — Sao Paulo, Buenos Aires, Montevideo, Rio de Janeiro', value: 'America/Sao_Paulo' },
    { label: 'UTC-02:00 — South Georgia, Fernando de Noronha', value: 'America/Noronha' },
    { label: 'UTC-01:00 — Azores, Cape Verde', value: 'Atlantic/Azores' },
  ]},
  { group: 'Zona Waktu Universal (UTC / GMT Nol & Positif: Eropa, Afrika, Timur Tengah)', items: [
    { label: 'UTC+00:00 (GMT) — London, Dublin, Lisbon, Casablanca, UTC Standard', value: 'UTC' },
    { label: 'UTC+01:00 — Paris, Berlin, Rome, Amsterdam, Madrid, Zurich (CET)', value: 'Europe/Paris' },
    { label: 'UTC+02:00 — Cairo, Athens, Helsinki, Jerusalem, Kyiv (EET)', value: 'Europe/Athens' },
    { label: 'UTC+03:00 — Riyadh, Moscow, Istanbul, Nairobi, Doha, Kuwait', value: 'Asia/Riyadh' },
    { label: 'UTC+03:30 — Tehran, Iran', value: 'Asia/Tehran' },
    { label: 'UTC+04:00 — Dubai, Abu Dhabi, Baku, Muscat, Tbilisi', value: 'Asia/Dubai' },
    { label: 'UTC+04:30 — Kabul, Afghanistan', value: 'Asia/Kabul' },
    { label: 'UTC+05:00 — Karachi, Islamabad, Tashkent, Yekaterinburg', value: 'Asia/Karachi' },
    { label: 'UTC+05:30 — New Delhi, Mumbai, Bengaluru, Colombo (IST)', value: 'Asia/Kolkata' },
    { label: 'UTC+05:45 — Kathmandu, Nepal', value: 'Asia/Kathmandu' },
  ]},
  { group: 'Zona Waktu Universal (UTC / GMT Positif: Asia, Australia, Pasifik)', items: [
    { label: 'UTC+06:00 — Dhaka, Almaty, Omsk, Thimphu', value: 'Asia/Dhaka' },
    { label: 'UTC+06:30 — Yangon, Naypyidaw, Cocos Islands', value: 'Asia/Yangon' },
    { label: 'UTC+07:00 — Bangkok, Hanoi, Ho Chi Minh, Phnom Penh, Vientiane', value: 'Asia/Bangkok' },
    { label: 'UTC+08:00 — Singapore, Kuala Lumpur, Beijing, Hong Kong, Perth, Taipei', value: 'Asia/Singapore' },
    { label: 'UTC+08:45 — Eucla, Australia Barat', value: 'Australia/Eucla' },
    { label: 'UTC+09:00 — Tokyo, Seoul, Pyongyang, Osaka', value: 'Asia/Tokyo' },
    { label: 'UTC+09:30 — Adelaide, Darwin (ACST)', value: 'Australia/Adelaide' },
    { label: 'UTC+10:00 — Sydney, Melbourne, Brisbane, Canberra, Guam (AEST)', value: 'Australia/Sydney' },
    { label: 'UTC+10:30 — Lord Howe Island', value: 'Australia/Lord_Howe' },
    { label: 'UTC+11:00 — Solomon Islands, Noumea, Vladivostok', value: 'Pacific/Guadalcanal' },
    { label: 'UTC+12:00 — Auckland, Wellington, Suva, Fiji (NZST)', value: 'Pacific/Auckland' },
    { label: 'UTC+12:45 — Chatham Islands', value: 'Pacific/Chatham' },
    { label: 'UTC+13:00 — Nuku\'alofa, Samoa, Apia, Tokelau', value: 'Pacific/Tongatapu' },
    { label: 'UTC+14:00 — Kiritimati, Line Islands', value: 'Pacific/Kiritimati' },
  ]}
];

export default function CalendarSyncModal({
  isOpen,
  onClose,
  tasks = []
}: CalendarSyncModalProps) {
  const { masterPics, masterCats } = useMaster();
  const [calendarToken, setCalendarToken] = useState('');
  const [feedFilterPic, setFeedFilterPic] = useState('');
  const [feedFilterCategory, setFeedFilterCategory] = useState('');
  const [feedTimezone, setFeedTimezone] = useState('Asia/Makassar');
  const [feedHideCompleted, setFeedHideCompleted] = useState(false);
  const [copiedFeedUrl, setCopiedFeedUrl] = useState(false);
  const [loadingToken, setLoadingToken] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoadingToken(true);
      fetch('/api/calendar/token')
        .then(res => res.json())
        .then(data => {
          if (data.token) setCalendarToken(data.token);
        })
        .catch(err => {
          console.error(err);
        })
        .finally(() => {
          setLoadingToken(false);
        });
    }
  }, [isOpen]);

  // Computed Feed URL with customized query params
  const computedFeedUrl = (() => {
    if (typeof window === 'undefined' || !calendarToken) return '';
    const params = new URLSearchParams();
    params.set('token', calendarToken);
    if (feedFilterPic) params.set('pic', feedFilterPic);
    if (feedFilterCategory) params.set('kategori', feedFilterCategory);
    if (feedHideCompleted) params.set('hideCompleted', 'true');
    if (feedTimezone) params.set('tz', feedTimezone);
    return `${window.location.origin}/calendar.ics?${params.toString()}`;
  })();

  const webcalUrl = computedFeedUrl ? computedFeedUrl.replace(/^https?:\/\//i, 'webcal://') : '';
  const gcalDirectUrl = computedFeedUrl ? `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcalUrl || computedFeedUrl)}` : '';

  const handleCopyUrl = async () => {
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.'));
    if (isLocal) {
      alert('Perhatian: Fitur Sinkronisasi Langsung Google Calendar memerlukan domain publik (seperti Vercel). Saat di localhost, Anda tetap dapat mengunduh berkas offline .ics.');
    }
    try {
      if (!computedFeedUrl) return;
      await navigator.clipboard.writeText(computedFeedUrl);
      setCopiedFeedUrl(true);
      setTimeout(() => setCopiedFeedUrl(false), 2500);
      toast.success('URL Feed Kalender berhasil disalin ke clipboard! 📋');
    } catch (err) {
      toast.error('Gagal menyalin URL kalender');
    }
  };

  // Download all current tasks as an offline .ics file
  const handleDownloadFullICS = () => {
    if (!tasks || tasks.length === 0) {
      toast.error('Tidak ada data pekerjaan untuk diekspor');
      return;
    }

    try {
      const pad = (n: number) => n < 10 ? '0' + n : '' + n;
      const formatICSDate = (date: Date, timeStr?: string | null, isAllDay?: boolean | null) => {
        const d = new Date(date);
        if (isAllDay || !timeStr) {
          return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
        }
        const [hours, minutes] = timeStr.split(':').map(Number);
        d.setHours(hours || 0, minutes || 0, 0, 0);
        return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
      };

      let icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Work Monitoring Dept//ID\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\nX-WR-CALNAME:Daftar Pekerjaan Departemen\n`;

      tasks.forEach(task => {
        const start = formatICSDate(new Date(task.startDate), task.startTime, task.isAllDay);
        let end = formatICSDate(new Date(task.endDate), task.endTime, task.isAllDay);
        
        if (task.isAllDay || !task.endTime) {
          const nextDay = new Date(task.endDate);
          nextDay.setDate(nextDay.getDate() + 1);
          end = formatICSDate(nextDay, null, true);
        }

        const dateParam = (task.isAllDay || !task.startTime) ? ';VALUE=DATE' : '';
        const cleanDesc = (task.deskripsi || '').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
        const summary = `[${task.kategori || 'Umum'}] ${task.nama} - ${task.pic || 'Unassigned'}`.replace(/,/g, '\\,');
        const locStr = getTaskLocationString(task);
        const locLine = locStr ? `LOCATION:${locStr.replace(/,/g, '\\,')}\n` : '';

        icsContent += `BEGIN:VEVENT\nUID:${task.id}-${Date.now()}@workmonitoring.internal\nDTSTAMP:${formatICSDate(new Date())}\nDTSTART${dateParam}:${start}\nDTEND${dateParam}:${end}\nSUMMARY:${summary}\n${locLine}DESCRIPTION:${cleanDesc}\\nStatus: ${task.status}\\nPrioritas: ${task.prioritas || 'Medium'}\nSTATUS:CONFIRMED\nEND:VEVENT\n`;
      });

      icsContent += `END:VCALENDAR`;

      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute('download', `Agenda_Pekerjaan_${new Date().toISOString().split('T')[0]}.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Berkas Kalender (.ics) berhasil diunduh! 📅');
    } catch (e) {
      console.error(e);
      toast.error('Gagal mengunduh berkas kalender');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="modal-overlay" style={{ zIndex: 10200 }}>
        <motion.div
          className="modal-content"
          style={{ maxWidth: '680px', maxHeight: '92vh', overflowY: 'auto', padding: '0', borderRadius: '16px' }}
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--surface-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <CalendarDays size={22} />
              </div>
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Sinkronisasi Otomatis Google Calendar / Outlook
                </h2>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Berlangganan (*subscribe*) kalender kerja agar agenda Anda selalu ter-update otomatis.
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-secondary)', padding: '6px', borderRadius: '8px'
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Modal Body */}
          <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* Filter Personalization Card */}
            <div style={{
              background: 'var(--input-bg)',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <Filter size={15} color="var(--accent-primary)" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Kustomisasi Filter Kalender (Opsional):
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Filter Personil PIC:
                  </label>
                  <select
                    className="input"
                    style={{ width: '100%', fontSize: '12.5px' }}
                    value={feedFilterPic}
                    onChange={e => setFeedFilterPic(e.target.value)}
                  >
                    <option value="">Semua Tugas (Seluruh Departemen)</option>
                    {masterPics.map(p => (
                      <option key={p} value={p}>Hanya Tugas: {p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Filter Kategori:
                  </label>
                  <select
                    className="input"
                    style={{ width: '100%', fontSize: '12.5px' }}
                    value={feedFilterCategory}
                    onChange={e => setFeedFilterCategory(e.target.value)}
                  >
                    <option value="">Semua Kategori</option>
                    {Array.from(new Set(['Umum', ...(masterCats || [])])).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Timezone Selection */}
              <div style={{ marginTop: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  <Globe size={13} color="var(--accent-primary)" /> Zona Waktu Kalender (Timezone GMT/UTC):
                </label>
                <select
                  className="input"
                  style={{ width: '100%', fontSize: '12.5px', background: 'var(--surface-color)' }}
                  value={feedTimezone}
                  onChange={e => setFeedTimezone(e.target.value)}
                >
                  {TIMEZONE_OPTIONS.map((grp, gidx) => (
                    <optgroup key={gidx} label={grp.group}>
                      {grp.items.map(tz => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed var(--border-color)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12.5px', color: 'var(--text-primary)', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={feedHideCompleted}
                    onChange={e => setFeedHideCompleted(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <span>Sembunyikan pekerjaan yang sudah selesai (Status: Done)</span>
                </label>
              </div>
            </div>

            {/* URL Display & 1-Click Actions */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                URL Feed Kalender Anda (.ics):
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '14px' }}>
                <input
                  type="text"
                  readOnly
                  className="input"
                  value={loadingToken ? 'Memuat URL sinkronisasi...' : (computedFeedUrl || 'URL kalender tidak tersedia')}
                  style={{ flex: 1, minWidth: '260px', fontFamily: 'monospace', fontSize: '12px', background: 'var(--input-bg)' }}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, fontWeight: 700 }}
                  onClick={handleCopyUrl}
                  disabled={loadingToken || !computedFeedUrl}
                >
                  {copiedFeedUrl ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copiedFeedUrl ? 'Tersalin!' : 'Salin URL Feed'}</span>
                </button>
              </div>

              {/* Direct Buttons */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <a
                  href={gcalDirectUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none', color: 'var(--text-primary)' }}
                >
                  <ExternalLink size={14} color="#4285F4" /> 1-Klik Tambah ke Google Calendar
                </a>

                <a
                  href={webcalUrl || '#'}
                  className="btn btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none', color: 'var(--text-primary)' }}
                >
                  <Globe size={14} color="var(--accent-primary)" /> Buka di Apple Calendar / Outlook (webcal)
                </a>

                <button
                  type="button"
                  onClick={handleDownloadFullICS}
                  className="btn btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Download size={14} color="#10b981" /> Unduh Berkas .ics Offline
                </button>
              </div>
            </div>

            {/* Instruction Guide & Tips */}
            <div style={{
              background: 'rgba(59, 130, 246, 0.05)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '10px',
              padding: '14px 16px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              lineHeight: 1.6
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-primary)', fontWeight: 700, marginBottom: '6px', fontSize: '12.5px' }}>
                <Sparkles size={15} /> Cara Berlangganan Kalender di Google Calendar:
              </div>
              <ol style={{ paddingLeft: '18px', margin: '0 0 10px 0' }}>
                <li>Salin <strong>URL Feed Kalender</strong> di atas.</li>
                <li>Buka <a href="https://calendar.google.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>Google Calendar</a> di browser.</li>
                <li>Pada bilah samping kiri, klik tanda <strong>+</strong> di samping <strong>Other calendars (Kalender lain)</strong>.</li>
                <li>Pilih <strong>From URL (Dari URL)</strong>.</li>
                <li>Tempel (Paste) URL tadi dan klik <strong>Add calendar (Tambahkan kalender)</strong>.</li>
              </ol>
              <div style={{ borderTop: '1px dashed rgba(59, 130, 246, 0.2)', paddingTop: '8px', fontSize: '11.5px' }}>
                🔔 <strong>Pengingat Notifikasi:</strong> Untuk menyalakan alarm notifikasi jadwal di ponsel, buka Google Calendar → Setelan Kalender → Tambahkan <em>Event notifications</em> (misal: 15 menit sebelum acara).
              </div>
            </div>

          </div>

          {/* Footer */}
          <div style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border-color)',
            background: 'var(--surface-color)',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center'
          }}>
            <button className="btn btn-secondary" onClick={onClose} style={{ fontSize: '12.5px' }}>
              Tutup
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

