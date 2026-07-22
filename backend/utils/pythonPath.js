const fs = require('fs');
const path = require('path');

function getPythonExecutable() {
    // 1. Check for workspace virtual environment
    const venvPythonPath = process.platform === 'win32'
        ? path.resolve(__dirname, '../../.venv/Scripts/python.exe')
        : path.resolve(__dirname, '../../.venv/bin/python');

    if (fs.existsSync(venvPythonPath)) {
        return venvPythonPath;
    }

    // 2. Fallbacks
    let pythonExecutable = 'python';
    if (process.platform === 'win32') {
        const windowsPythonPath = 'C:\\Users\\Ram Balakumaran\\AppData\\Local\\Python\\pythoncore-3.14-64\\python.exe';
        if (fs.existsSync(windowsPythonPath)) {
            pythonExecutable = windowsPythonPath;
        } else {
            pythonExecutable = 'py';
        }
    }
    return pythonExecutable;
}

module.exports = { getPythonExecutable };

