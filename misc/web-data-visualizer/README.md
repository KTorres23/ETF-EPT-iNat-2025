# ETF-EPT-iNat-2025 Web Visualizer

An interactive, responsive client-side web dashboard to query, filter, and explore curated iNaturalist observations of freshwater macroinvertebrates across three indicator orders: **Ephemeroptera** (Mayflies), **Plecoptera** (Stoneflies), and **Trichoptera** (Caddisflies).

Designed for hosting on **GitHub Pages** with zero build-tool dependencies.

---

## Features

- **Curated Dataset Explorer (`ETF-EPT-iNat-2025.csv`)**:
  - Observation cards displaying IDs, color-coded order badges, thumbnail photos, life stage annotations, evidence types, and collection techniques.
  - Interactive multi-criteria filtering by Order, Life Stage, Collection Technique, Evidence Type, Quality Grade, and boolean flags (Curator Favorites, Human Present, Multiple Specimen, Preserved Specimen, Ecological Interactions).
  - Search by column (Observation ID, Observer ID, Curator notes `odd_cases`) and global search.
  - Group-by functionality (group by Order, Life Stage, Collection Technique, Quality Grade).
  - Configurable pagination (12, 20, 50, 100 observations per page).
  - Full detail modal showcasing all 23 dataset columns, high-resolution photo viewer, clickable geographic GPS coordinates, and direct links to iNaturalist.
- **Geospatial Map Visualization**:
  - Interactive Leaflet & MarkerCluster mapping engine seamlessly integrated with dataset filters.
  - Dedicated **"Visualize on Map"** action button and **Cards / Map View** switcher in the explorer toolbar.
  - Primary navigation **"Geospatial Map"** tab for direct access.
  - Color-coded pins and glowing cluster bubbles for **Ephemeroptera** (emerald), **Plecoptera** (sapphire), and **Trichoptera** (violet).
  - High-resolution Satellite Imagery (Esri World Imagery + World Boundaries & Places reference) with zero API keys or watermarks.
  - Interactive popups displaying observation photos, taxonomy badges, life stage annotations, coordinates, and "View Details" modal links.
  - "View on Map" quick-locate button inside each observation's detail modal.
- **Excluded Observations Explorer (`excluded-observations.csv`)**:
  - Browse quality-controlled and excluded observations (371 records).
  - Filter and inspect exclusion issue reasons (`obs_issues`) such as *Incorrect order-level ID*, *Duplicate image*, *Uncertain ID*, *Missing image*, and *Copyright image*.
  - View corrected identifications (`order_id_corrected`) and correction flags.
- **iNaturalist Contributor Lookup & Acknowledgments (`203a` & `203b`)**:
  - Live query integration with the official iNaturalist User API (`/v1/users/autocomplete`).
  - Search by username or user ID with auto-suggestions, avatar, and profile handle.
  - Cross-references user IDs against the curated dataset to determine verified contributor status.
  - Displays categorized contribution metrics:
    - 📸 **Observations Contributed**
    - 🏷️ **Community Identifications**
    - 📝 **Trait Annotations**
  - "View My Observations in Dashboard" button to filter curated cards directly to the observer.
  - Community Leaderboard showcasing top observers, identifiers, and annotators.
- **Modern Design & UX**:
  - Responsive CSS Grid tailored for desktop, tablet, and mobile browsers.
  - Theme switcher supporting Dark Mode and Light Mode with persistence.
  - Live dataset ticker bar showing real-time totals and order breakdowns.

---

## Local Development & Preview

Because this dashboard is built with modern standard web technologies (HTML5, Vanilla CSS3, ES6+ modules), it requires no Node.js or npm installation.

To run locally using Python:

```bash
# From the repository root
python -m http.server 8000 --directory misc/web-data-visualizer
```

Then open [http://localhost:8000](http://localhost:8000) in your browser.

---

## Rebuilding Dataset Indices

Whenever new CSV exports are generated in `data/L4/` or `data/L2/`, update the optimized web files by running:

```bash
python misc/web-data-visualizer/scripts/build_data.py
```

This script:
1. Pre-aggregates contributor stats from `203b_ETF_EPT_inat_contributed_info.csv` into a ~338 KB index (`contributors_index.json`).
2. Packages the 371 excluded observations with image links into `excluded_observations.json`.
3. Pre-joins AWS S3 thumbnail photos to observation records and generates `curated_metadata.json`, `curated_sample.json`, and `curated_observations.json`.

---

## GitHub Pages Deployment

A GitHub Actions workflow is provided in [`.github/workflows/deploy-pages.yml`](file:///c:/Users/torre/Documents/ETF-EPT-iNat-2025/.github/workflows/deploy-pages.yml).

When changes are pushed to the `main` branch, GitHub Actions will automatically deploy the `misc/web-data-visualizer/` folder to GitHub Pages.

To enable GitHub Pages in your repository:
1. Navigate to repository **Settings** → **Pages**.
2. Under **Build and deployment** > **Source**, select **GitHub Actions**.
