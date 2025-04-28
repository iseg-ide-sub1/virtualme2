import Graph from "graphology";
import { LanguageName } from "../utils/treeSitter";
import * as fs from 'fs';
import { IDE } from "..";
import path from "path";
import { RefreshIndexResults } from "../indexing/types";
import { AstNodeHandler, CodeNode, EdgeType, MapEdge, MapNode, NodeSummary, NodeType, StructNode } from "./type";
import { javaAstNodeHandler } from "./handlers/JavaHandler";
import _ from "lodash";
import { pythonAstNodeHandler } from "./handlers/PythonHandler";
import * as repoMapConfig from "../repoMapConfig"
import { getRepoMapFilePath } from "../utils/paths";
import { ArtifactType, Artifact, Edge } from "../../virtualme/base/types/artifact";

// if value is undefined, check branch save to fix
const astNodeHandlers = new Map<LanguageName, AstNodeHandler>([
    [LanguageName.JAVA, javaAstNodeHandler],
    [LanguageName.PYTHON, pythonAstNodeHandler],
])
const NAME_PATHS_RECORD: string = "namePathsRecord";
const EXTERNAL_PACKAGES: string = "externalPackages";
export const REPOMAP_INIT_ERROR: Error = new Error("RepoMap not initialized");

export const artifactTypeConverter: Map<ArtifactType, NodeType> = new Map([
    [ArtifactType.File, NodeType.FILE],
    [ArtifactType.Class, NodeType.CLASS],
    [ArtifactType.Method, NodeType.METHOD],
    [ArtifactType.Field, NodeType.FIELD],
])

export const mapNodeTypeConverter: Map<NodeType, ArtifactType> = new Map([
    [NodeType.FILE, ArtifactType.File],
    [NodeType.CLASS, ArtifactType.Class],
    [NodeType.METHOD, ArtifactType.Method],
    [NodeType.FIELD, ArtifactType.Field],
])

export class _RepoMap_ {

    public static async create(mapPath?: string): Promise<_RepoMap_> {
        const instance = new _RepoMap_();
        instance.loadMap(mapPath);
        instance.makeSureAttribute();
        return instance;
    }

    private graph = new Graph();
    private nodeAdded: MapNode[] = [];

    private constructor() { }

    private makeSureAttribute(): void {
        if (!this.graph.hasAttribute(NAME_PATHS_RECORD)) {
            this.graph.setAttribute(NAME_PATHS_RECORD, {});
        }
        if (!this.graph.hasAttribute(EXTERNAL_PACKAGES)) {
            this.graph.setAttribute(EXTERNAL_PACKAGES, []);
        }
    }

    private addNamePath(code: MapNode): void {
        if (CodeNode.isCodeNode(code)) {
            const codeNode = code as CodeNode;
            const name = codeNode.name;
            const path = codeNode.path;
            this.graph.updateAttribute(NAME_PATHS_RECORD, (record: Record<string, string[]>) => {
                // 排除 Object 原生属性和成员方法的影响
                if (!(record[name] instanceof Array)) {
                    record[name] = [];
                }
                if (!record[name].includes(path)) {
                    record[name].push(path);
                }
                return record;
            })
        }
    }

    private name2nodes(name: string): MapNode[] {
        const namePathsRecord = this.graph.getAttribute(NAME_PATHS_RECORD);
        const paths: string[] | undefined = namePathsRecord[name];
        if (!paths) { return []; }
        paths.push(name); // include StructNode
        return paths.map(path => new MapNode(name, path));
    }

    public hasNode(node: MapNode): boolean {
        return this.graph.hasNode(MapNode.getKey(node));
    }

    public addNode(node: MapNode): void {
        if (this.graph.hasNode(MapNode.getKey(node))) {
            return;
        }
        try {
            this.graph.addNode(MapNode.getKey(node), node);
            this.nodeAdded.push(node);
            this.addNamePath(node);
        } catch (e) {
            console.error("error in addNode\nnode:", node, "\nerror:", e)
            console.trace("trace");
        }
    }

