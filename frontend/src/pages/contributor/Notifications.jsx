/**
 * src/pages/contributor/Notifications.jsx
 * Contributor notifications page — AI verification results, repair updates, and alerts.
 */
import { useState, useCallback } from 'react';
import {
  Bell, CheckCircle, Wrench, AlertTriangle, RefreshCw,
  ShieldCheck, FileText, Clock,
} from 'lucide-react';

import { getNotifications } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import { Skeleton } from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import { formatDate } from '../../utils/helpers';

// ── Notification type configs ─────────────────────────────────────────────────
const NOTIF_CONFIG = {
  AI_VERIFIED:     { label: 'AI Verified',     color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  icon: ShieldCheck },
  REPORT_ACCEPTED: { label: 'Accepted',         color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: CheckCircle },
  REPAIR_COMPLETE: { label: 'Repair Done',      color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: Wrench },
  NEEDS_EVIDENCE:  { label: 'Needs Evidence',   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: AlertTriangle },
  CRITICAL_ALERT:  { label: 'Critical Alert',   color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  icon: AlertTriangle },
  RECURRING_DAMAGE:{ label: 'Recurring Damage', color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  icon: RefreshCw },
};

const FILTER_KEYS = ['ALL', 'AI_VERIFIED', 'REPORT_ACCEPTED', 'REPAIR_COMPLETE', 'NEEDS_EVIDENCE'];
const FILTER_LABELS = {
  ALL: 'All',
  AI_VERIFIED: 'AI Verified',
  REPORT_ACCEPTED: 'Accepted',
  REPAIR_COMPLETE: 'Repair Done',
  NEEDS_EVIDENCE: 'Needs Evidence',
};

// ── Notification Card ─────────────────────────────────────────────────────────
function NotifCard({ notif, onMarkRead }) {
  const cfg = NOTIF_CONFIG[notif.type] || {
    label: notif.type,
    color: 'var(--color-text-muted)',
    bg: 'var(--color-bg-elevated)',
    icon: Bell,
  };
  const Icon = cfg.icon;

  return (
    <div style={{
      display: 'flex',
      gap: 14,
      alignItems: 'flex-start',
      padding: '16px 20px',
      borderBottom: '1px solid var(--color-border)',
      background: notif.read ? 'transparent' : 'rgba(59,130,246,0.03)',
      transition: 'background 200ms ease',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        background: cfg.bg, border: `1px solid ${cfg.color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: 2,
      }}>
        <Icon size={18} color={cfg.color} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{notif.title}</p>
            {!notif.read && (
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-primary)', flexShrink: 0, display: 'inline-block' }} />
            )}
          </div>
          <span style={{ fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30`, flexShrink: 0 }}>
            {cfg.label}
          </span>
        </div>

        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginBottom: 8, lineHeight: 1.5 }}>
          {notif.message}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
            <Clock size={11} />
            {formatDate(notif.created_at)}
          </div>
          {notif.report_id && (
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-bg-elevated)', padding: '2px 8px', borderRadius: 6, border: '1px solid var(--color-border)' }}>
              <FileText size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              {notif.report_id}
            </span>
          )}
          {!notif.read && (
            <button
              onClick={() => onMarkRead(notif.id)}
              className="btn btn-sm btn-secondary"
              style={{ padding: '2px 10px', fontSize: '0.7rem' }}
            >
              Mark read
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ContributorNotifications() {
  const [filter, setFilter]       = useState('ALL');
  const [readSet, setReadSet]     = useState(new Set());

  const fetchNotifs = useCallback(() => getNotifications('contributor'), []);
  const { data: notifs, loading } = useApi(fetchNotifs, []);

  const allNotifs = (notifs || []).map(n => ({
    ...n,
    read: n.read || readSet.has(n.id),
  }));

  const filtered = filter === 'ALL'
    ? allNotifs
    : allNotifs.filter(n => n.type === filter);

  const unreadCount = allNotifs.filter(n => !n.read).length;

  const markRead = (id) => setReadSet(prev => new Set([...prev, id]));
  const markAllRead = () => setReadSet(new Set(allNotifs.map(n => n.id)));

  return (
    <div className="page-wrapper fade-in">

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
              <span className="text-gradient">Notifications</span>
            </h1>
            {unreadCount > 0 && (
              <span style={{ background: 'var(--color-danger)', color: '#fff', borderRadius: 99, padding: '2px 10px', fontSize: '0.78rem', fontWeight: 700 }}>
                {unreadCount} unread
              </span>
            )}
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            Updates on your reports — AI results, acceptance, and repair completions.
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn btn-secondary btn-sm">
            <CheckCircle size={14} /> Mark all read
          </button>
        )}
      </div>

      {/* ── Filter Tabs ── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {FILTER_KEYS.map(key => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`btn btn-sm ${filter === key ? 'btn-primary' : 'btn-secondary'}`}
          >
            {FILTER_LABELS[key]}
            {key === 'ALL' && unreadCount > 0 && (
              <span style={{ marginLeft: 4, background: 'rgba(255,255,255,0.2)', padding: '0px 6px', borderRadius: 99, fontSize: '0.7rem' }}>
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Notifications List ── */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={80} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No notifications"
            description={filter === 'ALL' ? "You're all caught up! No notifications at this time." : `No ${FILTER_LABELS[filter]} notifications.`}
          />
        ) : (
          filtered.map(n => (
            <NotifCard key={n.id} notif={n} onMarkRead={markRead} />
          ))
        )}
      </div>

      {/* ── Tips ── */}
      <div style={{
        marginTop: 20,
        padding: '14px 18px',
        background: 'rgba(59,130,246,0.05)',
        border: '1px solid rgba(59,130,246,0.15)',
        borderRadius: 'var(--radius-md)',
        fontSize: '0.82rem',
        color: 'var(--color-text-secondary)',
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
      }}>
        <Bell size={16} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <strong style={{ color: 'var(--color-text-primary)' }}>How notifications work:</strong> You receive updates when your report is AI-verified,
          accepted by the authority, or when the repair is completed. Reports needing better evidence also generate alerts.
        </div>
      </div>
    </div>
  );
}
