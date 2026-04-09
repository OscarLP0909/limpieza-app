import transporter from '../config/mailer';

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

export const sendEmail = async ({ to, subject, html }: EmailOptions) => {
    await transporter.sendMail({
        from: `"Limpieza App" <${process.env.MAIL_USER}>`,
        to,
        subject,
        html,
    });
};