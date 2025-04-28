import { defineStore } from 'pinia';
import { useVsCodeApiStore } from './vscode';

export const useSenderStore = defineStore('sender', () => {
    const vscode = useVsCodeApiStore().vscode;

    function initReady(){
        vscode?.postMessage({command: 'init.ready'});
    }

    return {
        initReady
    }
});