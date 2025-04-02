<template>
  <div class="popup-background" @click="popupAddModel"></div>
  <div class="div-popup">
    <div class="popup-title">Add Model</div>
    <div class="popup-info">
      <p v-show="modelConfig.type === 'openai'">The model you provided needs to be compatible with the OpenAI API.</p>
      <p v-show="modelConfig.type === 'ollama'">Please confirm that you have installed Ollama locally and configured the corresponding model.</p>
    </div>
    <form ref="modelForm">
      <div class="form-radio">
        <div 
          @click="modelConfig.type = 'openai'"
          :class="{ checked: modelConfig.type === 'openai' }"
        >
          <FontAwesomeIcon :icon="faHexagonNodes" />
          <span>openai</span>
        </div>
        <div
          @click="modelConfig.type = 'ollama'"
          :class="{ checked: modelConfig.type === 'ollama' }"
        >
          <FontAwesomeIcon :icon="faCircleNodes" />
          <span>ollama</span>
        </div>
      </div>
      <div class="form-entry">
        <label for="i-model">*model</label>
        <input type="text" id="i-model" name="model" required
          v-model="modelConfig.model"
        >
      </div>
      <div class="form-entry">
        <label for="i-title">title</label>
        <input type="text" id="i-title" name="title"
          v-model="modelConfig.title"
        >
      </div>
      <div class="form-entry" v-if="modelConfig.type === 'openai'">
        <label for="i-base_url">*baseURL</label>
        <input type="text" id="i-base_url" name="base_url" required
          v-model="modelConfig.baseURL"
        >
      </div>
      <div class="form-entry" v-if="modelConfig.type === 'openai'">
        <label for="i-api_key">*apiKey</label>
        <input type="text" id="i-api_key" name="api_key" required
          v-model="modelConfig.apiKey"
        >
      </div>
      <div class="form-entry">
        <label for="i-system">system</label>
        <textarea id="i-system" name="system" rows="2" placeholder="system prompt"
          v-model="modelConfig.system"
        ></textarea>
      </div>
      <button @click="submit">Submit</button>
      <button @click="cancel">Cancel</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, toRaw, defineProps } from 'vue'
import type { ModelConfig } from '@/types'
import { useVsCodeApiStore } from '@/stores/vsCodeApi'

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faHexagonNodes, faCircleNodes } from '@fortawesome/free-solid-svg-icons'

const props = defineProps<{popupAddModel: () => void}>()
const modelForm = ref<HTMLFormElement>()

const modelConfig = ref<ModelConfig>({
  type: 'openai',
  model: '',
  title: '',
  baseURL: '',
  apiKey: '',
  system: ''
})

function submit() {
  if(!modelForm.value?.checkValidity()) return
  let rawModelConfig: ModelConfig = toRaw(modelConfig.value)
  if(rawModelConfig.type === 'ollama'){
    delete rawModelConfig.baseURL
    delete rawModelConfig.apiKey
  }
  if(rawModelConfig.title?.trim() === ''){
    delete rawModelConfig.title
  }
  if(rawModelConfig.system?.trim() === ''){
    delete rawModelConfig.system
  }
  useVsCodeApiStore().vscode?.postMessage({
    command: 'model.add',
    model: JSON.stringify(rawModelConfig)
  })
  modelForm.value?.reset()
  props.popupAddModel()
}

function cancel() {
  modelForm.value?.reset()
  props.popupAddModel()
}
</script>

<style scoped>
@import '../../assets/css/popup.css';

.form-radio {
  display: flex;
  justify-content: center;
}

.form-radio div {
  display: inline-block;
  border-radius: 5px;
  border: 1px solid transparent;
  line-height: 24px;
  cursor: pointer;
  margin: auto 10px;
  padding: 2px 4px;
}

.form-radio svg {
  padding-right: 2px;
}

.form-radio div:hover {
  color: var(--vscode-button-foreground, #ffffff);
  background-color: var(--vscode-button-hoverBackground, #5a4579);
}

.form-radio .checked {
  color: var(--vscode-button-foreground, #ffffff);
  background-color: var(--vscode-button-background, #705697);
}

.form-entry {
  margin: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

form label {
  display: inline-block;
  width: min(30%, 60px);
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
}

form input,
form textarea {
  display: inline-block;
  width: calc(90% - min(30%, 60px));
}

form textarea {
  overflow: auto;
  scrollbar-width: thin;
  resize: vertical;
  max-height: 30vh;
}

form button {
  padding: 6px;
  width: 36%;
  margin: auto 5px;
}
</style>