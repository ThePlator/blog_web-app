import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import { sign } from 'hono/jwt';

const app = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
}>();

app.post('/api/v1/user/signup', async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  console.log('Request body:', body);

  // Log environment variables
  console.log('Environment Variables:', c.env);

  try {
    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: body.password,
      },
    });
    console.log('Created user:', user);

    const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
    console.log('Generated JWT:', jwt);

    return c.json({ jwt });
  } catch (error) {
    console.error('Error during signup:', error);
    c.status(400);
    return c.json({ error: (error as Error).message });
  }
});

app.post('/api/v1/user/signin', async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();

  const user = await prisma.user.findUnique({
    where: {
      email: body.email,
    },
  });

  if (!user) {
    c.status(403);
    return c.json({ error: 'user not found' });
  }

  const jwt = await sign({ id: user.id }, c.env.JWT_SECRET || '');
  return c.json({ jwt });
});

app.post('/api/v1/blog', (c) => {
  return c.text('blog route');
});

app.put('/api/v1/blog', (c) => {
  return c.text('update blog route');
});

app.get('/api/v1/blog/:id', (c) => {
  return c.text('get blog by id route');
});

app.get('/api/v1/blog/bulk', (c) => {
  return c.text('get all blogs route');
});

export default app;
