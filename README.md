# Brave Search MCP Server

A production-ready MCP server implementation that integrates the Brave Search API, providing web search, local business search, and Points of Interest (POI) capabilities.

> **Note**: This is an alternative implementation of the Brave Search MCP server. The original server was removed from the official MCP servers repository, but this version provides the same functionality with enhanced features and better environment variable support.

## Features

- **Web Search**: General queries, news, articles, with pagination and freshness controls
- **Local Search**: Find businesses, restaurants, and services with detailed information
- **Flexible Filtering**: Control result types, safety levels, and content freshness
- **Smart Fallbacks**: Local search automatically falls back to web when no results are found

## Available Tools

### 🌐 brave_web_search
Execute comprehensive web searches with advanced filtering and pagination support.

**Inputs:**
- `query` (string): Search terms (max 400 characters, 50 words)
- `count` (number, optional): Results per page (1-20, default: 10)
- `offset` (number, optional): Pagination offset (0-9, default: 0)

**Best for:** General queries, news articles, research, recent events, and diverse web content.

### 📍 brave_local_search
Find local businesses, restaurants, and services with detailed information.

**Inputs:**
- `query` (string): Local search terms (e.g., "pizza near Central Park")
- `count` (number, optional): Number of results (1-20, default: 5)

**Returns:** Business names, addresses, ratings, review counts, phone numbers, opening hours.
**Automatic Fallback:** Falls back to web search if no local results are found.

### 🏢 brave_poi_details
Fetch comprehensive details for specific Points of Interest using their IDs.

**Inputs:**
- `ids` (array): List of Brave Place IDs to fetch details for

### 📝 brave_poi_descriptions
Get rich descriptions for Points of Interest using their IDs.

**Inputs:**
- `ids` (array): List of Brave Place IDs to fetch descriptions for


## Setup & Configuration

### 1. Get Your Brave Search API Key
1. Sign up for a [Brave Search API account](https://brave.com/search/api/)
2. Choose a plan (Free tier: 2,000 queries/month)
3. Generate your API key from the [developer dashboard](https://api.search.brave.com/app/keys)

### 2. Configure Environment Variables
Create or update your `.env` file in the server directory:

```env
# Brave Search MCP Server Configuration
# Get your free API key from: https://api.search.brave.com/app/keys
BRAVE_API_KEY=your_actual_brave_search_api_key_here

# Optional: Logging level (debug, info, warn, error)
LOG_LEVEL=info
```

⚠️ **Important**: Replace `your_actual_brave_search_api_key_here` with your real API key.

### 3. Kilocode Integration

#### For Kilocode Users
The server will automatically load your API key from the `.env` file. Your MCP settings should look like:

```json
{
  "mcpServers": {
    "brave-search": {
      "name": "brave-search-mcp",
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "path/to/your/brave-search-mcp/",
      "enabled": true,
      "alwaysAllow": [
        "brave_web_search",
        "brave_local_search",
        "brave_poi_details",
        "brave_poi_descriptions"
      ]
    }
  }
}
```

#### For Claude Desktop
Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "brave-search": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "path/to/your/brave-search-server"
    }
  }
}
```

### 4. Security Best Practices
- ✅ **DO**: Keep your `.env` file private and never commit it to version control
- ✅ **DO**: Add `.env` to your `.gitignore` file
- ✅ **DO**: Use environment-specific `.env` files (`.env.local`, `.env.production`)
- ❌ **DON'T**: Share your API key or include it in configuration files
- ❌ **DON'T**: Use production API keys in development environments

## Installation & Build

### Install Dependencies
```bash
npm install
```

### Build the Server
```bash
npm run build
```

### Development Mode
```bash
npm run dev
```

## Troubleshooting

### Common Issues

#### ❌ "API Key Not Found" Error
**Solution:** Ensure your `.env` file contains a valid `BRAVE_API_KEY` and is in the correct directory.

```bash
# Check if .env file exists and contains the key
cat .env | grep BRAVE_API_KEY
```

#### ❌ "Module Not Found" Errors
**Solution:** Make sure dependencies are installed and the server is built:

```bash
npm install
npm run build
```

#### ❌ "Connection Refused" in Kilocode
**Solutions:**
1. Verify the `cwd` path in your MCP settings points to the correct directory
2. Ensure the server is built: `npm run build`
3. Check that `dist/index.js` exists in your server directory

#### ❌ Empty Search Results
**Potential causes:**
- API rate limit exceeded (2,000 queries/month on free tier)
- Invalid API key
- Network connectivity issues

**Debug steps:**
```bash
# Set logging level to debug in .env
LOG_LEVEL=debug

# Check server logs for detailed error information
```

### Kilocode-Specific Configuration

Your MCP settings in Kilocode should match this pattern:

```json
{
  "mcpServers": {
    "brave-search": {
      "name": "brave-search-mcp",
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "C:/path/to/your/brave-search-mcp/",
      "enabled": true,
      "alwaysAllow": [
        "brave_web_search",
        "brave_local_search",
        "brave_poi_details",
        "brave_poi_descriptions"
      ]
    }
  }
}
```

## API Rate Limits & Usage

| Plan | Monthly Queries | Rate Limit |
|------|----------------|------------|
| Free | 2,000 | 1/second |
| Basic | 50,000 | 10/second |
| Pro | 200,000 | 40/second |
| Enterprise | Custom | Custom |

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## Support

- 🐛 **Issues**: Report bugs or request features via GitHub Issues
- 💬 **Discord**: Join the Kilocode community for support
- 📖 **Docs**: Check the [Brave Search API Documentation](https://brave.com/search/api/)

## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository.
