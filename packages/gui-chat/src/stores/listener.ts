import { defineStore } from 'pinia';
import { ref } from 'vue';
import i18n from '@/i18n';
import type { DialogItem, Model } from '@/types';

export const useListenerStore = defineStore('listener', () => {
    const models = ref<Model[]>([]);
    const modelID = ref<string>('');
    const sendDisable = ref(false);
    const dialogs = ref<DialogItem[]>([]);
    const welcomeInfo = ref(true);
    const sendShortcut = ref('Ctrl+Enter');
    // i18n.global.locale.value = 'en';
    window.addEventListener('message', event => {
        const message = event.data;
        console.log(JSON.stringify(message));
        switch (message.command) {
            case 'language.set':
                if(message.lang === 'zh-cn') {
                    i18n.global.locale.value = 'zh_cn';
                } else if(message.lang === 'ja'){
                    i18n.global.locale.value = 'ja';
                }
                else {
                    i18n.global.locale.value = 'en';
                }
                break;
            case 'settings.update':
                const settings = JSON.parse(message.settings);
                welcomeInfo.value = settings.welcomeInfo;
                sendShortcut.value = settings.sendShortcut;
                if(settings?.codeTheme){
                    import(`@/assets/css/highlight.js/${settings.codeTheme}.css`)
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
                    id: 'u_' + message.requestID,
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
                if(dialogs.value.length && 
                    dialogs.value[dialogs.value.length - 1].id === message.requestID
                ){
                    dialogs.value[dialogs.value.length - 1].content += message.data;
                }
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
            case 'dialog.deleted':
                dialogs.value = dialogs.value.filter(item => {
                    return item.id !== message.requestID && 
                        item.id !== 'u_' + message.requestID;
                });
                break;
        }
    });

    return {
        models, modelID,
        sendDisable, dialogs,
        welcomeInfo, sendShortcut
    };
})