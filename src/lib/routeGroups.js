export const EXIT_DIRECTION_LABELS = {
  left: 'Left from Test centre onto Sullivan Road',
  right: 'Right from Test Centre onto Sullivan Road',
  none: 'Not categorised',
};

const EXIT_ORDER = ['left', 'right', 'none'];

export function sortRoutesByExitDirection(routes = []) {
  return [...routes].sort(
    (a, b) => EXIT_ORDER.indexOf(a.exitDirection || 'none') - EXIT_ORDER.indexOf(b.exitDirection || 'none')
  );
}

export function buildExitDirectionGroups(routes = []) {
  return [
    { key: 'left', label: EXIT_DIRECTION_LABELS.left, routes: routes.filter(r => r.exitDirection === 'left') },
    { key: 'right', label: EXIT_DIRECTION_LABELS.right, routes: routes.filter(r => r.exitDirection === 'right') },
    { key: 'none', label: EXIT_DIRECTION_LABELS.none, routes: routes.filter(r => !r.exitDirection) },
  ];
}