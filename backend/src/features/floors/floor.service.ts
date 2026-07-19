/**
 * Floor service — manage library floors and occupancy stats (Multi-tenant scoped by libraryId).
 */

import { Floor, IFloor } from './floor.model';
import { Seat } from '../seats/seat.model';
import { NotFoundError, ConflictError, AppError } from '../../middleware/error.middleware';

export async function getAllFloors(libraryId?: string) {
  const filter: Record<string, unknown> = {};
  if (libraryId) filter.libraryId = libraryId;

  // Sync logic: Find all unique floor numbers in Seat collection for this library
  const seatFloors = await Seat.distinct('floor', filter);
  const existingFloors = await Floor.find(filter);
  const existingFloorNumbers = existingFloors.map((f) => f.floorNumber);

  // Auto-seed missing floors for this library
  for (const fNum of seatFloors) {
    if (!existingFloorNumbers.includes(fNum)) {
      await Floor.create({
        ...(libraryId && { libraryId }),
        floorNumber: fNum,
        name: `Floor ${fNum}`,
        description: 'Automatically imported from existing seat records',
      });
    }
  }

  // Reload floors
  const floors = await Floor.find(filter).sort({ floorNumber: 1 });

  // Enrich each floor with seat counts and occupancy stats
  const enrichedFloors = await Promise.all(
    floors.map(async (floor) => {
      const seatFilter: Record<string, unknown> = { floor: floor.floorNumber };
      if (libraryId) seatFilter.libraryId = libraryId;

      const seats = await Seat.find(seatFilter);
      const totalSeats = seats.length;
      const occupiedSeats = seats.filter((s) => s.status === 'occupied').length;
      const availableSeats = seats.filter((s) => s.status === 'available').length;
      const maintenanceSeats = seats.filter((s) => s.status === 'maintenance').length;
      const reservedSeats = seats.filter((s) => s.status === 'reserved').length;

      return {
        _id: floor._id,
        floorNumber: floor.floorNumber,
        name: floor.name,
        description: floor.description,
        createdAt: floor.createdAt,
        updatedAt: floor.updatedAt,
        stats: {
          total: totalSeats,
          occupied: occupiedSeats,
          available: availableSeats,
          maintenance: maintenanceSeats,
          reserved: reservedSeats,
          occupancyRate: totalSeats ? Math.round((occupiedSeats / totalSeats) * 100) : 0,
        },
      };
    })
  );

  return enrichedFloors;
}

export async function createFloor(data: Partial<IFloor>, libraryId?: string): Promise<IFloor> {
  const filter: Record<string, unknown> = { floorNumber: data.floorNumber };
  if (libraryId) filter.libraryId = libraryId;

  const existing = await Floor.findOne(filter);
  if (existing) {
    throw new ConflictError(`Floor ${data.floorNumber} already exists in this library`);
  }
  const floor = new Floor({
    ...data,
    ...(libraryId && { libraryId: libraryId as any }),
  });
  await floor.save();
  return floor;
}

export async function updateFloor(id: string, data: Partial<IFloor>, libraryId?: string): Promise<IFloor> {
  const filter: Record<string, unknown> = { _id: id };
  if (libraryId) filter.libraryId = libraryId;

  const floor = await Floor.findOneAndUpdate(filter, data, { new: true, runValidators: true });
  if (!floor) throw new NotFoundError('Floor');
  return floor;
}

export async function deleteFloor(id: string, libraryId?: string): Promise<void> {
  const filter: Record<string, unknown> = { _id: id };
  if (libraryId) filter.libraryId = libraryId;

  const floor = await Floor.findOne(filter);
  if (!floor) throw new NotFoundError('Floor');

  const seatFilter: Record<string, unknown> = { floor: floor.floorNumber };
  if (libraryId) seatFilter.libraryId = libraryId;

  // Prevent deleting a floor if it contains occupied seats
  const occupiedSeatsCount = await Seat.countDocuments({
    ...seatFilter,
    status: 'occupied',
  });

  if (occupiedSeatsCount > 0) {
    throw new AppError(
      `Cannot delete Floor ${floor.floorNumber} because it contains ${occupiedSeatsCount} occupied seats.`,
      400
    );
  }

  // Delete all unoccupied seats on this floor as well for this library
  await Seat.deleteMany(seatFilter);
  await floor.deleteOne();
}
