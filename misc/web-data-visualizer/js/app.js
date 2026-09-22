/**
 * ETF-EPT-iNat-2025 Main Application Controller
 * Orchestrates views, state synchronization, filters, modals, and tab switching
 */

import { DataService } from './dataService.js';
import { FilterService } from './filterService.js';
import { CardsRenderer } from './cardsRenderer.js';
import { PaginationService } from './paginationService.js';
import { ModalManager } from './modalManager.js';
import { ContributorService } from './contributorService.js';

class App {
  constructor() {
    this.activeTab = 'curated';
    this.dataService = new DataService();
    this.modalManager = new ModalManager();

    // Curated tab state
    this.curatedFilter = new FilterService();
    this.curatedPagination = new PaginationService(() => this.renderCuratedView());

    // Excluded tab state
    this.excludedFilter = new FilterService();
    this.excludedPagination = new PaginationService(() => this.renderExcludedView());

    // Cards renderer
    this.cardsRenderer = new CardsRenderer((obs, isExcluded) => {
      this.modalManager.show(obs, isExcluded);
    });

    // Contributor service
    this.contributorService = new ContributorService(this.dataService, (userId) => {
      this.filterCuratedByObserver(userId);
    });

    this.init();
  }

  async init() {
    this.initTheme();
    this.initTabs();
    this.initCuratedControls();
    this.initExcludedControls();

    // Show initial loading state in curated grid
    const curatedGrid = document.getElementById('curated-cards-grid');
    if (curatedGrid) {
      curatedGrid.innerHTML = `
        <div class="loading-indicator" style="grid-column: 1 / -1;">
          <div class="spinner"></div>
          <p>Loading curated observations...</p>
        </div>
      `;
    }

    // Load initial metadata and sample
    const { metadata } = await this.dataService.loadInitialData();
    if (metadata) {
      this.updateStatsTicker(metadata);
      this.populateFilterDropdowns(metadata);
    }

    // Render initial curated sample view
    this.renderCuratedView();

    // When full 78k dataset arrives in background
    this.dataService.onFullDataLoaded((fullObs) => {
      const liveBadge = document.getElementById('data-loading-status');
      if (liveBadge) {
        liveBadge.innerHTML = `
          <span style="color:var(--color-success); font-weight:600;">● Live (${fullObs.length.toLocaleString()} observations loaded)</span>
        `;
      }
      this.renderCuratedView();
    });

    // Preload excluded observations & contributors
    this.dataService.loadExcludedObservations();
    this.dataService.loadContributorsData();
  }

