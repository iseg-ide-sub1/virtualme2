import fs from "fs";
import {AnalyzeResult, userProfilePath} from "../utils";
import path from "path";

class RepoSummary {
    constructor(
        public repoName: string,
        public baseInfo: string,
        public langInfo: string,
        public terminalInfo: string,
        public repoConfig?: string,
    ) {
        const terminalInfoJSON = JSON.parse(terminalInfo);
        for (const tc of terminalInfoJSON) {
            // 删除fixedTime字段、删除avgFixedTime字段，这两个单独用于评估bug修复效率的指标，不适合作为repo的指标
            delete tc.fixedTime;
            delete tc.avgTime;
        }
        this.terminalInfo = JSON.stringify(terminalInfoJSON, null, 2);
    }

    toJSONObject() {
        return {
            repoName: this.repoName,
            baseInfo: this.baseInfo,
            langInfo: this.langInfo,
            terminalInfo: this.terminalInfo,
            repoConfig: this.repoConfig ? this.repoConfig : '',
        }
    }
}

export function repoAnalyze(): AnalyzeResult {
    const repoNames = fs.readdirSync(path.join(userProfilePath, 'repo'));
    if (repoNames.length === 0) {
        return {
            success: false,
            error: 'No repo in user-profile found.'
        }
    }
    let repoSummaryList: RepoSummary[] = [];

    for (const repoName of repoNames) {
        const repoProfilePath = path.join(userProfilePath, "repo", repoName);
        const baseInfoPath = path.join(repoProfilePath, 'base.json');
        const langInfoPath = path.join(repoProfilePath, 'lang.json');
        const terminalInfoPath = path.join(repoProfilePath, 'terminal.json');
        if (!fs.existsSync(baseInfoPath) && !fs.existsSync(langInfoPath) && !fs.existsSync(terminalInfoPath)) {
            continue
        }

        let baseInfo = '', langInfo = '', terminalInfo = '';

        if (fs.existsSync(baseInfoPath)) {
            baseInfo = fs.readFileSync(baseInfoPath, 'utf-8');
        }
        if (fs.existsSync(langInfoPath)) {
            langInfo = fs.readFileSync(langInfoPath, 'utf-8');
        }
        if (fs.existsSync(terminalInfoPath)) {
            terminalInfo = fs.readFileSync(terminalInfoPath, 'utf-8')
        }
        const repoSummary = new RepoSummary(baseInfo, repoName, langInfo, terminalInfo);
        repoSummaryList.push(repoSummary);
    }

    if (repoSummaryList.length === 0) {
        return {
            success: false,
            error: 'No info in repo in user-profile found.'
        }
    }

    const repoSummary = JSON.stringify(repoSummaryList.map(repoSummary => repoSummary.toJSONObject()), null, 2);
    return {
        success: true,
        data: repoSummary
    }
}