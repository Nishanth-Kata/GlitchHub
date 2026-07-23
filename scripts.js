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
                kids[i].style.transitionDelay = (i * 100) + 'ms';
            }
        });

        var targets = document.querySelectorAll('.reveal, .reveal-group > *');
        var observer = new IntersectionObserver(
            function (entries, obs) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        obs.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
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
})();
