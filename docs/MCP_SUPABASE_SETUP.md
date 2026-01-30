# Supabase MCP Server Configuration

This guide explains how to configure the Supabase MCP server for Cursor to enable direct database access and operations.

## Configuration

The Supabase MCP server has been added to `.mcp.json` with the new project ID:

```json
{
  "supabase": {
    "url": "https://mcp.supabase.com/mcp?project_ref=grfjmnjpzvknmsxrwesx",
    "description": "Supabase MCP Server - Provides direct access to Supabase project grfjmnjpzvknmsxrwesx",
    "alwaysAllow": []
  }
}
```

## Setting Up in Cursor

### Method 1: Cursor Settings (Recommended)

1. Open Cursor Settings:
   - **macOS**: `Cmd + ,` or `Cursor` → `Settings`
   - **Windows/Linux**: `Ctrl + ,` or `File` → `Preferences` → `Settings`

2. Search for "MCP" or "Model Context Protocol"

3. Add the Supabase MCP server configuration:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=grfjmnjpzvknmsxrwesx"
    }
  }
}
```

### Method 2: Cursor Settings JSON

1. Open Command Palette: `Cmd/Ctrl + Shift + P`
2. Type "Preferences: Open User Settings (JSON)"
3. Add the configuration to your settings:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=grfjmnjpzvknmsxrwesx"
    }
  }
}
```

## What This Enables

With the Supabase MCP server configured, Cursor AI can:

- ✅ Query database tables directly
- ✅ View schema and table structures
- ✅ Run SQL queries safely
- ✅ Understand database relationships
- ✅ Help with database migrations
- ✅ Provide better code suggestions based on actual schema

## Verification

After configuration, you can verify the MCP server is working by:

1. Asking Cursor to list tables: "What tables exist in the Supabase database?"
2. Asking about schema: "Show me the schema for the users table"
3. Requesting a query: "Query the users table and show me the structure"

## Troubleshooting

### MCP Server Not Connecting

1. **Check Project Reference**: Verify `grfjmnjpzvknmsxrwesx` is correct
2. **Check Network**: Ensure you can access `https://mcp.supabase.com`
3. **Restart Cursor**: Sometimes a restart is needed after MCP configuration changes

### Authentication Issues

The MCP server uses your Supabase project reference. If you encounter authentication issues:

1. Verify the project ID is correct
2. Check that the project is active in Supabase dashboard
3. Ensure you have access to the project

### Alternative: Use Supabase CLI MCP

If the URL-based MCP server doesn't work, you can use the Supabase CLI MCP server:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server"],
      "env": {
        "SUPABASE_PROJECT_REF": "grfjmnjpzvknmsxrwesx",
        "SUPABASE_ACCESS_TOKEN": "your_access_token"
      }
    }
  }
}
```

## Project Reference

- **Current Project ID**: `grfjmnjpzvknmsxrwesx`
- **Project URL**: `https://grfjmnjpzvknmsxrwesx.supabase.co`
- **MCP Endpoint**: `https://mcp.supabase.com/mcp?project_ref=grfjmnjpzvknmsxrwesx`

## Related Documentation

- [Supabase Migration Guide](./SUPABASE_MIGRATION.md)
- [Migration Steps](./MIGRATION_STEPS.md)
- [Database Setup](./DATABASE_SETUP.md)
