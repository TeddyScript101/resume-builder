const { spawn } = require('child_process');

function callAI(prompt) {
  return new Promise((resolve, reject) => {
    const child = spawn('claude', ['--print'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });

    child.on('close', code => {
      if (code !== 0) {
        reject(new Error(`claude --print exited ${code}: ${stderr.slice(0, 300)}`));
      } else {
        resolve(stdout.trim());
      }
    });

    child.on('error', reject);

    child.stdin.write(prompt);
    child.stdin.end();
  });
}

module.exports = { callAI };
