<template>
  <div class="input-box">
    <InputUpper />
    <textarea rows="1" placeholder="Ask something..." ref="taInput"></textarea>
    <InputLower 
      :models="models"
      :modelID = "modelID"
      :modelName = "modelName"
    />
  </div>
</template>

<script setup lang="ts">
import autosize from 'autosize'
import { ref, computed, onMounted } from 'vue'
import type { Model } from '@/types'
import { useVsCodeApiStore } from '@/stores/vsCodeApi'
import InputUpper from './input/InputUpper.vue'
import InputLower from './input/InputLower.vue'

const models = ref<Model[]>([])
const modelID = ref<string>('')
const modelName = computed(() => {
  const findModel = models.value.find(model => model.id === modelID.value)
  if (findModel) {
    return findModel.name
  } else {
    return 'Select Model'
  }
})

const taInput = ref<HTMLTextAreaElement>()
const vscode = useVsCodeApiStore().vscode

window.addEventListener('message', event => {
  const message = event.data;
  console.log(JSON.stringify(message))
  switch (message.command) {
    case 'models.update':
      models.value = JSON.parse(message.models);
      modelID.value = message.modelID;
      break;
    case 'modelID.updated':
      modelID.value = message.modelID;
      console.log(modelID.value)
      break;
  }
});

onMounted(() => {
  if (taInput.value) {
    autosize(taInput.value);
  }
})
</script>

<style scoped>
.input-box {
  margin: 10px;
  padding: 10px;
  border-radius: 5px;
  border: 1px solid rgba(128, 128, 128, 0.4);
  background-color: var(--vscode-input-background, #ffffff);
}

.input-box:focus-within {
  border: 1px solid var(--vscode-button-hoverBackground, #5a4579);
}

textarea {
  width: 100%;
  max-height: 40vh;
  font-size: 13px;
  line-height: 1.5em;
  overflow-x: auto !important;
  scrollbar-width: thin;
  padding: 5px;
  box-sizing: border-box;
  color: var(--vscode-input-foreground, #616161);
  resize: none;
  border: none;
}

textarea:focus {
  outline: none;
}
</style>