

// Session management keys
export const SESSIONS_STORAGE_KEY = 'cec068_sessions';
export const CURRENT_SESSION_KEY = 'cec068_current_session';


// Session-scoped data keys - these functions will prefix keys with the current session ID
const getSessionKey = (baseKey: string) => {
    if (typeof window !== 'undefined') {
        const sessionId = localStorage.getItem(CURRENT_SESSION_KEY);
        return sessionId ? `${sessionId}_${baseKey}` : baseKey;
    }
    return baseKey; // Fallback for SSR or non-browser environments
};

export const getBillsStorageKey = () => getSessionKey('bills');
export const getIssuesStorageKey = () => getSessionKey('issues');
export const getPublicIssuesStorageKey = () => getSessionKey('public_issues');
export const getTrashStorageKey = () => getSessionKey('trash');
export const getBillTrashStorageKey = () => getSessionKey('bill_trash');
export const getIndexTrashStorageKey = () => getSessionKey('index_trash');
export const getTeacherTrashStorageKey = () => getSessionKey('teacher_trash');
export const getAwardsDispatchStorageKey = () => getSessionKey('awards_dispatch_data');
export const getAwardsDispatchTrashStorageKey = () => getSessionKey('awards_dispatch_trash');
export const getQpUpcMapKey = () => getSessionKey('qp_upc_map');
export const getTeacherCourseTokenMapKey = () => getSessionKey('teacher_course_token_map');
export const getGlobalBillSettingsKey = () => getSessionKey('global_bill_settings');


// Non-session-scoped keys
export const DRIVE_TOKEN_KEY = "google_drive_token_placeholder";
export const DRIVE_STORAGE_KEY = "google_drive_files_placeholder";
export const SESSION_TRASH_STORAGE_KEY = 'cec068_session_trash';


// File names for Google Drive sync should probably also be session-scoped
export const getBillsFileName = () => `${localStorage.getItem(CURRENT_SESSION_KEY)}_DriveSync_Bills.json`;
export const getIssuesFileName = () => `${localStorage.getItem(CURRENT_SESSION_KEY)}_DriveSync_Issues.json`;


// Sidebar visibility keys (remain global)
export const SIDEBAR_AWARDS_VISIBILITY_KEY = 'cec068_sidebar_awards_visibility';
export const SIDEBAR_INDEX_VISIBILITY_KEY = 'cec068_sidebar_index_visibility';
export const SIDEBAR_ISSUE_VISIBILITY_KEY = 'cec068_sidebar_issue_visibility';
export const SIDEBAR_BILL_VISIBILITY_KEY = 'cec068_sidebar_bill_visibility';
export const SIDEBAR_TEACHERS_VISIBILITY_KEY = 'cec068_sidebar_teachers_visibility';
