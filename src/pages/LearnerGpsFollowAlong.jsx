import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Navigation, MapPin, Play, Pause, Target, AlertTriangle } from 'lucide-react';
import GpsFollowAlongMap from '@/components/gps/GpsFollowAlongMap';

export default function LearnerGpsFollowAlong() {
  const { centreId } = useParams();
  const navigate = useNavigate();
  const [isTracking, setIsTracking] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [speed, setSpeed] = useState(null);
  const [heading, setHeading] = useState(0);
  const [distanceFromRoute, setDistanceFromRoute] = useState(null);
  const [showOffRouteAlert, setShowOffRouteAlert] = useState(false);
  const watchIdRef = useRef(null);

  // Fetch centre data
  const { data: centre, isLoading } = useQuery({
    queryKey: ['testRouteCentre', centreId],
    queryFn: async () => {
      const centres = await base44.entities.TestRouteCentre.filter({ id: centreId });
      return centres[0] || null;
    },
    enabled: !!centreId
  });

  // Start GPS tracking
  const startTracking = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy: acc, speed: spd, heading: hdg } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setAccuracy(Math.round(acc));
        setSpeed(spd !== null ? Math.round(spd * 2.237) : null); // m/s to mph
        setHeading(hdg || 0);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Unable to get your location. Please enable location services.');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000
      }
    );

    setIsTracking(true);
    setIsFollowing(true);
  };

  // Stop GPS tracking
  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    setIsFollowing(false);
  };

  // Handle distance updates
  const handleDistanceUpdate = (distanceMeters) => {
    setDistanceFromRoute(distanceMeters);
    setShowOffRouteAlert(distanceMeters > 40);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
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

  if (!centre) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <MapPin className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <p className="text-slate-600">Route centre not found</p>
        </div>
      </div>
    );
  }

  const hasGeoJson = centre.gpsGeoJson && centre.gpsGeoJson.geometry;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-[#071739]">{centre.centreName}</h1>
            <p className="text-slate-600">{centre.subLocation}</p>
          </div>
        </div>

        {/* Off-route alert */}
        {showOffRouteAlert && (
          <Alert variant="destructive" className="animate-pulse">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>You've drifted off the route!</strong> Distance from route: {distanceFromRoute}m
            </AlertDescription>
          </Alert>
        )}

        {/* No GPS data alert */}
        {!hasGeoJson && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No GPS route has been set up yet. Your instructor needs to add the route data.
            </AlertDescription>
          </Alert>
        )}

        {/* Map */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-[#F7B602]" />
              GPS Follow-Along
            </CardTitle>
            <CardDescription>
              Follow the highlighted route. Your live location will appear on the map.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasGeoJson ? (
              <GpsFollowAlongMap
                geoJson={centre.gpsGeoJson}
                userLocation={userLocation}
                userHeading={heading}
                followUser={isFollowing}
                onDistanceUpdate={handleDistanceUpdate}
              />
            ) : (
              <div className="h-96 bg-slate-100 rounded-lg flex items-center justify-center">
                <p className="text-slate-500">No GPS route available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!isTracking ? (
                <Button
                  onClick={startTracking}
                  disabled={!hasGeoJson}
                  className="w-full bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start GPS Tracking
                </Button>
              ) : (
                <>
                  <Button
                    onClick={stopTracking}
                    variant="destructive"
                    className="w-full"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    Stop GPS Tracking
                  </Button>
                  <Button
                    onClick={() => setIsFollowing(!isFollowing)}
                    variant={isFollowing ? "secondary" : "outline"}
                    className="w-full"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    {isFollowing ? 'Following' : 'Follow Me'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>GPS Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-slate-600">GPS Tracking</span>
                  <span className="font-semibold">{isTracking ? 'Active' : 'Inactive'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-slate-600">Accuracy</span>
                  <span className="font-semibold">{accuracy !== null ? `${accuracy}m` : '-'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-slate-600">Speed</span>
                  <span className="font-semibold">{speed !== null ? `${speed} mph` : '-'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-slate-600">Distance from Route</span>
                  <span className={`font-semibold ${distanceFromRoute > 40 ? 'text-red-600' : ''}`}>
                    {distanceFromRoute !== null ? `${distanceFromRoute}m` : '-'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}