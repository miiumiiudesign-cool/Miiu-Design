// Portfolio functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize navigation
    initializeNavigation();
    
    // Initialize category filtering
    initializeCategoryFiltering();

    // Initialize first-flag-only display for Home cards
    initializeCardFlagDisplay();

    // Fade sections in as the user scrolls to them
    initializeScrollReveal();

    // Start the homepage hero's right-to-left case study carousel
    initializeHeroCarousel();

    // Case study pages: keep the nav hidden over the full-screen hero
    initializeCaseStudyNav();

    // Home page: zoom a case study up to full screen before opening it
    initializeCaseStudyZoom();

    // Case study pages: photo carousels (arrows and dots)
    initializePhotoCarousels();

    // Case study showcases: float the cards on a shared clock
    syncCardFloat(document.documentElement);
});

/**
 * The showcase cards bob on a 6s loop (csFloat). Starting that loop from the
 * wall clock rather than from when each element appeared keeps every copy in
 * step - the home page block, the zoom copy and the case study page - so a
 * card never jumps when one hands over to the next.
 */
function syncCardFloat(scope) {
    scope.style.setProperty('--cs-float-phase', `${-(Date.now() % 6000) / 1000}s`);
}

/**
 * Clicking a case study showcase on the home page zooms a copy of it up to
 * fill the window, then opens the case study page, whose hero is that same
 * block at full screen - so the page appears to keep growing into itself.
 * Done in script rather than with browser page transitions so it runs every
 * time, in every browser, even when the site is opened from local files.
 */
function initializeCaseStudyZoom() {
    const links = document.querySelectorAll('a.cs-showcase');
    if (links.length === 0) return;

    let zooming = false;

    // Back button restores this page from cache mid-zoom: put it back
    window.addEventListener('pageshow', (event) => {
        if (!event.persisted) return;
        document.querySelectorAll('.cs-zoom-clone').forEach(clone => clone.remove());
        links.forEach(link => { link.style.visibility = ''; });
        document.body.classList.remove('cs-zooming');
        zooming = false;
    });

    links.forEach(link => {
        link.addEventListener('click', (event) => {
            // Let new-tab clicks and the like through untouched
            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            if (zooming) {
                event.preventDefault();
                return;
            }

            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (prefersReducedMotion) return;

            event.preventDefault();
            zooming = true;

            const rect = link.getBoundingClientRect();
            const clone = link.cloneNode(true);
            clone.classList.add('cs-zoom-clone');
            clone.removeAttribute('id');
            clone.setAttribute('aria-hidden', 'true');
            clone.tabIndex = -1;
            Object.assign(clone.style, {
                position: 'fixed',
                top: `${rect.top}px`,
                left: `${rect.left}px`,
                width: `${rect.width}px`,
                height: `${rect.height}px`,
                minHeight: '0',
                maxHeight: 'none',
                margin: '0',
                zIndex: '1000'
            });
            // Keep the floating cards on the same beat as the originals
            syncCardFloat(clone);

            // The copy's images are new elements: load them now (not lazily)
            // and only swap the copy in once they're decoded - otherwise the
            // laptop is missing for a frame and the block flashes
            const images = Array.from(clone.querySelectorAll('img'));
            images.forEach(img => {
                img.loading = 'eager';
                img.decoding = 'sync';
            });
            clone.style.visibility = 'hidden';
            document.body.appendChild(clone);

            const startZoom = () => {
                clone.style.visibility = '';
                link.style.visibility = 'hidden';
                document.body.classList.add('cs-zooming');

                // Match the case study hero exactly: full width, small-viewport height
                const fullHeight = CSS.supports('height', '100svh') ? '100svh' : '100vh';
                const zoom = clone.animate([
                    {
                        top: `${rect.top}px`,
                        left: `${rect.left}px`,
                        width: `${rect.width}px`,
                        height: `${rect.height}px`,
                        borderRadius: getComputedStyle(link).borderRadius,
                        boxShadow: getComputedStyle(link).boxShadow
                    },
                    {
                        top: '0px',
                        left: '0px',
                        // clientWidth leaves out a visible scrollbar, as the hero does
                        width: `${document.documentElement.clientWidth}px`,
                        height: fullHeight,
                        borderRadius: '0px',
                        boxShadow: 'none'
                    }
                ], { duration: 850, easing: 'cubic-bezier(0.65, 0, 0.25, 1)', fill: 'forwards' });

                const open = () => { window.location.href = link.href; };
                zoom.finished.then(open, open);
            };

            // Start as soon as the images are decoded (both the swap and the
            // first animation step then land in the same frame), or after
            // 150ms at the latest so a slow decode can't hold the click up
            let started = false;
            const startOnce = () => {
                if (started) return;
                started = true;
                startZoom();
            };
            Promise.all(images.map(img => img.decode().catch(() => {}))).then(startOnce);
            setTimeout(startOnce, 150);
        });
    });
}

/**
 * On a case study page the hero fills the screen with no nav. Once most of
 * it has scrolled away (the visitor has reached the details), add
 * .cs-nav-visible to <body> so the CSS eases the nav in; scrolling back up
 * to the hero hides it again.
 */
function initializeCaseStudyNav() {
    // The full-screen block, not the whole hero (which also has the fade
    // strip below it), so the nav appears at the same point as before
    const hero = document.querySelector('.cs-hero .cs-showcase');
    if (!hero) return;

    if (!('IntersectionObserver' in window)) {
        document.body.classList.add('cs-nav-visible');
        return;
    }

    const observer = new IntersectionObserver(([entry]) => {
        document.body.classList.toggle('cs-nav-visible', entry.intersectionRatio < 0.35);
    }, { threshold: [0, 0.35, 1] });

    observer.observe(hero);
}

