/**
 * Library Service — business logic for library management (Super Admin only).
 *
 * The createLibrary function is the most critical:
 * It atomically creates Library + Owner User + Settings + Floor 1 + LibraryPayment
 * with support for standalone MongoDB and replica sets.
 */

import mongoose from 'mongoose';
import { Library, ILibrary } from './models/library.model';
import { User } from '../users/user.model';
import { Settings } from '../settings/settings.model';
import { Floor } from '../floors/floor.model';
import { Subscription } from './models/subscription.model';
import { LibraryPayment } from './models/library-payment.model';
import { ConflictError, NotFoundError, AppError } from '../../middleware/error.middleware';
import { CreateLibraryInput, UpdateLibraryInput, LibraryQueryInput } from './library.validation';
import { PaginatedResult } from '../../shared/types';
import { ROLES, LIBRARY_STATUS, LIBRARY_PAYMENT_STATUS } from '../../shared/constants';
import { logAction } from './audit-log.service';
import { logger } from '../../shared/helpers/logger';

// ── Helper: Check if MongoDB supports transactions ───────────────────────────

function isTransactionSupported(): boolean {
  try {
    const client = (mongoose.connection as any).client;
    const topologyType = client?.topology?.description?.type;
    if (typeof topologyType === 'string') {
      return (
        topologyType.includes('ReplicaSet') ||
        topologyType.includes('Sharded') ||
        topologyType.includes('LoadBalanced')
      );
    }
    return false;
  } catch {
    return false;
  }
}

// ── Interfaces ───────────────────────────────────────────────────────────────

interface CreateLibraryResult {
  library: ILibrary;
  credentials: {
    email: string;
    password: string;
    ownerName: string;
    libraryName: string;
  };
}

// ── Create Library ───────────────────────────────────────────────────────────

/**
 * Creates a complete library setup:
 * 1. Creates the Owner user
 * 2. Creates the Library document with subscription dates & payment status
 * 3. Links owner.libraryId = library._id
 * 4. Records initial LibraryPayment for ERP usage if paymentStatus is 'paid'
 * 5. Ensures default Settings exist
 * 6. Ensures default Floor 1 exists
 * 7. Returns login credentials for the owner
 */
