# Implementation Plan: ETF-EPT-iNat-2025 Web Dashboard

Develop a modern, high-performance web dashboard hosted on **GitHub Pages** that allows researchers, students, and community scientists to explore the curated **ETF-EPT-iNat-2025** datasets, examine excluded observations with quality-control reasons, and look up individual contributors via the iNaturalist API.

---

## User Review Required

> [!IMPORTANT]
> **No Node.js Environment Required**: The user machine has Python 3.14 and Quarto installed, but does not have `node` or `npm`. In accordance with our web application rules and this environment, the dashboard will be built with **modern Vanilla HTML5, CSS3, and ES6+ JavaScript** (with lightweight CDN-loaded libraries such as PapaParse for streaming CSV parsing, Lucide icons, and Chart.js/Leaflet where appropriate). This ensures **zero build tool dependencies**, full compatibility with GitHub Pages, and immediate local testing via Python's built-in HTTP server.

> [!NOTE]
> **Data Strategy for 78,000+ Observations on GitHub Pages**:
> - `ETF-EPT-iNat-2025.csv` is ~20 MB (78,260 rows).
> - `203b_ETF_EPT_inat_contributed_info.csv` is ~8.2 MB (238,769 rows).
> To guarantee sub-second initial page loads and instant search/filtering on mobile and desktop:
> 1. We will provide a Python data builder script (`build_data.py`) that pre-processes the CSVs into optimized, compressed web-ready JSON files (including pre-joining the primary thumbnail photo from `ETF-EPT-iNat-2025-image-metadata.csv` and indexing contributor stats from 8.2 MB down to 780 KB).
> 2. We will also include a streaming Web Worker PapaParse fallback so the dashboard can directly parse the raw CSV files if needed.

---

## Architecture & Layout Overview

The web dashboard will be housed in `misc/web-data-visualizer/` and will feature:

```
misc/web-data-visualizer/
├── index.html                  # Main application structure with semantic HTML5
├── css/
│   ├── index.css               # Design system, CSS tokens, resets
│   ├── components.css          # Cards, modals, buttons, badges, filter controls
│   └── responsive.css          # Mobile, tablet, and wide-screen responsiveness
├── js/
│   ├── app.js                  # App bootstrap, state management, tab routing
│   ├── dataService.js          # Data loading (optimized JSON + Web Worker CSV fallback)
│   ├── cardsRenderer.js        # Observation card grid, lazy loading, thumbnail handling
│   ├── filterService.js        # Multi-column search, filters, and group-by logic
│   ├── paginationService.js    # Page slicing, navigation controls, items-per-page
│   ├── modalManager.js         # Full-detail observation modal with iNat link
│   └── contributorService.js   # iNat API autocomplete, user lookup, contribution stats
├── scripts/
│   └── build_data.py           # Generates optimized json indices from data/L4 and data/L2
└── assets/                     # Custom order icons (Ephemeroptera, Plecoptera, Trichoptera)
```

---

## Proposed Dashboard Features & Components

### 1. Header, Branding & Live Stats Bar
- **Header**:
  - Title: **ETF-EPT-iNat-2025 Data Visualizer**
  - Subtitle: *Freshwater Macroinvertebrate Image Dataset (Ephemeroptera, Plecoptera, Trichoptera)*
  - Dark / Light Mode theme toggle (with system preference auto-detection).
  - Quick link to repository GitHub and iNaturalist project.
- **Interactive Metric Ticker**:
  - Total Curated Observations: **78,260**
  - Insect Orders: **3** (*Ephemeroptera, Plecoptera, Trichoptera*)
  - Excluded / QC Flagged: **371**
  - Unique Community Contributors: **19,050**
  - Research Grade vs Needs ID breakdown.

---

