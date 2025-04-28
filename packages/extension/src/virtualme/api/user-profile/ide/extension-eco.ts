import * as vscode from "vscode";
import path from "path";
import {userProfilePath} from "../utils";
import fs from "fs";
import {extensionPath} from "../../../core/global";

export function getExtEcoConfigPath(): string {
    const res = path.join(userProfilePath, 'ide', "extension-eco.json");
    if (!fs.existsSync(res)) {
        fs.writeFileSync(res, JSON.stringify({}), 'utf8')
    }
    return res;
}

export function getExtInstHistoryConfigPath(): string{
    const res = path.join(userProfilePath, 'ide', "ext-inst-history.json");
    if (!fs.existsSync(res)) {
        fs.writeFileSync(res, JSON.stringify([]), 'utf8')
    }
    return res;
}

export function updateExtensionEco(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
        const extEcoConfigPath = getExtEcoConfigPath();
        const extEcoConfig = JSON.parse(fs.readFileSync(extEcoConfigPath, 'utf8'))

        const extInstHistoryConfigPath = getExtInstHistoryConfigPath();
        const extInstHistoryConfig = JSON.parse(fs.readFileSync(extInstHistoryConfigPath, 'utf8'))

        const allExtensions = vscode.extensions.all;
        let rule = {categories: [{name: "", extensions: [""]}]}

        try {
            rule = JSON.parse(fs.readFileSync(path.join(extensionPath, "res", "config", "extensions.json"), 'utf8'))
        } catch (err) {
            return reject(err);
        }

        function addExtInstHistory(extensionId: string) {
            if(!extInstHistoryConfig.some((item: { extensionId: string; timestamp: string}) => item.extensionId === extensionId)) {
                extInstHistoryConfig.push({extensionId: extensionId, timestamp: new Date().toISOString()})
            }
        }

        // 遍历并输出每个扩展的信息
        allExtensions.forEach(extension => {
            const extensionId = extension.id; // 扩展的唯一标识符，例如 "ms-python.python"
            const extensionName = extension.packageJSON.name; // 扩展的名称
            const extensionVersion = extension.packageJSON.version; // 扩展的版本
            const isActive = extension.isActive; // 扩展是否已激活

            let match = false;
            for (const category of rule.categories) {
                const categoryName = category.name;
                const exts = category.extensions;

                if (exts.includes(extensionId)) {
                    match = true
                    if (!extEcoConfig[categoryName]) {
                        extEcoConfig[categoryName] = []
                    }
                    if (!extEcoConfig[categoryName].includes(extensionId)) {
                        extEcoConfig[categoryName].push(extensionId);
                        addExtInstHistory(extensionId)
                    }
                    break;
                }
            }
            if (!match) {
                if (!extEcoConfig.Other) {
                    extEcoConfig.Other = []
                }
                if (!extEcoConfig.Other.includes(extensionId)) {
                    extEcoConfig.Other.push(extensionId);
                    addExtInstHistory(extensionId)
                }
            }
        })
        // 写入配置文件
        fs.writeFileSync(extInstHistoryConfigPath, JSON.stringify(extInstHistoryConfig), 'utf8')
        fs.writeFileSync(extEcoConfigPath, JSON.stringify(extEcoConfig), 'utf8')
        resolve("update extension eco success")
    })
}