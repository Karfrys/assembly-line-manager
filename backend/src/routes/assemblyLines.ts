import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const router = Router();

const createAssemblyLineSchema = z.object({
  name: z.string().min(1, 'Assembly line name is required').max(255),
  productId: z.number().int().positive('Product ID must be a positive integer'),
  active: z.boolean().optional().default(true),
});

const updateAssemblyLineSchema = z.object({
  name: z.string().min(1, 'Assembly line name is required').max(255).optional(),
  productId: z.number().int().positive('Product ID must be a positive integer').optional(),
  active: z.boolean().optional(),
});

// GET /api/assembly-lines
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const productIdParam = req.query.productId as string | undefined;
    const where: { productId?: number } = {};

    if (productIdParam) {
      const productId = parseInt(productIdParam, 10);
      if (isNaN(productId)) {
        res.status(400).json({ error: 'Invalid productId query parameter.' });
        return;
      }
      where.productId = productId;
    }

    const assemblyLines = await prisma.assemblyLine.findMany({
      where,
      include: { product: true },
      orderBy: { name: 'asc' },
    });

    res.json(assemblyLines);
  } catch (error) {
    console.error('List assembly lines error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/assembly-lines/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid assembly line ID.' });
      return;
    }

    const assemblyLine = await prisma.assemblyLine.findUnique({
      where: { id },
      include: {
        product: true,
        allocations: {
          include: { workstation: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!assemblyLine) {
      res.status(404).json({ error: 'Assembly line not found.' });
      return;
    }

    res.json(assemblyLine);
  } catch (error) {
    console.error('Get assembly line error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/assembly-lines
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = createAssemblyLineSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const { name, productId, active } = parsed.data;

    // Verify product exists
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      res.status(400).json({ error: 'Product not found. Provide a valid productId.' });
      return;
    }

    const assemblyLine = await prisma.assemblyLine.create({
      data: { name, productId, active },
      include: { product: true },
    });

    res.status(201).json(assemblyLine);
  } catch (error) {
    console.error('Create assembly line error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/assembly-lines/:id
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid assembly line ID.' });
      return;
    }

    const parsed = updateAssemblyLineSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const existing = await prisma.assemblyLine.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Assembly line not found.' });
      return;
    }

    const { name, productId, active } = parsed.data;

    // If productId is being changed, verify the new product exists
    if (productId !== undefined) {
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) {
        res.status(400).json({ error: 'Product not found. Provide a valid productId.' });
        return;
      }
    }

    const assemblyLine = await prisma.assemblyLine.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(productId !== undefined && { productId }),
        ...(active !== undefined && { active }),
      },
      include: { product: true },
    });

    res.json(assemblyLine);
  } catch (error) {
    console.error('Update assembly line error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/assembly-lines/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid assembly line ID.' });
      return;
    }

    const existing = await prisma.assemblyLine.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Assembly line not found.' });
      return;
    }

    await prisma.assemblyLine.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Delete assembly line error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
