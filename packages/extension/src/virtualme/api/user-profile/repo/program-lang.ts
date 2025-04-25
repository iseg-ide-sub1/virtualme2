import path from "path";
import {extensionPath, repoMap} from "../../../core/global";
import * as fs from 'fs'
import {checkBaseConfigPath, getRepoFolder, userProfilePath, walkDir} from "../utils";
import {isFileSkipped} from "../../../base/event-process/file-process";
import {lowerCase} from "lodash";
import {ConfigInfo, FrameworkInfo, LangInfo} from "./Info";


const suffix2Lang = new Map<string, string>(
    [
        ['.js', 'JavaScript'],
        ['.ts', 'TypeScript'],
        ['.py', 'Python'],
        ['.php', 'Php'],
    ]
)

function getLangConfigPath() {
    const repoPath = getRepoFolder();
    if (!repoPath) {
        return undefined;
    }
    checkBaseConfigPath(repoPath)

    const langConfigPath = path.join(userProfilePath, 'repo', path.basename(repoPath), "lang.json");
    if (!fs.existsSync(langConfigPath)) {
        fs.writeFileSync(langConfigPath, '', 'utf8')
    }
    return langConfigPath;
}

export function getFrameworkConfigPath() {
    const frameworkConfigPath = path.join(userProfilePath, 'repo', "frameworks-history.json");
    if (!fs.existsSync(frameworkConfigPath)) {
        fs.writeFileSync(frameworkConfigPath, JSON.stringify([]), 'utf8')
    }
    return frameworkConfigPath;
}


function analyze(filePath: string, info: LangInfo, rule: any) {
    //读取文件内容
    const content = fs.readFileSync(filePath, 'utf8')
    const lines = content.split('\n')

    //分析代码行数
    const lineCount = lines.length

    //分析空白行数和注释行数
    let blankCount = 0
    let inMultiLineComment = false;
    let multiEndSymbol = '';
    const spec = rule.commentSpec
    let commentCount = 0

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine === '') {
            blankCount += 1
            continue
        } // 跳过空行

        if (inMultiLineComment) {
            commentCount++;
            // 检查多行注释是否结束
            if (trimmedLine.includes(multiEndSymbol)) {
                inMultiLineComment = false;
            }
            continue;
        }

        // 检查单行注释
        const isSingleComment = spec.single.some((symbol: string) => trimmedLine.startsWith(symbol));
        if (isSingleComment) {
            commentCount++;
            continue;
        }

        // 检查多行注释开始
        for (let i = 0; i < spec.multiStart.length; i++) {
            if (trimmedLine.includes(spec.multiStart[i])) {
                inMultiLineComment = true;
                multiEndSymbol = spec.multiEnd[i];
                commentCount++;
                // 如果同一行包含结束符号，则立即结束
                if (trimmedLine.includes(multiEndSymbol)) {
                    inMultiLineComment = false;
                }
                break;
            }
        }
    }

    //下面的分析只针对每个文件的前100行，因为太多行可能会影响性能，有些选手十分变态，单个代码行数几万行
    //分析语言特性、相关包
    const features: Set<string> = new Set()
    const packages: Set<string> = new Set()

    for (const line of lines.slice(0, 100)) {
        for (const feature of rule.features) {
            for (const keyword of feature.keywords)
                if (line.includes(keyword)) {
                    features.add(feature.name)
                }
        }
    }

    //更新LangInfo
    info.file ? info.file += 1 : info.file = 1
    info.line ? info.line += lineCount : info.line = lineCount
    info.blank ? info.blank += blankCount : info.blank = blankCount
    info.comment ? info.comment += commentCount : info.comment = commentCount
    info.features = new Set([...(info.features || []), ...features]);
    info.packages = new Set([...(info.packages || []), ...packages]);
}


