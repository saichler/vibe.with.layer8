// Marketing Page Module
class MarketingManager {
    constructor() {
        this.initialized = false;
    }

    // Initialize marketing page functionality
    init() {
        this.bindMarketingEvents();
        this.setupScrollEffects();
        this.setupModalHandlers();
        this.initialized = true;
    }

    // Bind marketing page events
    bindMarketingEvents() {
        // About CTA button
        const aboutCTA = document.getElementById('aboutCTA');
        if (aboutCTA) {
            aboutCTA.addEventListener('click', (e) => {
                e.preventDefault();
                this.showAboutModal();
            });
        }

        // Create Project CTA button
        const createProjectCTA = document.getElementById('createProjectCTA');
        if (createProjectCTA) {
            createProjectCTA.addEventListener('click', (e) => {
                e.preventDefault();
                this.showCreateProjectModal();
            });
        }

        // Login CTA buttons
        const loginCTA = document.getElementById('loginCTA');
        const getStartedBtn = document.getElementById('getStartedBtn');
        const ctaStartBtn = document.getElementById('ctaStartBtn');

        [loginCTA, getStartedBtn, ctaStartBtn].forEach(btn => {
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showLoginModal();
                });
            }
        });

        // Smooth scroll navigation
        const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    const headerHeight = document.querySelector('.marketing-header')?.offsetHeight || 0;
                    const targetPosition = targetElement.offsetTop - headerHeight - 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });

        // Header scroll effect
        window.addEventListener('scroll', () => {
            this.handleHeaderScroll();
        });
    }

    // Setup modal handlers
    setupModalHandlers() {
        // About modal handlers
        const aboutModal = document.getElementById('aboutModal');
        const closeAbout = document.getElementById('closeAbout');

        if (closeAbout) {
            closeAbout.addEventListener('click', () => {
                this.hideAboutModal();
            });
        }

        if (aboutModal) {
            aboutModal.addEventListener('click', (e) => {
                if (e.target === aboutModal) {
                    this.hideAboutModal();
                }
            });
        }

        // Create Project modal handlers
        const createProjectModal = document.getElementById('createProjectModal');
        const closeCreateProject = document.getElementById('closeCreateProject');

        if (closeCreateProject) {
            closeCreateProject.addEventListener('click', () => {
                this.hideCreateProjectModal();
            });
        }

        if (createProjectModal) {
            createProjectModal.addEventListener('click', (e) => {
                if (e.target === createProjectModal) {
                    this.hideCreateProjectModal();
                }
            });
        }

        // Login modal handlers
        const loginModal = document.getElementById('loginModal');
        const closeLogin = document.getElementById('closeLogin');

        if (closeLogin) {
            closeLogin.addEventListener('click', () => {
                this.hideLoginModal();
            });
        }

        if (loginModal) {
            loginModal.addEventListener('click', (e) => {
                if (e.target === loginModal) {
                    this.hideLoginModal();
                }
            });
        }

        // Close modals with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (aboutModal && aboutModal.classList.contains('active')) {
                    this.hideAboutModal();
                } else if (createProjectModal && createProjectModal.classList.contains('active')) {
                    this.hideCreateProjectModal();
                } else if (loginModal && loginModal.classList.contains('active')) {
                    this.hideLoginModal();
                }
            }
        });
    }

    // Show about modal
    showAboutModal() {
        const aboutModal = document.getElementById('aboutModal');
        if (aboutModal) {
            aboutModal.classList.add('active');
            aboutModal.style.display = 'flex';
            
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
        }
    }

    // Hide about modal
    hideAboutModal() {
        const aboutModal = document.getElementById('aboutModal');
        if (aboutModal) {
            aboutModal.classList.remove('active');
            
            // Fade out animation
            setTimeout(() => {
                aboutModal.style.display = 'none';
            }, 300);
            
            // Restore body scroll
            document.body.style.overflow = '';
        }
    }

    // Show create project modal
    showCreateProjectModal() {
        const createProjectModal = document.getElementById('createProjectModal');
        if (createProjectModal) {
            createProjectModal.classList.add('active');
            createProjectModal.style.display = 'flex';
            
            // Focus project name input after animation
            setTimeout(() => {
                const projectNameInput = document.getElementById('modalProjectName');
                if (projectNameInput) {
                    projectNameInput.focus();
                }
            }, 300);
            
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
        }
    }

    // Hide create project modal
    hideCreateProjectModal() {
        const createProjectModal = document.getElementById('createProjectModal');
        if (createProjectModal) {
            createProjectModal.classList.remove('active');
            
            // Fade out animation
            setTimeout(() => {
                createProjectModal.style.display = 'none';
            }, 300);
            
            // Restore body scroll
            document.body.style.overflow = '';
            
            // Clear form
            const projectNameInput = document.getElementById('modalProjectName');
            const projectDescInput = document.getElementById('modalProjectDescription');
            if (projectNameInput) projectNameInput.value = '';
            if (projectDescInput) projectDescInput.value = '';
        }
    }

    // Show login modal
    showLoginModal() {
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            loginModal.classList.add('active');
            loginModal.style.display = 'flex';
            
            // Focus email input after animation
            setTimeout(() => {
                const emailInput = document.getElementById('loginEmail');
                if (emailInput) {
                    emailInput.focus();
                }
            }, 300);
            
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
        }
    }

    // Hide login modal
    hideLoginModal() {
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            loginModal.classList.remove('active');
            
            // Fade out animation
            setTimeout(() => {
                loginModal.style.display = 'none';
            }, 300);
            
            // Restore body scroll
            document.body.style.overflow = '';
            
            // Clear form
            const emailInput = document.getElementById('loginEmail');
            const passwordInput = document.getElementById('loginPassword');
            if (emailInput) emailInput.value = '';
            if (passwordInput) passwordInput.value = '';
        }
    }

    // Handle header scroll effects
    handleHeaderScroll() {
        const header = document.querySelector('.marketing-header');
        if (!header) return;

        const scrollY = window.scrollY;
        
        if (scrollY > 50) {
            header.style.background = 'rgba(254, 252, 249, 0.98)';
            header.style.boxShadow = '0 2px 20px rgba(58, 54, 51, 0.1)';
        } else {
            header.style.background = 'rgba(254, 252, 249, 0.95)';
            header.style.boxShadow = 'none';
        }
    }

    // Setup scroll-based animations
    setupScrollEffects() {
        // Intersection Observer for fade-in animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        }, observerOptions);

        // Observe elements that should animate in
        const animateElements = document.querySelectorAll(
            '.arch-step, .feature-card, .hero-content, .hero-visual'
        );
        
        animateElements.forEach(el => {
            observer.observe(el);
        });

        // Parallax effect for hero section
        window.addEventListener('scroll', () => {
            this.handleParallaxEffects();
        });
    }

    // Handle parallax effects
    handleParallaxEffects() {
        const scrollY = window.scrollY;
        const heroSection = document.querySelector('.hero-section');
        
        if (heroSection && scrollY < window.innerHeight) {
            const parallaxElements = heroSection.querySelectorAll('.wabi-circle');
            
            parallaxElements.forEach(el => {
                const speed = 0.5;
                el.style.transform = `translateY(${scrollY * speed}px)`;
            });
        }
    }

    // Update navigation active state based on scroll position
    updateActiveNavigation() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
        
        let currentSection = '';
        const scrollY = window.scrollY;
        const headerHeight = document.querySelector('.marketing-header')?.offsetHeight || 0;

        sections.forEach(section => {
            const sectionTop = section.offsetTop - headerHeight - 100;
            const sectionHeight = section.offsetHeight;
            
            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                currentSection = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    }

    // Smooth scroll to section
    scrollToSection(sectionId, offset = 20) {
        const section = document.getElementById(sectionId);
        if (section) {
            const headerHeight = document.querySelector('.marketing-header')?.offsetHeight || 0;
            const targetPosition = section.offsetTop - headerHeight - offset;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    }

    // Handle responsive navigation
    setupMobileNavigation() {
        // This could be expanded for mobile menu functionality
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            // Hide navigation links on mobile
            const navLinks = document.querySelectorAll('.nav-link:not(#loginCTA)');
            navLinks.forEach(link => {
                link.style.display = 'none';
            });
        } else {
            // Show navigation links on desktop
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.style.display = '';
            });
        }
    }

    // Handle window resize
    handleResize() {
        this.setupMobileNavigation();
        
        // Update parallax calculations
        this.handleParallaxEffects();
    }

    // Analytics tracking (placeholder)
    trackEvent(eventName, properties = {}) {
        // This would integrate with your analytics service
        console.log('Marketing event:', eventName, properties);
        
        // Example events:
        // - 'cta_clicked'
        // - 'section_viewed'
        // - 'login_modal_opened'
        // - 'get_started_clicked'
    }

    // Check if marketing manager is initialized
    isInitialized() {
        return this.initialized;
    }

    // Cleanup (if needed)
    cleanup() {
        // Remove event listeners if needed
        window.removeEventListener('scroll', this.handleHeaderScroll);
        window.removeEventListener('scroll', this.handleParallaxEffects);
        this.initialized = false;
    }
}

