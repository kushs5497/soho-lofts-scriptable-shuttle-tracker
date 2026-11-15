// PATH arrivals for the SoHo Lofts Scriptable map.
// Runs in Scriptable (native Request), never inside the WebView.
// Public PANYNJ feed; no API key is required.
const FEED_URL = "https://www.panynj.gov/bin/portauthority/ridepath.json";
const STATION_CODES = {hoboken:"HOB",newport:"NEW"};
const DESTINATIONS = {
  HOB:[{id:"33S",name:"33rd Street"},{id:"WTC",name:"World Trade Center"}],
  NEW:[{id:"33S",name:"33rd Street"},{id:"WTC",name:"World Trade Center"},
       {id:"JSQ",name:"Journal Square"},{id:"HOB",name:"Hoboken"}]
};
let feedCache=null, cachedAt=0;

function headsignDestination(text) {
  const s=String(text||"").trim().toLowerCase();
  // Match the actual train destination, not a "via Hoboken" intermediate stop.
  if(/^33(?:rd)?\s*(?:st|street)\b/.test(s))return "33S";
  if(/^world\s+trade\s+center\b|^wtc\b/.test(s))return "WTC";
  if(/^journal\s+square\b|^jsq\b/.test(s))return "JSQ";
  if(/^hoboken\b/.test(s))return "HOB";
  return null;
}
async function getFeed(){
  if(feedCache && Date.now()-cachedAt<15000)return feedCache;
  const req=new Request(FEED_URL+"?t="+Date.now());
  req.timeoutInterval=12;
  req.headers={Accept:"application/json","Cache-Control":"no-cache"};
  const raw=await req.loadString();
  if(req.response && req.response.statusCode>=400)throw Error("PATH HTTP "+req.response.statusCode);
  const data=JSON.parse(raw);
  if(!data || !Array.isArray(data.results) || data.results.length===0)
    throw Error("PATH feed has no station predictions");
  feedCache=data;
  cachedAt=Date.now();
  return data;
}
function arrivalText(msg,now){
  const note=String(msg.arrivalTimeMessage||"").trim();
  const secs=Number(msg.secondsToArrival);
  const updated=Date.parse(String(msg.lastUpdated||""));
  if(Number.isFinite(updated) && Number.isFinite(secs) && String(msg.secondsToArrival||"").trim()!==""){
    const remaining=(updated+secs*1000-now)/1000;
    if(remaining< -45)return null;
    if(remaining<=35)return "Due";
    return Math.ceil(remaining/60)+" min";
  }
  if(/delay/i.test(note))return "Delayed";
  return note||null;
}

async function fetchArrivals(station){
  const code=STATION_CODES[station]||station;
  if(!DESTINATIONS[code])throw Error("Unknown PATH station: "+station);
  const data=await getFeed();
  const result=data.results.find(x=>x && String(x.consideredStation||"").toUpperCase()===code);
  if(!result)throw Error("PATH station missing from feed");
  const rows=DESTINATIONS[code].map(r=>({id:r.id,name:r.name,times:[]}));
  const byId={};for(const r of rows)byId[r.id]=r;
  const now=Date.now();
  let count=0,freshCount=0,latest=0;
  for(const direction of (Array.isArray(result.destinations)?result.destinations:[])){
    for(const m of (Array.isArray(direction.messages)?direction.messages:[])){
      if(!m)continue;
      count++;
      const updated=Date.parse(String(m.lastUpdated||""));
      // Do not silently display yesterday's or otherwise stale predictions.
      if(!Number.isFinite(updated)||now-updated>180000||updated-now>60000)continue;
      freshCount++;
      latest=Math.max(latest,updated);
      const id=headsignDestination(m.headSign);
      if(!id||!byId[id])continue;
      const display=arrivalText(m,now);
      if(!display)continue;
      let arrival=Infinity;
      const seconds=Number(m.secondsToArrival);
      if(String(m.secondsToArrival||"").trim()!==""&&Number.isFinite(seconds))
        arrival=updated+seconds*1000;
      byId[id].times.push({text:display,at:arrival});
    }
  }
  if(count>0&&freshCount===0)throw Error("PATH predictions are stale");
  for(const row of rows){
    row.times.sort((a,b)=>a.at-b.at);
    row.times=row.times.slice(0,2).map(x=>x.text);
  }
  return {station:code,rows,updatedAt:latest||null,
    status:count===0?"No upcoming trains reported":"Live PATH arrival predictions"};
}
module.exports.fetchArrivals=fetchArrivals;
