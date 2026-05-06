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
})