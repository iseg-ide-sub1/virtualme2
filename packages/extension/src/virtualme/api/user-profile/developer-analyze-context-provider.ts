import {userProfilePath} from "./utils";
import fs from "fs";
import {repoAnalyze} from "./repo/repo-analyze";
import {extensionAnalyze, extNewAnalyze} from "./ide/ext-analyze";
import {codingProdAnalyze, commitTypeAnalyze} from "./snapshot/coding-prod-analyze";
import {actTimeAnalyze} from "./event/act-time-analyze";
import {bugFixAnalyze} from "./repo/bug-fix-analyze";
import {actionHabitAnalyze} from "./event/action-habit-analyze";
import {frameworkNewAnalyze} from "./repo/framework-new-analyze";
import {cyclissityAnalyze} from "./event/cyclissity-analyze";

export enum UserProfileType {
    BASIC = 'BASIC',
    ABILITY = 'ABILITY',
    HABIT = 'HABIT',
    LEARN = 'LEARN'
}

const systemPrompt = `
User: 提供自己的多维度开发过程信息，这其中可能包含：
1. 本地项目的信息：每个项目的信息包括项目名称、项目使用的语言、各语言量统计、每种语言使用了哪些语言特性、三方包、每个项目使用了什么框架，
每个框架的配置文件内容、项目的README内容、项目的常见终端命令类型的执行数量和成功率；
2. 代码变更行数时间戳快照：包括每个时间戳下距离上次时间戳发生的代码增加和修改行数；
3. IDE信息：包括所使用的插件类型
4. 开发事件信息：包括常使用的IDE功能、快捷键、每个终端错误从发生到解决经历了几次试错、每次git commit操作的时间与提交的代码量、文件跳转之间的耦合度用于评估repo的探索效率。

Agent: 从User提供的多维度信息中，推测分析如下指标，对于无法推测得出的指标，请直接不作回答。回答格式按照指标顺序排列：
`

const profileType2Prompt = new Map<UserProfileType, string>(
    [
        [UserProfileType.BASIC, systemPrompt + `
        1. 常用语言的占比与熟练度
        2. 技术栈：常用哪些框架/库
        3. 代码阅读/开发/修复行为占比
        `],
        [UserProfileType.ABILITY, systemPrompt + `
        1. AI助手依赖程度
        2. 对每种语言的掌握程度
        3. 项目复杂度：常用repo是否涉及多语言、多领域技术
        4. 缺陷修复效率：从错误发生到解决的平均时间
        5. 代码补全依赖度：完成一段编码时自动补全的比例
        6. 快捷键使用偏好：重构、tab、撤销重做等
        7. IDE功能依赖程度
        8. 代码生产力：每个周期内提交的代码量
        9. 构建编译测试能力：终端命令成功率
        10. 代码片段复用频率：保存和调用自己写的代码
        11. 单元测试编写频率
        12. 合并冲突处理频率与效率
        `],
        [UserProfileType.HABIT, systemPrompt + `
        1. 插件生态
        2. 每天/每周/每月的活跃时刻与长度
        3. 注释编写频率：体现对代码可读性和可维护性的关注
        4. 本地/远程操作偏好
        5. 代码调试的频率/调试断点的密度
        `],
        [UserProfileType.LEARN, systemPrompt + `
        1. 新repo探索/理解效率
        2. 新插件使用频率
        3. 新框架/库使用/理解效率
        `]
    ]
)


/**
 * 根据配置类型分析开发者上下文信息。
 *
 * @param {UserProfileType} userProfileType - 用户配置类型，默认为UserProfileType.BASIC。
 * @returns {Promise<any>} - 返回一个Promise，成功时解析为分析结果，失败时拒绝并返回错误信息。
 *
 * @description
 * 该函数用于分析不同类型的开发者上下文信息。首先检查用户配置文件是否存在。
 * 根据传入的用户配置类型，生成相应的提示信息，并将其作为分析上下文的一部分。
 */
export async function developerAnalyzeContextProvider(userProfileType: UserProfileType = UserProfileType.BASIC): Promise<string> {
    return new Promise(async (resolve, reject) => {
        if (!fs.existsSync(userProfilePath)) {
            return reject('No user-profile found.');
        }

        let res = profileType2Prompt.get(userProfileType) + '\n'

        if (userProfileType === UserProfileType.BASIC) {
            const repoSummary = repoAnalyze()
            if (!repoSummary.success) {
                console.error(repoSummary.error)
                res += '#项目信息\n' + '未能获取用户在该repo的项目信息' + '\n'
            }
            res += '#项目信息\n' + repoSummary.data + '\n'


        } else if (userProfileType === UserProfileType.ABILITY) {
            const repoSummary = repoAnalyze()
            if (!repoSummary.success) {
                console.error(repoSummary.error)
                res += '#项目信息\n' + '未能获取用户在该repo的项目信息' + '\n'
            }
            res += '#项目信息\n' + repoSummary.data + '\n'

            const codingProd = codingProdAnalyze()
            if (!codingProd.success) {
                console.error(codingProd.error)
                res += '#代码生产力\n' + '未能获取用户在该repo的提交记录' + '\n'
            }
            res += '#代码生产力\n' + codingProd.data + '\n'

            const actTime = actTimeAnalyze()
            if (!actTime.success) {
                console.error(actTime.error)
                res += '#活跃时间分布\n' + '未能获取用户在该repo的活跃时间分布' + '\n'
            }
            res += '#活跃时间分布\n' + actTime.data + '\n'

            const bugFixAvgTime = bugFixAnalyze()
            if (!bugFixAvgTime.success) {
                console.error(bugFixAvgTime.error)
                res += '#各种错误修复平均时间\n' + '未能获取用户在该repo的错误修复记录' + '\n'
            }
            res += '#各种命令类型出错后的修复平均时间\n' + bugFixAvgTime.data + '\n'


        } else if (userProfileType === UserProfileType.HABIT) {
            const extEco = extensionAnalyze()
            if (!extEco.success) {
                console.error(extEco.error)
                res += '#插件生态\n' + '未能获取用户IDE的插件生态' + '\n'
            }
            res += '#插件生态\n' + extEco.data + '\n'

            const now = new Date();
            //默认since为1个月前
            const since = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
            await commitTypeAnalyze(since).then(r => {
                res += '#提交记录摘要\n' + r.data + '\n'
            }).catch(e => {
                console.error(e.error)
                res += '#提交记录摘要\n' + '未能获取用户在该repo的git提交记录' + '\n'
            })

            const actionHabit = actionHabitAnalyze()
            if (!actionHabit.success) {
                console.error(actionHabit.error)
                res += '#IDE功能使用偏好\n' + '未能获取用户IDE的使用习惯' + '\n'
            }
            res += '#IDE功能使用偏好\n' + actionHabit.data + '\n'


        } else if (userProfileType === UserProfileType.LEARN) {
            const frameworkNewInterval = frameworkNewAnalyze()
            if (!frameworkNewInterval.success) {
                console.error(frameworkNewInterval.error)
                res += '#新框架/库使用频率\n' + '未能获取用户在该repo的新框架/库使用记录' + '\n'
            }
            res += '#新框架/库使用频率\n' + frameworkNewInterval.data + '\n'

            const extNewInterval = extNewAnalyze()
            if (!extNewInterval.success) {
                console.error(extNewInterval.error)
                res += '#新插件使用频率\n' + '未能获取用户在该repo的新插件使用记录' + '\n'
            }
            res += '#新插件使用频率\n' + extNewInterval.data + '\n'

            const cyclissity = cyclissityAnalyze()
            if (!cyclissity.success) {
                console.error(cyclissity.error)
                res += '#工作区域聚焦度\n' + '未能获取用户在该repo的工作区域聚焦度' + '\n'
            }
            res += '#工作区域聚焦度\n' + cyclissity.data + '\n'

        } else {
            return reject('Invalid user-profile type')
        }
        console.log(res)
        return resolve(res)
    })
}