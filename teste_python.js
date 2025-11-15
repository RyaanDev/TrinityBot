const { spawn } = require('child_process');

// Teste simples do Python
const pythonProcess = spawn('python', ['-c', 'print("Python funciona!")']);

pythonProcess.stdout.on('data', (data) => {
    console.log('Python output:', data.toString());
});

pythonProcess.stderr.on('data', (data) => {
    console.log('Python error:', data.toString());
});

pythonProcess.on('close', (code) => {
    console.log('Python process exited with code:', code);
});