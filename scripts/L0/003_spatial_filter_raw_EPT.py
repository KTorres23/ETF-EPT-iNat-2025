# 003_spatial_filter_raw_EPT.py
# Karina Torres
# Southern Illinois University
# github.com/KTorres23
# date: 2026-09-12 # last modified
# date-format: "yyyy-MM-dd"
# abstract: This script spatially filters the raw observerations of 3 aquatic
#           insect taxon (EPT) to the study extent of the Eastern Temperature
#           Forest (ETF) from the U.S. EPA's Ecoregions of North America. The
#           data is saved as a SHP.


# --- REQUIREMENTS ---
# 1. Must have ArcGIS Pro installed;
# 2. Python interpreter must be pointing to the python.exe in ArcGIS Pro
#    (e.g. C:\Program Files\ArcGIS\Pro\bin\Python\envs\arcgispro-py3\python.exe)


# --- Setup environment ---
import arcpy
from pathlib import Path

arcpy.env.overwriteOutput = True  # Allow arcpy to overwrite existing files


# --- Define paths ---

# Path to base folder
root_dir = Path(__file__).resolve().parent.parent.parent

# Define paths for input data
ecoregion_shp_dir = root_dir / "data/L0/000a_na_cec_eco_l1/NA_CEC_Eco_Level1.shp"
raw_EPT_shp_dir = root_dir / "data/L0/002b_raw_EPT_obs_shp/002b_raw_EPT_obs_shp.shp"

# Define paths for output data
output_folder = root_dir / "data/L0/003_raw_ETF_EPT_obs_shp"
output_folder.mkdir(parents=True, exist_ok=True)  # Make dir if doesn't exist already
ETF_EPT_shp = root_dir / "data/L0/003_raw_ETF_EPT_obs_shp/003_raw_ETF_EPT_obs.shp"


# --- Filter NA ecoregions to ETF ---
arcpy.management.MakeFeatureLayer(
    in_features=str(ecoregion_shp_dir),
    out_layer="eco_layer",
    where_clause="NA_L1NAME = 'EASTERN TEMPERATE FORESTS'",
)


# --- Get EPT points only in ETF ---
arcpy.analysis.PairwiseClip(
    in_features=str(raw_EPT_shp_dir),
    clip_features="eco_layer",
    out_feature_class=str(ETF_EPT_shp),
    cluster_tolerance=None,
)

print(f"Successfuly saved to {ETF_EPT_shp}")
