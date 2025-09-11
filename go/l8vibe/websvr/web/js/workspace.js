// Workspace Module
class WorkspaceManager {
    constructor() {
        this.currentProject = null;
        this.previewMode = 'desktop';
        this.hasActivePreview = false;
    }

    // Initialize workspace functionality
    init() {
        this.bindWorkspaceEvents();
        this.setupPreview();
    }

    // Bind workspace-related events
    bindWorkspaceEvents() {
        // Project creation events (both modal and screen versions)
        const createProjectBtn = document.getElementById('createProjectBtn');
        const modalCreateProjectBtn = document.getElementById('modalCreateProjectBtn');
        const newProjectBtn = document.getElementById('newProjectBtn');
        
        if (createProjectBtn) {
            createProjectBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleCreateProject();
            });
        }

        if (modalCreateProjectBtn) {
            modalCreateProjectBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleCreateProject(true); // Pass true to indicate modal version
            });
        }

        if (newProjectBtn) {
            newProjectBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleNewProject();
            });
        }

        // Preview controls
        const previewControls = document.querySelectorAll('.control-btn[data-view]');
        previewControls.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.getAttribute('data-view');
                this.setPreviewMode(view);
            });
        });

        // Handle Enter key in project form (both screen and modal versions)
        const projectInputs = document.querySelectorAll('#projectName, #projectDescription, #modalProjectName, #modalProjectDescription');
        projectInputs.forEach(input => {
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && (e.target.id === 'projectName' || e.target.id === 'modalProjectName')) {
                        e.preventDefault();
                        const isModal = e.target.id.startsWith('modal');
                        this.handleCreateProject(isModal);
                    }
                });
            }
        });
    }

    // Handle project creation
    async handleCreateProject(isModal = false) {
        const nameInput = document.getElementById(isModal ? 'modalProjectName' : 'projectName');
        const descInput = document.getElementById(isModal ? 'modalProjectDescription' : 'projectDescription');
        const apiKeyInput = document.getElementById(isModal ? 'modalClaudeApiKey' : 'claudeApiKey');
        const createBtn = document.getElementById(isModal ? 'modalCreateProjectBtn' : 'createProjectBtn');
        
        const projectName = nameInput?.value?.trim();
        const projectDesc = descInput?.value?.trim();
        const apiKey = apiKeyInput?.value?.trim();

        // Validation
        if (!projectName) {
            auth.showError('Please enter a project name');
            nameInput?.focus();
            return;
        }

        if (!apiKey) {
            auth.showError('Please enter your Claude.ai API key');
            apiKeyInput?.focus();
            return;
        }

        // Show loading state
        if (createBtn) {
            createBtn.textContent = 'Creating Project...';
            createBtn.disabled = true;
            createBtn.classList.add('loading');
        }

        try {
            const currentUser = auth.getCurrentUser();
            if (!currentUser) {
                throw new Error('User not authenticated');
            }

            // Prepare request body
            const requestBody = {
                name: projectName,
                description: projectDesc || '',
                user: currentUser.email,
                apiKey: apiKey
            };

            console.log('Creating project with data:', { ...requestBody, apiKey: '[REDACTED]' });

            // Make POST request to create project
            const response = await fetch('/l8vibe/0/proj', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const createdProject = await response.json();
            console.log('Project created successfully:', createdProject);

            // Store project locally
            this.currentProject = createdProject;
            this.storeCurrentProject();

            // Initialize chat for this project
            if (window.chat) {
                chat.setCurrentProject(createdProject);
            }

            // Update workspace UI
            this.updateProjectDisplay();

            // Refresh the projects menu to show the new project
            if (window.marketing && window.auth.isUserAuthenticated()) {
                setTimeout(() => {
                    marketing.loadUserProjects();
                }, 500);
            }

            // Show success and navigate
            auth.showSuccess(`Project "${projectName}" created successfully!`);
            
            // Close modal if this was modal creation
            if (isModal) {
                const createProjectModal = document.getElementById('createProjectModal');
                if (createProjectModal && window.marketing) {
                    marketing.hideCreateProjectModal();
                }
            }
            
            setTimeout(() => {
                app.showScreen('workspaceScreen');
            }, 1000);

        } catch (error) {
            auth.showError(`Failed to create project: ${error.message}`);
            console.error('Project creation error:', error);
            // Don't navigate to workspace on failure
        } finally {
            // Reset button state
            if (createBtn) {
                createBtn.textContent = 'Create Project';
                createBtn.disabled = false;
                createBtn.classList.remove('loading');
            }
        }
    }

    // Handle new project creation
    handleNewProject() {
        // Clear current project
        this.currentProject = null;
        this.clearStoredProject();
        
        // Clear forms
        const nameInput = document.getElementById('projectName');
        const descInput = document.getElementById('projectDescription');
        
        if (nameInput) nameInput.value = '';
        if (descInput) descInput.value = '';

        // Clear chat
        if (window.chat) {
            chat.clearChat();
        }

        // Navigate to project creation screen
        app.showScreen('projectScreen');
    }

    // Generate unique project ID
    generateProjectId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `proj_${timestamp}_${random}`;
    }

    // Update project display in workspace
    updateProjectDisplay() {
        const projectNameEl = document.getElementById('currentProjectName');
        
        if (projectNameEl && this.currentProject) {
            projectNameEl.textContent = this.currentProject.name;
        }
    }

    // Setup preview functionality
    setupPreview() {
        this.setPreviewMode('desktop');
        this.showEmptyState();
    }

    // Set preview mode (desktop, tablet, mobile)
    setPreviewMode(mode) {
        this.previewMode = mode;
        
        // Update active button
        const previewControls = document.querySelectorAll('.control-btn[data-view]');
        previewControls.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-view') === mode);
        });

        // Update iframe class
        const previewFrame = document.getElementById('previewFrame');
        if (previewFrame) {
            previewFrame.className = `preview-iframe ${mode}-view`;
        }
    }

    // Show empty state in preview
    showEmptyState() {
        const emptyState = document.getElementById('emptyState');
        const previewFrame = document.getElementById('previewFrame');
        
        if (emptyState) {
            emptyState.style.display = 'flex';
        }
        
        if (previewFrame) {
            previewFrame.style.display = 'none';
        }
        
        this.hasActivePreview = false;
    }

    // Hide empty state and show preview
    hideEmptyState() {
        const emptyState = document.getElementById('emptyState');
        const previewFrame = document.getElementById('previewFrame');
        
        if (emptyState) {
            emptyState.style.display = 'none';
        }
        
        if (previewFrame) {
            previewFrame.style.display = 'block';
        }
        
        this.hasActivePreview = true;
    }

    // Update preview with new content
    updatePreview(content) {
        const previewFrame = document.getElementById('previewFrame');
        
        if (previewFrame) {
            // If content is a URL
            if (content.startsWith('http') || content.startsWith('/')) {
                previewFrame.src = content;
            } else {
                // If content is HTML
                const blob = new Blob([content], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                previewFrame.src = url;
                
                // Clean up the blob URL after a delay
                setTimeout(() => URL.revokeObjectURL(url), 10000);
            }
            
            this.hideEmptyState();
        }
    }

    // Load project from storage
    loadStoredProject() {
        if (window.location.protocol === 'file:') {
            console.warn('localStorage not available with file:// protocol');
            return false;
        }
        
        try {
            const stored = localStorage.getItem('l8vibe_current_project');
            if (stored) {
                this.currentProject = JSON.parse(stored);
                this.updateProjectDisplay();
                
                // Initialize chat for this project
                if (window.chat) {
                    chat.setCurrentProject(this.currentProject);
                }
                
                return true;
            }
        } catch (error) {
            console.error('Error loading stored project:', error);
        }
        
        return false;
    }

    // Store current project
    storeCurrentProject() {
        if (window.location.protocol === 'file:') {
            return;
        }
        if (this.currentProject) {
            localStorage.setItem('l8vibe_current_project', JSON.stringify(this.currentProject));
        }
    }

    // Clear stored project
    clearStoredProject() {
        if (window.location.protocol === 'file:') {
            return;
        }
        localStorage.removeItem('l8vibe_current_project');
    }

    // Get current project
    getCurrentProject() {
        return this.currentProject;
    }

    // Set current project
    setCurrentProject(project) {
        this.currentProject = project;
        this.storeCurrentProject();
        this.updateProjectDisplay();
    }

    // Export project data
    exportProject() {
        if (!this.currentProject) {
            auth.showError('No active project to export');
            return;
        }

        const exportData = {
            project: this.currentProject,
            chat_history: chat?.chatHistory || [],
            exported_at: new Date().toISOString(),
            version: '1.0'
        };

        // Create downloadable file
        const blob = new Blob([JSON.stringify(exportData, null, 2)], 
                             { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.currentProject.name.replace(/\s+/g, '_')}_export.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        auth.showSuccess('Project exported successfully');
    }

    // Import project data
    importProject(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                
                if (importData.project && importData.version) {
                    // Set imported project as current
                    this.setCurrentProject(importData.project);
                    
                    // Restore chat history if available
                    if (importData.chat_history && window.chat) {
                        chat.chatHistory = importData.chat_history;
                        chat.displayChatHistory();
                    }
                    
                    // Navigate to workspace
                    app.showScreen('workspaceScreen');
                    auth.showSuccess('Project imported successfully');
                } else {
                    auth.showError('Invalid project file format');
                }
            } catch (error) {
                auth.showError('Failed to import project file');
                console.error('Import error:', error);
            }
        };
        
        reader.readAsText(file);
    }

    // Get project statistics
    getProjectStats() {
        if (!this.currentProject) return null;

        const createdDate = new Date(this.currentProject.createdAt);
        const daysSinceCreation = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
            name: this.currentProject.name,
            created: createdDate.toLocaleDateString(),
            days_active: daysSinceCreation,
            chat_messages: chat?.chatHistory?.length || 0,
            has_preview: this.hasActivePreview
        };
    }
}