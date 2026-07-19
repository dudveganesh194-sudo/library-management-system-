import { Response } from 'express';
import { AuthRequest } from '../../shared/types';
import { successResponse, createdResponse } from '../../shared/helpers/api-response';
import {
  getAllSeats, getSeatById, createSeat, updateSeat, deleteSeat,
  assignSeat, releaseSeat, getSeatStats,
  bulkCreateSeats,
} from './seat.service';

export async function listSeats(req: AuthRequest, res: Response): Promise<void> {
  const libId = req.user.role === 'super_admin' ? (req.query.libraryId as string) : req.libraryId;
  const seats = await getAllSeats({ ...req.query, libraryId: libId } as any);
  successResponse(res, seats, 'Seats fetched');
}

export async function getSeat(req: AuthRequest, res: Response): Promise<void> {
  const libId = req.user.role === 'super_admin' ? undefined : req.libraryId;
  const seat = await getSeatById(req.params.id, libId);
  successResponse(res, seat);
}

export async function addSeat(req: AuthRequest, res: Response): Promise<void> {
  const libId = req.user.role === 'super_admin' ? (req.body.libraryId || req.libraryId) : req.libraryId;
  const seat = await createSeat(req.body, libId, req.user.id);
  createdResponse(res, seat, 'Seat created successfully');
}

export async function addSeatsInBulk(req: AuthRequest, res: Response): Promise<void> {
  const libId = req.user.role === 'super_admin' ? (req.body.libraryId || req.libraryId) : req.libraryId;
  const result = await bulkCreateSeats(req.body, libId, req.user.id);
  successResponse(res, result, 'Bulk seat creation completed', 201);
}

export async function editSeat(req: AuthRequest, res: Response): Promise<void> {
  const libId = req.user.role === 'super_admin' ? undefined : req.libraryId;
  const seat = await updateSeat(req.params.id, req.body, libId);
  successResponse(res, seat, 'Seat updated successfully');
}

export async function removeSeat(req: AuthRequest, res: Response): Promise<void> {
  const libId = req.user.role === 'super_admin' ? undefined : req.libraryId;
  await deleteSeat(req.params.id, libId);
  successResponse(res, null, 'Seat deleted successfully');
}

export async function assign(req: AuthRequest, res: Response): Promise<void> {
  const libId = req.user.role === 'super_admin' ? undefined : req.libraryId;
  const seat = await assignSeat(req.params.id, req.body.studentId, libId);
  successResponse(res, seat, 'Seat assigned successfully');
}

export async function release(req: AuthRequest, res: Response): Promise<void> {
  const libId = req.user.role === 'super_admin' ? undefined : req.libraryId;
  const seat = await releaseSeat(req.params.id, libId);
  successResponse(res, seat, 'Seat released successfully');
}

export async function seatStats(req: AuthRequest, res: Response): Promise<void> {
  const libId = req.user.role === 'super_admin' ? (req.query.libraryId as string) : req.libraryId;
  const stats = await getSeatStats(libId);
  successResponse(res, stats, 'Seat statistics fetched');
}
