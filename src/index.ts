import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { authRouter } from './routes/auth';
import { forumRouter } from './routes/forum';
import { toolsRouter } from './routes/tools';
import { chatRouter } from './routes/chat';
import { LiveSession } from './do/LiveSession';

const app = new Hono();

// Apply security headers across all endpoints
app.use('*', secureHeaders());

// Mount Modular Routers
app.route('/api/auth', authRouter);
app.route('/api/forum', forumRouter);
app.route('/api/tools', toolsRouter); 
app.route('/api/chat', chatRouter); 

export default { fetch: app.fetch };

// REQUIRED: Export the Durable Object class for the Cloudflare execution environment
export { LiveSession };
