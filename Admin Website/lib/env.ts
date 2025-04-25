// Get environment variables with fallbacks
const getEnvVar = (key: string): string => {
  // Check if the variable is for the client-side (prefixed with NEXT_PUBLIC_)
  const fromClient = process.env[`NEXT_PUBLIC_${key}`];
  if (fromClient) {
    return fromClient;
  }

  // Check if the variable is server-side (no NEXT_PUBLIC_ prefix)
  const fromServer = process.env[key];
  if (fromServer) {
    return fromServer;
  }

  // If not found, log a warning and return an empty string or throw an error if required
  console.warn(`Warning: Environment variable ${key} is not defined.`);
  return '';  // Or you can throw an error like: throw new Error(`${key} is missing`);
};

// Access the API URL (which should be available on both client and server)
export const API_URL = getEnvVar('API_URL') || process.env.NEXT_PUBLIC_API_URL; // Allow client-side fallback if necessary

// Check and log API URL on startup (in case of issues)
if (typeof window === 'undefined' && !API_URL) {
  console.error('Error: API_URL is not defined in the environment variables!');
} else if (typeof window === 'undefined') {
  console.log('API URL configured as:', API_URL);
}

// Other environment variables
export const APP_NAME = getEnvVar('APP_NAME') || process.env.NEXT_PUBLIC_APP_NAME;
export const APP_VERSION = getEnvVar('APP_VERSION') || process.env.NEXT_PUBLIC_APP_VERSION;

