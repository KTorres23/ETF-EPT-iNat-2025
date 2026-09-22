/**
 * ETF-EPT-iNat-2025 Modal Manager
 * Displays full 23-column metadata for an observation with high-res image and iNaturalist link
 */

export class ModalManager {
  constructor() {
    this.backdropEl = null;
    this.init();
  }

  init() {
    this.backdropEl = document.createElement('div');
    this.backdropEl.className = 'modal-backdrop';
    this.backdropEl.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-header">
          <div class="modal-header-info">
            <h3 id="modal-title">Observation Details</h3>
          </div>
          <button class="btn-icon modal-close-btn" aria-label="Close modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body" id="modal-body-content"></div>
        <div class="modal-footer">
          <button class="btn-icon" id="modal-copy-id" title="Copy Observation ID">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
          <a href="#" target="_blank" rel="noopener noreferrer" class="btn-primary" id="modal-inat-link">
            <span>View on iNaturalist</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
        </div>
      </div>
    `;

    document.body.appendChild(this.backdropEl);

    // Close listeners
    this.backdropEl.querySelector('.modal-close-btn').addEventListener('click', () => this.close());
    this.backdropEl.addEventListener('click', (e) => {
      if (e.target === this.backdropEl) this.close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    });

    // Copy ID listener
    this.backdropEl.querySelector('#modal-copy-id').addEventListener('click', () => {
      if (this.currentObs) {
        navigator.clipboard.writeText(String(this.currentObs.observation_id));
        alert(`Copied Observation #${this.currentObs.observation_id} to clipboard!`);
      }
    });
  }

  show(obs, isExcluded = false) {
    this.currentObs = obs;
    const body = this.backdropEl.querySelector('#modal-body-content');
    const title = this.backdropEl.querySelector('#modal-title');
    const inatLink = this.backdropEl.querySelector('#modal-inat-link');

    const inatUrl = obs.inaturalist_url || `https://www.inaturalist.org/observations/${obs.observation_id}`;
    inatLink.href = inatUrl;

    title.innerHTML = `
      <span class="order-pill ${obs.taxon_order_id}">${obs.taxon_order_id}</span>
      <span>#${obs.observation_id}</span>
    `;

    // High res photo banner
    // Replace /small.jpg with /medium.jpg if available
    let fullImgUrl = obs.image_url || '';
    if (fullImgUrl.includes('/small.jpg')) {
      fullImgUrl = fullImgUrl.replace('/small.jpg', '/medium.jpg');
    }

    const photoBannerHtml = fullImgUrl
      ? `
        <div class="modal-photo-banner">
          <img src="${fullImgUrl}" alt="Observation #${obs.observation_id}" loading="eager" />
        </div>
      `
      : '';

    // Geospatial map coordinates link
    const hasCoords = obs.lat && obs.long;
    const mapLinkHtml = hasCoords
      ? `<a href="https://www.google.com/maps?q=${obs.lat},${obs.long}" target="_blank" rel="noopener noreferrer" style="color:var(--accent-sky); text-decoration:underline;">${obs.lat}, ${obs.long} ↗</a>`
      : 'Not available';

    // Flags formatting
    const flagsObj = obs.flags || {};
    const interactionList = [];
    if (flagsObj.interaction_predation) interactionList.push('Predation');
    if (flagsObj.interaction_flower) interactionList.push('Flower');
    if (flagsObj.interaction_reproduction) interactionList.push('Reproduction');
    if (flagsObj.interaction_fungus_parasitism) interactionList.push('Fungus Parasitism');
    const interactionsStr = interactionList.length > 0 ? interactionList.join(', ') : 'None documented';

    body.innerHTML = `
      ${photoBannerHtml}

      <div class="modal-grid-sections">
        <!-- 1. Taxonomy & Quality -->
        <div class="modal-card-section">
          <h4>🏷️ Taxonomy & Status</h4>
          <table class="modal-data-table">
            <tr><td>Taxon Order:</td><td><strong>${obs.taxon_order_id}</strong></td></tr>
            <tr><td>Observation ID:</td><td><code>${obs.observation_id}</code></td></tr>
            <tr><td>Quality Grade:</td><td><span class="quality-badge ${(obs.quality_grade || '').toLowerCase().includes('research') ? 'research' : 'needs_id'}">${obs.quality_grade || 'N/A'}</span></td></tr>
            <tr><td>Observed Date:</td><td>${obs.observed_date || 'N/A'}</td></tr>
          </table>
        </div>

        <!-- 2. Biological Annotations -->
        <div class="modal-card-section">
          <h4>🔬 Biological Annotations</h4>
          <table class="modal-data-table">
            <tr><td>Life Stage:</td><td><strong>${obs.life_stage || 'N/A'}</strong></td></tr>
            <tr><td>Evidence Type:</td><td>${obs.evidence_type || 'N/A'}</td></tr>
            <tr><td>Technique:</td><td>${obs.collection_technique || 'No technique'}</td></tr>
            <tr><td>Multiple Specimen:</td><td>${flagsObj.multiple_specimen_present ? 'Yes (TRUE)' : 'No (FALSE)'}</td></tr>
            <tr><td>Human Present:</td><td>${flagsObj.human_present ? 'Yes (TRUE)' : 'No (FALSE)'}</td></tr>
            <tr><td>Preserved:</td><td>${flagsObj.preserved_specimen ? 'Yes (TRUE)' : 'No (FALSE)'}</td></tr>
          </table>
        </div>

        <!-- 3. Ecological & Notes -->
        <div class="modal-card-section">
          <h4>🤝 Interactions & Notes</h4>
          <table class="modal-data-table">
            <tr><td>Interactions:</td><td>${interactionsStr}</td></tr>
            <tr><td>Favorite Image:</td><td>${obs.fave_image ? '⭐ Yes (Curator Pick)' : 'No'}</td></tr>
            <tr><td>Curator Notes:</td><td>${obs.odd_cases ? `<em>${obs.odd_cases}</em>` : 'None'}</td></tr>
            ${isExcluded ? `
              <tr><td>QC Issue:</td><td><strong style="color:var(--color-error);">${obs.obs_issues || 'N/A'}</strong></td></tr>
              <tr><td>Corrected ID:</td><td><strong>${obs.order_id_corrected || 'N/A'}</strong></td></tr>
            ` : ''}
          </table>
        </div>

        <!-- 4. Geospatial & Provenance -->
        <div class="modal-card-section">
          <h4>📍 Location & Provenance</h4>
          <table class="modal-data-table">
            <tr><td>Coordinates:</td><td>${mapLinkHtml}</td></tr>
            <tr><td>Accuracy:</td><td>${obs.positional_accuracy ? `${obs.positional_accuracy} m` : 'N/A'}</td></tr>
            <tr><td>Observer ID:</td><td><code>${obs.observer_id || 'N/A'}</code></td></tr>
            <tr><td>License:</td><td>${obs.license_code || 'N/A'}</td></tr>
            ${obs.uuid ? `<tr><td>UUID:</td><td><code style="font-size:0.75rem;">${obs.uuid}</code></td></tr>` : ''}
          </table>
        </div>
      </div>
    `;

    this.backdropEl.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.backdropEl.classList.remove('active');
    document.body.style.overflow = '';
  }
}
