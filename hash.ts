import bcrypt from 'bcryptjs';

async function run() {
  const hash = await bcrypt.hash('Forenclue@2026', 10);
  console.log('HASH:', hash);
}
run();

