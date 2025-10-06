// Portfolio functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize navigation
    initializeNavigation();
    
    // Initialize category filtering
    initializeCategoryFiltering();
    
    // Initialize card overlay functionality
    initializeCardOverlays();
    
    // Initialize project modal functionality
    initializeProjectModal();
    
    // Handle deep linking on page load
    handleDeepLinking();
    
    // Initialize first-flag-only display for Home cards
    initializeCardFlagDisplay();
});

/**
 * Initialize navigation functionality
 */
function initializeNavigation() {
    const desktopNavBtns = document.querySelectorAll('.desktop-nav .nav-btn');
    const mobileNavBtns = document.querySelectorAll('.mobile-nav .nav-btn');
    
    // Handle desktop navigation clicks
    desktopNavBtns.forEach(btn => {
        btn.addEventListener('click', () => handleNavClick(btn, desktopNavBtns));
    });
    
    // Handle mobile navigation clicks
    mobileNavBtns.forEach(btn => {
        btn.addEventListener('click', () => handleNavClick(btn, mobileNavBtns));
    });
}

/**
 * Handle navigation button clicks
 * @param {HTMLElement} clickedBtn - The clicked navigation button
 * @param {NodeList} allBtns - All navigation buttons in the same nav
 */
function handleNavClick(clickedBtn, allBtns) {
    // Remove active state from all buttons
    allBtns.forEach(btn => {
        btn.setAttribute('data-active', 'false');
        btn.removeAttribute('aria-current');
    });
    
    // Set active state on clicked button
    clickedBtn.setAttribute('data-active', 'true');
    clickedBtn.setAttribute('aria-current', 'page');
    
    // Handle specific navigation actions
    const navType = clickedBtn.getAttribute('data-nav');
    switch (navType) {
        case 'home':
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
            break;
        case 'about':
            // Placeholder for about section navigation
            console.log('Navigate to About Us');
            break;
        case 'contact':
            // Scroll to contact section
            scrollToContact();
            break;
    }
}

/**
 * Initialize category filtering functionality
 */
function initializeCategoryFiltering() {
    const chips = document.querySelectorAll('.chip');
    const cards = document.querySelectorAll('.card');
    
    chips.forEach(chip => {
        chip.addEventListener('click', () => handleCategoryFilter(chip, chips, cards));
    });
}

/**
 * Handle category filter chip clicks
 * @param {HTMLElement} clickedChip - The clicked filter chip
 * @param {NodeList} allChips - All filter chips
 * @param {NodeList} allCards - All portfolio cards
 */
function handleCategoryFilter(clickedChip, allChips, allCards) {
    // Remove active state from all chips
    allChips.forEach(chip => {
        chip.classList.remove('active');
        chip.setAttribute('aria-pressed', 'false');
    });
    
    // Set active state on clicked chip
    clickedChip.classList.add('active');
    clickedChip.setAttribute('aria-pressed', 'true');
    
    // Get selected category
    const selectedCategory = clickedChip.getAttribute('data-cat');
    
    // Filter cards
    filterCards(allCards, selectedCategory);
}

/**
 * Filter portfolio cards based on selected category
 * @param {NodeList} cards - All portfolio cards
 * @param {string} category - Selected category to filter by
 */
function filterCards(cards, category) {
    cards.forEach(card => {
        const cardCategories = card.getAttribute('data-cats');
        
        if (category === 'all') {
            // Show all cards
            showCard(card);
        } else {
            // Check if card has the selected category
            if (cardCategories && cardCategories.includes(category)) {
                showCard(card);
            } else {
                hideCard(card);
            }
        }
    });
    
    // Reapply first-flag-only display after filtering
    applyFirstFlagOnly();
}

/**
 * Show a portfolio card with smooth transition
 * @param {HTMLElement} card - The card to show
 */
function showCard(card) {
    card.classList.remove('hidden');
    card.style.display = '';
    
    // Add a small delay for smooth reflow
    requestAnimationFrame(() => {
        card.style.opacity = '1';
        card.style.transform = 'scale(1)';
    });
}

/**
 * Hide a portfolio card with smooth transition
 * @param {HTMLElement} card - The card to hide
 */
