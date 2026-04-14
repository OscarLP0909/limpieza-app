import { Request, Response, NextFunction } from "express";
import { RowDataPacket } from "mysql2";
import db from "../database/db";
import { sendEmail } from "../helpers/sendEmail";

interface WorkRow extends RowDataPacket {
    id: number;
    id_tipo_servicio: number,
    id_cliente: number,
    nombre: string;
    tipo_servicio: string;
    frecuencia: string;
    direccion_trabajo: string;
    estado: string;
    precio: number;
    duracion: number;
    fecha_hora: Date;
    presupuesto_expira_en: Date;
};

export const getWorks = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        const [works] = await db.query<WorkRow[]>(
            'SELECT t.id, c.nombre, s.tipo_servicio, f.frecuencia, t.direccion_trabajo, t.estado, t.precio, t.duracion, t.fecha_hora, t.presupuesto_expira_en FROM Trabajos t JOIN clients c ON t.id_cliente = c.id JOIN Tipo_Servicio s ON t.id_tipo_servicio = s.id JOIN Frecuencia f ON t.id_frecuencia = f.id LIMIT ? OFFSET ?',
            [limit, offset]
        );
        const [total] = await db.query<RowDataPacket[]>('SELECT COUNT(*) as total FROM Trabajos');

        return res.status(200).json({
            data: works,
            pagination: { page, limit, total: total[0].total, totalPages: Math.ceil(total[0].total / limit) }
        });
    } catch (error) {
        next(error);
    }
};

export const getWorkById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const [works] = await db.query<WorkRow[]>('SELECT t.id, c.nombre, s.tipo_servicio, f.frecuencia, t.direccion_trabajo, t.estado, t.precio, t.duracion, t.fecha_hora, t.presupuesto_expira_en FROM Trabajos t JOIN clients c ON t.id_cliente = c.id JOIN Tipo_Servicio s ON t.id_tipo_servicio = s.id JOIN Frecuencia f ON t.id_frecuencia = f.id WHERE t.id = ?', [id]);
        if (works.length === 0) {
            return res.status(404).json({ message: 'Work not found' });
        }
        return res.status(200).json(works[0]);
    } catch (error) {
        next(error);
    }
};

