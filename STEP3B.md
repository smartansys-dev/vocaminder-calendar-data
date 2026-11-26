# Step 3B — Experimental yearly JSON generation
Copy the two new scripts into the existing repository's scripts directory. No existing files need replacement. Run from the repository root:

    node scripts/generate_calendar.js --from 2025 --to 2027
    python -m pip install -r requirements.txt
    python scripts/validate_candidates.py

Single year: `node scripts/generate_calendar.js --year 2026`.
Experimental range: 2025–2050 inclusive. The generator uses the existing Step 3A engine and UTC date arithmetic. It writes only to candidates/, never calendar/. Identical reruns leave files unchanged; changed existing files are rejected rather than overwritten. generatedAt is null for reproducibility; dataVersion 1 is the initial candidate version. Optional Panchangam fields are null, including specialDays, because no complete observance dataset is verified. Tamil year labels use conventional cycle spellings; spelling variants are possible. Chennai is the intended reference metadata, not a claim that exact Chennai sunset was calculated. Structural validation does not prove astronomical accuracy. Do not publish candidates as verified or add them to the public calendar index until accuracy review. The existing legacy JSON remains unchanged. No Android changes.
