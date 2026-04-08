import { Request, Response, NextFunction } from "express";
import { RowDataPacket } from "mysql2";
import db from "../database/db";

interface EmployeeRow extends RowDataPacket {
    
}