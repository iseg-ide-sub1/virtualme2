import {AnalyzeResult} from "../utils";
import {getFrameworkConfigPath} from "./program-lang";
import fs from "fs";


export function frameworkNewAnalyze(): AnalyzeResult {
    const frameworkConfigPath = getFrameworkConfigPath();
    const frameworkConfig = JSON.parse(fs.readFileSync(frameworkConfigPath, 'utf8'));

    const frameworkNewInterval = frameworkConfig.slice(1).map((f, index) => {
        return (new Date(f.timestamp).getTime() - new Date(frameworkConfig[index].timestamp).getTime()) / 1000 / 60 / 60 / 24 //单位：天
    }).reduce((acc, cur) => acc + cur, 0) / frameworkConfig.length

    if (frameworkNewInterval < 1  || isNaN(frameworkNewInterval)) {
        return {
            success: true,
            data: `暂无新框架尝试记录`
        }
    }

    return {
        success: true,
        data: `平均每隔几天尝试使用新框架：${frameworkNewInterval.toFixed(1)} 天`
    }
}