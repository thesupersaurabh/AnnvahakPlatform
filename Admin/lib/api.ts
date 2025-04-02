import { API_URL } from "./env"

type RequestOptions = {
  method?: string
  body?: any
  headers?: Record<string, string>
  retries?: number
  retryDelay?: number
  timeout?: number
}

export async function fetchApi(endpoint: string, options: RequestOptions = {}) {
  // Set default values for retries
  const maxRetries = options.retries ?? 3; // Increased default retries
  const retryDelay = options.retryDelay ?? 1000;
  const timeout = options.timeout ?? 15000; // Default 15s timeout
  let retryCount = 0;
  
  async function tryFetch(): Promise<any> {
    try {
      // Check if API_URL is defined
      if (!API_URL) {
        console.error("API_URL is not defined. Please check your environment variables.");
        throw new Error("API URL is not configured");
      }
      
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...options.headers,
      }

      // Only access localStorage in browser environment
      if (typeof window !== 'undefined') {
        try {
          const token = localStorage.getItem("token")
          if (token) {
            headers["Authorization"] = `Bearer ${token}`
          }
        } catch (error) {
          console.warn("Could not access localStorage:", error);
        }
      }

      console.log(`Fetching ${API_URL}${endpoint}`);
      
      if (options.body) {
        console.log("Request body:", JSON.stringify(options.body));
      }

      // Use AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(`${API_URL}${endpoint}`, {
          method: options.method || "GET",
          headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId); // Clear timeout if request completes
        
        // Check if response has content before trying to parse as JSON
        const contentType = response.headers.get("content-type");
        let data;
        
        if (contentType && contentType.includes("application/json")) {
          const text = await response.text();
          try {
            data = text ? JSON.parse(text) : {};
          } catch (e) {
            console.error("Error parsing JSON response:", e);
            console.error("Response text:", text);
            data = { message: "Invalid JSON response from server" };
          }
        } else {
          const text = await response.text();
          console.log("Non-JSON response:", text);
          data = { message: text || "Server returned non-JSON response" };
        }

        if (!response.ok) {
          console.error(`API error ${response.status}: ${data?.message || "No message"}`);
          
          const error = new Error(data?.message || "Something went wrong") as Error & {
            status?: number;
            response?: any;
          };
          
          error.status = response.status;
          error.response = data || {};
          
          throw error;
        }

        return data;
      } catch (fetchError) {
        clearTimeout(timeoutId); // Make sure to clear timeout
        throw fetchError; // Re-throw for outer catch block to handle
      }
    } catch (error) {
      // Handle AbortController timeout
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.error(`Request timed out after ${timeout}ms`);
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Timeout, retrying (${retryCount}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return tryFetch();
        }
        
        // If we've used all retries, throw a specific timeout error
        const timeoutError = new Error(`Connection timed out. Please try again later.`) as Error & {
          isTimeout?: boolean;
        };
        timeoutError.isTimeout = true;
        throw timeoutError;
      }
      
      // If it's a network error and we have retries left, retry the request
      if ((error instanceof TypeError || 
          (error instanceof Error && (
            error.message === 'Failed to fetch' || 
            error.message.includes('Network') ||
            error.message.includes('network')
          ))) 
          && retryCount < maxRetries) {
        retryCount++;
        console.log(`Network error, retrying (${retryCount}/${maxRetries})...`);
        
        // Wait before retrying with exponential backoff
        const backoffDelay = retryDelay * Math.pow(2, retryCount - 1);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        return tryFetch();
      }
      
      // If it's already our error with status/response, just rethrow it
      if ((error as any).status) {
        throw error;
      }
      
      // No mock data fallback - always throw error for connection issues
      console.error("Network or fetch error:", error);
      
      // Create a more useful error
      const fetchError = new Error(
        "Cannot connect to server. Please check your internet connection and try again."
      ) as Error & {
        original?: any;
        isNetworkError?: boolean;
      };
      
      fetchError.original = error;
      fetchError.isNetworkError = true;
      
      throw fetchError;
    }
  }
  
  return tryFetch();
}

