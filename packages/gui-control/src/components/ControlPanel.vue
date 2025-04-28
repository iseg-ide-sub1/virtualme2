<template>
  <div class="control-panel">

    <div class="control-div">
      <div class="form-radio">
        <div @click="setRecordStatus(true)" :class="{ checked: recording }">
          <FontAwesomeIcon :icon="faPlay" />
          <span>{{ $t('control.recording') }}</span>
        </div>
        <div @click="setRecordStatus(false)" :class="{ checked: !recording }">
          <FontAwesomeIcon :icon="faPause" />
          <span>{{ $t('control.pause') }}</span>
        </div>
      </div>
    </div>
    
    <p>{{ $t('control.saveNote') }}</p>
    <button @click="useSenderStore().saveLogs">
      {{ $t('control.saveLogs') }}
    </button>
    <div class="data-div">
      <span>{{ $t('control.logsNum') }}</span>
      <b class="data-log-num">{{ logNumber }}</b>
    </div>
    <div class="data-div">
      <span>{{ $t('control.logsPrev') }}</span>
      <b class="data-prev-log">{{ prevLog }}</b>
    </div>
  
  </div>
</template>

<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faPlay, faPause } from '@fortawesome/free-solid-svg-icons'
import { storeToRefs } from 'pinia'
import { useListenerStore } from '../stores/listener'
import { useSenderStore } from '@/stores/sender'
const listenerStore = useListenerStore()
const { recording, logNumber, prevLog } = storeToRefs(listenerStore)

function setRecordStatus(status: boolean) {
  if(status !== recording.value) {
    useSenderStore().setStatus(status)
  }
}
</script>

<style scoped>
.control-panel {
  margin: 20px;
}

.control-panel button {
  width: 70%;
  padding: 5px;
  margin: 20px 15%;
}

.control-div {
  margin-bottom: 20px;
}

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
  padding: 2px 8px;
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

.data-div {
  margin-top: 10px;
}

.data-log-num {
  font-size: 2em;
  color: var(--vscode-button-background, #705697);
}

.data-prev-log {
  font-size: 1.4em;
  color: var(--vscode-button-background, #705697);
}
</style>