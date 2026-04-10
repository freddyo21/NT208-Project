export const ROUTES = {
    ROOT: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
    VERIFY_EMAIL: '/verify-email',
    
    // User Routes
    USER_DASHBOARD: '/user/dashboard',
    USER_PROFILE: '/user/profile',
    USER_SETTINGS: '/user/settings',
    
    // Admin Routes
    ADMIN_DASHBOARD: '/admin/dashboard',
    ADMIN_USERS: '/admin/users',
    ADMIN_SETTINGS: '/admin/settings',
    
    // Error Routes
    NOT_FOUND: '/404',
    UNAUTHORIZED: '/401',
    FORBIDDEN: '/403',
    SERVER_ERROR: '/500',
} as const;
