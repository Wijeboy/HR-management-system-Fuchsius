export const getDefaultRouteForRole = (role) => {
  switch (role) {
    case 'admin':
      return '/dashboard';
    case 'hr':
      return '/dashboard';
    case 'manager':
      return '/dashboard';
    case 'employee':
      return '/dashboard';
    default:
      return '/dashboard';
  }
};
