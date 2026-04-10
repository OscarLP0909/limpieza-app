import nodeCron from "node-cron";
import db from '../database/db';
import { RowDataPacket } from "mysql2";
import { sendEmail } from "../helpers/sendEmail";

const cron = nodeCron;




cron.schedule('0 9 * * *',
    async () => {
        const hoy = new Date().toISOString().split('T')[0];
        const [rows] = await db.query<RowDataPacket[]>('SELECT t.id, c.nombre, c.apellidos, u.email, ts.tipo_servicio, f.frecuencia, t.direccion_trabajo, t.estado, t.presupuesto_expira_en FROM Trabajos JOIN Clients c ON c.id = t.id_cliente JOIN Users u ON c.user_id = u.id JOIN Tipo_Servicio ts ON t.id_tipo_servicio = ts.id JOIN Frecuencia f ON t.id_frecuencia = f.id WHERE t.presupuesto_expira_en = ?', [hoy]);
        await Promise.all(
            rows.map((trabajo: any) =>
                sendEmail({
                    to: trabajo.email,
                    subject: 'Recordatorio de Trabajo Presupuestado',
                    html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <div style="background-color: #2563eb; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0;">Limpieza App</h1>
            </div>
            
            <div style="padding: 30px;">
                <h2 style="color: #1e293b;">¡Tienes un trabajo pendiente que revisar!</h2>
                <p style="color: #64748b;">Hemos preparado el presupuesto para tu servicio. Aquí tienes los detalles:</p>
                
                <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 12px 0; color: #64748b;">Tipo de servicio</td>
                            <td style="padding: 12px 0; color: #1e293b; font-weight: bold;">${trabajo.tipo_servicio}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 12px 0; color: #64748b;">Frecuencia</td>
                            <td style="padding: 12px 0; color: #1e293b; font-weight: bold;">${trabajo.frecuencia}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 12px 0; color: #64748b;">Fecha y hora</td>
                            <td style="padding: 12px 0; color: #1e293b; font-weight: bold;">${new Date(trabajo.fecha_hora).toLocaleString('es-ES')}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 0; color: #64748b;">Precio total</td>
                            <td style="padding: 12px 0; color: #2563eb; font-weight: bold; font-size: 20px;">${trabajo.precio}€</td>
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
                }))
        );

        const dosDiasAtras = new Date();
        dosDiasAtras.setDate(dosDiasAtras.getDate()-2);
        const fechaLimite = dosDiasAtras.toISOString().split('T')[0];

        await db.query('UPDATE Trabajos SET estado = ? WHERE estado = ? AND presupuesto_expira_en < ?', ['cancelado', 'presupuestado', fechaLimite]);
    })