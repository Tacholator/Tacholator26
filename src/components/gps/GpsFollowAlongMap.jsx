import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import { point, lineString, nearestPointOnLine } from '@turf/turf';
import { Navigation, MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom user location icon
const createUserLocationIcon = (heading) => {
  return L.divIcon({
    html: `
      <div style="transform: rotate(${heading || 0}deg); width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <div style="width: 16px; height: 16px; background: #F7B602; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>
      </div>
    `,
    className: 'user-location-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

function MapController({ center, zoom, followUser }) {
  const map = useMap();
  
  useEffect(() => {
    if (followUser && center) {
      map.setView(center, zoom, { animate: true });
    }
  }, [center, zoom, followUser, map]);

  return null;
}

function FitBounds({ bounds }) {
  const map = useMap();
  
  useEffect(() => {
    if (bounds && bounds.length === 2) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [bounds, map]);

  return null;
}

export default function GpsFollowAlongMap({ 
  geoJson, 
  userLocation, 
  userHeading = 0,
  followUser = false,
  onDistanceUpdate
}) {
  const [bounds, setBounds] = useState(null);
  const mapRef = useRef(null);

  // Extract coordinates from GeoJSON
  const routeCoordinates = geoJson?.geometry?.coordinates || [];
  const positions = routeCoordinates.map(coord => [coord[1], coord[0]]); // [lat, lng]

  // Calculate bounds
  useEffect(() => {
    if (positions.length > 0) {
      const lats = positions.map(p => p[0]);
      const lngs = positions.map(p => p[1]);
      const newBounds = [
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)]
      ];
      setBounds(newBounds);
    }
  }, [geoJson]);

  // Calculate distance from route
  useEffect(() => {
    if (userLocation && routeCoordinates.length > 0 && onDistanceUpdate) {
      try {
        const userPoint = point([userLocation.lng, userLocation.lat]);
        const route = lineString(routeCoordinates);
        const nearest = nearestPointOnLine(route, userPoint, { units: 'meters' });
        const distanceMeters = Math.round(nearest.properties.dist);
        onDistanceUpdate(distanceMeters);
      } catch (error) {
        console.error('Error calculating distance:', error);
      }
    }
  }, [userLocation, routeCoordinates, onDistanceUpdate]);

  if (!geoJson || positions.length === 0) {
    return (
      <div className="h-96 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
        <div className="text-center">
          <MapPin className="w-12 h-12 mx-auto mb-2 text-slate-400" />
          <p>No GPS route available</p>
        </div>
      </div>
    );
  }

  const startPos = positions[0];
  const endPos = positions[positions.length - 1];
  const center = userLocation 
    ? [userLocation.lat, userLocation.lng]
    : startPos;

  return (
    <div className="h-96 rounded-lg overflow-hidden border-2 border-slate-200">
      <MapContainer
        center={center}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Route line */}
        <Polyline
          positions={positions}
          color="#F7B602"
          weight={5}
          opacity={0.8}
        />

        {/* Start marker */}
        <Marker position={startPos}>
          <Popup>
            <div className="text-center">
              <strong>Start</strong>
              <br />
              Test Centre
            </div>
          </Popup>
        </Marker>

        {/* End marker */}
        <Marker position={endPos}>
          <Popup>
            <div className="text-center">
              <strong>Finish</strong>
              <br />
              Return to Centre
            </div>
          </Popup>
        </Marker>

        {/* User location */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={createUserLocationIcon(userHeading)}
          >
            <Popup>
              <div className="text-center">
                <strong>Your Location</strong>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Map controllers */}
        {bounds && <FitBounds bounds={bounds} />}
        <MapController 
          center={userLocation ? [userLocation.lat, userLocation.lng] : center}
          zoom={16}
          followUser={followUser}
        />
      </MapContainer>
    </div>
  );
}