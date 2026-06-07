export const getDefaultRouteForRole = (role) => {
  switch (role) {
    case 'admin':
      return '/dashboard';
    case 'hr':
      return '/hr-dashboard';
    case 'manager':
      return '/manager-dashboard';
    case 'employee':
      return '/employee-dashboard';
    default:
      return '/dashboard';
  }
};
