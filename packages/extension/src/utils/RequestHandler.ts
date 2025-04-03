import * as vscode from 'vscode';
import { ConfigModels } from '../storage/ConfigModels';
import { RequestModel } from '../chat/RequestModel';

export class RequestHandler {
    public static view: vscode.WebviewView | undefined;
    public static configModels: ConfigModels | undefined;
    public static requestModel: RequestModel | undefined;

    public static handleRequest(message: any) {
        console.log(JSON.stringify(message));
        switch (message.command) {
            case 'init.ready':
                RequestHandler.prepareInit();
                break;
            case 'modelID.update':
                RequestHandler.updateModelID(message.modelID);
                break;
            case 'config.update':
                RequestHandler.updateConfig();
                break;
            case 'model.add':
                RequestHandler.addModel(message.model);
                break;
            case 'model.delete':
                RequestHandler.deleteModel(message.modelID);
                break;
            case 'request.send':
                RequestHandler.handelRequest(message.request);
                break;
        }
    }

    private static prepareInit(){
        RequestHandler.configModels?.updateModelsFromConfig();
    }

    private static updateModelID(modelID: string){
        RequestHandler.configModels?.updatemodelID(modelID);
    }

    private static updateConfig(){
        RequestHandler.configModels?.updateModelsFromConfig();
        vscode.commands.executeCommand('light-at.goto.config');
    }

    private static addModel(model: string){
       RequestHandler.configModels?.addModelToConfig(model);
    }

    private static deleteModel(modelID: string){
        RequestHandler.configModels?.deleteModelFromConfig(modelID);
    }

    private static handelRequest(request: string){
        RequestHandler.requestModel?.handleRequest(request);
    }
}