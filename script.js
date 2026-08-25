document.addEventListener("DOMContentLoaded", () => {
  
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
  
  // Check for saved theme preference
  const savedTheme = localStorage.getItem('theme');
  
  // Default to dark mode unless the user explicitly saved 'light' previously
  if (savedTheme === 'light') {
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

    sliderContainer.addEventListener('click', () => {
      goToSlide(currentSlide + 1);
    });

    resetInterval(); 
  }
