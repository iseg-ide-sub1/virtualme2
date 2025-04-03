<template>
  <div class="popup-background" @click="popupDeleteModel"></div>
  <div class="div-popup">
    <div class="popup-title">Delete Model</div>
    <div class="popup-info">
      <p>
        Are you sure you want to delete this model?
        <b>{{ deleteModel?.name }}</b>
      </p>
    </div>
    <div class="div-sep"></div>
    <button @click="confirm">Yes</button>
    <button @click="cnacel">No</button>
  </div>
</template>

<script setup lang="ts">
import type { Model } from '@/types'
import { defineProps } from 'vue'
import { useSenderStore } from '@/stores/sender'

const props = defineProps<{
  deleteModel: Model | undefined,
  popupDeleteModel: () => void
}>();

function confirm() {
  const modelID = props.deleteModel?.id || '';
  useSenderStore().modelDelete(modelID)
  props.popupDeleteModel()
}

function cnacel() {
  props.popupDeleteModel()
}
</script>

<style scoped>
@import '../../assets/css/popup.css';

.div-sep {
  height: 10px;
}

button {
  padding: 6px;
  width: 36%;
  margin: auto 5px;
}
</style>