export const createWork = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id_cliente = (req as any).user!.client_id;
        if (!id_cliente) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { id_tipo_servicio, id_frecuencia, direccion_trabajo, fecha_hora } = req.body;
        if (!id_tipo_servicio || !id_frecuencia || !direccion_trabajo || !fecha_hora) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const [result] = await db.query(
            'INSERT INTO Trabajos (id_cliente, id_tipo_servicio, id_frecuencia, direccion_trabajo, fecha_hora, estado) VALUES (?, ?, ?, ?, ?, ?)',
            [id_cliente, id_tipo_servicio, id_frecuencia, direccion_trabajo, fecha_hora, 'pendiente']
        );
        const workId = (result as any).insertId;

        // Fetch work details for the notification email
        const [workRows] = await db.query<WorkRow[]>(`
            SELECT c.nombre, s.tipo_servicio, f.frecuencia, t.direccion_trabajo, t.fecha_hora
            FROM Trabajos t
            JOIN Clients c ON c.id = t.id_cliente
            JOIN Tipo_Servicio s ON s.id = t.id_tipo_servicio
            JOIN Frecuencia f ON f.id = t.id_frecuencia
            WHERE t.id = ?
        `, [workId]);

        // Notify all admins and gestores
        const [staffRows] = await db.query<WorkRow[]>(
            'SELECT u.email FROM Users u WHERE u.role_id IN (1, 2)'
        );
        if (workRows.length > 0 && staffRows.length > 0) {
            const w = workRows[0]!;
            const staffEmails = (staffRows as any[]).map((r: any) => r.email).join(', ');
            await sendEmail({
                to: staffEmails,
                subject: `Nuevo trabajo solicitado — ${w.tipo_servicio}`,
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <div style="background-color: #2563eb; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                        <h1 style="color: white; margin: 0;">LimpiezaPro</h1>
                    </div>
                    <div style="padding: 30px;">
                        <h2 style="color: #1e293b;">📋 Nuevo trabajo solicitado</h2>
                        <p style="color: #64748b;">Se ha recibido una nueva solicitud de trabajo que requiere asignación de empleados y presupuesto.</p>
                        <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr style="border-bottom: 1px solid #e2e8f0;">
                                    <td style="padding: 10px 0; color: #64748b; width: 140px;">Cliente</td>
                                    <td style="padding: 10px 0; color: #1e293b; font-weight: bold;">${w.nombre}</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #e2e8f0;">
                                    <td style="padding: 10px 0; color: #64748b;">Servicio</td>
                                    <td style="padding: 10px 0; color: #1e293b; font-weight: bold;">${w.tipo_servicio}</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #e2e8f0;">
                                    <td style="padding: 10px 0; color: #64748b;">Frecuencia</td>
                                    <td style="padding: 10px 0; color: #1e293b; font-weight: bold;">${w.frecuencia}</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #e2e8f0;">
                                    <td style="padding: 10px 0; color: #64748b;">Dirección</td>
                                    <td style="padding: 10px 0; color: #1e293b; font-weight: bold;">${w.direccion_trabajo}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0; color: #64748b;">Fecha y hora</td>
                                    <td style="padding: 10px 0; color: #1e293b; font-weight: bold;">${new Date(w.fecha_hora).toLocaleString('es-ES')}</td>
                                </tr>
                            </table>
                        </div>
                        <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 16px; border-radius: 4px;">
                            <p style="margin: 0; color: #1d4ed8;">⚡ Accede al panel de administración para asignar empleados y generar el presupuesto.</p>
                        </div>
                    </div>
                    <div style="background-color: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; text-align: center;">
                        <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2026 LimpiezaPro. Todos los derechos reservados.</p>
                    </div>
                </div>`
            });
        }

        return res.status(201).json({ id: workId, message: 'Work created successfully' });
    } catch (error) {
        next(error);
    }
};

export const getWorksByClientId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id_cliente = (req as any).user!.client_id;
        if (!id_cliente) return res.status(403).json({ message: 'Forbidden' });

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        const [works] = await db.query<WorkRow[]>(
            'SELECT t.id, c.nombre, s.tipo_servicio, f.frecuencia, t.direccion_trabajo, t.estado, t.precio, t.duracion, t.fecha_hora, t.presupuesto_expira_en FROM Trabajos t JOIN clients c ON t.id_cliente = c.id JOIN Tipo_Servicio s ON t.id_tipo_servicio = s.id JOIN Frecuencia f ON t.id_frecuencia = f.id WHERE t.id_cliente = ? LIMIT ? OFFSET ?',
            [id_cliente, limit, offset]
        );
        const [total] = await db.query<RowDataPacket[]>(
            'SELECT COUNT(*) as total FROM Trabajos WHERE id_cliente = ?',
            [id_cliente]
        );

        return res.status(200).json({
            data: works,
            pagination: { page, limit, total: total[0].total, totalPages: Math.ceil(total[0].total / limit) }
        });
    } catch (error) {
        next(error);
    }
};

export const updateWork = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { id_employees, duracion } = (req as any).body;
        if (!id) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        if (!id_employees || id_employees.length === 0) {
            return res.status(400).json({ message: 'At least one employee es required' });
        }
        if (!duracion) {
            return res.status(400).json({ message: 'Duration is required' });
        }
        const [rows] = await db.query<WorkRow[]>(`
            SELECT t.id_tipo_servicio, t.id_cliente, t.fecha_hora,
            s.tipo_servicio, f.frecuencia
            FROM Trabajos t
            JOIN Tipo_Servicio s ON s.id = t.id_tipo_servicio
            JOIN Frecuencia f ON f.id = t.id_frecuencia
            WHERE t.id = ?
            `, [id]);
        if (rows.length === 0) {
            return res.status(400).json({ message: 'Work not found' });
        }
        const id_tipo_servicio = rows[0]?.id_tipo_servicio;
        const [precio_rows] = await db.query<WorkRow[]>('SELECT precio FROM Tipo_Servicio WHERE id = ?', id_tipo_servicio);
        if (precio_rows.length === 0) {
            return res.status(400).json({ message: 'Precio not found' });
        }


        const expira = new Date();
        expira.setDate(expira.getDate() + 15);


        const [existing] = await db.query<RowDataPacket[]>(
            'SELECT id_empleado FROM Trabajo_Empleado WHERE id_trabajo = ?',
            [id]
        );

        const existingIds = existing.map((e: any) => e.id_empleado);
        const newEmployees = id_employees.filter((e: number) => !existingIds.includes(e));

        if (newEmployees.length === 0) {
            return res.status(400).json({ message: 'All employees are already assigned' });
        }

        const precio = precio_rows[0]?.precio;
        const totalEmployees = existingIds.length + newEmployees.length;
        const precio_final = precio * totalEmployees;

        const [emailUser] = await db.query<WorkRow[]>('SELECT u.email FROM Users u JOIN Clients c on c.user_id = u.id WHERE c.id = ?', [rows[0]?.id_cliente]);

        await Promise.all(
            newEmployees.map((employee: number) =>
                db.query(
                    'INSERT INTO Trabajo_Empleado (id_trabajo, id_empleado) VALUES (?, ?)',
                    [id, employee]
                ))
        );

        await db.query('UPDATE Trabajos SET precio = ?, duracion = ?, estado = ?, presupuesto_expira_en = ? WHERE id = ?', [precio_final, duracion, 'presupuestado', expira, id]);

        await sendEmail({
            to: emailUser[0].email,
            subject: 'Presupuesto de tu servicio de limpieza',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <div style="background-color: #2563eb; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0;">Limpieza App</h1>
            </div>
            
            <div style="padding: 30px;">
                <h2 style="color: #1e293b;">¡Tu presupuesto está listo! 🎉</h2>
                <p style="color: #64748b;">Hemos preparado el presupuesto para tu servicio. Aquí tienes los detalles:</p>
                
                <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 12px 0; color: #64748b;">Tipo de servicio</td>
                            <td style="padding: 12px 0; color: #1e293b; font-weight: bold;">${rows[0].tipo_servicio}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 12px 0; color: #64748b;">Frecuencia</td>
                            <td style="padding: 12px 0; color: #1e293b; font-weight: bold;">${rows[0].frecuencia}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 12px 0; color: #64748b;">Fecha y hora</td>
                            <td style="padding: 12px 0; color: #1e293b; font-weight: bold;">${new Date(rows[0].fecha_hora).toLocaleString('es-ES')}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 0; color: #64748b;">Precio total</td>
                            <td style="padding: 12px 0; color: #2563eb; font-weight: bold; font-size: 20px;">${precio_final}€</td>
                        </tr>
                    </table>
                </div>

                <div style="background-color: #fef9c3; border-left: 4px solid #eab308; padding: 16px; border-radius: 4px; margin: 20px 0;">
                    <p style="margin: 0; color: #854d0e;">⚠️ Tienes <strong>15 días</strong> para aceptar o rechazar este presupuesto.</p>
                </div>

                <p style="color: #64748b; font-size: 14px; margin-top: 30px;">Si tienes alguna duda, no dudes en contactarnos.</p>
            </div>

            <div style="background-color: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; text-align: center;">
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2026 Limpieza App. Todos los derechos reservados.</p>
            </div>
        </div>
    `
        });
        res.status(200).json({ message: "Task updated successfully" });
    } catch (error) {
        next(error);
    }
};

