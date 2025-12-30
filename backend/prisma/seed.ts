// backend/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 A iniciar o seed...');

  // 1. Criar a Organização "Mãe" (A sua empresa de software)
  const masterOrgName = 'Novari Admin';
  
  let masterOrg = await prisma.organization.findFirst({
    where: { name: masterOrgName }
  });

  if (!masterOrg) {
    masterOrg = await prisma.organization.create({
      data: {
        name: masterOrgName,
      },
    });
    console.log(`🏢 Organização Master criada: ${masterOrg.name}`);
  }

  // 2. Criar o Utilizador "Deus" (Você)
  const email = 'guinwv@gmail.com'; // Use o seu email real ou um seguro
  const password = '123456'; // Mude isto!!!

  const userExists = await prisma.user.findUnique({ where: { email } });

  if (!userExists) {
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name: 'Super Admin',
        email,
        password: hashedPassword,
        role: 'MASTER', // <--- O cargo poderoso
        organizationId: masterOrg.id,
      },
    });
    console.log(`👤 Super Admin criado: ${email}`);
  } else {
    console.log('👤 Super Admin já existe.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });