// Chat Module
class ChatManager {
    constructor() {
        this.chatHistory = [];
        this.isConnected = false;
        this.currentProject = null;
    }

    // Initialize chat functionality
    init() {
        this.bindChatEvents();
        this.setupChat();
    }

    // Bind chat-related events
    bindChatEvents() {
        const chatInput = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendChatBtn');

        if (sendBtn) {
            sendBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleSendMessage();
            });
        }

        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleSendMessage();
                }
            });

            // Auto-resize input as user types
            chatInput.addEventListener('input', () => {
                this.adjustInputHeight();
            });
        }
    }

    // Setup initial chat state
    setupChat() {
        this.isConnected = true;
        this.updateConnectionStatus();
        this.loadChatHistory();
    }

    // Handle sending a message
    async handleSendMessage() {
        const chatInput = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendChatBtn');
        
        if (!chatInput || !chatInput.value.trim()) {
            return;
        }

        const userMessage = chatInput.value.trim();
        chatInput.value = '';
        this.adjustInputHeight();

        // Add user message to chat
        this.addMessage(userMessage, 'user');

        // Show typing indicator
        const typingId = this.showTypingIndicator();

        // Disable input while processing
        if (sendBtn) sendBtn.disabled = true;
        if (chatInput) chatInput.disabled = true;

        try {
            // Send message to API via project PATCH
            const response = await this.sendToProjectAPI(userMessage);
            
            // Remove typing indicator
            this.removeTypingIndicator(typingId);
            
            // Add AI response from the project response
            console.log('PATCH Response:', response);
            console.log('Response type:', typeof response);
            console.log('Response structure:', JSON.stringify(response, null, 2));
            
            // The response has a 'list' array containing the project
            let project = response;
            if (response && typeof response === 'object') {
                // Check if response has a list array with project data
                if (response.list && Array.isArray(response.list) && response.list.length > 0) {
                    project = response.list[0];
                } else if (response.project) {
                    project = response.project;
                } else if (response.element) {
                    project = response.element;
                } else if (response.data) {
                    project = response.data;
                }
            }
            
            console.log('Extracted project:', project);
            console.log('Project messages:', project?.messages);
            
            if (project && project.messages && project.messages.length > 0) {
                console.log('Found messages in project, count:', project.messages.length);
                // Find the assistant message from the response
                const assistantMessage = project.messages.find(msg => msg.role === 'assistant');
                console.log('Assistant message found:', assistantMessage);
                if (assistantMessage && assistantMessage.content) {
                    this.addMessage(assistantMessage.content, 'ai');
                } else {
                    console.log('No assistant message with content found');
                    this.addMessage("I'm here to help you create amazing web applications. What would you like to build?", 'ai');
                }
            } else {
                console.log('No messages found in project');
                this.addMessage("I'm here to help you create amazing web applications. What would you like to build?", 'ai');
            }

        } catch (error) {
            // Remove typing indicator
            this.removeTypingIndicator(typingId);
            
            // Show error message
            this.addMessage("I apologize, but I'm having trouble connecting right now. Please try again in a moment.", 'ai');
            console.error('Chat API error:', error);
        } finally {
            // Re-enable input
            if (sendBtn) sendBtn.disabled = false;
            if (chatInput) chatInput.disabled = false;
            chatInput.focus();
        }
    }

    // Send message to L8Vibe Project API via PATCH
    async sendToProjectAPI(message) {
        if (!this.currentProject) {
            throw new Error('No current project available');
        }

        // Create a clone of the project without the messages attribute
        const projectClone = {
            name: this.currentProject.name,
            description: this.currentProject.description,
            user: this.currentProject.user,
            apiKey: this.currentProject.apiKey
            // Intentionally omitting messages attribute
        };

        // Create user message and add it as a single message to the project clone
        const userMessage = {
            role: 'user',
            content: message
        };
        projectClone.messages = [userMessage];

        // Send PATCH request to /l8vibe/0/proj endpoint
        const response = await fetch('/l8vibe/0/proj', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(projectClone)
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        return await response.json();
    }

    // Add message to chat display
    addMessage(content, sender, timestamp = null) {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;

        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}-message fade-in`;

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const messageParagraph = document.createElement('p');
        messageParagraph.textContent = content;
        messageContent.appendChild(messageParagraph);

        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = timestamp || this.formatTime(new Date());

        messageElement.appendChild(messageContent);
        messageElement.appendChild(messageTime);

        messagesContainer.appendChild(messageElement);

        // Store in history
        this.chatHistory.push({
            content,
            sender,
            timestamp: timestamp || new Date().toISOString()
        });

        // Scroll to bottom
        this.scrollToBottom();

        // Save to storage
        this.saveChatHistory();
    }

    // Show typing indicator
    showTypingIndicator() {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return null;

        const typingId = 'typing-' + Date.now();
        const typingElement = document.createElement('div');
        typingElement.className = 'message ai-message';
        typingElement.id = typingId;

        const typingContent = document.createElement('div');
        typingContent.className = 'message-content typing-indicator';
        typingContent.innerHTML = `
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;

        typingElement.appendChild(typingContent);
        messagesContainer.appendChild(typingElement);
        
        this.scrollToBottom();
        
        return typingId;
    }

    // Remove typing indicator
    removeTypingIndicator(typingId) {
        if (typingId) {
            const typingElement = document.getElementById(typingId);
            if (typingElement) {
                typingElement.remove();
            }
        }
    }

    // Handle workspace updates from AI
    handleWorkspaceUpdate(update) {
        if (update.preview_url) {
            // Update the preview iframe
            const previewFrame = document.getElementById('previewFrame');
            if (previewFrame) {
                previewFrame.src = update.preview_url;
                
                // Hide empty state
                const emptyState = document.getElementById('emptyState');
                if (emptyState) {
                    emptyState.style.display = 'none';
                }
            }
        }

        if (update.status) {
            // Update workspace status
            this.updateWorkspaceStatus(update.status);
        }
    }

    // Update workspace status
    updateWorkspaceStatus(status) {
        // This could update various UI elements based on workspace status
        console.log('Workspace status updated:', status);
    }

    // Scroll chat to bottom
    scrollToBottom() {
        const messagesContainer = document.getElementById('chatMessages');
        if (messagesContainer) {
            setTimeout(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 100);
        }
    }

    // Format time for display
    formatTime(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffMins < 1) {
            return 'Just now';
        } else if (diffMins < 60) {
            return `${diffMins} min ago`;
        } else if (diffHours < 24) {
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    // Adjust input height based on content
    adjustInputHeight() {
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.style.height = 'auto';
            chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
        }
    }

    // Update connection status
    updateConnectionStatus() {
        const statusDot = document.querySelector('.chat-status .status-dot');
        const statusText = document.querySelector('.chat-status span');
        
        if (statusDot) {
            statusDot.className = `status-dot ${this.isConnected ? 'active' : ''}`;
        }
        
        if (statusText) {
            statusText.textContent = this.isConnected ? 'Connected' : 'Disconnected';
        }
    }

    // Save chat history to storage
    saveChatHistory() {
        if (this.currentProject) {
            const storageKey = `l8vibe_chat_${this.currentProject.id}`;
            localStorage.setItem(storageKey, JSON.stringify(this.chatHistory));
        }
    }

    // Load chat history from storage
    loadChatHistory() {
        if (this.currentProject) {
            const storageKey = `l8vibe_chat_${this.currentProject.id}`;
            const stored = localStorage.getItem(storageKey);
            
            if (stored) {
                try {
                    this.chatHistory = JSON.parse(stored);
                    this.displayChatHistory();
                } catch (error) {
                    console.error('Error loading chat history:', error);
                    this.chatHistory = [];
                }
            }
        }
    }

    // Display stored chat history
    displayChatHistory() {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;

        // Clear existing messages except welcome message
        const welcomeMessage = messagesContainer.querySelector('.ai-message');
        messagesContainer.innerHTML = '';
        if (welcomeMessage) {
            messagesContainer.appendChild(welcomeMessage);
        }

        // Add stored messages
        this.chatHistory.forEach(message => {
            this.addMessage(message.content, message.sender, message.timestamp);
        });
    }

    // Load messages from project into chat session
    loadProjectMessages(messages) {
        // Clear existing chat
        this.chatHistory = [];
        const messagesContainer = document.getElementById('chatMessages');
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
        }
        
        // Process each message according to the specified logic
        messages.forEach(message => {
            if (message.role === 'user') {
                // Add user message content directly to chat
                this.addMessage(message.content, 'user');
            } else if (message.role === 'assistant') {
                // For assistant messages, get the last line and add "...Done!"
                const content = message.content || '';
                const lines = content.split('\n').filter(line => line.trim());
                const lastLine = lines.length > 0 ? lines[lines.length - 1] : content;
                const formattedContent = lastLine + '...Done!';
                this.addMessage(formattedContent, 'ai');
            }
        });
        
        // Save the loaded messages as chat history
        this.saveChatHistory();
    }

    // Set current project
    setCurrentProject(project) {
        this.currentProject = project;
        
        // Check if project has messages to load into chat session
        if (project && project.messages && project.messages.length > 0) {
            this.loadProjectMessages(project.messages);
        } else {
            this.loadChatHistory();
        }
    }

    // Clear chat history
    clearChat() {
        this.chatHistory = [];
        const messagesContainer = document.getElementById('chatMessages');
        if (messagesContainer) {
            // Keep only the welcome message
            const welcomeMessage = messagesContainer.querySelector('.ai-message');
            messagesContainer.innerHTML = '';
            if (welcomeMessage) {
                messagesContainer.appendChild(welcomeMessage);
            }
        }
        
        if (this.currentProject) {
            const storageKey = `l8vibe_chat_${this.currentProject.id}`;
            localStorage.removeItem(storageKey);
        }
    }
}

// Add typing indicator CSS
const typingStyle = document.createElement('style');
typingStyle.textContent = `
    .typing-indicator {
        padding: 16px 20px !important;
    }
    
    .typing-dots {
        display: flex;
        gap: 4px;
        align-items: center;
    }
    
    .typing-dots span {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--stone-dark);
        animation: typingPulse 1.4s ease-in-out infinite;
    }
    
    .typing-dots span:nth-child(2) {
        animation-delay: 0.2s;
    }
    
    .typing-dots span:nth-child(3) {
        animation-delay: 0.4s;
    }
    
    @keyframes typingPulse {
        0%, 60%, 100% {
            opacity: 0.3;
            transform: scale(1);
        }
        30% {
            opacity: 1;
            transform: scale(1.2);
        }
    }
`;
document.head.appendChild(typingStyle);