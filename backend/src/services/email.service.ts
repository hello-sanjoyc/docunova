import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';
import env from '../config/env';

export interface EmailAttachment {
  /** Original filename shown to recipient */
  filename: string;
  /** Inline content as a string or Buffer */
  content?: string | Buffer;
  /** Absolute path to the file on disk */
  path?: string;
  /** MIME type, e.g. 'application/pdf' */
  contentType?: string;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: EmailAttachment[];
  replyTo?: string;
}

let _transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (_transporter) return _transporter;

  _transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    ...(env.SMTP_USER && env.SMTP_PASS
      ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASS } }
      : {}),
  });

  return _transporter;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const transporter = getTransporter();

  const mailOptions: SendMailOptions = {
    from: `"${env.MAIL_FROM_NAME}" <${env.MAIL_FROM_EMAIL}>`,
    to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
    subject: options.subject,
    ...(options.html ? { html: options.html } : {}),
    ...(options.text ? { text: options.text } : {}),
    ...(options.cc ? { cc: Array.isArray(options.cc) ? options.cc.join(', ') : options.cc } : {}),
    ...(options.bcc ? { bcc: Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc } : {}),
    ...(options.replyTo ? { replyTo: options.replyTo } : {}),
    ...(options.attachments?.length
      ? {
          attachments: options.attachments.map((a) => ({
            filename: a.filename,
            ...(a.content !== undefined ? { content: a.content } : {}),
            ...(a.path ? { path: a.path } : {}),
            ...(a.contentType ? { contentType: a.contentType } : {}),
          })),
        }
      : {}),
  };

  await transporter.sendMail(mailOptions);
}
