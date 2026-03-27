import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin access
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { routeId, gpsDataUrl } = body;

    if (!routeId || !gpsDataUrl) {
      return Response.json({ 
        error: 'Missing required fields: routeId, gpsDataUrl' 
      }, { status: 400 });
    }

    // Clean up the URL - remove any extra characters
    const cleanUrl = gpsDataUrl.trim().replace(/^\(+|\)+$/g, '');

    // Fetch the GPS data from URL
    const gpsResponse = await fetch(cleanUrl);
    if (!gpsResponse.ok) {
      return Response.json({ 
        error: 'Failed to fetch GPS data file' 
      }, { status: 400 });
    }

    const gpsData = await gpsResponse.json();

    // Validate data structure
    if (!gpsData.points || !Array.isArray(gpsData.points)) {
      return Response.json({ 
        error: 'Invalid GPS data format: missing points array' 
      }, { status: 400 });
    }

    // Convert to GeoJSON LineString format
    const coordinates = gpsData.points.map(point => [point.lng ?? point.lon, point.lat]);

    const geoJson = {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: coordinates
      },
      properties: {
        name: gpsData.route?.name || "Route",
        distance: gpsData.route?.distanceMeters,
        duration: gpsData.route?.durationSec,
        pointsCount: gpsData.points.length
      }
    };

    // Generate basic turn-by-turn steps (simplified)
    const steps = [];
    const stepInterval = Math.floor(gpsData.points.length / 10); // ~10 steps
    
    for (let i = 0; i < gpsData.points.length; i += stepInterval) {
      const point = gpsData.points[i];
      if (point) {
        steps.push({
          instructionText: i === 0 
            ? "Start your journey" 
            : i >= gpsData.points.length - stepInterval 
              ? "You are approaching your destination"
              : "Continue following the route",
          location: {
            latitude: point.lat,
            longitude: point.lng ?? point.lon
          },
          distance: `${Math.round((gpsData.route?.distanceMeters || 0) / 1000 * (i / gpsData.points.length))}km`
        });
      }
    }

    // Update the route
    const updated = await base44.asServiceRole.entities.TestRoute.update(routeId, {
      gpsGeoJson: geoJson,
      stepsJson: steps,
      gpsRouteType: 'geojson_url'
    });

    return Response.json({ 
      success: true, 
      message: 'Route configured successfully',
      pointsProcessed: gpsData.points.length,
      stepsGenerated: steps.length,
      route: updated
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});