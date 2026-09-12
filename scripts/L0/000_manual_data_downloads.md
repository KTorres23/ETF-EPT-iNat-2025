---
title: 000_manual_data_downloads.md
subtitle: ETF-EPT-iNat-2025 Data description
author: 
    - name: Karina Torres
      role: Author
      affiliation: Southern Illinois University
      url: github.com/KTorres23
toc: true
format:
  html:
    embed-resources: true
abstract: This file describes the data sources of data that was manually downloaded.
date: 2026-09-12 # last modified
date-format: "yyyy-MM-dd"
---

# Manual Data Downloads

* [L0/000a_na_cec_eco_l1](data/L0/000a_na_cec_eco_l1) Level 1 Ecoregions of North America Shapefile, downloaded from the [U.S. EPA](https://www.epa.gov/eco-research/ecoregions-north-america) on February 10, 2026
* [L0/000k_us_eco_l4](data/L0/000k_us_eco_l4) Level 4 Ecoregions of the Contintental United States, downloaded from [epa.gov](https://www.epa.gov/eco-research/level-iii-and-iv-ecoregions-continental-united-states) on July 31, 2026.
  * Citation: 

# Virtual data downloads

* In [004_clip_ecoregions.py](004_clip_ecoregions.py), I used the [USA States Generalized Boundaries](https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_States_Generalized_Boundaries/FeatureServer) from the [ESRI Living Atlas](https://www.arcgis.com/home/item.html?id=8c2d6d7df8fa4142b0a1211c8dd66903#overview).
