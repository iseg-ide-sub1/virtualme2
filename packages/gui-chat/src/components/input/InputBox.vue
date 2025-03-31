<template>
  <div class="input-box">
    <textarea rows="1" placeholder="Ask something..."></textarea>
  </div>
</template>

<script setup lang="ts">
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
  max-height: 500px;
  line-height: 1.5em;
  scrollbar-width: thin;
  padding: 5px;
  box-sizing: border-box;
  color: var(--vscode-input-foreground, #616161);
  background-color: var(--vscode-input-background, #ffffff);
  resize: none;
  border: none;
}

textarea:focus {
  outline: none;
}
</style>