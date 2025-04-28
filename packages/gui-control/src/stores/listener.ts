import { defineStore } from 'pinia';
import { ref } from 'vue';
import i18n from '@/i18n';

export const useListenerStore = defineStore('listener', () => {

    window.addEventListener('message', event => {
        const message = event.data;
        console.log('@gui-control receive:', JSON.stringify(message));
        switch (message.command) {
            case 'language.set':
                languageSet(message.lang);
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

    };
})