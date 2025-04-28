<template>
  <vscode-tabs selected-index="0">
    <vscode-tab-header slot="header">Control</vscode-tab-header>
    <vscode-tab-panel>
      <ControlPanel/>
    </vscode-tab-panel>
    <vscode-tab-header slot="header">Prediction</vscode-tab-header>
    <vscode-tab-panel>
      <PredictionPanel/>
    </vscode-tab-panel>
  </vscode-tabs>
</template>

<script setup lang="ts">
import ControlPanel from './components/ControlPanel.vue'
import PredictionPanel from './components/PredictionPanel.vue'
</script>

