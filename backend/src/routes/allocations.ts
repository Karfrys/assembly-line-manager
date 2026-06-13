import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const router = Router({ mergeParams: true });

const addAllocationSchema = z.object({
  workstationId: z.number().int().positive('Workstation ID must be a positive integer'),
});

const reorderSchema = z.object({
  workstationIds: z.array(z.number().int().positive()).min(1, 'workstationIds must contain at least one ID'),
});

// Helper to get assembly line ID from params and validate it exists
async function getAssemblyLineId(req: AuthRequest, res: Response): Promise<number | null> {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid assembly line ID.' });
    return null;
  }

  const assemblyLine = await prisma.assemblyLine.findUnique({ where: { id } });
  if (!assemblyLine) {
    res.status(404).json({ error: 'Assembly line not found.' });
    return null;
  }

  return id;
}

// GET /api/assembly-lines/:id/allocations
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const assemblyLineId = await getAssemblyLineId(req, res);
    if (assemblyLineId === null) return;

    const allocations = await prisma.allocation.findMany({
      where: { assemblyLineId },
      include: { workstation: true },
      orderBy: { sortOrder: 'asc' },
    });

    res.json(allocations);
  } catch (error) {
    console.error('List allocations error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/assembly-lines/:id/allocations
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const assemblyLineId = await getAssemblyLineId(req, res);
    if (assemblyLineId === null) return;

    const parsed = addAllocationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const { workstationId } = parsed.data;

    // Verify workstation exists
    const workstation = await prisma.workstation.findUnique({ where: { id: workstationId } });
    if (!workstation) {
      res.status(400).json({ error: 'Workstation not found.' });
      return;
    }

    // Check if already allocated
    const existingAllocation = await prisma.allocation.findUnique({
      where: {
        assemblyLineId_workstationId: { assemblyLineId, workstationId },
      },
    });
    if (existingAllocation) {
      res.status(409).json({ error: 'This workstation is already allocated to this assembly line.' });
      return;
    }

    // Determine next sort order (max + 1)
    const maxSortOrder = await prisma.allocation.aggregate({
      where: { assemblyLineId },
      _max: { sortOrder: true },
    });
    const sortOrder = (maxSortOrder._max.sortOrder ?? 0) + 1;

    const allocation = await prisma.allocation.create({
      data: { assemblyLineId, workstationId, sortOrder },
      include: { workstation: true },
    });

    res.status(201).json(allocation);
  } catch (error) {
    console.error('Create allocation error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/assembly-lines/:id/allocations/reorder
router.put('/reorder', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const assemblyLineId = await getAssemblyLineId(req, res);
    if (assemblyLineId === null) return;

    const parsed = reorderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const { workstationIds } = parsed.data;

    // Verify all workstation IDs correspond to existing allocations for this line
    const existingAllocations = await prisma.allocation.findMany({
      where: { assemblyLineId },
    });

    const existingWorkstationIds = new Set(existingAllocations.map((a) => a.workstationId));

    for (const wsId of workstationIds) {
      if (!existingWorkstationIds.has(wsId)) {
        res.status(400).json({
          error: `Workstation ID ${wsId} is not allocated to this assembly line.`,
        });
        return;
      }
    }

    // Check that all existing allocations are included
    if (workstationIds.length !== existingAllocations.length) {
      res.status(400).json({
        error: `Expected ${existingAllocations.length} workstation IDs, received ${workstationIds.length}. All allocated workstations must be included.`,
      });
      return;
    }

    // Check for duplicates in the input
    const uniqueIds = new Set(workstationIds);
    if (uniqueIds.size !== workstationIds.length) {
      res.status(400).json({ error: 'Duplicate workstation IDs are not allowed.' });
      return;
    }

    // Update sort orders in a transaction
    await prisma.$transaction(
      workstationIds.map((workstationId, index) =>
        prisma.allocation.update({
          where: {
            assemblyLineId_workstationId: { assemblyLineId, workstationId },
          },
          data: { sortOrder: index + 1 },
        })
      )
    );

    // Return the updated allocations
    const updatedAllocations = await prisma.allocation.findMany({
      where: { assemblyLineId },
      include: { workstation: true },
      orderBy: { sortOrder: 'asc' },
    });

    res.json(updatedAllocations);
  } catch (error) {
    console.error('Reorder allocations error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/assembly-lines/:id/allocations/:workstationId
router.delete('/:workstationId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const assemblyLineId = await getAssemblyLineId(req, res);
    if (assemblyLineId === null) return;

    const workstationId = parseInt(req.params.workstationId, 10);
    if (isNaN(workstationId)) {
      res.status(400).json({ error: 'Invalid workstation ID.' });
      return;
    }

    // Check allocation exists
    const allocation = await prisma.allocation.findUnique({
      where: {
        assemblyLineId_workstationId: { assemblyLineId, workstationId },
      },
    });

    if (!allocation) {
      res.status(404).json({ error: 'Allocation not found.' });
      return;
    }

    // Delete the allocation
    await prisma.allocation.delete({
      where: { id: allocation.id },
    });

    // Re-compact sort orders for remaining allocations
    const remaining = await prisma.allocation.findMany({
      where: { assemblyLineId },
      orderBy: { sortOrder: 'asc' },
    });

    if (remaining.length > 0) {
      await prisma.$transaction(
        remaining.map((alloc, index) =>
          prisma.allocation.update({
            where: { id: alloc.id },
            data: { sortOrder: index + 1 },
          })
        )
      );
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete allocation error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
