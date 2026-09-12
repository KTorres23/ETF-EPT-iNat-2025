# 103_clip_ecoregions.py
# Karina Torres
# Southern Illinois University
# github.com/KTorres23
# date: 2026-09-12 # last modified
# date-format: "yyyy-MM-dd"
# abstract: This script spatially clips the NA L1 ecoregion to only within the USA


# --- REQUIREMENTS ---
# 1. Must have ArcGIS Pro installed;
# 2. Python interpreter must be pointing to the python.exe in ArcGIS Pro
#    (e.g. C:\Program Files\ArcGIS\Pro\bin\Python\envs\arcgispro-py3\python.exe)


# --- Setup environment ---
import arcpy
from arcpy.sa import *
from pathlib import Path

arcpy.env.overwriteOutput = True  # Allow arcpy to overwrite existing files
arcpy.env.cellSize = None
arcpy.env.snapRaster = None
arcpy.env.nodata = "-9999"  # Universal no data value

# 4326 is the WKID for World Geodetic System 1984
target_sr = arcpy.SpatialReference(4326)

# --- Define paths ---
# Root directory structure based on your workflow
root_dir = Path(__file__).resolve().parent.parent.parent

# Define inputs
ecoregion_shp_dir = root_dir / "data/L0/000a_na_cec_eco_l1/NA_CEC_Eco_Level1.shp"
us_states_url = "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_States_Generalized_Boundaries/FeatureServer/0"

# Define outputs
output_folder = root_dir / "data/L1/103_EUSA_ecoregion_masks"
shp_folder = output_folder / "shp"
tif_30m_folder = output_folder / "30m"
tif_1km_folder = output_folder / "1km"

# Make dir if doesn't exist already
output_folder.mkdir(parents=True, exist_ok=True)
shp_folder.mkdir(parents=True, exist_ok=True)
tif_30m_folder.mkdir(parents=True, exist_ok=True)
tif_1km_folder.mkdir(parents=True, exist_ok=True)

out_eco_shp = str(shp_folder / "103a_EUSA_ecoregion_mask.shp")
out_eco_30m_tif = str(tif_30m_folder / "103b_EUSA_ecoregion_30m_mask.tif")
out_eco_1km_tif = str(tif_1km_folder / "103c_EUSA_ecoregion_1km_mask.tif")

# --- Step 1: Buffer USA Boundaries & Project ---
print("Buffering USA States by 10km...")
arcpy.analysis.PairwiseBuffer(
    in_features=us_states_url,
    out_feature_class="memory/us_buffer_raw",
    buffer_distance_or_field="10 Kilometers",
)

arcpy.management.Project(
    in_dataset="memory/us_buffer_raw",
    out_dataset="memory/us_buffer_projected",
    out_coor_system=target_sr,
)

# --- Step 2: Filter NA ecoregions to EUSA & Project---
print("Filtering ecoregions to EASTERN TEMPERATE FORESTS...")
arcpy.management.MakeFeatureLayer(
    in_features=str(ecoregion_shp_dir),
    out_layer="memory/eco_layer",
    where_clause="NA_L1NAME = 'EASTERN TEMPERATE FORESTS'",
)

arcpy.management.Project(
    in_dataset="memory/eco_layer",
    out_dataset="memory/eco_layer_projected",
    out_coor_system=target_sr,
)

# --- Step 3: Clip Ecoregion Shapefile ---
print("Clipping ecoregion shapefile to USA boundaries...")
arcpy.analysis.PairwiseClip(
    in_features="memory/eco_layer_projected",
    clip_features="memory/us_buffer_projected",
    out_feature_class=out_eco_shp,
)

print(f"\nSuccess! Masked shapefile exported to: {out_eco_shp}")

# --- Step 4: Convert ecoregion shapefile to raster ---
print("Dissolving ecoregion SHP...")
arcpy.management.Dissolve(
    in_features=out_eco_shp, out_feature_class="memory/eco_dissolved"
)

print("Adding mask value field...")
arcpy.management.AddField(
    in_table="memory/eco_dissolved", field_name="MaskValue", field_type="SHORT"
)

arcpy.management.CalculateField(
    in_table="memory/eco_dissolved",
    field="MaskValue",
    expression="1",
    expression_type="PYTHON3",
)

# Establish no data value for new rasters
arcpy.env.nodata = "-9999"

print("Creating 30m ecoregion raster...")
arcpy.env.cellSize = 30
arcpy.conversion.PolygonToRaster(
    in_features="memory/eco_dissolved",
    value_field="MaskValue",
    out_rasterdataset="memory/eco_30m_raster_temp",
    cell_assignment="MAXIMUM_AREA",
    cellsize=30,
)

print("Calculating stats for temp raster...")
arcpy.management.CalculateStatistics("memory/eco_30m_raster_temp")

# Print the NoData value to the console
desc = arcpy.Describe("memory/eco_30m_raster_temp")
print(f"DEBUG: The NoData value for raster is: {desc.noDataValue}")

final_30m_raster = arcpy.sa.SetNull(
    "memory/eco_30m_raster_temp", "memory/eco_30m_raster_temp", "VALUE = 0"
)

print(f"Exporting final 30m tif file to disk...")
arcpy.management.CopyRaster(
    # in_raster="memory/eco_30m_raster_temp",
    in_raster=final_30m_raster,
    out_rasterdataset=out_eco_30m_tif,
    pixel_type="16_BIT_SIGNED",
    nodata_value="-9999",
)


print("Creating 1km ecoregion raster...")
arcpy.env.cellSize = 1000
arcpy.conversion.PolygonToRaster(
    in_features="memory/eco_dissolved",
    value_field="MaskValue",
    out_rasterdataset="memory/eco_1km_raster_temp",
    cell_assignment="MAXIMUM_AREA",
    cellsize=1000,
)


final_1km_raster = arcpy.sa.SetNull(
    "memory/eco_1km_raster_temp", "memory/eco_1km_raster_temp", "VALUE = 0"
)


print(f"Exporting final 1km tif file to disk...")
arcpy.management.CopyRaster(
    in_raster=final_1km_raster,
    out_rasterdataset=out_eco_1km_tif,
    pixel_type="16_BIT_SIGNED",
    nodata_value="-9999",
)


# --- Cleanup ---
arcpy.management.Delete("memory")
