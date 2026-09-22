/**
 * ETF-EPT-iNat-2025 Pagination Service
 * Handles page slicing, dynamic page button generation, jump-to-page, and page size selection
 */

export class PaginationService {
  constructor(onChange) {
    this.onChange = onChange;
    this.currentPage = 1;
    this.pageSize = 20;
    this.totalItems = 0;
  }

  setPageSize(size) {
    this.pageSize = parseInt(size, 10) || 20;
    this.currentPage = 1;
    if (this.onChange) this.onChange();
  }

  goToPage(page) {
    const totalPages = this.getTotalPages();
    const target = Math.max(1, Math.min(page, totalPages));
    if (target !== this.currentPage) {
      this.currentPage = target;
      if (this.onChange) this.onChange();
    }
  }

  getTotalPages() {
    return Math.max(1, Math.ceil(this.totalItems / this.pageSize));
  }

  getPageSlice(items) {
    this.totalItems = items.length;
    const totalPages = this.getTotalPages();
    if (this.currentPage > totalPages) {
      this.currentPage = totalPages;
    }
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return {
      items: items.slice(start, end),
      start: this.totalItems > 0 ? start + 1 : 0,
      end: Math.min(end, this.totalItems),
      total: this.totalItems,
      currentPage: this.currentPage,
      totalPages: totalPages
    };
  }

  renderControls(containerEl) {
    if (!containerEl) return;
    const totalPages = this.getTotalPages();
    const cur = this.currentPage;

    containerEl.innerHTML = `
      <div class="pagination-info">
        Page <strong>${cur}</strong> of <strong>${totalPages.toLocaleString()}</strong>
        (${this.totalItems.toLocaleString()} total)
      </div>

      <div class="pagination-buttons">
        <button class="page-btn btn-first" title="First Page" ${cur === 1 ? 'disabled' : ''}>«</button>
        <button class="page-btn btn-prev" title="Previous Page" ${cur === 1 ? 'disabled' : ''}>‹</button>
        <div class="page-numbers-slot" style="display:inline-flex; gap:0.3rem;"></div>
        <button class="page-btn btn-next" title="Next Page" ${cur === totalPages ? 'disabled' : ''}>›</button>
        <button class="page-btn btn-last" title="Last Page" ${cur === totalPages ? 'disabled' : ''}>»</button>
      </div>

      <div class="page-jump">
        <span>Go to:</span>
        <input type="number" min="1" max="${totalPages}" value="${cur}" class="jump-input" />
        <select class="form-select page-size-select" style="padding-top:0.35rem; padding-bottom:0.35rem; font-size:0.82rem;">
          <option value="12" ${this.pageSize === 12 ? 'selected' : ''}>12 / page</option>
          <option value="20" ${this.pageSize === 20 ? 'selected' : ''}>20 / page</option>
          <option value="50" ${this.pageSize === 50 ? 'selected' : ''}>50 / page</option>
          <option value="100" ${this.pageSize === 100 ? 'selected' : ''}>100 / page</option>
        </select>
      </div>
    `;

    // Render smart page number buttons
    const slot = containerEl.querySelector('.page-numbers-slot');
    const pageButtons = this.getPageNumbers(cur, totalPages);
    pageButtons.forEach(p => {
      if (p === '...') {
        const dot = document.createElement('span');
        dot.style.cssText = 'padding: 0 0.3rem; color: var(--text-muted); align-self: center;';
        dot.textContent = '…';
        slot.appendChild(dot);
      } else {
        const btn = document.createElement('button');
        btn.className = `page-btn ${p === cur ? 'active' : ''}`;
        btn.textContent = p;
        btn.addEventListener('click', () => this.goToPage(p));
        slot.appendChild(btn);
      }
    });

    // Wire navigation button events
    containerEl.querySelector('.btn-first').addEventListener('click', () => this.goToPage(1));
    containerEl.querySelector('.btn-prev').addEventListener('click', () => this.goToPage(cur - 1));
    containerEl.querySelector('.btn-next').addEventListener('click', () => this.goToPage(cur + 1));
    containerEl.querySelector('.btn-last').addEventListener('click', () => this.goToPage(totalPages));

    // Jump input
    const jumpInput = containerEl.querySelector('.jump-input');
    jumpInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = parseInt(jumpInput.value, 10);
        if (val) this.goToPage(val);
      }
    });

    // Page size
    const sizeSelect = containerEl.querySelector('.page-size-select');
    sizeSelect.addEventListener('change', (e) => {
      this.setPageSize(e.target.value);
    });
  }

  getPageNumbers(current, total) {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, '...', total];
    }
    if (current >= total - 3) {
      return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  }
}
