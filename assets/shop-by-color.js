if (!customElements.get('shop-by-color-carousel')) {
  customElements.define(
    'shop-by-color-carousel',
    class ShopByColorCarousel extends HTMLElement {
      connectedCallback() {
        this.list = this.querySelector('[data-shop-by-color-list]');
        this.prevButton = this.querySelector('[data-shop-by-color-prev]');
        this.nextButton = this.querySelector('[data-shop-by-color-next]');
        this.dotsContainer = this.querySelector('[data-shop-by-color-dots]');
        if (!this.list) return;

        this.onScroll = this.debounce(this.updateState.bind(this), 100);
        this.onResize = this.debounce(this.build.bind(this), 200);

        if (this.prevButton) this.prevButton.addEventListener('click', () => this.scrollByPage(-1));
        if (this.nextButton) this.nextButton.addEventListener('click', () => this.scrollByPage(1));
        this.list.addEventListener('scroll', this.onScroll);
        window.addEventListener('resize', this.onResize);

        this.build();
      }

      disconnectedCallback() {
        window.removeEventListener('resize', this.onResize);
      }

      scrollByPage(direction) {
        this.list.scrollBy({ left: direction * this.list.clientWidth, behavior: 'smooth' });
      }

      build() {
        const hasOverflow = this.list.scrollWidth > this.list.clientWidth + 1;
        this.classList.toggle('shop-by-color--no-overflow', !hasOverflow);

        if (!this.dotsContainer) return;
        this.dotsContainer.innerHTML = '';
        if (!hasOverflow) return;

        const pageCount = Math.max(1, Math.round(this.list.scrollWidth / this.list.clientWidth));
        for (let i = 0; i < pageCount; i++) {
          const dot = document.createElement('button');
          dot.type = 'button';
          dot.className = 'shop-by-color__dot';
          dot.setAttribute('aria-label', `${i + 1}`);
          dot.addEventListener('click', () => {
            this.list.scrollTo({ left: i * this.list.clientWidth, behavior: 'smooth' });
          });
          this.dotsContainer.appendChild(dot);
        }

        this.updateState();
      }

      updateState() {
        const pageWidth = this.list.clientWidth || 1;
        const activeIndex = Math.round(this.list.scrollLeft / pageWidth);

        if (this.dotsContainer) {
          Array.prototype.forEach.call(this.dotsContainer.children, (dot, index) => {
            dot.classList.toggle('is-active', index === activeIndex);
          });
        }

        if (this.prevButton) this.prevButton.disabled = this.list.scrollLeft <= 0;
        if (this.nextButton) {
          this.nextButton.disabled = this.list.scrollLeft + this.list.clientWidth >= this.list.scrollWidth - 1;
        }
      }

      debounce(fn, wait) {
        let timeoutId;
        return (...args) => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => fn(...args), wait);
        };
      }
    }
  );
}
