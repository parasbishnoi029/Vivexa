const { exec } = require('child_process');
exec('python3 server/notebook_kernel_master.py test_config.json', (error, stdout, stderr) => {
  console.log({ error, stdout, stderr });
});
