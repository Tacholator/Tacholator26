import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Volume2, VolumeX, Navigation2, Plus, Minus, Locate,
  Loader2, MapPin, Map as MapIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function computeBearing(lat1, lng1, lat2, lng2) {
  const toRad = d => d * Math.PI / 180;
  const toDeg = r => r * 180 / Math.PI;
  const φ1 = toRad(lat1), φ2 = toRad(lat2);
  const Δλ = toRad(lng2 - lng1);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function computeHeadingOrBearing(headingDeg, lat, lng, lastLat, lastLng) {
  if (headingDeg != null && !isNaN(Number(headingDeg))) return Number(headingDeg);
  if (lastLat == null || lastLng == null) return 0;
  const dLat = Math.abs(lat - lastLat), dLng = Math.abs(lng - lastLng);
  if (dLat < 0.00001 && dLng < 0.00001) return 0;
  return computeBearing(lastLat, lastLng, lat, lng);
}

function distanceToRoute(lat, lng, routeCoords) {
  if (!routeCoords || routeCoords.length === 0) return Infinity;
  let best = Infinity;
  for (const [rLng, rLat] of routeCoords) {
    const d = haversineMeters(lat, lng, rLat, rLng);
    if (d < best) best = d;
  }
  return best;
}

function formatDistance(m) {
  if (m == null) return '';
  if (m >= 1000) return (m / 1000 * 0.621371).toFixed(1) + ' mi';
  return Math.round(m * 3.28084) + ' ft';
}

function formatDuration(s) {
  if (s == null) return '—';
  const mins = Math.round(s / 60);
  if (mins < 60) return mins + ' min';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h + 'h ' + m + 'm';
}

function formatETA(remainingSeconds) {
  if (remainingSeconds == null) return '—';
  const now = new Date();
  const etaDate = new Date(now.getTime() + remainingSeconds * 1000);
  const hours = String(etaDate.getHours()).padStart(2, '0');
  const mins = String(etaDate.getMinutes()).padStart(2, '0');
  return `${hours}:${mins}`;
}

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function speak(text, lang = 'en-GB', rate = 1.0) {
  if (!text) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = lang;
  utt.rate = rate;
  utt.volume = 1;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v =>
    v.lang === 'en-GB' || v.name.includes('Google UK') || v.name.includes('Karen') || v.name.includes('Samantha')
  );
  if (preferred) utt.voice = preferred;
  window.speechSynthesis.speak(utt);
}

// ─── OSM Mini Roundabout Detection ───────────────────────────────────────────

async function fetchMiniRoundabouts(coords) {
  const lats = coords.map(c => c[1]);
  const lngs = coords.map(c => c[0]);
  const south = Math.min(...lats) - 0.002;
  const north = Math.max(...lats) + 0.002;
  const west = Math.min(...lngs) - 0.002;
  const east = Math.max(...lngs) + 0.002;
  const query = `[out:json][timeout:10];node["highway"="mini_roundabout"](${south},${west},${north},${east});out;`;
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: 'data=' + encodeURIComponent(query)
  });
  const data = await res.json();
  return (data.elements || []).map(el => ({ lat: el.lat, lng: el.lon }));
}

function isNearMiniRoundabout(lat, lng, miniRoundabouts, thresholdMeters = 25) {
  return miniRoundabouts.some(mr => haversineMeters(lat, lng, mr.lat, mr.lng) <= thresholdMeters);
}

// ─── Google maneuver → modifier mapping ──────────────────────────────────────

function getModifierFromGoogle(maneuver) {
  if (!maneuver) return 'straight';
  const m = maneuver.toLowerCase();
  if (m.includes('uturn')) return 'uturn';
  if (m === 'turn-slight-left' || m === 'keep-left' || m === 'fork-left') return 'slight left';
  if (m === 'turn-slight-right' || m === 'keep-right' || m === 'fork-right') return 'slight right';
  if (m.includes('left') || m === 'ramp-left') return 'left';
  if (m.includes('right') || m === 'ramp-right') return 'right';
  return 'straight';
}

// ─── Step normalization from Google Directions ────────────────────────────────