    public updateNode(node: MapNode): void {
        this.graph.updateNode(MapNode.getKey(node), () => { return node; });
        this.addNamePath(node);
    }

    public key2node(key: string): MapNode {
        const [name, path] = key.split("@");
        return new MapNode(name, path);
    }

    public addEdge(source: MapNode, target: MapNode, edgeType: EdgeType): void {
        if (this.graph.hasEdge(MapNode.getKey(source), MapNode.getKey(target))) {
            return;
        }
        try {
            this.graph.addEdge(MapNode.getKey(source), MapNode.getKey(target), { type: edgeType });
        } catch (e) {
            console.error("error in addEdge\nsource:", source, "\ntarget:", target, "\nedgeType:", edgeType, "\nerror:", e);
            console.trace("trace");
        }
    }

    public deleteIllusion(): void {
        const toDeleteNodes: MapNode[] = this.nodeAdded.filter(node => !this.getWholeNode(node).type);
        toDeleteNodes.forEach((node) => { this.deleteNode(node) })
        this.nodeAdded = [];
    }

    public addUpperNodes(filepath: string): void {
        const wholeNodeQueue: MapNode[] = [this.getWholeNode(new MapNode(filepath, filepath))];
        while (wholeNodeQueue.length > 0) {
            const wholeNode = wholeNodeQueue.shift()!;
            const lowerNodes = this.getNeighbors(wholeNode, repoMapConfig.parentChildEdgeTypes, true).map(neighbor => this.getWholeNode(neighbor));
            lowerNodes.forEach(lowerNode => {
                lowerNode.upperNodes = [...wholeNode.upperNodes, new NodeSummary(wholeNode.name, wholeNode.type!, MapNode.getWholeLineBegin(wholeNode), MapNode.getWholwLineEnd(wholeNode))];
                this.updateNode(lowerNode);
                wholeNodeQueue.push(lowerNode);
            });
        }
    }

    public async printMap(mapPath?: string): Promise<void> {
        if (!mapPath) { mapPath = getRepoMapFilePath(); }
        if (!mapPath) { throw REPOMAP_INIT_ERROR; }
        const jsonString = JSON.stringify(this.graph.export(), null, 2);
        if (!fs.existsSync(path.dirname(mapPath))) {
            fs.mkdirSync(path.dirname(mapPath), { recursive: true });
        }
        fs.writeFileSync(mapPath, jsonString, 'utf-8');
    }

    private loadMap(mapPath?: string): void {
        if (!mapPath) { mapPath = getRepoMapFilePath(); }
        if (!mapPath) { throw REPOMAP_INIT_ERROR; }
        if (fs.existsSync(mapPath)) {
            const jsonString = fs.readFileSync(mapPath, 'utf-8');
            const serialized = JSON.parse(jsonString);
            this.graph.import(serialized);
        }
    }

    public deleteNode(node: MapNode) {
        this.graph.dropNode(MapNode.getKey(node));
    }

    public deleteNodeRecursively(node: MapNode): MapEdge[] {
        this.getNeighbors(node, repoMapConfig.parentChildEdgeTypes, true).forEach(neighbor => {
            this.deleteNodeRecursively(neighbor);
        })
        const edges = this.getEdges(node);
        this.deleteNode(node);
        return edges;
    }

    public updateStruct(results: RefreshIndexResults): MapEdge[] {
        const deletedFiles: string[] = [];
        const deletedEdges: MapEdge[] = [];
        results.del.forEach(({ path: filepath }) => {
            deletedEdges.push(...this.deleteNodeRecursively(new MapNode(filepath, filepath)));
            deletedFiles.push(filepath);
        });
        results.compute.forEach(({ path: fielPath }) => {
            const fileNode = new StructNode(fielPath, fielPath, NodeType.FILE);
            this.updateNode(fileNode);
        })
        return deletedEdges.reduce((lostEdges: MapEdge[], edge): MapEdge[] => {
            if (!deletedFiles.includes(edge.from.path) && deletedFiles.includes(edge.to.path)) {
                lostEdges.push(edge);
            }
            return lostEdges;
        }, [])
    }

