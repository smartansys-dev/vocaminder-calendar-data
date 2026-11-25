import json
from pathlib import Path
from datetime import date, timedelta
from jsonschema import Draft202012Validator, FormatChecker
ROOT=Path(__file__).resolve().parents[1]
def load(p): return json.loads(p.read_text(encoding='utf-8'))
def require(ok,msg):
    if not ok: raise ValueError(msg)
def validate(p):
    x=load(p)
    Draft202012Validator(load(ROOT/'schemas/tamil_calendar_schema.json'),format_checker=FormatChecker()).validate(x)
    y=x['tamilYear']; a=y['startYear']; b=y['endYear']; ident=f'{a}-{b}'
    require(b==a+1 and y['id']==ident and p.name==f'tamil_calendar_{a}_{b}.json','Year identity mismatch')
    start=date.fromisoformat(x['months'][0]['startDate']); cursor=start
    require(start.year==a and start.month==4,'Year must start in April')
    for i,m in enumerate(x['months'],1):
        require(m['tamilMonth']==i and date.fromisoformat(m['startDate'])==cursor,'Month sequence/gap')
        require(m['totalDays']==len(m['days']),'Month length mismatch')
        for j,d in enumerate(m['days'],1):
            require(d['gregorianDate']==cursor.isoformat(),'Daily date gap or duplicate')
            t=d['tamilDate']; require((t['day'],t['monthNumber'],t['month'],t['monthEnglish'],t['year'],t['yearId'])==(j,i,m['tamilName'],m['englishName'],y['name'],ident),'Tamil date mismatch')
            require(d['dayOfWeek']['english']==['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][cursor.weekday()],'Weekday mismatch')
            cursor+=timedelta(days=1)
        require(m['endDate']==(cursor-timedelta(days=1)).isoformat(),'Month end mismatch')
    require(cursor.isoformat()==x['nextYearStart'] and cursor.year==b and cursor.month==4,'Next year boundary mismatch')
    return {'yearId':ident,'tamilYear':y['name'],'startDate':start.isoformat(),'endDate':(cursor-timedelta(days=1)).isoformat(),'dataVersion':x['dataVersion'],'file':p.name}
def main():
    entries=[validate(p) for p in sorted((ROOT/'calendar').glob('tamil_calendar_*_*.json'))]
    for a,b in zip(entries,entries[1:]):
        require(a['endDate']<b['startDate'],'Overlapping years')
        if int(b['yearId'][:4])==int(a['yearId'][:4])+1: require(date.fromisoformat(a['endDate'])+timedelta(days=1)==date.fromisoformat(b['startDate']),'Adjacent year gap')
    expected={'schemaVersion':1,'calendarId':'tamil_solar_vakya_chennai','availableYears':entries}
    require(load(ROOT/'calendar/calendar_index.json')==expected,'Index does not match yearly files')
    print(f'Validated {len(entries)} yearly files (structural checks only)')
if __name__=='__main__': main()
