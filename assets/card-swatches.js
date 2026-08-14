if (!customElements.get('product-card-swatches')) {
  customElements.define(
    'product-card-swatches',
    class ProductCardSwatches extends HTMLElement {
      connectedCallback() {
        this.cardWrapper = this.closest('.card-wrapper');
        this.image = this.cardWrapper ? this.cardWrapper.querySelector('.card__media img') : null;
        this.links = this.cardWrapper ? Array.from(this.cardWrapper.querySelectorAll('a.full-unstyled-link')) : [];
        this.swatches = Array.from(this.querySelectorAll('[data-card-swatch]'));

        this.swatches.forEach((swatch) => swatch.addEventListener('click', this.onSwatchClick.bind(this)));
      }

      onSwatchClick(event) {
        const button = event.currentTarget;

        this.swatches.forEach((swatch) => swatch.setAttribute('aria-pressed', 'false'));
        button.setAttribute('aria-pressed', 'true');

        const variantUrl = button.dataset.variantUrl;
        if (variantUrl) {
          this.links.forEach((link) => {
            link.href = variantUrl;
          });
        }

        const variantImage = button.dataset.variantImage;
        if (variantImage && this.image) {
          this.image.removeAttribute('srcset');
          this.image.src = variantImage;
        }
      }
    }
  );
}
