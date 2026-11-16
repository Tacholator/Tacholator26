// Sorts test route videos by the instructor-defined display order.
// Routes without an order fall to the end, oldest first.
export function sortRoutesByOrder(routes = []) {
  return [...routes].sort((a, b) => {
    const aOrder = typeof a?.displayOrder === 'number' ? a.displayOrder : Number.MAX_SAFE_INTEGER;
    const bOrder = typeof b?.displayOrder === 'number' ? b.displayOrder : Number.MAX_SAFE_INTEGER;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return new Date(a?.created_date || 0) - new Date(b?.created_date || 0);
  });
}