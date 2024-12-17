const {env} = process as {env: {[key: string] : string}}

export const {MONGO_URI,
    MAILTRAP_USER, 
    MAILTRAP_PASS,
    VERIFICATION_EMAIL, 
    PASSWORD_RESET_LINK, 
    SIGN_IN_URL, 
    JWT_SECRET,
    CLOUD_NAME,
    CLOUD_KEY,
    CLOUD_SECRET,
    CLIENT_ID,
    CLIENT_SECRET,
    MAILTRAP_TOKEN
    } = env;