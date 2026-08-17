const fs = require('fs');
const glob = require('glob');
const { execSync } = require('child_process');

try {
  const files = execSync('find src -type f -name "*.tsx"').toString().trim().split('\n');
  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;
    
    const replaces = [
      { from: /#97fb2e/g, to: '#D7FE03' },
      { from: /#86e224/g, to: '#c4e602' },
      { from: /#85df29/g, to: '#c4e602' },
      { from: /#86e029/g, to: '#c4e602' },
      { from: /151,251,46/g, to: '215,254,3' }
    ];

    for (let r of replaces) {
      if (r.from.test(content)) {
        content = content.replace(r.from, r.to);
        changed = true;
      }
    }
    
    if (changed) {
      fs.writeFileSync(file, content);
      console.log('Patched green in ' + file);
    }
  });
} catch (e) {
  console.error(e);
}
