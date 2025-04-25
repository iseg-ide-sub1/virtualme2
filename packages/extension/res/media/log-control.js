const vscode = acquireVsCodeApi();


// 监听插件发出的消息
window.addEventListener('message', event => {
    const message = event.data;
    switch (message.command) {
        case 'updateDisplayInfo':
            updateDisplayInfo(message.displayInfo);
            break;
    }
});

function updateDisplayInfo(displayInfo) {
    // 更新日志数量
    const target1 = document.getElementById('logs-num');
    target1.innerText = displayInfo['logs-num'];
    // 更新上一次事件
    const target2 = document.getElementById('logs-prev');
    target2.innerText = displayInfo['logs-prev'];
}

// 保存日志按钮被点击
document.getElementById('btn-save').onclick = () => {
    console.log('pressed')
    vscode.postMessage({command: 'virtualme.savelog'});
};

// 记录状态被改变
function onRecordingSwitch() {
    const selectedValue = document.querySelector('.control-div input[type="radio"]:checked').id;
    if(selectedValue == 'rec-start'){
        vscode.postMessage({command: 'virtualme.start'});
    }
    else{
        vscode.postMessage({command: 'virtualme.stop'});
    }
}