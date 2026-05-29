"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = __importDefault(require("./app"));
const config_1 = __importDefault(require("./config"));
let server;
process.on('uncaughtException', (error) => {
    console.error(' Uncaught Exception detected, shutting down...', error);
    process.exit(1);
});
async function main() {
    try {
        await mongoose_1.default.connect(config_1.default.database_url);
        console.log(`🛢 Database is connected successfully`);
        server = app_1.default.listen(config_1.default.port, () => {
            console.log(`Application listening on port ${config_1.default.port}`);
        });
    }
    catch (err) {
        console.error(' Database connection failed:', err);
        console.log(' Retrying in 5 seconds...');
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
    console.log('🛑 SIGTERM received, shutting down gracefully');
    if (server) {
        server.close(() => {
            console.log('Process terminated');
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