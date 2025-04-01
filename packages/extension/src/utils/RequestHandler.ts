import * as vscode from 'vscode';
import { ConfigModels } from '../storage/ConfigModels';

export class RequestHandler {
    public static view: vscode.WebviewView | undefined;
    public static configModels: ConfigModels | undefined;

    public static handleRequest(message: any) {
        console.log(JSON.stringify(message));
        switch (message.command) {
            case 'init.ready':
                RequestHandler.prepareInit();
                break;
            case 'modelID.update':
                RequestHandler.updateModelID(message.modelID);
                break;
        }
    }

    private static prepareInit(){
        RequestHandler.configModels?.updateModelsFromConfig();
    }

    private static updateModelID(modelID: string){
        RequestHandler.configModels?.updatemodelID(modelID);
    }
}