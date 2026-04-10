import React, { useState, useEffect, useRef, useCallback } from 'react';
import Map, { Source, Layer, Marker } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Volume2, VolumeX, X, Navigation2, Plus, Minus, Locate,
  Loader2, MapPin, Map as MapIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

// ─── Helpers ────────────────────────────────────────────────────────────────

function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Compute bearing from two points (fallback when GPS heading unavailable)
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

function geojsonBounds(geojson) {
  const coords = geojson?.geometry?.coordinates || [];
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  coords.forEach(([lng, lat]) => {
    if (lng < minLng) minLng = lng;
    if (lat < minLat) minLat = lat;
    if (lng > maxLng) maxLng = lng;
    if (lat > maxLat) maxLat = lat;
  });
  return isFinite(minLng) ? { minLng, minLat, maxLng, maxLat } : null;
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
  if (m >= 1000) return (m / 1000).toFixed(1) + ' km';
  return Math.round(m) + ' m';
}

function formatDuration(s) {
  if (s == null) return '—';
  const mins = Math.round(s / 60);
  if (mins < 60) return mins + ' min';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h + 'h ' + m + 'm';
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

// ─── Step normalization from Mapbox Directions ───────────────────────────────

function normalizeSteps(rawSteps) {
  return (rawSteps || []).map((s, i) => {
    const man = s.maneuver || {};
    const instr = (man.instruction || '').trim();
    const type = (man.type || '').toLowerCase();
    const isRoundabout = type === 'roundabout' || type === 'rotary' || /roundabout/i.test(instr);

    let exitNum = null;
    if (man.exit != null) exitNum = Number(man.exit);
    if (!exitNum || isNaN(exitNum)) {
      const m1 = instr.match(/\b(\d+)(st|nd|rd|th)\b/i);
      if (m1) exitNum = Number(m1[1]);
      if (!exitNum) {
        const words = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6 };
        const m2 = instr.match(/\b(first|second|third|fourth|fifth|sixth)\b/i);
        if (m2) exitNum = words[m2[1].toLowerCase()] || null;
      }
    }

    const loc = man.location || [null, null];
    return {
      index: i,
      name: s.name || '',
      distance: s.distance || 0,
      duration: s.duration || 0,
      rawInstruction: instr,
      maneuverType: type,
      maneuverModifier: (man.modifier || '').toLowerCase(),
      maneuverLng: loc[0],
      maneuverLat: loc[1],
      geometry: s.geometry || null,
      isRoundabout,
      roundaboutExitNum: isRoundabout ? (exitNum || null) : null,
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

function buildBanner(step) {
  if (!step) return { title: 'Follow the route', iconKey: 'default', sub: '' };
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
    sub: step.name || '',
  };
}

function buildSpeechText(step, prefix) {
  if (!step) return 'Continue.';
  let core;
  if (step.isRoundabout) {
    core = roundaboutPhrase(step.roundaboutExitNum).toLowerCase();
  } else {
    core = (step.rawInstruction || 'continue').replace(/\.+$/, '');
  }
  return prefix ? `${prefix}, ${core}.` : `${core}.`;
}

// ─── Active segment builder ───────────────────────────────────────────────────

function buildActiveSegment(currentStep, nextStep, mergeNextMeters = 180) {
  if (!currentStep?.geometry?.coordinates) return null;
  let coords = [...currentStep.geometry.coordinates];

  if (nextStep?.geometry?.coordinates && mergeNextMeters > 0) {
    const next = nextStep.geometry.coordinates;
    let acc = 0;
    const extra = [next[0]];
    for (let i = 1; i < next.length; i++) {
      const [lng1, lat1] = next[i - 1];
      const [lng2, lat2] = next[i];
      acc += haversineMeters(lat1, lng1, lat2, lng2);
      extra.push(next[i]);
      if (acc >= mergeNextMeters) break;
    }
    // avoid duplicate point
    const last = coords[coords.length - 1];
    const first = extra[0];
    if (last[0] !== first[0] || last[1] !== first[1]) coords.push(first);
    coords = coords.concat(extra.slice(1));
  }

  return { type: 'Feature', geometry: { type: 'LineString', coordinates: coords }, properties: {} };
}

// ─── Maneuver Icon SVG Component ─────────────────────────────────────────────

function ManeuverIcon({ iconKey, size = 40 }) {
  const color = '#071739';
  const style = { width: size, height: size, flexShrink: 0 };

  if (iconKey === 'turn_left' || iconKey === 'slight_left') {
    return (
      <svg style={style} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="20" fill="#F7B602" />
        <path d="M24 28V18H16l4-4M16 14l4 4" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 18v-4" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M12 14l4-4 4 4" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 10v8h8v10" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (iconKey === 'turn_right' || iconKey === 'slight_right') {
    return (
      <svg style={style} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="20" fill="#F7B602" />
        <path d="M16 10v8h8v10" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M24 10l4 4-4 4" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
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
    return (
      <svg style={style} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="20" fill="#F7B602" />
        <circle cx="20" cy="20" r="8" stroke={color} strokeWidth="2" fill="none" />
        <path d="M20 12a8 8 0 0 1 8 8" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <path d="M28 18l-1.5-3.5L30 17" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {exit && (
          <text x="20" y="24" textAnchor="middle" fontSize="9" fontWeight="bold" fill={color}>{exit}</text>
        )}
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
  // default / arrive
  return (
    <svg style={style} viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="20" fill="#F7B602" />
      <path d="M20 30V10M15 15l5-5 5 5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RouteNavigationOverlay({ route, onClose }) {
  const [mapboxToken, setMapboxToken] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [userHeading, setUserHeading] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [followMode, setFollowMode] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Directions-based nav state
  const [navSteps, setNavSteps] = useState([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [distanceToManeuver, setDistanceToManeuver] = useState(null);
  const [totalDistance, setTotalDistance] = useState(null);
  const [totalDuration, setTotalDuration] = useState(null);
  const [banner, setBanner] = useState({ title: 'Preparing route...', iconKey: 'default', sub: '' });
  const [activeSegmentGeoJson, setActiveSegmentGeoJson] = useState(null);
  const [isOffRoute, setIsOffRoute] = useState(false);
  const [isRerouting, setIsRerouting] = useState(false);

  const watchIdRef = useRef(null);
  const mapRef = useRef(null);
  const firstFixRef = useRef(false);
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

  // Keep refs in sync
  useEffect(() => { userLocationRef.current = userLocation; }, [userLocation]);
  useEffect(() => { navStepsRef.current = navSteps; }, [navSteps]);
  useEffect(() => { stepIndexRef.current = stepIndex; }, [stepIndex]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  const routeGeoJson = route?.gpsGeoJson || null;

  const getRouteCenter = () => {
    if (!routeGeoJson?.geometry?.coordinates?.length) return { longitude: -1.5, latitude: 53.8 };
    const coords = routeGeoJson.geometry.coordinates;
    const avgLon = coords.reduce((s, [lon]) => s + lon, 0) / coords.length;
    const avgLat = coords.reduce((s, [, lat]) => s + lat, 0) / coords.length;
    return { longitude: avgLon, latitude: avgLat };
  };

  const [viewState, setViewState] = useState({ ...getRouteCenter(), zoom: 14 });

  // Fetch Mapbox token
  useEffect(() => {
    base44.functions.invoke('getMapboxToken').then(({ data }) => {
      if (data?.token) setMapboxToken(data.token);
    }).catch(console.error);
  }, []);

  // Fit to route on load
  useEffect(() => {
    if (routeGeoJson?.geometry?.coordinates?.length && mapboxToken && !hasStarted) {
      const coords = routeGeoJson.geometry.coordinates;
      const lngs = coords.map(c => c[0]);
      const lats = coords.map(c => c[1]);
      const maxDiff = Math.max(Math.max(...lngs) - Math.min(...lngs), Math.max(...lats) - Math.min(...lats));
      let zoom = 14;
      if (maxDiff > 0.1) zoom = 10;
      else if (maxDiff > 0.05) zoom = 11;
      else if (maxDiff > 0.02) zoom = 12;
      else if (maxDiff > 0.01) zoom = 13;
      const center = getRouteCenter();
      setViewState({ ...center, zoom });
    }
  }, [routeGeoJson, mapboxToken, hasStarted]);

  // ── Build route from Mapbox Directions API ──────────────────────────────────
  const buildRoute = useCallback(async (originLat, originLng) => {
    if (!routeGeoJson?.geometry?.coordinates?.length || !mapboxToken) return;

    const coords = routeGeoJson.geometry.coordinates;
    const destCoord = coords[coords.length - 1];
    const [destLng, destLat] = destCoord;

    // Build waypoints: origin + a few key route points + destination
    // Sample ~4 intermediate waypoints to keep the route on the test route path
    const step = Math.max(1, Math.floor(coords.length / 5));
    const waypoints = [
      `${originLng},${originLat}`,
      ...coords.filter((_, i) => i > 0 && i < coords.length - 1 && i % step === 0).slice(0, 3).map(([lng, lat]) => `${lng},${lat}`),
      `${destLng},${destLat}`
    ].join(';');

    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${waypoints}?access_token=${mapboxToken}&geometries=geojson&overview=full&steps=true&language=en`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.routes?.length) return;

    const r = data.routes[0];
    setTotalDistance(r.distance);
    setTotalDuration(r.duration);

    const steps = normalizeSteps(r.legs.flatMap(l => l.steps || []));
    setNavSteps(steps);
    navStepsRef.current = steps;
    setStepIndex(0);
    stepIndexRef.current = 0;
    milestonesRef.current = { prepare: false, approach: false, now: false };

    const newBanner = buildBanner(steps[0]);
    setBanner(newBanner);

    const activeSeg = buildActiveSegment(steps[0], steps[1]);
    setActiveSegmentGeoJson(activeSeg);

    return steps;
  }, [routeGeoJson, mapboxToken]);

  // ── Handle location updates ─────────────────────────────────────────────────
  const handleLocationUpdate = useCallback((position) => {
    const { latitude, longitude, accuracy, heading, speed } = position.coords;

    if (!firstFixRef.current && accuracy > 50) return;

    // Compute bearing (use native heading or calculate from movement)
    const bearing = computeHeadingOrBearing(heading, latitude, longitude, lastLatRef.current, lastLngRef.current);
    computedBearingRef.current = bearing;
    lastLatRef.current = latitude;
    lastLngRef.current = longitude;

    const newLoc = { latitude, longitude, accuracy };
    setUserLocation(newLoc);
    userLocationRef.current = newLoc;
    setUserHeading(bearing);

    if (!firstFixRef.current) {
      firstFixRef.current = true;
      setIsLoading(false);
      setViewState({ longitude, latitude, zoom: 17, pitch: 55, bearing });

      buildRoute(latitude, longitude).then(steps => {
        if (steps?.length && !isMutedRef.current) {
          setTimeout(() => speak('Starting route guidance.'), 500);
          setTimeout(() => {
            const txt = buildSpeechText(steps[0], null);
            speak(txt);
          }, 2000);
        }
      });
      return;
    }

    // Follow mode camera — throttled to 500ms
    if (followMode) {
      const now = Date.now();
      if (now - lastCameraUpdateRef.current >= 500) {
        lastCameraUpdateRef.current = now;
        setViewState(prev => ({
          ...prev,
          longitude,
          latitude,
          bearing: (speed != null && speed >= 1.0) ? bearing : prev.bearing
        }));
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
      const cooldown = 3000;
      if (now - lastSpokenAtRef.current > cooldown && !isMutedRef.current) {
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
        const nb = buildBanner(nextStep);
        setBanner(nb);

        const activeSeg = buildActiveSegment(nextStep, steps[nextIdx + 1]);
        setActiveSegmentGeoJson(activeSeg);

        if (!isMutedRef.current) {
          setTimeout(() => speak(buildSpeechText(nextStep, null)), 500);
        }
      } else if (d <= 20 && idx === steps.length - 1) {
        // Arrived
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

      // Auto-reroute after 10 seconds off route
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
  }, [buildRoute, followMode, routeGeoJson]);

  // ── Start GPS watch ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasStarted || !mapLoaded) return;

    if (!navigator.geolocation) {
      setIsLoading(false);
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleLocationUpdate,
      (err) => { console.error('GPS error:', err); setIsLoading(false); },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 }
    );

    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [hasStarted, mapLoaded]);

  // ── Update handler when followMode changes ──────────────────────────────────
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
    // Center on route start point facing forward
    const startPt = routeGeoJson?.geometry?.coordinates?.[0];
    if (startPt) {
      // Calculate initial bearing from first two route points
      const coords = routeGeoJson.geometry.coordinates;
      let initBearing = 0;
      if (coords.length >= 2) {
        initBearing = computeBearing(coords[0][1], coords[0][0], coords[1][1], coords[1][0]);
      }
      setViewState({ longitude: startPt[0], latitude: startPt[1], zoom: 17, pitch: 55, bearing: initBearing });
    }
  };

  const handleEnd = () => {
    window.speechSynthesis.cancel();
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    // Exit fullscreen if active
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
    else speak(newMuted ? 'Voice muted.' : 'Voice guidance on.');
  };

  const handleRecenter = () => {
    setFollowMode(true);
    if (userLocation) {
      setViewState({
        longitude: userLocation.longitude,
        latitude: userLocation.latitude,
        zoom: 17, pitch: 55,
        bearing: computedBearingRef.current || 0
      });
    }
  };

  const handleOverviewRoute = () => {
    if (!routeGeoJson) return;
    setFollowMode(false);
    const bounds = geojsonBounds(routeGeoJson);
    if (!bounds) return;
    const { minLng, minLat, maxLng, maxLat } = bounds;
    const centerLng = (minLng + maxLng) / 2;
    const centerLat = (minLat + maxLat) / 2;
    const lngDiff = maxLng - minLng;
    const latDiff = maxLat - minLat;
    const maxDiff = Math.max(lngDiff, latDiff);
    let zoom = 14;
    if (maxDiff > 0.1) zoom = 10;
    else if (maxDiff > 0.05) zoom = 11;
    else if (maxDiff > 0.02) zoom = 12;
    else if (maxDiff > 0.01) zoom = 13;
    setViewState({ longitude: centerLng, latitude: centerLat, zoom, pitch: 0, bearing: 0 });
  };

  // ── Route metrics ───────────────────────────────────────────────────────────
  const routeMetrics = (() => {
    if (!routeGeoJson?.geometry?.coordinates) return { distance: 0, duration: 0 };
    const coords = routeGeoJson.geometry.coordinates;
    let dist = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      const [lng1, lat1] = coords[i];
      const [lng2, lat2] = coords[i + 1];
      dist += haversineMeters(lat1, lng1, lat2, lng2);
    }
    return { distance: (dist / 1000).toFixed(1), duration: Math.round(dist / 1000 / 0.5) };
  })();

  // ── Layer styles ────────────────────────────────────────────────────────────
  const baseRouteStyle = {
    id: 'base-route',
    type: 'line',
    paint: { 'line-color': '#1E6BFF', 'line-width': 6, 'line-opacity': hasStarted ? 0.2 : 0.7 }
  };
  const activeSegmentStyle = {
    id: 'active-segment',
    type: 'line',
    paint: { 'line-color': '#1E6BFF', 'line-width': 8, 'line-opacity': 0.95 }
  };

  const startCoord = routeGeoJson?.geometry?.coordinates?.[0];
  const endCoord = routeGeoJson?.geometry?.coordinates?.[routeGeoJson?.geometry?.coordinates?.length - 1];

  // ── ETA + remaining ──────────────────────────────────────────────────────────
  const remainingSteps = navSteps.slice(stepIndex);
  const remainingDist = remainingSteps.reduce((s, st) => s + (st.distance || 0), 0);
  const remainingDuration = remainingSteps.reduce((s, st) => s + (st.duration || 0), 0);

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col" style={{
      '--mapbox-logo-display': 'none',
    }}>
      {/* ── Map ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 relative">
        {mapboxToken ? (
          <Map
            ref={mapRef}
            {...viewState}
            onMove={evt => {
              setViewState(evt.viewState);
              if (followMode && hasStarted && firstFixRef.current) setFollowMode(false);
            }}
            mapboxAccessToken={mapboxToken}
            mapStyle="mapbox://styles/mapbox/streets-v12"
            style={{ width: '100%', height: '100%' }}
            attributionControl={false}
            onLoad={() => setMapLoaded(true)}
            onError={e => console.error('Mapbox error:', e)}
          >
            {/* Base (dimmed) route */}
            {routeGeoJson?.geometry && (
              <Source id="base-route" type="geojson" data={routeGeoJson}>
                <Layer {...baseRouteStyle} />
              </Source>
            )}

            {/* Active highlighted segment */}
            {activeSegmentGeoJson && hasStarted && (
              <Source id="active-segment" type="geojson" data={activeSegmentGeoJson}>
                <Layer {...activeSegmentStyle} />
              </Source>
            )}

            {/* Start marker */}
            {startCoord && !hasStarted && (
              <Marker longitude={startCoord[0]} latitude={startCoord[1]} anchor="center">
                <div className="bg-green-500 text-white rounded-full w-9 h-9 flex items-center justify-center font-bold shadow-lg text-sm border-2 border-white">S</div>
              </Marker>
            )}

            {/* End marker */}
            {endCoord && (
              <Marker longitude={endCoord[0]} latitude={endCoord[1]} anchor="center">
                <div className="bg-red-500 text-white rounded-full w-9 h-9 flex items-center justify-center font-bold shadow-lg text-sm border-2 border-white">F</div>
              </Marker>
            )}

            {/* User car icon */}
            {userLocation && hasStarted && (
              <Marker longitude={userLocation.longitude} latitude={userLocation.latitude} anchor="center" rotation={userHeading || 0}>
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-10 h-10 bg-blue-400 rounded-full animate-ping opacity-30" />
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
                    <path d="M16 2L22 12H24C25.1 12 26 12.9 26 14V24C26 25.1 25.1 26 24 26H22V28H20V26H12V28H10V26H8C6.9 26 6 25.1 6 24V14C6 12.9 6.9 12 8 12H10L16 2Z" fill="#1E6BFF" />
                    <circle cx="10" cy="22" r="2" fill="white" />
                    <circle cx="22" cy="22" r="2" fill="white" />
                    <rect x="12" y="14" width="8" height="4" rx="1" fill="rgba(255,255,255,0.7)" />
                  </svg>
                </div>
              </Marker>
            )}
          </Map>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading map...
          </div>
        )}



        {/* ── Zoom + recenter + overview controls ─────────────────────────── */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2">
          {hasStarted && !followMode && (
            <Button onClick={handleRecenter} size="icon" className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739] shadow-lg" title="Recenter">
              <Locate className="w-5 h-5" />
            </Button>
          )}
          {routeGeoJson && (
            <Button onClick={handleOverviewRoute} size="icon" className={`shadow-lg ${!followMode && !hasStarted ? 'bg-[#F7B602] text-[#071739]' : 'bg-white hover:bg-slate-100 text-slate-900'}`} title="Overview route">
              <MapIcon className="w-5 h-5" />
            </Button>
          )}
          <Button onClick={() => setViewState(p => ({ ...p, zoom: Math.min(p.zoom + 1, 20) }))} size="icon" className="bg-white hover:bg-slate-100 text-slate-900 shadow-lg">
            <Plus className="w-5 h-5" />
          </Button>
          <Button onClick={() => setViewState(p => ({ ...p, zoom: Math.max(p.zoom - 1, 1) }))} size="icon" className="bg-white hover:bg-slate-100 text-slate-900 shadow-lg">
            <Minus className="w-5 h-5" />
          </Button>
          {hasStarted && (
            <Button onClick={handleToggleMute} size="icon" className="bg-white hover:bg-slate-100 text-slate-900 shadow-lg">
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
          )}
        </div>

        {/* ── Top banner (active navigation) ────────────────────────────── */}
        <AnimatePresence>
          {hasStarted && !isLoading && (
            <motion.div
              key="banner"
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              className="absolute top-4 left-2 right-2 z-10 mx-auto w-11/12"
            >
              <Card className="bg-white/97 backdrop-blur-sm shadow-2xl border-0">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <ManeuverIcon iconKey={banner.iconKey} size={44} />
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-[#071739] leading-tight">
                        {banner.title}
                      </p>
                      {banner.sub && (
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{banner.sub}</p>
                      )}
                    </div>
                    {distanceToManeuver != null && distanceToManeuver > 0 && (
                      <Badge className="bg-[#071739] text-white text-sm font-bold px-3 py-1 shrink-0">
                        {formatDistance(distanceToManeuver)}
                      </Badge>
                    )}
                  </div>

                  {/* Rerouting indicator */}
                  {isRerouting && (
                    <div className="mt-2 flex items-center gap-2 text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Recalculating route...</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── GPS loading spinner ────────────────────────────────────────── */}
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

      {/* ── Bottom panel ────────────────────────────────────────────────── */}
      {!hasStarted ? (
        /* Pre-start: route preview card */
        <div className="bg-white shadow-2xl p-4 pb-8 lg:pb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-bold text-[#071739] text-lg">{route?.routeName || 'Route'}</p>
              <p className="text-slate-500 text-sm">
                {routeMetrics.distance} km · approx {routeMetrics.duration} min
              </p>
            </div>
            <div className="flex items-center gap-1 text-slate-400 text-xs">
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
        /* Active navigation footer with ETA + distance + controls */
        <AnimatePresence>
          {!isLoading && (
            <motion.div
              key="footer"
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-white shadow-2xl px-4 py-3 pb-8 lg:pb-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex gap-6">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">ETA</p>
                    <p className="font-bold text-[#071739]">
                      {totalDuration != null ? formatDuration(remainingDuration) : `~${routeMetrics.duration} min`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Distance</p>
                    <p className="font-bold text-[#071739]">
                      {totalDistance != null ? formatDistance(remainingDist) : `${routeMetrics.distance} km`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Follow toggle */}
                  <button
                    onClick={() => {
                      if (!followMode) handleRecenter();
                      else setFollowMode(false);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                      followMode
                        ? 'bg-[#071739] text-white border-[#071739]'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <Locate className="w-3.5 h-3.5" />
                    {followMode ? 'Following' : 'Follow'}
                  </button>

                  <Button
                    onClick={handleEnd}
                    variant="destructive"
                    size="sm"
                    className="font-semibold px-5"
                  >
                    End
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}