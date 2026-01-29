<template>
  <div class="sv-query-editor">
    <div
      ref="monacoEditorDom"
      :class="{
        'sv-query-editor__monaco-editor': true,
        'sv-query-editor__monaco-editor--has-error': state.containsError,
      }"
    ></div>
    <nav class="sv-query-editor__nav">
      <button class="sv-query-editor__button" @click="onFormatAsTree">Formatter en arbre</button>
      <button class="sv-query-editor__button" @click="onFormatAsLine">Formatter en ligne</button>
      <span class="sv-query-editor__error">{{ state.error }}</span>
    </nav>
  </div>
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
const monacoEditorDom = ref<any>(null)
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
  editorInstance.value = monaco.editor.create(monacoEditorDom.value, {
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

<style>
.sv-query-editor {
  --sv-editor-current-line-bg: #c1bebe;
  --sv-editor-margin-bg: #f8f9fa;
  --sv-editor-line-numbers: #999999;
  --sv-editor-background: #f5f5f5;
  --sv-editor-border: #e1e1e1;
  --sv-editor-error: crimson;
  --sv-editor-button-primary: rgb(52, 54, 100);
  --sv-editor-button-hover: rgba(52, 54, 100, 0.9);
  --sv-editor-button-active: rgba(52, 54, 100, 0.8);
}

.sv-query-editor__nav {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
  align-items: center;
}

.sv-query-editor__button {
  background-color: var(--sv-editor-button-primary);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 0.95em;
  border-radius: 30px;
  padding: 8px 15px;
  transition: background-color 0.2s ease;
}

.sv-query-editor__button:hover {
  background-color: var(--sv-editor-button-hover);
}

.sv-query-editor__button:active {
  background-color: var(--sv-editor-button-active);
}

.sv-query-editor__error {
  color: var(--sv-editor-error);
  align-self: center;
}

.sv-query-editor__monaco-editor {
  height: 400px;
  margin-bottom: 16px;
  border: 3px solid var(--sv-editor-border);
}

.sv-query-editor__monaco-editor--has-error {
  border: 3px solid var(--sv-editor-error);
}

.sv-query-editor__monaco-editor .margin {
  background-color: var(--sv-editor-margin-bg);
}

.sv-query-editor__monaco-editor .line-numbers {
  color: var(--sv-editor-line-numbers);
}

.sv-query-editor__monaco-editor .current-line {
  background-color: var(--sv-editor-current-line-bg);
}

.monaco-editor-background {
  background-color: var(--sv-editor-background);
}
</style>
