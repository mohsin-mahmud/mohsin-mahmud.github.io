// ================= FIX: STOP THE BROWSER FROM RESTORING OLD SCROLL POSITION =================
// This is the actual root cause of "sidebar shows Honors, then jumps back to
// Profile" on load/refresh. Browsers remember how far down the page you were
// scrolled and silently restore that position — sometimes *after* our own
// DOMContentLoaded code has already run, especially on a heavy page like this
// one with a video background and several images still loading. That restore
// happens to land on whatever section (e.g. Honors) you'd previously scrolled
// to, the sidebar highlights it, and only then does our own top-scroll logic
// correct it — which is the visible "stays at Honors, then snaps to Profile"
// glitch. Telling the browser to leave scroll restoration to us, and forcing
// position 0 as early as possible (before DOMContentLoaded even fires),
// closes that gap.
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

document.addEventListener("DOMContentLoaded", () => {

  // ================= 0. CINEMATIC INTRO SPLASH SCREEN =================
  const introSplash = document.getElementById("intro-splash");
  const enterBtn = document.getElementById("enter-site-btn");

  if (introSplash && enterBtn) {
    // 1. Lock scroll instantly so the user stays trapped in the intro.
    // The old version only locked <body>. Because the splash sits on top as a
    // position:fixed OVERLAY (a sibling of #main-portfolio, not its parent),
    // a mouse-wheel/touch scroll over the splash still bubbles up to the
    // document and scrolls the page underneath — the splash just doesn't
    // visually move (it's fixed), so you don't notice until you dismiss it
    // and land mid-page. Locking BOTH <html> and <body> together closes that
    // gap reliably across browsers (including mobile Safari, which often
    // ignores a body-only lock).
    document.documentElement.classList.add("intro-scroll-lock");
    document.body.classList.add("intro-scroll-lock");
    // behavior: 'instant' overrides the page's global `scroll-behavior: smooth`
    // so this snap to the top is never a visible animated scroll.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    // 2. Trigger the split doors (0.7s after load)
    setTimeout(() => {
      introSplash.classList.add("open");
    }, 700);

    // 3. When button is clicked, slide intro away
    enterBtn.addEventListener("click", () => {
      introSplash.classList.add("dismissed");
      
      // Unlock scroll 1 second later (when slide animation is fully finished)
      setTimeout(() => {
        // Removes the JS lock so your CSS "overflow-x: clip" takes over again, fixing the sticky sidebar!
        document.documentElement.classList.remove("intro-scroll-lock");
        document.body.classList.remove("intro-scroll-lock");
        // Belt-and-braces: force the reveal to start at the very top of the
        // main site, even if any scroll ever slipped through during the intro.
        // Instant (not smooth) so there's no visible animated jump.
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        // The scrollspy only re-runs on a 'scroll' event, but if we were
        // already at position 0 the line above won't fire one — so the
        // sidebar highlight could stay stuck on whatever section it last
        // calculated during the lock. Sync it directly, right now.
        updateActiveSection();
      }, 1000); 
    });
  }
  
  // ================= 1. MOBILE MENU LOGIC (Matches original script.js) =================
  const menuBtn = document.querySelector('.menu-toggle');
  const topNav = document.querySelector('.top-nav');
  
  if(menuBtn && topNav) {
    menuBtn.addEventListener('click', () => {
      const isOpen = topNav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(isOpen));
    });

    // Close menu when a link is clicked
    topNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        topNav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', event => {
      if (!topNav.contains(event.target) && !menuBtn.contains(event.target)) {
        topNav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ================= 2. SCROLLSPY FOR DESKTOP STICKY NAV =================
  const sectionEls = [...document.querySelectorAll('.portfolio-main .content-section[id]')];
  const sideLinks = [...document.querySelectorAll('.side-nav-menu .nav-link')];

  function updateActiveSection() {
    if (!sectionEls.length || !sideLinks.length) return;

    // While the intro lock is on, html/body are height:100%+overflow:hidden,
    // so the body's overflow no longer propagates to the document —
    // document.documentElement.scrollHeight temporarily collapses to ~one
    // viewport tall. That makes "nearBottom" below always true, which
    // force-picks the LAST section (Honors) as active. This is the actual
    // cause of the Honors-then-Profile flash. Skip until layout is real.
    if (document.documentElement.classList.contains('intro-scroll-lock')) return;

    const marker = window.scrollY + (window.innerHeight * 0.35);
    let active = sectionEls[0].id;

    for (const section of sectionEls) {
      if (section.offsetTop <= marker) active = section.id;
      else break;
    }

    const nearBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 50;
    if (nearBottom) active = sectionEls[sectionEls.length - 1].id;

    let activeLink = null;
    sideLinks.forEach(link => {
      const isActive = link.dataset.section === active;
      if(isActive) { 
        link.classList.add('active');
        activeLink = link;
      } 
      else { 
        link.classList.remove('active'); 
      }
    });

    const indicator = document.querySelector('.nav-indicator');
    if (activeLink && indicator) {
      indicator.style.transform = `translateY(${activeLink.offsetTop}px)`;
      indicator.style.height = `${activeLink.offsetHeight}px`;
    }
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateActiveSection();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
  
  // Call once on load and on resize to position the indicator correctly
  updateActiveSection();
  window.addEventListener('resize', updateActiveSection);

  // ================= 3. THEME TOGGLE =================
  const themeToggles = document.querySelectorAll('.theme-toggle');
  
  // Check for saved theme preference or use system preference
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  
  if (savedTheme === 'light' || (!savedTheme && systemPrefersLight)) {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  themeToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
    });
  });
});

