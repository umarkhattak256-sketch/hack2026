import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Inline SVG icons keep us free of leaflet's PNG marker assets that break under
// Vite's bundler. One color per kind so map context is clear at a glance.
const KIND_COLORS = {
  user: '#2267b5',
  venue: '#14a46c',
  event: '#d79b28',
  candidate: '#4f46e5',
}

const buildIcon = (kind) => {
  const color = KIND_COLORS[kind] || KIND_COLORS.venue
  const html = `
    <div style="
      width: 28px; height: 28px; border-radius: 999px;
      background: ${color};
      border: 3px solid white;
      box-shadow: 0 4px 14px rgba(13,22,20,0.25);
      display: grid; place-items: center;
      color: white; font-weight: 800; font-size: 14px;">
      ${kind === 'user' ? '★' : kind === 'event' ? '⚑' : '●'}
    </div>`
  return L.divIcon({
    className: 's2m-map-pin',
    html,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  })
}

// React-leaflet does not auto-recenter when props change, so use a tiny child
// component that grabs the map instance and calls setView when bounds shift.
function FitBounds({ markers, userLocation, padding = 0.02 }) {
  const map = useMap()
  useEffect(() => {
    const points = []
    if (userLocation && Number.isFinite(userLocation.lat) && Number.isFinite(userLocation.lng)) {
      points.push([userLocation.lat, userLocation.lng])
    }
    markers.forEach(m => {
      if (Number.isFinite(m.lat) && Number.isFinite(m.lng)) points.push([m.lat, m.lng])
    })
    if (points.length === 0) return
    if (points.length === 1) {
      map.setView(points[0], 14, { animate: true })
      return
    }
    const bounds = L.latLngBounds(points).pad(padding)
    map.fitBounds(bounds, { animate: true, maxZoom: 15 })
  }, [map, markers, userLocation, padding])
  return null
}

export default function MapView({
  markers = [],
  userLocation = null,
  height = 320,
  zoom = 13,
  showRadius = null,
  className = '',
}) {
  const containerRef = useRef(null)

  const validMarkers = useMemo(
    () => markers.filter(m => Number.isFinite(m.lat) && Number.isFinite(m.lng)),
    [markers],
  )

  // Fallback center if no location is known yet — Islamabad seed area.
  const center = userLocation && Number.isFinite(userLocation.lat) && Number.isFinite(userLocation.lng)
    ? [userLocation.lat, userLocation.lng]
    : validMarkers.length > 0
      ? [validMarkers[0].lat, validMarkers[0].lng]
      : [33.7294, 73.0931]

  return (
    <div ref={containerRef} className={`s2m-map ${className}`} style={{ height, borderRadius: 14, overflow: 'hidden', border: '1px solid var(--line)' }}>
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {userLocation && Number.isFinite(userLocation.lat) && Number.isFinite(userLocation.lng) && (
          <>
            <Marker position={[userLocation.lat, userLocation.lng]} icon={buildIcon('user')}>
              <Popup>
                <strong>You are here</strong>
                {userLocation.label && <div style={{ marginTop: 4 }}>{userLocation.label}</div>}
              </Popup>
            </Marker>
            {showRadius && Number.isFinite(showRadius) && (
              <CircleMarker
                center={[userLocation.lat, userLocation.lng]}
                radius={showRadius}
                pathOptions={{ color: KIND_COLORS.user, fillColor: KIND_COLORS.user, fillOpacity: 0.08, weight: 1 }}
              />
            )}
          </>
        )}

        {validMarkers.map((m, idx) => (
          <Marker
            key={m.id ?? `${m.lat}-${m.lng}-${idx}`}
            position={[m.lat, m.lng]}
            icon={buildIcon(m.kind || 'venue')}
          >
            <Popup>
              <strong>{m.label || 'Venue'}</strong>
              {m.subtitle && <div style={{ marginTop: 4, color: '#5b6a66' }}>{m.subtitle}</div>}
              {Number.isFinite(m.distance_km) && (
                <div style={{ marginTop: 6, fontSize: 12 }}>
                  <span style={{
                    background: '#eef3f0', padding: '2px 8px', borderRadius: 999, fontWeight: 700,
                  }}>
                    {m.distance_km.toFixed(1)} km away
                  </span>
                </div>
              )}
            </Popup>
          </Marker>
        ))}

        <FitBounds markers={validMarkers} userLocation={userLocation} />
      </MapContainer>
    </div>
  )
}
