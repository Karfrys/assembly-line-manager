import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const router = Router();

const createWorkstationSchema = z.object({
  shortName: z.string().min(1, 'Short name is required').max(10),
  name: z.string().min(1, 'Name is required').max(255),
  pcName: z.string().max(255).optional().default(''),
});

const updateWorkstationSchema = z.object({
  shortName: z.string().min(1, 'Short name is required').max(10).optional(),
  name: z.string().min(1, 'Name is required').max(255).optional(),
  pcName: z.string().max(255).optional(),
});

// GET /api/workstations
router.get('/', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const workstations = await prisma.workstation.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(workstations);
  } catch (error) {
    console.error('List workstations error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/workstations/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid workstation ID.' });
      return;
    }

    const workstation = await prisma.workstation.findUnique({
      where: { id },
      include: {
        allocations: {
          include: { assemblyLine: true },
        },
      },
    });

    if (!workstation) {
      res.status(404).json({ error: 'Workstation not found.' });
      return;
    }

    res.json(workstation);
  } catch (error) {
    console.error('Get workstation error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/workstations
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = createWorkstationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const { shortName, name, pcName } = parsed.data;

    const workstation = await prisma.workstation.create({
      data: { shortName, name, pcName },
    });

    res.status(201).json(workstation);
  } catch (error) {
    console.error('Create workstation error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/workstations/:id
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid workstation ID.' });
      return;
    }

    const parsed = updateWorkstationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const existing = await prisma.workstation.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Workstation not found.' });
      return;
    }

    const { shortName, name, pcName } = parsed.data;

    const workstation = await prisma.workstation.update({
      where: { id },
      data: {
        ...(shortName !== undefined && { shortName }),
        ...(name !== undefined && { name }),
        ...(pcName !== undefined && { pcName }),
      },
    });

    res.json(workstation);
  } catch (error) {
    console.error('Update workstation error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/workstations/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid workstation ID.' });
      return;
    }

    const existing = await prisma.workstation.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Workstation not found.' });
      return;
    }

    await prisma.workstation.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Delete workstation error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
