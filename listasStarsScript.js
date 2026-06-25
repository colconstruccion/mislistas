if (window.listasStarsScriptLoaded) {
  console.log("⭐ listasStarsScript already loaded");
} else {
  window.listasStarsScriptLoaded = true;

  (function () {
    let starsVisible = false;

    function getInputs() {
      return Array.from(document.querySelectorAll('#itemsContainer input[name="item"]'));
    }

    function getRating(input) {
      return Math.max(0, Math.min(5, Number(input?.dataset?.rating || 0)));
    }

    function setRating(input, rating) {
      const safe = Math.max(0, Math.min(5, Number(rating) || 0));

      if (safe > 0) {
        input.dataset.rating = String(safe);
      } else {
        delete input.dataset.rating;
      }
    }

    function paintStars(starsBox, rating) {
      const safe = Math.max(0, Math.min(5, Number(rating) || 0));
      const stars = starsBox.querySelectorAll('.item-star');

      stars.forEach((star) => {
        const value = Number(star.dataset.value || 0);
        const filled = value <= safe;

        star.textContent = filled ? '★' : '☆';
        star.classList.toggle('filled', filled);
      });
    }

    function makeStarsBox(input) {
      const starsBox = document.createElement('div');
      starsBox.className = 'row-stars' + (starsVisible ? '' : ' hidden-stars');

      for (let i = 1; i <= 5; i++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'item-star';
        btn.dataset.value = String(i);
        btn.textContent = '☆';
        starsBox.appendChild(btn);
      }

      paintStars(starsBox, getRating(input));
      return starsBox;
    }

    function ensureStarsOnRow(input) {
      const wrap = input.closest('.input-with-link');
      if (!wrap) return;

      let starsBox = wrap.querySelector('.row-stars');

      if (!starsBox) {
        starsBox = makeStarsBox(input);
        wrap.appendChild(starsBox);
      } else {
        starsBox.classList.toggle('hidden-stars', !starsVisible);
        paintStars(starsBox, getRating(input));
      }
    }

    function ensureStarsOnAllRows() {
      getInputs().forEach((input) => {
        ensureStarsOnRow(input);
      });
    }

    function syncVisibility() {
      document.querySelectorAll('#itemsContainer .row-stars').forEach((starsBox) => {
        starsBox.classList.toggle('hidden-stars', !starsVisible);
      });

      const btn = document.getElementById('toggleStarsBtn');
      if (btn) {
        btn.classList.toggle('active', starsVisible);
      }
    }

    function refreshStars() {
      ensureStarsOnAllRows();
      syncVisibility();
    }

    function wireToolbarButton() {
      const btn = document.getElementById('toggleStarsBtn');
      console.log("⭐ toggleStarsBtn found:", btn);
      if (!btn) return;

      if (btn.dataset.starsBound === "1") return;
      btn.dataset.starsBound = "1";

      btn.addEventListener('click', () => {
        console.log("⭐ before toggle:", starsVisible);
        starsVisible = !starsVisible;
        console.log("⭐ after toggle:", starsVisible);
        refreshStars();
      });
    }

    function wireItemsContainer() {
      const itemsContainer = document.getElementById('itemsContainer');
      if (!itemsContainer) return;

      if (itemsContainer.dataset.starsBound === "1") return;
      itemsContainer.dataset.starsBound = "1";

      itemsContainer.addEventListener('click', (event) => {
        const starBtn = event.target.closest('.item-star');
        if (!starBtn) return;

        const starsBox = starBtn.closest('.row-stars');
        if (!starsBox) return;

        const wrap = starsBox.closest('.input-with-link');
        if (!wrap) return;

        const input = wrap.querySelector('input[name="item"]');
        if (!input) return;

        const clicked = Number(starBtn.dataset.value || 0);
        const current = getRating(input);
        const next = clicked === current ? 0 : clicked;

        setRating(input, next);
        paintStars(starsBox, next);

        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }

    function startPollingForNewRows() {
      let lastCount = -1;

      setInterval(() => {
        const count = getInputs().length;
        if (count !== lastCount) {
          lastCount = count;
          refreshStars();
        }
      }, 300);
    }

    function init() {
      wireToolbarButton();
      wireItemsContainer();
      refreshStars();
      startPollingForNewRows();
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
      init();
    }

    window.refreshRowStarsState = refreshStars;
  })();
}