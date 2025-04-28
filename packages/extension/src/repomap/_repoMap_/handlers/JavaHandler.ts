import Parser from "web-tree-sitter"
import { CodeNode, EdgeType, MapNode, NodeType, AstNodeHandler, GetAstNodeName, MatchesHandler } from "../type";
import path from "path";
import * as fs from "fs";
import { hasNamedChild, hasAncestor } from "../utils";
import { _RepoMap_ } from "../_RepoMap_";
import { LanguageName } from "../../utils/treeSitter";

let javaPackageBasePath: string | undefined = undefined;

enum JavaAstNodeType {
    INTERFACE_DECLARATION = "interface_declaration",
    CLASS_DECLARATION = "class_declaration",
    METHOD_DECLARATION = "method_declaration",
}

const javaGetAstNodeName: GetAstNodeName = (node: Parser.SyntaxNode) => {
    return hasNamedChild("identifier", node)?.text;
}

export const javaAstNodeHandler: AstNodeHandler = new Map([
    [JavaAstNodeType.INTERFACE_DECLARATION, javaGetAstNodeName],
    [JavaAstNodeType.CLASS_DECLARATION, javaGetAstNodeName],
    [JavaAstNodeType.METHOD_DECLARATION, javaGetAstNodeName],
])

export const javaMatchesHandler: MatchesHandler = (_repoMap_: _RepoMap_, matches: Parser.QueryMatch[], filepath: string): void => {
    const language: LanguageName = LanguageName.JAVA;

    const userDefinedContexts: Record<string, MapNode> = {}; // 存储用户定义的上下文
    const importContexts: string[] = []; // 存储导入的上下文
    const currentFile = new MapNode(filepath, filepath);
    const useContexts: Record<string, MapNode[]> = {}; // 存储变量使用上下文

    /**
     * 解析导入上下文，获取关系节点
     * @param identifier 标识符
     * @param autoAdd 是否自动添加
     * @param type 节点类型
     * @returns 关系节点
     */
    function getRelationNode(identifier: string, autoAdd: boolean, type?: NodeType): MapNode | undefined {
        if (userDefinedContexts[identifier]) {
            // 排除原生方法 toString 和 valueOf 等的干扰
            if (userDefinedContexts[identifier] instanceof MapNode) {
                return userDefinedContexts[identifier];
            }
        } else if (!importContexts.includes(identifier)) {
            const relationNode = new MapNode(identifier, filepath);
            if (!_repoMap_.hasNode(relationNode)) {
                if (!autoAdd) {
                    return undefined;
                }
                _repoMap_.addNode(relationNode);
            }
            return relationNode;
        } else {
            // 其他依赖中的代码工件
            return undefined;
        }
    }

    for (const match of matches) {
        const pattern = match.pattern;

        // 处理类定义
        if (pattern === 0) {
            const classCapture = match.captures.find(c => c.name === "definition.class");
            const classNameCapture = match.captures.find(c => c.name === "name.definition.class");
            const superclassCapture = match.captures.find(c => c.name === "superclassName");
            const interfacesCapture = match.captures.filter(c => c.name === "interface_name");

            const className = classNameCapture?.node.text || null;
            const superclass = superclassCapture?.node.text || null;

            const lineBegin = classCapture?.node.startPosition.row || 0; // 如果没有定义，默认为 0
            const lineEnd = classCapture?.node.endPosition.row || 0;

            if (className) {
                const classNode = new CodeNode(className, filepath, NodeType.CLASS, language, lineBegin, lineEnd);

                // 添加类节点到图
                _repoMap_.updateNode(classNode);

                // 添加继承关系
                if (superclass) {
                    const superclassNode = getRelationNode(superclass, true, NodeType.CLASS);
                    if (superclassNode) {
                        _repoMap_.addEdge(classNode, superclassNode, EdgeType.EXTEND);
                    }
                }

                // 添加实现接口关系
                for (const capture of interfacesCapture) {
                    const interfaceName = capture.node.text;
                    const interfaceNode = getRelationNode(interfaceName, true, NodeType.INTERFACE);
                    if (interfaceNode) {
                        _repoMap_.addEdge(classNode, interfaceNode, EdgeType.IMPLEMENT);
                    }
                }

                _repoMap_.addEdge(currentFile, classNode, EdgeType.ENCAPSULATE);
            }
        }

        // 处理方法定义
        if (pattern === 1) {
            const methodCapture = match.captures.find(c => c.name === "definition.method");
            const methodNameCapture = match.captures.find(c => c.name === "name.definition.method");
            const returnTypeCapture = match.captures.find(c => c.name === "return_type");

            const methodName = methodNameCapture?.node.text || null;
            const returnType = returnTypeCapture?.node.text || null;

            const lineBegin = methodCapture?.node.startPosition.row || 0; // 如果没有定义，默认为 0
            const lineEnd = methodCapture?.node.endPosition.row || 0;

            if (methodName) {
                const methodNode = new CodeNode(methodName, filepath, NodeType.METHOD, language, lineBegin, lineEnd);
                _repoMap_.updateNode(methodNode);

                const methodAstNode = methodCapture?.node;
                if (methodAstNode) {
                    const classOrInterfaceAstNode = hasAncestor([JavaAstNodeType.CLASS_DECLARATION, JavaAstNodeType.INTERFACE_DECLARATION], methodAstNode);
                    if (classOrInterfaceAstNode) {
                        const classOrInterfaceName = javaGetAstNodeName(classOrInterfaceAstNode);
                        if (classOrInterfaceName) {
                            const classOrInterfaceNode = new MapNode(classOrInterfaceName, filepath);
                            _repoMap_.addEdge(classOrInterfaceNode, methodNode, EdgeType.OWN);
                        }
                    }
                }

                if (returnType) {
                    const returnTypeNode = getRelationNode(returnType, true, NodeType.CLASS);
                    if (returnTypeNode) {
                        _repoMap_.addEdge(methodNode, returnTypeNode, EdgeType.TYPEOF);
                    }
                }
            }
        }

        // 处理接口定义
        if (pattern === 2) {
            const interfaceCapture = match.captures.find(c => c.name === "definition.interface");
            const interfaceNameCapture = match.captures.find(c => c.name === "name.definition.interface");
            const extendsNameCaptures = match.captures.filter(c => c.name === "interface_name");

            const interfaceName = interfaceNameCapture?.node.text || null;

            const lineBegin = interfaceCapture?.node.startPosition.row || 0; // 如果没有定义，默认为 0
            const lineEnd = interfaceCapture?.node.endPosition.row || 0;

            if (currentFile && interfaceName) {
                // 添加接口节点到图
                const interfaceNode = new CodeNode(interfaceName, filepath, NodeType.INTERFACE, language, lineBegin, lineEnd);
                _repoMap_.updateNode(interfaceNode);

                for (const capture of extendsNameCaptures) {
                    const extendInterfaceName = capture.node.text;
                    const extendInterfaceNode = getRelationNode(extendInterfaceName, true, NodeType.INTERFACE);
                    if (extendInterfaceNode) {
                        _repoMap_.addEdge(interfaceNode, extendInterfaceNode, EdgeType.EXTEND);
                    }
                }

                _repoMap_.addEdge(currentFile, interfaceNode, EdgeType.ENCAPSULATE);
            }
        }

        // 处理导入语句
        if (pattern === 3) {
            const importScopeCapture = match.captures.find(c => c.name === "import.body");

            const importBody = importScopeCapture?.node.text || null;

            // 通过 java 包名推导路径
            if (importBody) {
                const identifiers = importBody.split(".");
                const identifier = identifiers[identifiers.length - 1];

                let importFilePath: string = "";
                for (let i = 0; i < identifiers.length; i++) {
                    const files = identifiers.slice(0, identifiers.length - i);
                    importFilePath = path.join(javaPackageBasePath || "", ...files) + ".java";
                    if (fs.existsSync(importFilePath)) {
                        break;
                    }
                }

                if (fs.existsSync(importFilePath)) {
                    const importNode = new MapNode(identifier, importFilePath)
                    _repoMap_.addNode(importNode);
                    userDefinedContexts[identifier] = importNode;
                    _repoMap_.addEdge(currentFile, importNode, EdgeType.IMPORT);
                }
                importContexts.push(identifier);
            }
        }

        // 处理函数调用语句
        if (pattern === 4) {
            const methodInvocationCapture = match.captures.find(c => c.name === "method_invocation");
            const methodNameCapture = match.captures.find(c => c.name === "name.invocation.method");

            const methodInvocationAstNode = methodInvocationCapture?.node

            const methodName = methodNameCapture?.node.text;
            if (methodInvocationAstNode && methodName) {
                const methodOrClassAstNode = hasAncestor([JavaAstNodeType.METHOD_DECLARATION, JavaAstNodeType.CLASS_DECLARATION], methodInvocationAstNode);
                if (methodOrClassAstNode) {
                    const methodOrClassName = javaGetAstNodeName(methodOrClassAstNode);
                    if (methodOrClassName) {
                        const methodOrClassNode = new MapNode(methodOrClassName, filepath);
                        const calledMethodNode = getRelationNode(methodName, true, NodeType.METHOD);
                        if (calledMethodNode) {
                            _repoMap_.addEdge(methodOrClassNode, calledMethodNode, EdgeType.INVOKE);
                        }
                    }
                }
            }
        }

        // 处理 java 包声明语句
        if (pattern === 5) {
            if (!javaPackageBasePath) {
                // 获取 java 包基准路径
                const packageCapture = match.captures.find(c => c.name === "package.body");

                const packageName = packageCapture?.node.text || null;

                if (packageName) {
                    const packages = packageName.split(".");
                    const paths = filepath.split(path.sep);
                    const packageBasePaths = paths.slice(0, -packages.length - 1);
                    javaPackageBasePath = path.join(...packageBasePaths)
                }
            }
        }

        // 处理全局变量声明语句
        if (pattern === 6) {
            const fieldCapture = match.captures.find(c => c.name === "static.field");
            const fieldNameCapture = match.captures.find(c => c.name === "field.name");
            // const modifiersCapture = match.captures.find(c => c.name === "field.modifiers");

            const fieldName = fieldNameCapture?.node.text || null;

            const lineBegin = fieldCapture?.node.startPosition.row || 0;
            const lineEnd = fieldCapture?.node.endPosition.row || 0;

            if (fieldName) {
                const fieldNode = new CodeNode(fieldName, filepath, NodeType.FIELD, language, lineBegin, lineEnd);
                _repoMap_.updateNode(fieldNode);

                const fieldAstNode = fieldCapture?.node;
                if (fieldAstNode) {
                    const classAstNode = hasAncestor([JavaAstNodeType.CLASS_DECLARATION], fieldAstNode);
                    if (classAstNode) {
                        const className = javaGetAstNodeName(classAstNode);
                        if (className) {
                            const classNode = new MapNode(className, filepath);
                            _repoMap_.addEdge(classNode, fieldNode, EdgeType.DEFINE);
                        }
                    }
                }
                // if (currentClass) {
                //     repoMap.addEdge(currentClass, fieldNode, EdgeType.DEFINE);
                // }
            }
        }

        // 处理属性访问
        if (pattern === 7) {
            const fieldAccessCapture = match.captures.find(c => c.name === "field_access");
            const fieldNameCapture = match.captures.find(c => c.name === "field_name");

            const fieldAccessAstNode = fieldAccessCapture?.node

            const fieldName = fieldNameCapture?.node.text || null;
            if (fieldAccessAstNode && fieldName) {
                const methodAstNode = hasAncestor([JavaAstNodeType.METHOD_DECLARATION], fieldAccessAstNode);
                if (methodAstNode) {
                    const methodName = javaGetAstNodeName(methodAstNode);
                    if (methodName) {
                        const methodNode = new MapNode(methodName, filepath);
                        if (!useContexts[fieldName]) {
                            useContexts[fieldName] = [];
                        }
                        useContexts[fieldName].push(methodNode);
                    }
                }
            }
        }
    }

    for (const [key, value] of Object.entries(useContexts)) {
        const fieldNode = getRelationNode(key, false, NodeType.FIELD);
        if (fieldNode && _repoMap_.hasNode(fieldNode)) {
            for (const methodNode of value) {
                _repoMap_.addEdge(methodNode, fieldNode, EdgeType.USE);
            }
        }
    }
}
