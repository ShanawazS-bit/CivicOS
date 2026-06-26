# Apple News Format (ANF) Architecture Specification
## Reference Identifier: APPLE_NEWS_FORMAT.md
## Format Type: Native Editorial Document Schema (JSON Base Architecture)
## Target Platforms: iOS, iPadOS, macOS, visionOS

---

## 1. Document Root Specification (`article.json`)

Every valid ANF compilation must structure its entry point as a unified JSON package containing core configuration primitives, styling templates, and structural arrays.

```json
{
  "version": "1.27.0",
  "identifier": "unique-publisher-article-id-001",
  "title": "Article Title Heading",
  "language": "en-US",
  "layout": {
    "columns": 20,
    "width": 1024,
    "gutter": 20,
    "margin": 60
  },
  "componentTextStyles": {
    "default": {
      "fontFamily": "system",
      "fontSize": 16,
      "fontStyle": "normal",
      "fontWeight": "normal",
      "textColor": "#111111"
    }
  },
  "components": []
}