function hideCard(card) {
    card.style.opacity = '0';
    card.style.transform = 'scale(0.95)';
    
    // Hide after transition completes
    setTimeout(() => {
        card.style.display = 'none';
        card.classList.add('hidden');
    }, 200);
}

/**
 * Scroll to contact section with smooth behavior
 */
function scrollToContact() {
    const contactSection = document.getElementById('contact');
    
    if (contactSection) {
        // Check if user prefers reduced motion
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        contactSection.scrollIntoView({
            behavior: prefersReducedMotion ? 'auto' : 'smooth',
            block: 'start'
        });
    }
}

/**
 * Handle keyboard navigation for accessibility
 */
document.addEventListener('keydown', function(event) {
    // Handle Enter and Space key presses on interactive elements
    if (event.key === 'Enter' || event.key === ' ') {
        const target = event.target;
        
        // Handle chip activation with keyboard
        if (target.classList.contains('chip')) {
            event.preventDefault();
            target.click();
        }
        
        // Handle navigation button activation with keyboard
        if (target.classList.contains('nav-btn')) {
            event.preventDefault();
            target.click();
        }
        
        // Handle CTA button activation with keyboard
        if (target.classList.contains('cta-btn')) {
            event.preventDefault();
            target.click();
        }
    }
});

/**
 * Handle window resize for responsive behavior
 */
window.addEventListener('resize', function() {
    // Debounce resize events
    clearTimeout(window.resizeTimeout);
    window.resizeTimeout = setTimeout(() => {
        // Force masonry reflow on resize
        const masonryContainer = document.querySelector('.masonry-container');
        if (masonryContainer) {
            // Trigger reflow by temporarily changing column count
            const currentColumns = window.getComputedStyle(masonryContainer).columnCount;
            masonryContainer.style.columnCount = 'auto';
            requestAnimationFrame(() => {
                masonryContainer.style.columnCount = currentColumns;
            });
        }
    }, 250);
});

/**
 * Initialize first-flag-only display for Home page cards
 */
function initializeCardFlagDisplay() {
    applyFirstFlagOnly();
}

/**
 * Apply first-flag-only rule to all cards
 * Shows only the first flag in each card, hides all others
 */
