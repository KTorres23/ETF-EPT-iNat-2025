/**
 * ETF-EPT-iNat-2025 Cards Renderer
 * Generates semantic, performant observation cards and group-by accordions
 */

export class CardsRenderer {
  constructor(onCardClick) {
    this.onCardClick = onCardClick;
  }

  getFallbackSvg(order) {
    return `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="m8 2 1.88 1.88"/>
        <path d="M14.12 3.88 16 2"/>
        <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/>
        <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/>
        <path d="M12 20v-9"/>
        <path d="M6.53 9C4.6 8.8 3 7.1 3 5"/>
        <path d="M6 13H2"/>
        <path d="M3 21c0-2.1 1.7-3.9 3.8-4"/>
        <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/>
        <path d="M22 13h-4"/>
        <path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/>
      </svg>
    `;
  }

  renderCuratedCard(obs) {
    const card = document.createElement('div');
    card.className = 'obs-card';
    card.setAttribute('data-id', obs.observation_id);

    const hasPhoto = !!obs.image_url;
    const mediaHtml = hasPhoto
      ? `<img class="card-img" src="${obs.image_url}" alt="Observation ${obs.observation_id}" loading="lazy" />
         <div class="img-fallback" style="display:none;">${this.getFallbackSvg(obs.taxon_order_id)}<span>${obs.taxon_order_id}</span></div>`
      : `<div class="img-fallback">${this.getFallbackSvg(obs.taxon_order_id)}<span>${obs.taxon_order_id}</span></div>`;

    const faveBadgeHtml = obs.fave_image 
      ? `<div class="fave-star-badge" title="Curator Favorite Image">
           <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
         </div>`
      : '';

    const qualityClass = (obs.quality_grade || '').toLowerCase().includes('research') ? 'research' : 'needs_id';
    const qualityLabel = (obs.quality_grade || '').replace('_', ' ');

    card.innerHTML = `
      <div class="card-media">
        ${mediaHtml}
        <div class="card-badges-overlay">
          <span class="order-pill ${obs.taxon_order_id}">${obs.taxon_order_id}</span>
          ${faveBadgeHtml}
        </div>
      </div>
      <div class="card-body">
        <div class="card-title-row">
          <span class="obs-id">#${obs.observation_id}</span>
          <span class="quality-badge ${qualityClass}">${qualityLabel}</span>
        </div>
        <div class="tags-row">
          <span class="annotation-tag highlight">${obs.life_stage || 'Unknown stage'}</span>
          ${obs.evidence_type ? `<span class="annotation-tag">${obs.evidence_type}</span>` : ''}
          ${obs.collection_technique && obs.collection_technique !== 'No technique' ? `<span class="annotation-tag">${obs.collection_technique}</span>` : ''}
        </div>
        <div class="card-meta-list">
          <div class="card-meta-row">
            <span>Observed:</span>
            <strong>${obs.observed_date || 'Unknown date'}</strong>
          </div>
          <div class="card-meta-row">
            <span>Observer ID:</span>
            <strong>${obs.observer_id || 'N/A'}</strong>
          </div>
        </div>
      </div>
    `;

    const imgEl = card.querySelector('.card-img');
    if (imgEl) {
      imgEl.addEventListener('error', () => {
        imgEl.style.display = 'none';
        const fallback = card.querySelector('.img-fallback');
        if (fallback) fallback.style.display = 'flex';
      });
    }

    card.addEventListener('click', () => {
      if (this.onCardClick) this.onCardClick(obs, false);
    });

    return card;
  }

  renderExcludedCard(obs) {
    const card = document.createElement('div');
    card.className = 'obs-card excluded-card';
    card.setAttribute('data-id', obs.observation_id);

    const hasPhoto = !!obs.image_url;
    const mediaHtml = hasPhoto
      ? `<img class="card-img" src="${obs.image_url}" alt="Observation ${obs.observation_id}" loading="lazy" />
         <div class="img-fallback" style="display:none;">${this.getFallbackSvg(obs.taxon_order_id)}<span>${obs.taxon_order_id}</span></div>`
      : `<div class="img-fallback">${this.getFallbackSvg(obs.taxon_order_id)}<span>${obs.taxon_order_id}</span></div>`;

    card.innerHTML = `
      <div class="card-media">
        ${mediaHtml}
        <div class="card-badges-overlay">
          <span class="order-pill ${obs.taxon_order_id}">${obs.taxon_order_id}</span>
          <span class="issue-badge" title="${obs.obs_issues}">${obs.obs_issues || 'QC Excluded'}</span>
        </div>
      </div>
      <div class="card-body">
        <div class="card-title-row">
          <span class="obs-id">#${obs.observation_id}</span>
          <span class="quality-badge needs_id">${obs.quality_grade || 'excluded'}</span>
        </div>
        <div class="tags-row">
          ${obs.order_id_corrected ? `<span class="annotation-tag highlight">Corrected: <strong>${obs.order_id_corrected}</strong></span>` : ''}
          ${obs.cannot_identify ? `<span class="annotation-tag">Cannot Identify</span>` : ''}
          ${obs.inat_id_corrected ? `<span class="annotation-tag">ID Corrected on iNat</span>` : ''}
        </div>
        <div class="card-meta-list">
          <div class="card-meta-row">
            <span>Date:</span>
            <strong>${obs.observed_date || 'N/A'}</strong>
          </div>
          <div class="card-meta-row">
            <span>Observer:</span>
            <strong>${obs.observer_id || 'N/A'}</strong>
          </div>
        </div>
      </div>
    `;

    const imgEl = card.querySelector('.card-img');
    if (imgEl) {
      imgEl.addEventListener('error', () => {
        imgEl.style.display = 'none';
        const fallback = card.querySelector('.img-fallback');
        if (fallback) fallback.style.display = 'flex';
      });
    }

    card.addEventListener('click', () => {
      if (this.onCardClick) this.onCardClick(obs, true);
    });

    return card;
  }

  renderGrouped(groups, isExcluded = false) {
    const container = document.createElement('div');
    container.className = 'grouped-container';

    for (const [groupTitle, items] of Object.entries(groups)) {
      const section = document.createElement('div');
      section.className = 'group-section';

      section.innerHTML = `
        <div class="group-header">
          <div class="group-header-title">
            <span>${groupTitle}</span>
            <span class="group-count-badge">${items.length} observations</span>
          </div>
          <svg class="group-toggle-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div class="group-body">
          <div class="cards-grid"></div>
        </div>
      `;

      // Header accordion toggle
      const header = section.querySelector('.group-header');
      header.addEventListener('click', () => {
        section.classList.toggle('collapsed');
      });

      // Render cards into this group's grid (up to 20 initial items per group)
      const grid = section.querySelector('.cards-grid');
      const previewItems = items.slice(0, 20);
      previewItems.forEach(item => {
        const card = isExcluded ? this.renderExcludedCard(item) : this.renderCuratedCard(item);
        grid.appendChild(card);
      });

      if (items.length > 20) {
        const moreNote = document.createElement('div');
        moreNote.style.cssText = 'grid-column: 1 / -1; text-align: center; padding: 1rem; color: var(--text-muted); font-size: 0.85rem;';
        moreNote.textContent = `Showing first 20 of ${items.length} in this group. Filter specifically by ${groupTitle} to paginate through all.`;
        grid.appendChild(moreNote);
      }

      container.appendChild(section);
    }

    return container;
  }
}
