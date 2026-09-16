import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, AlertTriangle, RefreshCw, FileText, CheckCircle, BellOff, Check } from 'lucide-react';

import useApi from '../../hooks/useApi';
import { getNotifications } from '../../services/api';
import { Skeleton } from '../../components/Loading';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import { formatDate } from '../../utils/helpers';

const TYPE_CONFIG = {
  CRITICAL_ALERT: {
    icon: AlertTriangle,
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.1)',
    border: 'rgba(239,68,68,0.25)',
  },
  RECURRING_DAMAGE: {
    icon: RefreshCw,
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.2)',
  },
  NEW_REPORT: {
    icon: FileText,
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.1)',
    border: 'rgba(99,102,241,0.25)',
  },
  NEW_REPORTS: {
    icon: FileText,
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.1)',
    border: 'rgba(99,102,241,0.25)',
  },
  REPAIR_VERIFIED: {
    icon: CheckCircle,
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.1)',
    border: 'rgba(34,197,94,0.25)',
  },
  REPAIR_ASSIGNED: {
    icon: CheckCircle,
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.2)',
  },
  DEFAULT: {
    icon: Bell,
    color: 'var(--color-text-secondary)',
    bg: 'var(--color-background)',
    border: 'var(--color-border)',
  },
};

function NotificationItem({ notification, onMarkRead }) {
  const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.DEFAULT;
  const Icon = config.icon;

  const getLink = () => {
    if (notification.report_id) return `/authority/reports/${notification.report_id}`;
    if (notification.road_segment_id) return `/authority/roads/${notification.road_segment_id}`;
    if (notification.repair_id) return `/authority/repairs`;
    return null;
  };

  const link = getLink();

  return (
    <div
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '1rem',
        padding: '1rem 1.25rem',
        background: notification.is_read ? 'transparent' : `${config.bg}`,
        borderLeft: `3px solid ${notification.is_read ? 'transparent' : config.color}`,
        borderBottom: '1px solid var(--color-border)',
        transition: 'background 0.15s',
        position: 'relative'
      }}
    >
      {/* Icon */}
      <div style={{
        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
        background: config.bg, border: `1px solid ${config.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <Icon size={16} color={config.color} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
          <p style={{ fontSize: '0.88rem', fontWeight: notification.is_read ? 500 : 700, color: 'var(--color-text-primary)', margin: 0 }}>
            {notification.title}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            {!notification.is_read && (
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: config.color, flexShrink: 0 }} />
            )}
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
              {formatDate(notification.created_at)}
            </span>
          </div>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', margin: '0.25rem 0 0 0', lineHeight: 1.5 }}>
          {notification.message}
        </p>
        {link && (
          <Link
            to={link}
            style={{ display: 'inline-block', marginTop: '0.4rem', fontSize: '0.78rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}
          >
            View details →
          </Link>
        )}
      </div>
    </div>
  );
}

export default function Notifications() {
  const [filter, setFilter] = useState('All');
  const [localRead, setLocalRead] = useState(new Set());

  const { data: notifData, loading, error, refetch } = useApi(() => getNotifications('authority'));

  const notifications = (notifData?.notifications || notifData || []).map(n => ({
    ...n,
    is_read: n.is_read || localRead.has(n.id),
  }));

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const filtered = filter === 'Unread'
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const handleMarkAllRead = () => {
    const allIds = new Set(notifications.map(n => n.id));
    setLocalRead(allIds);
  };

  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="page-wrapper fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              Notifications
            </h1>
            {!loading && unreadCount > 0 && (
              <span style={{
                padding: '0.15rem 0.6rem', borderRadius: 999,
                background: '#ef4444', color: '#fff',
                fontSize: '0.78rem', fontWeight: 700
              }}>
                {unreadCount}
              </span>
            )}
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Stay updated on critical alerts and system events
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.5rem 1rem', background: 'var(--color-surface)',
              color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)',
              borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600
            }}
          >
            <Check size={14} /> Mark all read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid var(--color-border)', marginBottom: '1.25rem' }}>
        {['All', 'Unread'].map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            style={{
              padding: '0.6rem 1.1rem', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '0.87rem', fontWeight: 600,
              color: filter === tab ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              borderBottom: filter === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: -2
            }}
          >
            {tab}
            <span style={{ marginLeft: '0.35rem', fontSize: '0.72rem' }}>
              ({tab === 'Unread' ? unreadCount : notifications.length})
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '1rem' }}>
            {Array(6).fill(0).map((_, i) => <Skeleton key={i} style={{ height: 72, marginBottom: 8, borderRadius: 8 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <BellOff size={36} color="var(--color-text-secondary)" style={{ marginBottom: '0.75rem' }} />
            <h3 style={{ color: 'var(--color-text-primary)', margin: '0 0 0.4rem 0' }}>
              {filter === 'Unread' ? 'All caught up!' : 'No Notifications'}
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', margin: 0 }}>
              {filter === 'Unread' ? 'No unread notifications at this time.' : 'Notifications will appear here.'}
            </p>
          </div>
        ) : (
          <div>
            {filtered.map((n, idx) => (
              <NotificationItem
                key={n.id || idx}
                notification={n}
                onMarkRead={() => setLocalRead(prev => new Set([...prev, n.id]))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
