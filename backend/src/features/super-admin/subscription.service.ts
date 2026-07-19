/**
 * Subscription Service — CRUD for subscription plans (Super Admin only).
 */

import { Subscription, ISubscription } from './models/subscription.model';
import { Library } from './models/library.model';
import { ConflictError, NotFoundError } from '../../middleware/error.middleware';
import { CreateSubscriptionInput, UpdateSubscriptionInput } from './subscription.validation';

/**
 * Get all subscription plans (active first, then by price ascending).
 */
export async function getAllSubscriptions(): Promise<ISubscription[]> {
  return Subscription.find().sort({ isActive: -1, price: 1 });
}

/**
 * Get a single subscription by ID.
 */
export async function getSubscriptionById(id: string): Promise<ISubscription> {
  const subscription = await Subscription.findById(id);
  if (!subscription) throw new NotFoundError('Subscription');
  return subscription;
}

/**
 * Create a new subscription plan.
 */
export async function createSubscription(data: CreateSubscriptionInput): Promise<ISubscription> {
  const existing = await Subscription.findOne({ name: data.name });
  if (existing) throw new ConflictError('A subscription plan with this name already exists');

  const subscription = new Subscription(data);
  await subscription.save();
  return subscription;
}

/**
 * Update a subscription plan.
 */
export async function updateSubscription(
  id: string,
  data: UpdateSubscriptionInput
): Promise<ISubscription> {
  // If name is being changed, check for conflicts
  if (data.name) {
    const existing = await Subscription.findOne({ name: data.name, _id: { $ne: id } });
    if (existing) throw new ConflictError('A subscription plan with this name already exists');
  }

  const subscription = await Subscription.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!subscription) throw new NotFoundError('Subscription');
  return subscription;
}

/**
 * Delete a subscription plan (only if no libraries are using it).
 */
export async function deleteSubscription(id: string): Promise<void> {
  const subscription = await Subscription.findById(id);
  if (!subscription) throw new NotFoundError('Subscription');

  // Check if any active libraries are using this subscription
  const activeLibraries = await Library.countDocuments({
    subscription: id,
    status: { $ne: 'deleted' },
  });

  if (activeLibraries > 0) {
    throw new ConflictError(
      `Cannot delete "${subscription.name}" — ${activeLibraries} active ${activeLibraries === 1 ? 'library is' : 'libraries are'} using this plan`
    );
  }

  await subscription.deleteOne();
}

/**
 * Get subscription stats (count of libraries per plan).
 */
export async function getSubscriptionStats(): Promise<
  Array<{ subscriptionId: string; name: string; libraryCount: number }>
> {
  const subscriptions = await Subscription.find();

  const stats = await Promise.all(
    subscriptions.map(async (sub) => {
      const count = await Library.countDocuments({
        subscription: sub._id,
        status: { $ne: 'deleted' },
      });
      return {
        subscriptionId: String(sub._id),
        name: sub.name,
        libraryCount: count,
      };
    })
  );

  return stats;
}
