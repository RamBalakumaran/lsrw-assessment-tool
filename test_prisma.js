const prisma = require('./backend/config/prisma');
async function main() {
  const users = await prisma.user.findMany();
  console.log('Prisma Users count:', users.length);
}
main().catch(console.error);
