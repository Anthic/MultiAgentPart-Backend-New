"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = __importDefault(require("./app"));
const config_1 = __importDefault(require("./config"));
let server;
const isServerless = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
async function connectDB() {
    if (global._mongooseConnection) {
        if (mongoose_1.default.connection.readyState === 1) {
            console.log('🛢 Reusing cached database connection');
            return;
        }
    }
    const dbUrl = config_1.default.database_url;
    if (!dbUrl) {
        throw new Error(' DATABASE_URL is not defined. Check your environment variables in Vercel dashboard.');
    }
    await mongoose_1.default.connect(dbUrl, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        maxPoolSize: isServerless ? 3 : 50,
        minPoolSize: isServerless ? 1 : 10,
        retryWrites: true,
    });
    global._mongooseConnection = mongoose_1.default;
}
process.on('uncaughtException', (error) => {
    console.error(' Uncaught Exception detected, shutting down...', error);
    process.exit(1);
});
async function main() {
    try {
        await connectDB();
        server = app_1.default.listen(config_1.default.port, () => {
            console.log(`Application listening on port ${config_1.default.port}`);
        });
    }
    catch (err) {
        console.error(' Database connection failed:', err);
        setTimeout(main, 5000);
        return;
    }
    process.on('unhandledRejection', (error) => {
        console.error('Unhandled Rejection detected, shutting down...', error);
        if (server) {
            server.close(() => {
                process.exit(1);
            });
        }
        else {
            process.exit(1);
        }
    });
}
main();
process.on('SIGTERM', () => {
    if (server) {
        server.close(() => {
            mongoose_1.default.connection.close(false).then(() => {
                process.exit(0);
            });
        });
    }
    else {
        process.exit(0);
    }
});
//# sourceMappingURL=server.js.map