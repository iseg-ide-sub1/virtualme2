import * as vscode from 'vscode';
import { l10n } from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import type { Config } from '../types/ConfigTypes';
import { MessageSender } from '../utils/MessageSender';
import { log } from 'console';

let nanoid: () => string;
(async () => {
    const nanoidModule = await import('nanoid');
    nanoid = nanoidModule.nanoid;
})();

export class ConfigModels {
    public modelList: any = [];
    constructor(
        public configUri: vscode.Uri,
        public context: vscode.ExtensionContext
    ) {
        const folerPath = path.dirname(this.configUri.fsPath);
        if(!fs.existsSync(folerPath)){
            fs.mkdirSync(folerPath, {recursive: true});
        }
        if(!fs.existsSync(this.configUri.fsPath)){
            fs.writeFileSync(this.configUri.fsPath, `{\n  "models": []\n}`);
            vscode.window.showInformationMessage(`${l10n.t('ts.createdConfig')} ${this.configUri.fsPath}`);
        }
    }
    
    public getConfigObject(): Config {
        try{
            const configContent = fs.readFileSync(this.configUri.fsPath, 'utf8');
            const config: Config = JSON.parse(configContent);
            return config;
        }
        catch (error) {
            vscode.window.showErrorMessage(`Not A Vaild Config File`);
            return { models: [] };
        }
    }

    public updateModelsFromConfig(){
        const modelList = this.getConfigObject().models;
        this.modelList = modelList;
        const models = modelList.map( (model: any) => {
            return {
                id: model.id,
                type: model.type,
                name: model.title?  model.title : model.model,
            };
        });
        const modelID = this.context.globalState.get<string>('modelID');
        MessageSender.modelsUpdate(
            JSON.stringify(models),
            modelID ? modelID : ''
        );
    }

    public addModelToConfig(modelData: string) {
        if(!nanoid) {
            vscode.window.showErrorMessage('nanoid is not loaded.');
            return;
        }
        try{
            let configObj: Config = this.getConfigObject();
            let modelDataObj = JSON.parse(modelData);
            modelDataObj['id'] = nanoid();
            configObj.models.push(modelDataObj);
            fs.writeFileSync(this.configUri.fsPath, JSON.stringify(configObj, null, 2));
        } catch (error) {
            vscode.window.showErrorMessage(`${l10n.t('ts.parsingConfigError')} ${error}`);
        }
        this.updateModelsFromConfig();
    }

    public deleteModelFromConfig(modelID: string) {
        let configObj = this.getConfigObject();
        console.log(JSON.stringify(configObj));
        configObj['models'] = configObj['models'].filter( (model: any) => {
            return model.id !== modelID;
        });
        console.log(JSON.stringify(configObj));
        fs.writeFileSync(this.configUri.fsPath, JSON.stringify(configObj, null, 2));
        this.updateModelsFromConfig();
    }

    public updatemodelID(modelID: string){
        this.context.globalState.update('modelID', modelID);
        MessageSender.modelIDUpdated(modelID);
    }
}
