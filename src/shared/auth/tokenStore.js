let accessToken = null;

export const getAccessToken = () => accessToken;
export const setAccessToken = (t) => {
    accessToken = t || null;
};
export const clearAccessToken = () => {
    accessToken = null;
};