export async function updateRepoLang(repoPath: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
        if (!repoMap) {
            return reject("No repo map found");
        }
        const langConfigPath = getLangConfigPath();
        if (!langConfigPath) {
            return reject("No lang config found");
        }
        const frameworkConfigPath = getFrameworkConfigPath();
        const frameworkConfig = JSON.parse(fs.readFileSync(frameworkConfigPath, 'utf8'))

        let langs: string[] = [];
        let langInfos: LangInfo[] = [];
        let packagesGlobal: string[] = [];
        let frameworks: FrameworkInfo[] = [];
        let langLinesMap: Map<string, number> = new Map()

        try {
            let t = 0
            while (!repoMap.isInitialized()) {
                if (t > 20) {
                    return reject('Timeout for repoMap initialization')
                }
                console.log('Waiting for repoMap initialization...')
                await new Promise(resolve => setTimeout(resolve, 2 * 1000))
                t += 1
            }
            packagesGlobal = await repoMap.getExternalPackages()
            // console.log('packagesGlobal:', packagesGlobal)
        } catch (error) {
            return reject(error)
        }

        //识别编程语言
        for (const file of walkDir(repoPath)) {
            if (isFileSkipped(file)) continue
            //检查文件后缀是否支持
            const ext = path.extname(file)
            if (ext.length === 0 || !suffix2Lang.has(ext)) continue
            // console.log('analyze file: ', file);
            for (const [suffix, lang] of suffix2Lang) {
                if (ext === suffix) { //分析支持的语言
                    if (!langs.includes(lang))
                        langs.push(lang)

                    let info = new LangInfo(lang)

                    let found = false;
                    for (const i of langInfos) {
                        if (i.lang === lang) {
                            info = i
                            found = true
                            break
                        }
                    }
                    if (!found)
                        langInfos.push(info)

                    try {
                        const ruleFile = path.join(extensionPath, "res", "config", `${info.lang}.json`)
                        if (!fs.existsSync(ruleFile)) {
                            return reject(`No rule file for ${info.lang}`)
                        }
                        const rule = JSON.parse(fs.readFileSync(ruleFile, 'utf8'))

                        analyze(file, info, rule)  //分析代码行数、空白行数、注释行数、语言特性、相关包, 填入info中

                        langLinesMap.set(lang, info.line ? info.line : 0) //记录语言代码行数，用于简单归类纯语言项目

                        const packagesLang = rule.packages || []
                        info.packages = info.packages || new Set<string>()
                        for (const pak of packagesLang) {
                            if (packagesGlobal.includes(lowerCase(pak))) {
                                info.packages.add(pak)
                            }
                        }
                    } catch (error) {
                        return reject(error)
                    }

                    break
                }
            }
        }

        //识别框架信息
        const ruleFile = path.join(extensionPath, "res", "config", 'Framework.json')
        if (!fs.existsSync(ruleFile)) {
            return reject('No rule file for Frameworks')
        }
        const rule = JSON.parse(fs.readFileSync(ruleFile, 'utf8'))
        // 找出该项目最多的语言
        let maxLang = ''
        let maxLines = 0
        for (const [lang, lines] of langLinesMap) {
            if (lines > maxLines) {
                maxLang = lang
                maxLines = lines
            }
        }
        try {
            for (const r of rule) {
                const tags: string[] = r.tag
                //如果repoPath文件夹下中包含tags中所有文件/文件夹，则认为是该框架
                if (
                    tags.every(tag => fs.existsSync(path.join(repoPath, tag))) && tags.length !== 0 || //有标志性文件的框架
                    r.name === maxLang && tags.length === 0 // 没有标志性文件的纯语言项目
                ) {
                    let configFiles: ConfigInfo[] = []
                    for (const c of r.config) {
                        if (fs.existsSync(path.join(repoPath, c))) {
                            try {
                                const configFile = path.join(repoPath, c)
                                const content = fs.readFileSync(configFile, 'utf8')
                                configFiles.push(new ConfigInfo(c, content))
                            } catch (error) {
                                console.error(error)
                            }
                        }
                    }
                    const frameworkInfo = new FrameworkInfo(r.name, configFiles)
                    frameworks.push(frameworkInfo)
                }
            }
        } catch (error) {
            return reject(error)
        }

        //更新frameworks使用记录
        for (const framework of frameworks) {
            if(!frameworkConfig.some((f: { name: string; timestamp: string}) => f.name === framework.name)) {
                frameworkConfig.push({
                    name: framework.name,
                    timestamp: new Date().toISOString()
                })
            }
        }

        try {
            //更新配置文件
            fs.writeFileSync(frameworkConfigPath, JSON.stringify(frameworkConfig, null, 2), 'utf8')
            fs.writeFileSync(langConfigPath, JSON.stringify({
                langs: langs,
                langInfo: langInfos.map(i => i.toJSONObject()),
                frameworks: frameworks.map(f => f.toJSONObject())
            }, null, 2), 'utf8')
        } catch (error) {
            return reject(error)
        }

        resolve("Update lang success")
    })
}