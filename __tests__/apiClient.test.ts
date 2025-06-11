import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals'; // Import Jest globals for ESM

// Statically import types needed for annotations
import type {
  BraveWeb,
  BravePoiResponse,
  BraveDescription,
  BraveApiError as BraveApiErrorType // Import the type alias for BraveApiError
} from '../apiClient.js';

// Dynamically import functions and class constructor after resetting modules
let fetchWebSearch: typeof import('../apiClient.js').fetchWebSearch;
let fetchInitialLocalSearch: typeof import('../apiClient.js').fetchInitialLocalSearch;
let fetchPoiDetails: typeof import('../apiClient.js').fetchPoiDetails;
let fetchPoiDescriptions: typeof import('../apiClient.js').fetchPoiDescriptions;
let BraveApiErrorClass: typeof import('../apiClient.js').BraveApiError; // Variable to hold the class constructor
let _resetRateLimiterForTest: typeof import('../apiClient.js')._resetRateLimiterForTest; // Import reset function type
let BRAVE_API_KEY: typeof import('../config.js').BRAVE_API_KEY;

// Mock the global fetch function with correct typing
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('Brave API Client (apiClient.ts)', () => {

  // Define mock data at a higher scope
  const mockSuccessResponse: BraveWeb = { web: { results: [{ title: 'Test', description: 'Desc', url: 'http://example.com' }] } };
  const mockLocalSuccessResponse: BraveWeb = { locations: { results: [{ id: 'poi123', title: 'Local Place' }] } };
  const mockPoiResponse: BravePoiResponse = { results: [{ id: 'poi1', name: 'POI One', address: {} }] };
  const mockDescResponse: BraveDescription = { descriptions: { 'poi1': 'Desc One', 'poi2': 'Desc Two' } };

  // Spy instance for Date.now - managed within Rate Limiting describe block
  let dateSpy: ReturnType<typeof jest.spyOn> | null = null;

  beforeEach(async () => {
    // Reset modules to clear internal state like rate limiter counts
    jest.resetModules();
    // Reset fetch mock calls
    (global.fetch as jest.Mock).mockClear();

    // Re-import the module after resetting
    const apiClient = await import('../apiClient.js');
    const config = await import('../config.js');
    fetchWebSearch = apiClient.fetchWebSearch;
    fetchInitialLocalSearch = apiClient.fetchInitialLocalSearch;
    fetchPoiDetails = apiClient.fetchPoiDetails;
    fetchPoiDescriptions = apiClient.fetchPoiDescriptions;
    BraveApiErrorClass = apiClient.BraveApiError; // Assign class constructor
    _resetRateLimiterForTest = apiClient._resetRateLimiterForTest; // Assign reset function
    BRAVE_API_KEY = config.BRAVE_API_KEY;
  });

   afterEach(() => {
     // Ensure Date.now spy is restored if it was set up
     dateSpy?.mockRestore();
   });


  // --- Tests for fetchWebSearch ---
  describe('fetchWebSearch', () => {
    it('should call fetch with the correct URL and headers for basic query', async () => {
      (global.fetch as jest.Mock).mockImplementation(async () => ({ ok: true, json: async () => mockSuccessResponse, text: async () => '', status: 200, statusText: 'OK' }));
      await fetchWebSearch('test query', 10, 0);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url, options] = (global.fetch as jest.Mock).mock.calls[0] as [URL, RequestInit];
      const expectedUrl = 'https://api.search.brave.com/res/v1/web/search?q=test+query&count=10&offset=0&result_filter=web';
      expect(url.toString()).toBe(expectedUrl);
      expect(options.headers).toEqual({ 'Accept': 'application/json', 'Accept-Encoding': 'gzip', 'X-Subscription-Token': BRAVE_API_KEY });
    });

    it('should clamp count parameter correctly (max 20)', async () => {
       (global.fetch as jest.Mock).mockImplementation(async () => ({ ok: true, json: async () => mockSuccessResponse, text: async () => '', status: 200, statusText: 'OK' }));
       await fetchWebSearch('test', 50, 0);
       expect(global.fetch).toHaveBeenCalledTimes(1);
       const [url] = (global.fetch as jest.Mock).mock.calls[0] as [URL];
       expect(url.searchParams.get('count')).toBe('20');
    });

    it('should handle undefined count parameter (omit count)', async () => {
       (global.fetch as jest.Mock).mockImplementation(async () => ({ ok: true, json: async () => mockSuccessResponse, text: async () => '', status: 200, statusText: 'OK' }));
       await fetchWebSearch('test', undefined as any, 0);
       expect(global.fetch).toHaveBeenCalledTimes(1);
       const [url] = (global.fetch as jest.Mock).mock.calls[0] as [URL];
       expect(url.searchParams.has('count')).toBe(false);
    });

    it('should clamp offset parameter correctly (max 9)', async () => {
       (global.fetch as jest.Mock).mockImplementation(async () => ({ ok: true, json: async () => mockSuccessResponse, text: async () => '', status: 200, statusText: 'OK' }));
       await fetchWebSearch('test', 10, 20);
       expect(global.fetch).toHaveBeenCalledTimes(1);
       const [url] = (global.fetch as jest.Mock).mock.calls[0] as [URL];
       expect(url.searchParams.get('offset')).toBe('9');
    });

     it('should clamp offset parameter correctly (min 0)', async () => {
       (global.fetch as jest.Mock).mockImplementation(async () => ({ ok: true, json: async () => mockSuccessResponse, text: async () => '', status: 200, statusText: 'OK' }));
       await fetchWebSearch('test', 10, -5);
       expect(global.fetch).toHaveBeenCalledTimes(1);
       const [url] = (global.fetch as jest.Mock).mock.calls[0] as [URL];
       expect(url.searchParams.get('offset')).toBe('0');
    });

     it('should handle undefined offset parameter (omit offset)', async () => {
       (global.fetch as jest.Mock).mockImplementation(async () => ({ ok: true, json: async () => mockSuccessResponse, text: async () => '', status: 200, statusText: 'OK' }));
       await fetchWebSearch('test', 10, undefined as any);
       expect(global.fetch).toHaveBeenCalledTimes(1);
       const [url] = (global.fetch as jest.Mock).mock.calls[0] as [URL];
       expect(url.searchParams.has('offset')).toBe(false);
    });

    it('should return the parsed JSON data on success', async () => {
      (global.fetch as jest.Mock).mockImplementation(async () => ({ ok: true, json: async () => mockSuccessResponse, text: async () => '', status: 200, statusText: 'OK' }));
      const result = await fetchWebSearch('test', 10, 0);
      expect(result).toEqual(mockSuccessResponse);
    });
  });

  // --- Tests for fetchInitialLocalSearch ---
  describe('fetchInitialLocalSearch', () => {
    it('should call fetch with the correct URL and headers', async () => {
      (global.fetch as jest.Mock).mockImplementation(async () => ({ ok: true, json: async () => mockLocalSuccessResponse, text: async () => '', status: 200, statusText: 'OK' }));
      await fetchInitialLocalSearch('local query', 5);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url, options] = (global.fetch as jest.Mock).mock.calls[0] as [URL, RequestInit];
      const expectedUrl = 'https://api.search.brave.com/res/v1/web/search?q=local+query&search_lang=en&result_filter=locations&count=5';
      expect(url.toString()).toBe(expectedUrl);
      expect(options.headers).toEqual({ 'Accept': 'application/json', 'Accept-Encoding': 'gzip', 'X-Subscription-Token': BRAVE_API_KEY });
    });

    it('should clamp count parameter correctly (max 20)', async () => {
      (global.fetch as jest.Mock).mockImplementation(async () => ({ ok: true, json: async () => mockLocalSuccessResponse, text: async () => '', status: 200, statusText: 'OK' }));
      await fetchInitialLocalSearch('local', 30);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url] = (global.fetch as jest.Mock).mock.calls[0] as [URL];
      expect(url.searchParams.get('count')).toBe('20');
    });

    it('should return parsed JSON data on success', async () => {
      (global.fetch as jest.Mock).mockImplementation(async () => ({ ok: true, json: async () => mockLocalSuccessResponse, text: async () => '', status: 200, statusText: 'OK' }));
      const result = await fetchInitialLocalSearch('local', 5);
      expect(result).toEqual(mockLocalSuccessResponse);
    });
  });

  // --- Tests for fetchPoiDetails ---
   describe('fetchPoiDetails', () => {
    const poiIds = ['poi1', 'poi2', 'poi3'];
    it('should call fetch with the correct URL and headers for multiple IDs', async () => {
      (global.fetch as jest.Mock).mockImplementation(async () => ({ ok: true, json: async () => mockPoiResponse, text: async () => '', status: 200, statusText: 'OK' }));
      await fetchPoiDetails(poiIds);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url, options] = (global.fetch as jest.Mock).mock.calls[0] as [URL, RequestInit];
      const expectedUrl = 'https://api.search.brave.com/res/v1/local/pois?ids=poi1&ids=poi2&ids=poi3';
      expect(url.toString()).toBe(expectedUrl);
      expect(options.headers).toEqual({ 'Accept': 'application/json', 'Accept-Encoding': 'gzip', 'X-Subscription-Token': BRAVE_API_KEY });
    });

    it('should handle empty ID array without calling fetch', async () => {
      const result = await fetchPoiDetails([]);
      expect(global.fetch).not.toHaveBeenCalled();
      expect(result).toEqual({ results: [] });
    });

     it('should handle ID array with null/undefined values', async () => {
      (global.fetch as jest.Mock).mockImplementation(async () => ({ ok: true, json: async () => mockPoiResponse, text: async () => '', status: 200, statusText: 'OK' }));
      await fetchPoiDetails(['poi1', null, 'poi3', undefined] as any);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url] = (global.fetch as jest.Mock).mock.calls[0] as [URL];
      expect(url.toString()).toBe('https://api.search.brave.com/res/v1/local/pois?ids=poi1&ids=poi3');
    });

    it('should return parsed JSON data on success', async () => {
      (global.fetch as jest.Mock).mockImplementation(async () => ({ ok: true, json: async () => mockPoiResponse, text: async () => '', status: 200, statusText: 'OK' }));
      const result = await fetchPoiDetails(poiIds);
      expect(result).toEqual(mockPoiResponse);
    });
  });

  // --- Tests for fetchPoiDescriptions ---
  describe('fetchPoiDescriptions', () => {
    const poiIds = ['poi1', 'poi2', 'poi3'];
    it('should call fetch with the correct URL and headers for multiple IDs', async () => {
      (global.fetch as jest.Mock).mockImplementation(async () => ({ ok: true, json: async () => mockDescResponse, text: async () => '', status: 200, statusText: 'OK' }));
      await fetchPoiDescriptions(poiIds);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url, options] = (global.fetch as jest.Mock).mock.calls[0] as [URL, RequestInit];
      const expectedUrl = 'https://api.search.brave.com/res/v1/local/descriptions?ids=poi1&ids=poi2&ids=poi3';
      expect(url.toString()).toBe(expectedUrl);
      expect(options.headers).toEqual({ 'Accept': 'application/json', 'Accept-Encoding': 'gzip', 'X-Subscription-Token': BRAVE_API_KEY });
    });

    it('should handle empty ID array without calling fetch', async () => {
      const result = await fetchPoiDescriptions([]);
      expect(global.fetch).not.toHaveBeenCalled();
      expect(result).toEqual({ descriptions: {} });
    });

     it('should handle ID array with null/undefined values', async () => {
      (global.fetch as jest.Mock).mockImplementation(async () => ({ ok: true, json: async () => mockDescResponse, text: async () => '', status: 200, statusText: 'OK' }));
      await fetchPoiDescriptions(['poi1', null, 'poi3', undefined] as any);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url] = (global.fetch as jest.Mock).mock.calls[0] as [URL];
      expect(url.toString()).toBe('https://api.search.brave.com/res/v1/local/descriptions?ids=poi1&ids=poi3');
    });

    it('should return parsed JSON data on success', async () => {
      (global.fetch as jest.Mock).mockImplementation(async () => ({ ok: true, json: async () => mockDescResponse, text: async () => '', status: 200, statusText: 'OK' }));
      const result = await fetchPoiDescriptions(poiIds);
      expect(result).toEqual(mockDescResponse);
    });
  });

  // --- Tests for callBraveApi error handling ---
  describe('callBraveApi (Error Handling)', () => {
    it('should throw BraveApiError on non-OK response (e.g., 400)', async () => {
      const errorText = 'Invalid request parameters';
      (global.fetch as jest.Mock).mockImplementation(async () => ({ ok: false, status: 400, statusText: 'Bad Request', text: async () => errorText, json: async () => ({ error: errorText }) }));
      try {
        await fetchWebSearch('test', 10, 0);
      } catch (e) {
        expect((e as Error).name).toBe('BraveApiError');
        const error = e as BraveApiErrorType; // Use imported type alias
        expect(error.message).toContain('API request failed');
        expect(error.status).toBe(400);
        expect(error.details).toContain('Bad Request');
        expect(error.details).toContain(errorText);
      }
       expect(global.fetch).toHaveBeenCalledTimes(1);
    });

     it('should throw BraveApiError on non-OK response (e.g., 500)', async () => {
      const errorText = 'Internal Server Error on Brave API';
      (global.fetch as jest.Mock).mockImplementation(async () => ({ ok: false, status: 500, statusText: 'Internal Server Error', text: async () => errorText, json: async () => ({ error: errorText }) }));
       try {
        await fetchPoiDetails(['poi1']);
      } catch (e) {
        expect((e as Error).name).toBe('BraveApiError');
        const error = e as BraveApiErrorType; // Use imported type alias
        expect(error.message).toContain('API request failed');
        expect(error.status).toBe(500);
        expect(error.details).toContain('Internal Server Error');
        expect(error.details).toContain(errorText);
      }
       expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should throw BraveApiError on network error', async () => {
      const networkError = new Error('Network connection failed');
      (global.fetch as jest.Mock).mockImplementation(async () => { throw networkError; });
      try {
        await fetchWebSearch('test', 10, 0);
      } catch (e) {
        expect((e as Error).name).toBe('BraveApiError');
        const error = e as BraveApiErrorType; // Use imported type alias
        expect(error.message).toContain('Network error calling Brave API');
        expect(error.message).toContain(networkError.message);
        expect(error.status).toBeUndefined();
        expect(error.details).toBeUndefined();
      }
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

   // --- Tests for Rate Limiting ---
   describe('Rate Limiting', () => {
     // Setup spy for Date.now specifically for this block
     beforeEach(() => {
       dateSpy = jest.spyOn(Date, 'now');
     });
     // afterEach to restore is handled globally now

     it('should throw error if rate limit is exceeded within one second', async () => {
       (global.fetch as jest.Mock).mockImplementation(async () => ({ ok: true, json: async () => ({}), text: async () => '', status: 200, statusText: 'OK' }));

       // Set initial time *then* reset the limiter state using that time
       dateSpy!.mockReturnValue(10000);
       _resetRateLimiterForTest(); // Now uses the mocked 10000 for initial lastSecondReset

       // First call should succeed (now = 10000)
       await expect(fetchWebSearch('req1', 1, 0)).resolves.toBeDefined();
       expect(global.fetch).toHaveBeenCalledTimes(1);

       // Second call immediately after should fail
       dateSpy!.mockReturnValue(10500);
       await expect(fetchWebSearch('req2', 1, 0)).rejects.toThrow(/Rate limit exceeded: > 1\/second/);
       expect(global.fetch).toHaveBeenCalledTimes(1); // Fetch not called again

       // Third call after > 1 second should succeed
       dateSpy!.mockReturnValue(11500);
       await expect(fetchWebSearch('req3', 1, 0)).resolves.toBeDefined();
       expect(global.fetch).toHaveBeenCalledTimes(2); // Fetch called again
     });
   });

});