
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
    | 'summarizing_content' // For AI Tutor context summary
    | 'generating_textual_content' // For displayable Markdown lesson content
    | 'learning_view'
    | 'quiz_view' 
    | 'error';

export type VideoPanelState = 'hidden' | 'idle' | 'generating_video' | 'video_ready' | 'video_error';

// You can add other shared types here if needed
