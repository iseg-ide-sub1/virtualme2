const path = require('path');
const bindings = require('bindings');

// 显式指定 sqlite3 模块的根目录
module.exports = bindings({
    bindings: 'node_sqlite3.node',
    module_root: __dirname,
});