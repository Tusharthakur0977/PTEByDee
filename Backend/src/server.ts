import prisma from './config/prismaInstance';
import app from './app';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to the database (Prisma handles connection pooling)
    await prisma.$connect();
    console.log('Database connected successfully.');

    app.listen(PORT, () => {
      console.log(
        `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
      );
    });
  } catch (error) {
    console.error('Failed to connect to the database or start server:', error);
    process.exit(1); // Exit process with failure
  } finally {
    // Optional: Ensure Prisma client disconnects on process exit
    process.on('beforeExit', async () => {
      await prisma.$disconnect();
      console.log('Database disconnected.');
    });
  }
};

startServer();
