import Parser from "web-tree-sitter"
import { MapNode, AstNodeHandler, MatchesHandler, EdgeType, CodeNode, NodeType, GetAstNodeName } from "../type";
import { _RepoMap_ } from "../_RepoMap_";
import * as path from "path";
import * as fs from "fs";
import { hasAncestor } from "../utils";
import { LanguageName } from "../../utils/treeSitter";

enum PythonAstNodeType {
    CLASS_DEFINITION = "class_definition",
    FUNCTION_DEFINITION = "function_definition",
}

const pythonGetAstNodeName: GetAstNodeName = (astNode: Parser.SyntaxNode) => {
    return astNode.namedChildren[0].text;
};

export const pythonAstNodeHandler: AstNodeHandler = new Map([
    [PythonAstNodeType.CLASS_DEFINITION, pythonGetAstNodeName],
    [PythonAstNodeType.FUNCTION_DEFINITION, pythonGetAstNodeName],
])

export const pythonMatchesHandler: MatchesHandler = (_repoMap_: _RepoMap_, matches: Parser.QueryMatch[], filepath: string): void => {
    const language: LanguageName = LanguageName.PYTHON;

    const userDefinedContexts: Record<string, MapNode> = {}; // 存储用户定义的上下文
    const currentFileNode = new MapNode(filepath, filepath);
    const asRecord: Record<string, string> = {}; // 存储变量别名到原名的映射

    function importHandler(importStatement: string) {
        const identifiers = importStatement.split(".").slice(1).map(identifier => identifier === "" ? ".." : identifier);
        let identifier = identifiers[identifiers.length - 1];
        const matches = /(.*) +as +(.*)/.exec(identifier);
        if (matches) {
            identifier = matches[2];
            asRecord[matches[2]] = matches[1];
        }

        for (let i = 0; i < identifiers.length; i++) {
            const files = identifiers.slice(0, identifiers.length - i);
            const importFilePath = path.join(filepath, "..", path.join(...files) + ".py");
            if (fs.existsSync(importFilePath)) {
                const importNode = new MapNode(identifier, importFilePath)
                _repoMap_.addNode(importNode);
                userDefinedContexts[identifier] = importNode;
                _repoMap_.addEdge(currentFileNode, importNode, EdgeType.IMPORT);
                break;
            }
        }
    }

    function getRelationNode(identifier: string): MapNode {
        if (userDefinedContexts[asRecord[identifier] || identifier]) { return userDefinedContexts[asRecord[identifier] || identifier]; }
        const node = new MapNode(identifier, filepath);
        _repoMap_.addNode(node);
        return node;
    }

    for (const match of matches) {
        const pattern = match.pattern;

        // class_definition
        if (pattern === 0) {
            const astNode = match.captures.find(c => c.name === "definition")?.node;
            const name = match.captures.find(c => c.name === "name")?.node.text;
            if (!astNode || !name) { continue; }
            const lineBegin = astNode.startPosition.row;
            const lineEnd = astNode.endPosition.row;
            const classNode = new CodeNode(name, filepath, NodeType.CLASS, language, lineBegin, lineEnd);
            _repoMap_.updateNode(classNode);
            _repoMap_.addEdge(currentFileNode, classNode, EdgeType.ENCAPSULATE);
            const superclasses = match.captures.find(c => c.name === "superclasses")?.node.text;
            if (superclasses) {
                superclasses.slice(1, -1).split(",").forEach(superclass => { _repoMap_.addEdge(classNode, getRelationNode(superclass), EdgeType.EXTEND); });
            }
        }

        // function_definition
        if (pattern === 1) {
            const astNode = match.captures.find(c => c.name === "definition")?.node;
            const name = match.captures.find(c => c.name === "name")?.node.text;
            if (!astNode || !name) { continue; }
            const lineBegin = astNode.startPosition.row;
            const lineEnd = astNode.endPosition.row;
            const functionNode = new CodeNode(name, filepath, NodeType.METHOD, language, lineBegin, lineEnd);
            _repoMap_.updateNode(functionNode);
            const returnType = match.captures.find(c => c.name === "return_type")?.node.text;
            if (returnType) { _repoMap_.addEdge(functionNode, getRelationNode(returnType), EdgeType.TYPEOF); }
            const classAstNode = hasAncestor([PythonAstNodeType.CLASS_DEFINITION], astNode);
            const fileOrClassNode = classAstNode ? getRelationNode(pythonGetAstNodeName(classAstNode)!) : currentFileNode;
            _repoMap_.addEdge(fileOrClassNode, functionNode, EdgeType.OWN);
        }

        // import_from_statement
        if (pattern === 2) {
            const moduleName = match.captures.find(c => c.name === "module_name")?.node.text;
            const name = match.captures.find(c => c.name === "name")?.node.text;
            if (!moduleName || !name) { continue; }
            importHandler(`${moduleName}.${name}`);
        }

        // method_call
        if (pattern === 3) {
            const astNode = match.captures.find(c => c.name === "call")?.node;
            const functionName = match.captures.find(c => c.name === "function")?.node.text.split(".").pop();
            if (!astNode || !functionName) { continue; }
            const functionOrClassAstNode = hasAncestor([PythonAstNodeType.CLASS_DEFINITION, PythonAstNodeType.FUNCTION_DEFINITION], astNode);
            if (!functionOrClassAstNode) { continue; }
            _repoMap_.addEdge(getRelationNode(pythonGetAstNodeName(functionOrClassAstNode)!), getRelationNode(functionName), EdgeType.INVOKE);
        }

        // global_viariable
        if (pattern === 4) {
            const astNode = match.captures.find(c => c.name === "assignment")?.node;
            const name = match.captures.find(c => c.name === "name")?.node.text;
            if (!astNode || !name) { continue; }
            const lineBegin = astNode.startPosition.row;
            const lineEnd = astNode.endPosition.row;
            const node = new CodeNode(name, filepath, NodeType.FIELD, language, lineBegin, lineEnd);
            _repoMap_.updateNode(node);
            _repoMap_.addEdge(currentFileNode, node, EdgeType.DEFINE);
        }
    }
}
