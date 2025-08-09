const getEpoch = (date: number = Date.now()): number => {
    return Math.floor(date / 1000);
};

export const DateUtils = {
    getEpoch,
};
