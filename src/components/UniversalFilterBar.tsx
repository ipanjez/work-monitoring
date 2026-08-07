'use client';
import React from 'react';
import { Search, Filter } from 'lucide-react';
import { useFilter } from '@/context/FilterContext';

interface UniversalFilterBarProps {
  categories?: string[];
  pics?: string[];
  statuses?: string[];
  priorities?: string[];
  filteredCount?: number;
  totalCount?: number;
}

export default function UniversalFilterBar({ 
  categories = [], 
  pics = [], 
  statuses = [], 
  priorities = [],
  filteredCount,
  totalCount
}: UniversalFilterBarProps) {
  const { 
    globalSearchQuery, setGlobalSearchQuery,
    globalFilterStatus, setGlobalFilterStatus,
    globalFilterPriority, setGlobalFilterPriority,
    globalFilterCategory, setGlobalFilterCategory,
    globalTargetFilter, setGlobalTargetFilter,
    globalCustomStartDate, setGlobalCustomStartDate,
    globalCustomEndDate, setGlobalCustomEndDate,
    globalPicFilter, setGlobalPicFilter
  } = useFilter();

  return (
    <div className="glass" style={{ padding: '12px 16px', marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', borderRadius: '12px' }}>
      <div style={{ position: 'relative', flex: '1 1 150px', minWidth: '150px' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input
          className="input"
          style={{ paddingLeft: '36px', width: '100%', paddingRight: '12px', fontSize: '13px' }}
          placeholder="Pencarian..."
          value={globalSearchQuery}
          onChange={e => setGlobalSearchQuery(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <select className="input" style={{ width: 'auto', padding: '6px 10px', fontSize: '13px' }} value={globalFilterStatus} onChange={e => setGlobalFilterStatus(e.target.value)}>
            <option value="All">Semua Status</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <select className="input" style={{ width: 'auto', padding: '6px 10px', fontSize: '13px' }} value={globalFilterPriority} onChange={e => setGlobalFilterPriority(e.target.value)}>
            <option value="All">Semua Prioritas</option>
            {priorities.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <select className="input" style={{ width: 'auto', padding: '6px 10px', fontSize: '13px' }} value={globalFilterCategory} onChange={e => setGlobalFilterCategory(e.target.value)}>
            <option value="All">Semua Kategori</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <select className="input" style={{ width: 'auto', padding: '6px 10px', fontSize: '13px' }} value={globalTargetFilter} onChange={e => setGlobalTargetFilter(e.target.value)}>
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
                style={{ width: 'auto', padding: '6px', fontSize: '13px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
              />
              <span style={{ color: 'var(--text-secondary)' }}>-</span>
              <input
                type="date"
                value={globalCustomEndDate}
                onChange={(e) => setGlobalCustomEndDate(e.target.value)}
                style={{ width: 'auto', padding: '6px', fontSize: '13px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
              />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <select className="input" style={{ width: 'auto', padding: '6px 10px', fontSize: '13px' }} value={globalPicFilter} onChange={e => setGlobalPicFilter(e.target.value)}>
            <option value="Semua PIC">Semua PIC</option>
            {pics.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {filteredCount !== undefined && totalCount !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '8px', borderLeft: '1px solid var(--border-color)', marginLeft: '4px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Menampilkan <strong style={{ color: 'var(--text-primary)' }}>{filteredCount}</strong> dari {totalCount} data
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
