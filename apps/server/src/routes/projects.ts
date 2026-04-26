import { Hono } from 'hono';
import { prisma } from '../lib/prisma.js';

export const projectsRoute = new Hono();

// GET /api/projects — get all projects
projectsRoute.get('/api/projects', async (c) => {
  const projects = await prisma.project.findMany({ orderBy: { updatedAt: 'desc' } });
  return c.json(projects);
});

// GET /api/projects/:id — get single project
projectsRoute.get('/api/projects/:id', async (c) => {
  const { id } = c.req.param();
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    return c.json({ error: 'Project not found' }, 404);
  }
  return c.json(project);
});

// POST /api/projects — create project
projectsRoute.post('/api/projects', async (c) => {
  const body = await c.req.json();
  const { name, path, description, source, gitInit } = body;

  if (!name || !path) {
    return c.json({ error: 'name and path are required' }, 400);
  }

  // Check if path already exists
  const existing = await prisma.project.findUnique({ where: { path } });
  if (existing) {
    return c.json(existing);
  }

  // gitInit handling (only for source=create)
  if (gitInit && source === 'create') {
    try {
      const { execSync } = await import('child_process');
      execSync(`git init "${path}"`, { stdio: 'ignore' });
    } catch {
      // git init failure doesn't block project creation
    }
  }

  const project = await prisma.project.create({
    data: {
      name,
      path,
      description: description ?? null,
      source: source ?? 'local',
    },
  });

  return c.json(project, 201);
});

// DELETE /api/projects/:id — delete project
projectsRoute.delete('/api/projects/:id', async (c) => {
  const { id } = c.req.param();
  try {
    await prisma.project.delete({ where: { id } });
    return c.json({ success: true });
  } catch {
    return c.json({ error: 'Project not found' }, 404);
  }
});
