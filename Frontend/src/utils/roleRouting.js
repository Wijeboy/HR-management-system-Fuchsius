export const getDefaultRouteForRole = (role) => {
  switch (role) {
    case 'admin':
      return '/dashboard';
    case 'hr':
      return '/leave/manage';
    case 'manager':
      return '/attendance/reports';
    case 'employee':
      return '/attendance';
    default:
      return '/dashboard';
  }
};
