// src/shared/errors/AppError — typed application error (docs/refactor-v2/02, /21 §8e).
// NEW in Phase 1. Behavior-neutral: not yet consumed by any runtime path.
// Provides a consistent error shape for future feature/data layers (no SDK imports).

export type AppErrorCode =
    | 'unknown'
    | 'network'
    | 'auth'
    | 'permission'
    | 'not-found'
    | 'validation'
    | 'storage'
    | 'sync';

export interface AppErrorOptions {
    code?: AppErrorCode;
    /** Underlying error/value that caused this error (kept for diagnostics). */
    cause?: unknown;
    /** Optional structured context (no PII / secrets). */
    context?: Record<string, unknown>;
}

export class AppError extends Error {
    readonly code: AppErrorCode;
    readonly cause?: unknown;
    readonly context?: Record<string, unknown>;

    constructor(message: string, options: AppErrorOptions = {}) {
        super(message);
        this.name = 'AppError';
        this.code = options.code ?? 'unknown';
        this.cause = options.cause;
        this.context = options.context;
        // Restore prototype chain (TS + transpilation to ES5/ES2015 target safety).
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

export function isAppError(value: unknown): value is AppError {
    return value instanceof AppError;
}
