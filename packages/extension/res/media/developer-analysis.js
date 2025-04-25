const vscode = acquireVsCodeApi();
llm_content = ''


window.addEventListener('message', event => {
    const message = event.data;
    switch (message.type) {
        case 'llmSummary':
            llm_content += message.data;
            const md = markdownit();
            const html = md.render(llm_content);
            document.getElementById('result-llm').innerHTML = html;
            break;
        case 'clearSummary':
            document.getElementById('result-llm').innerHTML = '';
            llm_content = '';
            break;
    }
});

document.getElementById('btn-developer-analysis-basic').onclick = () => {
    vscode.postMessage({command: 'basic-analysis'});
};

document.getElementById('btn-developer-analysis-ability').onclick = () => {
    vscode.postMessage({command: 'ability-analysis'});
};

document.getElementById('btn-developer-analysis-habit').onclick = () => {
    vscode.postMessage({command: 'habit-analysis'});
}
document.getElementById('btn-developer-analysis-learn').onclick = () => {
    vscode.postMessage({command: 'learn-analysis'});
}