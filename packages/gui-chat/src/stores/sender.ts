import { defineStore } from 'pinia';
import type { ModelConfig } from '@/types'
import { useVsCodeApiStore } from './vscode';

export const useSenderStore = defineStore('sender', () => {
    const vscode = useVsCodeApiStore().vscode;

    function initReady(){
        vscode?.postMessage({command: 'init.ready'});
    }

    function modelIDUpdate(newID: string){
        vscode?.postMessage({
            command: 'modelID.update',
            modelID: newID
        });
    }

    function configUpdate(){
        vscode?.postMessage({command: 'config.update'});
    }

    function modelAdd(model: string){
        vscode?.postMessage({
            command: 'model.add',
            model: model
        });
    }
    
    function modelDelete(modelID: string){
        vscode?.postMessage({
            command: 'model.delete',
            modelID: modelID
        });
    }

    function requestSend(request: string){
        vscode?.postMessage({
            command: 'request.send',
            request: request
        });
    }
    
    function dialogDelete(requestID: string){
        vscode?.postMessage({
            command: 'dialog.delete',
            requestID: requestID
        });
    }

    return {
        initReady,
        modelIDUpdate,
        configUpdate,
        modelAdd,
        modelDelete,
        requestSend,
        dialogDelete
    }
});