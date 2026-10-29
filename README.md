# ETF-EPT-iNat-2025 Dataset: Aquatic insect records transformed by secondary data from iNaturalist images

## Identifiers

Dataset title: ETF-EPT-iNat-2025

Data identifier DOI: *[complete upon acceptance]* **TO DO**

Data paper DOI: *[complete upon acceptance]* **TO DO**

License: [see LICENSE file](LICENSE)

Keywords: biology, citizen science, computer vision, ecology, machine learning, macroinvertebrates, morphology, ontogeny, phenotypic traits, sampling technique, spatial bias modelling, taxonomy

Data paper citation: *[complete upon acceptance]* **TO DO**


## Authors

[Karina M. Torres*](https://ktorres23.github.io) ([ORCID](orcid.org/0009-0003-0578-094X)), [Brent S. Pease](https://www.peaselab.com) ([ORCID](orcid.org/0000-0003-1528-6075))

*corresponding author email: torres06km@gmail.com


## Study Design

Project title: ETF-EPT-iNat-2025 Dataset: Aquatic insect records transformed by secondary data from iNaturalist images

Objectives: Curate a human-verified, annotated dataset enriched by secondary image data called ETF-EPT-iNat-2025, containing aquatic insect iNaturalist observations across the Eastern Temperate Forests of North America from 2000 to 2025 for the orders of Ephemeroptera (mayflies), Plecoptera (stoneflies), and Trichoptera (caddisflies)

Funding: **TO DO**

## Data Files

* [ETF-EPT-iNat-2025.csv](data/L4/ETF-EPT-iNat-2025.csv) dataset. Abbreviations stand for Eastern Temperate Forests of North America (ETF) - Ephemeroptera, Plecoptera, Trichoptera (EPT) - iNaturalist observations (iNat) - from 2000 to 2025 (2025)
  * file size: 19.1 MB
  * file contents: iNaturalist observations of aquatic insects with validated taxonomic identifiaction, annotations derived from secondary image data, and DOIs and spatiotemporal metadata from iNaturalist. Dataset structure is described in script [401_compile_final_dataset.qmd](scripts/L4/401_compile_final_dataset.qmd).
  * alternative file format: [ETF-EPT-iNat-2025.rds](data/L4/ETF-EPT-iNat-2025.rds) (21.9 MB)
* [ETF-EPT-iNat-2025-image-metadata.csv](data/L4/ETF-EPT-iNat-2025-image-metadata.csv) dataset. Follows abbreviations used above.
  * file size: 22.7 MB
  * file contents: DOIs and urls to download images from Amazon Web Services (AWS) for the observations contained in the [ETF-EPT-iNat-2025 dataset](data/L4/ETF-EPT-iNat-2025.csv). Dataset structure is described in script [401_compile_final_dataset.qmd](scripts/L4/401_compile_final_dataset.qmd).
  * alternative file format: [ETF-EPT-iNat-2025-image-metadata.rds](data/L4/ETF-EPT-iNat-2025-image-metadata.rds) (25.6 MB)
* [excluded-observations.csv](data/L4/excluded-observations.csv) dataset.
  * file size: 82.6 KB
  * file contents: iNaturalist observations of aquatic insects that were excluded from the [ETF-EPT-iNat-2025 dataset](data/L4/ETF-EPT-iNat-2025.csv). Dataset structure is described in script [401_compile_final_dataset.qmd](scripts/L4/401_compile_final_dataset.qmd).
  * alternative file format: [excluded-observations.rds](data/L4/excluded-observations.rds) (97.8 KB)
* [excluded-observations-image-metadata.csv](data/L4/excluded-observations-image-metadata.csv) dataset.
  * file size: 100 KB
  * file contents: DOIs and urls to download images from Amazon Web Services (AWS) for the observations contained in the [excluded-observations dataset](data/L4/excluded-observations.csv). Dataset structure is described in script [401_compile_final_dataset.qmd](scripts/L4/401_compile_final_dataset.qmd).
  * alternative file format: [excluded-observations-image-metadata.rds](data/L4/excluded-observations-image-metadata.rds) (113 KB)
* Intermediate data files produced during quality control and dataset curation are stored in the [data](data) directory and [described below](#data).

### Repository Directory

* [`data/...`](#data) Directory containing data, results, and figures; organized by Levels (L0-L4)
* [`misc/...`](#misc) Directory containing miscellaneous scripts and data
* [`scripts/...`](#scripts) Directory containing scripts; organized by Levels (L0-L4)
* [`.gitignore`](.gitignore) Files to ignore for Git commits
* [`LICENSE`](LICENSE) Licensing rights
* [`metadata.md`](metadata.md) Dataset metadata, describing content, context, quality, and structure of the dataset
* [`README.md`](README.md) Technical summary of the dataset and associated repository

#### [`data/...`](data)

##### [`data/L0`](data/L0)

* Multiple raw data files are not available in this repository due to file size. Please contact the corresponding author to arrange data requests.
* [`004_clean_ETF_EPT_obs.csv`](data/L0/004_clean_ETF_EPT_obs.csv) EPT Observations across the Eastern Temperate Forests between 2000-2025 with main data quality control filters applied.

##### [`data/L1`](data/L1)

* Directory containing image files are not available in this repository due to file size. Please contact the corresponding author to arrange data requests.
* [`101b_images_metadata_ETF_EPT.csv`](data/L1/101b_images_metadata_ETF_EPT.csv) Observation metadata used to support the EPT Image Annotation Tool in [script 102_label_ETF_EPT_images_app.py](scripts/L1/102_label_ETF_EPT_images_app.py).
* [`102_ETF_EPT_image_labels.csv`](data/L1/102_ETF_EPT_image_labels.csv) Raw annotation labels made during the annotation process with the EPT Image Annotation Tool in [script 102_label_ETF_EPT_images_app.py](scripts/L1/102_label_ETF_EPT_images_app.py). 
  * Alternative format: [`102_ETF_EPT_image_labels.rds`](data/L1/102_ETF_EPT_image_labels.rds)
* [`102_time_recording_labels.txt`](data/L1/102_time_recording_labels.txt) Raw data representing the time spent annotating labels with the EPT Image Annotation Tool in [script 102_label_ETF_EPT_images_app.py](scripts/L1/102_label_ETF_EPT_images_app.py).  
* [`103a_ETF_EPT_final_annotated.rds`](data/L1/103a_ETF_EPT_final_annotated.rds) Dataset containing observations with correct order-level identifications and labelled annotations from the EPT Image Annotation Tool in [script 102_label_ETF_EPT_images_app.py](scripts/L1/102_label_ETF_EPT_images_app.py). 
* [`103b_ETF_EPT_reject_annotated.rds`](data/L1/103b_ETF_EPT_reject_annotated.rds) Dataset containing observations with incorrect order-level identifications or observations excluded for other reason (e.g., not reproducible CC lisense).
* [`103c_ETF_EPT_fave_annotated.rds`](data/L1/103c_ETF_EPT_fave_annotated.rds) Dataset containing favorite observations to use for scientific communication and visualization purposes from the EPT Image Annotation Tool in [script 102_label_ETF_EPT_images_app.py](scripts/L1/102_label_ETF_EPT_images_app.py). 


##### [`data/L2`](data/L2)

* A shapefile (data/L2/201_ETF_EPT_GBIF_shp/...) is not available in this repository due to file size. Please contact the corresponding author to arrange data requests.
* [`201_data_summary_figures/...`](data/L2/201_data_summary_figures) Directory containing figures and tables used in manuscript (note that not all figures or tables were used in the final manuscript)
  * [Figure 1](data/L2/201_data_summary_figures/201_figure1_inat_obs_taxa_stage_grade.png)
  * [Figure 2](data/L2/201_data_summary_figures/201_figure2_excluded_data.png)
  * [Figure 3](data/L2/201_data_summary_figures/201_figure3_dataset_map.png)
  * [Supp. Figure 1](data/L2/201_data_summary_figures/201_suppfigure1_inat_users.png)
  * [Supp. Figure 2](data/L2/201_data_summary_figures/201_suppfigure2_inat_num_ids_ann.png)
  * [Table 1](data/L2/201_data_summary_figures/201_table1_dataset_order_table.docx)
  * [Table 2](data/L2/201_data_summary_figures/201_table2_inat_obs_table.docx)
  * [Table 3](data/L2/201_data_summary_figures/201_table3_dataset_map_distr.docx)
* [`203a_ETF_EPT_inat_users.csv`](data/L2/203a_ETF_EPT_inat_users.csv) List of unique iNaturalist users who contributed observations, identifications, and annotations to the observations used in the ETF-EPT-iNat-2025 dataset
* [`203b_ETF_EPT_inat_contributed_info.csv`](data/L2/203b_ETF_EPT_inat_contributed_info.csv) List of iNaturalist users by contribution type who contributed observations, identifications, and annotations to the observations used in the ETF-EPT-iNat-2025 dataset

##### [`data/L3`](data/L3)

* A csv (data/L3/302_updated_obs.csv) is not available in this repository due to file size. Please contact the corresponding author to arrange data requests.
* [`301_api_uploads/...`](data/L3/301_api_uploads) Directory containing data for uploading Ephemeroptera identifications to the iNaturalist API 
  * [`301a_ETF_EPT_IDS_api_prep.rds`](data/L3/301_api_uploads/301a_ETF_EPT_IDS_api_prep.rds) Dataset containing metadata for preparing identifications for upload to iNaturalist
  * [`301b_ETF_EPT_IDS_api_uploads`](data/L3/301_api_uploads/301b_ETF_EPT_IDS_api_uploads.rds) Dataset containing updated observation information after uploading identification to iNaturalist
  * [`301c_ETF_EPT_IDS_api_log`](data/L3/301_api_uploads/301c_ETF_EPT_IDS_api_log.txt) Output log file indicating success/failure of each identification added to iNaturalist
* [`302_updated_obs.rds`](data/L3/302_updated_obs.rds)
* [`303_EPT_ID_change.rds`](data/L3/303_EPT_ID_change.rds) Dataset containing observations that experienced a change in taxonomic resolution during a 7-month period, includnig metadata about the taxonomic shift and directionality
* [`303_figure4_change_in_ids.png`](data/L3/303_figure4_change_in_ids.png) Figure 4 used in manuscript

##### [`data/L4`](data/L4)

* [`ETF-EPT-iNat-2025-image-metadata.csv`](data/L4/ETF-EPT-iNat-2025-image-metadata.csv) DOIs and urls to download images from Amazon Web Services (AWS) for the observations contained in the [ETF-EPT-iNat-2025 dataset](data/L4/ETF-EPT-iNat-2025.csv).
  * Alternative format: [`ETF-EPT-iNat-2025-image-metadata.rds`](data/L4/ETF-EPT-iNat-2025-image-metadata.rds) 
* [`ETF-EPT-iNat-2025.csv`](data/L4/ETF-EPT-iNat-2025.csv) iNaturalist observations of aquatic insects with validated taxonomic identifiaction, annotations derived from secondary image data, and DOIs and spatiotemporal metadata from iNaturalist.
  * Alternative format: [`ETF-EPT-iNat-2025.rds`](data/L4/ETF-EPT-iNat-2025.rds)
* [`excluded-observations-image-metadata.csv`](data/L4/excluded-observations-image-metadata.csv) DOIs and urls to download images from Amazon Web Services (AWS) for the observations contained in the [excluded-observations dataset](data/L4/excluded-observations.csv).
  * Alternative format: [`excluded-observations-image-metadata.rds`](data/L4/excluded-observations-image-metadata.rds)
* [`excluded-observations.csv`](data/L4/excluded-observations.csv) iNaturalist observations of aquatic insects that were excluded from the [ETF-EPT-iNat-2025 dataset](data/L4/ETF-EPT-iNat-2025.csv).
  * Alternative format: [`excluded-observations.rds`](data/L4/excluded-observations.rds)


#### [`misc/...`](misc)

* [`misc/legacy_code/...`](misc/legacy_code) Directory containing old code
* [`misc/annotation_tool_ss/...`](misc/annotation_tool_ss) Directory containing workflow screenshots of EPT Image Annotation Tool
* [`misc/web-data-visualizer/...`](misc/web-data-visualizer/) Directory containing code used to visualize datasets from this repository through GitHub Pages
* [`misc/workflow_figure.png`](misc/workflow_figure.png) Figure of dataset workflow process

#### [`scripts/...`](scripts)

##### [`scripts/L0`](scripts/L0) Scripts for raw data retrieval & filtering

* [`000_manual_data_downloads.qmd`](scripts/L0/000_manual_data_downloads.md) Metadata describing data sources that were manually downloaded or accessed virtually in the scripts within this directory 
* [`001_retrieve_EPT_obs_iNat_API.qmd`](scripts/L0/001_retrieve_EPT_obs_iNat_API.qmd) Script to retrieve observation information for 3 aquatic insect taxon (EPT) from the iNaturalist API.
* [`002_combine_raw_EPT.qmd`](scripts/L0/002_combine_raw_EPT.qmd) Script to combine the raw observations of 3 aquatic insect taxon (EPT) pulled from the iNaturalist API and remove duplicates.
* * [`003_spatial_filter_raw_EPT.py`](scripts/L0/003_spatial_filter_raw_EPT.py) Script to spatially filters the raw observerations of 3 aquatic insect taxon (EPT) to the study extent of the Eastern Temperature Forest.
* [`004_clean_raw_EPT.qmd`](scripts/L0/004_clean_raw_EPT.qmd) Script to apply main data quality control filters to observations of EPT in the Eastern Temperate Forests.

##### [`scripts/L1`](scripts/L1) Scripts for downloading images and annotating observations

* [`101_get_ETF_EPT_images.qmd`](scripts/L1/101_get_ETF_EPT_images.qmd) Script to prepare EPT data & download  images from AWS into a local drive.
* [`102_label_ETF_EPT_images_app.py`](scripts/L1/102_label_ETF_EPT_images_app.py) Script to launch a browser-based application for labelling EPT images with annotation labels (e.g., adult, immature)
* [`103_extract_ETF_EPT_annotations.qmd`](scripts/L1/103_extract_ETF_EPT_annotations.qmd) Script to parse and curate labels from the annotation process in the previous script.

##### [`scripts/L2`](scripts/L2) Scripts for summarizing data and figures 

* [`201_summarize_data_viz.qmd`](scripts/L2/201_summarize_data_viz.qmd) Script to create data summaries and visualizations of the dataset curation and workflow.
* [`202_quantify_label_time.qmd`](scripts/L2/202_quantify_label_time.qmd) Script to quantify the time spent labelling images.
* [`203_curate_acknowledgements.qmd`](scripts/L2/203_curate_acknowledgements.qmd) Script to curate a list of iNaturalist users whose identifications, observations, and annotations contributed to the observations used in this research.

##### [`scripts/L3`](scripts/L3) Scripts for taxonomic identification validation analysis

* [`301_upload_inat_api.qmd`](scripts/L3/301_upload_inat_api.qmd) Script to prepare and upload a dataset of identifications to iNaturalist.
* [`302_retrieve_updated_obs.qmd`](scripts/L3/302_retrieve_updated_obs.qmd) Script to retrieve observation information for aquatic insect taxon (EPT) from the iNaturalist API
* [`303_explore_updated_obs.qmd`](scripts/L3/303_explore_updated_obs.qmd) Script to explore updated observations and original observation for the identification validation analaysis

##### [`scripts/L4`](scripts/L4) Scripts to curate final datasets for reuse

* [`401_compile_final_dataset.qmd`](scripts/L4/401_compile_final_dataset.qmd) Script to compile the final ETF-EPT-iNat-2025 dataset, metadata, and excluded-observations dataset

## Abstract

Growing global threats to biodiversity and freshwater security underscore the importance of understanding, monitoring, and conserving aquatic ecosystems. Aquatic insects can provide ecosystem-wide insights through their role as bioindicators of freshwater health and drivers of aquatic-terrestrial linkages that shape riparian community dynamics. However, studying aquatic insect biology, ecology, and taxonomy at scale has been historically hindered by the scarcity of datasets combining validated taxonomic identification, spatiotemporal metadata, phenotypic traits, and sampling schemes. This information together could reveal broader ecological patterns across space and time, supporting efforts to track community shifts, forecast ecosystem changes, and mitigate threats to aquatic ecosystems. While participatory science platforms such as iNaturalist accumulate millions of images alongside species occurrence records, most analyses overlook the value of images for ecological study. To demonstrate the value of images on iNaturalist, we extracted ecological information incidentally captured within an image, known as secondary data, to build a human-verified, annotated dataset called ETF-EPT-iNat-2025, containing 78,258 aquatic insect observations across the Eastern Temperate Forests of North America from 2000 to 2025 for the orders of Ephemeroptera (mayflies), Plecoptera (stoneflies), and Trichoptera (caddisflies). Beyond order-level taxonomic identification, this dataset enriches standard occurrence records with secondary data, including ontogeny and organism evidence status (e.g., subimago exuviae, immature organism), species aggregations and interactions, and sampling techniques (e.g., observed via microscope, caught via dipnet). This dataset directly supports taxonomic, phenological, and trait-based research on aquatic insects and provides a human-validated dataset for ecological modelling and automated computer vision tasks. We conclude by highlighting the value of secondary data within images for supplementing existing low-abundant data with new information, particularly for data-deficient and non-charismatic taxa, and encourage ecological discovery through image review. We provide all code and data from our workflow to support the characterization and use of secondary data in ecological studies.