/**
 * Copy the hero cards so the CSS marquee (which slides the track by exactly
 * half its width) loops without a gap: first repeat them until one half is
 * wider than the screen (with only a few cards, one set is not), then
 * double the lot. --marquee-cards tells the CSS how many cards are in a
 * half, so the speed stays the same. The copies are hidden from screen
 * readers and the tab order. With reduced motion the row stays still and
 * can be scrolled sideways instead.
 */
function initializeHeroCarousel() {
    const track = document.querySelector('.hero-cards');
    if (!track) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const originals = Array.from(track.children);
    const appendCopies = (cards) => cards.forEach(card => {
        const copy = card.cloneNode(true);
        copy.setAttribute('aria-hidden', 'true');
        copy.setAttribute('tabindex', '-1');
        copy.querySelectorAll('img').forEach(img => { img.alt = ''; });
        track.appendChild(copy);
    });

    // The screen, not the window, so making the window wider later can't open a gap
    const widest = Math.max(window.screen.width, track.parentElement.clientWidth);
    const sets = Math.max(1, Math.ceil(widest / track.scrollWidth));
    for (let i = 1; i < sets; i++) appendCopies(originals);

    const half = Array.from(track.children);
    appendCopies(half);

    track.style.setProperty('--marquee-cards', half.length);
    track.classList.add('is-looping');
}

/**
 * Photo carousels on case study pages ([data-carousel]). The slides sit in
 * a horizontally scroll-snapping track, so swiping works on its own; this
 * adds dots, wires up the arrow buttons and the arrow keys, and keeps the
 * dots and arrows in step with whichever slide is showing. With a single
 * photo the controls stay hidden.
 */
function initializePhotoCarousels() {
    document.querySelectorAll('[data-carousel]').forEach(carousel => {
        const track = carousel.querySelector('.cs-carousel-track');
        const slides = Array.from(track.children);
        if (slides.length < 2) return;

        carousel.classList.add('has-controls');
        const prev = carousel.querySelector('.cs-carousel-btn--prev');
        const next = carousel.querySelector('.cs-carousel-btn--next');
        const dotsBox = carousel.querySelector('.cs-carousel-dots');
        const dotLabel = dotsBox.dataset.label || 'Photo';

        const dots = slides.map((slide, i) => {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'cs-carousel-dot';
            dot.setAttribute('aria-label', `${dotLabel} ${i + 1}`);
            dot.addEventListener('click', () => goTo(i));
            dotsBox.appendChild(dot);
            return dot;
        });

        const current = () => Math.round(track.scrollLeft / track.clientWidth);
        const goTo = (i) => {
            const index = Math.max(0, Math.min(slides.length - 1, i));
            track.scrollTo({ left: index * track.clientWidth, behavior: 'smooth' });
        };

        const update = () => {
            const i = current();
            dots.forEach((dot, n) => dot.setAttribute('aria-current', n === i ? 'true' : 'false'));
            prev.disabled = i === 0;
            next.disabled = i === slides.length - 1;
        };

        prev.addEventListener('click', () => goTo(current() - 1));
        next.addEventListener('click', () => goTo(current() + 1));
        track.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowLeft') { event.preventDefault(); goTo(current() - 1); }
            if (event.key === 'ArrowRight') { event.preventDefault(); goTo(current() + 1); }
        });
        track.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
        update();
    });
}

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
        // Find all flag elements within this card (direct children only —
        // avoids also matching the inner .flag-text label, which also starts with "flag-")
        const flags = card.querySelectorAll(':scope > [class^="flag-"], :scope > [class*=" flag-"]');
        
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

/**
 * Fade page sections in as they scroll into view.
 * Skips the hero (which already has its own load-in animation) and the
 * portfolio grid (whose cards manage their own inline show/hide styles
 * during category filtering, which would conflict with a class-based fade).
 */
function initializeScrollReveal() {
    const targets = document.querySelectorAll(
        '.content-section, .featured-work, .case-study, .projects-cta, .contact-placeholder, .service-card, .team-card'
    );

    if (targets.length === 0) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        // Show everything immediately — no animation to skip
        return;
    }

    targets.forEach((el, index) => {
        el.classList.add('reveal');
        el.style.transitionDelay = `${(index % 4) * 60}ms`;
    });

    let pending = Array.from(targets);

    function reveal(el) {
        el.classList.add('reveal-visible');
        pending = pending.filter(item => item !== el);
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                observer.unobserve(entry.target);
                reveal(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(el => observer.observe(el));

    // Safety net: an instant scroll jump (anchor-link navigation, keyboard
    // Home/End, or the browser restoring a scroll position on reload) can
    // move past a target between rendered frames without the observer ever
    // reporting it as intersecting, leaving it stuck at opacity 0 forever.
    // A lightweight scroll check catches anything the observer missed.
    let ticking = false;

    function sweepPending() {
        ticking = false;
        if (pending.length === 0) {
            window.removeEventListener('scroll', onScroll);
            return;
        }
        pending.slice().forEach(el => {
            if (el.getBoundingClientRect().top < window.innerHeight) {
                observer.unobserve(el);
                reveal(el);
            }
        });
    }

    function onScroll() {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(sweepPending);
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    requestAnimationFrame(sweepPending);
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
            if (history.state && 'project' in history.state) {
                // We pushed this entry when opening - step back off it, so
                // pressing Back afterwards doesn't reopen the modal
                history.back();
            } else {
                // Opened from a ?project= link: just drop the parameter
                const url = new URL(window.location.href);
                url.searchParams.delete('project');
                history.replaceState({}, '', url);
            }
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
