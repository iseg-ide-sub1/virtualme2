import {LogItem} from "../../base/types/log-item";
import {updateTerminal} from "./repo/terminal";
import {updateRepoLang} from "./repo/program-lang";
import {checkBaseConfigPath, getRepoFolder} from "./utils";
import fs from "fs";
import path from "path";
import {updateActivityTime} from "./event/activity-time";
import {updateExtensionEco} from "./ide/extension-eco";
import {updateActionHabit} from "./event/action-habit";
import {updateCyclissity} from "./event/cyclissity";

function getREADME(repoPath: string): string {
    const readmeFile = path.join(repoPath, "README.md");
    if (fs.existsSync(readmeFile)) {
        try {
            //取README至多前500个字符
            return fs.readFileSync(readmeFile, 'utf8').slice(0, 500) + '...';
        } catch (err) {
            return ''
        }
    }
    return ''
}

/**
 * 更新用户配置文件
 *
 * 该函数用于根据日志条目更新用户配置文件。可以通过参数控制是否强制更新，以及更新的阈值。
 *
 * @param logs - 日志条目数组，包含需要处理的日志信息。
 *
 * @returns 返回一个 Promise 对象，表示更新操作的结果。如果成功，则解析为更新后的数据；如果失败，则拒绝并返回错误信息。
 */
export function updateUserProfile(logs: LogItem[]): Promise<any> {
    return new Promise(async (resolve, reject) => {
        const repoPath = getRepoFolder();
        if (!repoPath) {
            return reject("No repo found");
        }
        const baseConfigFile = checkBaseConfigPath(repoPath);
        const baseConfig = JSON.parse(fs.readFileSync(baseConfigFile, 'utf8'))
        const nowDate = new Date();

        try {
            await updateRepoLang(repoPath);
            await updateTerminal(logs);
            await updateActivityTime(logs)
            await updateExtensionEco()
            await updateActionHabit(logs)
            baseConfig.cyclissity = await updateCyclissity(logs)
            baseConfig.README = getREADME(repoPath);
        } catch (error) {
            reject(error);
        }

        try {
            // 更新baseConfig
            baseConfig.lastUpdate = nowDate.toISOString();
            fs.writeFileSync(baseConfigFile, JSON.stringify(baseConfig, null, 2), 'utf8');
        } catch (err) {
            return reject(err);
        }
        resolve("Update user profile success");
    })
}