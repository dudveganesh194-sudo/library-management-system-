/**
 * Database seed script — supports multi-tenant library architecture.
 * Run with: npm run seed
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { env } from './config/env';
import { logger } from './shared/helpers/logger';
import { User } from './features/users/user.model';
import { Settings } from './features/settings/settings.model';
import { Seat } from './features/seats/seat.model';
import { Floor } from './features/floors/floor.model';
import { Student } from './features/students/student.model';
import { Payment } from './features/payments/payment.model';
import { Library } from './features/super-admin/models/library.model';
import { Subscription } from './features/super-admin/models/subscription.model';

async function syncAllIndexes(): Promise<void> {
  const models = [
    { name: 'Floor', model: Floor },
    { name: 'Seat', model: Seat },
    { name: 'Student', model: Student },
    { name: 'Payment', model: Payment },
    { name: 'Settings', model: Settings },
  ];

  for (const { name, model } of models) {
    try {
      // Drop legacy single-field unique indexes if present
      const indexes = await model.collection.indexes().catch(() => []);
      for (const idx of indexes) {
        if (
          idx.name === 'floorNumber_1' ||
          idx.name === 'seatNumber_1' ||
          idx.name === 'studentId_1' ||
          idx.name === 'receiptNumber_1'
        ) {
          logger.info(`Dropping legacy index "${idx.name}" on ${name} collection...`);
          await model.collection.dropIndex(idx.name).catch(() => {});
        }
      }
      await model.syncIndexes();
    } catch (err: any) {
      logger.warn(`Index sync warning for ${name}: ${err.message}`);
    }
  }
}

async function seed(): Promise<void> {
  await mongoose.connect(env.MONGODB_URI);
  logger.info('Connected to MongoDB for seeding...');

  // Sync schema indexes (remove old single-field unique constraints)
  await syncAllIndexes();

  // ── Super Admin User ──────────────────────────────────────────────────────
  const superAdminEmail = 'superadmin@studylib.com';
  let superAdmin = await User.findOne({ email: superAdminEmail });
  if (!superAdmin) {
    superAdmin = await User.create({
      name: 'Super Admin',
      email: superAdminEmail,
      password: 'SuperAdmin@123456',
      role: 'super_admin',
      isActive: true,
    });
    logger.info(`✅ Super Admin created: ${superAdminEmail} / SuperAdmin@123456`);
  } else {
    logger.info(`ℹ️  Super Admin already exists: ${superAdminEmail}`);
  }

  // ── Default Subscription Plans ──────────────────────────────────────────────
  let basicPlan = await Subscription.findOne({ name: 'Basic' });
  if (!basicPlan) {
    const plans = [
      {
        name: 'Basic',
        price: 999,
        duration: 30,
        maxSeats: 50,
        maxStaff: 3,
        features: ['seats', 'students', 'payments'],
        isActive: true,
      },
      {
        name: 'Pro',
        price: 2499,
        duration: 30,
        maxSeats: 200,
        maxStaff: 10,
        features: ['seats', 'students', 'payments', 'reports', 'multi-floor'],
        isActive: true,
      },
      {
        name: 'Enterprise',
        price: 4999,
        duration: 30,
        maxSeats: 1000,
        maxStaff: 50,
        features: ['seats', 'students', 'payments', 'reports', 'multi-floor', 'analytics', 'api-access'],
        isActive: true,
      },
    ];
    const createdPlans = await Subscription.insertMany(plans);
    basicPlan = createdPlans[0];
    logger.info(`✅ Created default subscription plans`);
  }

  // ── Admin User (Library Owner) ──────────────────────────────────────────────
  let adminUser = await User.findOne({ email: env.SEED_ADMIN_EMAIL });
  if (!adminUser) {
    adminUser = await User.create({
      name: env.SEED_ADMIN_NAME,
      email: env.SEED_ADMIN_EMAIL,
      password: env.SEED_ADMIN_PASSWORD,
      role: 'owner',
      isActive: true,
    });
    logger.info(`✅ Admin user created: ${env.SEED_ADMIN_EMAIL}`);
  } else {
    logger.info(`ℹ️  Admin user already exists: ${env.SEED_ADMIN_EMAIL}`);
  }

  // ── Seed Library ────────────────────────────────────────────────────────────
  let defaultLibrary = await Library.findOne({ email: env.SEED_ADMIN_EMAIL });
  if (!defaultLibrary) {
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    defaultLibrary = await Library.create({
      name: env.SEED_LIBRARY_NAME,
      owner: adminUser._id,
      email: env.SEED_ADMIN_EMAIL,
      phone: '9876543210',
      address: '123 Main Street',
      city: 'Indore',
      state: 'Madhya Pradesh',
      pinCode: '452001',
      subscription: basicPlan._id,
      paymentStatus: 'paid',
      subscriptionStartDate: startDate,
      subscriptionEndDate: endDate,
      seatsLimit: 100,
      status: 'active',
      createdBy: superAdmin._id,
    });
    logger.info(`✅ Seed library created: ${env.SEED_LIBRARY_NAME}`);
  }

  // Link adminUser to libraryId
  if (!adminUser.libraryId) {
    adminUser.libraryId = defaultLibrary._id as any;
    await adminUser.save();
  }

  // ── Library Settings ────────────────────────────────────────────────────────
  const existingSettings = await Settings.findOne({ libraryId: defaultLibrary._id });
  if (!existingSettings) {
    await Settings.create({
      libraryId: defaultLibrary._id,
      library: { name: env.SEED_LIBRARY_NAME, email: env.SEED_ADMIN_EMAIL },
    });
    logger.info(`✅ Library settings created: ${env.SEED_LIBRARY_NAME}`);
  }

  // ── Default Floor 1 ─────────────────────────────────────────────────────────
  const existingFloor1 = await Floor.findOne({ libraryId: defaultLibrary._id, floorNumber: 1 });
  if (!existingFloor1) {
    await Floor.create({
      libraryId: defaultLibrary._id,
      floorNumber: 1,
      name: 'Floor 1',
      description: 'Default main study hall',
    });
    logger.info(`✅ Floor 1 created for default library`);
  } else {
    // Ensure existing Floor 1 is tagged with defaultLibrary._id
    if (!existingFloor1.libraryId) {
      existingFloor1.libraryId = defaultLibrary._id as any;
      await existingFloor1.save();
    }
  }

  // ── Sample Seats ────────────────────────────────────────────────────────────
  const existingSeats = await Seat.countDocuments({ libraryId: defaultLibrary._id });
  if (existingSeats === 0) {
    const seats = [];
    for (let floor = 1; floor <= 2; floor++) {
      for (const section of ['A', 'B']) {
        for (let num = 1; num <= 5; num++) {
          seats.push({
            libraryId: defaultLibrary._id,
            seatNumber: `${section}${floor}-${String(num).padStart(2, '0')}`,
            floor,
            section,
            type: section === 'B' ? 'premium' : 'standard',
            price: section === 'B' ? 700 : 500,
            status: 'available',
            amenities: section === 'B' ? ['AC', 'power outlet'] : ['power outlet'],
          });
        }
      }
    }
    await Seat.insertMany(seats);
    logger.info(`✅ Created ${seats.length} sample seats for default library`);
  }

  await mongoose.connection.close();
  logger.info('✅ Seed complete. Database connection closed.');
}

seed().catch((err) => {
  logger.error('Seed failed:', err);
  process.exit(1);
});
