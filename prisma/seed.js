import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.shipment.count();

  if (count > 0) {
    console.log('Seed skipped: shipment data already exists');
    return;
  }

  await prisma.shipment.createMany({
    data: [
      {
        trackingNo: 'TH100001',
        customer: 'บริษัท เอ บริการขนส่ง',
        origin: 'กรุงเทพฯ',
        destination: 'เชียงใหม่',
        status: 'In Transit',
        vehicle: 'Truck-12',
        eta: new Date('2026-08-08')
      },
      {
        trackingNo: 'TH100002',
        customer: 'หจก. สมาร์ทดีลิเวอรี่',
        origin: 'ชลบุรี',
        destination: 'ขอนแก่น',
        status: 'Pending',
        vehicle: 'Van-03',
        eta: new Date('2026-08-09')
      },
      {
        trackingNo: 'TH100003',
        customer: 'บริษัท โลจิเทค',
        origin: 'ภูเก็ต',
        destination: 'สุราษฎร์ธานี',
        status: 'Delivered',
        vehicle: 'Truck-07',
        eta: new Date('2026-08-05')
      }
    ]
  });

  console.log('Seed completed');
}

main()
  .catch((error) => {
    console.error('Seed error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
