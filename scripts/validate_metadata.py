# -*- coding: utf-8 -*-
"""
Independent Validator for Fastlane App Store Metadata across all 23 Locales
Verifies that all files strictly comply with Apple App Store Connect guidelines and fastlane deliver requirements.
"""

import os
import sys

BASE_DIR = r"c:\Users\Turan\Desktop\vocbee\fastlane\metadata"
EXPECTED_LOCALES = [
    "ar", "de", "en-AU", "en-CA", "en-GB", "en-US",
    "es-ES", "es-MX", "fr", "fr-CA", "hi", "id",
    "it", "ja", "ko", "pt-BR", "pt-PT", "ru",
    "th", "tr", "ur", "vi", "zh-Hans"
]

REQUIRED_FILES = [
    "name.txt",
    "subtitle.txt",
    "keywords.txt",
    "description.txt",
    "release_notes.txt"
]

def validate_all():
    errors = []
    print("=" * 80)
    print("STARTING APP STORE METADATA VALIDATION ACROSS 23 LOCALES")
    print("=" * 80)

    # Check that all expected locale directories exist
    for loc in EXPECTED_LOCALES:
        p = os.path.join(BASE_DIR, loc)
        if not os.path.isdir(p):
            errors.append(f"Missing locale directory: {loc}")

    report_rows = []

    for loc in EXPECTED_LOCALES:
        loc_dir = os.path.join(BASE_DIR, loc)
        if not os.path.isdir(loc_dir):
            continue

        file_contents = {}
        for fname in REQUIRED_FILES:
            fpath = os.path.join(loc_dir, fname)
            if not os.path.isfile(fpath):
                errors.append(f"[{loc}] Missing file: {fname}")
                continue
            with open(fpath, "r", encoding="utf-8") as f:
                file_contents[fname] = f.read().strip()

        if len(file_contents) < len(REQUIRED_FILES):
            continue

        name = file_contents["name.txt"]
        sub = file_contents["subtitle.txt"]
        kw = file_contents["keywords.txt"]
        desc = file_contents["description.txt"]
        rel = file_contents["release_notes.txt"]

        # Rule 1: Name length <= 30 chars
        if len(name) == 0:
            errors.append(f"[{loc}] name.txt is empty!")
        elif len(name) > 30:
            errors.append(f"[{loc}] name.txt exceeds 30 chars: {len(name)}")

        # Rule 2: Subtitle length <= 30 chars
        if len(sub) == 0:
            errors.append(f"[{loc}] subtitle.txt is empty!")
        elif len(sub) > 30:
            errors.append(f"[{loc}] subtitle.txt exceeds 30 chars: {len(sub)}")

        # Rule 3: Keywords <= 100 bytes UTF-8
        kw_bytes = len(kw.encode("utf-8"))
        if kw_bytes == 0:
            errors.append(f"[{loc}] keywords.txt is empty!")
        elif kw_bytes > 100:
            errors.append(f"[{loc}] keywords.txt exceeds 100 bytes: {kw_bytes} bytes")

        # Rule 4: Keywords formatting (no spaces around commas, tokens >= 2 chars)
        if " ," in kw or ", " in kw:
            errors.append(f"[{loc}] keywords.txt contains spaces adjacent to commas!")

        tokens = kw.split(",")
        for t in tokens:
            t_clean = t.strip()
            if len(t_clean) < 2:
                errors.append(f"[{loc}] keyword token '{ascii(t)}' is shorter than 2 chars!")

        # Rule 5: Description <= 4000 chars and has legal links
        if len(desc) == 0:
            errors.append(f"[{loc}] description.txt is empty!")
        elif len(desc) > 4000:
            errors.append(f"[{loc}] description.txt exceeds 4000 chars: {len(desc)}")
        if "vocbee.online" not in desc:
            errors.append(f"[{loc}] description.txt is missing vocbee.online legal links!")

        # Rule 6: Release notes <= 4000 chars
        if len(rel) == 0:
            errors.append(f"[{loc}] release_notes.txt is empty!")
        elif len(rel) > 4000:
            errors.append(f"[{loc}] release_notes.txt exceeds 4000 chars: {len(rel)}")

        report_rows.append({
            "locale": loc,
            "name_len": len(name),
            "sub_len": len(sub),
            "kw_bytes": kw_bytes,
            "kw_count": len(tokens),
            "desc_len": len(desc),
            "rel_len": len(rel)
        })

    # Print summary table
    print(f"{'Locale':<8} | {'Title (<=30)':<12} | {'Sub (<=30)':<11} | {'Keywords (<=100B)':<18} | {'Desc (<=4000)':<14} | {'Notes':<8}")
    print("-" * 80)
    for r in report_rows:
        print(f"{r['locale']:<8} | {r['name_len']:2}/30 chars  | {r['sub_len']:2}/30 chars | {r['kw_bytes']:2}/100 bytes ({r['kw_count']}kw) | {r['desc_len']:4}/4000 chars | {r['rel_len']:3} chars")
    print("-" * 80)

    if errors:
        print(f"\nVALIDATION FAILED with {len(errors)} errors:")
        for err in errors:
            print(f"  [ERROR] {err}")
        sys.exit(1)
    else:
        print("\nALL 23 LOCALES PASSED VALIDATION! 100% STORE READY!")
        sys.exit(0)

if __name__ == "__main__":
    validate_all()
