import { Tool } from "@modelcontextprotocol/sdk/types.js";

// --- Tool Definitions ---

export const WEB_SEARCH_TOOL: Tool = {
  name: "brave_web_search",
  description:
    "Performs a web search using the Brave Search API, ideal for general queries, news, articles, and online content. " +
    "Use this for broad information gathering, recent events, or when you need diverse web sources. " +
    "Supports pagination, content filtering, and freshness controls. " +
    "Maximum 20 results per request, with offset for pagination. ",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query (max 400 chars, 50 words)"
      },
      count: {
        type: "number",
        description: "Number of results (1-20, default 10)",
        default: 10
      },
      offset: {
        type: "number",
        description: "Pagination offset (0-9, default 0)", // Corrected max based on API docs
        default: 0,
        minimum: 0,
        maximum: 9,
      },
    },
    required: ["query"],
  },
};

export const LOCAL_SEARCH_TOOL: Tool = {
  name: "brave_local_search",
  description:
    "Searches for local businesses and places using Brave's Local Search API. " +
    "Best for queries related to physical locations, businesses, restaurants, services, etc. " +
    "Returns detailed information including:\n" +
    "- Business names and addresses\n" +
    "- Ratings and review counts\n" +
    "- Phone numbers and opening hours\n" +
    "Use this when the query implies 'near me' or mentions specific locations. " +
    "Automatically falls back to web search if no local results are found.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Local search query (e.g. 'pizza near Central Park')"
      },
      count: {
        type: "number",
        description: "Number of results (1-20, default 5)",
        default: 5,
        minimum: 1,
        maximum: 20,
      },
    },
    required: ["query"]
  }
};

export const BRAVE_POI_DETAILS_TOOL: Tool = {
  name: "brave_poi_details",
  description:
    "Fetches detailed information for a list of Points of Interest (POIs) using their IDs.",
  inputSchema: {
    type: "object",
    properties: {
      ids: {
        type: "array",
        items: {
          type: "string"
        },
        description: "An array of Brave Place IDs for which to fetch details."
      }
    },
    required: ["ids"]
  }
};

export const BRAVE_POI_DESCRIPTIONS_TOOL: Tool = {
  name: "brave_poi_descriptions",
  description:
    "Fetches descriptions for a list of Points of Interest (POIs) using their IDs.",
  inputSchema: {
    type: "object",
    properties: {
      ids: {
        type: "array",
        items: {
          type: "string"
        },
        description: "An array of Brave Place IDs for which to fetch descriptions."
      }
    },
    required: ["ids"]
  }
};

export const ALL_TOOLS = [WEB_SEARCH_TOOL, LOCAL_SEARCH_TOOL, BRAVE_POI_DETAILS_TOOL, BRAVE_POI_DESCRIPTIONS_TOOL];

// --- Type Guards for Tool Arguments ---

export interface BraveWebSearchArgs {
  query: string;
  count?: number;
  offset?: number;
}

export interface BraveLocalSearchArgs {
  query: string;
  count?: number;
}

export interface BravePoiDetailsArgs {
  ids: string[];
}

export interface BravePoiDescriptionsArgs {
  ids: string[];
}

export function isBraveWebSearchArgs(args: unknown): args is BraveWebSearchArgs {
  // Check required fields first, then optional fields with proper grouping
  return (
    typeof args === "object" &&
    args !== null &&
    "query" in args &&
    typeof (args as BraveWebSearchArgs).query === "string" &&
    // Ensure count is either undefined or a number
    ((args as BraveWebSearchArgs).count === undefined || typeof (args as BraveWebSearchArgs).count === 'number') &&
    // Ensure offset is either undefined or a number
    ((args as BraveWebSearchArgs).offset === undefined || typeof (args as BraveWebSearchArgs).offset === 'number')
  );
}

export function isBraveLocalSearchArgs(args: unknown): args is BraveLocalSearchArgs {
  // Check required fields first, then optional fields with proper grouping
  return (
    typeof args === "object" &&
    args !== null &&
    "query" in args &&
    typeof (args as BraveLocalSearchArgs).query === "string" &&
    // Ensure count is either undefined or a number
    ((args as BraveLocalSearchArgs).count === undefined || typeof (args as BraveLocalSearchArgs).count === 'number')
  );
}

export function isBravePoiDetailsArgs(args: unknown): args is BravePoiDetailsArgs {
  return (
    typeof args === "object" &&
    args !== null &&
    "ids" in args &&
    Array.isArray((args as BravePoiDetailsArgs).ids) &&
    (args as BravePoiDetailsArgs).ids.every(id => typeof id === 'string')
  );
}

export function isBravePoiDescriptionsArgs(args: unknown): args is BravePoiDescriptionsArgs {
  return (
    typeof args === "object" &&
    args !== null &&
    "ids" in args &&
    Array.isArray((args as BravePoiDescriptionsArgs).ids) &&
    (args as BravePoiDescriptionsArgs).ids.every(id => typeof id === 'string')
  );
}