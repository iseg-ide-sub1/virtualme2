import {Artifact, Edge} from "../types/artifact";
import {EdgeType} from "../../../repomap/_repoMap_/type";
import {EigenvalueDecomposition, Matrix} from "ml-matrix";
import {repoMap} from "../../core/global";
import {mergeAndDeduplicate} from "./utils";
import {
    artifactEmbedSimpLength,
    artifactEmbedSpeLength,
    historyWindowSize,
    neighborDepth,
    neighborWindowSize,
    spectralK
} from "./config";


export class ArtifactEncoder {
    private cachedEdges: Map<{ source: Artifact, target: Artifact }, Edge[]>

    constructor() {
        this.cachedEdges = new Map<{ source: Artifact, target: Artifact }, Edge[]>()
    }

    public async artifact2Embed(artifact: Artifact, historyArtifacts: Artifact[], neighborArtifacts: Artifact[], method: 'SPE' | 'SIMP'): Promise<number[]> {
        return new Promise(async (resolve, reject) => {
            if (method === 'SPE') {
                resolve(await this.artifact2EmbedSpe(artifact, historyArtifacts, neighborArtifacts))
            } else if (method === 'SIMP') {
                resolve(await this.artifact2EmbedSimp(artifact, historyArtifacts, neighborArtifacts))
            } else {
                reject("Invalid method")
            }
        })
    }

    // 对象回收时自动清除缓存
    destroy() {
        this.cachedEdges.clear()
    }

    /**
     * 构建谱特征向量
     * @param centerNode 目标节点
     * @param inputG 子图边集
     * @param k 每个边类型取前k个特征向量
     * @returns 谱嵌入向量：长度 = EdgeType数量 × k
     */
    private spectralEmbedding(centerNode: Artifact, inputG: Edge[], k: number = spectralK): number[] {
        const edgeTypes = Object.values(EdgeType);
        const nodeSet = new Set<string>();

        for (const edge of inputG) {
            nodeSet.add(edge.source.name);
            nodeSet.add(edge.target.name);
        }

        const nodes = Array.from(nodeSet);
        const nodeIndexMap = new Map<string, number>();
        nodes.forEach((name, idx) => nodeIndexMap.set(name, idx));

        const centerIdx = nodeIndexMap.get(centerNode.name);
        if (centerIdx === undefined) {
            throw new Error(`Center node not found in edge set: ${centerNode.name}
            Please check if the input graph is correct., inputG: ${inputG.map(e => e.toString())}`)
        }

        const spectralVector: number[] = [];

        for (const edgeType of edgeTypes) {
            const size = nodes.length;
            const adj = Matrix.zeros(size, size);

            for (const edge of inputG) {
                if (edge.edgeType === edgeType) {
                    const i = nodeIndexMap.get(edge.source.name)!;
                    const j = nodeIndexMap.get(edge.target.name)!;
                    adj.set(i, j, 1);
                }
            }

            const sum = adj.sum();
            if (sum === 0) {
                spectralVector.push(...Array(k).fill(0));
                continue;
            }

            let eigVectors: Matrix;
            const eig = new EigenvalueDecomposition(adj);
            eigVectors = eig.eigenvectorMatrix;

            for (let i = 0; i < k; i++) {
                const projection = eigVectors.get(centerIdx, i) ?? 0;
                spectralVector.push(projection);
            }
        }
        return spectralVector;
    }

    /**
     * 方案1：构建工件的谱嵌入向量
     * @param artifact
     * @param historyArtifacts
     * @param neighborArtifacts
     */
    private async artifact2EmbedSpe(artifact: Artifact, historyArtifacts: Artifact[], neighborArtifacts: Artifact[]): Promise<number[]> {
        return new Promise(async (resolve, reject) => {
            if (!repoMap || !repoMap.isInitialized()) {
                return reject("Repo map is not initialized")
            }

            const relatedArtifacts = [...historyArtifacts, ...neighborArtifacts]
            let G: Edge[] = []

            for (const ra of relatedArtifacts) {
                let edges: Edge[] | undefined =
                    this.cachedEdges.get({source: artifact, target: ra}) ||
                    this.cachedEdges.get({source: ra, target: artifact})
                if (!edges) {
                    try {
                        edges = await repoMap.getLinkInfo(artifact, ra, neighborDepth)
                        this.cachedEdges.set({source: artifact, target: ra}, edges)
                    } catch (err) {
                        return reject(err)
                    }
                }
                G.push(...edges)
            }
            G = mergeAndDeduplicate<Edge>(G, [], (a, b) => a.equals(b))

            // 如果G中不包含artifact，则返回空向量
            if (!G.some(e => e.source.equals(artifact) || e.target.equals(artifact))) {
                console.warn(`Artifact ${artifact.name} has no neighbor in the graph, skip it.`)
                return resolve(Array(artifactEmbedSpeLength).fill(0))
            }

            // 构建谱嵌入向量
            try {
                const spectralVector = this.spectralEmbedding(artifact, G)
                resolve(spectralVector)
            } catch (err) {
                reject(err)
            }
        })
    }


