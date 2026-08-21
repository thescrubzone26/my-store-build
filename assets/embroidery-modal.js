if (!customElements.get('embroidery-personalizer')) {
  customElements.define(
    'embroidery-personalizer',
    class EmbroideryPersonalizer extends HTMLElement {
      constructor() {
        super();

        this.productFormId = this.dataset.productFormId;
        this.sectionId = this.dataset.sectionId;
        this.productTitle = this.dataset.productTitle;
        this.nameVariantId = this.dataset.nameVariantId || null;
        this.namePriceFormatted = this.dataset.namePriceFormatted || '';
        this.namePlacement = this.dataset.namePlacement || '';
        this.imageVariantId = this.dataset.imageVariantId || null;
        this.imagePriceFormatted = this.dataset.imagePriceFormatted || '';
        this.imagePlacement = this.dataset.imagePlacement || '';
        this.bothVariantId = this.dataset.bothVariantId || null;
        this.bothPriceFormatted = this.dataset.bothPriceFormatted || '';
        this.typeLabels = {
          name: this.dataset.typeNameLabel || 'Name',
          image: this.dataset.typeImageLabel || 'Image',
          both: this.dataset.typeBothLabel || 'Name + Image',
        };
        this.activeTab = this.dataset.activeTab || 'name';

        this.tabs = Array.from(this.querySelectorAll('[data-embroidery-tab]'));
        this.groups = Array.from(this.querySelectorAll('[data-embroidery-group]'));
        this.priceEl = this.querySelector('[data-embroidery-price]');
        this.errorEl = this.querySelector('[data-embroidery-error]');
        this.swatches = Array.from(this.querySelectorAll('[data-embroidery-color]'));
        this.fontOptions = Array.from(this.querySelectorAll('[data-embroidery-font]'));
        this.fontLabelEl = this.querySelector('[data-embroidery-font-label]');
        this.resetButton = this.querySelector('[data-embroidery-reset]');
        this.submitButton = this.querySelector('[data-embroidery-submit]');
        this.submitLabelEl = this.querySelector('[data-embroidery-submit-label]');
        this.spinnerEl = this.querySelector('.loading__spinner');

        this.nameInput = this.querySelector('[data-embroidery-name]');
        this.designationInput = this.querySelector('[data-embroidery-designation]');
        this.namePlacementInput = this.querySelector('[data-embroidery-name-placement-input]');
        this.colorInput = this.querySelector('[data-embroidery-color-input]');
        this.fontInput = this.querySelector('[data-embroidery-font-input]');
        this.imagePlacementInput = this.querySelector('[data-embroidery-image-placement-input]');
        this.uploadInput = this.querySelector('[data-embroidery-custom-image-input]');
        this.uploadFilenameEl = this.querySelector('[data-embroidery-custom-image-filename]');
        this.specialRequestInput = this.querySelector('[data-embroidery-special-request]');

        const wrapper = document.querySelector(`[data-embroidery-section="${this.sectionId}"]`);
        this.wrapper = wrapper;
        this.triggerButton = wrapper.querySelector('[data-embroidery-trigger-button]');
        this.summaryEl = wrapper.querySelector('[data-embroidery-summary]');
        this.summaryPriceEl = wrapper.querySelector('[data-embroidery-summary-price]');
        this.summaryPreviewTextEl = wrapper.querySelector('[data-embroidery-summary-preview-text]');
        this.summaryPreviewImageEl = wrapper.querySelector('[data-embroidery-summary-preview-image]');
        this.summaryDetailsEl = wrapper.querySelector('[data-embroidery-summary-details]');
        this.editButton = wrapper.querySelector('[data-embroidery-edit]');
        this.deleteButton = wrapper.querySelector('[data-embroidery-delete]');
        this.wrapErrorEl = wrapper.querySelector('[data-embroidery-wrap-error]');

        this.cartEl = document.querySelector('cart-notification') || document.querySelector('cart-drawer');

        this.customIconFile = null;
        this.customIconPreviewUrl = null;
        this.staged = null;

        this.tabs.forEach((tab) => tab.addEventListener('click', () => this.setActiveTab(tab.dataset.embroideryTab)));
        this.swatches.forEach((swatch) => swatch.addEventListener('click', this.onSwatchClick.bind(this)));
        this.fontOptions.forEach((option) => option.addEventListener('click', this.onFontClick.bind(this)));
        if (this.uploadInput) this.uploadInput.addEventListener('change', this.onUploadChange.bind(this));
        if (this.resetButton) this.resetButton.addEventListener('click', () => this.resetFields());
        if (this.submitButton) this.submitButton.addEventListener('click', this.onStage.bind(this));
        if (this.triggerButton) this.triggerButton.addEventListener('click', () => this.resetFields());
        if (this.editButton) this.editButton.addEventListener('click', this.onEditClick.bind(this));
        if (this.deleteButton) this.deleteButton.addEventListener('click', this.onDeleteClick.bind(this));

        if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
          this.unsubscribeCartUpdate = subscribe(PUB_SUB_EVENTS.cartUpdate, this.onCartUpdate.bind(this));
        }

        this.setActiveTab(this.activeTab);
      }

      disconnectedCallback() {
        if (this.unsubscribeCartUpdate) this.unsubscribeCartUpdate();
        if (this.customIconPreviewUrl) URL.revokeObjectURL(this.customIconPreviewUrl);
      }

      setActiveTab(tab) {
        this.activeTab = tab;

        this.tabs.forEach((el) => {
          const isActive = el.dataset.embroideryTab === tab;
          el.classList.toggle('embroidery-modal__tab--active', isActive);
          el.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        const includesName = tab === 'name' || tab === 'both';
        const includesImage = tab === 'image' || tab === 'both';

        this.groups.forEach((group) => {
          const groupName = group.dataset.embroideryGroup;
          const visible = groupName === 'name' ? includesName : includesImage;
          group.hidden = !visible;
        });

        if (this.nameInput) this.nameInput.disabled = !includesName;
        if (this.designationInput) this.designationInput.disabled = !includesName;
        if (this.namePlacementInput) this.namePlacementInput.disabled = !includesName;
        if (this.colorInput) this.colorInput.disabled = !includesName;
        if (this.fontInput) this.fontInput.disabled = !includesName;

        if (this.imagePlacementInput) this.imagePlacementInput.disabled = !includesImage;
        if (this.uploadInput) this.uploadInput.disabled = !includesImage;
        if (this.specialRequestInput) this.specialRequestInput.disabled = !includesImage;

        this.hideError();
        this.updatePrice();
      }

      onSwatchClick(event) {
        this.swatches.forEach((el) => el.setAttribute('aria-pressed', 'false'));
        event.currentTarget.setAttribute('aria-pressed', 'true');
      }

      onFontClick(event) {
        this.fontOptions.forEach((el) => el.setAttribute('aria-pressed', 'false'));
        event.currentTarget.setAttribute('aria-pressed', 'true');
        if (this.fontLabelEl) this.fontLabelEl.textContent = event.currentTarget.dataset.embroideryFont;
      }

      onUploadChange(event) {
        const file = event.target.files && event.target.files[0];
        this.customIconFile = file || null;

        if (this.customIconPreviewUrl) {
          URL.revokeObjectURL(this.customIconPreviewUrl);
          this.customIconPreviewUrl = null;
        }
        if (this.customIconFile) this.customIconPreviewUrl = URL.createObjectURL(this.customIconFile);

        if (this.uploadFilenameEl) {
          if (file) {
            this.uploadFilenameEl.textContent = file.name;
            this.uploadFilenameEl.hidden = false;
          } else {
            this.uploadFilenameEl.textContent = '';
            this.uploadFilenameEl.hidden = true;
          }
        }

        this.hideError();
      }

      updatePrice() {
        if (!this.priceEl) return;

        if (this.activeTab === 'name') {
          this.priceEl.textContent = this.namePriceFormatted;
        } else if (this.activeTab === 'image') {
          this.priceEl.textContent = this.imagePriceFormatted;
        } else if (this.activeTab === 'both') {
          this.priceEl.textContent = this.bothPriceFormatted;
        }
      }

      currentPriceFormatted() {
        return this.priceEl ? this.priceEl.textContent : '';
      }

      getIncludesName() {
        return this.activeTab === 'name' || this.activeTab === 'both';
      }

      getIncludesImage() {
        return this.activeTab === 'image' || this.activeTab === 'both';
      }

      validate() {
        if (this.getIncludesName() && this.nameInput && this.nameInput.value.trim() === '') {
          this.nameInput.focus();
          return window.embroideryStrings.nameRequiredError;
        }

        if (this.getIncludesImage() && !this.customIconFile) {
          return window.embroideryStrings.uploadImageError;
        }

        return null;
      }

      resetFields() {
        if (this.nameInput) this.nameInput.value = '';
        if (this.designationInput) this.designationInput.value = '';
        if (this.colorInput) this.colorInput.value = '';
        if (this.fontInput) this.fontInput.value = '';

        this.swatches.forEach((el, index) => el.setAttribute('aria-pressed', index === 0 ? 'true' : 'false'));
        this.fontOptions.forEach((el, index) => el.setAttribute('aria-pressed', index === 0 ? 'true' : 'false'));
        if (this.fontLabelEl && this.fontOptions[0]) this.fontLabelEl.textContent = this.fontOptions[0].dataset.embroideryFont;

        if (this.uploadInput) this.uploadInput.value = '';
        this.customIconFile = null;
        if (this.customIconPreviewUrl) {
          URL.revokeObjectURL(this.customIconPreviewUrl);
          this.customIconPreviewUrl = null;
        }
        if (this.uploadFilenameEl) {
          this.uploadFilenameEl.textContent = '';
          this.uploadFilenameEl.hidden = true;
        }

        if (this.specialRequestInput) this.specialRequestInput.value = '';

        this.hideError();
        this.updatePrice();
      }

      syncFieldsFromStaged() {
        if (!this.staged) {
          this.resetFields();
          return;
        }

        this.setActiveTab(this.staged.tab);

        if (this.nameInput) this.nameInput.value = this.staged.name || '';
        if (this.designationInput) this.designationInput.value = this.staged.designation || '';

        this.swatches.forEach((el) => {
          el.setAttribute('aria-pressed', el.dataset.embroideryColor === this.staged.color ? 'true' : 'false');
        });
        this.fontOptions.forEach((el) => {
          const isActive = el.dataset.embroideryFont === this.staged.font;
          el.setAttribute('aria-pressed', isActive ? 'true' : 'false');
          if (isActive && this.fontLabelEl) this.fontLabelEl.textContent = el.dataset.embroideryFont;
        });

        this.customIconFile = this.staged.customIconFile;
        if (this.customIconPreviewUrl) {
          URL.revokeObjectURL(this.customIconPreviewUrl);
          this.customIconPreviewUrl = null;
        }
        if (this.customIconFile) this.customIconPreviewUrl = URL.createObjectURL(this.customIconFile);

        if (this.uploadFilenameEl) {
          if (this.customIconFile) {
            this.uploadFilenameEl.textContent = this.customIconFile.name;
            this.uploadFilenameEl.hidden = false;
          } else {
            this.uploadFilenameEl.textContent = '';
            this.uploadFilenameEl.hidden = true;
          }
        }
        if (this.uploadInput) {
          if (this.customIconFile && typeof DataTransfer !== 'undefined') {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(this.customIconFile);
            this.uploadInput.files = dataTransfer.files;
          } else {
            this.uploadInput.value = '';
          }
        }

        if (this.specialRequestInput) this.specialRequestInput.value = this.staged.specialRequest || '';

        this.hideError();
        this.updatePrice();
      }

      showError(message) {
        if (!this.errorEl) return;
        this.errorEl.textContent = message;
        this.errorEl.hidden = false;
      }

      hideError() {
        if (!this.errorEl) return;
        this.errorEl.hidden = true;
      }

      showWrapError(message) {
        if (!this.wrapErrorEl) return;
        this.wrapErrorEl.textContent = message;
        this.wrapErrorEl.hidden = false;
      }

      hideWrapError() {
        if (!this.wrapErrorEl) return;
        this.wrapErrorEl.hidden = true;
      }

      onStage() {
        const validationError = this.validate();
        if (validationError) {
          this.showError(validationError);
          return;
        }
        this.hideError();

        const includesName = this.getIncludesName();
        const includesImage = this.getIncludesImage();
        const activeSwatch = this.swatches.find((el) => el.getAttribute('aria-pressed') === 'true');
        const activeFont = this.fontOptions.find((el) => el.getAttribute('aria-pressed') === 'true');
        const designationValue = this.designationInput ? this.designationInput.value.trim() : '';
        const specialRequestValue = this.specialRequestInput ? this.specialRequestInput.value.trim() : '';

        this.staged = {
          tab: this.activeTab,
          name: includesName && this.nameInput ? this.nameInput.value.trim() : '',
          designation: includesName ? designationValue : '',
          color: includesName && activeSwatch ? activeSwatch.dataset.embroideryColor : '',
          colorName: includesName && activeSwatch ? activeSwatch.dataset.embroideryColorName : '',
          font: includesName && activeFont ? activeFont.dataset.embroideryFont : '',
          fontStyle: includesName && activeFont ? activeFont.dataset.embroideryFontStyle : '',
          customIconFile: includesImage ? this.customIconFile : null,
          customIconPreviewUrl: includesImage ? this.customIconPreviewUrl : null,
          specialRequest: includesImage ? specialRequestValue : '',
          priceFormatted: this.currentPriceFormatted(),
        };

        if (this.nameInput) this.nameInput.disabled = !includesName;
        if (this.designationInput) this.designationInput.disabled = !includesName || designationValue === '';
        if (this.namePlacementInput) this.namePlacementInput.disabled = !includesName;
        if (this.colorInput) {
          this.colorInput.value = this.staged.color;
          this.colorInput.disabled = !includesName;
        }
        if (this.fontInput) {
          this.fontInput.value = this.staged.font;
          this.fontInput.disabled = !includesName;
        }

        if (this.imagePlacementInput) this.imagePlacementInput.disabled = !includesImage;
        if (this.uploadInput) this.uploadInput.disabled = !includesImage || !this.staged.customIconFile;
        if (this.specialRequestInput) this.specialRequestInput.disabled = !includesImage || specialRequestValue === '';

        this.renderSummary();
        this.hideWrapError();

        const modal = this.closest('modal-dialog');
        if (modal) modal.hide();
      }

      renderSummary() {
        if (!this.staged) return;

        if (this.summaryPriceEl) this.summaryPriceEl.textContent = `+ ${this.staged.priceFormatted}`;

        if (this.summaryPreviewImageEl) {
          if (this.staged.customIconPreviewUrl) {
            this.summaryPreviewImageEl.src = this.staged.customIconPreviewUrl;
            this.summaryPreviewImageEl.hidden = false;
          } else {
            this.summaryPreviewImageEl.hidden = true;
          }
        }

        if (this.summaryPreviewTextEl) {
          this.summaryPreviewTextEl.textContent = this.staged.name || '';
          this.summaryPreviewTextEl.style.color = this.staged.color || '';
          this.summaryPreviewTextEl.classList.toggle(
            'embroidery-summary__preview-text--script',
            this.staged.fontStyle === 'script'
          );
        }

        if (this.summaryDetailsEl) {
          const rows = [];
          rows.push([window.embroideryStrings.typeLabel, this.typeLabels[this.staged.tab] || this.staged.tab]);

          if (this.staged.name) rows.push([window.embroideryStrings.nameLabel, this.staged.name]);
          if (this.staged.designation) rows.push([window.embroideryStrings.designationLabel, this.staged.designation]);
          if (this.staged.name) rows.push([window.embroideryStrings.namePlacementLabel, this.namePlacement]);
          if (this.staged.colorName) rows.push([window.embroideryStrings.colorLabel, this.staged.colorName]);
          if (this.staged.font) rows.push([window.embroideryStrings.fontLabel, this.staged.font]);

          if (this.staged.customIconFile) {
            rows.push([window.embroideryStrings.customImageLabel, this.staged.customIconFile.name]);
            rows.push([window.embroideryStrings.imagePlacementLabel, this.imagePlacement]);
          }
          if (this.staged.specialRequest) rows.push([window.embroideryStrings.specialRequestsLabel, this.staged.specialRequest]);

          this.summaryDetailsEl.innerHTML = rows
            .map(
              ([label, value]) =>
                `<div class="embroidery-summary__detail"><dt>${this.escapeHtml(label)}:</dt><dd>${this.escapeHtml(value)}</dd></div>`
            )
            .join('');
        }

        if (this.triggerButton) this.triggerButton.hidden = true;
        if (this.summaryEl) this.summaryEl.hidden = false;
      }

      escapeHtml(value) {
        const div = document.createElement('div');
        div.textContent = value == null ? '' : String(value);
        return div.innerHTML;
      }

      onEditClick() {
        this.syncFieldsFromStaged();
        const modal = document.getElementById(`Embroidery-Modal-${this.sectionId}`);
        if (modal) modal.show(this.editButton);
      }

      onDeleteClick() {
        this.staged = null;
        this.resetFields();
        if (this.summaryEl) this.summaryEl.hidden = true;
        if (this.triggerButton) this.triggerButton.hidden = false;
        this.hideWrapError();
      }

      buildPersonalizationItems(staged, quantity) {
        const items = [];

        if (staged.tab === 'both' && staged.customIconFile && this.bothVariantId) {
          items.push({
            id: this.bothVariantId,
            quantity,
            properties: {
              'Personalization For': this.productTitle,
              Type: 'Name + Image Embroidery',
              Image: staged.customIconFile.name,
            },
          });
          return items;
        }

        if ((staged.tab === 'name' || staged.tab === 'both') && this.nameVariantId) {
          items.push({
            id: this.nameVariantId,
            quantity,
            properties: {
              'Personalization For': this.productTitle,
              Type: 'Name Embroidery',
            },
          });
        }

        if ((staged.tab === 'image' || staged.tab === 'both') && staged.customIconFile && this.imageVariantId) {
          items.push({
            id: this.imageVariantId,
            quantity,
            properties: {
              'Personalization For': this.productTitle,
              Type: 'Image Embroidery',
              Image: staged.customIconFile.name,
            },
          });
        }

        return items;
      }

      onCartUpdate(event) {
        if (!event || event.source !== 'product-form' || !this.staged) return;

        const staged = this.staged;
        const quantityInput = document.getElementById(`Quantity-${this.sectionId}`);
        const quantity = quantityInput ? parseInt(quantityInput.value, 10) || 1 : 1;
        const items = this.buildPersonalizationItems(staged, quantity);
        if (items.length === 0) return;

        const config = fetchConfig('json');
        config.body = JSON.stringify({
          items,
          sections: this.cartEl ? this.cartEl.getSectionsToRender().map((section) => section.id) : [],
          sections_url: window.location.pathname,
        });

        fetch(`${window.routes.cart_add_url}`, config)
          .then((response) => response.json())
          .then((response) => {
            if (response.status) {
              throw new Error(window.embroideryStrings.partialFailure);
            }
            if (this.cartEl) this.cartEl.renderContents(response);
            this.onDeleteClick();
          })
          .catch((error) => {
            this.showWrapError(error.message || window.embroideryStrings.partialFailure);
          });
      }
    }
  );
}
