import { jest, describe, it, expect, beforeEach } from '@jest/globals'; // Import Jest globals for ESM

// Import types needed for mock function signatures
import type { BraveWeb, BravePoiResponse, BraveDescription } from '../apiClient.js';

// Mock the apiClient module - Ensure all functions used by index.ts are mocked with correct types
const mockFetchWebSearch = jest.fn<() => Promise<BraveWeb>>();
const mockFetchInitialLocalSearch = jest.fn<() => Promise<BraveWeb>>();
const mockFetchPoiDetails = jest.fn<() => Promise<BravePoiResponse>>();
const mockFetchPoiDescriptions = jest.fn<() => Promise<BraveDescription>>();
class MockBraveApiError extends Error {
    status?: number;
    details?: string;
    constructor(message: string, status?: number, details?: string) {
        super(message);
        this.name = 'BraveApiError';
        this.status = status;
        this.details = details;
    }
}

jest.mock('../apiClient.js', () => ({
  fetchWebSearch: mockFetchWebSearch,
  fetchInitialLocalSearch: mockFetchInitialLocalSearch,
  fetchPoiDetails: mockFetchPoiDetails,
  fetchPoiDescriptions: mockFetchPoiDescriptions,
  BraveApiError: MockBraveApiError,
  _resetRateLimiterForTest: jest.fn() // Mock the test helper too
}));

// Import after mocks are set up
// Import the *handlers* exported from index.ts, not the server instance
import { listToolsHandler, callToolHandler } from '../index.js';
import { ALL_TOOLS } from '../tools.js'; // Import actual tools for comparison
// SDK types might not be needed if we don't interact with server directly
// import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

