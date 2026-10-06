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
import { MapManager } from './mapManager.js?v=2';

class App {
  constructor() {
    this.activeTab = 'curated';
    this.currentCuratedViewMode = 'cards'; // 'cards' or 'map'
    this.dataService = new DataService();
    this.modalManager = new ModalManager();

    // Map Manager
    this.mapManager = new MapManager('curated-map-container', (obs) => {
      this.modalManager.show(obs, false);
    });

    this.modalManager.onLocateOnMap = (obs) => {
      this.switchTab('map');
      this.mapManager.locateObservation(obs);
    };

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
      const tabMapCount = document.getElementById('tab-map-count');
      if (tabMapCount) tabMapCount.textContent = fullObs.length.toLocaleString();
      const btnMapBadge = document.getElementById('btn-map-badge');
      if (btnMapBadge) btnMapBadge.textContent = fullObs.length.toLocaleString();

      if (this.currentCuratedViewMode === 'map') {
        const filterResult = this.curatedFilter.apply(fullObs);
        this.mapManager.updateObservations(filterResult.items);
      } else {
        this.renderCuratedView();
      }
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
        if (this.mapManager) {
          this.mapManager.handleThemeChange(next);
        }
      });
    }
  }

  /* -----------------------------------------------------------
     Tab Switching & Navigation Accessibility
     ----------------------------------------------------------- */
  initTabs() {
    const tabButtons = Array.from(document.querySelectorAll('.tab-btn'));
    const navInner = document.querySelector('.tabs-nav-inner');
    const scrollWrapper = document.getElementById('tabs-scroll-wrapper');
    const scrollLeftBtn = document.getElementById('tabs-scroll-left');
    const scrollRightBtn = document.getElementById('tabs-scroll-right');

    // Dynamically calculate header height for sticky positioning
    const updateHeaderOffset = () => {
      const header = document.querySelector('.app-header');
      if (header) {
        document.documentElement.style.setProperty('--header-actual-height', `${header.offsetHeight}px`);
      }
    };
    window.addEventListener('resize', updateHeaderOffset, { passive: true });
    updateHeaderOffset();

    // Horizontal overflow scroll indicators & buttons
    const updateScrollIndicators = () => {
      if (!navInner) return;
      const maxScroll = navInner.scrollWidth - navInner.clientWidth;
      const hasOverflow = maxScroll > 4;

      if (!hasOverflow) {
        if (scrollLeftBtn) scrollLeftBtn.classList.remove('visible');
        if (scrollRightBtn) scrollRightBtn.classList.remove('visible');
        if (scrollWrapper) {
          scrollWrapper.classList.remove('can-scroll-left', 'can-scroll-right');
        }
      } else {
        const canLeft = navInner.scrollLeft > 6;
        const canRight = navInner.scrollLeft < maxScroll - 6;

        if (scrollLeftBtn) scrollLeftBtn.classList.toggle('visible', canLeft);
        if (scrollRightBtn) scrollRightBtn.classList.toggle('visible', canRight);
        if (scrollWrapper) {
          scrollWrapper.classList.toggle('can-scroll-left', canLeft);
          scrollWrapper.classList.toggle('can-scroll-right', canRight);
        }
      }
    };

    if (navInner) {
      navInner.addEventListener('scroll', updateScrollIndicators, { passive: true });
      window.addEventListener('resize', updateScrollIndicators, { passive: true });
      // Call after fonts and layout settle
      setTimeout(updateScrollIndicators, 200);
    }

    if (scrollLeftBtn && navInner) {
      scrollLeftBtn.addEventListener('click', () => {
        navInner.scrollBy({ left: -220, behavior: 'smooth' });
      });
    }

    if (scrollRightBtn && navInner) {
      scrollRightBtn.addEventListener('click', () => {
        navInner.scrollBy({ left: 220, behavior: 'smooth' });
      });
    }

    // Keyboard navigation and click handling (WAI-ARIA Tablist Pattern)
    tabButtons.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        this.switchTab(targetTab);
        btn.focus();
      });

      btn.addEventListener('keydown', (e) => {
        let targetIndex = -1;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          targetIndex = (index + 1) % tabButtons.length;
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          targetIndex = (index - 1 + tabButtons.length) % tabButtons.length;
        } else if (e.key === 'Home') {
          e.preventDefault();
          targetIndex = 0;
        } else if (e.key === 'End') {
          e.preventDefault();
          targetIndex = tabButtons.length - 1;
        }

        if (targetIndex !== -1) {
          const nextBtn = tabButtons[targetIndex];
          nextBtn.focus();
          const nextTab = nextBtn.getAttribute('data-tab');
          this.switchTab(nextTab);
        }
      });
    });
  }

  updateTabButtons(activeTabId) {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
      const isMatch = btn.getAttribute('data-tab') === activeTabId;
      btn.classList.toggle('active', isMatch);
      btn.setAttribute('aria-selected', isMatch ? 'true' : 'false');
      btn.setAttribute('tabindex', isMatch ? '0' : '-1');

      if (isMatch) {
        // Smoothly bring active tab into view for narrow/mobile screens
        btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    });
  }

  switchTab(tabId) {
    this.activeTab = tabId;

    if (tabId === 'map') {
      this.updateTabButtons('map');
      document.querySelectorAll('.tab-pane').forEach(p => {
        const isCurated = p.id === 'tab-pane-curated';
        p.classList.toggle('active', isCurated);
        if (isCurated) p.setAttribute('aria-labelledby', 'tab-nav-map');
      });
      this.setCuratedViewMode('map');
      return;
    }

    if (tabId === 'curated') {
      this.updateTabButtons('curated');
      document.querySelectorAll('.tab-pane').forEach(p => {
        const isCurated = p.id === 'tab-pane-curated';
        p.classList.toggle('active', isCurated);
        if (isCurated) p.setAttribute('aria-labelledby', 'tab-nav-curated');
      });
      this.setCuratedViewMode('cards');
      return;
    }

    // Other tabs: excluded, contributors, about
    this.updateTabButtons(tabId);
    document.querySelectorAll('.tab-pane').forEach(p => {
      const isMatch = p.id === `tab-pane-${tabId}`;
      p.classList.toggle('active', isMatch);
      if (isMatch) p.setAttribute('aria-labelledby', `tab-nav-${tabId}`);
    });

    if (tabId === 'excluded') {
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

    // Visualize on map button
    const mapBtn = document.getElementById('curated-btn-map');
    if (mapBtn) {
      mapBtn.addEventListener('click', () => {
        this.setCuratedViewMode('map');
        const mapEl = document.getElementById('curated-map-view');
        if (mapEl) mapEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    // View Switcher buttons
    const btnViewCards = document.getElementById('btn-view-cards');
    const btnViewMap = document.getElementById('btn-view-map');
    if (btnViewCards) {
      btnViewCards.addEventListener('click', () => {
        this.setCuratedViewMode('cards');
      });
    }
    if (btnViewMap) {
      btnViewMap.addEventListener('click', () => {
        this.setCuratedViewMode('map');
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
        document.querySelectorAll('.map-order-toggle').forEach(c => c.classList.add('active'));
        if (this.mapManager) {
          this.mapManager.activeOrderFilters = { Ephemeroptera: true, Plecoptera: true, Trichoptera: true };
        }
        this.curatedPagination.currentPage = 1;
        this.renderCuratedView();
      });
    }
  }

  setCuratedViewMode(mode) {
    this.currentCuratedViewMode = mode;
    const cardsGrid = document.getElementById('curated-cards-grid');
    const pagination = document.getElementById('curated-pagination');
    const mapView = document.getElementById('curated-map-view');
    const btnCards = document.getElementById('btn-view-cards');
    const btnMap = document.getElementById('btn-view-map');

    if (mode === 'map') {
      if (cardsGrid) cardsGrid.style.display = 'none';
      if (pagination) pagination.style.display = 'none';
      if (mapView) mapView.style.display = 'flex';
      if (btnCards) btnCards.classList.remove('active');
      if (btnMap) btnMap.classList.add('active');

      if (this.activeTab === 'curated' || this.activeTab === 'map') {
        this.activeTab = 'map';
        this.updateTabButtons('map');
        const curatedPane = document.getElementById('tab-pane-curated');
        if (curatedPane) curatedPane.setAttribute('aria-labelledby', 'tab-nav-map');
      }

      const filterResult = this.curatedFilter.apply(this.dataService.curatedObservations);
      this.mapManager.updateObservations(filterResult.items);
      setTimeout(() => {
        if (this.mapManager.map) {
          this.mapManager.map.invalidateSize();
        }
      }, 150);
    } else {
      if (cardsGrid) cardsGrid.style.display = 'grid';
      if (pagination) pagination.style.display = 'flex';
      if (mapView) mapView.style.display = 'none';
      if (btnCards) btnCards.classList.add('active');
      if (btnMap) btnMap.classList.remove('active');

      if (this.activeTab === 'curated' || this.activeTab === 'map') {
        this.activeTab = 'curated';
        this.updateTabButtons('curated');
        const curatedPane = document.getElementById('tab-pane-curated');
        if (curatedPane) curatedPane.setAttribute('aria-labelledby', 'tab-nav-curated');
      }

      this.renderCuratedView();
    }
  }

  renderCuratedView() {
    const grid = document.getElementById('curated-cards-grid');
    const paginationEl = document.getElementById('curated-pagination');
    const countEl = document.getElementById('curated-results-count');
    const mapBadge = document.getElementById('btn-map-badge');
    if (!grid) return;

    const data = this.dataService.curatedObservations;
    const filterResult = this.curatedFilter.apply(data);

    if (countEl) {
      countEl.innerHTML = `Showing <strong>${filterResult.total.toLocaleString()}</strong> of <strong>${data.length.toLocaleString()}</strong> observations`;
    }

    if (mapBadge) {
      mapBadge.textContent = filterResult.total.toLocaleString();
    }

    // If currently in map view, update map and return
    if (this.currentCuratedViewMode === 'map') {
      this.mapManager.updateObservations(filterResult.items);
      return;
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
