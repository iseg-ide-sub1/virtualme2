import * as vscode from 'vscode';
import { l10n } from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { MessageSender } from '../utils/MessageSender';

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
    
    public getConfigContent(): string {
        try{
            return fs.readFileSync(this.configUri.fsPath, 'utf8');
        }
        catch (error) {
            return `{\n  "models": []\n}`;
        }
    }

    public updateModelsFromConfig(){
        const configContent = this.getConfigContent();
        try{
            const modelList = JSON.parse(configContent).models;
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
        catch (error) {
            vscode.window.showErrorMessage(`${l10n.t('ts.parsingConfigError')} ${error}`);
        }
    }

    public addModelToConfig(modelData: string) {
        // TODO update
        let configContent = this.getConfigContent();
        let configObj = JSON.parse(configContent);
        let modelDataObj = JSON.parse(modelData);
        configObj['models'].push(modelDataObj);
        fs.writeFileSync(this.configUri.fsPath, JSON.stringify(configObj, null, 2));
        this.updateModelsFromConfig();
    }

    public deleteModelFromConfig(modelID: string) {
        let configContent = this.getConfigContent();
        let configObj = JSON.parse(configContent);
        configObj['models'] = configObj['models'].filter( (model: any) => {
            model.id !== modelID;
        });
        fs.writeFileSync(this.configUri.fsPath, JSON.stringify(configObj, null, 2));
        this.updateModelsFromConfig();
    }

    public updatemodelID(modelID: string){
        this.context.globalState.update('modelID', modelID);
        MessageSender.modelIDUpdated(modelID);
    }
}