export async function createLibrary(
  data: CreateLibraryInput,
  superAdminId: string,
  ipAddress?: string
): Promise<CreateLibraryResult> {
  const cleanEmail = data.email.toLowerCase().trim();

  // Pre-flight check: ensure email is not already taken
  const existingUser = await User.findOne({ email: cleanEmail });
  if (existingUser) {
    throw new ConflictError(`A user with email "${cleanEmail}" already exists`);
  }

  // Validate subscription if provided and determine plan price & duration
  let planDurationDays = 30;
  let planPrice = 1000;
  let validSubId: mongoose.Types.ObjectId | null = null;

  if (data.subscriptionId && mongoose.Types.ObjectId.isValid(data.subscriptionId)) {
    const subObj = await Subscription.findById(data.subscriptionId);
    if (subObj && subObj.isActive) {
      planDurationDays = subObj.duration || 30;
      planPrice = subObj.price || 1000;
      validSubId = subObj._id as mongoose.Types.ObjectId;
    }
  }

  // Calculate subscription dates
  const isTrialSelected = data.paymentStatus === 'trial' || data.isTrial === true;
  const trialDurationDays = data.trialDays || 15;
  const effectiveDurationDays = isTrialSelected ? trialDurationDays : planDurationDays;

  const startDate = data.subscriptionStartDate
    ? new Date(data.subscriptionStartDate)
    : new Date();
  const endDate = data.subscriptionEndDate
    ? new Date(data.subscriptionEndDate)
    : new Date(startDate.getTime() + effectiveDurationDays * 24 * 60 * 60 * 1000);

  const paymentStatus = isTrialSelected ? LIBRARY_PAYMENT_STATUS.TRIAL : (data.paymentStatus || LIBRARY_PAYMENT_STATUS.PAID);

  // Safe admin ObjectId
  const validAdminId = mongoose.Types.ObjectId.isValid(superAdminId)
    ? new mongoose.Types.ObjectId(superAdminId)
    : new mongoose.Types.ObjectId();

  // Determine if transactions can be used
  const useTransaction = isTransactionSupported();
  let session: mongoose.ClientSession | null = null;

  if (useTransaction) {
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch {
      session = null;
    }
  }

  let createdOwner: any = null;
  let createdLibrary: any = null;

  try {
    const sessionOption = session && session.inTransaction() ? { session } : undefined;

    // 1. Create the Owner user
    const ownerDocs = await User.create(
      [
        {
          name: data.ownerName,
          email: cleanEmail,
          password: data.password, // Pre-save hook hashes this
          role: ROLES.OWNER,
          phone: data.phone,
          address: data.address,
          city: data.city,
          state: data.state,
          pinCode: data.pinCode,
          isActive: true,
        },
      ],
      sessionOption
    );
    createdOwner = ownerDocs[0];

    // 2. Create the Library document
    const libraryDocs = await Library.create(
      [
        {
          name: data.libraryName,
          owner: createdOwner._id,
          email: cleanEmail,
          phone: data.phone,
          address: data.address,
          city: data.city,
          state: data.state,
          pinCode: data.pinCode,
          subscription: validSubId,
          paymentStatus,
          isTrial: isTrialSelected,
          trialEndDate: isTrialSelected ? endDate : undefined,
          subscriptionStartDate: startDate,
          subscriptionEndDate: endDate,
          seatsLimit: data.seatsLimit,
          status: data.status || LIBRARY_STATUS.ACTIVE,
          createdBy: validAdminId,
        },
      ],
      sessionOption
    );
    createdLibrary = libraryDocs[0];

    // 3. Link owner to library
    createdOwner.libraryId = createdLibrary._id;
    await createdOwner.save(sessionOption);

    // 4. Record ERP subscription payment if paid
    if (paymentStatus === LIBRARY_PAYMENT_STATUS.PAID && planPrice > 0) {
      const invoiceNumber = `INV-LIB-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      await LibraryPayment.create(
        [
          {
            library: createdLibrary._id,
            subscription: validSubId,
            amount: planPrice,
            paymentDate: startDate,
            periodStartDate: startDate,
            periodEndDate: endDate,
            paymentMethod: 'upi',
            status: LIBRARY_PAYMENT_STATUS.PAID,
            invoiceNumber,
            notes: `Initial ERP subscription onboarding payment for "${data.libraryName}"`,
            recordedBy: validAdminId,
          },
        ],
        sessionOption
      );
    }

    // 5. Ensure default Settings exist for this library
    const existingSettings = await Settings.findOne({ libraryId: createdLibrary._id });
    if (!existingSettings) {
      await Settings.create(
        [
          {
            libraryId: createdLibrary._id,
            library: {
              name: data.libraryName,
              address: data.address,
              phone: data.phone,
              email: cleanEmail,
            },
          },
        ],
        sessionOption
      );
    }

    // 6. Ensure default Floor 1 exists for this library
    const existingFloor1 = await Floor.findOne({ libraryId: createdLibrary._id, floorNumber: 1 });
    if (!existingFloor1) {
      await Floor.create(
        [
          {
            libraryId: createdLibrary._id,
            floorNumber: 1,
            name: 'Floor 1',
            description: 'Default floor created automatically',
          },
        ],
        sessionOption
      );
    }

    if (session && session.inTransaction()) {
      await session.commitTransaction();
      session.endSession();
    }

    // Log action
    await logAction({
      action: 'library.created',
      performedBy: superAdminId,
      targetType: 'library',
      targetId: String(createdLibrary._id),
      details: `Created library "${data.libraryName}" with owner "${data.ownerName}" (${cleanEmail})`,
      metadata: {
        libraryName: data.libraryName,
        ownerEmail: cleanEmail,
        seatsLimit: data.seatsLimit,
        paymentStatus: createdLibrary.paymentStatus,
        subscriptionEndDate: endDate,
        amountCharged: planPrice,
      },
      ipAddress,
    }).catch((err) => logger.error('Failed to log audit action:', err));

    logger.info(`✅ Library created: "${data.libraryName}" → Owner: ${cleanEmail}`);

    return {
      library: createdLibrary,
      credentials: {
        email: cleanEmail,
        password: data.password,
        ownerName: data.ownerName,
        libraryName: data.libraryName,
      },
    };
  } catch (error) {
    if (session) {
      try {
        if (session.inTransaction()) {
          await session.abortTransaction();
        }
        session.endSession();
      } catch {}
    }

    // Manual cleanup for non-transactional fallback
    if (!useTransaction) {
      if (createdLibrary) {
        await LibraryPayment.deleteMany({ library: createdLibrary._id }).catch(() => {});
        await Library.findByIdAndDelete(createdLibrary._id).catch(() => {});
      }
      if (createdOwner) {
        await User.findByIdAndDelete(createdOwner._id).catch(() => {});
      }
    }
    logger.error('Error creating library:', error);
    throw error;
  }
}

// ── Get All Libraries (Paginated & Filtered) ─────────────────────────────────

export async function getAllLibraries(
  query: LibraryQueryInput
): Promise<PaginatedResult<ILibrary>> {
  const page = parseInt(query.page || '1', 10);
  const limit = Math.min(parseInt(query.limit || '20', 10), 100);
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};

  // Status & Subscription Payment filter
  if (query.status && query.status !== 'all') {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (query.status === 'active') {
      filter.status = LIBRARY_STATUS.ACTIVE;
    } else if (query.status === 'suspended') {
      filter.status = LIBRARY_STATUS.SUSPENDED;
    } else if (query.status === 'deleted') {
      filter.status = LIBRARY_STATUS.DELETED;
    } else if (query.status === 'paid') {
      filter.paymentStatus = LIBRARY_PAYMENT_STATUS.PAID;
    } else if (query.status === 'unpaid') {
      filter.paymentStatus = { $in: [LIBRARY_PAYMENT_STATUS.UNPAID, LIBRARY_PAYMENT_STATUS.PENDING] };
    } else if (query.status === 'trial') {
      filter.$or = [
        { paymentStatus: LIBRARY_PAYMENT_STATUS.TRIAL },
        { isTrial: true },
      ];
    } else if (query.status === 'expiring_soon') {
      filter.subscriptionEndDate = { $gte: now, $lte: sevenDaysFromNow };
    } else if (query.status === 'expired') {
      filter.subscriptionEndDate = { $lt: now };
    }
  }

  // Search across name, email, city
  if (query.search) {
    const searchCondition = [
      { name: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } },
      { city: { $regex: query.search, $options: 'i' } },
    ];
    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, { $or: searchCondition }];
      delete filter.$or;
    } else {
      filter.$or = searchCondition;
    }
  }

  // Sort
  const sortField = query.sort || 'createdAt';
  const sortOrder = query.order === 'asc' ? 1 : -1;

  const [libraries, total] = await Promise.all([
    Library.find(filter)
      .populate('owner', 'name email phone isActive lastLogin')
      .populate('subscription', 'name price duration maxSeats')
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit),
    Library.countDocuments(filter),
  ]);

  return {
    data: libraries,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// ── Get Library by ID ────────────────────────────────────────────────────────

export async function getLibraryById(id: string): Promise<ILibrary> {
  const library = await Library.findById(id)
    .populate('owner', 'name email phone avatar isActive lastLogin createdAt')
    .populate('subscription', 'name price duration maxSeats maxStaff features')
    .populate('createdBy', 'name email');

  if (!library) throw new NotFoundError('Library');
  return library;
}

// ── Update Library ───────────────────────────────────────────────────────────

export async function updateLibrary(
  id: string,
  data: UpdateLibraryInput,
  superAdminId: string,
  ipAddress?: string
): Promise<ILibrary> {
  const library = await Library.findById(id);
  if (!library) throw new NotFoundError('Library');

  const update: Record<string, unknown> = {};
  if (data.libraryName) update.name = data.libraryName;
  if (data.email) update.email = data.email;
  if (data.phone) update.phone = data.phone;
  if (data.address) update.address = data.address;
  if (data.city) update.city = data.city;
  if (data.state) update.state = data.state;
  if (data.pinCode) update.pinCode = data.pinCode;
  if (data.subscriptionId) update.subscription = data.subscriptionId;
  if (data.paymentStatus) update.paymentStatus = data.paymentStatus;
  if (data.isTrial !== undefined) update.isTrial = data.isTrial;
  if (data.subscriptionStartDate) update.subscriptionStartDate = new Date(data.subscriptionStartDate);
  if (data.subscriptionEndDate) update.subscriptionEndDate = new Date(data.subscriptionEndDate);

  // If set to trial or trialDays provided
  if (data.paymentStatus === 'trial' || data.isTrial === true) {
    update.isTrial = true;
    update.paymentStatus = LIBRARY_PAYMENT_STATUS.TRIAL;
    if (data.trialDays) {
      const startDate = data.subscriptionStartDate ? new Date(data.subscriptionStartDate) : new Date();
      const endDate = new Date(startDate.getTime() + data.trialDays * 24 * 60 * 60 * 1000);
      update.subscriptionStartDate = startDate;
      update.subscriptionEndDate = endDate;
      update.trialEndDate = endDate;
    }
  }

  if (data.seatsLimit) update.seatsLimit = data.seatsLimit;
  if (data.status) update.status = data.status;

  const updated = await Library.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  })
    .populate('owner', 'name email phone isActive')
    .populate('subscription', 'name price duration maxSeats');

  if (!updated) throw new NotFoundError('Library');

  // If payment status changed to 'paid', record a payment record for revenue tracking
  if (data.paymentStatus === LIBRARY_PAYMENT_STATUS.PAID && library.paymentStatus !== LIBRARY_PAYMENT_STATUS.PAID) {
    // If was on trial and now paid, clear isTrial flag
    await Library.findByIdAndUpdate(id, { isTrial: false });

    const subObj = updated.subscription as any;
    const amount = subObj?.price || 1000;
    const invoiceNumber = `INV-LIB-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const validAdminId = mongoose.Types.ObjectId.isValid(superAdminId)
      ? new mongoose.Types.ObjectId(superAdminId)
      : new mongoose.Types.ObjectId();

    await LibraryPayment.create({
      library: updated._id,
      subscription: updated.subscription ? (updated.subscription as any)._id : null,
      amount,
      paymentDate: new Date(),
      periodStartDate: updated.subscriptionStartDate || new Date(),
      periodEndDate: updated.subscriptionEndDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      paymentMethod: 'upi',
      status: LIBRARY_PAYMENT_STATUS.PAID,
      invoiceNumber,
      notes: `ERP subscription renewal payment for "${updated.name}"`,
      recordedBy: validAdminId,
    }).catch((err) => logger.error('Failed to create library payment record:', err));
  }

  // Audit log
  await logAction({
    action: 'library.updated',
    performedBy: superAdminId,
    targetType: 'library',
    targetId: id,
    details: `Updated library "${updated.name}"`,
    metadata: { changes: data },
    ipAddress,
  }).catch((err) => logger.error('Failed to log audit action:', err));

  return updated;
}

// ── Grant / Extend Free Trial ────────────────────────────────────────────────

export async function grantTrial(
  id: string,
  trialDays: number,
  superAdminId: string,
  ipAddress?: string
): Promise<ILibrary> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new NotFoundError('Library');
  }

  const library = await Library.findById(id);
  if (!library) throw new NotFoundError('Library');

  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + trialDays * 24 * 60 * 60 * 1000);

  const updated = await Library.findByIdAndUpdate(
    id,
    {
      isTrial: true,
      paymentStatus: LIBRARY_PAYMENT_STATUS.TRIAL,
      subscriptionStartDate: startDate,
      subscriptionEndDate: endDate,
      trialEndDate: endDate,
      status: LIBRARY_STATUS.ACTIVE,
    },
    { new: true, runValidators: true }
  )
    .populate('owner', 'name email phone isActive')
    .populate('subscription', 'name price duration maxSeats');

  if (!updated) throw new NotFoundError('Library');

  // Reactivate owner user and library staff if suspended
  const userFilters: any[] = [];
  if (library.owner && mongoose.Types.ObjectId.isValid(String(library.owner))) {
    userFilters.push({ _id: library.owner });
  }
  if (library._id) {
    userFilters.push({ libraryId: library._id });
  }
  if (userFilters.length > 0) {
    await User.updateMany({ $or: userFilters }, { isActive: true }).catch(() => {});
  }

  await logAction({
    action: 'library.trial_granted',
    performedBy: superAdminId,
    targetType: 'library',
    targetId: id,
    details: `Granted ${trialDays} days free trial to library "${updated.name}" (Expires: ${endDate.toISOString().split('T')[0]})`,
    metadata: { trialDays, trialEndDate: endDate },
    ipAddress,
  }).catch((err) => logger.error('Failed to log audit action:', err));

  logger.info(`🎁 Free Trial (${trialDays} days) granted to library "${updated.name}"`);
  return updated;
}