    /**
     * 方案2：构建工件的简单嵌入向量，直接统计每个类型边的数量[与历史工件的的各种类型边数量，与邻居工件的各种类型边数量]
     * @returns 简单嵌入向量
     * @param artifact
     * @param historyArtifacts
     * @param neighborArtifacts
     */
    private async artifact2EmbedSimp(artifact: Artifact, historyArtifacts: Artifact[], neighborArtifacts: Artifact[]): Promise<number[]> {
        return new Promise(async (resolve, reject) => {
            if (!repoMap || !repoMap.isInitialized()) {
                return reject("Repo map is not initialized")
            }
            if (historyArtifacts.length > historyWindowSize) {
                console.warn(`historyArtifacts length ${historyArtifacts.length} exceeds pastArtifactWindowSize ${historyWindowSize}, use the first ${historyWindowSize} artifacts.`)
                historyArtifacts = historyArtifacts.slice(historyArtifacts.length - historyWindowSize)
            }
            if (neighborArtifacts.length > neighborWindowSize) {
                console.warn(`neighborArtifacts length ${neighborArtifacts.length} exceeds neighborWindowSize ${neighborWindowSize}, use the first ${neighborWindowSize} artifacts.`)
                neighborArtifacts = neighborArtifacts.slice(neighborArtifacts.length - neighborWindowSize)
            }

            const edgeTypes = Object.values(EdgeType)
            const HistoryEmbedVector: number[] = new Array<number>(edgeTypes.length).fill(0)
            const NeighborEmbedVector: number[] = new Array<number>(edgeTypes.length).fill(0)

            let historyEdges: Edge[] = []
            for (const ha of historyArtifacts) {
                let historyEdgesTmp: Edge[] | undefined =
                    this.cachedEdges.get({source: artifact, target: ha}) ||
                    this.cachedEdges.get({source: ha, target: artifact})
                if (!historyEdgesTmp) {
                    try {
                        historyEdgesTmp = await repoMap.getLinkInfo(artifact, ha, neighborDepth)
                    } catch (err) {
                        return reject(err)
                    }
                    this.cachedEdges.set({source: artifact, target: ha}, historyEdgesTmp)
                }
                historyEdges.push(...historyEdgesTmp)
            }
            historyEdges = mergeAndDeduplicate<Edge>(historyEdges, [], (a, b) => a.equals(b))
            for (const he of historyEdges) {
                const idx = edgeTypes.indexOf(he.edgeType)
                if (idx !== -1) {
                    HistoryEmbedVector[idx] += 1
                }
            }

            let neighborEdges: Edge[] = []
            for (const na of neighborArtifacts) {
                let neighborEdgesTmp: Edge[] | undefined =
                    this.cachedEdges.get({source: artifact, target: na}) ||
                    this.cachedEdges.get({source: na, target: artifact})
                if (!neighborEdgesTmp) {
                    try {
                        neighborEdgesTmp = await repoMap.getLinkInfo(artifact, na, neighborDepth)
                    } catch (err) {
                        return reject(err)
                    }
                    this.cachedEdges.set({source: artifact, target: na}, neighborEdgesTmp)
                }
                neighborEdges.push(...neighborEdgesTmp)
            }
            neighborEdges = mergeAndDeduplicate<Edge>(neighborEdges, [], (a, b) => a.equals(b))
            for (const ne of neighborEdges) {
                const idx = edgeTypes.indexOf(ne.edgeType)
                if (idx !== -1) {
                    NeighborEmbedVector[idx] += 1
                }
            }

            // 将历史工件和邻居工件的嵌入向量归一化到[0, 5]
            const max = Math.max(...HistoryEmbedVector.concat(NeighborEmbedVector))
            if (max > 0) {
                HistoryEmbedVector.forEach((v, i) => HistoryEmbedVector[i] = v / max * 5)
                NeighborEmbedVector.forEach((v, i) => NeighborEmbedVector[i] = v / max * 5)
            }

            let embedVector = [...HistoryEmbedVector, ...NeighborEmbedVector]
            if (embedVector.length !== artifactEmbedSimpLength) {
                console.warn(`embedVector length ${embedVector.length} is not equal to artifactEmbedSimpLength ${artifactEmbedSimpLength}, use the first ${artifactEmbedSimpLength} values.`)
                embedVector = embedVector.slice(0, artifactEmbedSimpLength)
            }
            resolve(embedVector)
        })
    }


}


