"""Publish explicitly approved experimental data; never replace existing years."""
import argparse
from datetime import date, timedelta
from validate_calendar import ROOT, validate, require, main, load
import json

p = argparse.ArgumentParser()
p.add_argument('--approve-experimental', action='store_true', required=True)
a = p.parse_args()
main()  # existing index must be valid
calendar = ROOT / 'calendar'
files = sorted((ROOT / 'candidates').glob('tamil_calendar_*_*.json'))
require(len(files) == 26, 'Expected 26 candidates')
entries = [validate(f) for f in files]
require([e['yearId'] for e in entries] == [f'{y}-{y+1}' for y in range(2025,2051)], 'Unexpected coverage')
for x,y in zip(entries,entries[1:]):
    require(date.fromisoformat(x['endDate']) + timedelta(days=1) == date.fromisoformat(y['startDate']), 'Coverage gap')
for f in files:
    dest = calendar / f.name
    require(not dest.exists() or dest.read_bytes() == f.read_bytes(), f'Refusing overwrite: {dest}')
require(all(f.name in {c.name for c in files} for f in calendar.glob('tamil_calendar_*_*.json')), 'Unexpected existing year')
for f in files:
    dest = calendar / f.name
    if not dest.exists():
        dest.write_bytes(f.read_bytes())
index = {'schemaVersion':1,'calendarId':'tamil_solar_vakya_chennai','availableYears':entries}
(calendar/'calendar_index.json').write_bytes((json.dumps(index,ensure_ascii=False,indent=2)+'\n').encode('utf-8'))
main()
print('Prepared 26 experimental years for publication')