function normalizeGoogleSteps(legs, miniRoundabouts = []) {
  const allSteps = legs.flatMap(leg => leg.steps || []);
  return allSteps.map((s, i) => {
    const maneuver = s.maneuver || '';
    const htmlInstr = s.html_instructions || '';
    const instr = htmlInstr.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    const isRoundabout = maneuver.startsWith('roundabout') || /roundabout/i.test(instr);
    const mod = getModifierFromGoogle(maneuver);

    // Parse exit number from instruction text (e.g. "Take the 2nd exit")
    let exitNum = null;
    const exitMatch = instr.match(/(\d+)(st|nd|rd|th)\s+exit/i);
    if (exitMatch) exitNum = parseInt(exitMatch[1]);
    if (!exitNum) {
      const words = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6 };
      const wordMatch = instr.match(/\b(first|second|third|fourth|fifth|sixth)\s+exit/i);
      if (wordMatch) exitNum = words[wordMatch[1].toLowerCase()] || null;
    }

    const manLat = typeof s.start_location?.lat === 'function' ? s.start_location.lat() : (s.start_location?.lat || null);
    const manLng = typeof s.start_location?.lng === 'function' ? s.start_location.lng() : (s.start_location?.lng || null);

    const isMiniRoundabout = !isRoundabout && manLat != null && isNearMiniRoundabout(manLat, manLng, miniRoundabouts);

    // Convert step path (array of LatLng) to {lat, lng} objects
    const rawPath = (s.path || []).map(p => ({
      lat: typeof p.lat === 'function' ? p.lat() : p.lat,
      lng: typeof p.lng === 'function' ? p.lng() : p.lng
    }));

    return {
      index: i,
      name: instr,
      distance: s.distance?.value || 0,
      duration: s.duration?.value || 0,
      rawInstruction: instr,
      maneuverType: maneuver,
      maneuverModifier: mod,
      maneuverLat: manLat,
      maneuverLng: manLng,
      isRoundabout,
      isMiniRoundabout,
      roundaboutExitNum: isRoundabout ? exitNum : null,
      rawPath,
    };
  });
}

// ─── Banner logic ─────────────────────────────────────────────────────────────

function roundaboutPhrase(exitNum) {
  if (exitNum === 1) return 'Take the 1st exit at the roundabout';
  if (exitNum === 2) return 'Take the 2nd exit at the roundabout';
  if (exitNum === 3) return 'Take the 3rd exit at the roundabout';
  if (exitNum > 0) return `Take the ${ordinal(exitNum)} exit at the roundabout`;
  return 'Follow the roundabout';
}

function miniRoundaboutPhrase(mod) {
  if (mod === 'left' || mod === 'slight left') return 'At the mini roundabout, turn left';
  if (mod === 'right' || mod === 'slight right') return 'At the mini roundabout, turn right';
  return 'At the mini roundabout, go straight ahead';
}

function buildBanner(step) {
  if (!step) return { title: 'Follow the route', iconKey: 'default', sub: '' };
  if (step.isMiniRoundabout) {
    const mod = step.maneuverModifier;
    return {
      title: miniRoundaboutPhrase(mod),
      iconKey: mod === 'left' || mod === 'slight left' ? 'roundabout_left' : mod === 'right' || mod === 'slight right' ? 'roundabout_right' : 'roundabout',
      sub: 'Mini roundabout',
    };
  }
  if (step.isRoundabout) {
    return {
      title: roundaboutPhrase(step.roundaboutExitNum),
      iconKey: step.roundaboutExitNum === 1 ? 'roundabout_1st' : step.roundaboutExitNum === 2 ? 'roundabout_2nd' : step.roundaboutExitNum === 3 ? 'roundabout_3rd' : 'roundabout',
      sub: step.roundaboutExitNum ? `Exit ${step.roundaboutExitNum}` : 'Roundabout',
    };
  }
  const mod = step.maneuverModifier;
  const iconKey = mod === 'left' ? 'turn_left' : mod === 'right' ? 'turn_right' : mod === 'slight left' ? 'slight_left' : mod === 'slight right' ? 'slight_right' : mod === 'uturn' ? 'uturn' : 'straight';
  return {
    title: step.rawInstruction || 'Continue',
    iconKey,
    sub: '',
  };
}

