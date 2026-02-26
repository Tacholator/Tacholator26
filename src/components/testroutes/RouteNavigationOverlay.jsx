import React, { useState, useEffect, useRef } from 'react';
import Map, { Source, Layer, Marker } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Volume2, VolumeX, RotateCcw, X, Navigation2, AlertTriangle, Plus, Minus, Clock, Route as RouteIcon, Locate, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

// Helper to calculate distance between two coordinates
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Text-to-speech helper with female voice preference
function speak(text, isMuted = false) {
  if (isMuted || !text) return;
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 1;
  
  // Try to select a female voice
  const voices = window.speechSynthesis.getVoices();
  const femaleVoice = voices.find(v => 
    v.name.includes('Female') || 
    v.name.includes('female') || 
    v.name.includes('Google US English') || 
    v.name.includes('Samantha') ||
    v.name.includes('Karen') ||
    v.name.includes('Victoria') ||
    v.lang === 'en-US'
  );
  
  if (femaleVoice) {
    utterance.voice = femaleVoice;
  }
  
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export default function RouteNavigationOverlay({ route, onClose }) {
  const [mapboxToken, setMapboxToken] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [userHeading, setUserHeading] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isOffRoute, setIsOffRoute] = useState(false);
  const [lastSpokenAt, setLastSpokenAt] = useState(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [followMode, setFollowMode] = useState(true);
  const [distanceToNextStep, setDistanceToNextStep] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  const watchIdRef = useRef(null);
  const mapRef = useRef(null);
  const firstFixRef = useRef(false);

  // Parse route GeoJSON and calculate center
  const routeGeoJson = route?.gpsGeoJson || null;
  const steps = route?.stepsJson || [];

  const getRouteCenter = () => {
    if (!routeGeoJson?.geometry?.coordinates || routeGeoJson.geometry.coordinates.length === 0) {
      return { longitude: -1.5, latitude: 53.8 };
    }
    const coords = routeGeoJson.geometry.coordinates;
    const avgLon = coords.reduce((sum, [lon]) => sum + lon, 0) / coords.length;
    const avgLat = coords.reduce((sum, [, lat]) => sum + lat, 0) / coords.length;
    return { longitude: avgLon, latitude: avgLat };
  };

  const routeCenter = getRouteCenter();

  const [viewState, setViewState] = useState({
    ...routeCenter,
    zoom: 14
  });

  // Fetch Mapbox token
  useEffect(() => {
    base44.functions.invoke('getMapboxToken').then(({ data }) => {
      if (data?.token) {
        setMapboxToken(data.token);
      }
    }).catch(console.error);
  }, []);

  // Initial map positioning - fit bounds to show entire route
  useEffect(() => {
    if (routeGeoJson?.geometry?.coordinates?.length > 0 && mapboxToken && !hasStarted) {
      const coords = routeGeoJson.geometry.coordinates;
      const lngs = coords.map(c => c[0]);
      const lats = coords.map(c => c[1]);
      
      const lngDiff = Math.max(...lngs) - Math.min(...lngs);
      const latDiff = Math.max(...lats) - Math.min(...lats);
      const maxDiff = Math.max(lngDiff, latDiff);
      
      let zoom = 14;
      if (maxDiff > 0.1) zoom = 10;
      else if (maxDiff > 0.05) zoom = 11;
      else if (maxDiff > 0.02) zoom = 12;
      else if (maxDiff > 0.01) zoom = 13;
      
      setViewState({
        ...routeCenter,
        zoom: zoom
      });
    }
  }, [routeGeoJson, mapboxToken, hasStarted]);

  // Smart step detection - snap user to route and find first step ahead
  const findCurrentStep = (userLoc) => {
    if (!routeGeoJson?.geometry?.coordinates || !steps.length) return 0;
    
    const coords = routeGeoJson.geometry.coordinates;
    
    // Find nearest point on route
    let minDistance = Infinity;
    let nearestIndex = 0;
    
    coords.forEach(([lon, lat], index) => {
      const dist = getDistance(userLoc.latitude, userLoc.longitude, lat, lon);
      if (dist < minDistance) {
        minDistance = dist;
        nearestIndex = index;
      }
    });
    
    // Find first step ahead of current position
    for (let i = 0; i < steps.length; i++) {
      if (!steps[i]?.location) continue;
      
      // Find this step's index on the route
      const stepCoords = [steps[i].location.longitude, steps[i].location.latitude];
      let stepRouteIndex = 0;
      let minStepDist = Infinity;
      
      coords.forEach(([lon, lat], idx) => {
        const dist = getDistance(stepCoords[1], stepCoords[0], lat, lon);
        if (dist < minStepDist) {
          minStepDist = dist;
          stepRouteIndex = idx;
        }
      });
      
      // If this step is ahead of user's position on route
      if (stepRouteIndex >= nearestIndex) {
        return i;
      }
    }
    
    return 0;
  };

  // Geolocation tracking with proper initialization
  useEffect(() => {
    if (!hasStarted || !mapLoaded) return;

    if ('geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const accuracy = position.coords.accuracy;
          const heading = position.coords.heading;
          
          // Wait for accurate fix (accuracy <= 50m)
          if (!firstFixRef.current && accuracy > 50) {
            console.log('Waiting for accurate GPS fix...', accuracy);
            return;
          }
          
          const newLocation = {
            longitude: position.coords.longitude,
            latitude: position.coords.latitude,
            accuracy: accuracy
          };
          
          setUserLocation(newLocation);
          if (heading !== null) setUserHeading(heading);
          
          // On first accurate fix
          if (!firstFixRef.current) {
            firstFixRef.current = true;
            setIsLoading(false);
            
            // Set camera with pitch and bearing
            setViewState({
              longitude: newLocation.longitude,
              latitude: newLocation.latitude,
              zoom: 17,
              pitch: 55,
              bearing: heading || 0
            });
            
            // Smart step detection
            const detectedStep = findCurrentStep(newLocation);
            setCurrentStepIndex(detectedStep);
            
            // Auto-start voice guidance
            setTimeout(() => {
              speak('Starting route guidance', false);
              setTimeout(() => {
                if (steps[detectedStep]?.instructionText) {
                  speak(steps[detectedStep].instructionText, false);
                  setLastSpokenAt(Date.now());
                }
              }, 1500);
            }, 500);
          } else if (followMode) {
            // Update camera in follow mode
            setViewState(prev => ({
              ...prev,
              longitude: newLocation.longitude,
              latitude: newLocation.latitude,
              bearing: heading !== null ? heading : prev.bearing
            }));
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setIsLoading(false);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 1000,
          timeout: 10000
        }
      );
    }

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [hasStarted, mapLoaded, followMode, steps, routeGeoJson]);

  // Check if user is off route
  useEffect(() => {
    if (!userLocation || !routeGeoJson || !hasStarted) return;

    const coordinates = routeGeoJson.geometry?.coordinates || [];
    if (coordinates.length === 0) return;

    // Find closest point on route
    let minDistance = Infinity;
    coordinates.forEach(([lon, lat]) => {
      const dist = getDistance(userLocation.latitude, userLocation.longitude, lat, lon);
      if (dist < minDistance) {
        minDistance = dist;
      }
    });

    // If more than 50 meters off route
    if (minDistance > 50) {
      setIsOffRoute(true);
    } else {
      setIsOffRoute(false);
    }
  }, [userLocation, routeGeoJson, hasStarted]);

  // Update distance to next step and advance when close
  useEffect(() => {
    if (!userLocation || !steps.length || !hasStarted || !firstFixRef.current) return;

    const currentStep = steps[currentStepIndex];
    if (!currentStep?.location) return;

    const distanceToStep = getDistance(
      userLocation.latitude,
      userLocation.longitude,
      currentStep.location.latitude,
      currentStep.location.longitude
    );
    
    setDistanceToNextStep(distanceToStep);

    // If within 30 meters of current step, advance to next
    if (distanceToStep < 30 && currentStepIndex < steps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      
      // Speak next instruction
      if (!isMuted && steps[nextIndex]?.instructionText) {
        speak(steps[nextIndex].instructionText, isMuted);
        setLastSpokenAt(Date.now());
      }
    }
  }, [userLocation, currentStepIndex, steps, isMuted, hasStarted]);

  const handleStart = () => {
    setIsLoading(true);
    setHasStarted(true);
    setIsMuted(false); // Default unmuted for auto-start voice
    setFollowMode(true);
    // Geolocation and voice will be handled in the useEffect after map loads
  };

  const handleToggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    speak(newMuted ? 'Voice guidance muted' : 'Voice guidance enabled', false);
  };
  
  const handleRecenter = () => {
    setFollowMode(true);
    if (userLocation) {
      setViewState({
        longitude: userLocation.longitude,
        latitude: userLocation.latitude,
        zoom: 17,
        pitch: 55,
        bearing: userHeading || 0
      });
    }
  };

  const handleRepeat = () => {
    const now = Date.now();
    if (lastSpokenAt && now - lastSpokenAt < 2000) return;
    
    const currentStep = steps[currentStepIndex];
    if (currentStep?.instructionText) {
      speak(currentStep.instructionText, isMuted);
      setLastSpokenAt(now);
    }
  };

  const handleEnd = () => {
    window.speechSynthesis.cancel();
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    onClose();
  };

  // Route layer style
  const routeLayerStyle = {
    id: 'route',
    type: 'line',
    paint: {
      'line-color': '#3B82F6',
      'line-width': 6,
      'line-opacity': 0.8
    }
  };

  const handleZoomIn = () => {
    setViewState(prev => ({
      ...prev,
      zoom: Math.min(prev.zoom + 1, 20)
    }));
  };

  const handleZoomOut = () => {
    setViewState(prev => ({
      ...prev,
      zoom: Math.max(prev.zoom - 1, 1)
    }));
  };

  // Calculate route metrics
  const calculateRouteMetrics = () => {
    if (!routeGeoJson || !routeGeoJson.geometry || !routeGeoJson.geometry.coordinates) {
      return { distance: 0, duration: 0 };
    }

    const coords = routeGeoJson.geometry.coordinates;
    let totalDistance = 0;

    for (let i = 0; i < coords.length - 1; i++) {
      const [lon1, lat1] = coords[i];
      const [lon2, lat2] = coords[i + 1];
      
      const R = 6371e3;
      const φ1 = (lat1 * Math.PI) / 180;
      const φ2 = (lat2 * Math.PI) / 180;
      const Δφ = ((lat2 - lat1) * Math.PI) / 180;
      const Δλ = ((lon2 - lon1) * Math.PI) / 180;

      const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      totalDistance += R * c;
    }

    const distanceKm = (totalDistance / 1000).toFixed(1);
    const durationMin = Math.round((totalDistance / 1000) / 0.5);

    return { distance: distanceKm, duration: durationMin };
  };

  const routeMetrics = calculateRouteMetrics();
  const currentStep = steps[currentStepIndex] || { instructionText: 'Follow the route' };

  // Get start and finish coordinates
  const startCoord = routeGeoJson?.geometry?.coordinates?.[0];
  const endCoord = routeGeoJson?.geometry?.coordinates?.[routeGeoJson.geometry.coordinates.length - 1];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900">
      {mapboxToken ? (
        <Map
          ref={mapRef}
          {...viewState}
          onMove={evt => {
            setViewState(evt.viewState);
            if (followMode && hasStarted && firstFixRef.current) {
              setFollowMode(false); // User manually moved map
            }
          }}
          mapboxAccessToken={mapboxToken}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          style={{ width: '100%', height: '100%' }}
          attributionControl={false}
          interactiveLayerIds={[]}
          onLoad={() => setMapLoaded(true)}
          onError={(e) => console.error('Mapbox error:', e)}
        >
        {/* Route Line */}
        {routeGeoJson && routeGeoJson.geometry && (
          <Source id="route" type="geojson" data={routeGeoJson}>
            <Layer {...routeLayerStyle} />
          </Source>
        )}

        {/* Start Marker */}
        {startCoord && !hasStarted && (
          <Marker longitude={startCoord[0]} latitude={startCoord[1]} anchor="center">
            <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-lg">
              S
            </div>
          </Marker>
        )}

        {/* Finish Marker */}
        {endCoord && !hasStarted && (
          <Marker longitude={endCoord[0]} latitude={endCoord[1]} anchor="center">
            <div className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-lg">
              F
            </div>
          </Marker>
        )}

        {/* User Location Marker with Heading */}
        {userLocation && hasStarted && (
          <Marker
            longitude={userLocation.longitude}
            latitude={userLocation.latitude}
            anchor="center"
            rotation={userHeading || 0}
          >
            <div className="relative">
              <div className="w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-lg" />
              {userHeading !== null && (
                <div 
                  className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-blue-500"
                  style={{ transform: `translateX(-50%)` }}
                />
              )}
              <div className="absolute inset-0 w-6 h-6 bg-blue-500 rounded-full animate-ping opacity-50" />
            </div>
          </Marker>
        )}
        </Map>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white">
          <p>Mapbox token not configured</p>
        </div>
      )}

      {/* Zoom and Recenter Controls */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2">
        {hasStarted && !followMode && (
          <Button
            onClick={handleRecenter}
            size="icon"
            className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739] shadow-lg"
          >
            <Locate className="w-5 h-5" />
          </Button>
        )}
        <Button
          onClick={handleZoomIn}
          size="icon"
          className="bg-white hover:bg-slate-100 text-slate-900 shadow-lg"
        >
          <Plus className="w-5 h-5" />
        </Button>
        <Button
          onClick={handleZoomOut}
          size="icon"
          className="bg-white hover:bg-slate-100 text-slate-900 shadow-lg"
        >
          <Minus className="w-5 h-5" />
        </Button>
        {hasStarted && (
          <Button
            onClick={handleToggleMute}
            size="icon"
            className="bg-white hover:bg-slate-100 text-slate-900 shadow-lg"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>
        )}
      </div>

      {/* Close Button */}
      <div className="absolute top-4 left-4 z-20">
        <Button
          onClick={handleEnd}
          size="icon"
          className="bg-white hover:bg-slate-100 text-slate-900 shadow-lg"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Top Instruction Card */}
      {hasStarted && !isLoading && (
        <AnimatePresence>
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="absolute top-4 left-16 right-4 z-10"
          >
            <Card className="bg-white/95 backdrop-blur-sm shadow-2xl">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <Navigation2 className="w-6 h-6 text-[#F7B602] mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-lg font-semibold text-[#071739]">
                        {currentStep.instructionText}
                      </p>
                      {distanceToNextStep !== null && distanceToNextStep > 0 && (
                        <div className="flex items-center gap-1 mt-2 text-sm text-slate-600">
                          <span className="font-medium">
                            {distanceToNextStep < 1000 
                              ? `${Math.round(distanceToNextStep)} m` 
                              : `${(distanceToNextStep / 1000).toFixed(1)} km`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>


              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      )}
      
      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <Card className="bg-white/95 backdrop-blur-sm shadow-2xl">
            <CardContent className="p-6 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-[#F7B602] animate-spin" />
              <p className="text-lg font-semibold text-[#071739]">Getting GPS fix...</p>
              <p className="text-sm text-slate-600">Waiting for accurate location</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bottom Control Bar */}
      {!hasStarted && (
        <AnimatePresence>
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-0 left-0 right-0 z-10 p-4 pb-24 lg:pb-4"
          >
            <Card className="bg-white/95 backdrop-blur-sm shadow-2xl">
              <CardContent className="p-4">
                <Button
                  onClick={handleStart}
                  className="w-full bg-[#228B22] hover:bg-[#1a6b1a] text-white text-lg py-6"
                >
                  <Navigation2 className="w-5 h-5 mr-2" />
                  GO
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}