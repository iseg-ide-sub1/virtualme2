<template>
  <div>
    <input type="text" v-model="textMessage" />
    <button @click="sendMessage">发送消息</button>
    <div class="info-container">
      <p>接收的消息：</p>
      <ul>
        <li v-for="(message, index) in messages" :key="index">
          {{ message }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useVsCodeApiStore } from '@/stores/vsCodeApi';
const textMessage = ref('');
const vscode = useVsCodeApiStore().vscode;
const messages: any = reactive([]);
function sendMessage() {
  if (vscode) {
    vscode.postMessage({
      command: 'hello',
      data: textMessage.value
    });
  }
  textMessage.value = '';
}
window.addEventListener('message', event => {
  const message = event.data;
  switch (message.command) {
    case 'hello':
      messages.push(message.data);
      break;
  }
});
</script>

<style scoped>
div {
  background-color: antiquewhite;
  overflow: hidden;
}

input,
button {
  margin: 10px;
}

.info-container {
  border: 1px solid black;
  padding: 10px;
  margin: 10px;
}
</style>
