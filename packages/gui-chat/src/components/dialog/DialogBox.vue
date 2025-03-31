<template>
  <div class="dialog-box">
    <div v-for="dialog in dialogs" :key="dialog.id" class="dialog-item">
      <ModelDialog v-if="'title' in dialog" :dialog="dialog" />
      <UserDialog v-else :dialog="dialog" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import type { DialogItem } from '@/types';
import UserDialog from './UserDialog.vue';
import ModelDialog from './ModelDialog.vue';
const dialogs: DialogItem[] = reactive([
  {
    id: 'u-01',
    content: 'Who are you?'
  },
  {
    id: 'm-01',
    content: 'I am Qwen, a large language model developed by Alibaba Cloud. I can help with a wide range of tasks, from answering questions and providing information to helping with writing and more. How can I assist you today?',
    model: 'qwen-2.5',
    title: 'qwen-2.5(ollama)'
  },
  {
    id: 'u-02',
    content: 'Who are you?'
  },
  {
    id: 'm-02',
    content: 'I am Qwen, a large language model developed by Alibaba Cloud. I can help with a wide range of tasks, from answering questions and providing information to helping with writing and more. How can I assist you today?',
    model: 'qwen-2.5',
    title: 'qwen-2.5(ollama)'
  },
  {
    id: 'u-03',
    content: 'Who are you?'
  },
  {
    id: 'm-03',
    content: 'I am Qwen, a large language model developed by Alibaba Cloud. I can help with a wide range of tasks, from answering questions and providing information to helping with writing and more. How can I assist you today?',
    model: 'qwen-2.5',
    title: 'qwen-2.5(ollama)'
  },
  {
    id: 'u-04',
    content: 'Who are you?'
  },
  {
    id: 'm-04',
    content: 'I am Qwen, a large language model developed by Alibaba Cloud. I can help with a wide range of tasks, from answering questions and providing information to helping with writing and more. How can I assist you today?',
    model: 'qwen-2.5',
    title: 'qwen-2.5(ollama)'
  }
]);
</script>

<style scoped>
.dailog-box {
  overflow-y: auto;
  scrollbar-width: thin;
}
</style>