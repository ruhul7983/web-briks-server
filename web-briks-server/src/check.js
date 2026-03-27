const fs = require('fs');
const path = require('path');

const test = path.join(process.cwd(), 'upload', 'developer', 'coverPHoto-1763225755508-625544263.png');
console.log('Checking:', test);
console.log('exists:', fs.existsSync(test));