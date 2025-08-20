<template>
  <div id="app">
    <h1>SV Query Editor</h1>

    <SVQueryEditor v-model="query" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SVQueryEditor from './components/SVQueryEditor.vue'

const query = ref('author.name:Dupont AND themes:environnement')
</script>

<style>
#app {
  margin: 16px;
}
</style>
