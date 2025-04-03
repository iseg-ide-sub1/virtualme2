<template>
  <div class="dialog-box">
    <div v-for="dialog in dialogs" :key="dialog.id" class="dialog-item">
      <ModelDialog v-if="'name' in dialog" :dialog="dialog" />
      <UserDialog v-else :dialog="dialog" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useListenerStore } from '../stores/listener'
import UserDialog from './dialog/UserDialog.vue'
import ModelDialog from './dialog/ModelDialog.vue'

const listenerStore = useListenerStore()
const { dialogs } = storeToRefs(listenerStore)
</script>

<style scoped>
.dailog-box {
  overflow-y: auto;
  scrollbar-width: thin;
}
</style>