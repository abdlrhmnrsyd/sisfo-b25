/**
 * Utility functions for API calls
 */

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  success: boolean;
}

/**
 * Safely parse JSON response with proper error handling
 */
export async function safeJsonParse<T = unknown>(response: Response): Promise<ApiResponse<T>> {
  try {
    // Check if response is ok
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      
      // Try to parse as JSON, fallback to text error
      try {
        const errorData = JSON.parse(errorText);
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}: ${response.statusText}`
        };
      } catch {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    }

    // Check content type before parsing JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const responseText = await response.text();
      console.error('Non-JSON Response:', responseText);
      return {
        success: false,
        error: 'Server returned non-JSON response'
      };
    }

    const data = await response.json();
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('JSON parsing error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse response'
    };
  }
}

/**
 * Make a safe API call with proper error handling
 */
export async function safeApiCall<T = unknown>(
  url: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    return await safeJsonParse<T>(response);
  } catch (error) {
    console.error('API call error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    };
  }
}
