# SV Query Editor

A Vue 3 component library for editing SV Query syntax with Monaco Editor integration.

## Features

- **Monaco Editor Integration** : Full-featured code editor with syntax highlighting
- **SV Query Language Support** : Custom language definition with validation
- **Error Detection** : Real-time syntax validation with visual markers
- **Formatting Tools** : Tree view and single-line formatting options
- **TypeScript Support** : Fully typed with TypeScript declarations

## Installation

```bash
npm install sv-query-editor
```

## Peer Dependencies

This package requires the following peer dependencies:

```json
{
  "vue": "^3.5.18",
  "monaco-editor": "^0.52.2",
  "lucene": "^2.1.1"
}
```

## Usage

### Global Registration

```typescript
import { createApp } from 'vue'
import SVQueryEditor from 'sv-query-editor'

const app = createApp(App)
app.use(SVQueryEditor)
app.mount('#app')
```

### Component Import

```vue
<template>
  <div>
    <SVQueryEditor v-model="query" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { SVQueryEditor } from 'sv-query-editor'

const query = ref('author.name:Dupont AND themes:environnement')
</script>
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build library
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
```

## License

MIT
