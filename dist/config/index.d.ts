declare const _default: {
    env: string | undefined;
    port: string | undefined;
    database_url: string | undefined;
    bcrypt_salt_rounds: string | undefined;
    cors_origin: string | undefined;
    rate_limit_window_ms: string | undefined;
    rate_limit_max: string | undefined;
    research_daily_limit: string | undefined;
    jwt: {
        access_secret: string | undefined;
        refresh_secret: string | undefined;
        access_expires_in: string | undefined;
        refresh_expires_in: string | undefined;
    };
    cookie: {
        domain: string | undefined;
    };
    account_lock: {
        max_attempts: number;
        duration_ms: number;
    };
    redisConnection: {
        host: string | undefined;
        password: string | undefined;
    };
    csrf_secret: string;
    ssl: {
        store_id: string;
        store_pass: string;
        is_live: boolean;
        payment_api: string;
        validation_api: string;
        success_backend_url: string;
        fail_backend_url: string;
        cancel_backend_url: string;
        ipn_url: string;
        success_frontend_url: string;
        fail_frontend_url: string;
        cancel_frontend_url: string;
    };
};
export default _default;
