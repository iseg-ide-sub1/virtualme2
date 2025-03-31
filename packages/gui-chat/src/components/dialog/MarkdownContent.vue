<template>
  <div ref="renderNode">
    {{ content }}
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'
const props = defineProps<{ content: string }>()

</script>

<style scoped>
pre {
  position: relative;
}

code {
  font-size: 12px;
  overflow-y: auto;
  scrollbar-width: thin;
}

.code-info-div svg {
  margin: auto 4px;
  cursor: pointer;
}

.code-info-div {
  display: none;
  position: absolute;
  top: -10px;
  right: 10px;
  padding: 2px 5px;
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: 5px;
}

pre:hover .code-info-div {
  display: block;
}

#div-dialog ul,
#div-dialog ol {
  padding-left: 20px;
}
</style>