  /* -----------------------------------------------------------
     Theme Toggle (Dark / Light)
     ----------------------------------------------------------- */
  initTheme() {
    const toggleBtn = document.getElementById('btn-theme-toggle');
    const savedTheme = localStorage.getItem('etf_ept_theme') ||
      (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');

    document.documentElement.setAttribute('data-theme', savedTheme);

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const cur = document.documentElement.getAttribute('data-theme');
        const next = cur === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('etf_ept_theme', next);
      });
    }
  }

  /* -----------------------------------------------------------
     Tab Switching
     ----------------------------------------------------------- */
  initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        this.switchTab(targetTab);
      });
    });
  }

  switchTab(tabId) {
    this.activeTab = tabId;

    // Update buttons
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tab') === tabId);
    });

    // Update panes
    document.querySelectorAll('.tab-pane').forEach(p => {
      p.classList.toggle('active', p.id === `tab-pane-${tabId}`);
    });

    // Trigger tab-specific render
    if (tabId === 'curated') {
      this.renderCuratedView();
    } else if (tabId === 'excluded') {
      this.renderExcludedView();
    }
  }

  filterCuratedByObserver(userId) {
    this.switchTab('curated');
    const searchCol = document.getElementById('curated-search-column');
    const searchInput = document.getElementById('curated-search-input');
    if (searchCol) searchCol.value = 'observer_id';
    if (searchInput) searchInput.value = String(userId);

    this.curatedFilter.setSearch(String(userId), 'observer_id');
    this.curatedPagination.currentPage = 1;
    this.renderCuratedView();
  }

  /* -----------------------------------------------------------
     Live Stats Bar
     ----------------------------------------------------------- */
  updateStatsTicker(meta) {
    const countCurated = document.getElementById('stat-curated-count');
    const countEphem = document.getElementById('stat-ephem-count');
    const countPlecop = document.getElementById('stat-plecop-count');
    const countTrichop = document.getElementById('stat-trichop-count');
    const countExcluded = document.getElementById('stat-excluded-count');
    const tabCuratedCount = document.getElementById('tab-curated-count');

    if (countCurated) countCurated.textContent = (meta.totalObservations || 78259).toLocaleString();
    if (tabCuratedCount) tabCuratedCount.textContent = (meta.totalObservations || 78259).toLocaleString();

    const byOrder = meta.counts?.byOrder || {};
    if (countEphem) countEphem.textContent = (byOrder.Ephemeroptera || 0).toLocaleString();
    if (countPlecop) countPlecop.textContent = (byOrder.Plecoptera || 0).toLocaleString();
    if (countTrichop) countTrichop.textContent = (byOrder.Trichoptera || 0).toLocaleString();

    if (countExcluded) countExcluded.textContent = '371';
  }

  populateFilterDropdowns(meta) {
    const byOrder = meta.counts?.byOrder || {};
    const byStage = meta.counts?.byStage || {};
    const byTech = meta.counts?.byTechnique || {};
    const byEvidence = meta.counts?.byEvidence || {};

    const fillSelect = (elId, countsMap) => {
      const select = document.getElementById(elId);
      if (!select) return;
      for (const [key, count] of Object.entries(countsMap)) {
        if (!key || key === 'NA') continue;
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = `${key} (${count.toLocaleString()})`;
        select.appendChild(opt);
      }
    };

    fillSelect('curated-filter-order', byOrder);
    fillSelect('curated-filter-stage', byStage);
    fillSelect('curated-filter-technique', byTech);
    fillSelect('curated-filter-evidence', byEvidence);
  }

  /* -----------------------------------------------------------
     Curated View Controls & Rendering
     ----------------------------------------------------------- */
  initCuratedControls() {
    const searchInput = document.getElementById('curated-search-input');
    const searchCol = document.getElementById('curated-search-column');
    const filterOrder = document.getElementById('curated-filter-order');
    const filterStage = document.getElementById('curated-filter-stage');
    const filterTech = document.getElementById('curated-filter-technique');
    const filterEvidence = document.getElementById('curated-filter-evidence');
    const filterQuality = document.getElementById('curated-filter-quality');
    const groupBy = document.getElementById('curated-group-by');
    const sortBy = document.getElementById('curated-sort-by');
    const resetBtn = document.getElementById('curated-reset-btn');

    // Debounced search
    let timer = null;
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          this.curatedFilter.setSearch(searchInput.value, searchCol ? searchCol.value : 'all');
          this.curatedPagination.currentPage = 1;
          this.renderCuratedView();
        }, 250);
      });
    }

    if (searchCol) {
      searchCol.addEventListener('change', () => {
        if (searchInput && searchInput.value) {
          this.curatedFilter.setSearch(searchInput.value, searchCol.value);
          this.curatedPagination.currentPage = 1;
          this.renderCuratedView();
        }
      });
    }

    // Dropdown filters
    const bindSelect = (el, key) => {
      if (!el) return;
      el.addEventListener('change', () => {
        this.curatedFilter.setFilter(key, el.value);
        this.curatedPagination.currentPage = 1;
        this.renderCuratedView();
      });
    };

    bindSelect(filterOrder, 'taxon_order_id');
    bindSelect(filterStage, 'life_stage');
    bindSelect(filterTech, 'collection_technique');
    bindSelect(filterEvidence, 'evidence_type');
    bindSelect(filterQuality, 'quality_grade');

    // Boolean toggles
    const bindToggle = (elId, key) => {
      const chip = document.getElementById(elId);
      if (!chip) return;
      chip.addEventListener('click', () => {
        chip.classList.toggle('active');
        const isActive = chip.classList.contains('active');
        this.curatedFilter.setFilter(key, isActive);
        this.curatedPagination.currentPage = 1;
        this.renderCuratedView();
      });
    };

    bindToggle('toggle-fave', 'fave_image');
    bindToggle('toggle-human', 'human_present');
    bindToggle('toggle-specimens', 'multiple_specimen_present');
    bindToggle('toggle-preserved', 'preserved_specimen');
    bindToggle('toggle-interactions', 'has_interaction');

    // Group By
    if (groupBy) {
      groupBy.addEventListener('change', () => {
        this.curatedFilter.groupByColumn = groupBy.value;
        this.renderCuratedView();
      });
    }

    // Sort By
    if (sortBy) {
      sortBy.addEventListener('change', () => {
        this.curatedFilter.sortBy = sortBy.value;
        this.renderCuratedView();
      });
    }

    // Reset button
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.curatedFilter.resetFilters();
        if (searchInput) searchInput.value = '';
        if (searchCol) searchCol.value = 'all';
        if (filterOrder) filterOrder.value = '';
        if (filterStage) filterStage.value = '';
        if (filterTech) filterTech.value = '';
        if (filterEvidence) filterEvidence.value = '';
        if (filterQuality) filterQuality.value = '';
        if (groupBy) groupBy.value = 'none';
        document.querySelectorAll('#curated-controls .toggle-chip').forEach(c => c.classList.remove('active'));
        this.curatedPagination.currentPage = 1;
        this.renderCuratedView();
      });
    }
  }

  renderCuratedView() {
    const grid = document.getElementById('curated-cards-grid');
    const paginationEl = document.getElementById('curated-pagination');
    const countEl = document.getElementById('curated-results-count');
    if (!grid) return;

    const data = this.dataService.curatedObservations;
    const filterResult = this.curatedFilter.apply(data);

    if (countEl) {
      countEl.innerHTML = `Showing <strong>${filterResult.total.toLocaleString()}</strong> of <strong>${data.length.toLocaleString()}</strong> observations`;
    }

    grid.innerHTML = '';

    if (filterResult.total === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <h3>No matching observations</h3>
          <p>Try adjusting your search criteria or resetting filters.</p>
        </div>
      `;
      if (paginationEl) paginationEl.innerHTML = '';
      return;
    }

    // If grouped
    if (filterResult.isGrouped) {
      if (paginationEl) paginationEl.innerHTML = '';
      const groupedNode = this.cardsRenderer.renderGrouped(filterResult.groups, false);
      grid.appendChild(groupedNode);
      return;
    }

    // Paginated grid
    const pageSlice = this.curatedPagination.getPageSlice(filterResult.items);
    pageSlice.items.forEach(obs => {
      const card = this.cardsRenderer.renderCuratedCard(obs);
      grid.appendChild(card);
    });

    this.curatedPagination.renderControls(paginationEl);
  }

  /* -----------------------------------------------------------
     Excluded View Controls & Rendering
     ----------------------------------------------------------- */
  async initExcludedControls() {
    const searchInput = document.getElementById('excluded-search-input');
    const filterOrder = document.getElementById('excluded-filter-order');
    const filterIssue = document.getElementById('excluded-filter-issue');
    const groupBy = document.getElementById('excluded-group-by');
    const resetBtn = document.getElementById('excluded-reset-btn');

    let timer = null;
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          this.excludedFilter.setSearch(searchInput.value, 'all');
          this.excludedPagination.currentPage = 1;
          this.renderExcludedView();
        }, 250);
      });
    }

    if (filterOrder) {
      filterOrder.addEventListener('change', () => {
        this.excludedFilter.setFilter('taxon_order_id', filterOrder.value);
        this.excludedPagination.currentPage = 1;
        this.renderExcludedView();
      });
    }

    if (filterIssue) {
      filterIssue.addEventListener('change', () => {
        this.excludedFilter.setFilter('obs_issues', filterIssue.value);
        this.excludedPagination.currentPage = 1;
        this.renderExcludedView();
      });
    }

    if (groupBy) {
      groupBy.addEventListener('change', () => {
        this.excludedFilter.groupByColumn = groupBy.value;
        this.renderExcludedView();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.excludedFilter.resetFilters();
        if (searchInput) searchInput.value = '';
        if (filterOrder) filterOrder.value = '';
        if (filterIssue) filterIssue.value = '';
        if (groupBy) groupBy.value = 'none';
        this.excludedPagination.currentPage = 1;
        this.renderExcludedView();
      });
    }
  }

  async renderExcludedView() {
    const grid = document.getElementById('excluded-cards-grid');
    const paginationEl = document.getElementById('excluded-pagination');
    const countEl = document.getElementById('excluded-results-count');
    if (!grid) return;

    const data = await this.dataService.loadExcludedObservations();
    const filterResult = this.excludedFilter.apply(data);

    if (countEl) {
      countEl.innerHTML = `Showing <strong>${filterResult.total}</strong> of <strong>${data.length}</strong> excluded observations`;
    }

    grid.innerHTML = '';

    if (filterResult.total === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <h3>No matching excluded observations</h3>
          <p>Try resetting filters or changing search keywords.</p>
        </div>
      `;
      if (paginationEl) paginationEl.innerHTML = '';
      return;
    }

    if (filterResult.isGrouped) {
      if (paginationEl) paginationEl.innerHTML = '';
      const groupedNode = this.cardsRenderer.renderGrouped(filterResult.groups, true);
      grid.appendChild(groupedNode);
      return;
    }

    const pageSlice = this.excludedPagination.getPageSlice(filterResult.items);
    pageSlice.items.forEach(obs => {
      const card = this.cardsRenderer.renderExcludedCard(obs);
      grid.appendChild(card);
    });

    this.excludedPagination.renderControls(paginationEl);
  }
}

// Bootstrap on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  window.etfApp = new App();
});
