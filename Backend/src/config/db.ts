import prisma from './prismaInstance';

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Connected to MongoDB via Prisma');
  } catch (error) {
    console.error('❌ DB Connection Error:', error);
    process.exit(1);
  }
};

export default connectDB;
