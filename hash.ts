import bcrypt from 'bcryptjs';

async function run() {
  const hash = await bcrypt.hash('Forenclue@2025', 10);
  console.log(hash);
}
run();
