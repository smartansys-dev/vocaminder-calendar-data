from datetime import datetime, date
from zoneinfo import ZoneInfo
from validate_calendar import ROOT, validate, require
entries = [validate(p) for p in sorted((ROOT/'candidates').glob('tamil_calendar_*_*.json'))]
today = datetime.now(ZoneInfo('Asia/Kolkata')).date()
future = sum(date.fromisoformat(e['startDate']) > today for e in entries)
print(f'Candidate future full Tamil years: {future}')
require(future >= 10, 'Less than 10 future years; extend and verify engine before publication')
