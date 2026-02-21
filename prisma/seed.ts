import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function d(dateStr: string): Date {
  const [y, m, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day));
}

const FIXED_HOLIDAYS_2026 = [
  { date: "2026-01-01", name: "New Year's Day" },
  { date: "2026-01-15", name: "Makar Sankranti" },
  { date: "2026-01-26", name: "Republic Day" },
  { date: "2026-03-19", name: "Ugadi Festival" },
  { date: "2026-05-01", name: "May Day" },
  { date: "2026-09-14", name: "Varasiddhi Vinayaka Vrata" },
  { date: "2026-10-02", name: "Gandhi Jayanthi" },
  { date: "2026-10-21", name: "Vijayadasami" },
  { date: "2026-11-10", name: "Balipadyami, Deepavali" },
  { date: "2026-12-25", name: "Christmas" },
];

const OPTIONAL_HOLIDAYS_2026 = [
  { date: "2026-03-02", name: "Holi" },
  { date: "2026-03-27", name: "Sri Ramanavami" },
  { date: "2026-03-31", name: "Mahaveera Jayanthi" },
  { date: "2026-04-03", name: "Good Friday" },
  { date: "2026-04-14", name: "Dr. B.R. Ambedkar Jayanti" },
  { date: "2026-05-28", name: "Bakrid" },
  { date: "2026-08-21", name: "Varamahalakshmi Vrata" },
  { date: "2026-09-04", name: "Sri Krishna Janmashtami" },
  { date: "2026-09-07", name: "US Labor Day" },
  { date: "2026-10-20", name: "Mahanavami, Ayudha Puja" },
  { date: "2026-10-29", name: "Karwa Chauth" },
  { date: "2026-11-26", name: "Thanksgiving Day" },
];

async function main() {
  console.log("Seeding holidays...");

  for (const h of FIXED_HOLIDAYS_2026) {
    await prisma.holidayCalendar.upsert({
      where: { date: d(h.date) },
      update: { name: h.name, type: "HOLIDAY", year: 2026 },
      create: {
        date: d(h.date),
        year: 2026,
        type: "HOLIDAY",
        name: h.name,
      },
    });
  }

  for (const h of OPTIONAL_HOLIDAYS_2026) {
    await prisma.holidayCalendar.upsert({
      where: { date: d(h.date) },
      update: { name: h.name, type: "OPTIONAL_HOLIDAY", year: 2026 },
      create: {
        date: d(h.date),
        year: 2026,
        type: "OPTIONAL_HOLIDAY",
        name: h.name,
      },
    });
  }

  console.log(`Seeded ${FIXED_HOLIDAYS_2026.length} fixed holidays`);
  console.log(`Seeded ${OPTIONAL_HOLIDAYS_2026.length} optional holidays`);

  console.log("Seeding admin user...");
  const adminPassword = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "f20211247@goa.bits-pilani.ac.in" },
    update: { role: "ADMIN" },
    create: {
      name: "Admin",
      email: "f20211247@goa.bits-pilani.ac.in",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });
  console.log("Admin user seeded (email: f20211247@goa.bits-pilani.ac.in, password: admin123).");

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
