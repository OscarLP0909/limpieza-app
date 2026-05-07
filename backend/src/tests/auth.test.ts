import request from 'supertest';
import app from "../../src/index";
import { describe, expect, it } from '@jest/globals';

describe('POST /auth/login', () => {
    it('should return 200 with valid credentials', async() => {
        const res = await request(app)
            .post('/auth/login')
            .send({
                email: 'admin@example.com',
                password: 'admin123'
            });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Login successful');
    });

    it('should return 401 with invalid credentials', async() => {
        const res = await request(app)
            .post('/auth/login')
            .send({
                email: 'paco@paco.com',
                password: '1234'
            });
        
        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Invalid credentials');
    });
    it('should return 400 with no email', async() => {
        const res = await request(app)
            .post('/auth/login')
            .send({
                email: '',
                password:'123456'
            });

        expect(res.status).toBe(400);
    })
});

describe('POST /auth/register', () => {
    it('should return 201 with valid credentials', async() => {
        const res = await request(app)
            .post('/auth/register')
            .send({
                nombre: 'Ejemplo',
                apellidos: 'Algo Algo',
                direccion: 'Calle',
                telefono: '987898989',
                email: 'aa@aa.com',
                password: '1234'
            });
        
        expect(res.status).toBe(201);
        expect(res.body.message).toBe('Client registered');
    });

    it('should return 400, email already exists', async() => {
        const res = await request(app)
            .post('/auth/register')
            .send({
                nombre: 'Ejemplo',
                apellidos: 'Algo Algo',
                direccion: 'Calle',
                telefono: '987898989',
                email: 'rr@rr.com',
                password: '1234'
            });
        
        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Email already exists');
    });

    it('should return 400, all fields are required', async() => {
        const res = await request(app)
            .post('/auth/register')
            .send({
                nombre: '',
                apellidos: '',
                direccion: '',
                telefono: '',
                email: '',
                password: '' 
            });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('All fields are required');
    })
});

describe('POST /auth/logout', () => {
    it('should return 200, clear token', async() => {
        const loginRes = await request(app)
            .post('/auth/login')
            .send({
                email: 'admin@example.com',
                password: 'admin123'
            });
            const cookie = loginRes.headers['set-cookie'];

            // logout
            const res = await request(app)
                .post('/auth/logout')
                .set('Cookie', cookie);
            
            expect(res.status).toBe(200);
    });
});

describe('POST /auth/me', () => {
    it('should return 200 with user', async() => {
        const loginRes = await request(app)
            .post('/auth/login')
            .send({
                email: 'admin@example.com',
                password: 'admin123'
            });
            const cookie = loginRes.headers['set-cookie'];

            const res = await request(app)
                .get('/auth/me')
                .set('Cookie', cookie);

            expect(res.status).toBe(200);
    })
})