### 2. Tab Navigation
The interface will be organized into three clear, accessible views:
1. 🪰 **Curated Observations** (`data/L4/ETF-EPT-iNat-2025.csv`)
2. ⚠️ **Excluded Observations** (`data/L4/excluded-observations.csv`)
3. 🏆 **Contributor Lookup & Acknowledgments** (`203a` & `203b` + iNat API)
4. ℹ️ **About & Dataset Metadata** (Schema description, EPT overview, citation)

---

### 3. Curated Observations Explorer

#### A. Card Grid View
- Cards representing each observation:
  - **Thumbnail Image**: Loaded from AWS S3 (`aws_image_url`) with lazy-loading and order-specific fallback illustration.
  - **Header**: Observation ID (e.g. `#324828906`) with order-specific color-coded badge:
    - 🟢 *Ephemeroptera* (Mayflies)
    - 🔵 *Plecoptera* (Stoneflies)
    - 🟣 *Trichoptera* (Caddisflies)
  - **Key Annotations**:
    - Life Stage badge (`Adult`, `Immature`, `Eggs`).
    - Evidence Type badge (`Organism`, `Exuviae`, etc.).
    - Technique tag (`Under microscope`, `In net`, `Light trap`, etc.).
    - Badges for special flags: ⭐ Favorite Image (`fave_image`), 👤 Human Present, 👥 Multiple Specimen, 🔬 Quality Grade (`Research Grade` / `Needs ID`).
  - **Footer**: Observed date, Observer ID, and "View Details →" trigger.
  - **Interactive Hover**: Smooth 3D tilt/elevation hover effect.

#### B. Search & Filtering Controls
- **Quick Global Search**: Search across observation ID, observer ID, notes, and order.
- **Column-Specific Search**: Target specific columns (`observation_id`, `observer_id`, `odd_cases`, `uuid`).
- **Filter Toolbar**:
  - Order dropdown / pills (*Ephemeroptera, Plecoptera, Trichoptera*).
  - Life Stage filter (*Adult, Immature, Eggs*).
  - Evidence Type filter (*Organism, Nymph to adult exuviae, etc.*).
  - Collection Technique filter.
  - Quality Grade filter (*Research Grade*, *Needs ID*).
  - Boolean flag toggles: *Favorites only*, *Human Present*, *Multiple Specimen*, *Preserved Specimen*, *Ecological Interactions* (Predation, Flower, Reproduction, Fungus).
  - Date Range picker (`observed_date`).
- **Active Filters Bar**: Displays active tags with single-click dismiss and a "Clear All" button.

#### C. Group-By Functionality
- Allows users to group observations by:
  - **Insect Order** (`taxon_order_id`)
  - **Life Stage** (`life_stage`)
  - **Collection Technique** (`collection_technique`)
  - **Quality Grade** (`quality_grade`)
  - **License Code** (`license_code`)
- Renders distinct collapsible accordion sections with observation count chips and sub-grids.

#### D. Pagination & Responsiveness
- Default 20 observations per page (options: 12, 20, 50, 100).
- Sticky or bottom pagination toolbar:
  - Prev / Next buttons, direct page numbers, jump-to-page input.
  - "Showing 1–20 of 78,260 observations" readout.
- Fully responsive CSS Grid:
  - 1 column on mobile (<640px).
  - 2 columns on tablet (640px - 1024px).
  - 3–4 columns on desktop (>1024px).

#### E. Detailed Observation Modal
- Clicking any card opens a modal displaying all 23 columns:
  - High-resolution photo viewer (with zoom and link to original AWS S3 photo).
  - Prominent external link button: **"Open on iNaturalist ↗"** (`https://www.inaturalist.org/observations/{id}`).
  - Structured data groups:
    1. **Taxonomy & Identification**: Order, Observation ID, Quality Grade.
    2. **Life History & Evidence**: Life Stage, Evidence Type, Multiple Specimen, Human Present, Collection Technique, Preserved Specimen.
    3. **Ecological Interactions**: Predation, Flower Association, Reproduction, Fungus Parasitism.
    4. **Geospatial & Collection**: Latitude, Longitude (with link to OpenStreetMap/Google Maps), Positional Accuracy, Observed Date.
    5. **Metadata & Provenance**: UUID, License Code, Observer ID (with click to lookup contributor).
    6. **Curator Notes**: `odd_cases` notes and `fave_image` designation.

