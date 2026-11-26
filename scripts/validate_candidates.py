"""Validate experimental files without changing the public calendar index."""
from datetime import date, timedelta
from validate_calendar import ROOT, validate, require

files = sorted((ROOT / 'candidates').glob('tamil_calendar_*_*.json'))
require(bool(files), 'No candidate files; run generate_calendar.js first')
entries = [validate(p) for p in files]
for a, b in zip(entries, entries[1:]):
    require(a['endDate'] < b['startDate'], 'Overlapping years')
    if int(b['yearId'][:4]) == int(a['yearId'][:4]) + 1:
        require(date.fromisoformat(a['endDate']) + timedelta(days=1) == date.fromisoformat(b['startDate']), 'Adjacent year gap')
print(f'Validated {len(entries)} candidate yearly files (structural checks only)')
