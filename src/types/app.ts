
export type AppState =
    | 'landing'
    | 'login'
    | 'launching'
    | 'setup'
    | 'parsing'
    | 'structure'
    | 'generating_slides'
    | 'slides'
    | 'editing_slides'
    | 'summarizing_content'
    | 'learning_view'
    | 'quiz_view' // Added for quiz-specific view state within learning
    | 'error';

export type VideoPanelState = 'hidden' | 'idle' | 'generating_video' | 'video_ready' | 'video_error';

// You can add other shared types here if needed
