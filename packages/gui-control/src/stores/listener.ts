import { defineStore } from 'pinia';
import { ref } from 'vue';
import i18n from '@/i18n';

export const useListenerStore = defineStore('listener', () => {

    const recording = ref<boolean>(true)
    const logNumber = ref<number>(0)
    const prevLog = ref<string>('null')

    window.addEventListener('message', event => {
        const message = event.data;
        console.log('@gui-control receive:', JSON.stringify(message));
        switch (message.command) {
            case 'language.set':
                languageSet(message.lang);
                break;
            case 'status.current':
                recording.value = message.status;
                break;
            case 'logs.number':
                logNumber.value = message.num;
                break;
            case 'logs.prev':
                prevLog.value = message.prev;
                break;
        }
    });

    function languageSet(lang: string){
        if(lang === 'zh-cn') {
            i18n.global.locale.value = 'zh_cn';
        } else {
            i18n.global.locale.value = 'en';
        }
    }

    return {
        recording,
        logNumber,
        prevLog
    };
})