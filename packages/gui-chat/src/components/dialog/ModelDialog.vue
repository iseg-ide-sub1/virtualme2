<template>
  <div class="model-dialog">
    <div class="model-info">
      <div class="model-head">M</div>
      <div class="model-name">{{ dialog.title }}</div>
    </div>
    <div class="model-content">{{ dialog.content }}</div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
import type { ModelDialogItem } from '@/types';
defineProps<{ dialog: ModelDialogItem }>();
</script>

<style scoped>
.model-dialog {
  margin: 10px;
  padding: 10px;
  color: var(--vscode-foreground, #616161);
  background-color: rgba(128, 128, 128, 0.05);
  border-radius: 10px;
  border: 1px solid rgba(128, 128, 128, 0.1);
}

.model-dialog:hover {
  background-color: rgba(128, 128, 128, 0.1);
}

.model-info {
  position: relative;
  display: flex;
  align-items: center;
}

.model-head {
  width: 24px;
  height: 24px;
  color: white;
  border-radius: 50%;
  margin: 5px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: cornflowerblue;
}

.model-name {
  display: inline-block;
  max-width: calc(100vw - 150px);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.model-content {
  line-height: 1.6em;
  margin: 5px;
  overflow-x: auto;
  scrollbar-width: thin;
}
</style>