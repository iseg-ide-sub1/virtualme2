import {AnalyzeResult, checkBaseConfigPath, getRepoFolder} from "../utils";
import fs from "fs";


export function cyclissityAnalyze(): AnalyzeResult {
    const repoPath = getRepoFolder();
    if (!repoPath) {
        return {
            success: false,
            error: "No repository found"
        }
    }

    const baseConfigPath = checkBaseConfigPath(repoPath)
    const baseConfig = JSON.parse(fs.readFileSync(baseConfigPath, 'utf8'))

    return {
        success: true,
        data: baseConfig.cyclissity
    }
}