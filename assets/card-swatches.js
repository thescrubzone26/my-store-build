if (!customElements.get('product-card-swatches')) {
  customElements.define(
    'product-card-swatches',
    class ProductCardSwatches extends HTMLElement {
      connectedCallback() {
        this.cardWrapper = this.closest('.card-wrapper');
        this.image = this.cardWrapper ? this.cardWrapper.querySelector('.card__media img') : null;
        this.links = this.cardWrapper ? Array.from(this.cardWrapper.querySelectorAll('a.full-unstyled-link')) : [];
        this.swatches = Array.from(this.querySelectorAll('[data-card-swatch]'));

        this.defaultImageSrc = this.image ? this.image.src : null;
        this.selectedImageSrc = this.defaultImageSrc;

        this.swatches.forEach((swatch) => {
          swatch.addEventListener('click', this.onSwatchClick.bind(this));
          swatch.addEventListener('mouseenter', this.onSwatchHover.bind(this));
          swatch.addEventListener('focus', this.onSwatchHover.bind(this));
        });

        this.addEventListener('mouseleave', this.onLeave.bind(this));
        this.addEventListener('focusout', this.onLeave.bind(this));
      }

      setImage(src) {
        if (!src || !this.image) return;
        this.image.removeAttribute('srcset');
        this.image.src = src;
      }

      onSwatchHover(event) {
        const variantImage = event.currentTarget.dataset.variantImage;
        this.setImage(variantImage);
      }

      onLeave(event) {
        if (event.type === 'focusout' && this.contains(event.relatedTarget)) return;
        this.setImage(this.selectedImageSrc);
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
        if (variantImage) {
          this.selectedImageSrc = variantImage;
          this.setImage(variantImage);
        }
      }
    }
  );
}
