import mongoose from 'mongoose';
declare global {
    var _mongooseConnection: typeof mongoose | undefined;
}
