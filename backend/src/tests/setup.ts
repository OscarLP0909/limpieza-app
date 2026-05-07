import { afterAll } from "@jest/globals";
import pool from "../database/db";

afterAll(async () => {
    await pool.end();
});