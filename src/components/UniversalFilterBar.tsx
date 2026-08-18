'use client';
import React, { useState } from 'react';
import { Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { useFilter } from '@/context/FilterContext';

interface UniversalFilterBarProps {
  categories?: string[];
  pics?: string[];
  statuses?: string[];
  priorities?: string[];
  filteredCount?: number;
  totalCount?: number;
  children?: React.ReactNode;
}

export default function UniversalFilterBar({ 
  categories = [], 
  pics = [], 
  statuses = [], 
  priorities = [],
  filteredCount,
  totalCount,
  children
}: UniversalFilterBarProps) {
  const { 
    globalSearchQuery, setGlobalSearchQuery,
    globalFilterStatus, setGlobalFilterStatus,
    globalFilterPriority, setGlobalFilterPriority,
    globalFilterCategory, setGlobalFilterCategory,
    globalSearchExactMatch, setGlobalSearchExactMatch,
    globalTargetFilter, setGlobalTargetFilter,
    globalCustomStartDate, setGlobalCustomStartDate,
    globalCustomEndDate, setGlobalCustomEndDate,
    globalPicFilter, setGlobalPicFilter
  } = useFilter();

  const [isOpen, setIsOpen] = useState(false);

  const getActiveStyle = (isActive: boolean) => isActive ? {
    borderColor: 'var(--accent-primary)',
    color: 'var(--accent-primary)'
  } : {};

  // Check if any filter is active to show badge
  const isAnyFilterActive = 
    globalFilterStatus !== 'All' || 
    globalFilterPriority !== 'All' || 
    globalFilterCategory !== 'All' || 
    globalTargetFilter !== 'Semua Waktu' || 
    globalPicFilter !== 'Semua PIC';

  return (
    <div id="universal-filter-bar" className="glass filter-bar-container" style={{ padding: '8px 12px', marginBottom: '20px', borderRadius: '12px', width: '100%' }}>
      
      {/* Top row: Search & Mobile Filter Toggle */}
      <div className="filter-bar-header" style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }}>
        <div className="search-input-wrapper" style={{ position: 'relative', flex: 1, minWidth: '110px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: globalSearchQuery ? 'var(--accent-primary)' : 'var(--text-secondary)' }} />
          <input
            className="input"
            style={{ paddingLeft: '30px', width: '100%', paddingRight: '45px', fontSize: '12px', height: '36px', ...getActiveStyle(globalSearchQuery !== '') }}
            placeholder="Cari pekerjaan..."
            value={globalSearchQuery}
            onChange={e => setGlobalSearchQuery(e.target.value)}
          />
          <button 
            title={globalSearchExactMatch ? "Pencarian Kata Persis (Aktif)" : "Pencarian Kata Persis (Nonaktif)"}
            onClick={() => setGlobalSearchExactMatch(!globalSearchExactMatch)}
            style={{
              position: 'absolute',
              right: '2px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: globalSearchExactMatch ? 'var(--accent-primary)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '2px 4px',
              borderRadius: '6px',
              fontSize: '9px',
              fontWeight: 700,
              color: globalSearchExactMatch ? 'white' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: '0.2s',
              zIndex: 10
            }}
          >
            Exact
          </button>
        </div>

        <button
          className="mobile-filter-toggle-btn"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            height: '36px',
            padding: '0 12px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            background: isAnyFilterActive ? 'rgba(37, 99, 235, 0.1)' : 'var(--surface-color)',
            color: isAnyFilterActive ? 'var(--accent-primary)' : 'var(--text-primary)',
            fontSize: '13px',
            fontWeight: 500,
            display: 'none', // Overridden in CSS media query
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            transition: '0.2s',
            position: 'relative'
          }}
        >
          <Filter size={15} />
          <span>Filter</span>
          {isAnyFilterActive && <span className="filter-active-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', position: 'absolute', top: '4px', right: '4px' }} />}
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {children && (
          <div className="filter-bar-actions-desktop" style={{ marginLeft: 'auto', display: 'flex', flexShrink: 0 }}>
            {children}
          </div>
        )}
      </div>

      {/* Collapsible Dropdowns Area */}
      <div className={`filter-options-area ${isOpen ? 'open' : ''}`} style={{ width: '100%' }}>
        <div className="filter-options-grid" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginTop: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <select className="input" style={{ width: 'auto', padding: '4px 8px', fontSize: '12px', height: '32px', ...getActiveStyle(globalFilterStatus !== 'All') }} value={globalFilterStatus} onChange={e => setGlobalFilterStatus(e.target.value)}>
              <option value="All">Semua Status</option>
              {Array.from(new Set(statuses)).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <select className="input" style={{ width: 'auto', padding: '4px 8px', fontSize: '12px', height: '32px', ...getActiveStyle(globalFilterPriority !== 'All') }} value={globalFilterPriority} onChange={e => setGlobalFilterPriority(e.target.value)}>
              <option value="All">Semua Prioritas</option>
              {Array.from(new Set(priorities)).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <select className="input" style={{ width: 'auto', padding: '4px 8px', fontSize: '12px', height: '32px', ...getActiveStyle(globalFilterCategory !== 'All') }} value={globalFilterCategory} onChange={e => setGlobalFilterCategory(e.target.value)}>
              <option value="All">Semua Kategori</option>
              {Array.from(new Set(categories)).map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <select className="input" style={{ width: 'auto', padding: '4px 8px', fontSize: '12px', height: '32px', ...getActiveStyle(globalTargetFilter !== 'Semua Waktu') }} value={globalTargetFilter} onChange={e => setGlobalTargetFilter(e.target.value)}>
              <option value="Hari Ini">Hari Ini</option>
              <option value="Minggu Ini">Minggu Ini</option>
              <option value="Bulan Ini">Bulan Ini</option>
              <option value="Semua Waktu">Semua Waktu</option>
              <option value="Custom">Custom...</option>
            </select>
            {globalTargetFilter === 'Custom' && (
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <input
                  type="date"
                  value={globalCustomStartDate}
                  onChange={(e) => setGlobalCustomStartDate(e.target.value)}
                  style={{ width: 'auto', padding: '4px 6px', fontSize: '12px', height: '32px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
                />
                <span style={{ color: 'var(--text-secondary)' }}>-</span>
                <input
                  type="date"
                  value={globalCustomEndDate}
                  onChange={(e) => setGlobalCustomEndDate(e.target.value)}
                  style={{ width: 'auto', padding: '4px 6px', fontSize: '12px', height: '32px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <select className="input" style={{ width: 'auto', padding: '4px 8px', fontSize: '12px', height: '32px', ...getActiveStyle(globalPicFilter !== 'Semua PIC') }} value={globalPicFilter} onChange={e => setGlobalPicFilter(e.target.value)}>
              <option value="Semua PIC">Semua PIC</option>
              {Array.from(new Set(pics)).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {filteredCount !== undefined && totalCount !== undefined && (
            <div className="filter-count-label" style={{ display: 'flex', alignItems: 'center', paddingLeft: '8px', borderLeft: '1px solid var(--border-color)', marginLeft: '4px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                Menampilkan <strong style={{ color: 'var(--text-primary)' }}>{filteredCount}</strong> dari {totalCount} data
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons layout on mobile */}
      {children && (
        <div className="filter-bar-actions-mobile" style={{ display: 'none', width: '100%', marginTop: '8px', borderTop: '1px dashed var(--border-color)', paddingTop: '8px' }}>
          {children}
        </div>
      )}
    </div>
  );
}
