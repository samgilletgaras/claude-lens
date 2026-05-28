const fs = require('fs');
const readline = require('readline');

async function test() {
  const fileStream = fs.createReadStream('/home/sam/.claude/projects/-home-sam-Documents-Brain/c7372641-0d93-4e0b-aa31-790cd644fcb0.jsonl');
  const rl = readline.createInterface({ input: fileStream });

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      if (obj.type === 'user' || obj.type === 'assistant') {
        console.log(`Type: ${obj.type}`);
        if (obj.message && obj.message.content) {
            console.log(`Content type: ${typeof obj.message.content}, isArray: ${Array.isArray(obj.message.content)}`);
            if (Array.isArray(obj.message.content)) {
                console.log(obj.message.content.map(c => c.type).join(', '));
            }
        }
      }
    } catch (e) {
      console.error(e);
    }
  }
}
test();
