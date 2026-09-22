/**
 * ETF-EPT-iNat-2025 Filter & Group Service
 * Performs fast in-memory searching, faceted filtering, and grouping
 */

export class FilterService {
  constructor() {
    this.searchQuery = '';
    this.searchColumn = 'all'; // 'all', 'observation_id', 'observer_id', 'odd_cases'
    this.filters = {
      taxon_order_id: '',
      life_stage: '',
      evidence_type: '',
      collection_technique: '',
      quality_grade: '',
      fave_image: false,
      human_present: false,
      multiple_specimen_present: false,
      preserved_specimen: false,
      has_interaction: false,
      // For excluded observations
      obs_issues: '',
      order_id_corrected: ''
    };
    this.groupByColumn = 'none'; // 'none', 'taxon_order_id', 'life_stage', 'collection_technique', 'quality_grade'
    this.sortBy = 'id_desc'; // 'id_desc', 'id_asc', 'date_desc', 'date_asc'
  }

  setSearch(query, column = 'all') {
    this.searchQuery = (query || '').trim().toLowerCase();
    this.searchColumn = column;
  }

  setFilter(key, value) {
    if (key in this.filters) {
      this.filters[key] = value;
    }
  }

  resetFilters() {
    this.searchQuery = '';
    this.searchColumn = 'all';
    this.filters = {
      taxon_order_id: '',
      life_stage: '',
      evidence_type: '',
      collection_technique: '',
      quality_grade: '',
      fave_image: false,
      human_present: false,
      multiple_specimen_present: false,
      preserved_specimen: false,
      has_interaction: false,
      obs_issues: '',
      order_id_corrected: ''
    };
    this.groupByColumn = 'none';
  }

  hasActiveFilters() {
    if (this.searchQuery !== '') return true;
    for (const [k, v] of Object.entries(this.filters)) {
      if (typeof v === 'boolean' && v === true) return true;
      if (typeof v === 'string' && v !== '') return true;
    }
    return false;
  }

  apply(items) {
    const q = this.searchQuery;
    const col = this.searchColumn;

    // Filter items
    const filtered = items.filter(item => {
      // 1. Search Query
      if (q) {
        if (col === 'observation_id') {
          if (!String(item.observation_id).includes(q)) return false;
        } else if (col === 'observer_id') {
          if (!String(item.observer_id || '').includes(q)) return false;
        } else if (col === 'odd_cases') {
          if (!String(item.odd_cases || '').toLowerCase().includes(q)) return false;
        } else {
          // Global search
          const idStr = String(item.observation_id);
          const userStr = String(item.observer_id || '');
          const orderStr = (item.taxon_order_id || '').toLowerCase();
          const notesStr = (item.odd_cases || '').toLowerCase();
          const issuesStr = (item.obs_issues || '').toLowerCase();
          if (
            !idStr.includes(q) &&
            !userStr.includes(q) &&
            !orderStr.includes(q) &&
            !notesStr.includes(q) &&
            !issuesStr.includes(q)
          ) {
            return false;
          }
        }
      }

      // 2. Facet dropdowns
      if (this.filters.taxon_order_id && item.taxon_order_id !== this.filters.taxon_order_id) {
        return false;
      }
      if (this.filters.life_stage && item.life_stage !== this.filters.life_stage) {
        return false;
      }
      if (this.filters.evidence_type && item.evidence_type !== this.filters.evidence_type) {
        return false;
      }
      if (this.filters.collection_technique && item.collection_technique !== this.filters.collection_technique) {
        return false;
      }
      if (this.filters.quality_grade && item.quality_grade !== this.filters.quality_grade) {
        return false;
      }

      // Excluded specific facets
      if (this.filters.obs_issues && item.obs_issues !== this.filters.obs_issues) {
        return false;
      }
      if (this.filters.order_id_corrected && item.order_id_corrected !== this.filters.order_id_corrected) {
        return false;
      }

      // 3. Boolean flags
      if (this.filters.fave_image && !item.fave_image) return false;
      if (item.flags) {
        if (this.filters.human_present && !item.flags.human_present) return false;
        if (this.filters.multiple_specimen_present && !item.flags.multiple_specimen_present) return false;
        if (this.filters.preserved_specimen && !item.flags.preserved_specimen) return false;
        if (this.filters.has_interaction) {
          const hasAny = item.flags.interaction_predation ||
                         item.flags.interaction_flower ||
                         item.flags.interaction_reproduction ||
                         item.flags.interaction_fungus_parasitism;
          if (!hasAny) return false;
        }
      }

      return true;
    });

    // Sort items
    filtered.sort((a, b) => {
      if (this.sortBy === 'id_desc') return b.observation_id - a.observation_id;
      if (this.sortBy === 'id_asc') return a.observation_id - b.observation_id;
      if (this.sortBy === 'date_desc') return (b.observed_date || '').localeCompare(a.observed_date || '');
      if (this.sortBy === 'date_asc') return (a.observed_date || '').localeCompare(b.observed_date || '');
      return 0;
    });

    // Grouping
    if (this.groupByColumn !== 'none') {
      const groups = {};
      filtered.forEach(item => {
        let key = item[this.groupByColumn] || 'Unknown / None';
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
      });
      return { isGrouped: true, groups, total: filtered.length };
    }

    return { isGrouped: false, items: filtered, total: filtered.length };
  }
}
