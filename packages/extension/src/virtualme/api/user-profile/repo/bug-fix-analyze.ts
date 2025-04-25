import {AnalyzeResult, userProfilePath} from "../utils";
import fs from "fs";
import path from "path";


export function bugFixAnalyze(): AnalyzeResult {
    const repoNames = fs.readdirSync(path.join(userProfilePath, 'repo'));
    if (repoNames.length === 0) {
        return {
            success: false,
            error: 'No repo in user-profile found.'
        }
    }
    let bugFixList: {cmdType: string, avgFixTime: number}[] = [];

    for (const repoName of repoNames) {
        const terminalInfoPath = path.join(userProfilePath, 'repo', repoName, 'terminal.json');
        if (!fs.existsSync(terminalInfoPath)) {
            continue
        }
        const terminalInfo = JSON.parse(fs.readFileSync(terminalInfoPath, 'utf-8'));
        for (const cmd of terminalInfo) {
            if (cmd.avgTime && cmd.avgTime > 0) {
                //保留avgTime小数点后两位
                bugFixList.push({
                    cmdType: cmd.cmdType,
                    avgFixTime: parseFloat(cmd.avgTime.toFixed(2))
                })
            }
        }
    }

    if (bugFixList.length === 0) {
        return {
            success: true,
            data: "没有发现任何bug修复记录"
        }
    }

    return {
        success: true,
        data: JSON.stringify(bugFixList)
    }
}