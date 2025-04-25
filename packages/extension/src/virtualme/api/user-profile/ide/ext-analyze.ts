import {AnalyzeResult} from "../utils";
import {getExtEcoConfigPath, getExtInstHistoryConfigPath} from "./extension-eco";
import fs from "fs";


export function extensionAnalyze(): AnalyzeResult {
    const extEcoConfigPath = getExtEcoConfigPath()
    const extEcoConfig = JSON.parse(fs.readFileSync(extEcoConfigPath, 'utf8'))
    if (Object.keys(extEcoConfig).length === 0) {
        return {
            success: false,
            error: "No extension eco config found."
        }
    } else {
        //删除other字段
        delete extEcoConfig.Other
        delete extEcoConfig.other
        return {
            success: true,
            data: JSON.stringify(extEcoConfig)
        }
    }
}

export function extNewAnalyze(): AnalyzeResult {
    const extInstHistoryConfigPath = getExtInstHistoryConfigPath()
    const extInstHistoryConfig = JSON.parse(fs.readFileSync(extInstHistoryConfigPath, 'utf8'))

    const extNewInterval = extInstHistoryConfig.slice(1).map((f, index) => {
        return (new Date(f.timestamp).getTime() - new Date(extInstHistoryConfig[index].timestamp).getTime()) / 1000 / 60 / 60 / 24 //单位：天
    }).reduce((acc, cur) => acc + cur, 0) / extInstHistoryConfig.length

    if (extNewInterval < 1 || isNaN(extNewInterval)) {
        return {
            success: true,
            data: `暂无新插件尝试记录`
        }
    }

    return {
        success: true,
        data: `平均每隔几天尝试使用新插件：${extNewInterval.toFixed(1)} 天`
    }
}
