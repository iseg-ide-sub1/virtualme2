<template>
  <div class="model-dialog">
    <div class="model-info">
      <div class="model-head">
        <FontAwesomeIcon :icon="getHeadIcon()" />
      </div>
      <div class="model-name">{{ dialog.name }}</div>
    </div>
    <div class="model-content">
      <div class="reasoning-content">
        <MarkdownContent :content="reasoning" />
      </div>
      <MarkdownContent :content="content" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, computed } from 'vue'
import MarkdownContent from './MarkdownContent.vue'
import type { ModelDialogItem } from '@/types'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faHexagonNodes, faCircleNodes, faLightbulb } from '@fortawesome/free-solid-svg-icons'
const props = defineProps<{ dialog: ModelDialogItem }>()

let reasoning = computed(() => {
  if(props.dialog.content.startsWith('<think>')){
    const pos = props.dialog.content.indexOf('</think>')
    if(pos < 0) return props.dialog.content.substring(7);
    else return props.dialog.content.substring(7, pos);
  }
  else return ''
})
let content = computed(() => {
  if(props.dialog.content.startsWith('<think>')){
    const pos = props.dialog.content.indexOf('</think>')
    if(pos < 0) return '';
    else return props.dialog.content.substring(pos + 8);
  }
  else return props.dialog.content
})

function getHeadIcon() {
  if (props.dialog.type === 'ollama') {
    return faCircleNodes
  }
  else if (props.dialog.type === 'openai') {
    return faHexagonNodes
  }
  return faLightbulb
}
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
}

.reasoning-content {
  margin: 10px 5px;
  padding: 10px;
  border-radius: 10px;
  background-color: rgba(128, 128, 128, 0.05);
  border-left: 5px solid rgba(128, 128, 128, 0.5);
}

.reasoning-content:hover {
  background-color: rgba(128, 128, 128, 0.1);
}
</style>