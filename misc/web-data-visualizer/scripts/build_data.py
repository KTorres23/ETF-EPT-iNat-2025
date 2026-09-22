#!/usr/bin/env python3
"""
Build script to preprocess and optimize ETF-EPT-iNat-2025 datasets
for the static GitHub Pages web dashboard.
"""

import os
import csv
import json
from collections import Counter

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
DATA_L4_DIR = os.path.join(WORKSPACE_ROOT, "data", "L4")
DATA_L2_DIR = os.path.join(WORKSPACE_ROOT, "data", "L2")
OUTPUT_DIR = os.path.join(WORKSPACE_ROOT, "misc", "web-data-visualizer", "data")

def ensure_dir(d):
    os.makedirs(d, exist_ok=True)

def build_contributors():
    print("Building contributors index...")
    # 203a: users list
    user_ids_203a = set()
    path_203a = os.path.join(DATA_L2_DIR, "203a_ETF_EPT_inat_users.csv")
    if os.path.exists(path_203a):
        with open(path_203a, "r", encoding="utf-8") as f:
            reader = csv.reader(f)
            next(reader, None)  # header: user.id
            for row in reader:
                if row:
                    user_ids_203a.add(row[0].strip())

    # 203b: contribution details
    user_stats = {}
    path_203b = os.path.join(DATA_L2_DIR, "203b_ETF_EPT_inat_contributed_info.csv")
    with open(path_203b, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            uid = row["user.id"].strip()
            ctype = row["contribution_type"].strip().lower()
            if uid not in user_stats:
                user_stats[uid] = [0, 0, 0]  # [observations, identifications, annotations]
            if ctype == "observation":
                user_stats[uid][0] += 1
            elif ctype == "identification":
                user_stats[uid][1] += 1
            elif ctype == "annotation":
                user_stats[uid][2] += 1

    # Add any users from 203a that might not have entries in 203b
    for uid in user_ids_203a:
        if uid not in user_stats:
            user_stats[uid] = [0, 0, 0]

    # Calculate leaderboard (top contributors)
    top_overall = sorted(user_stats.items(), key=lambda x: sum(x[1]), reverse=True)[:25]
    top_obs = sorted(user_stats.items(), key=lambda x: x[1][0], reverse=True)[:15]
    top_id = sorted(user_stats.items(), key=lambda x: x[1][1], reverse=True)[:15]
    top_ann = sorted(user_stats.items(), key=lambda x: x[1][2], reverse=True)[:15]

    def format_leader(items):
        return [{"userId": k, "obs": v[0], "id": v[1], "ann": v[2], "total": sum(v)} for k, v in items]

    result = {
        "totalContributors": len(user_stats),
        "contributors": user_stats,  # uid -> [obs, id, ann]
        "leaderboards": {
            "overall": format_leader(top_overall),
            "observations": format_leader(top_obs),
            "identifications": format_leader(top_id),
            "annotations": format_leader(top_ann)
        }
    }

    out_path = os.path.join(OUTPUT_DIR, "contributors_index.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, separators=(",", ":"))
    print(f"Saved {out_path} ({os.path.getsize(out_path) / 1024:.1f} KB)")


def build_excluded_observations():
    print("Building excluded observations index...")
    # Map image URLs
    img_map = {}
    img_csv = os.path.join(DATA_L4_DIR, "excluded-observations-image-metadata.csv")
    if os.path.exists(img_csv):
        with open(img_csv, "r", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                oid = row["observation_id"].strip()
                if oid not in img_map:
                    img_map[oid] = row["aws_image_url"].strip()

    excluded = []
    obs_csv = os.path.join(DATA_L4_DIR, "excluded-observations.csv")
    with open(obs_csv, "r", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            oid = row["observation_id"].strip()
            item = {
                "observation_id": int(oid),
                "taxon_order_id": row["taxon_order_id"],
                "inaturalist_url": row["inaturalist_url"],
                "odd_cases": row["odd_cases"] if row["odd_cases"] != "NA" else "",
                "fave_image": row["fave_image"] == "TRUE",
                "cannot_identify": row["cannot_identify"] == "TRUE",
                "inat_id_corrected": row["inat_id_corrected"] == "TRUE",
                "obs_issues": row["obs_issues"] if row["obs_issues"] != "NA" else "",
                "order_id_corrected": row["order_id_corrected"] if row["order_id_corrected"] != "NA" else "",
                "lat": float(row["lat"]) if row["lat"] and row["lat"] != "NA" else None,
                "long": float(row["long"]) if row["long"] and row["long"] != "NA" else None,
                "positional_accuracy": int(float(row["positional_accuracy"])) if row["positional_accuracy"] and row["positional_accuracy"] != "NA" else None,
                "quality_grade": row["quality_grade"],
                "observed_date": row["observed_date"],
                "uuid": row["uuid"],
                "license_code": row["license_code"],
                "observer_id": int(row["observer_id"]) if row["observer_id"] and row["observer_id"] != "NA" else None,
                "image_url": img_map.get(oid, "")
            }
            excluded.append(item)

    out_path = os.path.join(OUTPUT_DIR, "excluded_observations.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(excluded, f, separators=(",", ":"))
    print(f"Saved {out_path} ({len(excluded)} observations, {os.path.getsize(out_path) / 1024:.1f} KB)")


def build_curated_observations():
    print("Building curated observations and metadata...")
    # Load first image per observation
    img_map = {}
    img_csv = os.path.join(DATA_L4_DIR, "ETF-EPT-iNat-2025-image-metadata.csv")
    if os.path.exists(img_csv):
        with open(img_csv, "r", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                oid = row["observation_id"].strip()
                if oid not in img_map:
                    # Extract photo id from aws_image_url:
                    # format: https://inaturalist-open-data.s3.amazonaws.com/photos/{photo_id}/small.jpg
                    url = row["aws_image_url"].strip()
                    parts = url.split("/")
                    if "photos" in parts:
                        p_idx = parts.index("photos")
                        if len(parts) > p_idx + 1:
                            img_map[oid] = parts[p_idx + 1]
                        else:
                            img_map[oid] = url
                    else:
                        img_map[oid] = url

    order_counts = Counter()
    stage_counts = Counter()
    quality_counts = Counter()
    technique_counts = Counter()
    evidence_counts = Counter()
    license_counts = Counter()

    records_compact = []
    columns = [
        "observation_id",
        "taxon_order_id",
        "life_stage",
        "evidence_type",
        "collection_technique",
        "fave_image",
        "quality_grade",
        "observed_date",
        "lat",
        "long",
        "positional_accuracy",
        "observer_id",
        "license_code",
        "odd_cases",
        "flags",
        "photo_id"
    ]

    obs_csv = os.path.join(DATA_L4_DIR, "ETF-EPT-iNat-2025.csv")
    with open(obs_csv, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            oid = row["observation_id"].strip()
            order = row["taxon_order_id"]
            stage = row["life_stage"]
            qg = row["quality_grade"]
            tech = row["collection_technique"]
            evi = row["evidence_type"]
            lic = row["license_code"]

            order_counts[order] += 1
            stage_counts[stage] += 1
            quality_counts[qg] += 1
            technique_counts[tech] += 1
            evidence_counts[evi] += 1
            license_counts[lic] += 1

            # Bitmask for flags:
            # bit 0: multiple_specimen_present
            # bit 1: human_present
            # bit 2: preserved_specimen
            # bit 3: interaction_predation
            # bit 4: interaction_flower
            # bit 5: interaction_reproduction
            # bit 6: interaction_fungus_parasitism
            flg = 0
            if row["multiple_specimen_present"] == "TRUE": flg |= 1
            if row["human_present"] == "TRUE": flg |= 2
            if row["preserved_specimen"] == "TRUE": flg |= 4
            if row["interaction_predation"] == "TRUE": flg |= 8
            if row["interaction_flower"] == "TRUE": flg |= 16
            if row["interaction_reproduction"] == "TRUE": flg |= 32
            if row["interaction_fungus_parasitism"] == "TRUE": flg |= 64

            photo_id = img_map.get(oid, "")

            lat_val = round(float(row["lat"]), 5) if row["lat"] and row["lat"] != "NA" else None
            lng_val = round(float(row["long"]), 5) if row["long"] and row["long"] != "NA" else None
            acc_val = int(float(row["positional_accuracy"])) if row["positional_accuracy"] and row["positional_accuracy"] != "NA" else None
            uid_val = int(row["observer_id"]) if row["observer_id"] and row["observer_id"] != "NA" else None

            records_compact.append([
                int(oid),
                order,
                stage,
                evi,
                tech,
                1 if row["fave_image"] == "TRUE" else 0,
                qg,
                row["observed_date"],
                lat_val,
                lng_val,
                acc_val,
                uid_val,
                lic,
                row["odd_cases"] if row["odd_cases"] != "NA" else "",
                flg,
                photo_id
            ])

    # Metadata & filter facets
    meta = {
        "totalObservations": len(records_compact),
        "columns": columns,
        "counts": {
            "byOrder": dict(order_counts),
            "byStage": dict(stage_counts),
            "byQuality": dict(quality_counts),
            "byTechnique": dict(technique_counts),
            "byEvidence": dict(evidence_counts),
            "byLicense": dict(license_counts)
        },
        "flagDefinitions": [
            "multiple_specimen_present",
            "human_present",
            "preserved_specimen",
            "interaction_predation",
            "interaction_flower",
            "interaction_reproduction",
            "interaction_fungus_parasitism"
        ]
    }

    meta_path = os.path.join(OUTPUT_DIR, "curated_metadata.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
    print(f"Saved {meta_path} ({os.path.getsize(meta_path) / 1024:.1f} KB)")

    # Sample preview of first 100 observations for instant zero-latency first render
    sample_path = os.path.join(OUTPUT_DIR, "curated_sample.json")
    with open(sample_path, "w", encoding="utf-8") as f:
        json.dump(records_compact[:100], f, separators=(",", ":"))
    print(f"Saved {sample_path} (100 sample items, {os.path.getsize(sample_path) / 1024:.1f} KB)")

    # Full data array
    full_path = os.path.join(OUTPUT_DIR, "curated_observations.json")
    with open(full_path, "w", encoding="utf-8") as f:
        json.dump(records_compact, f, separators=(",", ":"))
    print(f"Saved {full_path} ({len(records_compact)} records, {os.path.getsize(full_path) / 1024 / 1024:.2f} MB)")


if __name__ == "__main__":
    ensure_dir(OUTPUT_DIR)
    build_contributors()
    build_excluded_observations()
    build_curated_observations()
    print("Done generating dashboard data files!")
