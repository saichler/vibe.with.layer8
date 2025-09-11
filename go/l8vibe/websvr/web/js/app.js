// Main Application Controller
class Application {
    constructor() {
        this.currentScreen = null;
        this.initialized = false;
    }

    // Initialize the application
    init() {
        if (this.initialized) return;

        try {
            // Initialize all modules
            this.initializeModules();
            
            // Set up global error handling
            this.setupErrorHandling();
            
            // Set up responsive handlers
            this.setupResponsiveHandlers();
            
            // Mark as initialized
            this.initialized = true;
            
            console.log('L8Vibe application initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showInitializationError();
        }
    }

    // Initialize all application modules
    initializeModules() {
        // Create global instances
        window.auth = new AuthManager();
        window.chat = new ChatManager();
        window.workspace = new WorkspaceManager();
        window.marketing = new MarketingManager();
        
        // Initialize modules in order
        auth.init();
        chat.init();
        workspace.init();
        marketing.init();
        
        // Now that all modules are initialized, check authentication and set initial screen
        auth.checkStoredAuth();
        
        // Load any stored project
        workspace.loadStoredProject();
    }

    // Show specific screen
    showScreen(screenId) {
        // Hide all screens
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenId;
            
            // Handle screen-specific logic
            this.handleScreenTransition(screenId);
        } else {
            console.error(`Screen ${screenId} not found`);
        }
    }

    // Handle screen transition logic
    handleScreenTransition(screenId) {
        switch (screenId) {
            case 'marketingScreen':
                // Update navigation and scroll effects
                if (window.marketing) {
                    marketing.updateActiveNavigation();
                    marketing.setupMobileNavigation();
                }
                break;
                
            case 'projectScreen':
                // Focus project name input
                setTimeout(() => {
                    const nameInput = document.getElementById('projectName');
                    if (nameInput) nameInput.focus();
                }, 100);
                break;
                
            case 'workspaceScreen':
                // Focus chat input and ensure UI is updated
                setTimeout(() => {
                    const chatInput = document.getElementById('chatInput');
                    if (chatInput) chatInput.focus();
                    
                    // Update project display
                    workspace.updateProjectDisplay();
                }, 100);
                break;
        }
    }

    // Setup error handling
    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('Global error caught:', event.error);
            this.handleGlobalError(event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.handleGlobalError(event.reason);
        });
    }

    // Setup responsive handlers
    setupResponsiveHandlers() {
        let resizeTimeout;
        
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        });

        // Check initial screen size
        this.handleResize();
    }

    // Handle window resize
    handleResize() {
        const isMobile = window.innerWidth <= 768;
        const isTablet = window.innerWidth <= 1024;
        
        // Update body classes for responsive styling
        document.body.classList.toggle('mobile', isMobile);
        document.body.classList.toggle('tablet', isTablet && !isMobile);
        document.body.classList.toggle('desktop', !isTablet);

        // Adjust chat input height on mobile
        if (isMobile && window.chat) {
            chat.adjustInputHeight();
        }
        
        // Handle marketing page responsive changes
        if (window.marketing) {
            marketing.handleResize();
        }
    }

    // Handle global errors
    handleGlobalError(error) {
        // Log error for debugging
        console.error('Application error:', error);
        
        // Show user-friendly error message
        if (window.auth) {
            auth.showError('An unexpected error occurred. Please refresh the page.');
        }
    }

    // Show initialization error
    showInitializationError() {
        const body = document.body;
        body.innerHTML = `
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                padding: 20px;
                text-align: center;
                background: linear-gradient(135deg, #fefcf9 0%, #f5f3f0 100%);
                font-family: 'Inter', sans-serif;
                color: #3a3633;
            ">
                <div style="
                    background: white;
                    padding: 40px;
                    border-radius: 12px;
                    box-shadow: 0 4px 16px rgba(58, 54, 51, 0.12);
                    max-width: 400px;
                    width: 100%;
                ">
                    <h2 style="margin: 0 0 16px 0; color: #c17854;">Unable to Load Application</h2>
                    <p style="margin: 0 0 24px 0; line-height: 1.5;">
                        We're having trouble initializing the Vibe with Layer 8 Ecosystem. 
                        Please refresh the page to try again.
                    </p>
                    <button onclick="window.location.reload()" style="
                        background: linear-gradient(135deg, #6b5b4f 0%, #c17854 100%);
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        font-weight: 500;
                        cursor: pointer;
                        font-size: 14px;
                    ">
                        Refresh Page
                    </button>
                </div>
            </div>
        `;
    }

    // Get current screen
    getCurrentScreen() {
        return this.currentScreen;
    }

    // Check if application is ready
    isReady() {
        return this.initialized;
    }

    // Cleanup resources
    cleanup() {
        // Remove event listeners
        window.removeEventListener('error', this.handleGlobalError);
        window.removeEventListener('unhandledrejection', this.handleGlobalError);
        
        // Clear any timeouts/intervals
        // (Add any cleanup code for timers here)
        
        this.initialized = false;
    }

    // Application lifecycle methods
    onBeforeUnload() {
        // Save any unsaved data before page unload
        if (window.workspace && workspace.getCurrentProject()) {
            workspace.storeCurrentProject();
        }
        
        if (window.chat) {
            chat.saveChatHistory();
        }
    }

    // Development helpers (remove in production)
    debug() {
        return {
            currentScreen: this.currentScreen,
            isAuthenticated: auth?.isUserAuthenticated(),
            currentUser: auth?.getCurrentUser(),
            currentProject: workspace?.getCurrentProject(),
            chatHistory: chat?.chatHistory,
            initialized: this.initialized
        };
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if running from file:// protocol
    if (window.location.protocol === 'file:') {
        console.warn('Running from file:// protocol. Some features may not work properly.');
        console.warn('For full functionality, serve via HTTP: http://localhost:8080');
        
        // Add a warning banner
        const warningBanner = document.createElement('div');
        warningBanner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #ff6b35;
            color: white;
            padding: 10px;
            text-align: center;
            font-weight: bold;
            z-index: 10000;
        `;
        warningBanner.innerHTML = '⚠️ Running from file:// - Use http://localhost:8080 for full functionality';
        document.body.insertBefore(warningBanner, document.body.firstChild);
    }
    
    // Create global app instance
    window.app = new Application();
    
    // Initialize the application with error handling
    try {
        app.init();
    } catch (error) {
        console.error('Failed to initialize application:', error);
        // Show basic version if initialization fails
        document.body.innerHTML = `
            <div style="padding: 40px; text-align: center; font-family: Arial, sans-serif;">
                <h1>Layer 8 Ecosystem</h1>
                <p>There was an issue loading the application.</p>
                <p>For best experience, access via: <a href="http://localhost:8080">http://localhost:8080</a></p>
            </div>
        `;
    }
    
    // Setup beforeunload handler
    window.addEventListener('beforeunload', () => {
        app.onBeforeUnload();
    });
    
    // Development helper - expose debug info
    if (window.location.hostname === 'localhost' || window.location.hostname.includes('dev')) {
        window.l8vibe_debug = () => app.debug();
        console.log('Development mode: Use l8vibe_debug() for application info');
    }
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden - save state
        if (window.app && app.isReady()) {
            app.onBeforeUnload();
        }
    } else {
        // Page is visible - could refresh connection status
        if (window.chat) {
            chat.updateConnectionStatus();
        }
    }
});