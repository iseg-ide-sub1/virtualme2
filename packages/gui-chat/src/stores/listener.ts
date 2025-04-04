import { defineStore } from 'pinia';
import { ref } from 'vue';
import i18n from '@/i18n';
import type { DialogItem, Model } from '@/types';

export const useListenerStore = defineStore('listener', () => {
    const models = ref<Model[]>([]);
    const modelID = ref<string>('');
    const sendDisable = ref(false);
    const dialogs = ref<DialogItem[]>([]);

    // i18n.global.locale.value = 'zh_cn';
    window.addEventListener('message', event => {
        const message = event.data;
        console.log(JSON.stringify(message));
        switch (message.command) {
            case 'language.set':
                if(message.lang === 'zh-cn'){
                    i18n.global.locale.value = 'zh_cn';
                }else if(message.lang === 'ja'){
                    i18n.global.locale.value = 'ja';
                }
                break;
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