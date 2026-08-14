function processInstagramEmbeds() {
  if (window.instgrm && window.instgrm.Embeds) {
    window.instgrm.Embeds.process();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  processInstagramEmbeds();

  let attempts = 0;
  const interval = setInterval(() => {
    attempts += 1;
    if (window.instgrm) {
      processInstagramEmbeds();
      clearInterval(interval);
    } else if (attempts > 20) {
      clearInterval(interval);
    }
  }, 250);
});

document.addEventListener('shopify:section:load', processInstagramEmbeds);

class SocialShopFeedCarousel extends HTMLElement {
  connectedCallback() {
    this.list = this.querySelector('[data-social-feed-list]');
    this.prevButton = this.querySelector('[data-social-feed-prev]');
    this.nextButton = this.querySelector('[data-social-feed-next]');

    if (!this.list || !this.prevButton || !this.nextButton) return;

    this.prevButton.addEventListener('click', () => this.scrollByPage(-1));
    this.nextButton.addEventListener('click', () => this.scrollByPage(1));
    this.list.addEventListener('scroll', () => this.updateButtons());
    window.addEventListener('resize', () => this.updateButtons());

    requestAnimationFrame(() => this.updateButtons());
  }

  scrollByPage(direction) {
    this.list.scrollBy({ left: direction * this.list.clientWidth, behavior: 'smooth' });
  }

  updateButtons() {
    const maxScroll = this.list.scrollWidth - this.list.clientWidth;
    this.prevButton.disabled = this.list.scrollLeft <= 4;
    this.nextButton.disabled = this.list.scrollLeft >= maxScroll - 4;
    this.classList.toggle('social-feed--no-overflow', maxScroll <= 4);
  }
}

customElements.define('social-shop-feed-carousel', SocialShopFeedCarousel);
