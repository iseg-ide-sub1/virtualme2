import { defineStore } from 'pinia';
import { ref } from 'vue';
import i18n from '@/i18n';
import type { DialogItem, Model, ContextMap } from '@/types';

export const useListenerStore = defineStore('listener', () => {
    const models = ref<Model[]>([]);
    const modelID = ref<string>('');
    const sendDisable = ref(false);
    const dialogs = ref<DialogItem[]>([]);
    const welcomeInfo = ref(true);
    const sendShortcut = ref('Ctrl+Enter');
    const contextMap = ref<ContextMap>({});

    window.addEventListener('message', event => {
        const message = event.data;
        console.log('Front receive:', JSON.stringify(message));
        switch (message.command) {
            case 'language.set':
                languageSet(message.lang);
                break;
            case 'settings.update':
                settingsUpdate(message.settings);
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
                    content: message.content,
                    context: JSON.parse(message.context)
                });
                break
            case 'response.new':
                responseNew(message);
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
                    id: message.requestID, content: message.content,
                    type: message.type, name: message.name
                });
                break;
            case 'chat.new':
                dialogs.value = [];
                break;
            case 'dialog.deleted':
                dialogs.value = dialogs.value.filter(item => {
                    return item.id !== message.requestID && item.id !== 'u_' + message.requestID;
                });
                break;
            case 'context.send':
                contextSend(message.context);
                break;
        }
    });

    function languageSet(lang: string){
        if(lang === 'zh-cn') {
            i18n.global.locale.value = 'zh_cn';
        } else if(lang === 'ja'){
            i18n.global.locale.value = 'ja';
        }
        else {
            i18n.global.locale.value = 'en';
        }
    }

    function settingsUpdate(settingsStr: string){
        const settings = JSON.parse(settingsStr);
        welcomeInfo.value = settings.welcomeInfo;
        sendShortcut.value = settings.sendShortcut;
        if(settings?.codeTheme){
            import(`@/assets/css/highlight.js/${settings.codeTheme}.css`)
        }
    }

    function responseNew(message: any){
        sendDisable.value = true;
        dialogs.value.push({
            id: message.requestID,
            content: '',
            type: message.type,
            name: message.name
        });
    }

    function contextSend(contextStr: string){
        const context = JSON.parse(contextStr);
        for(let item of context){
            const isSelected = contextMap.value[item]?.selected;
            contextMap.value[item] = {
                name: item.split('/').pop().split('\\').pop(),
                selected: isSelected ?? false
            }
        }
    }

    return {
        models,
        modelID,
        sendDisable,
        dialogs,
        welcomeInfo,
        sendShortcut,
        contextMap
    };
})