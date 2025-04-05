<template>
  <div class="input-upper">
    <div class="dropup-box">
      <div class="dropup-option" v-if="displayContext">
        <ul class="dropup-list">
          <li
            v-for="item in conextList"
            :key="item.path"
            @click="item.selected = !item.selected"
            :class="{ selected: item.selected }"
          >
            <span>{{ item.name }}</span>
            <sub>{{ item.path }}</sub>
          </li>
        </ul>
      </div>
      <div 
        class="stop-generation"
        v-show="sendDisable"
        @click="sendStore.responseStop()"
      >
        <FontAwesomeIcon :icon="faPause" />
        <span>{{ $t('input.stopGeneration') }}</span>
      </div>
      <div
        class="add-context"
        @click="getContext"
      >
        <FontAwesomeIcon :icon="faPlus" />
        <span>{{ $t('input.addContext') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSenderStore } from '@/stores/sender'
import { useListenerStore } from '@/stores/listener'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faPause, faPlus } from '@fortawesome/free-solid-svg-icons'
const displayContext = ref(false)
const listenerStore = useListenerStore()
const { sendDisable } = storeToRefs(listenerStore)
const sendStore = useSenderStore()

const conextList = ref([
  {
    name: 'function.ts',
    path: 'long/path/function.ts',
    selected: false
  },
  {
    name: 'long.ts',
    path: 'longlong/path/function.ts',
    selected: false
  },
  {
    name: 'function.ts',
    path: 'hiker/path/function.ts',
    selected: false
  },
  {
    name: 'dorimu.ts',
    path: 'sum/path/function.ts',
    selected: false
  },
  {
    name: 'requestModel.ts',
    path: 'requestModel/path/requestModel.ts',
    selected: false
  }
])

function getContext() {
  if(displayContext.value){
    displayContext.value = !displayContext.value
  }
  else{
    // TODO: get context from plugin
  }
}
</script>

<style scoped>
@import '../../assets/css/dropup2.css';

.input-upper {
  margin: 5px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.add-context,
.stop-generation {
  display: inline-block;
  padding: 2px 4px;
  border-radius: 5px;
  margin-right: 10px;
  background-color: rgba(128, 128, 128, 0.1);
}

.stop-generation svg,
.add-context svg{
  margin-left: 2px;
  margin-right: 3px;
}

.stop-generation:hover,
.add-context:hover {
  background-color: rgba(128, 128, 128, 0.2);
}


dropup-option {
  bottom: calc(100% + 5px);
  border-radius: 5px;
  border: 1px solid rgba(128, 128, 128, 0.4);
  box-shadow: 0 0 5px 2px rgba(128, 128, 128, 0.4);
}
</style>