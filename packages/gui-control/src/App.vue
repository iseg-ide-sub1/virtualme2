<template>
  <vscode-tabs selected-index="0">
    <vscode-tab-header slot="header">{{ $t('Control') }}</vscode-tab-header>
    <vscode-tab-panel>
      <ControlPanel/>
    </vscode-tab-panel>
    <vscode-tab-header slot="header">{{ $t('Prediction') }}</vscode-tab-header>
    <vscode-tab-panel>
      <PredictionPanel/>
    </vscode-tab-panel>
  </vscode-tabs>
</template>

<script setup lang="ts">
import ControlPanel from './components/ControlPanel.vue'
import PredictionPanel from './components/PredictionPanel.vue'
import { useSenderStore } from './stores/sender'
import { onMounted } from 'vue'

onMounted(() => {
  useSenderStore().initReady()
})
</script>
