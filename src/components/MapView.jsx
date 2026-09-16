/**
 * src/components/MapView.jsx
 *
 * Reusable Leaflet map that renders report markers.
 * Designed for both the Dashboard preview and the full Map page.
 *
 * Props:
 *   reports   – array of report objects with latitude & longitude
 *   height    – CSS height string (default '400px')
 *   zoom      – initial zoom level (default 13)
 *   center    – [lat, lng] array (default: first report location or fallback)
 *   onMarkerClick – called with report when a marker is clicked
 */
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getMarkerColor, formatDamageType, formatConfidence } from '../utils/helpers';
import SeverityBadge from './SeverityBadge';
import StatusBadge from './StatusBadge';
import { Link } from 'react-router-dom';

// Fix Leaflet default icon paths broken by bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

/** Creates a coloured SVG pin icon */
function createColoredIcon(color) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 7.5 12 24 12 24S24 19.5 24 12C24 5.4 18.6 0 12 0z"
        fill="${color}" stroke="rgba(0,0,0,0.3)" stroke-width="1"/>
      <circle cx="12" cy="12" r="5" fill="rgba(255,255,255,0.9)"/>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36],
  });
}

/** Sub-component that re-centres the map when reports change */
function Recenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
}

const FALLBACK_CENTER = [11.0838, 77.1420]; // Coimbatore, India (matches mock data)

export default function MapView({
  reports = [],
  height = '400px',
  zoom = 13,
  center,
  onMarkerClick,
}) {
  const validReports = reports.filter(
    (r) => r.latitude != null && r.longitude != null
  );

  const mapCenter =
    center ||
    (validReports.length > 0
      ? [validReports[0].latitude, validReports[0].longitude]
      : FALLBACK_CENTER);

  return (
    <div style={{ height, borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter center={mapCenter} />

        {validReports.map((report) => {
          const id = report._id || report.id;
          const color = getMarkerColor(report.severity);
          return (
            <Marker
              key={id}
              position={[report.latitude, report.longitude]}
              icon={createColoredIcon(color)}
              eventHandlers={{
                click: () => onMarkerClick?.(report),
              }}
            >
              <Popup maxWidth={260}>
                <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 200 }}>
                  {/* Header */}
                  <div style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid var(--color-border)' }}>
                    <p style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4, color: 'var(--color-text-primary)' }}>
                      {formatDamageType(report.damage_type)}
                    </p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <SeverityBadge severity={report.severity} />
                      <StatusBadge status={report.status} />
                    </div>
                  </div>

                  {/* Details */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', fontSize: '0.8rem', marginBottom: 10 }}>
                    <div>
                      <span style={{ color: 'var(--color-text-muted)' }}>Confidence</span>
                      <p style={{ fontWeight: 600 }}>{formatConfidence(report.confidence)}</p>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-text-muted)' }}>Priority</span>
                      <p style={{ fontWeight: 600, color: color }}>{report.priority_score ?? '—'}</p>
                    </div>
                    <div style={{ gridColumn: '1/-1' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Location</span>
                      <p style={{ fontWeight: 500 }}>
                        {report.latitude?.toFixed(5)}, {report.longitude?.toFixed(5)}
                      </p>
                    </div>
                    {report.road_segment_name && (
                      <div style={{ gridColumn: '1/-1' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>Segment</span>
                        <p style={{ fontWeight: 500 }}>{report.road_segment_name}</p>
                      </div>
                    )}
                  </div>

                  {/* Action */}
                  <Link
                    to={`/reports/${id}`}
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    View Full Report
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
