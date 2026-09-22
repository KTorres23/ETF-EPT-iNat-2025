/**
 * ETF-EPT-iNat-2025 Data Service
 * Handles loading optimized datasets with instant preview and progressive background hydration.
 */

export class DataService {
  constructor() {
    this.metadata = null;
    this.curatedObservations = [];
    this.excludedObservations = [];
    this.contributorsData = null;
    this.isFullDataLoaded = false;
    this.loadingPromise = null;
    this.onFullDataLoadedCallbacks = [];
  }

  // Register callback for when full 78k dataset finishes loading in the background
  onFullDataLoaded(fn) {
    if (this.isFullDataLoaded) {
      fn(this.curatedObservations);
    } else {
      this.onFullDataLoadedCallbacks.push(fn);
    }
  }

  // Transform raw array format to friendly object
  mapObservationRow(row) {
    // Flag bitmask
    const flg = row[14] || 0;
    const photoId = row[15] || '';
    
    // S3 thumbnail image URL or fallback
    let imageUrl = '';
    if (photoId) {
      if (photoId.startsWith('http')) {
        imageUrl = photoId;
      } else {
        imageUrl = `https://inaturalist-open-data.s3.amazonaws.com/photos/${photoId}/small.jpg`;
      }
    }

    return {
      observation_id: row[0],
      taxon_order_id: row[1],
      life_stage: row[2],
      evidence_type: row[3],
      collection_technique: row[4],
      fave_image: row[5] === 1,
      quality_grade: row[6],
      observed_date: row[7],
      lat: row[8],
      long: row[9],
      positional_accuracy: row[10],
      observer_id: row[11],
      license_code: row[12],
      odd_cases: row[13],
      flags: {
        multiple_specimen_present: (flg & 1) !== 0,
        human_present: (flg & 2) !== 0,
        preserved_specimen: (flg & 4) !== 0,
        interaction_predation: (flg & 8) !== 0,
        interaction_flower: (flg & 16) !== 0,
        interaction_reproduction: (flg & 32) !== 0,
        interaction_fungus_parasitism: (flg & 64) !== 0,
      },
      image_url: imageUrl,
      inaturalist_url: `https://www.inaturalist.org/observations/${row[0]}`
    };
  }

  async loadInitialData() {
    try {
      // Step 1: Load metadata and instant sample in parallel
      const [metaRes, sampleRes] = await Promise.all([
        fetch('data/curated_metadata.json'),
        fetch('data/curated_sample.json')
      ]);

      if (metaRes.ok) {
        this.metadata = await metaRes.json();
      }

      if (sampleRes.ok) {
        const sampleRows = await sampleRes.json();
        this.curatedObservations = sampleRows.map(r => this.mapObservationRow(r));
      }

      // Step 2: Trigger progressive background loading of full dataset
      this.loadFullDatasetInBackground();

      return {
        metadata: this.metadata,
        observations: this.curatedObservations
      };
    } catch (err) {
      console.error('Error loading initial data:', err);
      return { metadata: null, observations: [] };
    }
  }

  async loadFullDatasetInBackground() {
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = (async () => {
      try {
        console.time('Full dataset download and parse');
        const res = await fetch('data/curated_observations.json');
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        
        const fullRows = await res.json();
        this.curatedObservations = fullRows.map(r => this.mapObservationRow(r));
        this.isFullDataLoaded = true;
        console.timeEnd('Full dataset download and parse');
        console.log(`Loaded ${this.curatedObservations.length} curated observations.`);

        // Notify listeners
        this.onFullDataLoadedCallbacks.forEach(fn => fn(this.curatedObservations));
      } catch (err) {
        console.warn('Failed loading full curated observations JSON:', err);
      }
    })();

    return this.loadingPromise;
  }

  async loadExcludedObservations() {
    if (this.excludedObservations.length > 0) {
      return this.excludedObservations;
    }
    try {
      const res = await fetch('data/excluded_observations.json');
      if (res.ok) {
        this.excludedObservations = await res.json();
      }
    } catch (err) {
      console.error('Failed loading excluded observations:', err);
    }
    return this.excludedObservations;
  }

  async loadContributorsData() {
    if (this.contributorsData) {
      return this.contributorsData;
    }
    try {
      const res = await fetch('data/contributors_index.json');
      if (res.ok) {
        this.contributorsData = await res.json();
      }
    } catch (err) {
      console.error('Failed loading contributors index:', err);
    }
    return this.contributorsData;
  }

  getContributorStats(userId) {
    if (!this.contributorsData || !this.contributorsData.contributors) {
      return null;
    }
    const uidStr = String(userId).trim();
    const stats = this.contributorsData.contributors[uidStr];
    if (!stats) return null;
    return {
      userId: uidStr,
      observations: stats[0] || 0,
      identifications: stats[1] || 0,
      annotations: stats[2] || 0,
      total: (stats[0] || 0) + (stats[1] || 0) + (stats[2] || 0)
    };
  }
}