export const updateWorkStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const id_cliente = (req as any).user!.client_id;
        const validStatuses = ["aceptado", "rechazado", "cancelado"];
        const cancelableStatuses = ["presupuestado", "aceptado"];
        if (!id) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        if (!status || typeof (status) !== "string") {
            return res.status(403).json({ message: 'Status is required and must be a String' });
        }
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Status must be aceptado or rechazado' })
        }
        const [rows] = await db.query<WorkRow[]>('SELECT estado, id_cliente FROM trabajos WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "Work not found" });
        }
        if (rows[0].id_cliente !== id_cliente) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        if (!cancelableStatuses.includes(rows[0].estado)) {
            return res.status(400).json({ message: 'Work cannot be updated in its current status' });
        }
        if (rows[0].estado === 'aceptado' && status !== 'cancelado') {
            return res.status(400).json({ message: 'Work in aceptado status can only be cancelled' })
        }
        await db.query('UPDATE trabajos SET estado = ? WHERE id = ?', [status, id]);
        res.status(200).json({ message: "Task updated successfully" });
    } catch (error) {
        next(error);
    }
};

/** Cliente solicita cancelación → notifica a admin/gestor por email */
export const requestCancelWork = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const id_cliente = (req as any).user!.client_id;

        const [rows] = await db.query<WorkRow[]>(`
            SELECT t.estado, t.id_cliente, c.nombre,
                   s.tipo_servicio, f.frecuencia, t.direccion_trabajo, t.fecha_hora
            FROM Trabajos t
            JOIN Clients c ON c.id = t.id_cliente
            JOIN Tipo_Servicio s ON s.id = t.id_tipo_servicio
            JOIN Frecuencia f ON f.id = t.id_frecuencia
            WHERE t.id = ?`, [id]);

        if (rows.length === 0) return res.status(404).json({ message: 'Work not found' });
        if (rows[0].id_cliente !== id_cliente) return res.status(403).json({ message: 'Forbidden' });
        if (rows[0].estado !== 'aceptado') return res.status(400).json({ message: 'Solo se pueden solicitar cancelaciones de trabajos aceptados' });

        await db.query('UPDATE Trabajos SET estado = ? WHERE id = ?', ['cancelacion_solicitada', id]);

        const w = rows[0];
        const [staffRows] = await db.query<WorkRow[]>('SELECT u.email FROM Users u WHERE u.role_id IN (1, 2)');
        const staffEmails = (staffRows as any[]).map((r: any) => r.email).join(', ');

        await sendEmail({
            to: staffEmails,
            subject: `Solicitud de cancelacion - Trabajo #${id}`,
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <div style="background-color: #dc2626; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0;">LimpiezaPro</h1>
                </div>
                <div style="padding: 30px;">
                    <h2 style="color: #1e293b;">Solicitud de cancelacion - Trabajo #${id}</h2>
                    <p style="color: #64748b;">El cliente <strong>${w.nombre}</strong> ha solicitado la cancelacion del siguiente trabajo. Por favor, revisa la situacion y procede a cancelarlo si corresponde.</p>
                    <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 10px 0; color: #64748b; width: 140px;">Cliente</td>
                                <td style="padding: 10px 0; color: #1e293b; font-weight: bold;">${w.nombre}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 10px 0; color: #64748b;">Servicio</td>
                                <td style="padding: 10px 0; color: #1e293b; font-weight: bold;">${w.tipo_servicio}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 10px 0; color: #64748b;">Frecuencia</td>
                                <td style="padding: 10px 0; color: #1e293b; font-weight: bold;">${w.frecuencia}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 10px 0; color: #64748b;">Direccion</td>
                                <td style="padding: 10px 0; color: #1e293b; font-weight: bold;">${w.direccion_trabajo}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0; color: #64748b;">Fecha y hora</td>
                                <td style="padding: 10px 0; color: #1e293b; font-weight: bold;">${new Date(w.fecha_hora).toLocaleString('es-ES')}</td>
                            </tr>
                        </table>
                    </div>
                    <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; border-radius: 4px;">
                        <p style="margin: 0; color: #991b1b;">Accede al panel de administracion para cancelar este trabajo.</p>
                    </div>
                </div>
                <div style="background-color: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; text-align: center;">
                    <p style="color: #94a3b8; font-size: 12px; margin: 0;">2026 LimpiezaPro. Todos los derechos reservados.</p>
                </div>
            </div>`
        });

        return res.status(200).json({ message: 'Solicitud de cancelacion enviada al responsable' });
    } catch (error) {
        next(error);
    }
};

/** Admin/gestor cancela el trabajo efectivamente */
export const adminCancelWork = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query<WorkRow[]>(`
            SELECT t.estado, t.id_cliente, t.direccion_trabajo, t.fecha_hora, t.precio,
                   c.nombre, s.tipo_servicio, f.frecuencia
            FROM Trabajos t
            JOIN Clients c ON c.id = t.id_cliente
            JOIN Tipo_Servicio s ON s.id = t.id_tipo_servicio
            JOIN Frecuencia f ON f.id = t.id_frecuencia
            WHERE t.id = ?`, [id]);

        if (rows.length === 0) return res.status(404).json({ message: 'Work not found' });
        if (!['aceptado', 'presupuestado', 'cancelacion_solicitada'].includes(rows[0].estado)) {
            return res.status(400).json({ message: 'Solo se pueden cancelar trabajos aceptados o presupuestados' });
        }

        await db.query('UPDATE Trabajos SET estado = ? WHERE id = ?', ['cancelado', id]);

        // Notificar al cliente
        const [clientRows] = await db.query<WorkRow[]>(
            'SELECT u.email FROM Users u JOIN Clients c ON c.user_id = u.id WHERE c.id = ?',
            [rows[0].id_cliente]
        );
        if (clientRows.length > 0) {
            const w = rows[0];
            const fechaFormateada = w.fecha_hora
                ? new Date(w.fecha_hora).toLocaleString('es-ES', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                : '—';
            const precioFormateado = w.precio ? `${Number(w.precio).toFixed(2)} €` : '—';

            await sendEmail({
                to: (clientRows[0] as any).email,
                subject: `Trabajo #${id} cancelado - LimpiezaPro`,
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 32px 24px; text-align: center;">
                        <h1 style="color: white; margin: 0 0 4px 0; font-size: 24px; letter-spacing: -0.5px;">LimpiezaPro</h1>
                        <p style="color: #fecaca; margin: 0; font-size: 14px;">Gestión de servicios de limpieza</p>
                    </div>

                    <!-- Icon + title -->
                    <div style="background-color: #fff1f2; padding: 24px; text-align: center; border-bottom: 1px solid #fecaca;">
                        <div style="display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; background-color: #fee2e2; border-radius: 50%; margin-bottom: 12px;">
                            <span style="font-size: 28px;">❌</span>
                        </div>
                        <h2 style="color: #991b1b; margin: 0 0 4px 0; font-size: 20px;">Trabajo cancelado</h2>
                        <p style="color: #dc2626; margin: 0; font-size: 14px;">Referencia: <strong>Trabajo #${id}</strong></p>
                    </div>

                    <!-- Body -->
                    <div style="padding: 32px 24px;">
                        <p style="color: #475569; font-size: 15px; margin: 0 0 24px 0;">
                            Hola <strong>${w.nombre}</strong>, tu solicitud de cancelación ha sido procesada correctamente.
                            A continuación te mostramos el resumen del trabajo cancelado:
                        </p>

                        <!-- Work details -->
                        <div style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; margin-bottom: 24px;">
                            <div style="background-color: #f1f5f9; padding: 12px 16px; border-bottom: 1px solid #e2e8f0;">
                                <p style="margin: 0; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Detalles del servicio</p>
                            </div>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr style="border-bottom: 1px solid #e2e8f0;">
                                    <td style="padding: 12px 16px; color: #64748b; font-size: 14px; width: 140px;">Tipo de servicio</td>
                                    <td style="padding: 12px 16px; color: #0f172a; font-weight: 600; font-size: 14px;">${w.tipo_servicio}</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #e2e8f0;">
                                    <td style="padding: 12px 16px; color: #64748b; font-size: 14px;">Frecuencia</td>
                                    <td style="padding: 12px 16px; color: #0f172a; font-weight: 600; font-size: 14px;">${w.frecuencia}</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #e2e8f0;">
                                    <td style="padding: 12px 16px; color: #64748b; font-size: 14px;">Dirección</td>
                                    <td style="padding: 12px 16px; color: #0f172a; font-weight: 600; font-size: 14px;">${w.direccion_trabajo}</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #e2e8f0;">
                                    <td style="padding: 12px 16px; color: #64748b; font-size: 14px;">Fecha y hora</td>
                                    <td style="padding: 12px 16px; color: #0f172a; font-weight: 600; font-size: 14px;">${fechaFormateada}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 16px; color: #64748b; font-size: 14px;">Precio</td>
                                    <td style="padding: 12px 16px; color: #0f172a; font-weight: 600; font-size: 14px;">${precioFormateado}</td>
                                </tr>
                            </table>
                        </div>

                        <!-- Info box -->
                        <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; border-radius: 4px; padding: 16px; margin-bottom: 24px;">
                            <p style="margin: 0; color: #1d4ed8; font-size: 14px;">
                                Si tienes alguna duda sobre la cancelación o deseas contratar un nuevo servicio, no dudes en contactarnos o acceder a tu panel de cliente.
                            </p>
                        </div>

                        <p style="color: #94a3b8; font-size: 13px; margin: 0;">
                            Gracias por confiar en LimpiezaPro.
                        </p>
                    </div>

                    <!-- Footer -->
                    <div style="background-color: #f8fafc; padding: 20px 24px; border-top: 1px solid #e2e8f0; text-align: center;">
                        <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2026 LimpiezaPro. Todos los derechos reservados.</p>
                    </div>
                </div>`
            });
        }

        return res.status(200).json({ message: 'Trabajo cancelado correctamente' });
    } catch (error) {
        next(error);
    }
};

export const getAssignedWorks = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user_id = (req as any).user!.id;

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        const [rows] = await db.query<WorkRow[]>(
            "SELECT t.id, c.nombre as Nombre_Cliente, t.direccion_trabajo as Direccion, s.tipo_servicio, t.fecha_hora as Fecha, t.estado FROM Trabajos t JOIN Trabajo_Empleado te ON te.id_trabajo = t.id JOIN Clients c ON c.id = t.id_cliente JOIN Tipo_Servicio s ON s.id = t.id_tipo_servicio JOIN Employees e ON e.id = te.id_empleado WHERE e.user_id = ? AND t.estado IN ('aceptado', 'cancelacion_solicitada', 'cancelado') LIMIT ? OFFSET ?",
            [user_id, limit, offset]
        );
        const [total] = await db.query<RowDataPacket[]>(
            "SELECT COUNT(*) as total FROM Trabajos t JOIN Trabajo_Empleado te ON te.id_trabajo = t.id JOIN Employees e ON e.id = te.id_empleado WHERE e.user_id = ? AND t.estado IN ('aceptado', 'cancelacion_solicitada', 'cancelado')",
            [user_id]
        );

        return res.status(200).json({
            data: rows,
            pagination: { page, limit, total: total[0].total, totalPages: Math.ceil(total[0].total / limit) }
        });
    } catch (error) {
        next(error);
    }
};