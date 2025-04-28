<template>
  <div class="control-panel">
    <div class="control-div">
      <div class="form-radio">
        <div @click="recording = !recording" :class="{ checked: recording }">
          <FontAwesomeIcon :icon="faPlay" />
          <span>正在记录</span>
        </div>
        <div @click="recording = !recording" :class="{ checked: !recording }">
          <FontAwesomeIcon :icon="faPause" />
          <span>暂停记录</span>
        </div>
      </div>
    </div>
    <p>插件会在 VS Code 关闭时自动保存缓存的记录，也可以通过下面的按钮手动保存记录。每次保存记录后将清空缓存的记录。</p>
    <button>保存记录</button>
    <div class="data-div">
      <span>已收集数据：</span>
      <b class="data-log-num">{{ logNumber }}</b>
    </div>
    <div class="data-div">
      <span>上一个动作：</span>
      <b class="data-prev-log">{{ prevLog }}</b>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faPlay, faPause } from '@fortawesome/free-solid-svg-icons'
import { ref } from 'vue'
const recording = ref<boolean>(true)
const logNumber = ref<number>(0)
const prevLog = ref<string>('null')
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