// ── Suspend Library ──────────────────────────────────────────────────────────

export async function suspendLibrary(
  id: string,
  superAdminId: string,
  ipAddress?: string
): Promise<ILibrary> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new NotFoundError('Library');
  }

  const library = await Library.findById(id);
  if (!library) throw new NotFoundError('Library');

  if (library.status === LIBRARY_STATUS.SUSPENDED) {
    throw new AppError('Library is already suspended', 400);
  }
  if (library.status === LIBRARY_STATUS.DELETED) {
    throw new AppError('Cannot suspend a deleted library', 400);
  }

  const updatedLibrary = (await Library.findByIdAndUpdate(
    id,
    { status: LIBRARY_STATUS.SUSPENDED },
    { new: true, runValidators: false }
  )) || library;

  // Also deactivate the owner user and library staff to prevent login
  const userFilters: any[] = [];
  if (library.owner && mongoose.Types.ObjectId.isValid(String(library.owner))) {
    userFilters.push({ _id: library.owner });
  }
  if (library._id) {
    userFilters.push({ libraryId: library._id });
  }
  if (userFilters.length > 0) {
    await User.updateMany({ $or: userFilters }, { isActive: false }).catch(() => {});
  }

  try {
    await logAction({
      action: 'library.suspended',
      performedBy: superAdminId,
      targetType: 'library',
      targetId: id,
      details: `Suspended library "${updatedLibrary.name}"`,
      ipAddress,
    });
  } catch (err) {
    logger.error('Failed to log audit action:', err);
  }

  logger.info(`⏸️  Library suspended: "${updatedLibrary.name}"`);
  return updatedLibrary;
}