function buildSpeechText(step, prefix) {
  if (!step) return 'Continue.';
  let core;
  if (step.isMiniRoundabout) {
    core = miniRoundaboutPhrase(step.maneuverModifier).toLowerCase();
  } else if (step.isRoundabout) {
    core = roundaboutPhrase(step.roundaboutExitNum).toLowerCase();
  } else {
    core = (step.rawInstruction || 'continue').replace(/\.+$/, '');
  }
  return prefix ? `${prefix}, ${core}.` : `${core}.`;
}

// ─── Maneuver Icon SVG Component ─────────────────────────────────────────────

function ManeuverIcon({ iconKey, size = 40 }) {
  const color = '#071739';
  const style = { width: size, height: size, flexShrink: 0 };

  if (iconKey === 'turn_left' || iconKey === 'slight_left') {
    return (
      <svg style={style} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="20" fill="#F7B602" />
        <path d="M16 10v8h8v10" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M12 14l4-4 4 4" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (iconKey === 'turn_right' || iconKey === 'slight_right') {
    return (
      <svg style={style} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="20" fill="#F7B602" />
        <path d="M24 10v8h-8v10" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M28 14l-4-4-4 4" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (iconKey === 'straight') {
    return (
      <svg style={style} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="20" fill="#F7B602" />
        <path d="M20 30V10" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M15 15l5-5 5 5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (iconKey?.startsWith('roundabout')) {
    const exit = iconKey === 'roundabout_1st' ? 1 : iconKey === 'roundabout_2nd' ? 2 : iconKey === 'roundabout_3rd' ? 3 : null;
    const isLeft = iconKey === 'roundabout_left';
    const isRight = iconKey === 'roundabout_right';
    return (
      <svg style={style} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="20" fill="#F7B602" />
        <circle cx="20" cy="20" r="8" stroke={color} strokeWidth="2" fill="none" />
        <path d="M20 12a8 8 0 0 1 8 8" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <path d="M28 18l-1.5-3.5L30 17" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {exit && <text x="20" y="24" textAnchor="middle" fontSize="9" fontWeight="bold" fill={color}>{exit}</text>}
        {(isLeft || isRight) && <text x="20" y="24" textAnchor="middle" fontSize="7" fontWeight="bold" fill={color}>{isLeft ? '←' : '→'}</text>}
      </svg>
    );
  }
  if (iconKey === 'uturn') {
    return (
      <svg style={style} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="20" fill="#F7B602" />
        <path d="M16 28V18a6 6 0 0 1 12 0v2" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M24 16l4 4-4 4" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg style={style} viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="20" fill="#F7B602" />
      <path d="M20 30V10M15 15l5-5 5 5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;

export default function RouteNavigationOverlay({ route, onClose }) {
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [userHeading, setUserHeading] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [followMode, setFollowMode] = useState(true);

  // Navigation state
  const [navSteps, setNavSteps] = useState([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [distanceToManeuver, setDistanceToManeuver] = useState(null);
  const [totalDistance, setTotalDistance] = useState(null);
  const [totalDuration, setTotalDuration] = useState(null);
  const [banner, setBanner] = useState({ title: 'Preparing route...', iconKey: 'default', sub: '' });
  const [isOffRoute, setIsOffRoute] = useState(false);
  const [isRerouting, setIsRerouting] = useState(false);

  // Map DOM ref and Google Maps instances
  const mapDivRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routePolylineRef = useRef(null);
  const activePolylineRef = useRef(null);
  const startMarkerRef = useRef(null);
  const endMarkerRef = useRef(null);
  const userMarkerRef = useRef(null);

  // Navigation refs
  const watchIdRef = useRef(null);
  const firstFixRef = useRef(false);
  const hasStartedRef = useRef(false);
  const offRouteCounterRef = useRef(0);
  const lastRerouteRef = useRef(0);
  const milestonesRef = useRef({ prepare: false, approach: false, now: false });
  const lastSpokenAtRef = useRef(0);
  const lastCameraUpdateRef = useRef(0);
  const lastLatRef = useRef(null);
  const lastLngRef = useRef(null);
  const userLocationRef = useRef(null);
  const navStepsRef = useRef([]);
  const stepIndexRef = useRef(0);
  const isMutedRef = useRef(false);
  const computedBearingRef = useRef(0);
  const followModeRef = useRef(true);

  // Keep refs in sync
  useEffect(() => { userLocationRef.current = userLocation; }, [userLocation]);
  useEffect(() => { navStepsRef.current = navSteps; }, [navSteps]);
  useEffect(() => { stepIndexRef.current = stepIndex; }, [stepIndex]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { followModeRef.current = followMode; }, [followMode]);
  useEffect(() => { hasStartedRef.current = hasStarted; }, [hasStarted]);

  const routeGeoJson = route?.gpsGeoJson || null;
  const startCoord = routeGeoJson?.geometry?.coordinates?.[0];
  const endCoord = routeGeoJson?.geometry?.coordinates?.[routeGeoJson?.geometry?.coordinates?.length - 1];

  const getRouteCenter = () => {
    if (!routeGeoJson?.geometry?.coordinates?.length) return { lat: 53.8, lng: -1.5 };
    const coords = routeGeoJson.geometry.coordinates;
    const avgLng = coords.reduce((s, [lng]) => s + lng, 0) / coords.length;
    const avgLat = coords.reduce((s, [, lat]) => s + lat, 0) / coords.length;
    return { lat: avgLat, lng: avgLng };
  };

  // ── Load Google Maps script ──────────────────────────────────────────────────
  useEffect(() => {
    if (window.google?.maps) { setGoogleLoaded(true); return; }
    // Use a global callback — required by modern Google Maps JS API
    const callbackName = '__googleMapsReady__';
    window[callbackName] = () => setGoogleLoaded(true);
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=geometry&callback=${callbackName}&loading=async`;
    script.async = true;
    script.defer = true;
    script.onerror = () => console.error('Failed to load Google Maps — check API key and enabled APIs');
    document.head.appendChild(script);
    return () => { delete window[callbackName]; };
  }, []);

  // ── Create Google Map instance ───────────────────────────────────────────────
  useEffect(() => {
    if (!googleLoaded || !mapDivRef.current || mapInstanceRef.current) return;

    const center = getRouteCenter();
    const mapInstance = new window.google.maps.Map(mapDivRef.current, {
      center,
      zoom: 14,
      mapTypeId: 'roadmap',
      disableDefaultUI: true,
      gestureHandling: 'greedy',
      styles: [
        { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }
      ],
    });
    mapInstanceRef.current = mapInstance;

    // Draw route polyline
    if (routeGeoJson?.geometry?.coordinates?.length) {
      const path = routeGeoJson.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
      routePolylineRef.current = new window.google.maps.Polyline({
        path,
        map: mapInstance,
        strokeColor: '#1E6BFF',
        strokeWeight: 8,
        strokeOpacity: 0.9,
        zIndex: 1,
      });

      // Active segment polyline (rendered on top, updated as steps advance)
      activePolylineRef.current = new window.google.maps.Polyline({
        path: [],
        map: mapInstance,
        strokeColor: '#F7B602',
        strokeWeight: 10,
        strokeOpacity: 1,
        zIndex: 2,
      });

      // Fit bounds to route
      const bounds = new window.google.maps.LatLngBounds();
      path.forEach(p => bounds.extend(p));
      mapInstance.fitBounds(bounds, 40);
    }

    // Start marker
    if (startCoord) {
      startMarkerRef.current = new window.google.maps.Marker({
        position: { lat: startCoord[1], lng: startCoord[0] },
        map: mapInstance,
        zIndex: 5,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 14,
          fillColor: '#22c55e',
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 2,
        },
        label: { text: 'S', color: 'white', fontWeight: 'bold', fontSize: '13px' },
      });
    }

    // End marker
    if (endCoord) {
      endMarkerRef.current = new window.google.maps.Marker({
        position: { lat: endCoord[1], lng: endCoord[0] },
        map: mapInstance,
        zIndex: 5,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 14,
          fillColor: '#ef4444',
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 2,
        },
        label: { text: 'F', color: 'white', fontWeight: 'bold', fontSize: '13px' },
      });
    }

    // Detect manual map movement to disable followMode
    mapInstance.addListener('drag', () => {
      if (hasStartedRef.current && firstFixRef.current) {
        setFollowMode(false);
      }
    });

    setMapReady(true);
  }, [googleLoaded]);

  // ── Build route using Google Directions API ───────────────────────────────────
  const buildRoute = useCallback(async (originLat, originLng) => {
    if (!routeGeoJson?.geometry?.coordinates?.length || !window.google?.maps) return;

    const coords = routeGeoJson.geometry.coordinates;
    const [destLng, destLat] = coords[coords.length - 1];

    const step = Math.max(1, Math.floor(coords.length / 6));
    const waypoints = coords
      .filter((_, i) => i > 0 && i < coords.length - 1 && i % step === 0)
      .slice(0, 8)
      .map(([lng, lat]) => ({ location: { lat, lng }, stopover: false }));

    const directionsService = new window.google.maps.DirectionsService();
    const result = await directionsService.route({
      origin: { lat: originLat, lng: originLng },
      destination: { lat: destLat, lng: destLng },
      waypoints,
      optimizeWaypoints: false,
      travelMode: window.google.maps.TravelMode.DRIVING,
      region: 'GB',
      provideRouteAlternatives: false,
    });

    if (result.status !== 'OK' || !result.routes?.length) {
      console.warn('Google Directions failed:', result.status);
      return;
    }

    const route = result.routes[0];
    const totalDist = route.legs.reduce((s, l) => s + (l.distance?.value || 0), 0);
    const totalDur = route.legs.reduce((s, l) => s + (l.duration?.value || 0), 0);
    setTotalDistance(totalDist);
    setTotalDuration(totalDur);

    // Fetch mini roundabouts from OSM
    let miniRoundabouts = [];
    try {
      miniRoundabouts = await fetchMiniRoundabouts(routeGeoJson.geometry.coordinates);
    } catch (e) {
      console.warn('Mini roundabout fetch failed:', e);
    }

    const steps = normalizeGoogleSteps(route.legs, miniRoundabouts);
    setNavSteps(steps);
    navStepsRef.current = steps;
    setStepIndex(0);
    stepIndexRef.current = 0;
    milestonesRef.current = { prepare: false, approach: false, now: false };

    setBanner(buildBanner(steps[0]));

    // Update active segment polyline
    if (steps[0]?.rawPath?.length && activePolylineRef.current) {
      activePolylineRef.current.setPath(steps[0].rawPath);
    }

    return steps;
  }, [routeGeoJson]);

  // ── Handle GPS location updates ───────────────────────────────────────────────
  const handleLocationUpdate = useCallback((position) => {
    const { latitude, longitude, accuracy, heading, speed } = position.coords;

    if (!firstFixRef.current && accuracy > 50) return;

    const bearing = computeHeadingOrBearing(heading, latitude, longitude, lastLatRef.current, lastLngRef.current);
    computedBearingRef.current = bearing;
    lastLatRef.current = latitude;
    lastLngRef.current = longitude;

    const newLoc = { latitude, longitude, accuracy };
    setUserLocation(newLoc);
    userLocationRef.current = newLoc;
    setUserHeading(bearing);

    // Update/create user location marker
    if (mapInstanceRef.current) {
      const pos = { lat: latitude, lng: longitude };
      const userIcon = {
        path: 'M 0,-1 L 0.6,0.8 L 0,0.4 L -0.6,0.8 Z',
        fillColor: '#F7B602',
        fillOpacity: 1,
        strokeColor: '#071739',
        strokeWeight: 0.5,
        scale: 20,
        rotation: bearing,
        anchor: new window.google.maps.Point(0, 0),
      };
      if (!userMarkerRef.current) {
        userMarkerRef.current = new window.google.maps.Marker({
          position: pos,
          map: mapInstanceRef.current,
          icon: userIcon,
          zIndex: 10,
        });
      } else {
        userMarkerRef.current.setPosition(pos);
        userMarkerRef.current.setIcon(userIcon);
      }
    }

    if (!firstFixRef.current) {
      firstFixRef.current = true;
      setIsLoading(false);

      // Set navigation camera
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setCenter({ lat: latitude, lng: longitude });
        mapInstanceRef.current.setZoom(17);
        mapInstanceRef.current.setTilt(45);
        mapInstanceRef.current.setHeading(bearing);
      }

      buildRoute(latitude, longitude).then(steps => {
        if (steps?.length && !isMutedRef.current) {
          setTimeout(() => speak('Starting route guidance.'), 500);
          setTimeout(() => speak(buildSpeechText(steps[0], null)), 2000);
        }
      });
      return;
    }

    // Follow mode camera — throttled to 500ms
    if (followModeRef.current && mapInstanceRef.current) {
      const now = Date.now();
      if (now - lastCameraUpdateRef.current >= 500) {
        lastCameraUpdateRef.current = now;
        mapInstanceRef.current.panTo({ lat: latitude, lng: longitude });
        if (speed != null && speed >= 1.0) {
          mapInstanceRef.current.setHeading(bearing);
        }
      }
    }

    const steps = navStepsRef.current;
    const idx = stepIndexRef.current;
    if (!steps.length) return;

    const curStep = steps[idx];

    // Distance to current maneuver
    if (curStep?.maneuverLat != null && curStep?.maneuverLng != null) {
      const d = haversineMeters(latitude, longitude, curStep.maneuverLat, curStep.maneuverLng);
      setDistanceToManeuver(d);

      // Voice milestones
      const now = Date.now();
      if (now - lastSpokenAtRef.current > 3000 && !isMutedRef.current) {
        const m = milestonesRef.current;
        if (d <= 60 && !m.now) {
          speak(buildSpeechText(curStep, 'Now'));
          lastSpokenAtRef.current = now;
          milestonesRef.current = { ...m, now: true };
        } else if (d <= 200 && !m.approach) {
          speak(buildSpeechText(curStep, 'In 200 metres'));
          lastSpokenAtRef.current = now;
          milestonesRef.current = { ...m, approach: true };
        } else if (d <= 500 && !m.prepare) {
          speak(buildSpeechText(curStep, 'In 500 metres'));
          lastSpokenAtRef.current = now;
          milestonesRef.current = { ...m, prepare: true };
        }
      }

      // Advance step
      if (d <= 20 && idx < steps.length - 1) {
        const nextIdx = idx + 1;
        setStepIndex(nextIdx);
        stepIndexRef.current = nextIdx;
        milestonesRef.current = { prepare: false, approach: false, now: false };

        const nextStep = steps[nextIdx];
        setBanner(buildBanner(nextStep));

        if (nextStep?.rawPath?.length && activePolylineRef.current) {
          activePolylineRef.current.setPath(nextStep.rawPath);
        }

        if (!isMutedRef.current) {
          setTimeout(() => speak(buildSpeechText(nextStep, null)), 500);
        }
      } else if (d <= 20 && idx === steps.length - 1) {
        setBanner({ title: 'You have arrived!', iconKey: 'arrive', sub: '' });
        if (!isMutedRef.current) speak('You have arrived at your destination.');
      }
    }

    // Off-route detection
    const routeCoords = routeGeoJson?.geometry?.coordinates || [];
    if (routeCoords.length > 0) {
      const distToRoute = distanceToRoute(latitude, longitude, routeCoords);
      if (distToRoute > 40) {
        offRouteCounterRef.current += 1;
        setIsOffRoute(true);
      } else {
        offRouteCounterRef.current = 0;
        setIsOffRoute(false);
      }

      const nowMs = Date.now();
      if (offRouteCounterRef.current >= 10 && nowMs - lastRerouteRef.current > 20000) {
        lastRerouteRef.current = nowMs;
        offRouteCounterRef.current = 0;
        setIsRerouting(true);
        if (!isMutedRef.current) speak('Recalculating route.');
        buildRoute(latitude, longitude).then(() => {
          setIsRerouting(false);
          if (!isMutedRef.current) setTimeout(() => speak('Route updated.'), 500);
        });
      }
    }
  }, [buildRoute, routeGeoJson]);

  // ── Start GPS watch ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasStarted || !mapReady) return;
    if (!navigator.geolocation) { setIsLoading(false); return; }

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleLocationUpdate,
      (err) => { console.error('GPS error:', err); setIsLoading(false); },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 }
    );

    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [hasStarted, mapReady]);

  // ── Re-register watcher when handler changes ────────────────────────────────
  useEffect(() => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = navigator.geolocation.watchPosition(
        handleLocationUpdate,
        (err) => console.error('GPS error:', err),
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 }
      );
    }
  }, [handleLocationUpdate]);

  const handleStart = () => {
    setIsLoading(true);
    setHasStarted(true);
    setFollowMode(true);
    const startPt = routeGeoJson?.geometry?.coordinates?.[0];
    if (startPt && mapInstanceRef.current) {
      const coords = routeGeoJson.geometry.coordinates;
      let initBearing = 0;
      if (coords.length >= 2) {
        initBearing = computeBearing(coords[0][1], coords[0][0], coords[1][1], coords[1][0]);
      }
      mapInstanceRef.current.setCenter({ lat: startPt[1], lng: startPt[0] });
      mapInstanceRef.current.setZoom(17);
      mapInstanceRef.current.setTilt(45);
      mapInstanceRef.current.setHeading(initBearing);
    }
  };

  const handleEnd = () => {
    window.speechSynthesis.cancel();
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
    onClose();
  };

  const handleToggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    isMutedRef.current = newMuted;
    if (newMuted) window.speechSynthesis.cancel();
    else speak('Voice guidance on.');
  };

  const handleRecenter = () => {
    setFollowMode(true);
    if (userLocation && mapInstanceRef.current) {
      mapInstanceRef.current.panTo({ lat: userLocation.latitude, lng: userLocation.longitude });
      mapInstanceRef.current.setZoom(17);
      mapInstanceRef.current.setTilt(45);
      mapInstanceRef.current.setHeading(computedBearingRef.current || 0);
    }
  };

  const handleOverviewRoute = () => {
    if (!routeGeoJson || !mapInstanceRef.current) return;
    setFollowMode(false);
    const bounds = new window.google.maps.LatLngBounds();
    routeGeoJson.geometry.coordinates.forEach(([lng, lat]) => bounds.extend({ lat, lng }));
    mapInstanceRef.current.fitBounds(bounds, 40);
    mapInstanceRef.current.setTilt(0);
    mapInstanceRef.current.setHeading(0);
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.setZoom((mapInstanceRef.current.getZoom() || 14) + 1);
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.setZoom(Math.max((mapInstanceRef.current.getZoom() || 14) - 1, 1));
  };

  // Route metrics
  const routeMetrics = (() => {
    if (!routeGeoJson?.geometry?.coordinates) return { distance: 0, duration: 0 };
    const coords = routeGeoJson.geometry.coordinates;
    let dist = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      const [lng1, lat1] = coords[i];
      const [lng2, lat2] = coords[i + 1];
      dist += haversineMeters(lat1, lng1, lat2, lng2);
    }
    const distance = (dist / 1000 * 0.621371).toFixed(1);
    const duration = totalDuration ? Math.round(totalDuration / 60) : Math.round(dist / 1000 / 80 * 60);
    return { distance, duration };
  })();

  const remainingSteps = navSteps.slice(stepIndex);
  const remainingDist = remainingSteps.reduce((s, st) => s + (st.distance || 0), 0);
  const remainingDuration = remainingSteps.reduce((s, st) => s + (st.duration || 0), 0);

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col">
      {/* ── Map container ─────────────────────────────────────────────────── */}
      <div className="flex-1 relative">
        <div ref={mapDivRef} style={{ width: '100%', height: '100%' }} />

        {/* Loading overlay while Google Maps script loads */}
        {!googleLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
            <div className="flex items-center gap-2 text-slate-600">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Loading map...</span>
            </div>
          </div>
        )}

        {/* ── Zoom + controls ─────────────────────────────────────────────── */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2">
          {hasStarted && !followMode && (
            <Button onClick={handleRecenter} size="icon" className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739] shadow-lg" title="Recenter">
              <Locate className="w-5 h-5" />
            </Button>
          )}
          {routeGeoJson && (
            <Button onClick={handleOverviewRoute} size="icon" className="bg-white hover:bg-slate-100 text-slate-900 shadow-lg" title="Overview route">
              <MapIcon className="w-5 h-5" />
            </Button>
          )}
          <Button onClick={handleZoomIn} size="icon" className="bg-white hover:bg-slate-100 text-slate-900 shadow-lg">
            <Plus className="w-5 h-5" />
          </Button>
          <Button onClick={handleZoomOut} size="icon" className="bg-white hover:bg-slate-100 text-slate-900 shadow-lg">
            <Minus className="w-5 h-5" />
          </Button>
          {hasStarted && (
            <Button onClick={handleToggleMute} size="icon" className="bg-white hover:bg-slate-100 text-slate-900 shadow-lg">
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
          )}
        </div>

        {/* ── Top navigation banner ──────────────────────────────────────── */}
        <AnimatePresence>
          {hasStarted && !isLoading && (
            <motion.div
              key="banner"
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              className="absolute top-4 left-2 right-2 z-10 mx-auto w-11/12"
            >
              <Card className="bg-[#071739] backdrop-blur-sm shadow-2xl border-0">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <ManeuverIcon iconKey={banner.iconKey} size={44} />
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-white leading-tight">{banner.title}</p>
                      {banner.sub && <p className="text-xs text-slate-300 mt-0.5 truncate">{banner.sub}</p>}
                    </div>
                    {distanceToManeuver != null && distanceToManeuver > 0 && (
                      <Badge className="bg-[#071739] text-white text-sm font-bold px-3 py-1 shrink-0 border border-slate-600">
                        {formatDistance(distanceToManeuver)}
                      </Badge>
                    )}
                  </div>
                  {isRerouting && (
                    <div className="mt-2 flex items-center gap-2 text-blue-400 bg-blue-900/30 px-2 py-1 rounded text-xs">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Recalculating route...</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── GPS loading spinner ─────────────────────────────────────────── */}
        {isLoading && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <Card className="bg-white/95 backdrop-blur-sm shadow-2xl">
              <CardContent className="p-6 flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-[#F7B602] animate-spin" />
                <p className="text-lg font-semibold text-[#071739]">Getting GPS fix...</p>
                <p className="text-sm text-slate-500">Waiting for accurate location</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* ── Bottom panel ──────────────────────────────────────────────────── */}
      {!hasStarted ? (
        <div className="bg-[#071739] shadow-2xl p-3 pb-4 lg:p-3 lg:pb-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-bold text-white text-lg">{route?.routeName || 'Route'}</p>
              <p className="text-slate-300 text-sm">
                {routeMetrics.distance} mi · approx {routeMetrics.duration} min
              </p>
            </div>
            <div className="flex items-center gap-1 text-white text-xs">
              <MapPin className="w-3 h-3" />
              <span>Route preview</span>
            </div>
          </div>
          <Button
            onClick={handleStart}
            className="w-full bg-[#228B22] hover:bg-[#1a6b1a] text-white text-lg py-6 font-bold"
          >
            <Navigation2 className="w-5 h-5 mr-2" />
            Go
          </Button>
        </div>
      ) : (
        <AnimatePresence>
          {!isLoading && (
            <motion.div
              key="footer"
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-[#071739] shadow-2xl px-4 py-2 pb-4 lg:py-2 lg:pb-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex gap-6">
                  <div>
                    <p className="text-xs text-slate-300 uppercase tracking-wide">Time</p>
                    <p className="font-bold text-white">
                      {totalDuration != null ? formatDuration(remainingDuration) : `~${routeMetrics.duration} min`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-300 uppercase tracking-wide">Distance</p>
                    <p className="font-bold text-white">
                      {totalDistance != null ? formatDistance(remainingDist) : `${routeMetrics.distance} mi`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-300 uppercase tracking-wide">ETA</p>
                    <p className="font-bold text-white">
                      {totalDuration != null ? formatETA(remainingDuration) : '—'}
                    </p>
                  </div>
                </div>
                <Button onClick={handleEnd} variant="destructive" size="sm" className="font-semibold px-5">
                  End
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}