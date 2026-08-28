"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransactionId = void 0;
const getTransactionId = () => {
    return `ATLaSH_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
};
exports.getTransactionId = getTransactionId;
//# sourceMappingURL=getTransactionId.js.map