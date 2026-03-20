Deno.serve(async (req) => {
  try {
    const token = Deno.env.get("VITE_MAPBOX_ACCESS_TOKEN");
    
    if (!token) {
      return Response.json(
        { error: 'Mapbox token not configured' },
        { status: 500 }
      );
    }
    
    return Response.json({ token });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});