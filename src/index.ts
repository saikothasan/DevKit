import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { authRouter } from './routes/auth';
import { forumRouter } from './routes/forum';
import { toolsRouter } from './routes/tools';
import { chatRouter } from './routes/chat';
import { uploadRouter } from './routes/upload';

const app = new Hono();

app.use('*', secureHeaders());

app.route('/api/auth', authRouter);
app.route('/api/forum', forumRouter);
app.route('/api/tools', toolsRouter); 
app.route('/api/chat', chatRouter); 
app.route('/api/upload', uploadRouter); 

export default { fetch: app.fetch };