    /**
     * @param forward available only when edgeTypes is defined,
     * undefined: all edges,
     * true: from source to target,
     * false: from target to source
     */
    public getNeighbors(node: MapNode, edgeTypes?: EdgeType[], forward?: boolean): MapNode[] {
        return edgeTypes
            ? this.graph.reduceEdges(MapNode.getKey(node), (neighbors: MapNode[], _, attributes, source, target) => {
                if (edgeTypes.includes(attributes.type)) {
                    if (forward === undefined) { neighbors.push(this.key2node(source === MapNode.getKey(node) ? target : source)); }
                    else if (forward) { if (source === MapNode.getKey(node)) { neighbors.push(this.key2node(target)); } }
                    else { if (target === MapNode.getKey(node)) { neighbors.push(this.key2node(target)); } }
                }
                return neighbors;
            }, [])
            : this.graph.neighbors(MapNode.getKey(node)).map((key) => (
                this.key2node(key)
            ));
    }

    /**
     * @param forward available only when edgeTypes is defined,
     * undefined: all edges,
     * true: from source to target,
     * false: from target to source
     */
    public getEdges(node: MapNode, edgeTypes?: EdgeType[], forward?: boolean): MapEdge[] {
        return edgeTypes
            ? this.graph.reduceEdges(MapNode.getKey(node), (edges: MapEdge[], _, attributes, source, target) => {
                if (edgeTypes.includes(attributes.type)) {
                    if (forward === undefined) { edges.push(new MapEdge(this.key2node(source), this.key2node(target), attributes.type)); }
                    else if (forward) { if (source === MapNode.getKey(node)) { edges.push(new MapEdge(this.key2node(source), this.key2node(target), attributes.type)); } }
                    else { if (target === MapNode.getKey(node)) { edges.push(new MapEdge(this.key2node(source), this.key2node(target), attributes.type)); } }
                }
                return edges;
            }, [])
            : this.graph.mapEdges(MapNode.getKey(node), (_, attributes, source, target) => new MapEdge(this.key2node(source), this.key2node(target), attributes.type));
    }

    public getWholeNode(node: MapNode): MapNode {
        return this.getWholeNodeByKey(MapNode.getKey(node));
    }

    public getWholeNodeByKey(key: string): MapNode {
        return this.graph.getNodeAttributes(key) as MapNode;
    }

    private searchNode(name: string, path?: string): MapNode[] {
        const nodes: MapNode[] = [];
        if (path) {
            const node: MapNode | undefined = this.getWholeNode(new MapNode(name, path));
            if (node) { nodes.push(node); }
        } else { nodes.push(...this.name2nodes(name)); }
        return nodes.filter(node => this.hasNode(node));
    }

    private artifact2node(artifact: Artifact): MapNode {
        const path = artifact.hierarchy?.[0].name;
        if (!path) { throw new Error('artifact has no file hierarchy'); }
        return this.searchNode(artifact.name, path)[0];
    }

    private node2artifact(node: MapNode): Artifact {
        node = this.getWholeNode(node);
        return new Artifact(
            node.name,
            mapNodeTypeConverter.get(node.type!)!,
            MapNode.getWholeLineBegin(node),
            MapNode.getWholwLineEnd(node),
            node.upperNodes.map(upperNode => new Artifact(
                upperNode.name,
                mapNodeTypeConverter.get(upperNode.type!)!,
                upperNode.lineBegin,
                upperNode.lineEnd,
            ))
        )
    }

    private mapEdge2edge(mapEdge: MapEdge): Edge {
        return new Edge(this.node2artifact(mapEdge.from), this.node2artifact(mapEdge.to), mapEdge.type);
    }