// ── Activate Library ─────────────────────────────────────────────────────────

export async function activateLibrary(
  id: string,
  superAdminId: string,
  ipAddress?: string
): Promise<ILibrary> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new NotFoundError('Library');
  }

  const library = await Library.findById(id);
  if (!library) throw new NotFoundError('Library');

  if (library.status === LIBRARY_STATUS.ACTIVE) {
    throw new AppError('Library is already active', 400);
  }
  if (library.status === LIBRARY_STATUS.DELETED) {
    throw new AppError('Cannot activate a deleted library', 400);
  }

  const updatedLibrary = (await Library.findByIdAndUpdate(
    id,
    { status: LIBRARY_STATUS.ACTIVE },
    { new: true, runValidators: false }
  )) || library;

  // Re-activate owner and library staff users
  const userFilters: any[] = [];
  if (library.owner && mongoose.Types.ObjectId.isValid(String(library.owner))) {
    userFilters.push({ _id: library.owner });
  }
  if (library._id) {
    userFilters.push({ libraryId: library._id });
  }
  if (userFilters.length > 0) {
    await User.updateMany({ $or: userFilters }, { isActive: true }).catch(() => {});
  }

  try {
    await logAction({
      action: 'library.activated',
      performedBy: superAdminId,
      targetType: 'library',
      targetId: id,
      details: `Activated library "${updatedLibrary.name}"`,
      ipAddress,
    });
  } catch (err) {
    logger.error('Failed to log audit action:', err);
  }

  logger.info(`▶️  Library activated: "${updatedLibrary.name}"`);
  return updatedLibrary;
}

