<template>
  <div class="dialog-box">
    <div v-for="dialog in dialogs" :key="dialog.id" class="dialog-item">
      <ModelDialog v-if="'name' in dialog" :dialog="dialog" />
      <UserDialog v-else :dialog="dialog" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import type { DialogItem, Model } from '@/types'
import UserDialog from './dialog/UserDialog.vue'
import ModelDialog from './dialog/ModelDialog.vue'
const dialogs = reactive<DialogItem[]>([
  {
    id: 'u-01',
    content: 'Who are you?'
  },
  {
    id: 'm-01',
    content: 'I am Qwen, a large language model developed by Alibaba Cloud. I can help with a wide range of tasks, from answering questions and providing information to helping with writing and more. How can I assist you today?',
    type: 'ollama',
    name: 'qwen-2.5'
  },
  {
    id: 'u-02',
    content: 'Who are you?'
  },
  {
    id: 'm-02',
    content: 'I am qwen-max, a large language model developed by Alibaba Cloud. I can help with a wide range of tasks, from answering questions and providing information to helping with writing and more. How can I assist you today?',
    type: 'openai',
    name: 'qwen-max'
  },
  {
    id: 'u-03',
    content: 'Who are you?'
  },
  {
    id: 'm-03',
    content: 'I am qwen, a large language model developed by Alibaba Cloud. I can help with a wide range of tasks, from answering questions and providing information to helping with writing and more. How can I assist you today?',
    type: 'ollama',
    name: 'qwen-2.5'
  },
  {
    id: 'u-04',
    content: 'Who are you?'
  },
  {
    id: 'm-04',
    content: 'I am QwQ, a large language model developed by Alibaba Cloud. I can help with a wide range of tasks, from answering questions and providing information to helping with writing and more. How can I assist you today?',
    type: 'openai',
    name: 'qwq-32b'
  }
]);
</script>

<style scoped>
.dailog-box {
  overflow-y: auto;
  scrollbar-width: thin;
}
</style>