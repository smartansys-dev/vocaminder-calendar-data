# Step 3C — Regression validation
Extract into repository root. Run `node scripts/validate_accuracy.js`.
No dependencies beyond Node.js and existing Step 3A/3B files. No production data is written.
Tests cover 2025–2050 start years, daily continuity, month lengths, year labels, leap days, lookup round trips, reproducibility and timezone independence. The eight historical fixtures are copied from Step 3A; their independent provenance has not been reverified. Year labels are regression expectations, not independent historical evidence. Lookup round trips test generated mappings, not Android conversion code. This does not certify astronomical accuracy or the complete 60-year cycle. Do not promote candidates based solely on this test.
