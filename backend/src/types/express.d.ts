export {};

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: number;
                role_id: number;
                role: string,
                type: 'client' | 'employee';
                client_id?: number;
            }
        }
    }
}