import { spawn } from 'child_process';
import path from 'path';
import { createLogger } from '../config/logger';

const SCRIPT_PATH = path.resolve(__dirname, '../../scripts/extract_text.py');
const PYTHON_BIN = process.env.PYTHON_BIN ?? 'python3';
const OCR_TIMEOUT_MS = parseInt(process.env.OCR_TIMEOUT_MS ?? '120000', 10);

export async function runPythonOcr(filePath: string): Promise<string> {
    const logger = createLogger({ context: 'ocr-service', filePath });

    return new Promise((resolve, reject) => {
        const stdout: Buffer[] = [];
        const stderr: Buffer[] = [];

        const proc = spawn(PYTHON_BIN, [SCRIPT_PATH, filePath], {
            timeout: OCR_TIMEOUT_MS,
        });

        proc.stdout.on('data', (chunk: Buffer) => stdout.push(chunk));
        proc.stderr.on('data', (chunk: Buffer) => stderr.push(chunk));

        proc.on('error', (err) => {
            logger.error('OCR process failed to start', { err });
            reject(err);
        });

        proc.on('close', (code) => {
            const errText = Buffer.concat(stderr).toString().trim();
            if (code !== 0) {
                logger.error('OCR process exited with non-zero code', { code, stderr: errText });
                reject(new Error(`OCR process exited ${code}: ${errText}`));
                return;
            }
            if (errText) logger.warn('OCR stderr output', { stderr: errText });
            const text = Buffer.concat(stdout).toString();
            logger.info('OCR completed', { chars: text.length });
            resolve(text);
        });
    });
}
