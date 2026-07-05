import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function clearStudents() {
    try {
        const result = await prisma.masterStudents.deleteMany({});

        console.log(`✅ Deleted ${result.count} students`);
    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

clearStudents();