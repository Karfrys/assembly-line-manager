import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const router = Router();

const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255),
});

const updateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255),
});

// GET /api/products
router.get('/', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(products);
  } catch (error) {
    console.error('List products error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid product ID.' });
      return;
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: { assemblyLines: true },
    });

    if (!product) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/products
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = createProductSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const { name } = parsed.data;

    const existing = await prisma.product.findUnique({ where: { name } });
    if (existing) {
      res.status(409).json({ error: 'A product with this name already exists.' });
      return;
    }

    const product = await prisma.product.create({ data: { name } });
    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/products/:id
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid product ID.' });
      return;
    }

    const parsed = updateProductSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    const { name } = parsed.data;

    // Check uniqueness if name changed
    if (name !== existing.name) {
      const duplicate = await prisma.product.findUnique({ where: { name } });
      if (duplicate) {
        res.status(409).json({ error: 'A product with this name already exists.' });
        return;
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: { name },
    });

    res.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/products/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid product ID.' });
      return;
    }

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    await prisma.product.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
