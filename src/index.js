#!/usr/bin/env node
import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { tools } from "./tools.js";

const server = new McpServer({
  name: "gemini-mcp",
  version: "1.0.0",
  description: "Servidor MCP para la API de Google Gemini: generación de texto, imágenes y contenido multimodal.",
});

for (const tool of tools) {
  server.tool(tool.name, tool.description, tool.schema, tool.handler);
}

const transport = new StdioServerTransport();
await server.connect(transport);
