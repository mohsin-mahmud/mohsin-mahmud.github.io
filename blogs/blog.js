document.addEventListener('DOMContentLoaded', () => {
  const menuButton = document.querySelector('.menu-button');
  const nav = document.querySelector('.site-nav');
  if (menuButton && nav) {
    menuButton.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(open));
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      nav.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
    }));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        nav.classList.remove('open');
        menuButton.setAttribute('aria-expanded', 'false');
      }
    });
  }

  const progress = document.querySelector('.reading-progress span');
  const backTop = document.querySelector('.back-to-top');
  const updateScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? Math.min(100, Math.max(0, window.scrollY / max * 100)) : 0;
    if (progress) progress.style.width = `${pct}%`;
    if (backTop) backTop.classList.toggle('show', window.scrollY > 700);
  };
  updateScroll();
  window.addEventListener('scroll', updateScroll, { passive: true });
  if (backTop) backTop.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));

  const search = document.querySelector('#blog-search');
  if (search) {
    const cards = [...document.querySelectorAll('.post-card')];
    const count = document.querySelector('#archive-count');
    const empty = document.querySelector('#empty-state');
    const filter = () => {
      const q = search.value.trim().toLowerCase();
      let shown = 0;
      cards.forEach(card => {
        const match = !q || card.dataset.search.includes(q);
        card.hidden = !match;
        if (match) shown++;
      });
      if (count) count.textContent = `${shown} article${shown === 1 ? '' : 's'}`;
      if (empty) empty.classList.toggle('show', shown === 0);
    };
    search.addEventListener('input', filter);
    filter();
  }
});
