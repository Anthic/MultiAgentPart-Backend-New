export const getTransactionId = (): string => {
    return `ATLaSH_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
}