import app from './server';
import pool from './database/db';

const PORT = process.env.PORT || 3000;

async function bootstrap() {
    await pool.query('SELECT 1');
    console.log('Database connection successful');
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

bootstrap().catch((err) => {
    console.error('Failed to bootstrap the application:', err);
    process.exit(1);
});

export default app;