// ================= 4. GALLERY SLIDER (SLIDE IMAGES + FADE TEXT) =================
  const sliderContainer = document.querySelector('.gallery-slider');
  
  if (sliderContainer) {
    const slides = document.querySelectorAll('.slide');
    const dotsContainer = document.querySelector('.slider-dots');
    const globalCaption = document.getElementById('global-caption');
    let currentSlide = 0;
    let slideInterval;

    // Auto-generate navigation dots
    slides.forEach((_, i) => {
      const dot = document.createElement('div');
      dot.classList.add('dot');
      if (i === 0) dot.classList.add('active');
      dot.addEventListener('click', (e) => {
        e.stopPropagation(); 
        goToSlide(i);
      });
      dotsContainer.appendChild(dot);
    });
    const dots = document.querySelectorAll('.dot');

    function goToSlide(n) {
      if (currentSlide === n) return; 

      // 1. Start fading out the text immediately
      if (globalCaption) {
        globalCaption.classList.add('fade-out');
      }

      // 2. Handle the Image Slide Animation
      slides.forEach(s => s.classList.remove('sliding-out'));
      
      const oldSlide = slides[currentSlide];
      oldSlide.classList.remove('active');
      oldSlide.classList.add('sliding-out');
      dots[currentSlide].classList.remove('active');

      currentSlide = (n + slides.length) % slides.length;
      const newSlide = slides[currentSlide];
      
      void newSlide.offsetWidth; // Force browser reflow
      
      newSlide.classList.add('active');
      dots[currentSlide].classList.add('active');
      
      // 3. Swap the text and fade it back in after 400ms (halfway through the slide)
      setTimeout(() => {
        if (globalCaption) {
          globalCaption.innerHTML = newSlide.getAttribute('data-caption');
          globalCaption.classList.remove('fade-out');
        }
      }, 400); 

      resetInterval();
    }

    function resetInterval() {
      clearInterval(slideInterval);
      slideInterval = setInterval(() => goToSlide(currentSlide + 1), 5000);
    }

    sliderContainer.addEventListener('click', (e) => {
      // Get the dimensions and position of the slider container
      const rect = sliderContainer.getBoundingClientRect();
      
      // Calculate the X coordinate of the click relative to the container
      const clickX = e.clientX - rect.left;
      
      // If the click is on the left half of the container, go back
      if (clickX < rect.width / 2) {
        goToSlide(currentSlide - 1);
      } 
      // Otherwise (clicked on the right half), go forward
      else {
        goToSlide(currentSlide + 1);
      }
    });

    resetInterval(); 
  }
