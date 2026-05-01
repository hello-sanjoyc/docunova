import fs from "fs";
import path from "path";
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import env from "./env";

const { combine, timestamp, errors, splat, json, colorize, printf } =
    winston.format;

const logDir = env.LOG_DIR;
fs.mkdirSync(logDir, { recursive: true });

const rotateDefaults = {
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: env.LOG_MAX_SIZE,
    maxFiles: env.LOG_MAX_FILES,
};

const jsonFormat = combine(timestamp(), errors({ stack: true }), splat(), json());

const consoleFormat = combine(
    colorize(),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    splat(),
    printf(({ timestamp, level, message, stack, ...meta }) => {
        const metaText = Object.keys(meta).length
            ? ` ${JSON.stringify(meta)}`
            : "";
        const stackText = stack ? `\n${stack}` : "";
        return `${timestamp} [${level}] ${message}${metaText}${stackText}`;
    }),
);

const fileTransports: winston.transport[] = [
    new DailyRotateFile({
        ...rotateDefaults,
        level: env.LOG_LEVEL,
        dirname: logDir,
        filename: "application-%DATE%.log",
        format: jsonFormat,
        auditFile: path.join(logDir, ".application-audit.json"),
    }),
    new DailyRotateFile({
        ...rotateDefaults,
        level: "error",
        dirname: logDir,
        filename: "error-%DATE%.log",
        format: jsonFormat,
        auditFile: path.join(logDir, ".error-audit.json"),
    }),
];

const redisLogTransport = new DailyRotateFile({
    ...rotateDefaults,
    level: "info",
    dirname: logDir,
    filename: "redis-%DATE%.log",
    format: jsonFormat,
    auditFile: path.join(logDir, ".redis-audit.json"),
});

const exceptionFileTransport = new DailyRotateFile({
    ...rotateDefaults,
    dirname: logDir,
    filename: "exceptions-%DATE%.log",
    format: jsonFormat,
    auditFile: path.join(logDir, ".exceptions-audit.json"),
});

const rejectionFileTransport = new DailyRotateFile({
    ...rotateDefaults,
    dirname: logDir,
    filename: "rejections-%DATE%.log",
    format: jsonFormat,
    auditFile: path.join(logDir, ".rejections-audit.json"),
});

if (env.NODE_ENV !== "production") {
    fileTransports.push(
        new winston.transports.Console({
            level: env.LOG_LEVEL,
            format: consoleFormat,
        }),
    );
} else {
    fileTransports.push(
        new winston.transports.Console({
            level: env.LOG_LEVEL,
            format: jsonFormat,
        }),
    );
}

export const appLogger = winston.createLogger({
    level: env.LOG_LEVEL,
    defaultMeta: { service: "backend", env: env.NODE_ENV },
    transports: fileTransports,
    exceptionHandlers: [exceptionFileTransport],
    rejectionHandlers: [rejectionFileTransport],
    exitOnError: false,
});

export const redisLogger = winston.createLogger({
    level: "info",
    defaultMeta: { service: "backend", env: env.NODE_ENV, context: "redis-command" },
    transports: [redisLogTransport],
    exitOnError: false,
});

export function createLogger(context: Record<string, unknown>) {
    return appLogger.child(context);
}