describe('Brave Search MCP Server (index.ts)', () => {

  beforeEach(() => {
    // Reset mocks before each test
    mockFetchWebSearch.mockClear();
    mockFetchInitialLocalSearch.mockClear();
    mockFetchPoiDetails.mockClear();
    mockFetchPoiDescriptions.mockClear();
  });

  // --- ListTools Handler ---
  describe('ListTools Handler', () => {
    it('should return the list of available tools', async () => {
      // Call the exported handler directly
      const response = await listToolsHandler();
      // ListTools response doesn't have isError, just the tools array
      expect(response.tools).toEqual(ALL_TOOLS);
    });
  });

  // --- CallTool Handler ---
  describe('CallTool Handler', () => {
    it('should route to performWebSearch for brave_web_search tool', async () => {
      // Mock the underlying fetch function used by performWebSearch
      mockFetchWebSearch.mockResolvedValueOnce({ web: { results: [{ title: 'Web Result', url: 'url', description: 'desc' }] } });
      const request = {
        // method: 'callTool', // Not needed when calling handler directly
        params: { name: 'brave_web_search', arguments: { query: 'web test' } }
      };
      const response = await callToolHandler(request as any); // Execute the handler

      expect(response.isError).toBe(false); // Check response status
      // Check that the correct *mocked* function was called by the handler's internal logic
      expect(mockFetchWebSearch).toHaveBeenCalledTimes(1);
      expect(mockFetchWebSearch).toHaveBeenCalledWith('web test', 10, 0); // Check args and defaults
      expect(mockFetchInitialLocalSearch).not.toHaveBeenCalled();
    });

    it('should route to performLocalSearch for brave_local_search tool', async () => {
      // Mock the sequence: initial local search -> POI details -> POI descriptions
      mockFetchInitialLocalSearch.mockResolvedValueOnce({ locations: { results: [{ id: 'poi1' }] } });
      mockFetchPoiDetails.mockResolvedValueOnce({ results: [{ id: 'poi1', name: 'POI', address: {} }] });
      mockFetchPoiDescriptions.mockResolvedValueOnce({ descriptions: { 'poi1': 'Desc' } });

      const request = {
        // method: 'callTool',
        params: { name: 'brave_local_search', arguments: { query: 'local test', count: 3 } }
      };
      const response = await callToolHandler(request as any); // Execute the handler

      expect(response.isError).toBe(false); // Check response status
      expect(mockFetchInitialLocalSearch).toHaveBeenCalledTimes(1);
      expect(mockFetchInitialLocalSearch).toHaveBeenCalledWith('local test', 3); // Check args
      expect(mockFetchPoiDetails).toHaveBeenCalledTimes(1);
      expect(mockFetchPoiDetails).toHaveBeenCalledWith(['poi1']);
      expect(mockFetchPoiDescriptions).toHaveBeenCalledTimes(1);
      expect(mockFetchPoiDescriptions).toHaveBeenCalledWith(['poi1']);
      expect(mockFetchWebSearch).not.toHaveBeenCalled();
    });

     it('should handle local search fallback to web search if no location IDs found', async () => {
      mockFetchInitialLocalSearch.mockResolvedValueOnce({ locations: { results: [] } }); // No locations
      mockFetchWebSearch.mockResolvedValueOnce({ web: { results: [{ title: 'Fallback Web', url: 'url', description: 'desc' }] } });

      const request = {
        // method: 'callTool',
        params: { name: 'brave_local_search', arguments: { query: 'no locations here', count: 5 } }
      };
      const response = await callToolHandler(request as any); // Execute the handler

      expect(response.isError).toBe(false); // Check response status
      expect(mockFetchInitialLocalSearch).toHaveBeenCalledTimes(1);
      expect(mockFetchInitialLocalSearch).toHaveBeenCalledWith('no locations here', 5);
      expect(mockFetchPoiDetails).not.toHaveBeenCalled(); // Details not fetched
      expect(mockFetchPoiDescriptions).not.toHaveBeenCalled(); // Descriptions not fetched
      expect(mockFetchWebSearch).toHaveBeenCalledTimes(1); // Fallback called
      expect(mockFetchWebSearch).toHaveBeenCalledWith('no locations here', 5, 0); // Fallback uses original query/count
    });

    it('should return error for unknown tool name', async () => {
      const request = {
        // method: 'callTool',
        params: { name: 'unknown_tool', arguments: { query: 'test' } }
      };
      const response = await callToolHandler(request as any);
      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('Unknown tool requested: unknown_tool');
      expect(mockFetchWebSearch).not.toHaveBeenCalled();
      expect(mockFetchInitialLocalSearch).not.toHaveBeenCalled();
    });

    it('should return error for missing arguments', async () => {
       const request = {
        // method: 'callTool',
        params: { name: 'brave_web_search', arguments: undefined } // Missing args
      };
      const response = await callToolHandler(request as any);
      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('Tool arguments are required');
    });

     it('should return error for invalid web search arguments', async () => {
       const request = {
        // method: 'callTool',
        params: { name: 'brave_web_search', arguments: { count: 10 } } // Missing query
      };
      const response = await callToolHandler(request as any);
      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('Invalid arguments for tool "brave_web_search"');
    });

     it('should return error for invalid local search arguments', async () => {
       const request = {
        // method: 'callTool',
        params: { name: 'brave_local_search', arguments: { count: 5 } } // Missing query
      };
      const response = await callToolHandler(request as any);
      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('Invalid arguments for tool "brave_local_search"');
    });

    it('should return formatted error from BraveApiError', async () => {
      const apiError = new MockBraveApiError('API Failed', 401, 'Unauthorized: Bad Key');
      mockFetchWebSearch.mockRejectedValueOnce(apiError); // Mock the underlying fetch function to throw
       const request = {
        // method: 'callTool',
        params: { name: 'brave_web_search', arguments: { query: 'api error test' } }
      };
      const response = await callToolHandler(request as any);
      expect(response.isError).toBe(true);
      expect(response.content[0].text).toBe('Brave API Error (401): API Failed - Unauthorized: Bad Key');
    });

     it('should return formatted error from generic Error', async () => {
      const genericError = new Error('Something else went wrong');
      mockFetchInitialLocalSearch.mockRejectedValueOnce(genericError); // Mock the underlying fetch function to throw
       const request = {
        // method: 'callTool',
        params: { name: 'brave_local_search', arguments: { query: 'generic error test' } }
      };
      const response = await callToolHandler(request as any);
      expect(response.isError).toBe(true);
      expect(response.content[0].text).toBe('Internal Server Error: Something else went wrong');
    });

  });

  // TODO: Add tests for formatting functions if they become more complex
  // describe('Formatting Functions', () => {
  //   it.todo('formatWebResults should format data correctly');
  //   it.todo('formatLocalResults should format data correctly');
  // });
});