import Parser from "web-tree-sitter"
import { MatchesHandler } from "../type";
import { _RepoMap_ } from "../_RepoMap_";

export const javaScriptVirtualMeMatchesHandler: MatchesHandler = (_repoMap_: _RepoMap_, matches: Parser.QueryMatch[], filepath: string): void => {
    const externalPackages: Set<string> = new Set();

    for (const match of matches) {
        const pattern = match.pattern;

        function sourceHandler(source: string | undefined): void {
            if (!source || source.startsWith(".")) {
                return;
            }
            externalPackages.add(source.split("/")[0]);
        }

        if (pattern === 0 || pattern === 1) {
            const source = match.captures.find(c => c.name === "source")?.node.text.slice(1, -1);
            sourceHandler(source);
        }
    }
    _repoMap_.addExternalPackages(externalPackages);
}