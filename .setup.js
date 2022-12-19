const fs = require('fs');

if (!fs.existsSync('.env')) {
  fs.copyFileSync('.env.example', '.env');
}

process.exit(0);
