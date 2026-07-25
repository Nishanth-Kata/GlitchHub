(function () {
    'use strict';

    /* Always start at top on refresh — ignore saved scroll / hash jump */
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    if (window.location.hash) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    window.scrollTo(0, 0);

    window.addEventListener('pageshow', function (event) {
        if (event.persisted) {
            window.scrollTo(0, 0);
        }
    });

    var prefersReducedMotion =
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function revealAll() {
        var items = document.querySelectorAll('.reveal, .reveal-group > *');
        for (var i = 0; i < items.length; i++) {
            items[i].classList.add('visible');
        }
    }

    /* ---------- Scroll reveal ---------- */
    if (!('IntersectionObserver' in window) || prefersReducedMotion) {
        revealAll();
    } else {
        var groups = document.querySelectorAll('.reveal-group');
        groups.forEach(function (group) {
            var kids = group.children;
            for (var i = 0; i < kids.length; i++) {
                kids[i].style.transitionDelay = (i * 90) + 'ms';
            }
        });

        var targets = document.querySelectorAll('.reveal, .reveal-group > *, .download-card, .faq-item, .feature, .timeline-item, .admin-console-mock');
        var isMobile = window.innerWidth <= 768;
        var observer = new IntersectionObserver(
            function (entries, obs) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        obs.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: isMobile ? 0.04 : 0.1,
                rootMargin: isMobile ? '0px 0px 40px 0px' : '0px 0px -40px 0px'
            }
        );

        targets.forEach(function (el) {
            observer.observe(el);
        });

        setTimeout(revealAll, 3000);
    }

    /* ---------- Scroll progress bar + scrolled header + parallax ---------- */
    var progressEl = document.querySelector('.scroll-progress');
    var headerEl = document.querySelector('.site-header');
    var parallaxTargets = document.querySelectorAll('[data-parallax]');
    var ticking = false;

    function onScroll() {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(function () {
            var scrollY = window.pageYOffset || document.documentElement.scrollTop;
            var docHeight =
                (document.documentElement.scrollHeight ||
                    document.body.scrollHeight) - window.innerHeight;
            var pct = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;

            if (progressEl) {
                progressEl.style.width = pct + '%';
            }

            if (headerEl) {
                if (scrollY > 12) headerEl.classList.add('scrolled');
                else headerEl.classList.remove('scrolled');
            }

            if (!prefersReducedMotion && scrollY > 0) {
                parallaxTargets.forEach(function (el) {
                    var speed = parseFloat(el.getAttribute('data-parallax')) || 0.2;
                    var rect = el.getBoundingClientRect();
                    if (rect.bottom > 0 && rect.top < window.innerHeight) {
                        var offset = scrollY * speed;
                        var container = el.querySelector('.container');
                        if (container) {
                            container.style.transform =
                                'translate3d(0,' + offset + 'px,0)';
                            container.style.opacity = String(
                                Math.max(
                                    0,
                                    1 - scrollY / (window.innerHeight * 0.9)
                                )
                            );
                        }
                    }
                });
            }

            ticking = false;
        });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();

    var yearEl = document.getElementById('footer-year');
    if (yearEl) {
        yearEl.textContent = String(new Date().getFullYear());
    }

    /* ---------- Latest release download links (includes pre-releases) ---------- */
    var releaseRepo = 'Nishanth-Kata/GlitchHub';
    var winLink = document.querySelector('[data-download-win]');
    var macLink = document.querySelector('[data-download-mac]');

    if (winLink || macLink) {
        fetch('https://api.github.com/repos/' + releaseRepo + '/releases?per_page=1')
            .then(function (response) {
                if (!response.ok) throw new Error('release lookup failed');
                return response.json();
            })
            .then(function (releases) {
                if (!releases || !releases.length) return;
                var tag = releases[0].tag_name;
                var base =
                    'https://github.com/' + releaseRepo + '/releases/download/' + tag + '/';
                if (winLink) winLink.href = base + 'GlitchHub-Setup-win.exe';
                if (macLink) macLink.href = base + 'GlitchHub-mac-arm64.dmg';
            })
            .catch(function () {
                /* keep fallback hrefs baked into index.html */
            });
    }
    /* ---------- FAQ Accordion Fallback ---------- */
    var faqDetails = document.querySelectorAll('#faq details');
    faqDetails.forEach(function (detail) {
        detail.addEventListener('toggle', function (event) {
            if (detail.open) {
                faqDetails.forEach(function (other) {
                    if (other !== detail && other.open) {
                        other.removeAttribute('open');
                    }
                });
            }
        });
    });

    /* ---------- Back to Top Button ---------- */
    var backToTopBtn = document.getElementById('backToTop');
    if (backToTopBtn) {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 400) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        });
        backToTopBtn.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /* ---------- Interactive Horizontal Timeline Stepper ---------- */
    var timelineNodes = document.querySelectorAll('.timeline-node');
    var viewerContents = document.querySelectorAll('.viewer-content');
    var progressBar = document.getElementById('timelineProgressBar');

    var currentStepIndex = 1;
    var totalSteps = timelineNodes.length;
    var autoPlayInterval = null;
    var userInteractionTimeout = null;
    var stepDuration = 5000; // auto-play step duration (5s)
    var resumeDelay = 10000; // delay to resume after user click (10s)

    function updateTimeline(targetStep, isManualClick) {
        var stepIndex = parseInt(targetStep, 10);
        currentStepIndex = stepIndex;

        // Cumulative active nodes (all nodes up to stepIndex glow)
        timelineNodes.forEach(function (node) {
            var nodeVal = parseInt(node.getAttribute('data-step'), 10);
            if (nodeVal <= stepIndex) {
                node.classList.add('active');
            } else {
                node.classList.remove('active');
            }
        });

        // Toggle active viewer content state
        viewerContents.forEach(function (content) {
            content.classList.remove('active');
            if (content.getAttribute('data-step-content') === targetStep) {
                content.classList.add('active');
            }
        });

        // Set transition style dynamically depending on autoplay vs manual click
        if (progressBar) {
            if (isManualClick) {
                progressBar.style.setProperty('--progress-transition', 'width 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)');
                var progressPercent = ((stepIndex - 1) / (totalSteps - 1)) * 100;
                progressBar.style.setProperty('--progress-width', progressPercent + '%');
            } else {
                progressBar.style.setProperty('--progress-transition', 'width 5s linear');
                if (stepIndex < totalSteps) {
                    // Autoplay mode: fill slowly towards the NEXT step
                    var nextPercent = (stepIndex / (totalSteps - 1)) * 100;
                    progressBar.style.setProperty('--progress-width', nextPercent + '%');
                } else {
                    // At step 6: keep bar full (100%)
                    progressBar.style.setProperty('--progress-width', '100%');
                }
            }
        }
    }

    function resetToStepOne() {
        if (progressBar) {
            progressBar.style.setProperty('--progress-transition', 'width 0s');
            progressBar.style.setProperty('--progress-width', '0%');
        }

        timelineNodes.forEach(function (node) {
            var nodeVal = parseInt(node.getAttribute('data-step'), 10);
            if (nodeVal === 1) {
                node.classList.add('active');
            } else {
                node.classList.remove('active');
            }
        });

        if (progressBar) {
            var reflow = progressBar.offsetWidth; // Force layout recalculation
        }

        updateTimeline('1', false);
    }

    function startAutoPlay() {
        stopAutoPlay();
        autoPlayInterval = setInterval(function () {
            if (currentStepIndex < totalSteps) {
                var nextStep = currentStepIndex + 1;
                updateTimeline(nextStep.toString(), false);
            } else {
                // Reached the end (Step 6). Wait 5 seconds, snap reset, then restart loop.
                stopAutoPlay();
                setTimeout(function () {
                    resetToStepOne();
                    startAutoPlay();
                }, stepDuration);
            }
        }, stepDuration);
    }

    function stopAutoPlay() {
        if (autoPlayInterval) {
            clearInterval(autoPlayInterval);
            autoPlayInterval = null;
        }
    }

    function handleUserClick(step) {
        stopAutoPlay();
        if (userInteractionTimeout) {
            clearTimeout(userInteractionTimeout);
            userInteractionTimeout = null;
        }

        // Quick snap transition on manual click
        updateTimeline(step, true);

        // Resume slow progress transition after delay
        userInteractionTimeout = setTimeout(function () {
            startAutoPlay();
        }, resumeDelay);
    }

    // Attach click listeners
    timelineNodes.forEach(function (node) {
        node.addEventListener('click', function () {
            var step = node.getAttribute('data-step');
            handleUserClick(step);
        });
    });

    // Initialize progress bar and glow ONLY when the '#how' section is inside the viewport
    var howSection = document.getElementById('how');

    if (howSection && 'IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    resetToStepOne();
                    startAutoPlay();
                } else {
                    stopAutoPlay();
                    resetToStepOne();
                }
            });
        }, { threshold: 0.15 }); // triggers when 15% of section is visible
        observer.observe(howSection);
    } else {
        // Fallback for older browsers or if howSection doesn't exist
        updateTimeline('1', false);
        startAutoPlay();
    }

    /* ---------- Scroll Spy (Highlight active navbar link) ---------- */
    var sections = document.querySelectorAll('section');
    var navLinks = document.querySelectorAll('.site-header nav a');

    if ('IntersectionObserver' in window) {
        var spyObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var activeId = entry.target.getAttribute('id');
                    navLinks.forEach(function (link) {
                        link.classList.remove('active');
                        // If we are back in the hero, clear all active highlights
                        if (entry.target.classList.contains('hero')) {
                            return;
                        }
                        if (link.getAttribute('href') === '#' + activeId) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        }, {
            rootMargin: '-30% 0px -40% 0px' // triggers when section dominates viewport center
        });

        var hero = document.querySelector('.hero');
        if (hero) spyObserver.observe(hero);
        sections.forEach(function (sec) {
            if (sec.getAttribute('id')) {
                spyObserver.observe(sec);
            }
        });
    }

    /* ---------- Mobile Hamburger Menu Toggle ---------- */
    var mobileMenuBtn = document.getElementById('mobileMenuBtn');
    var navMenu = document.getElementById('navMenu');
    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            mobileMenuBtn.classList.toggle('active');
            navMenu.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });

        // Close menu when a navigation link is clicked
        var navLinks = navMenu.querySelectorAll('a');
        navLinks.forEach(function (link) {
            link.addEventListener('click', function () {
                mobileMenuBtn.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.classList.remove('menu-open');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', function (e) {
            if (navMenu.classList.contains('active') && !navMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                mobileMenuBtn.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.classList.remove('menu-open');
            }
        });
    }

    /* ---------- Floating Back to Top Button ---------- */
    var backToTop = document.getElementById('backToTop');
    if (backToTop) {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 300) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        });

        backToTop.addEventListener('click', function (e) {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
})();
