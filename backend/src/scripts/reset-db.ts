/**
 * Database Reset Script.
 * Run with: npm run reset-db
 *
 * Clears ALL data from the database (libraries, owners, staff, students, seats, payments, settings, floors, logs)
 * EXCEPT the Super Admin account (superadmin@studylib.com / SuperAdmin@123456) and default Subscription Plans.
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { env } from '../config/env';
import { logger } from '../shared/helpers/logger';
import { User } from '../features/users/user.model';
import { Settings } from '../features/settings/settings.model';
import { Seat } from '../features/seats/seat.model';
import { Floor } from '../features/floors/floor.model';
import { Student } from '../features/students/student.model';
import { Payment } from '../features/payments/payment.model';
import { Library } from '../features/super-admin/models/library.model';
import { LibraryPayment } from '../features/super-admin/models/library-payment.model';
import { AuditLog } from '../features/super-admin/models/audit-log.model';
import { Subscription } from '../features/super-admin/models/subscription.model';

async function resetDatabase(): Promise<void> {
  await mongoose.connect(env.MONGODB_URI);
  logger.info('Connected to MongoDB. Starting database reset...');

  // 1. Wipe non-super-admin users
  const deletedUsers = await User.deleteMany({ role: { $ne: 'super_admin' } });
  logger.info(`🧹 Deleted ${deletedUsers.deletedCount} non-super-admin user accounts.`);

  // Ensure Super Admin exists
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
    // Reset Super Admin password to default SuperAdmin@123456
    superAdmin.password = 'SuperAdmin@123456';
    await superAdmin.save();
    logger.info(`✅ Super Admin account verified & password reset to default: ${superAdminEmail}`);
  }

  // 2. Clear Libraries & ERP Payments
  const deletedLibraries = await Library.deleteMany({});
  logger.info(`🧹 Deleted ${deletedLibraries.deletedCount} libraries.`);

  const deletedLibPayments = await LibraryPayment.deleteMany({});
  logger.info(`🧹 Deleted ${deletedLibPayments.deletedCount} ERP subscription payments.`);

  // 3. Clear Students, Seats, Payments, Floors, Settings, Audit Logs
  const deletedStudents = await Student.deleteMany({});
  logger.info(`🧹 Deleted ${deletedStudents.deletedCount} students.`);

  const deletedSeats = await Seat.deleteMany({});
  logger.info(`🧹 Deleted ${deletedSeats.deletedCount} seats.`);

  const deletedPayments = await Payment.deleteMany({});
  logger.info(`🧹 Deleted ${deletedPayments.deletedCount} student fee payments.`);

  const deletedFloors = await Floor.deleteMany({});
  logger.info(`🧹 Deleted ${deletedFloors.deletedCount} floors.`);

  const deletedSettings = await Settings.deleteMany({});
  logger.info(`🧹 Deleted ${deletedSettings.deletedCount} settings documents.`);

  const deletedLogs = await AuditLog.deleteMany({});
  logger.info(`🧹 Deleted ${deletedLogs.deletedCount} audit logs.`);

  // 4. Ensure Default Subscription Plans Exist
  const existingPlans = await Subscription.countDocuments();
  if (existingPlans === 0) {
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
    await Subscription.insertMany(plans);
    logger.info(`✅ Re-seeded default subscription plans (Basic, Pro, Enterprise).`);
  }

  // 5. Drop legacy single-field indexes & Sync indexes
  const models = [
    { name: 'Floor', model: Floor },
    { name: 'Seat', model: Seat },
    { name: 'Student', model: Student },
    { name: 'Payment', model: Payment },
    { name: 'Settings', model: Settings },
  ];

  for (const { name, model } of models) {
    try {
      const indexes = await model.collection.indexes().catch(() => []);
      for (const idx of indexes) {
        if (
          idx.name === 'floorNumber_1' ||
          idx.name === 'seatNumber_1' ||
          idx.name === 'studentId_1' ||
          idx.name === 'receiptNumber_1'
        ) {
          await model.collection.dropIndex(idx.name).catch(() => {});
        }
      }
      await model.syncIndexes();
    } catch {}
  }

  await mongoose.connection.close();
  logger.info('✨ DATABASE RESET COMPLETE! Ready for clean live onboarding.');
}

resetDatabase().catch((err) => {
  logger.error('Reset failed:', err);
  process.exit(1);
});
