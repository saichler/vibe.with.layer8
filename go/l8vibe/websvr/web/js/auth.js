// Authentication Module
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
    }

    // Initialize authentication event listeners
    init() {
        this.bindLoginEvents();
        this.bindLogoutEvents();
        // Don't check stored auth during init - defer to app initialization
    }

    // Bind login form events
    bindLoginEvents() {
        const loginBtn = document.getElementById('loginBtn');
        const emailInput = document.getElementById('loginEmail');
        const passwordInput = document.getElementById('loginPassword');

        if (loginBtn) {
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Handle Enter key in login form
        [emailInput, passwordInput].forEach(input => {
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.handleLogin();
                    }
                });
            }
        });
    }

    // Bind logout events
    bindLogoutEvents() {
        const logoutBtns = document.querySelectorAll('#logoutBtn, #workspaceLogoutBtn');
        
        logoutBtns.forEach(btn => {
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleLogout();
                });
            }
        });
    }

    // Handle login process
    async handleLogin() {
        const email = document.getElementById('loginEmail')?.value?.trim();
        const password = document.getElementById('loginPassword')?.value?.trim();
        const loginBtn = document.getElementById('loginBtn');

        // Validation
        if (!email || !password) {
            this.showError('Please enter both email and password');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showError('Please enter a valid email address');
            return;
        }

        // Show loading state
        if (loginBtn) {
            loginBtn.textContent = 'Connecting...';
            loginBtn.disabled = true;
            loginBtn.classList.add('loading');
        }

        try {
            // Simulate authentication (replace with actual API call)
            await this.authenticateUser(email, password);
            
            // Store authentication
            this.currentUser = {
                email: email,
                name: this.extractNameFromEmail(email),
                loginTime: new Date().toISOString()
            };
            this.isAuthenticated = true;
            this.storeAuth();

            // Enable Create Project button
            this.enableCreateProjectButton();
            
            // Enable Projects menu
            this.enableProjectsMenu();
            
            // Load user projects immediately after login
            this.loadUserProjectsAfterLogin();
            
            // Close login modal
            this.closeLoginModal();
            
            // Update Sign In button to Sign Out
            this.updateSignInButton();
            
            // Show success message but don't navigate anywhere
            this.showSuccess('Welcome back! You can now create projects.');

        } catch (error) {
            this.showError('Authentication failed. Please check your credentials.');
            console.error('Login error:', error);
        } finally {
            // Reset button state
            if (loginBtn) {
                loginBtn.textContent = 'Begin Your Journey';
                loginBtn.disabled = false;
                loginBtn.classList.remove('loading');
            }
        }
    }

    // Handle logout process
    handleLogout() {
        // Clear authentication
        this.currentUser = null;
        this.isAuthenticated = false;
        this.clearStoredAuth();

        // Reset forms
        this.clearForms();

        // Disable Create Project button
        this.disableCreateProjectButton();
        
        // Disable Projects menu
        this.disableProjectsMenu();
        
        // Reset Sign Out button back to Sign In
        this.resetSignInButton();
        
        // Navigate to marketing screen
        app.showScreen('marketingScreen');
        this.showSuccess('You have been signed out');
    }

    // Simulate API authentication
    async authenticateUser(email, password) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // For demo purposes, accept any email/password combination
        // In production, this would be a real API call
        if (email && password) {
            return { success: true, user: { email } };
        } else {
            throw new Error('Invalid credentials');
        }
    }

    // Validate email format
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Extract name from email for display
    extractNameFromEmail(email) {
        const name = email.split('@')[0];
        return name.charAt(0).toUpperCase() + name.slice(1);
    }

    // Store authentication in localStorage
    storeAuth() {
        if (window.location.protocol === 'file:') {
            console.warn('localStorage not available with file:// protocol');
            return;
        }
        
        if (this.currentUser) {
            localStorage.setItem('l8vibe_auth', JSON.stringify({
                user: this.currentUser,
                authenticated: this.isAuthenticated,
                timestamp: Date.now()
            }));
        }
    }

    // Check for stored authentication
    checkStoredAuth() {
        // Skip localStorage operations for file:// protocol
        if (window.location.protocol === 'file:') {
            console.warn('localStorage not available with file:// protocol');
            app.showScreen('marketingScreen');
            return;
        }
        
        try {
            const stored = localStorage.getItem('l8vibe_auth');
            if (stored) {
                const authData = JSON.parse(stored);
                const hoursSinceLogin = (Date.now() - authData.timestamp) / (1000 * 60 * 60);
                
                // Auto-logout after 24 hours
                if (hoursSinceLogin < 24 && authData.authenticated) {
                    this.currentUser = authData.user;
                    this.isAuthenticated = true;
                    
                    // Enable Create Project button
                    this.enableCreateProjectButton();
                    
                    // Enable Projects menu
                    this.enableProjectsMenu();
                    
                    // Load user projects immediately after restoring auth
                    this.loadUserProjectsAfterLogin();
                    
                    // Update Sign In button to Sign Out
                    this.updateSignInButton();
                    
                    // Navigate to appropriate screen based on stored project
                    const storedProject = localStorage.getItem('l8vibe_current_project');
                    if (storedProject) {
                        app.showScreen('workspaceScreen');
                    } else {
                        app.showScreen('marketingScreen');
                    }
                    return;
                }
            }
        } catch (error) {
            console.error('Error checking stored auth:', error);
        }
        
        // Default to marketing screen
        this.clearStoredAuth();
        app.showScreen('marketingScreen');
    }

    // Clear stored authentication
    clearStoredAuth() {
        if (window.location.protocol === 'file:') {
            return;
        }
        localStorage.removeItem('l8vibe_auth');
    }

    // Clear all forms
    clearForms() {
        const forms = document.querySelectorAll('input, textarea');
        forms.forEach(input => {
            if (input.type !== 'button' && input.type !== 'submit') {
                input.value = '';
            }
        });
    }

    // Show success message
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    // Show error message
    showError(message) {
        this.showNotification(message, 'error');
    }

    // Show notification (simple implementation)
    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existing = document.querySelector('.notification');
        if (existing) {
            existing.remove();
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '10000',
            fontSize: '14px',
            maxWidth: '300px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            animation: 'slideIn 0.3s ease-out',
            backgroundColor: type === 'error' ? '#c17854' : 
                           type === 'success' ? '#5a6b4f' : '#6b5b4f'
        });

        // Add to document
        document.body.appendChild(notification);

        // Remove after delay
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 3000);
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user is authenticated
    isUserAuthenticated() {
        return this.isAuthenticated;
    }

    // Enable Create Project button
    enableCreateProjectButton() {
        const createProjectBtn = document.getElementById('createProjectCTA');
        if (createProjectBtn) {
            createProjectBtn.disabled = false;
            createProjectBtn.classList.remove('disabled');
        }
    }

    // Disable Create Project button
    disableCreateProjectButton() {
        const createProjectBtn = document.getElementById('createProjectCTA');
        if (createProjectBtn) {
            createProjectBtn.disabled = true;
            createProjectBtn.classList.add('disabled');
        }
    }

    // Enable Projects menu
    enableProjectsMenu() {
        if (window.marketing) {
            marketing.enableProjectsMenu();
        }
    }

    // Disable Projects menu
    disableProjectsMenu() {
        if (window.marketing) {
            marketing.disableProjectsMenu();
        }
    }

    // Load user projects after successful login
    loadUserProjectsAfterLogin() {
        if (window.marketing) {
            // Use setTimeout to avoid blocking the main thread
            setTimeout(() => {
                marketing.loadUserProjects();
            }, 100);
        }
    }

    // Close login modal
    closeLoginModal() {
        const loginModal = document.getElementById('loginModal');
        if (loginModal && window.marketing) {
            marketing.hideLoginModal();
        }
    }

    // Update Sign In button to Sign Out after login
    updateSignInButton() {
        const loginBtn = document.getElementById('loginCTA');
        if (loginBtn) {
            loginBtn.textContent = 'Sign Out';
            loginBtn.onclick = (e) => {
                e.preventDefault();
                this.handleLogout();
            };
        }
    }

    // Reset Sign Out button to Sign In after logout
    resetSignInButton() {
        const loginBtn = document.getElementById('loginCTA');
        if (loginBtn) {
            loginBtn.textContent = 'Sign In';
            loginBtn.onclick = (e) => {
                e.preventDefault();
                if (window.marketing) {
                    marketing.showLoginModal();
                }
            };
        }
    }
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);