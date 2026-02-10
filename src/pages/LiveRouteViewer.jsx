import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Play, Pause, Volume2, VolumeX, MapPin, Clock, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Simulated route data for Basingstoke Test Centre
const SIMULATED_ROUTE = {
  coordinates: [
    [51.2660, -1.0873], // Start - Basingstoke Test Centre
    [51.2665, -1.0880],
    [51.2670, -1.0895],
    [51.2680, -1.0910],
    [51.2690, -1.0920],
    [51.2700, -1.0915],
    [51.2710, -1.0900],
    [51.2720, -1.0880],
    [51.2725, -1.0860],
    [51.2730, -1.0840],
    [51.2735, -1.0820],
    [51.2740, -1.0810],
    [51.2745, -1.0820],
    [51.2750, -1.0840],
    [51.2740, -1.0860],
    [51.2730, -1.0875],
    [51.2720, -1.0885],
    [51.2710, -1.0890],
    [51.2700, -1.0885],
    [51.2690, -1.0880],
    [51.2680, -1.0875],
    [51.2670, -1.0870],
    [51.2660, -1.0873], // End - back at test centre
  ],
  distance: '3.2 miles',
  duration: '15 minutes',
  instructions: [
    { step: 1, instruction: 'Exit the test centre and turn right onto Churchill Way', distance: '0.1 miles' },
    { step: 2, instruction: 'At the roundabout, take the second exit onto Winchester Road', distance: '0.3 miles' },
    { step: 3, instruction: 'Continue straight for 0.5 miles', distance: '0.5 miles' },
    { step: 4, instruction: 'Turn left onto Hackwood Road', distance: '0.2 miles' },
    { step: 5, instruction: 'At the junction, turn right onto London Road', distance: '0.4 miles' },
    { step: 6, instruction: 'Continue on London Road for 0.8 miles', distance: '0.8 miles' },
    { step: 7, instruction: 'Turn left onto Worting Road', distance: '0.3 miles' },
    { step: 8, instruction: 'At the roundabout, take the first exit back onto Churchill Way', distance: '0.2 miles' },
    { step: 9, instruction: 'Return to the test centre on your left', distance: '0.4 miles' },
  ]
};

function MapBoundsFitter({ coordinates }) {
  const map = useMap();
  
  useEffect(() => {
    if (coordinates && coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [coordinates, map]);

  return null;
}

export default function LiveRouteViewer() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const routeId = params.get('routeId');
  const [isStarted, setIsStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const speechSynthesisRef = useRef(null);

  const { data: route, isLoading } = useQuery({
    queryKey: ['testRoute', routeId],
    queryFn: async () => {
      const routes = await base44.entities.TestRoute.filter({ id: routeId });
      return routes[0] || null;
    },
    enabled: !!routeId
  });

  // Voice navigation
  const speak = (text) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  };

  const handleStart = () => {
    setIsStarted(true);
    setCurrentStep(0);
    speak(SIMULATED_ROUTE.instructions[0].instruction);
  };

  const handlePause = () => {
    setIsStarted(false);
    window.speechSynthesis.cancel();
  };

  const handleNextInstruction = () => {
    if (currentStep < SIMULATED_ROUTE.instructions.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      speak(SIMULATED_ROUTE.instructions[nextStep].instruction);
    }
  };

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    if (voiceEnabled) {
      window.speechSynthesis.cancel();
    }
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F7B602] mx-auto mb-4"></div>
          <p className="text-slate-600">Loading route...</p>
        </div>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-slate-600">Route not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="p-4 max-w-6xl mx-auto flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-xl font-bold text-[#071739]">{route.routeName}</h1>
          <Button variant="ghost" size="icon" onClick={toggleVoice}>
            {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-4">
        {/* Route Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Navigation className="w-8 h-8 text-[#F7B602]" />
                <div>
                  <p className="text-sm text-slate-600">Total Distance</p>
                  <p className="text-2xl font-bold text-[#071739]">{SIMULATED_ROUTE.distance}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-[#F7B602]" />
                <div>
                  <p className="text-sm text-slate-600">Estimated Duration</p>
                  <p className="text-2xl font-bold text-[#071739]">{SIMULATED_ROUTE.duration}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Map */}
        <Card>
          <CardContent className="p-0">
            <div className="h-[400px] rounded-lg overflow-hidden">
              <MapContainer
                center={SIMULATED_ROUTE.coordinates[0]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <Polyline
                  positions={SIMULATED_ROUTE.coordinates}
                  color="#F7B602"
                  weight={4}
                  opacity={0.8}
                />
                <Marker position={SIMULATED_ROUTE.coordinates[0]} />
                <Marker position={SIMULATED_ROUTE.coordinates[SIMULATED_ROUTE.coordinates.length - 1]} />
                <MapBoundsFitter coordinates={SIMULATED_ROUTE.coordinates} />
              </MapContainer>
            </div>
          </CardContent>
        </Card>

        {/* Current Instruction */}
        {isStarted && (
          <Alert className="bg-[#F7B602]/10 border-[#F7B602]">
            <Navigation className="h-4 w-4" />
            <AlertDescription className="ml-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg">{SIMULATED_ROUTE.instructions[currentStep].instruction}</p>
                  <p className="text-sm text-slate-600 mt-1">
                    In {SIMULATED_ROUTE.instructions[currentStep].distance}
                  </p>
                </div>
                <Badge variant="outline" className="ml-4">
                  Step {currentStep + 1} of {SIMULATED_ROUTE.instructions.length}
                </Badge>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Controls */}
        <Card>
          <CardContent className="pt-6">
            {!isStarted ? (
              <Button
                onClick={handleStart}
                className="w-full bg-[#F7B602] hover:bg-[#d99f02] text-[#071739] py-6 text-lg"
              >
                <Play className="w-6 h-6 mr-2" />
                Start Route Navigation
              </Button>
            ) : (
              <div className="space-y-3">
                <Button
                  onClick={handlePause}
                  variant="outline"
                  className="w-full py-6 text-lg"
                >
                  <Pause className="w-6 h-6 mr-2" />
                  Pause Navigation
                </Button>
                <Button
                  onClick={handleNextInstruction}
                  disabled={currentStep >= SIMULATED_ROUTE.instructions.length - 1}
                  className="w-full bg-[#F7B602] hover:bg-[#d99f02] text-[#071739] py-6 text-lg"
                >
                  Next Instruction
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Route Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {SIMULATED_ROUTE.instructions.map((instruction, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    isStarted && index === currentStep
                      ? 'bg-[#F7B602]/20 border-[#F7B602]'
                      : 'bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isStarted && index === currentStep
                        ? 'bg-[#F7B602] text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {instruction.step}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{instruction.instruction}</p>
                      <p className="text-sm text-slate-600 mt-1">{instruction.distance}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}