<template>
  <div ref="editorDom" :class="{ editorDiv: true, hasError: state.containsError }"></div>
  <nav>
    <button @click="onFormatAsTree">Formatter en arbre</button>
    <button @click="onFormatAsLine">Formatter en ligne</button>
    <span class="query-error">{{ state.error }}</span>
  </nav>
</template>

<script setup lang="ts">
import { onMounted, ref, shallowRef, reactive } from 'vue'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import { formatAsSingleLine, formatAsTreeView } from '../utils/queryFormatter'
import validate from '../utils/svQueryValidate'
import { svQueryLang } from '../utils/svQueryLang'
import { svQueryTheme } from '../utils/svQueryTheme'

const props = defineProps({ modelValue: { type: String, required: true } })
const emit = defineEmits(['update:modelValue'])

const query = reactive({
  value: props.modelValue,
})

const state = reactive({
  isQueryCopied: false,
  isLinkCopied: false,
  containsError: false,
  error: '',
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const editorDom = ref<any>(null)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const editorInstance = shallowRef<any | null>(null)

function onFormatAsTree() {
  if (editorInstance.value) {
    const query = editorInstance.value.getValue().normalize('NFC')
    editorInstance.value.getModel().setValue(formatAsTreeView(query))
  }
}

function onFormatAsLine() {
  if (editorInstance.value) {
    const query = editorInstance.value.getValue().normalize('NFC')
    editorInstance.value.getModel().setValue(formatAsSingleLine(query))
  }
}

function checkForErrors() {
  if (editorInstance.value) {
    const markers = validate(editorInstance.value.getValue())

    monaco.editor.setModelMarkers(
      editorInstance.value.getModel(),
      'owner',
      markers.map((m) => ({
        ...m,
        severity: monaco.MarkerSeverity.Error,
      })),
    )

    state.containsError = markers.length > 0
    if (state.containsError) {
      state.error = (markers[0] || {}).message
    } else {
      state.error = ''
    }
  }
}

// define custom language for SV Queries
monaco.languages.register({ id: 'svQuery' })
monaco.languages.setMonarchTokensProvider('svQuery', svQueryLang)

monaco.languages.setLanguageConfiguration('svQuery', {
  brackets: [['(', ')']],
})

// Define a new theme that contains only rules that match our language
monaco.editor.defineTheme('svQueryTheme', svQueryTheme)

// Wait for the component to be mounted to create the instance
onMounted(() => {
  editorInstance.value = monaco.editor.create(editorDom.value, {
    language: 'svQuery',
    value: query.value,
    theme: 'svQueryTheme',
    wordWrap: 'on',
    lineNumbers: 'on',
    maxTokenizationLineLength: 50000,
    tabSize: 2,
    contextmenu: true,
    minimap: {
      enabled: false,
    },
    scrollBeyondLastLine: false,
    scrollbar: {
      alwaysConsumeMouseWheel: false,
    },
  })

  checkForErrors()

  // callback when changing the query
  editorInstance.value.getModel()?.onDidChangeContent(() => {
    const newValue = editorInstance.value.getValue().normalize('NFC')
    query.value = newValue
    emit('update:modelValue', newValue)

    checkForErrors()
  })
})
</script>

<style scoped>
nav {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
}

.editorDiv {
  width: 100%;
  height: 400px;
  margin-bottom: 16px;

  border: 3px solid white;
}

.editorDiv.hasError {
  border: 3px solid crimson;
}

.query-error {
  color: crimson;
  align-self: center;
}
</style>
