import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // --- Create default user ---
  const passwordHash = await bcrypt.hash('password123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      passwordHash,
      name: 'Admin User',
    },
  });
  console.log(`  ✓ User: ${user.email}`);

  // --- Create products ---
  const productNames = ['8DAB', '8DJH', 'Simosec', 'NXPlus C'];
  const products: Record<string, { id: number; name: string }> = {};

  for (const name of productNames) {
    const product = await prisma.product.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    products[name] = product;
    console.log(`  ✓ Product: ${product.name}`);
  }

  // --- Create workstations ---
  const workstationData = [
    { shortName: 'LW', name: 'Laser welding', pcName: 'LASER-PC-01' },
    { shortName: 'MW', name: 'Manual welding', pcName: 'WELD-PC-01' },
    { shortName: 'DA', name: 'Drive assembly', pcName: 'DRIVE-PC-01' },
    { shortName: 'VD', name: 'Voltage drop test', pcName: 'VDROP-PC-01' },
    { shortName: 'LT', name: 'Leakage test', pcName: 'LEAK-PC-01' },
    { shortName: 'HP', name: 'HV/PD test', pcName: 'HVPD-PC-01' },
    { shortName: 'FI', name: 'Final inspection', pcName: 'FINSP-PC-01' },
    { shortName: 'FA', name: 'Frame assembly', pcName: 'FRAME-PC-01' },
    { shortName: 'TS', name: 'Testing', pcName: 'TEST-PC-01' },
    { shortName: 'DP', name: 'Dispatch', pcName: 'DISP-PC-01' },
  ];

  const workstations: Record<string, { id: number; shortName: string; name: string }> = {};

  for (const ws of workstationData) {
    // Use shortName as a lookup key since it's not unique in schema, find first
    let workstation = await prisma.workstation.findFirst({
      where: { shortName: ws.shortName, name: ws.name },
    });
    if (!workstation) {
      workstation = await prisma.workstation.create({ data: ws });
    }
    workstations[ws.shortName] = workstation;
    console.log(`  ✓ Workstation: ${workstation.shortName} - ${workstation.name}`);
  }

  // --- Create assembly lines ---
  const assemblyLineData = [
    { name: 'Convey line', productName: '8DAB', active: true },
    { name: 'Manual line', productName: '8DJH', active: true },
    { name: 'Final assembly line', productName: 'Simosec', active: true },
    { name: 'Testing line', productName: 'NXPlus C', active: false },
  ];

  const assemblyLines: Record<string, { id: number; name: string }> = {};

  for (const al of assemblyLineData) {
    let assemblyLine = await prisma.assemblyLine.findFirst({
      where: { name: al.name, productId: products[al.productName].id },
    });
    if (!assemblyLine) {
      assemblyLine = await prisma.assemblyLine.create({
        data: {
          name: al.name,
          active: al.active,
          productId: products[al.productName].id,
        },
      });
    }
    assemblyLines[al.name] = assemblyLine;
    console.log(`  ✓ Assembly Line: ${assemblyLine.name} (active: ${al.active})`);
  }

  // --- Create allocations ---
  const allocationData: { lineName: string; workstationShortNames: string[] }[] = [
    { lineName: 'Convey line', workstationShortNames: ['FA', 'LW', 'DA'] },
    { lineName: 'Manual line', workstationShortNames: ['FA', 'MW', 'DA'] },
    { lineName: 'Final assembly line', workstationShortNames: ['FI', 'DP'] },
    { lineName: 'Testing line', workstationShortNames: ['VD', 'LT', 'HP'] },
  ];

  for (const allocGroup of allocationData) {
    const assemblyLine = assemblyLines[allocGroup.lineName];
    for (let i = 0; i < allocGroup.workstationShortNames.length; i++) {
      const wsShortName = allocGroup.workstationShortNames[i];
      const workstation = workstations[wsShortName];
      const sortOrder = i + 1;

      const existing = await prisma.allocation.findUnique({
        where: {
          assemblyLineId_workstationId: {
            assemblyLineId: assemblyLine.id,
            workstationId: workstation.id,
          },
        },
      });

      if (!existing) {
        await prisma.allocation.create({
          data: {
            assemblyLineId: assemblyLine.id,
            workstationId: workstation.id,
            sortOrder,
          },
        });
      }

      console.log(`  ✓ Allocation: ${allocGroup.lineName} → ${wsShortName} (order: ${sortOrder})`);
    }
  }

  console.log('\n✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
