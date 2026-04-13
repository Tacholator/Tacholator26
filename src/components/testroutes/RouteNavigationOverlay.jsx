import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Volume2, VolumeX, Navigation2, Plus, Minus, Locate,
  Loader2, Map as MapIcon, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Distance / Time Formatters (UK) ─────────────────────────────────────────

function formatDistanceUK(m) {
  if (m == null) return '';
  if (m >= 1000) return (m / 1000 * 0.621371).toFixed(1) + ' mi';
  const rounded = Math.round(m / 50) * 50 || 50;
  return rounded + ' m';
}

function formatDistanceSpeechUK(m) {
  if (m == null) return '';
  if (m >= 900) {
    const miles = (m / 1000 * 0.621371).toFixed(1);
    return `In ${miles} miles`;
  }
  if (m >= 450) return 'In half a mile';
  if (m >= 250) return 'In 300 metres';
  if (m >= 140) return 'In 200 metres';
  return 'In 100 metres';
}

function formatDuration(s) {
  if (s == null) return '—';
  const mins = Math.round(s / 60);
  if (mins < 60) return mins + ' min';
  return Math.floor(mins / 60) + 'h ' + (mins % 60) + 'm';
}

function formatETA(remainingSeconds) {
  if (remainingSeconds == null) return '—';
  const eta = new Date(Date.now() + remainingSeconds * 1000);
  return String(eta.getHours()).padStart(2, '0') + ':' + String(eta.getMinutes()).padStart(2, '0');
}

function formatSpeedKmh(mps) {
  if (mps == null || isNaN(mps)) return null;
  return Math.round(mps * 3.6) + ' km/h';
}

// ─── Geo Helpers ──────────────────────────────────────────────────────────────

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

// Smooth bearing: only update if change > threshold degrees
function smoothBearing(current, next, threshold = 8) {
  let diff = ((next - current) + 540) % 360 - 180;
  if (Math.abs(diff) < threshold) return current;
  // Lerp toward target
  return (current + diff * 0.4 + 360) % 360;
}

function distanceToSegment(lat, lng, lat1, lng1, lat2, lng2) {
  const dx = lat2 - lat1, dy = lng2 - lng1;
  if (dx === 0 && dy === 0) return haversineMeters(lat, lng, lat1, lng1);
  const t = Math.max(0, Math.min(1, ((lat - lat1) * dx + (lng - lng1) * dy) / (dx * dx + dy * dy)));
  return haversineMeters(lat, lng, lat1 + t * dx, lng1 + t * dy);
}

function distanceToRoute(lat, lng, routeCoords) {
  if (!routeCoords || routeCoords.length === 0) return Infinity;
  let best = Infinity;
  for (let i = 0; i < routeCoords.length - 1; i++) {
    const [lng1, lat1] = routeCoords[i];
    const [lng2, lat2] = routeCoords[i + 1];
    const d = distanceToSegment(lat, lng, lat1, lng1, lat2, lng2);
    if (d < best) best = d;
  }
  return best;
}

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// ─── Voice Guidance ───────────────────────────────────────────────────────────

let _voiceQueue = [];
let _isSpeaking = false;

function speakQueued(text, priority = false) {
  if (!text) return;
  if (priority) {
    window.speechSynthesis.cancel();
    _voiceQueue = [];
    _isSpeaking = false;
  }
  _voiceQueue.push(text);
  if (!_isSpeaking) _drainQueue();
}

function _drainQueue() {
  if (_voiceQueue.length === 0) { _isSpeaking = false; return; }
  _isSpeaking = true;
  const text = _voiceQueue.shift();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'en-GB';
  utt.rate = 0.95;
  utt.volume = 1;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v =>
    v.name.includes('Google UK') || v.name.includes('Daniel') || v.lang === 'en-GB'
  );
  if (preferred) utt.voice = preferred;
  utt.onend = () => { _isSpeaking = false; _drainQueue(); };
  utt.onerror = () => { _isSpeaking = false; _drainQueue(); };
  window.speechSynthesis.speak(utt);
}

function cancelSpeech() {
  window.speechSynthesis.cancel();
  _voiceQueue = [];
  _isSpeaking = false;
}

// ─── OSM Mini Roundabout Detection ───────────────────────────────────────────

async function fetchMiniRoundabouts(coords) {
  const lats = coords.map(c => c[1]);
  const lngs = coords.map(c => c[0]);
  const query = `[out:json][timeout:10];node["highway"="mini_roundabout"](${Math.min(...lats) - 0.002},${Math.min(...lngs) - 0.002},${Math.max(...lats) + 0.002},${Math.max(...lngs) + 0.002});out;`;
  const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: 'data=' + encodeURIComponent(query) });
  const data = await res.json();
  return (data.elements || []).map(el => ({ lat: el.lat, lng: el.lon }));
}

function isNearMiniRoundabout(lat, lng, miniRoundabouts, threshold = 25) {
  return miniRoundabouts.some(mr => haversineMeters(lat, lng, mr.lat, mr.lng) <= threshold);
}

// ─── Google Maneuver Parsing ──────────────────────────────────────────────────

function getModifier(maneuver, instrText = '') {
  const m = (maneuver || '').toLowerCase();
  const t = instrText.toLowerCase();
  if (m.includes('uturn') || t.includes('u-turn')) return 'uturn';
  if (m === 'turn-slight-left' || m === 'keep-left' || m === 'fork-left') return 'slight left';
  if (m === 'turn-slight-right' || m === 'keep-right' || m === 'fork-right') return 'slight right';
  if (m.includes('left') || m === 'ramp-left') return 'left';
  if (m.includes('right') || m === 'ramp-right') return 'right';
  if (t.includes('turn left')) return 'left';
  if (t.includes('turn right')) return 'right';
  if (t.includes('slight left') || t.includes('keep left')) return 'slight left';
  if (t.includes('slight right') || t.includes('keep right')) return 'slight right';
  return 'straight';
}

function extractStreetName(instr) {
  if (!instr) return '';
  const m = instr.match(/(?:onto|on|toward|towards)\s+(.+)/i);
  if (m) return m[1].replace(/\s*\(.*?\)/, '').trim();
  return '';
}

function normalizeGoogleSteps(legs, miniRoundabouts = []) {
  return legs.flatMap(leg => leg.steps || []).map((s, i) => {
    const maneuver = s.maneuver || '';
    const instr = (s.html_instructions || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const isRoundabout = maneuver.startsWith('roundabout') || /roundabout/i.test(instr);
    const mod = getModifier(maneuver, instr);

    let exitNum = null;
    const em = instr.match(/(\d+)(st|nd|rd|th)\s+exit/i);
    if (em) exitNum = parseInt(em[1]);
    if (!exitNum) {
      const words = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6 };
      const wm = instr.match(/\b(first|second|third|fourth|fifth|sixth)\s+exit/i);
      if (wm) exitNum = words[wm[1].toLowerCase()] || null;
    }

    const manLat = typeof s.start_location?.lat === 'function' ? s.start_location.lat() : (s.start_location?.lat || null);
    const manLng = typeof s.start_location?.lng === 'function' ? s.start_location.lng() : (s.start_location?.lng || null);
    const isMiniRoundabout = !isRoundabout && manLat != null && isNearMiniRoundabout(manLat, manLng, miniRoundabouts);

    const rawPath = (s.path || []).map(p => ({
      lat: typeof p.lat === 'function' ? p.lat() : p.lat,
      lng: typeof p.lng === 'function' ? p.lng() : p.lng
    }));

    return {
      index: i,
      name: instr,
      streetName: extractStreetName(instr),
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

// ─── Banner + Speech Builders ─────────────────────────────────────────────────

function buildBanner(step) {
  if (!step) return { title: 'Follow the route', iconKey: 'default', sub: '', street: '' };

  if (step.isMiniRoundabout) {
    const mod = step.maneuverModifier;
    return {
      title: mod === 'left' || mod === 'slight left' ? 'At the mini roundabout, turn left'
           : mod === 'right' || mod === 'slight right' ? 'At the mini roundabout, turn right'
           : 'At the mini roundabout, go straight ahead',
      iconKey: mod === 'left' || mod === 'slight left' ? 'roundabout_left'
             : mod === 'right' || mod === 'slight right' ? 'roundabout_right' : 'roundabout',
      sub: 'Mini roundabout',
      street: step.streetName || '',
    };
  }

  if (step.isRoundabout) {
    const mod = step.maneuverModifier;
    const exit = step.roundaboutExitNum;
    return {
      title: exit ? `At the roundabout, take the ${ordinal(exit)} exit` : 'Follow the roundabout',
      iconKey: mod === 'left' || mod === 'slight left' ? 'roundabout_left'
             : mod === 'right' || mod === 'slight right' ? 'roundabout_right'
             : exit === 1 ? 'roundabout_1st' : exit === 2 ? 'roundabout_2nd' : exit === 3 ? 'roundabout_3rd' : 'roundabout',
      sub: exit ? `Exit ${exit}` : 'Roundabout',
      street: step.streetName || '',
    };
  }

  const mod = step.maneuverModifier;
  const iconKey = mod === 'left' ? 'turn_left' : mod === 'right' ? 'turn_right'
                : mod === 'slight left' ? 'slight_left' : mod === 'slight right' ? 'slight_right'
                : mod === 'uturn' ? 'uturn' : 'straight';
  const title = mod === 'left' ? 'Turn left' : mod === 'right' ? 'Turn right'
              : mod === 'slight left' ? 'Keep left' : mod === 'slight right' ? 'Keep right'
              : mod === 'uturn' ? 'Make a U-turn' : 'Continue straight';
  return { title, iconKey, sub: '', street: step.streetName || step.rawInstruction || '' };
}

function buildSpeechAction(step) {
  if (!step) return 'continue ahead';
  if (step.isMiniRoundabout) {
    const mod = step.maneuverModifier;
    return mod === 'left' || mod === 'slight left' ? 'at the mini roundabout, turn left'
         : mod === 'right' || mod === 'slight right' ? 'at the mini roundabout, turn right'
         : 'at the mini roundabout, go straight ahead';
  }
  if (step.isRoundabout) {
    const exit = step.roundaboutExitNum;
    const action = exit ? `take the ${ordinal(exit)} exit` : 'follow the roundabout';
    const street = step.streetName ? ` onto ${step.streetName}` : '';
    return `at the roundabout, ${action}${street}`;
  }
  const mod = step.maneuverModifier;
  const action = mod === 'left' ? 'turn left' : mod === 'right' ? 'turn right'
               : mod === 'slight left' ? 'keep left' : mod === 'slight right' ? 'keep right'
               : mod === 'uturn' ? 'make a U-turn' : 'continue straight ahead';
  const street = step.streetName ? ` onto ${step.streetName}` : '';
  return `${action}${street}`;
}

function buildSpeech(step, distMeters) {
  const action = buildSpeechAction(step);
  if (distMeters == null) return `${action}.`;
  const prefix = formatDistanceSpeechUK(distMeters);
  return `${prefix}, ${action}.`;
}

// ─── Maneuver Icon ────────────────────────────────────────────────────────────

function ManeuverIcon({ iconKey, size = 44 }) {
  const col = '#071739';
  const s = { width: size, height: size, flexShrink: 0 };
  if (iconKey === 'turn_left' || iconKey === 'slight_left') return (
    <svg style={s} viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="20" fill="#F7B602" />
      <path d="M16 10v8h8v10" stroke={col} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M12 14l4-4 4 4" stroke={col} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (iconKey === 'turn_right' || iconKey === 'slight_right') return (
    <svg style={s} viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="20" fill="#F7B602" />
      <path d="M24 10v8h-8v10" stroke={col} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M28 14l-4-4-4 4" stroke={col} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (iconKey === 'uturn') return (
    <svg style={s} viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="20" fill="#F7B602" />
      <path d="M16 28V18a6 6 0 0 1 12 0v2" stroke={col} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M24 16l4 4-4 4" stroke={col} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (iconKey?.startsWith('roundabout')) {
    const exit = iconKey === 'roundabout_1st' ? 1 : iconKey === 'roundabout_2nd' ? 2 : iconKey === 'roundabout_3rd' ? 3 : null;
    const isLeft = iconKey === 'roundabout_left', isRight = iconKey === 'roundabout_right';
    return (
      <svg style={s} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="20" fill="#F7B602" />
        <circle cx="20" cy="20" r="8" stroke={col} strokeWidth="2" fill="none" />
        <path d="M20 12a8 8 0 0 1 8 8" stroke={col} strokeWidth="2" strokeLinecap="round" />
        <path d="M28 18l-1.5-3.5L30 17" stroke={col} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {exit && <text x="20" y="24" textAnchor="middle" fontSize="9" fontWeight="bold" fill={col}>{exit}</text>}
        {(isLeft || isRight) && <text x="20" y="24" textAnchor="middle" fontSize="7" fontWeight="bold" fill={col}>{isLeft ? '←' : '→'}</text>}
      </svg>
    );
  }
  // straight / default
  return (
    <svg style={s} viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="20" fill="#F7B602" />
      <path d="M20 30V10" stroke={col} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M15 15l5-5 5 5" stroke={col} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RouteNavigationOverlay({ route, onClose }) {
  const [googleMapsKey, setGoogleMapsKey] = useState(null);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [googleError, setGoogleError] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Navigation state
  const [hasStarted, setHasStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [followMode, setFollowMode] = useState(true);
  const [isOffRoute, setIsOffRoute] = useState(false);
  const [isRerouting, setIsRerouting] = useState(false);
  const [navSteps, setNavSteps] = useState([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [distanceToManeuver, setDistanceToManeuver] = useState(null);
  const [totalDistance, setTotalDistance] = useState(null);
  const [totalDuration, setTotalDuration] = useState(null);
  const [banner, setBanner] = useState({ title: 'Preparing route...', iconKey: 'default', sub: '' });
  const [currentSpeedMps, setCurrentSpeedMps] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [gpsUnavailable, setGpsUnavailable] = useState(false);

  // Map DOM refs
  const mapDivRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const remainingPolyRef = useRef(null);   // blue — remaining route
  const completedPolyRef = useRef(null);   // grey — driven portion
  const nextLegPolyRef = useRef(null);     // bright — immediate next step
  const startMarkerRef = useRef(null);
  const endMarkerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const accuracyCircleRef = useRef(null);

  // Navigation logic refs
  const watchIdRef = useRef(null);
  const firstFixRef = useRef(false);
  const hasStartedRef = useRef(false);
  const isMutedRef = useRef(false);
  const followModeRef = useRef(true);
  const navStepsRef = useRef([]);
  const stepIndexRef = useRef(0);
  const computedBearingRef = useRef(0);
  const smoothedBearingRef = useRef(0);
  const lastLatRef = useRef(null);
  const lastLngRef = useRef(null);
  const userLocationRef = useRef(null);
  const lastCameraUpdateRef = useRef(0);
  const lastSpokenAtRef = useRef(0);
  const milestonesRef = useRef({ early: false, near: false, now: false });
  const offRouteCounterRef = useRef(0);
  const wasOffRouteRef = useRef(false);
  const lastRerouteRef = useRef(0);
  const lastUserInteractionRef = useRef(0);
  const autoRecenterTimerRef = useRef(null);
  const completedPathRef = useRef([]); // accumulated lat/lng of driven portion

  // Sync refs
  useEffect(() => { hasStartedRef.current = hasStarted; }, [hasStarted]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { followModeRef.current = followMode; }, [followMode]);
  useEffect(() => { navStepsRef.current = navSteps; }, [navSteps]);
  useEffect(() => { stepIndexRef.current = stepIndex; }, [stepIndex]);
  useEffect(() => { userLocationRef.current = userLocation; }, [userLocation]);

  const routeGeoJson = route?.gpsGeoJson || null;
  const allCoords = routeGeoJson?.geometry?.coordinates || [];
  const startCoord = allCoords[0];
  const endCoord = allCoords[allCoords.length - 1];

  // ── Fetch Maps Key ────────────────────────────────────────────────────────────
  useEffect(() => {
    base44.functions.invoke('getGoogleMapsKey', {}).then(res => {
      const key = res?.data?.key;
      key ? setGoogleMapsKey(key) : setGoogleError(true);
    }).catch(() => setGoogleError(true));
  }, []);

  const getRouteCenter = useCallback(() => {
    if (!allCoords.length) return { lat: 53.8, lng: -1.5 };
    const avgLng = allCoords.reduce((s, [lng]) => s + lng, 0) / allCoords.length;
    const avgLat = allCoords.reduce((s, [, lat]) => s + lat, 0) / allCoords.length;
    return { lat: avgLat, lng: avgLng };
  }, [allCoords]);

  // ── Load Google Maps Script ───────────────────────────────────────────────────
  useEffect(() => {
    if (!googleMapsKey) return;
    const cbName = '__googleMapsInitCallback__';
    const desiredSrc = `https://maps.googleapis.com/maps/api/js?key=${googleMapsKey}&libraries=geometry&callback=${cbName}`;
    if (window.google?.maps) {
      const existing = document.querySelector('script[src*="maps.googleapis.com"]');
      if (!existing || existing.src.includes(googleMapsKey)) { setGoogleLoaded(true); return; }
    }
    const existing = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existing && !existing.src.includes(googleMapsKey)) { existing.remove(); delete window.google; }
    const correct = document.querySelector('script[src*="maps.googleapis.com"]');
    if (correct) {
      const poll = setInterval(() => { if (window.google?.maps) { clearInterval(poll); setGoogleLoaded(true); } }, 100);
      return () => clearInterval(poll);
    }
    window[cbName] = () => setGoogleLoaded(true);
    const script = document.createElement('script');
    script.src = desiredSrc;
    script.async = true;
    script.onerror = () => setGoogleError(true);
    document.head.appendChild(script);
  }, [googleMapsKey]);

  // ── Init Map ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!googleLoaded || mapInstanceRef.current) return;
    const timerId = setTimeout(() => {
      const div = document.getElementById('route-nav-map');
      if (!div || !div.isConnected || div.offsetWidth === 0 || mapInstanceRef.current) return;
      try {
        const MAP_STYLES = [
          { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
        ];
        const map = new window.google.maps.Map(div, {
          center: getRouteCenter(),
          zoom: 14,
          mapTypeId: 'roadmap',
          disableDefaultUI: true,
          gestureHandling: 'greedy',
          styles: MAP_STYLES,
          clickableIcons: false,
        });
        mapInstanceRef.current = map;

        // Draw full route as remaining (blue)
        if (allCoords.length) {
          const path = allCoords.map(([lng, lat]) => ({ lat, lng }));
          remainingPolyRef.current = new window.google.maps.Polyline({
            path, map, strokeColor: '#1A73E8', strokeWeight: 9, strokeOpacity: 0.95, zIndex: 2,
          });
          completedPolyRef.current = new window.google.maps.Polyline({
            path: [], map, strokeColor: '#9E9E9E', strokeWeight: 7, strokeOpacity: 0.6, zIndex: 1,
          });
          nextLegPolyRef.current = new window.google.maps.Polyline({
            path: [], map, strokeColor: '#0056D2', strokeWeight: 10, strokeOpacity: 1, zIndex: 3,
          });
          const bounds = new window.google.maps.LatLngBounds();
          path.forEach(p => bounds.extend(p));
          map.fitBounds(bounds, 48);
        }

        if (startCoord) {
          startMarkerRef.current = new window.google.maps.Marker({
            position: { lat: startCoord[1], lng: startCoord[0] }, map, zIndex: 6,
            icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 12, fillColor: '#22c55e', fillOpacity: 1, strokeColor: 'white', strokeWeight: 3 },
            label: { text: 'S', color: 'white', fontWeight: 'bold', fontSize: '12px' },
          });
        }
        if (endCoord) {
          endMarkerRef.current = new window.google.maps.Marker({
            position: { lat: endCoord[1], lng: endCoord[0] }, map, zIndex: 6,
            icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 12, fillColor: '#ef4444', fillOpacity: 1, strokeColor: 'white', strokeWeight: 3 },
            label: { text: 'F', color: 'white', fontWeight: 'bold', fontSize: '12px' },
          });
        }

        // Detect manual map interaction → exit follow mode
        const onInteract = () => {
          if (!hasStartedRef.current || !firstFixRef.current) return;
          setFollowMode(false);
          followModeRef.current = false;
          lastUserInteractionRef.current = Date.now();
          // Auto-recenter after 6s of no interaction
          clearTimeout(autoRecenterTimerRef.current);
          autoRecenterTimerRef.current = setTimeout(() => {
            if (!followModeRef.current && hasStartedRef.current) {
              setFollowMode(true);
              followModeRef.current = true;
            }
          }, 6000);
        };
        map.addListener('drag', onInteract);
        map.addListener('zoom_changed', onInteract);

        setMapReady(true);
      } catch (err) {
        console.warn('Map init failed:', err);
      }
    }, 200);
    return () => {
      clearTimeout(timerId);
      mapInstanceRef.current = null;
    };
  }, [googleLoaded]);

  // ── Update Completed/Remaining Route Polylines ────────────────────────────────
  const updateRoutePolylines = useCallback((completedPath, stepIdx) => {
    if (!mapInstanceRef.current || !remainingPolyRef.current) return;
    const steps = navStepsRef.current;

    // Completed path = driven coords
    if (completedPolyRef.current) {
      completedPolyRef.current.setPath(completedPath);
    }

    // Remaining path = rest of allCoords from nearest point onward
    // Simple: use remaining steps' rawPath
    const remainingPath = steps.slice(stepIdx).flatMap(st => st.rawPath || []);
    if (remainingPolyRef.current) {
      remainingPolyRef.current.setPath(remainingPath.length ? remainingPath : []);
    }

    // Next leg highlight = current step rawPath
    const curStep = steps[stepIdx];
    if (nextLegPolyRef.current) {
      nextLegPolyRef.current.setPath(curStep?.rawPath || []);
    }
  }, []);

  // ── Build Route via Google Directions ────────────────────────────────────────
  const buildRoute = useCallback(async (originLat, originLng) => {
    if (!allCoords.length || !window.google?.maps) return;
    const [destLng, destLat] = allCoords[allCoords.length - 1];
    const step = Math.max(1, Math.floor(allCoords.length / 6));
    const waypoints = allCoords
      .filter((_, i) => i > 0 && i < allCoords.length - 1 && i % step === 0)
      .slice(0, 8)
      .map(([lng, lat]) => ({ location: { lat, lng }, stopover: false }));

    const svc = new window.google.maps.DirectionsService();
    let result;
    try {
      result = await svc.route({
        origin: { lat: originLat, lng: originLng },
        destination: { lat: destLat, lng: destLng },
        waypoints,
        optimizeWaypoints: false,
        travelMode: window.google.maps.TravelMode.DRIVING,
        region: 'GB',
        provideRouteAlternatives: false,
      });
    } catch (e) {
      console.warn('Directions failed:', e);
      return;
    }

    if (!result?.routes?.length) return;
    const r = result.routes[0];
    setTotalDistance(r.legs.reduce((s, l) => s + (l.distance?.value || 0), 0));
    setTotalDuration(r.legs.reduce((s, l) => s + (l.duration?.value || 0), 0));

    let miniRbs = [];
    try { miniRbs = await fetchMiniRoundabouts(allCoords); } catch (_) {}

    const steps = normalizeGoogleSteps(r.legs, miniRbs);
    setNavSteps(steps);
    navStepsRef.current = steps;
    setStepIndex(0);
    stepIndexRef.current = 0;
    milestonesRef.current = { early: false, near: false, now: false };
    setBanner(buildBanner(steps[0]));
    updateRoutePolylines(completedPathRef.current, 0);
    return steps;
  }, [allCoords, updateRoutePolylines]);

  // ── Pre-fetch route when map is ready ─────────────────────────────────────────
  useEffect(() => {
    if (mapReady && startCoord) buildRoute(startCoord[1], startCoord[0]);
  }, [mapReady]);

  // ── GPS Location Update ───────────────────────────────────────────────────────
  const handleLocationUpdate = useCallback((position) => {
    const { latitude, longitude, accuracy, heading, speed } = position.coords;
    if (!firstFixRef.current && accuracy > 180) return;

    // Reject impossible GPS jumps (>300m in one update after first fix)
    if (lastLatRef.current != null) {
      const jump = haversineMeters(latitude, longitude, lastLatRef.current, lastLngRef.current);
      if (jump > 300) return;
    }

    setGpsUnavailable(false);
    setCurrentSpeedMps(speed != null && !isNaN(speed) ? speed : null);

    // Bearing: prefer device heading, else compute from movement
    let rawBearing = 0;
    if (heading != null && !isNaN(heading) && speed != null && speed > 0.5) {
      rawBearing = heading;
    } else if (lastLatRef.current != null) {
      const dLat = Math.abs(latitude - lastLatRef.current);
      const dLng = Math.abs(longitude - lastLngRef.current);
      if (dLat > 0.000005 || dLng > 0.000005) {
        rawBearing = computeBearing(lastLatRef.current, lastLngRef.current, latitude, longitude);
      } else {
        rawBearing = smoothedBearingRef.current;
      }
    }

    // Smooth the bearing to avoid jitter
    const newSmoothed = smoothBearing(smoothedBearingRef.current, rawBearing, 8);
    smoothedBearingRef.current = newSmoothed;
    computedBearingRef.current = newSmoothed;

    lastLatRef.current = latitude;
    lastLngRef.current = longitude;
    const newLoc = { latitude, longitude, accuracy };
    setUserLocation(newLoc);
    userLocationRef.current = newLoc;

    // Update user arrow marker
    if (mapInstanceRef.current) {
      const pos = { lat: latitude, lng: longitude };
      const userIcon = {
        path: 'M 0,-1.2 L 0.7,0.9 L 0,0.45 L -0.7,0.9 Z',
        fillColor: '#F7B602',
        fillOpacity: 1,
        strokeColor: '#071739',
        strokeWeight: 0.6,
        scale: 22,
        rotation: newSmoothed,
        anchor: new window.google.maps.Point(0, 0),
      };
      if (!userMarkerRef.current) {
        userMarkerRef.current = new window.google.maps.Marker({
          position: pos, map: mapInstanceRef.current, icon: userIcon, zIndex: 12,
          title: 'You',
        });
      } else {
        userMarkerRef.current.setPosition(pos);
        userMarkerRef.current.setIcon(userIcon);
      }

      // Accuracy circle
      if (!accuracyCircleRef.current) {
        accuracyCircleRef.current = new window.google.maps.Circle({
          center: pos, radius: Math.min(accuracy, 80), map: mapInstanceRef.current,
          strokeColor: '#1A73E8', strokeOpacity: 0.3, strokeWeight: 1,
          fillColor: '#1A73E8', fillOpacity: 0.08, zIndex: 11,
        });
      } else {
        accuracyCircleRef.current.setCenter(pos);
        accuracyCircleRef.current.setRadius(Math.min(accuracy, 80));
      }
    }

    // ── First Fix ─────────────────────────────────────────────────────────────
    if (!firstFixRef.current) {
      firstFixRef.current = true;
      setIsLoading(false);
      completedPathRef.current = [{ lat: latitude, lng: longitude }];

      if (mapInstanceRef.current) {
        animateCameraTo(mapInstanceRef.current, latitude, longitude, newSmoothed, 18, 52);
      }
      buildRoute(latitude, longitude).then(steps => {
        if (steps?.length && !isMutedRef.current) {
          setTimeout(() => speakQueued('Start following the practice route.'), 600);
          setTimeout(() => speakQueued(buildSpeech(steps[0], steps[0]?.distance || null)), 2200);
        }
      });
      return;
    }

    // Accumulate completed path
    completedPathRef.current = [...completedPathRef.current, { lat: latitude, lng: longitude }];

    // ── Camera Follow Mode ────────────────────────────────────────────────────
    if (followModeRef.current && mapInstanceRef.current) {
      const now = Date.now();
      if (now - lastCameraUpdateRef.current >= 300) {
        lastCameraUpdateRef.current = now;
        const spd = speed != null && !isNaN(speed) ? speed : 7;
        // Zoom: 17.5 at slow, 16 at 60+km/h
        const targetZoom = spd < 5 ? 18 : spd < 14 ? 17.5 : spd < 22 ? 17 : 16.5;
        const targetTilt = 52;
        animateCameraTo(mapInstanceRef.current, latitude, longitude, newSmoothed, targetZoom, targetTilt);
      }
    }

    // ── Step Advancement & Voice ──────────────────────────────────────────────
    const steps = navStepsRef.current;
    const idx = stepIndexRef.current;
    if (!steps.length) return;
    const curStep = steps[idx];

    if (curStep?.maneuverLat != null) {
      const d = haversineMeters(latitude, longitude, curStep.maneuverLat, curStep.maneuverLng);
      setDistanceToManeuver(d);

      const now = Date.now();
      if (!isMutedRef.current && now - lastSpokenAtRef.current > 4000) {
        const m = milestonesRef.current;
        if (d <= 50 && !m.now) {
          speakQueued(buildSpeech(curStep, null), true);
          lastSpokenAtRef.current = now;
          milestonesRef.current = { ...m, now: true };
        } else if (d <= 160 && !m.near) {
          speakQueued(buildSpeech(curStep, d));
          lastSpokenAtRef.current = now;
          milestonesRef.current = { ...m, near: true };
        } else if (d <= 480 && !m.early) {
          speakQueued(buildSpeech(curStep, d));
          lastSpokenAtRef.current = now;
          milestonesRef.current = { ...m, early: true };
        }
      }

      if (d <= 18 && idx < steps.length - 1) {
        const nextIdx = idx + 1;
        setStepIndex(nextIdx);
        stepIndexRef.current = nextIdx;
        milestonesRef.current = { early: false, near: false, now: false };
        const nextStep = steps[nextIdx];
        setBanner(buildBanner(nextStep));
        updateRoutePolylines(completedPathRef.current, nextIdx);
        if (!isMutedRef.current) {
          setTimeout(() => speakQueued(buildSpeech(nextStep, nextStep?.distance || null)), 400);
        }
      } else if (d <= 18 && idx === steps.length - 1) {
        setBanner({ title: 'You have arrived!', iconKey: 'straight', sub: '' });
        if (!isMutedRef.current) speakQueued('You have arrived at the end of the practice route.', true);
      }
    }

    // ── Off-Route Detection ───────────────────────────────────────────────────
    if (allCoords.length > 0) {
      const distToRoute = distanceToRoute(latitude, longitude, allCoords);
      if (distToRoute > 45) {
        offRouteCounterRef.current += 1;
        if (offRouteCounterRef.current >= 4 && !wasOffRouteRef.current) {
          wasOffRouteRef.current = true;
          setIsOffRoute(true);
          if (!isMutedRef.current) speakQueued('You have gone off the practice route.', true);
        }
      } else {
        if (wasOffRouteRef.current) {
          wasOffRouteRef.current = false;
          setIsOffRoute(false);
          if (!isMutedRef.current) speakQueued('You are back on the practice route.', true);
        }
        offRouteCounterRef.current = 0;
      }

      const nowMs = Date.now();
      if (offRouteCounterRef.current >= 12 && nowMs - lastRerouteRef.current > 25000) {
        lastRerouteRef.current = nowMs;
        offRouteCounterRef.current = 0;
        setIsRerouting(true);
        if (!isMutedRef.current) speakQueued('Recalculating route.', true);
        buildRoute(latitude, longitude).then(() => {
          setIsRerouting(false);
          if (!isMutedRef.current) setTimeout(() => speakQueued('Route updated. Continue following the route.'), 600);
        });
      }
    }
  }, [buildRoute, allCoords, updateRoutePolylines]);

  // ── Camera animation helper (smooth panTo + heading + tilt + zoom) ────────────
  function animateCameraTo(map, lat, lng, heading, zoom, tilt) {
    // Offset center so user sits in lower 35% (more road visible ahead)
    const currentZoom = map.getZoom() || zoom;
    const latOffset = 0.00025 * Math.pow(2, 17 - currentZoom);
    const hRad = (heading * Math.PI) / 180;
    const cosLat = Math.cos(lat * Math.PI / 180) || 1;
    const offLat = lat - latOffset * Math.cos(hRad);
    const offLng = lng - (latOffset * Math.sin(hRad)) / cosLat;
    map.panTo({ lat: offLat, lng: offLng });
    if (Math.abs((map.getHeading() || 0) - heading) > 5) map.setHeading(heading);
    if (Math.abs((map.getZoom() || 0) - zoom) > 0.3) map.setZoom(zoom);
    if ((map.getTilt() || 0) < tilt - 3) map.setTilt(tilt);
  }

  // ── GPS Watch ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasStarted || !mapReady) return;
    if (!navigator.geolocation) { setIsLoading(false); setGpsUnavailable(true); return; }
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleLocationUpdate,
      (err) => { console.error('GPS error:', err); setIsLoading(false); if (err.code === 1) setGpsUnavailable(true); },
      { enableHighAccuracy: true, maximumAge: 800, timeout: 12000 }
    );
    return () => { if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, [hasStarted, mapReady]);

  useEffect(() => {
    if (watchIdRef.current && firstFixRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = navigator.geolocation.watchPosition(
        handleLocationUpdate,
        (err) => console.error('GPS error:', err),
        { enableHighAccuracy: true, maximumAge: 800, timeout: 12000 }
      );
    }
  }, [handleLocationUpdate]);

  // ── Controls ──────────────────────────────────────────────────────────────────
  const handleStart = () => {
    setIsLoading(true);
    setHasStarted(true);
    setFollowMode(true);
    followModeRef.current = true;
    completedPathRef.current = [];
    setTimeout(() => {
      if (!firstFixRef.current) { firstFixRef.current = true; setIsLoading(false); }
    }, 12000);
    if (startCoord && mapInstanceRef.current) {
      const coords = allCoords;
      const initBearing = coords.length >= 2 ? computeBearing(coords[0][1], coords[0][0], coords[1][1], coords[1][0]) : 0;
      smoothedBearingRef.current = initBearing;
      animateCameraTo(mapInstanceRef.current, startCoord[1], startCoord[0], initBearing, 18, 52);
    }
  };

  const handleEnd = () => {
    cancelSpeech();
    clearTimeout(autoRecenterTimerRef.current);
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      (document.exitFullscreen || document.webkitExitFullscreen)?.call(document).catch(() => {});
    }
    onClose();
  };

  const handleToggleMute = () => {
    const nm = !isMuted;
    setIsMuted(nm);
    isMutedRef.current = nm;
    if (nm) cancelSpeech();
    else speakQueued('Voice guidance on.');
  };

  const handleRecenter = () => {
    clearTimeout(autoRecenterTimerRef.current);
    setFollowMode(true);
    followModeRef.current = true;
    const loc = userLocationRef.current;
    if (loc && mapInstanceRef.current) {
      animateCameraTo(mapInstanceRef.current, loc.latitude, loc.longitude, smoothedBearingRef.current, 18, 52);
    }
  };

  const handleOverview = () => {
    clearTimeout(autoRecenterTimerRef.current);
    if (!mapInstanceRef.current) return;
    setFollowMode(false);
    followModeRef.current = false;
    const bounds = new window.google.maps.LatLngBounds();
    allCoords.forEach(([lng, lat]) => bounds.extend({ lat, lng }));
    mapInstanceRef.current.fitBounds(bounds, 48);
    mapInstanceRef.current.setTilt(0);
    mapInstanceRef.current.setHeading(0);
    // Auto-restore after 12s
    autoRecenterTimerRef.current = setTimeout(() => {
      if (hasStartedRef.current) handleRecenter();
    }, 12000);
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      setFollowMode(false);
      mapInstanceRef.current.setZoom((mapInstanceRef.current.getZoom() || 15) + 1);
    }
  };
  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      setFollowMode(false);
      mapInstanceRef.current.setZoom(Math.max((mapInstanceRef.current.getZoom() || 15) - 1, 1));
    }
  };

  // ── Route Metrics ─────────────────────────────────────────────────────────────
  const routeMetrics = (() => {
    if (!allCoords.length) return { distance: 0, duration: 0 };
    let dist = 0;
    for (let i = 0; i < allCoords.length - 1; i++) {
      const [lng1, lat1] = allCoords[i];
      const [lng2, lat2] = allCoords[i + 1];
      dist += haversineMeters(lat1, lng1, lat2, lng2);
    }
    return {
      distance: (dist / 1000 * 0.621371).toFixed(1),
      duration: totalDuration ? Math.round(totalDuration / 60) : Math.round(dist / 1000 / 60 * 60),
    };
  })();

  const remainingSteps = navSteps.slice(stepIndex);
  const remainingDist = remainingSteps.reduce((s, st) => s + (st.distance || 0), 0);
  const remainingDuration = remainingSteps.reduce((s, st) => s + (st.duration || 0), 0);
  const nextStep = navSteps[stepIndex + 1] || null;
  const nextBanner = nextStep ? buildBanner(nextStep) : null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      {/* Hide Google Maps branding chrome */}
      <style>{`
        .gm-style-cc, .gm-style-cc + div,
        a[title="Report errors in the road map or imagery to Google"],
        .gmnoprint a, .gm-style .gm-style-cc > *,
        .gm-control-active,
        button[title="Keyboard shortcuts"],
        .gm-svpc { display: none !important; }
        .gm-style .gm-style-cc { display: none !important; }
        #route-nav-map * { -webkit-tap-highlight-color: transparent; }
      `}</style>

      {/* Map */}
      <div className="flex-1 relative overflow-hidden">
        <div id="route-nav-map" ref={mapDivRef} style={{ width: '100%', height: '100%' }} />

        {/* Error */}
        {googleError && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100 z-10">
            <div className="text-center p-6">
              <MapIcon className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="font-semibold text-slate-700">Map failed to load</p>
              <p className="text-sm text-slate-500 mt-1">Check VITE_GOOGLE_MAPS_KEY is set and Maps JS API is enabled.</p>
            </div>
          </div>
        )}

        {/* Map loading */}
        {!googleLoaded && !googleError && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <div className="flex items-center gap-2 text-white">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading map...</span>
            </div>
          </div>
        )}

        {/* GPS Unavailable */}
        {gpsUnavailable && (
          <div className="absolute bottom-24 left-4 right-4 z-20">
            <div className="bg-amber-600 text-white rounded-xl px-4 py-3 flex items-center gap-2 shadow-lg">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">GPS unavailable. Please check location permissions.</p>
            </div>
          </div>
        )}

        {/* Top Navigation Banner */}
        <AnimatePresence>
          {hasStarted && !isLoading && (
            <motion.div
              key="banner"
              initial={{ y: -140, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -140, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="absolute top-0 left-0 right-0 z-20"
            >
              <div className="bg-[#071739]/97 shadow-2xl backdrop-blur-sm">
                {/* Main instruction */}
                <div className="flex items-center px-4 pt-4 pb-3 gap-4">
                  <ManeuverIcon iconKey={banner.iconKey} size={58} />
                  <div className="flex-1 min-w-0">
                    {distanceToManeuver != null && distanceToManeuver > 15 && (
                      <p className="text-4xl font-black text-white leading-none tracking-tight tabular-nums">
                        {formatDistanceUK(distanceToManeuver)}
                      </p>
                    )}
                    <p className="text-sm font-bold text-[#F7B602] mt-1 leading-tight">{banner.title}</p>
                    {banner.street && (
                      <p className="text-base font-semibold text-white truncate mt-0.5 opacity-90">{banner.street}</p>
                    )}
                    {banner.sub && <p className="text-xs text-slate-400 mt-0.5">{banner.sub}</p>}
                  </div>
                </div>

                {/* Off-route / rerouting bar */}
                {isRerouting && (
                  <div className="flex items-center gap-2 bg-blue-800/60 px-4 py-2 text-blue-200 text-xs">
                    <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                    <span>Recalculating route...</span>
                  </div>
                )}
                {isOffRoute && !isRerouting && (
                  <div className="flex items-center gap-2 bg-amber-700/70 px-4 py-2 text-amber-100 text-xs">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    <span>Off the practice route — return to the marked path</span>
                  </div>
                )}

                {/* Then strip */}
                {nextBanner && (
                  <div className="flex items-center gap-3 border-t border-slate-700/60 px-4 py-2.5">
                    <span className="text-xs text-slate-400 font-semibold shrink-0 uppercase tracking-wide">Then</span>
                    <ManeuverIcon iconKey={nextBanner.iconKey} size={22} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-300 leading-tight">
                        {nextStep?.distance ? formatDistanceUK(nextStep.distance) + ' · ' : ''}{nextBanner.title}
                      </p>
                      {nextBanner.street && (
                        <p className="text-xs text-white font-semibold truncate mt-0.5">{nextBanner.street}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* GPS Fix loading */}
        {isLoading && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50">
            <Card className="bg-[#071739] border-slate-700 shadow-2xl">
              <CardContent className="p-7 flex flex-col items-center gap-3">
                <Loader2 className="w-9 h-9 text-[#F7B602] animate-spin" />
                <p className="text-base font-semibold text-white">Getting GPS fix...</p>
                <p className="text-xs text-slate-400">Move to an open area for best accuracy</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Right-side controls */}
        <div className="absolute right-3 z-20 flex flex-col gap-2.5" style={{ top: '50%', transform: 'translateY(-50%)' }}>
          {hasStarted && !followMode && (
            <button
              onClick={handleRecenter}
              className="w-11 h-11 rounded-full bg-[#F7B602] shadow-lg flex items-center justify-center active:scale-95 transition-transform"
              title="Recenter"
            >
              <Locate className="w-5 h-5 text-[#071739]" />
            </button>
          )}
          <button
            onClick={handleOverview}
            className="w-11 h-11 rounded-full bg-white shadow-lg flex items-center justify-center active:scale-95 transition-transform"
            title="Overview"
          >
            <MapIcon className="w-5 h-5 text-slate-700" />
          </button>
          <button
            onClick={handleZoomIn}
            className="w-11 h-11 rounded-full bg-white shadow-lg flex items-center justify-center active:scale-95 transition-transform"
          >
            <Plus className="w-5 h-5 text-slate-700" />
          </button>
          <button
            onClick={handleZoomOut}
            className="w-11 h-11 rounded-full bg-white shadow-lg flex items-center justify-center active:scale-95 transition-transform"
          >
            <Minus className="w-5 h-5 text-slate-700" />
          </button>
          {hasStarted && (
            <button
              onClick={handleToggleMute}
              className="w-11 h-11 rounded-full bg-white shadow-lg flex items-center justify-center active:scale-95 transition-transform"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted
                ? <VolumeX className="w-5 h-5 text-slate-700" />
                : <Volume2 className="w-5 h-5 text-slate-700" />}
            </button>
          )}
        </div>
      </div>

      {/* Bottom Panel */}
      {!hasStarted ? (
        <div className="bg-[#071739] px-4 pt-3 pb-5 shadow-2xl">
          <div className="flex justify-between mb-4">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Time</p>
              <p className="text-lg font-bold text-white leading-tight">
                {totalDuration != null ? formatDuration(totalDuration) : `~${routeMetrics.duration} min`}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Distance</p>
              <p className="text-lg font-bold text-white leading-tight">
                {totalDistance != null ? formatDistanceUK(totalDistance) : `${routeMetrics.distance} mi`}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">ETA</p>
              <p className="text-lg font-bold text-white leading-tight">
                {totalDuration != null ? formatETA(totalDuration) : '—'}
              </p>
            </div>
          </div>
          <Button
            onClick={handleStart}
            className="w-full bg-[#228B22] hover:bg-[#1a7520] text-white text-lg py-6 font-bold rounded-xl"
          >
            <Navigation2 className="w-5 h-5 mr-2" />
            Start Navigation
          </Button>
          <button
            onClick={onClose}
            className="w-full mt-2 text-slate-400 text-sm py-1.5 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <AnimatePresence>
          {!isLoading && (
            <motion.div
              key="footer"
              initial={{ y: 90, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', damping: 28 }}
              className="bg-[#071739] px-4 py-3 pb-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex gap-5 items-center">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">Time</p>
                    <p className="text-base font-bold text-white leading-tight">
                      {formatDuration(remainingDuration) || `~${routeMetrics.duration} min`}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">Distance</p>
                    <p className="text-base font-bold text-white leading-tight">
                      {formatDistanceUK(remainingDist) || `${routeMetrics.distance} mi`}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">ETA</p>
                    <p className="text-base font-bold text-white leading-tight">
                      {formatETA(remainingDuration)}
                    </p>
                  </div>
                  {currentSpeedMps != null && (
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest">Speed</p>
                      <p className="text-base font-bold text-[#F7B602] leading-tight">
                        {formatSpeedKmh(currentSpeedMps)}
                      </p>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleEnd}
                  className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
                >
                  End
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}