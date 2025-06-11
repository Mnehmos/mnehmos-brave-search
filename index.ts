#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { LOG_LEVEL } from './config.js'; // Import LOG_LEVEL
import {
  fetchWebSearch,
  fetchInitialLocalSearch,
  fetchPoiDetails,
  fetchPoiDescriptions,
  BraveApiError,
  BraveWeb,
  BravePoiResponse,
  BraveDescription
} from './apiClient.js';
import {
  ALL_TOOLS,
  isBraveWebSearchArgs,
  isBraveLocalSearchArgs,
  BraveWebSearchArgs,
  BraveLocalSearchArgs,
  isBravePoiDetailsArgs,
  isBravePoiDescriptionsArgs,
  BravePoiDetailsArgs,
  BravePoiDescriptionsArgs
} from './tools.js';

// Server Info
const SERVER_INFO = {
  name: "brave-search-mcp",
  version: "0.2.0", // Incremented version for refactor
};

// Server implementation - Export the server instance for testing
export const server = new Server(
  SERVER_INFO,
  {
    capabilities: {
      tools: {}, // Tools are dynamically listed
    },
  },
);

// --- Helper Functions (Refactored Search Logic) ---

function formatWebResults(data: BraveWeb): string {
  const results = (data.web?.results || []).map(result => ({
    title: result.title || 'N/A',
    description: result.description || 'N/A',
    url: result.url || 'N/A'
  }));

  if (results.length === 0) {
    return "No web results found.";
  }

  return results.map(r =>
    `Title: ${r.title}\nDescription: ${r.description}\nURL: ${r.url}`
  ).join('\n\n');
}

function formatLocalResults(poisData: BravePoiResponse, descData: BraveDescription): string {
  const results = poisData.results || [];
  if (results.length === 0) {
    return "No local results found.";
  }

  return results.map(poi => {
    const address = [
      poi.address?.streetAddress,
      poi.address?.addressLocality,
      poi.address?.addressRegion,
      poi.address?.postalCode
    ].filter(Boolean).join(', ') || 'N/A'; // Filter out empty parts

    return `Name: ${poi.name || 'N/A'}
Address: ${address}
Phone: ${poi.phone || 'N/A'}
Rating: ${poi.rating?.ratingValue ?? 'N/A'} (${poi.rating?.ratingCount ?? 0} reviews)
Price Range: ${poi.priceRange || 'N/A'}
Hours: ${(poi.openingHours || []).join(', ') || 'N/A'}
Description: ${descData.descriptions[poi.id] || 'No description available.'}
`; // Added trailing newline for clarity
  }).join('\n---\n');
}

async function performWebSearch(query: string, count: number = 10, offset: number = 0): Promise<string> {
  if (LOG_LEVEL === 'debug') {
    console.debug(`Performing web search: query="${query}", count=${count}, offset=${offset}`);
  }
  const data = await fetchWebSearch(query, count, offset);
  return formatWebResults(data);
}

// The delay function has been removed as it's no longer needed
// Our improved rate limiter in apiClient.ts now handles delays automatically

async function performLocalSearch(query: string, count: number = 5): Promise<string> {
  if (LOG_LEVEL === 'debug') {
    console.debug(`Performing local search: query="${query}", count=${count}`);
  }
  // Initial search to get location IDs
  const webData = await fetchInitialLocalSearch(query, count);
  const locationIds = webData.locations?.results
    ?.map(r => r.id)
    .filter((id): id is string => id != null) // Ensure IDs are strings and not null/undefined
    || [];

  if (locationIds.length === 0) {
    if (LOG_LEVEL === 'debug') {
        console.debug("No location IDs found, falling back to web search.");
    }
    // Fallback to web search if no specific locations found in initial query
    return performWebSearch(query, count);
  }

  if (LOG_LEVEL === 'debug') {
    console.debug(`Found location IDs: ${locationIds.join(', ')}. Fetching details...`);
  }

  // Get POI details and descriptions sequentially
  // No manual delays needed - the enhanced rate limiter in apiClient.ts handles this now
  try {
    const poisData = await fetchPoiDetails(locationIds);
    const descriptionsData = await fetchPoiDescriptions(locationIds);

    return formatLocalResults(poisData, descriptionsData);
  } catch (error) {
     console.error("Error fetching POI details/descriptions:", error);
     // Fallback to web search on error during detail fetching
     if (LOG_LEVEL === 'debug') {
        console.debug("Error fetching details, falling back to web search.");
     }
     return performWebSearch(query, count);
  }
}

