<template>
  <div class="chat-container">
    <DialogBox />
    <div class="sep-line"></div>
    <InputBox />
  </div>
</template>

<script setup lang="ts">
import DialogBox from '@/components/dialog/DialogBox.vue';
import InputBox from '@/components/input/InputBox.vue'; 
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.dialog-box {
  flex: 1;
  overflow: auto;
  scrollbar-width: thin;
}

.sep-line {
  height: 1px;
  background-color: rgba(128, 128, 128, 0.2);
}

.input-box {
  flex-shrink: 0;
}
</style>