    private upDownExpand(node: MapNode): MapNode[] {
        const upperNodes = this.getWholeNode(node).upperNodes.map(upperNode => new MapNode(upperNode.name, node.path));
        const lowerNodes: MapNode[] = [...this.getNeighbors(node, repoMapConfig.parentChildEdgeTypes, true)];
        for (let i = 0; i < lowerNodes.length; i++) { lowerNodes.push(...this.getNeighbors(lowerNodes[i], repoMapConfig.parentChildEdgeTypes, true)) }
        return [...upperNodes, ...lowerNodes];
    }

    public async getRefs(artifact: Artifact, maxDepth: number): Promise<Artifact[]> {
        const src = this.artifact2node(artifact);
        const queue: { node: MapNode, depth: number }[] = [src, ...this.upDownExpand(src)].map(node => ({ node, depth: 0 }));
        for (let i = 0; i < queue.length; i++) {
            const { node, depth } = queue[i];
            if (depth < maxDepth) {
                [
                    ...this.getNeighbors(node, repoMapConfig.referenceEdgeTypes, true),
                    ...this.getNeighbors(node, repoMapConfig.referenceEdgeTypes, false)
                ].flatMap(neighbor => [neighbor, ...this.upDownExpand(neighbor)]).forEach(node => {
                    if (!queue.some(item => MapNode.equals(item.node, node))) {
                        queue.push({ node, depth: depth + 1 });
                    }
                })
            }
        }
        return queue.splice(1).map(item => this.node2artifact(item.node));
    }

    public async getLinkInfo(a: Artifact, b: Artifact, maxDepth: number): Promise<Edge[]> {
        const aNode = this.artifact2node(a);
        const bNode = this.artifact2node(b);
        const edges: MapEdge[] = [];
        const queue: { node: MapNode, depth: number, preIndex: number, mapEdge?: MapEdge }[] = [{ node: aNode, depth: 0, preIndex: 0 }];
        for (let i = 0; i < queue.length; i++) {
            const { node, depth } = queue[i];
            if (MapNode.equals(node, bNode)) {
                continue;
            }
            if (depth < maxDepth) {
                this.getEdges(node).forEach(mapEdge => {
                    const nextNode = MapNode.equals(mapEdge.from, node) ? mapEdge.to : mapEdge.from;
                    if (!queue.some(item => MapNode.equals(item.node, nextNode))) {
                        queue.push({ node: nextNode, depth: depth + 1, preIndex: i, mapEdge });
                    }
                })
            }
        }
        const indexes: number[] = [];
        for (let i = queue.length - 1; i >= 0; i--) {
            const { node, preIndex } = queue[i];
            if (MapNode.equals(node, bNode)) {
                indexes.push(i);
                indexes.push(preIndex);
            } else if (indexes.includes(i)) {
                indexes.push(preIndex);
            }
        }
        return indexes.reduce((subGraph: Edge[], index: number): Edge[] => {
            const { mapEdge } = queue[index];
            if (mapEdge) {
                subGraph.push(this.mapEdge2edge(mapEdge));
            }
            return subGraph;
        }, []);
    }

    public addExternalPackages(externalPackages: Set<string>): void {
        this.graph.updateAttribute(EXTERNAL_PACKAGES, (value: string[]) => [...new Set([...value, ...externalPackages])]);
    }

    public getExternalPackages(): string[] {
        return this.graph.getAttribute(EXTERNAL_PACKAGES);
    }

    public copyEdges(from: MapNode, to: MapNode): void {
        try {
            this.getEdges(from).forEach(mapEdge => {
                MapNode.equals(mapEdge.from, from)
                    ? this.addEdge(to, mapEdge.to, mapEdge.type)
                    : this.addEdge(mapEdge.from, to, mapEdge.type);
            });
        } catch (e) {
            console.trace(e);
        }
    }
}
