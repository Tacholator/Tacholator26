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

    const rawText = await gpsResponse.text();

    let coordinates = [];
    let routeName = 'Route';

    // Detect GPX (XML) vs JSON
    if (rawText.trim().startsWith('<')) {
      // Parse GPX XML - extract trkpt lat/lon attributes
      const trkptRegex = /<trkpt\s+lat="([\d.\-]+)"\s+lon="([\d.\-]+)"/g;
      let match;
      while ((match = trkptRegex.exec(rawText)) !== null) {
        coordinates.push([parseFloat(match[2]), parseFloat(match[1])]);
      }
      // Also try lon before lat ordering
      if (coordinates.length === 0) {
        const altRegex = /<trkpt\s+lon="([\d.\-]+)"\s+lat="([\d.\-]+)"/g;
        while ((match = altRegex.exec(rawText)) !== null) {
          coordinates.push([parseFloat(match[1]), parseFloat(match[2])]);
        }
      }
      const nameMatch = rawText.match(/<name>([^<]+)<\/name>/);
      if (nameMatch) routeName = nameMatch[1].trim();
    } else {
      const gpsData = JSON.parse(rawText);
      if (!gpsData.points || !Array.isArray(gpsData.points)) {
        return Response.json({ error: 'Invalid GPS data format: missing points array' }, { status: 400 });
      }
      coordinates = gpsData.points.map(p => [p.lng ?? p.lon, p.lat]);
      routeName = gpsData.route?.name || 'Route';
    }

    if (coordinates.length === 0) {
      return Response.json({ error: 'No GPS points found in file' }, { status: 400 });
    }

    const pointsCount = coordinates.length;

    const geoJson = {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: coordinates
      },
      properties: {
        name: routeName,
        pointsCount
      }
    };

    // Generate basic turn-by-turn steps (~10 evenly spaced)
    const steps = [];
    const stepInterval = Math.floor(pointsCount / 10);
    for (let i = 0; i < pointsCount; i += stepInterval) {
      const coord = coordinates[i];
      if (coord) {
        steps.push({
          instructionText: i === 0
            ? "Start your journey"
            : i >= pointsCount - stepInterval
              ? "You are approaching your destination"
              : "Continue following the route",
          location: { latitude: coord[1], longitude: coord[0] }
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
      pointsProcessed: pointsCount,
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