---

### 4. Excluded Observations Explorer (`data/L4/excluded-observations.csv`)
- Same card grid, search, filter, group-by, and pagination UX.
- Distinctive amber/coral visual accents to distinguish QC/rejected observations.
- Special fields highlighted on cards and modal:
  - **Reason for Exclusion** (`obs_issues`): *Incorrect order-level ID*, *Duplicate image*, *Uncertain ID*, *Missing image*, *Copyright image*.
  - **Corrected Identification** (`order_id_corrected`): Shows the corrected taxon (e.g. *Diptera*, *Lepidoptera*, *Ichneumonidae*).
  - **Correction Status**: `cannot_identify` and `inat_id_corrected` badges.
  - Quick filter by exclusion reason.

---

### 5. Contributor Lookup & Acknowledgments (`203a` & `203b`)
- **Username Search Box**:
  - Live query to iNaturalist API (`https://api.inaturalist.org/v1/users/autocomplete?q={query}`).
  - Auto-suggest dropdown with user avatar, display name, handle, and iNaturalist total activity count.
- **Dataset Verification**:
  - Resolves selected user's numeric `user.id`.
  - Checks presence in `data/L2/203a_ETF_EPT_inat_users.csv`.
  - Looks up contribution breakdown in `data/L2/203b_ETF_EPT_inat_contributed_info.csv`:
    - **Observations**: Count of observations included in the curated dataset.
    - **Identifications**: Count of community identifications contributed.
    - **Annotations**: Count of annotations provided.
- **Acknowledgment Card**:
  - If found:
    - User avatar, name, handle, and personalized congratulatory badge.
    - Interactive metric tiles for Observation, Identification, and Annotation counts.
    - Action button: **"View My Observations in Dashboard"** (switches to Curated tab and filters by `observer_id`).
  - If not found:
    - Friendly message explaining that while the user has an active iNaturalist account, their observations/identifications were not part of this specific EPT dataset slice.
- **Top Contributors Leaderboard**:
  - Showcases top 10 observers, identifiers, and annotators with celebratory badges.

---

### 6. Deployment & Automation
- **GitHub Pages Compatibility**:
  - Pure static HTML/CSS/JS (no Node server required).
  - Can be served from repository root, `docs/` folder, or via GitHub Actions.
- **Data Pre-processing Script (`scripts/build_data.py`)**:
  - Reads `data/L4/` and `data/L2/`.
  - Generates compact, fast JSON structures for web delivery.
  - Can be run whenever new CSV versions are generated.
- **GitHub Actions Workflow (`.github/workflows/deploy-pages.yml`)**:
  - Automates deployment of `misc/web-data-visualizer/` to GitHub Pages upon push to `main`.

---

## Verification Plan

### 1. Local Testing
- Start Python HTTP server in `misc/web-data-visualizer/`:
  ```powershell
  python -m http.server 8000 --directory misc/web-data-visualizer
  ```
- Use the Antigravity `browser_subagent` to test the running dashboard:
  - Verify card grid rendering (20 cards per page).
  - Test pagination (Next, Prev, jump to page).
  - Test search by column and global search.
  - Test filtering by order, life stage, technique, and boolean flags.
  - Test grouping by order and life stage.
  - Test clicking an observation card and verifying the detail modal and iNaturalist link.
  - Test switching to "Excluded Observations" and verifying issue reasons and corrected IDs.
  - Test Contributor Lookup with known contributors (e.g. username `kmtorres`, user.id `8424386`) and verify iNaturalist API response and contribution counts.

### 2. Cross-Device & Responsiveness Testing
- Verify responsive layout on mobile viewport (375x667), tablet (768x1024), and desktop (1440x900).
- Verify dark/light mode toggle.
