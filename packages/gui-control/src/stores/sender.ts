import { defineStore } from 'pinia';
import { useVsCodeApiStore } from './vscode';

export const useSenderStore = defineStore('sender', () => {
    const vscode = useVsCodeApiStore().vscode;

    function initReady(){
        vscode?.postMessage({command: 'init.ready'});
    }

    function setStatus(status: boolean){
        vscode?.postMessage({command: 'status.set', status: status});
    }

    function saveLogs(){
        vscode?.postMessage({command: 'logs.save'});
    }

    return {
        initReady,
        setStatus,
        saveLogs
    }
});