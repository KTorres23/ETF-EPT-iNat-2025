/**
 * ETF-EPT-iNat-2025 Map Manager
 * Handles interactive geospatial mapping using Leaflet and MarkerCluster,
 * with Dark/Light/Satellite basemap styling, taxon order color coding,
 * cluster aggregation, and detail modal linking.
 */

export class MapManager {
  constructor(containerId, onShowDetail) {
    this.containerId = containerId;
    this.onShowDetail = onShowDetail;
    this.map = null;
    this.clusterGroup = null;
    this.tileLayers = {};
    this.currentTileKey = 'dark';
    this.isInitialized = false;
    this.currentObservations = [];
    this.activeOrderFilters = {
      Ephemeroptera: true,
      Plecoptera: true,
      Trichoptera: true
    };
    this.maxPlotLimit = 6000;
    this.plotAllRequested = false;
    this.currentPlottedCount = 0;
    this.isFullscreen = false;
    this.orderColors = {
      Ephemeroptera: '#10b981',
      Plecoptera: '#0284c7',
      Trichoptera: '#8b5cf6'
    };
  }

  init() {
    if (this.isInitialized) return;
    const container = document.getElementById(this.containerId);
    if (!container || typeof L === 'undefined') {
      console.warn('Map container or Leaflet library not found.');
      return;
    }

    // Default center (North America / East-Central US where most records are concentrated)
    this.map = L.map(this.containerId, {
      center: [38.5, -83.5],
      zoom: 5,
      zoomControl: true,
      minZoom: 2,
      maxZoom: 18,
      worldCopyJump: true
    });

    // Basemap definition (Esri World Imagery Satellite + Boundaries & Places)
    this.satelliteLayer = L.layerGroup([
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP',
          maxZoom: 18
        }
      ),
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 18,
          opacity: 0.85
        }
      )
    ]);

    this.satelliteLayer.addTo(this.map);

    // Initialize marker cluster group with custom cluster styling
    this.clusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      chunkInterval: 100,
      chunkDelay: 10,
      maxClusterRadius: 45,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        let sizeClass = 'cluster-sm';
        if (count > 500) sizeClass = 'cluster-xl';
        else if (count > 100) sizeClass = 'cluster-lg';
        else if (count > 20) sizeClass = 'cluster-md';

        const displayCount = count > 999 ? (count / 1000).toFixed(1) + 'k' : count;
        return L.divIcon({
          html: `<div class="custom-cluster-badge ${sizeClass}"><span>${displayCount}</span></div>`,
          className: 'custom-cluster-marker',
          iconSize: L.point(40, 40)
        });
      }
    });

    this.map.addLayer(this.clusterGroup);
    this.bindControls();
    this.isInitialized = true;
  }

  setBasemap(key) {
    // Retain Satellite as the sole basemap
  }

  handleThemeChange(theme) {
    // Retain Satellite as the sole basemap
  }

  bindControls() {

    // Order quick toggles
    document.querySelectorAll('.map-order-toggle').forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        const order = chip.getAttribute('data-order');
        chip.classList.toggle('active');
        this.activeOrderFilters[order] = chip.classList.contains('active');
        this.renderPoints();
      });
    });

    // Fit bounds button
    const fitBtn = document.getElementById('map-btn-fit');
    if (fitBtn) {
      fitBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.fitToData();
      });
    }

    // Fullscreen toggle button
    const fsBtn = document.getElementById('map-btn-fullscreen');
    if (fsBtn) {
      fsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleFullscreen();
      });
    }

    // Load all points button
    const loadAllBtn = document.getElementById('map-btn-load-all');
    if (loadAllBtn) {
      loadAllBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.plotAllRequested = true;
        loadAllBtn.style.display = 'none';
        this.renderPoints();
      });
    }
  }

  toggleFullscreen() {
    const wrapper = document.getElementById('curated-map-view');
    if (!wrapper) return;
    this.isFullscreen = !this.isFullscreen;
    wrapper.classList.toggle('map-fullscreen', this.isFullscreen);
    document.body.classList.toggle('map-fullscreen-active', this.isFullscreen);

    // Refresh map layout after container resize
    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 250);
  }

  fitToData() {
    if (!this.map || !this.clusterGroup) return;
    const bounds = this.clusterGroup.getBounds();
    if (bounds && bounds.isValid()) {
      this.map.fitBounds(bounds, { padding: [35, 35], maxZoom: 13, animate: true });
    }
  }

  updateObservations(observations) {
    this.currentObservations = observations || [];
    this.plotAllRequested = false; // Reset plot-all request when fresh filter is applied
    if (!this.isInitialized) {
      this.init();
    }
    this.renderPoints();
  }

  renderPoints() {
    if (!this.isInitialized) {
      this.init();
    }
    if (!this.clusterGroup || !this.map) return;

    this.clusterGroup.clearLayers();

    // Filter valid coordinates and active order toggles
    const validPoints = this.currentObservations.filter(obs => {
      if (obs.lat == null || obs.long == null || isNaN(obs.lat) || isNaN(obs.long)) return false;
      const order = obs.taxon_order_id;
      if (this.activeOrderFilters[order] === false) return false;
      return true;
    });

    const totalValid = validPoints.length;
    let pointsToPlot = validPoints;
    const loadAllBtn = document.getElementById('map-btn-load-all');

    if (!this.plotAllRequested && totalValid > this.maxPlotLimit) {
      pointsToPlot = validPoints.slice(0, this.maxPlotLimit);
      if (loadAllBtn) {
        loadAllBtn.style.display = 'inline-flex';
        loadAllBtn.textContent = `Plot all ${totalValid.toLocaleString()} points`;
      }
    } else {
      if (loadAllBtn) loadAllBtn.style.display = 'none';
    }

    this.currentPlottedCount = pointsToPlot.length;

    // Update status text
    const statusText = document.getElementById('map-status-text');
    if (statusText) {
      if (totalValid === 0) {
        statusText.innerHTML = `No observations with coordinates matching criteria`;
      } else if (pointsToPlot.length < totalValid) {
        statusText.innerHTML = `Plotting <strong>${pointsToPlot.length.toLocaleString()}</strong> of <strong>${totalValid.toLocaleString()}</strong> observations with coordinates`;
      } else {
        statusText.innerHTML = `Plotting <strong>${pointsToPlot.length.toLocaleString()}</strong> observations`;
      }
    }

    const markers = [];
    pointsToPlot.forEach(obs => {
      const orderColor = this.orderColors[obs.taxon_order_id] || '#f59e0b';
      
      const marker = L.circleMarker([obs.lat, obs.long], {
        radius: 6.5,
        fillColor: orderColor,
        color: '#ffffff',
        weight: 1.5,
        opacity: 0.9,
        fillOpacity: 0.85
      });

      marker.obsData = obs;

      // Popup content
      const qualityClass = (obs.quality_grade || '').toLowerCase().includes('research') ? 'research' : 'needs_id';
      const qualityText = (obs.quality_grade || 'needs_id').replace('_', ' ');

      const popupHtml = `
        <div class="map-popup-card">
          ${obs.image_url ? `
            <div class="map-popup-img">
              <img src="${obs.image_url}" alt="Observation #${obs.observation_id}" loading="lazy" />
              <span class="order-pill ${obs.taxon_order_id}">${obs.taxon_order_id}</span>
            </div>
          ` : `
            <div class="map-popup-header">
              <span class="order-pill ${obs.taxon_order_id}">${obs.taxon_order_id}</span>
            </div>
          `}
          <div class="map-popup-body">
            <div class="map-popup-title">
              <strong>Observation #${obs.observation_id}</strong>
              <span class="quality-badge ${qualityClass}">${qualityText}</span>
            </div>
            <div class="map-popup-tags">
              <span class="annotation-tag highlight">${obs.life_stage || 'Unknown stage'}</span>
              ${obs.collection_technique && obs.collection_technique !== 'No technique' ? `<span class="annotation-tag">${obs.collection_technique}</span>` : ''}
              ${obs.evidence_type && obs.evidence_type !== 'Organism' ? `<span class="annotation-tag">${obs.evidence_type}</span>` : ''}
            </div>
            <div class="map-popup-meta">
              <div><span>Date:</span> <strong>${obs.observed_date || 'N/A'}</strong></div>
              <div><span>Coords:</span> <strong>${Number(obs.lat).toFixed(4)}, ${Number(obs.long).toFixed(4)}</strong></div>
              <div><span>Observer:</span> <strong>${obs.observer_id || 'N/A'}</strong></div>
            </div>
            <div class="map-popup-actions">
              <button class="btn-primary map-popup-btn-detail" data-id="${obs.observation_id}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                <span>View Details</span>
              </button>
              <a href="${obs.inaturalist_url || `https://www.inaturalist.org/observations/${obs.observation_id}`}" target="_blank" rel="noopener noreferrer" class="btn-icon" title="View on iNaturalist">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        maxWidth: 290,
        className: 'custom-map-popup'
      });

      marker.on('popupopen', (e) => {
        const popupEl = e.popup.getElement();
        if (popupEl) {
          const detailBtn = popupEl.querySelector('.map-popup-btn-detail');
          if (detailBtn) {
            detailBtn.addEventListener('click', () => {
              if (this.onShowDetail) {
                this.onShowDetail(obs);
              }
            });
          }
        }
      });

      markers.push(marker);
    });

    this.clusterGroup.addLayers(markers);

    // Initial bounds adjustment if points exist
    if (markers.length > 0) {
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
          this.fitToData();
        }
      }, 100);
    }
  }

  locateObservation(obs) {
    if (!obs || obs.lat == null || obs.long == null || isNaN(obs.lat) || isNaN(obs.long)) {
      alert('Geographic coordinates not available for this observation.');
      return;
    }

    if (!this.isInitialized) {
      this.init();
    }

    // Scroll to map view
    const mapWrapper = document.getElementById('curated-map-view');
    if (mapWrapper) {
      mapWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Ensure map tiles refresh
    setTimeout(() => {
      this.map.invalidateSize();
      this.map.flyTo([obs.lat, obs.long], 15, { duration: 1.2 });

      // Create a temporary highlighted marker and open popup
      const orderColor = this.orderColors[obs.taxon_order_id] || '#f59e0b';
      const highlightMarker = L.circleMarker([obs.lat, obs.long], {
        radius: 11,
        fillColor: orderColor,
        color: '#ffffff',
        weight: 3,
        opacity: 1,
        fillOpacity: 0.95
      }).addTo(this.map);

      highlightMarker.bindPopup(`
        <div class="map-popup-card" style="min-width:240px;">
          <div class="map-popup-header">
            <span class="order-pill ${obs.taxon_order_id}">${obs.taxon_order_id}</span>
            <strong style="margin-left:0.5rem; font-family:var(--font-mono);">#${obs.observation_id}</strong>
          </div>
          <div class="map-popup-body" style="padding-top:0.4rem;">
            <div style="font-size:0.85rem; margin-bottom:0.4rem;">
              <span>Stage:</span> <strong>${obs.life_stage || 'Unknown'}</strong>
            </div>
            <div style="font-size:0.85rem; margin-bottom:0.6rem;">
              <span>Location:</span> <code>${Number(obs.lat).toFixed(4)}, ${Number(obs.long).toFixed(4)}</code>
            </div>
            <div class="map-popup-actions">
              <button class="btn-primary map-popup-btn-detail" id="btn-highlight-modal">
                <span>View Full Details</span>
              </button>
            </div>
          </div>
        </div>
      `, { className: 'custom-map-popup' }).openPopup();

      setTimeout(() => {
        const btn = document.getElementById('btn-highlight-modal');
        if (btn) {
          btn.addEventListener('click', () => {
            if (this.onShowDetail) this.onShowDetail(obs);
          });
        }
      }, 50);

      // Clean up highlight after 15 seconds
      setTimeout(() => {
        if (this.map.hasLayer(highlightMarker)) {
          this.map.removeLayer(highlightMarker);
        }
      }, 15000);
    }, 200);
  }
}
