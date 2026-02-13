import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const pos = await prisma.purchaseOrder.findMany({
        orderBy: { PurchaseOrderCode: 'desc' },
        take: 10,
        select: { PurchaseOrderCode: true, CompanyId: true }
    });
    console.log('Recent POs:', JSON.stringify(pos, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
