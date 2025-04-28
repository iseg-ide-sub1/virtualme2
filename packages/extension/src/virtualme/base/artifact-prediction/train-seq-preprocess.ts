import {LogItem} from "../types/log-item";
import {repoMap} from "../../core/global";
import {ArtifactFrame, Frame} from "./Frame";
import {EventType} from "../types/event-types";
import {getInfoFromCommand} from "../../api/user-profile/repo/terminal";
import {Artifact, ArtifactType} from "../types/artifact";
import {
    candidateMaxNum,
    deleteFeedbackThreshold,
    historyWindowSize,
    maxSeqLen,
    neighborDepth,
    neighborWindowSize, predArtifactTypes, predEventTypes
} from "./config";
import {mergeAndDeduplicate, removeConsecutiveDuplicates} from "./utils";
import {ArtifactEncoder} from "./artifact2embed";


function getFeedback(log: LogItem, deleteLength: number): { feedback: number, deleteLength: number } {
    let feedback = 1

    if (log.eventType === EventType.ExecuteTerminalCommand &&
        log.context &&
        log.context.content &&
        log.context.content.before &&
        log.context.content.after) {

        const cmd = log.context.content.before;
        const output = log.context.content.after;

        const success = getInfoFromCommand(cmd, output).success
        if (!success) {
            feedback = 0
        }
    }

    if (log.eventType === EventType.DeleteTextDocument &&
        log.context &&
        log.context.content &&
        log.context.content.after &&
        log.context.content.before) {

        deleteLength += Math.abs(log.context.content.before.length - log.context.content.after.length)

        if (deleteLength > deleteFeedbackThreshold) {
            feedback = 0
            deleteLength = 0
        }
    }

    return {
        feedback,
        deleteLength
    }
}

function getPredLevelArtifact(artifact: Artifact): Artifact | null {
    if (!artifact || !artifact.hierarchy) {
        return null
    }
    //倒序遍历hierarchy，找到第一个predLevel的artifact
    for (let i = artifact.hierarchy.length - 1; i >= 0; i--) {
        const a = artifact.hierarchy[i]
        if (predArtifactTypes.includes(a.type)) {
            a.hierarchy = [artifact.hierarchy[0]] // 保留当前artifact的file级hierarchy信息
            return a
        }
    }
    return null
}

export async function generateTrainData(logs: LogItem[], encode: 'SPE' | 'SIMP' = 'SIMP'): Promise<any> {
    return new Promise(async (resolve, reject) => {
            if (!repoMap || !repoMap.isInitialized()) {
                return reject("Repo map is not initialized")
            }
            if (!logs || logs.length === 0) {
                return reject("No logs found")
            }
            if (logs.length < maxSeqLen) {
                return reject("Logs length is less than maxSeqLen")
            }
            const artifactEncoder = new ArtifactEncoder()

            let trainData: Frame[] = new Array<Frame>();
            let deleteLength = 0

            let historyArtifacts: ArtifactFrame[] = new Array<ArtifactFrame>()
            let neighborArtifacts: ArtifactFrame[] = new Array<ArtifactFrame>()
            let candidateArtifacts: ArtifactFrame[] = new Array<ArtifactFrame>()

            for (const log of logs) {
                const timestamp = log.timeStamp;
                const eventType = log.eventType;
                if (!predEventTypes.includes(eventType)) {
                    continue
                }

                const artifact = getPredLevelArtifact(log.artifact)
                let artifactEmbed: number[] = []

                const feedbackRet = getFeedback(log, deleteLength)
                deleteLength = feedbackRet.deleteLength
                const feedback = feedbackRet.feedback

                //维护工件历史
                historyArtifacts = removeConsecutiveDuplicates<ArtifactFrame>(historyArtifacts, (a, b) => a.equals(b))
                historyArtifacts = historyArtifacts.slice(historyArtifacts.length - historyWindowSize)

                if (!artifact) {
                    // 当前工件为空或不是预测支持的类型，就复用之前的historyArtifacts和neighborArtifacts来构建候选工件和候选嵌入
                    artifactEmbed = []
                    candidateArtifacts = historyArtifacts.slice(historyArtifacts.length - candidateMaxNum)
                } else {
                    // 获取邻居artifact, 并过滤掉不是预测支持的类型
                    try {
                        let neighbors_ref = await repoMap.getRefs(artifact, neighborDepth)
                        for (const neighbor of neighbors_ref) {
                            if (predArtifactTypes.includes(neighbor.type))
                                neighborArtifacts.push(new ArtifactFrame(neighbor, []))
                        }
                    } catch (err) {
                        return reject(err)
                    }
                    neighborArtifacts = neighborArtifacts.slice(neighborArtifacts.length - neighborWindowSize) //取邻居窗口大小个邻居

                    // 候选工件为历史工件和邻居工件的并集
                    candidateArtifacts = mergeAndDeduplicate<ArtifactFrame>(neighborArtifacts, historyArtifacts, (a, b) => a.equals(b))
                    if (candidateArtifacts.length > candidateMaxNum) {
                        console.warn(`candidateArtifacts length ${candidateArtifacts.length} exceeds candidateMaxNum ${candidateMaxNum}, use the first ${candidateMaxNum} candidates.`)
                        candidateArtifacts = candidateArtifacts.slice(candidateArtifacts.length - candidateMaxNum)
                    }

                    // 构建artifact的嵌入向量
                    try {
                        artifactEmbed = await artifactEncoder.artifact2Embed(
                            artifact,
                            historyArtifacts.map(a => a.artifact),
                            neighborArtifacts.map(a => a.artifact),
                            encode)
                    } catch (err) {
                        return reject(err)
                    }

                    historyArtifacts.push(new ArtifactFrame(artifact, artifactEmbed))
                }

                // 构建候选工件的谱嵌入向量
                for (const ca of candidateArtifacts) {
                    try {
                        ca.artifactEmbed = await artifactEncoder.artifact2Embed(
                            ca.artifact,
                            historyArtifacts.map(a => a.artifact),
                            neighborArtifacts.map(a => a.artifact),
                            encode)
                    } catch (err) {
                        return reject(err)
                    }
                }

                // 构建训练数据帧
                const frame = new Frame(
                    timestamp,
                    eventType,
                    feedback,
                    artifact,
                    artifactEmbed.length > 0 ? artifactEmbed : null,
                    candidateArtifacts.length > 0 ? candidateArtifacts.map(a => a.artifact) : null,
                    candidateArtifacts.length > 0 ? candidateArtifacts.map(a => a.artifactEmbed) : null
                )
                trainData.push(frame)
            }

            resolve(trainData)
        }
    )
}