async function performPoiDetails(ids: string[]): Promise<string> {
  if (LOG_LEVEL === 'debug') {
    console.debug(`Fetching POI details for IDs: ${ids.join(', ')}`);
  }
  
  if (ids.length === 0) {
    return "No IDs provided to fetch details.";
  }
  
  const poisData = await fetchPoiDetails(ids);
  return formatLocalResults(poisData, { descriptions: {} });
}

async function performPoiDescriptions(ids: string[]): Promise<string> {
  if (LOG_LEVEL === 'debug') {
    console.debug(`Fetching POI descriptions for IDs: ${ids.join(', ')}`);
  }
  
  if (ids.length === 0) {
    return "No IDs provided to fetch descriptions.";
  }
  
  const descriptionsData = await fetchPoiDescriptions(ids);
  
  if (Object.keys(descriptionsData.descriptions).length === 0) {
    return "No descriptions found for the provided IDs.";
  }
  
  return Object.entries(descriptionsData.descriptions)
    .map(([id, description]) => `ID: ${id}\nDescription: ${description}`)
    .join('\n\n');
}


// --- MCP Request Handlers ---

// Export handlers for testing
export const listToolsHandler = async () => ({
  tools: ALL_TOOLS, // Use imported tool list
}) // Remove trailing comma

export const callToolHandler = async (request: any) => { // Use 'any' for simplicity here, schema validation happens internally
  const { name, arguments: args } = request.params;
  if (LOG_LEVEL === 'debug') {
    console.debug(`Received CallToolRequest: tool=${name}, args=${JSON.stringify(args)}`);
  }

  try {
    // Removed explicit check for args to allow validators to handle missing or invalid arguments.

    let results: string;

    switch (name) {
      case "brave_web_search": {
        if (!isBraveWebSearchArgs(args)) {
          throw new Error(`Invalid arguments for tool "${name}". Expected: { query: string, count?: number, offset?: number }`);
        }
        const { query, count = 10, offset = 0 } = args; // Use defaults from tool definition
        results = await performWebSearch(query, count, offset);
        break;
      }

      case "brave_local_search": {
        if (!isBraveLocalSearchArgs(args)) {
          throw new Error(`Invalid arguments for tool "${name}". Expected: { query: string, count?: number }`);
        }
        const { query, count = 5 } = args; // Use defaults from tool definition
        results = await performLocalSearch(query, count);
        break;
      }

      case "brave_poi_details": {
        if (!isBravePoiDetailsArgs(args)) {
          throw new Error(`Invalid arguments for tool "${name}". Expected: { ids: string[] }`);
        }
        const { ids } = args;
        results = await performPoiDetails(ids);
        break;
      }

      case "brave_poi_descriptions": {
        if (!isBravePoiDescriptionsArgs(args)) {
          throw new Error(`Invalid arguments for tool "${name}". Expected: { ids: string[] }`);
        }
        const { ids } = args;
        results = await performPoiDescriptions(ids);
        break;
      }

      default:
        throw new Error(`Unknown tool requested: ${name}`);
    }

    if (LOG_LEVEL === 'debug') {
        console.debug(`Tool "${name}" executed successfully. Result length: ${results.length}`);
    }
    return {
      content: [{ type: "text", text: results }],
      isError: false,
    };

  } catch (error) {
    console.error(`Error executing tool "${name}":`, error);
    const errorMessage = error instanceof BraveApiError
      ? `Brave API Error (${error.status ?? 'N/A'}): ${error.message}${error.details ? ` - ${error.details}` : ''}`
      : `Internal Server Error: ${error instanceof Error ? error.message : String(error)}`;

    return {
      content: [{ type: "text", text: errorMessage }],
      isError: true,
    };
  }
};

// Register the exported handlers
server.setRequestHandler(ListToolsRequestSchema, listToolsHandler);
server.setRequestHandler(CallToolRequestSchema, callToolHandler);

// --- Server Startup ---

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Use console.error for startup messages as per convention for stdio servers
  console.error(`Brave Search MCP Server (${SERVER_INFO.name} v${SERVER_INFO.version}) running on stdio...`);
}

runServer().catch((error) => {
  console.error("FATAL ERROR: Failed to run Brave Search MCP Server:", error);
  process.exit(1);
});
