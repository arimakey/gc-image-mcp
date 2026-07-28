# Gemini MCP Server

Servidor MCP para la API de Google Gemini. Generación de texto, imágenes y contenido multimodal.

## Instalación

```bash
npm install -g gemini-image-mcp
```

## Uso con npx

```bash
GEMINI_API_KEY=tu-api-key npx gemini-image-mcp
```

## Herramientas

| Herramienta | Descripción |
|---|---|
| `gemini_generate_text` | Genera texto usando Gemini (flash, pro, lite) |
| `gemini_generate_image` | Genera imágenes a partir de texto |
| `gemini_generate_mixed` | Genera texto con imágenes intercaladas |
| `gemini_list_models` | Lista los modelos Gemini disponibles |

## Configuración en opencode.json

```json
{
  "mcp": {
    "gemini": {
      "type": "local",
      "command": ["npx", "-y", "gemini-image-mcp"],
      "env": {
        "GEMINI_API_KEY": "tu-api-key"
      }
    }
  }
}
```

## Licencia

MIT
