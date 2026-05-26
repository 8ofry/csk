const fs = require('fs');

const logPath = 'C:/Users/ahmed/.gemini/antigravity/brain/9977561c-300b-4a35-9eff-599b1acba7ba/.system_generated/logs/transcript.jsonl';
if (!fs.existsSync(logPath)) {
  console.log("Log file not found!");
  process.exit(1);
}

const lines = fs.readFileSync(logPath, 'utf8').split('\n');
for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const data = JSON.parse(line);
    const content = data.content || '';
    if (content.includes('Target Group:')) {
      console.log(`Step ${data.step_index}:`);
      console.log(content);
      console.log('---');
    }
  } catch (e) {
    // ignore
  }
}
