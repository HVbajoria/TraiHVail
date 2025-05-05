
export type AppState =
    | 'landing'
    | 'login'
    | 'launching'
    | 'setup'
    | 'parsing'
    | 'structure'
    | 'generating_slides'
    | 'slides'
    | 'editing_slides' // Added state for editing slides
    | 'summarizing_content'
    | 'learning_view'
    | 'error';

export type VideoPanelState = 'hidden' | 'idle' | 'generating_video' | 'video_ready' | 'video_error';

// You can add other shared types here if needed