// Add additional CSS for animations
const marketingStyle = document.createElement('style');
marketingStyle.textContent = `
    /* Fade-in animation for scroll elements */
    .arch-step, .feature-card, .hero-content, .hero-visual {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s ease-out;
    }
    
    .arch-step.fade-in, .feature-card.fade-in, .hero-content.fade-in, .hero-visual.fade-in {
        opacity: 1;
        transform: translateY(0);
    }
    
    /* Stagger animations for feature cards */
    .feature-card:nth-child(1) { transition-delay: 0.1s; }
    .feature-card:nth-child(2) { transition-delay: 0.2s; }
    .feature-card:nth-child(3) { transition-delay: 0.3s; }
    .feature-card:nth-child(4) { transition-delay: 0.4s; }
    .feature-card:nth-child(5) { transition-delay: 0.5s; }
    .feature-card:nth-child(6) { transition-delay: 0.6s; }
    
    /* Active nav link style */
    .nav-link.active {
        color: var(--earth-brown);
    }
    
    .nav-link.active::after {
        width: 100%;
    }
    
    /* Enhanced modal animations */
    .modal {
        opacity: 0;
        transition: opacity 0.3s ease-out;
    }
    
    .modal.active {
        opacity: 1;
    }
    
    .modal-content {
        transform: scale(0.9) translateY(50px);
        transition: transform 0.3s ease-out;
    }
    
    .modal.active .modal-content {
        transform: scale(1) translateY(0);
    }
`;
document.head.appendChild(marketingStyle);