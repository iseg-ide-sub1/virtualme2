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

// document.getElementById('btn-sub1').onclick = () => {
//     const checkboxes = document.querySelectorAll('#recent-logs-list input[type="checkbox"]:checked');
//     const selectedValues = Array.from(checkboxes).map(checkbox => checkbox.value);
//     // console.log(selectedValues);
//     vscode.postMessage({command: 'logs.visual.summary', data: JSON.stringify(selectedValues)});
// };
//
// document.getElementById('btn-sub2').onclick = () => {
//     const checkboxes = document.querySelectorAll('#recent-logs-list input[type="checkbox"]:checked');
//     const selectedValues = Array.from(checkboxes).map(checkbox => checkbox.value);
//     // console.log(selectedValues);
//     vscode.postMessage({command: 'logs.llm.summary', data: JSON.stringify(selectedValues)});
// };

document.getElementById('btn-snapshot-sub').onclick = () => {
    const checkboxes = document.querySelectorAll('#recent-logs-list input[type="checkbox"]:checked');
    const selectedValues = Array.from(checkboxes).map(checkbox => checkbox.value);
    vscode.postMessage({command: 'snapshots.abstract', data: JSON.stringify(selectedValues)});
};

document.getElementById('btn-terminal-sub').onclick = () => {
    const checkboxes = document.querySelectorAll('#recent-logs-list input[type="checkbox"]:checked');
    const selectedValues = Array.from(checkboxes).map(checkbox => checkbox.value);
    vscode.postMessage({command: 'terminal.abstract', data: JSON.stringify(selectedValues)});
};