/**
 * ETF-EPT-iNat-2025 Contributor Service
 * Integrates iNaturalist autocomplete API with 203a/203b dataset verification
 */

export class ContributorService {
  constructor(dataService, onFilterByObserver) {
    this.dataService = dataService;
    this.onFilterByObserver = onFilterByObserver;
    this.debounceTimer = null;
    this.init();
  }

  init() {
    this.searchInput = document.getElementById('contributor-search-input');
    this.dropdown = document.getElementById('contributor-autocomplete');
    this.card = document.getElementById('contributor-card');
    this.leaderboardsContainer = document.getElementById('leaderboards-content');

    if (!this.searchInput) return;

    // Search input with debounce
    this.searchInput.addEventListener('input', (e) => {
      clearTimeout(this.debounceTimer);
      const val = e.target.value.trim();
      if (!val) {
        this.hideDropdown();
        return;
      }
      this.debounceTimer = setTimeout(() => this.searchInatUsers(val), 280);
    });

    this.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        clearTimeout(this.debounceTimer);
        const val = this.searchInput.value.trim();
        if (val) this.lookupDirectUser(val);
      }
    });

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
      if (!this.searchInput.contains(e.target) && !this.dropdown.contains(e.target)) {
        this.hideDropdown();
      }
    });

    // Load and render initial leaderboards
    this.dataService.loadContributorsData().then(data => {
      if (data && data.leaderboards) {
        this.renderLeaderboards(data.leaderboards);
      }
    });
  }

  async searchInatUsers(query) {
    try {
      const res = await fetch(`https://api.inaturalist.org/v1/users/autocomplete?q=${encodeURIComponent(query)}&per_page=6`);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      this.renderSuggestions(data.results || []);
    } catch (err) {
      console.warn('iNaturalist API error:', err);
    }
  }

  renderSuggestions(users) {
    if (!users || users.length === 0) {
      this.dropdown.innerHTML = `
        <div class="user-suggestion-item" style="color:var(--text-muted); cursor:default;">
          No matching iNaturalist users found.
        </div>
      `;
      this.dropdown.classList.add('active');
      return;
    }

    this.dropdown.innerHTML = '';
    users.forEach(u => {
      const item = document.createElement('div');
      item.className = 'user-suggestion-item';
      
      const avatarUrl = u.icon_url || u.icon || 'assets/default_avatar.svg';
      const displayName = u.name || u.login;

      item.innerHTML = `
        <img class="user-avatar-sm" src="${avatarUrl}" alt="${u.login}" onerror="this.src='https://static.inaturalist.org/attachments/users/icons/defaults/thumb.png';" />
        <div class="user-suggestion-info">
          <span class="user-suggestion-name">${displayName}</span>
          <span class="user-suggestion-handle">@${u.login} (ID: ${u.id})</span>
        </div>
      `;

      item.addEventListener('click', () => {
        this.selectUser(u);
        this.hideDropdown();
      });

      this.dropdown.appendChild(item);
    });

    this.dropdown.classList.add('active');
  }

  hideDropdown() {
    if (this.dropdown) {
      this.dropdown.classList.remove('active');
    }
  }

  async lookupDirectUser(loginOrId) {
    this.hideDropdown();
    // Check if numeric user ID
    if (/^\d+$/.test(loginOrId)) {
      const uid = parseInt(loginOrId, 10);
      try {
        const res = await fetch(`https://api.inaturalist.org/v1/users/${uid}`);
        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results[0]) {
            this.selectUser(data.results[0]);
            return;
          }
        }
      } catch (e) {}
      // Fallback display
      this.displayStatsCard({ id: uid, login: `user_${uid}`, name: `User ${uid}` });
    } else {
      // Lookup by username
      try {
        const res = await fetch(`https://api.inaturalist.org/v1/users/${encodeURIComponent(loginOrId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results[0]) {
            this.selectUser(data.results[0]);
            return;
          }
        }
      } catch (e) {}
    }
  }

  selectUser(user) {
    this.searchInput.value = user.login;
    this.displayStatsCard(user);
  }

  displayStatsCard(user) {
    const stats = this.dataService.getContributorStats(user.id);
    const avatarUrl = user.icon_url || user.icon || 'https://static.inaturalist.org/attachments/users/icons/defaults/medium.png';
    const displayName = user.name || user.login;

    this.card.innerHTML = '';

    if (stats && stats.total > 0) {
      // Found contributor with contributions
      this.card.innerHTML = `
        <div class="contributor-header">
          <img class="contributor-avatar-lg" src="${avatarUrl}" alt="${user.login}" onerror="this.src='https://static.inaturalist.org/attachments/users/icons/defaults/medium.png';" />
          <div class="contributor-meta">
            <h3>${displayName}</h3>
            <div class="contributor-handle">
              <a href="https://www.inaturalist.org/people/${user.login}" target="_blank" rel="noopener noreferrer">@${user.login} ↗</a>
              • iNat ID: <code>${user.id}</code>
            </div>
            <div class="contributor-badge-chip">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Verified Dataset Contributor (${stats.total.toLocaleString()} total contributions)</span>
            </div>
          </div>
        </div>

        <div class="stats-grid-3">
          <div class="stat-box">
            <div class="stat-box-val">${stats.observations.toLocaleString()}</div>
            <div class="stat-box-lbl">📸 Observations</div>
          </div>
          <div class="stat-box">
            <div class="stat-box-val">${stats.identifications.toLocaleString()}</div>
            <div class="stat-box-lbl">🏷️ Identifications</div>
          </div>
          <div class="stat-box">
            <div class="stat-box-val">${stats.annotations.toLocaleString()}</div>
            <div class="stat-box-lbl">📝 Annotations</div>
          </div>
        </div>

        <div style="text-align: center; display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;">
          ${stats.observations > 0 ? `
            <button class="btn-primary" id="btn-view-user-obs">
              <span>View My Observations in Dashboard (${stats.observations})</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          ` : ''}
          <a href="https://www.inaturalist.org/people/${user.login}" target="_blank" rel="noopener noreferrer" class="page-btn" style="height:auto; padding:0.65rem 1rem; font-family:var(--font-main);">
            iNaturalist Profile ↗
          </a>
        </div>
      `;

      const viewBtn = this.card.querySelector('#btn-view-user-obs');
      if (viewBtn) {
        viewBtn.addEventListener('click', () => {
          if (this.onFilterByObserver) {
            this.onFilterByObserver(user.id);
          }
        });
      }
    } else {
      // User not in dataset
      this.card.innerHTML = `
        <div class="contributor-header">
          <img class="contributor-avatar-lg" src="${avatarUrl}" alt="${user.login}" onerror="this.src='https://static.inaturalist.org/attachments/users/icons/defaults/medium.png';" />
          <div class="contributor-meta">
            <h3>${displayName}</h3>
            <div class="contributor-handle">
              <a href="https://www.inaturalist.org/people/${user.login}" target="_blank" rel="noopener noreferrer">@${user.login} ↗</a>
              • iNat ID: <code>${user.id}</code>
            </div>
          </div>
        </div>
        <div style="background:var(--bg-tertiary); border:1px dashed var(--border-card); border-radius:var(--radius-md); padding:1.25rem; text-align:center; color:var(--text-secondary);">
          <p style="margin-bottom:0.5rem; font-weight:600; color:var(--text-primary);">No EPT Contributions Found</p>
          <p style="font-size:0.85rem;">
            User <strong>@${user.login}</strong> was found on iNaturalist, but is not recorded in the curated <strong>ETF-EPT-iNat-2025</strong> datasets (203a / 203b).
            This dataset specifically curates Ephemeroptera, Plecoptera, and Trichoptera observations within defined geographic and quality parameters.
          </p>
        </div>
      `;
    }

    this.card.classList.add('active');
  }

  renderLeaderboards(leaderboards) {
    if (!this.leaderboardsContainer) return;

    this.leaderboardsContainer.innerHTML = `
      <div class="leaderboards-grid">
        <!-- Top Observers -->
        <div class="leader-card">
          <h4>
            <span>📸 Top Observers</span>
            <span style="font-size:0.75rem; color:var(--text-muted); font-weight:normal;">in ETF-EPT-2025</span>
          </h4>
          <div class="leader-list" id="leader-obs-list"></div>
        </div>

        <!-- Top Identifiers -->
        <div class="leader-card">
          <h4>
            <span>🏷️ Top Identifiers</span>
            <span style="font-size:0.75rem; color:var(--text-muted); font-weight:normal;">community IDs</span>
          </h4>
          <div class="leader-list" id="leader-id-list"></div>
        </div>

        <!-- Top Annotators -->
        <div class="leader-card">
          <h4>
            <span>📝 Top Annotators</span>
            <span style="font-size:0.75rem; color:var(--text-muted); font-weight:normal;">life stage / traits</span>
          </h4>
          <div class="leader-list" id="leader-ann-list"></div>
        </div>
      </div>
    `;

    const fillList = (elId, list, countKey) => {
      const container = this.leaderboardsContainer.querySelector(`#${elId}`);
      if (!container || !list) return;

      list.slice(0, 8).forEach((item, idx) => {
        const row = document.createElement('div');
        row.className = 'leader-item';
        row.innerHTML = `
          <span class="leader-rank">#${idx + 1}</span>
          <span class="leader-user">User ${item.userId}</span>
          <span class="leader-count">${item[countKey].toLocaleString()}</span>
        `;
        row.addEventListener('click', () => {
          this.lookupDirectUser(item.userId);
        });
        container.appendChild(row);
      });
    };

    fillList('leader-obs-list', leaderboards.observations, 'obs');
    fillList('leader-id-list', leaderboards.identifications, 'id');
    fillList('leader-ann-list', leaderboards.annotations, 'ann');
  }
}