function applyFirstFlagOnly() {
    const cards = document.querySelectorAll('.card');
    
    cards.forEach(card => {
        // Find all flag elements within this card
        const flags = card.querySelectorAll('[class^="flag-"], [class*=" flag-"]');
        
        if (flags.length === 0) return;
        
        // Show first flag, hide all others
        flags.forEach((flag, index) => {
            if (index === 0) {
                // First flag: ensure it's visible
                flag.classList.remove('flag-hidden');
                flag.removeAttribute('aria-hidden');
                flag.setAttribute('tabindex', '0');
            } else {
                // Subsequent flags: hide them
                flag.classList.add('flag-hidden');
                flag.setAttribute('aria-hidden', 'true');
                flag.setAttribute('tabindex', '-1');
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('project-modal');
    if (!modal) return;

    const backdrop = modal.querySelector('.modal-backdrop');
    const frame = modal.querySelector('.modal-frame');
    const titleEl = modal.querySelector('.modal-title');
    const imgEl = modal.querySelector('.project-image');
    const closeBtn = modal.querySelector('.modal-close');
    const modalFlags = modal.querySelector('.modal-flags');

    // Tool mapping configuration
    const toolConfig = {
        'ps': {
            class: 'bubble-PS',
            ariaLabel: 'Photoshop',
            label: 'PS',
            isImage: false
        },
        'ai': {
            class: 'bubble-AI',
            ariaLabel: 'Illustrator',
            label: 'AI',
            isImage: false
        },
        'blender': {
            class: 'bubble-blender',
            ariaLabel: 'Blender',
            label: '',
            isImage: true
        },
        'figma': {
            class: 'bubble-figma',
            ariaLabel: 'Figma',
            label: '',
            isImage: true
        },
        'pr': {
            class: 'bubble-PR',
            ariaLabel: 'Premiere Pro',
            label: 'PR',
            isImage: false
        }
    };

    /**
     * Render bubbles dynamically based on tools array
     * @param {string[]} tools - Array of tool keys (e.g., ['PS', 'AI'])
     */
    function renderBubbles(tools) {
        if (!modalFlags) return;

        // Clear existing bubbles
        modalFlags.innerHTML = '';

        // Render each tool bubble in order
        tools.forEach(toolKey => {
            const normalizedKey = toolKey.toLowerCase().trim();
            const config = toolConfig[normalizedKey];

            // Skip unknown tools
            if (!config) return;

            // Create bubble element
            const bubble = document.createElement('div');
            bubble.className = config.class;
            bubble.setAttribute('aria-label', config.ariaLabel);

            // Create inner label
            const labelSpan = document.createElement('span');
            labelSpan.className = 'bubble-text';

            if (config.isImage) {
                // For image-based bubbles (Blender, Figma)
                labelSpan.setAttribute('role', 'img');
                labelSpan.setAttribute('aria-label', config.ariaLabel);
            } else {
                // For text-based bubbles (PS, AI, PR)
                labelSpan.textContent = config.label;
            }

            bubble.appendChild(labelSpan);
            modalFlags.appendChild(bubble);
        });
    }

    // Open by card element (matches your card HTML)
    function openFromCard(card, pushHistory = true) {
        const id = card.getAttribute('data-id') || '';
        const title = card.getAttribute('data-title') || 'Project';
        const img = card.getAttribute('data-img') || card.querySelector('img')?.src || '';
        const toolsAttr = card.getAttribute('data-tools') || '';

        if (titleEl) titleEl.textContent = title;

        if (imgEl) {
            imgEl.src = img || `https://picsum.photos/seed/${encodeURIComponent(id || 'long')}/900/3000`;
            imgEl.alt = title;
        }

        // Parse and render tools
        const tools = toolsAttr.split(',').map(t => t.trim()).filter(t => t);
        renderBubbles(tools);

        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        frame?.focus();

        if (pushHistory) {
            const url = new URL(window.location.href);
            url.searchParams.set('project', id || 'p');
            history.pushState({ project: id }, '', url);
        }
    }

    function closeModal(fromHistory = false) {
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        
        // Optional: clear the image source to free memory
        // if (imgEl) imgEl.src = '';

        if (!fromHistory) {
            const url = new URL(window.location.href);
            url.searchParams.delete('project');
            history.pushState({}, '', url);
        }
    }

    // Delegate clicks to cards (your .card structure)
    document.addEventListener('click', (e) => {
        const el = e.target instanceof Element ? e.target : null;
        if (!el) return;
        
        const card = el.closest('.card');
        if (!card) return;

        // Prevent default if an <a> is inside
        const link = el.closest('a');
        if (link) e.preventDefault();

        openFromCard(card, true);
    });

    // Keyboard: Enter/Space on focused card opens modal
    document.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && document.activeElement?.classList?.contains('card')) {
            e.preventDefault();
            openFromCard(document.activeElement, true);
        }
    });

    // Close actions
    backdrop?.addEventListener('click', () => closeModal());
    closeBtn?.addEventListener('click', () => closeModal());
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') closeModal();
    });

    // Deep link: open if ?project=... present
    function openFromUrl(push = false) {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('project');
        if (!id) return false;
        
        const card = document.querySelector(`.card[data-id="${CSS.escape(id)}"]`);
        if (card) {
            openFromCard(card, push);
            return true;
        }
        return false;
    }

    // On load
    openFromUrl(false);

    // Back/forward behavior
    window.addEventListener('popstate', () => {
        const has = new URLSearchParams(window.location.search).has('project');
        if (!has) {
            if (modal.getAttribute('aria-hidden') === 'false') closeModal(true);
        } else {
            openFromUrl(false);
        }
    });

    // Click handler for margin areas to close modal
    const content = modal?.querySelector('.modal-content');
    if (content) {
        content.addEventListener('click', (e) => {
            const t = e.target;
            if (!(t instanceof Element)) return;
            
            const insideFigure = t.closest('.project-figure');
            const insideContact = t.closest('.modal-contact-inner');
            
            // If clicked on padded area (margins), close
            if (!insideFigure && !insideContact) {
                closeModal();
            }
        });
    }
});