// ── Delete Library (Soft Delete) ─────────────────────────────────────────────

export async function deleteLibrary(
  id: string,
  superAdminId: string,
  ipAddress?: string
): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new NotFoundError('Library');
  }

  const library = await Library.findById(id);
  if (!library) throw new NotFoundError('Library');

  if (library.status === LIBRARY_STATUS.DELETED) {
    throw new AppError('Library is already deleted', 400);
  }

  await Library.findByIdAndUpdate(
    id,
    { status: LIBRARY_STATUS.DELETED },
    { new: true, runValidators: false }
  );

  const userFilters: any[] = [];
  if (library.owner && mongoose.Types.ObjectId.isValid(String(library.owner))) {
    userFilters.push({ _id: library.owner });
  }
  if (library._id) {
    userFilters.push({ libraryId: library._id });
  }
  if (userFilters.length > 0) {
    await User.updateMany({ $or: userFilters }, { isActive: false }).catch(() => {});
  }

  try {
    await logAction({
      action: 'library.deleted',
      performedBy: superAdminId,
      targetType: 'library',
      targetId: id,
      details: `Deleted library "${library.name}" (soft delete)`,
      ipAddress,
    });
  } catch (err) {
    logger.error('Failed to log audit action:', err);
  }

  logger.info(`🗑️  Library deleted (soft): "${library.name}"`);
}
