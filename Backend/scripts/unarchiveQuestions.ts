import prisma from '../src/config/prismaInstance';

async function main() {
  const result = await prisma.question.updateMany({
    where: {},
    data: {
      isArchived: false,
      archivedAt: null,
    },
  });

  console.log(
    `Updated ${result.count} question(s), ensuring all records are unarchived.`
  );
}

main()
  .catch((error) => {
    console.error('Failed to run unarchive script:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
