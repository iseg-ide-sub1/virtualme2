<template>
  <div class="input-lower">
    <div class="dropup-box">
      <div class="dropup-option">
        <ul class="dropup-list">
          <li
            v-for="model in models"
            :key="model.id"
            :class="{selected: model.id === modelID}"
            @click="changeModelID(model.id)"
          >
            <FontAwesomeIcon :icon="getSvgIcon(model.type)" />
            <span>{{ model.name }}</span>
          </li>
        </ul>
        <div class="extra-option">
          <FontAwesomeIcon :icon="faPlus" />
          <span>Add Model</span>
        </div>
        <div class="extra-option">
          <FontAwesomeIcon :icon="faRotateRight" />
          <span>Load Config</span>
        </div>
      </div>
      <div>
        <span>{{ modelName }}</span>
        <FontAwesomeIcon :icon="faChevronDown" />
      </div>
    </div>
    <div class="send-prompt">
      <span>Ctrl+Enter</span>
      <FontAwesomeIcon :icon="faArrowRight" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'
import type { Model } from '@/types'

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faHexagonNodes, faCircleNodes } from '@fortawesome/free-solid-svg-icons'
import { faPlus, faRotateRight } from '@fortawesome/free-solid-svg-icons'
import { faChevronDown, faArrowRight } from '@fortawesome/free-solid-svg-icons'

defineProps<{
  models: Model[],
  modelID: string,
  modelName: string,
  changeModelID: (newID: string) => void
}>()

function getSvgIcon(modelType: string){
  if(modelType === 'ollama'){
    return faCircleNodes;
  }
  return faHexagonNodes;
}
</script>

<style scoped>
@import '../../assets/dropup.css';

.input-lower {
  display: flex;
  margin: auto 5px;
  color: var(--vscode-disabledForeground, rgba(97, 97, 97, 0.5));
  align-items: center;
  justify-content: space-between;
  /* border: 1px solid black; */
}

li svg {
  margin-right: 2px;
}

span+svg {
  margin-left: 5px;
}

.extra-option {
  width: auto;
  white-space: nowrap;
  padding: 6px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  border-top: 1px solid rgba(128, 128, 128, 0.2);
}

.extra-option:hover {
  background-color: rgba(128, 128, 128, 0.15);
}

.send-prompt {
  user-select: none;
  cursor: pointer;
}

.send-prompt:hover {
  color: var(--vscode-foreground, #616161);
}
</style>