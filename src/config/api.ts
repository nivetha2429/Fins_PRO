// API Configuration
// In development, we use Vite's proxy ('') to hit the local backend (http://localhost:5000)
// In production, we use the Fly.io URL or the provided environment variable
export const API_BASE_URL = import.meta.env.MODE === 'production'
  ? (import.meta.env.VITE_API_URL || 'https://emi-pro-app.fly.dev')
  : ''; // Empty string = uses Vite proxy in dev

console.warn('🚀 FRONTEND API CONFIG:', {
  MODE: import.meta.env.MODE,
  VITE_API_URL: import.meta.env.VITE_API_URL,
  FINAL_BASE_URL: API_BASE_URL
});

export const getApiUrl = (endpoint: string) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return API_BASE_URL ? `${API_BASE_URL}/${cleanEndpoint}` : `/${cleanEndpoint}`;
};

// Logout utility - clears all auth data and redirects to login
export const logout = () => {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
  localStorage.removeItem('isAdminAuthenticated');
  localStorage.removeItem('currentAdmin');
  localStorage.removeItem('isAppLocked'); // Clear app lock state
  sessionStorage.clear();

  // Only redirect if not already on login page (prevent infinite loop)
  if (window.location.pathname !== '/login' && window.location.pathname !== '/admin/login') {
    window.location.href = '/';
  }
};

// Enhanced fetch wrapper with 401 handling
export const apiFetch = async (url: string, options?: RequestInit) => {
  const response = await fetch(url, options);

  // Handle 401 Unauthorized - token expired or invalid
  if (response.status === 401) {
    console.warn('🔒 Authentication failed (401) - clearing tokens and redirecting to login');
    logout();
    throw new Error('Authentication required');
  }

  return response;
};
