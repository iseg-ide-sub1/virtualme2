import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useVsCodeApiStore } from './vscode';
import type { DialogItem, Model } from '@/types';

export const useListenerStore = defineStore('listener', () => {

    const models = ref<Model[]>([]);
    const modelID = ref<string>('');
    const sendDisable = ref(false);
    const dialogs = ref<DialogItem[]>([]);


    window.addEventListener('message', event => {
        const message = event.data;
        console.log(JSON.stringify(message));
        switch (message.command) {
            case 'models.update':
                models.value = JSON.parse(message.models);
                modelID.value = message.modelID;
                break;
              case 'modelID.updated':
                modelID.value = message.modelID;
                break;
            case 'request.load':
                dialogs.value.push({
                    id: 'r_' + message.requestID,
                    content: message.content
                });
                break
            case 'response.new':
                sendDisable.value = true;
                dialogs.value.push({
                    id: message.requestID,
                    content: '',
                    type: message.type,
                    name: message.name
                });
                break;
            case 'response.stream':
                dialogs.value[dialogs.value.length - 1].content += message.data;
                break;
            case 'response.end':
                sendDisable.value = false;
                break;
            case 'response.load':
                dialogs.value.push({
                    id: message.requestID,
                    content: message.content,
                    type: message.type,
                    name: message.name
                });
                break;
            case 'chat.new':
                dialogs.value = [];
                break;
        }
    });

    return { 
        models, modelID,
        sendDisable, dialogs
    };
})