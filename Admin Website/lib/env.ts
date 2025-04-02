// Get environment variables with fallbacks
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  // Check if we're in the browser
  if (typeof window !== 'undefined') {
    // For client-side, we might have stored this in localStorage or window
    const fromWindow = (window as any).__ENV__?.[key];
    if (fromWindow) return fromWindow;
  }
  
  // For server-side or if window var not available, try process.env
  const fromEnv = process.env[`NEXT_PUBLIC_${key}`] || process.env[key];
  return fromEnv || defaultValue;
};

// API URL with fallback to localhost:5000 if not defined
export const API_URL = getEnvVar('API_URL', 'http://localhost:5000');

// Check and log API URL on startup
if (typeof window !== 'undefined') {
  console.log('API URL configured as:', API_URL);
}

// Other environment variables
export const APP_NAME = getEnvVar('APP_NAME', 'Annvahak Platform');
export const APP_VERSION = getEnvVar('APP_VERSION', '1.0.0');

