import { Response } from 'express';
import { AuthRequest } from '../../shared/types';
import { successResponse, createdResponse } from '../../shared/helpers/api-response';
import { getAllFloors, createFloor, updateFloor, deleteFloor } from './floor.service';

export async function listFloors(req: AuthRequest, res: Response): Promise<void> {
  const libId = req.user.role === 'super_admin' ? (req.query.libraryId as string) : req.libraryId;
  const floors = await getAllFloors(libId);
  successResponse(res, floors, 'Floors fetched successfully');
}

export async function addFloor(req: AuthRequest, res: Response): Promise<void> {
  const libId = req.user.role === 'super_admin' ? (req.body.libraryId || req.libraryId) : req.libraryId;
  const floor = await createFloor(req.body, libId);
  createdResponse(res, floor, 'Floor created successfully');
}

export async function editFloor(req: AuthRequest, res: Response): Promise<void> {
  const libId = req.user.role === 'super_admin' ? undefined : req.libraryId;
  const floor = await updateFloor(req.params.id, req.body, libId);
  successResponse(res, floor, 'Floor updated successfully');
}

export async function removeFloor(req: AuthRequest, res: Response): Promise<void> {
  const libId = req.user.role === 'super_admin' ? undefined : req.libraryId;
  await deleteFloor(req.params.id, libId);
  successResponse(res, null, 'Floor deleted successfully');
}
