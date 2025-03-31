<template>
  <div class="user-dialog">
    <div class="user-info">
      <div class="user-head">U</div>
      <div class="user-name">User</div>
    </div>
    <div class="user-content">{{ dialog.content }}</div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
import type { UserDialogItem } from '@/types';
defineProps<{ dialog: UserDialogItem }>();
</script>

<style scoped>
.user-dialog {
  margin: 10px;
  padding: 10px;
  color: var(--vscode-foreground, #616161);
  background-color: rgba(128, 128, 128, 0.05);
  border-radius: 10px;
  border: 1px solid rgba(128, 128, 128, 0.1);
}

.user-dialog:hover {
  background-color: rgba(128, 128, 128, 0.1);
}

.user-info {
  position: relative;
  display: flex;
  align-items: center;
}

.user-head {
  width: 24px;
  height: 24px;
  color: white;
  border-radius: 50%;
  margin: 5px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: blueviolet;
}

.user-name {
  display: inline-block;
}

.user-content {
  line-height: 1.6em;
  margin: 5px;
  overflow-x: auto;
  scrollbar-width: thin;
}
</style>