// SoHo Lofts Scriptable module; loaded by GitHub launcher.
const NY="America/New_York",SOHO=[-74.0451,40.7332],HOB=[-74.029028,40.73575],NPT=[-74.03476,40.7268];
const TOKEN="https://fim.api.us.fleetmatics.com/token",PLOTS="https://reveal.us.vzconnect.com/plot/Plot/GetVehiclePlotsForUserWithMetadata";
const KEYU="soho-lofts-reveal-user-v11",KEYP="soho-lofts-reveal-pass-v11";
const COLORS={moving:"#2563eb",idle:"#eab308",stopped:"#64748b"};
const SOHO_LOGO="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTkBtP0Tuh9VG-ATuApuApK_5mtOFCwTeisS-y7xZoKZA&s";
const PATH_LOGO="https://upload.wikimedia.org/wikipedia/commons/f/f3/PATH_logo.svg";
const OLD_AM=[["06:00",1],["06:10",2],["06:20",1],["06:30",2],["06:40",3],["06:50",1],["07:00",2],["07:10",3],["07:20",1],["07:30",2],["07:40",3],["07:50",1],["08:00",2],["08:10",3],["08:20",1],["08:30",2],["08:40",3],["08:50",1],["09:00",2],["09:10",3],["09:20",1],["09:30",2],["09:45",3],["10:00",2]];
const OLD_PM=[["15:30",3],["15:50",3],["16:10",3],["16:30",1],["16:40",3],["16:50",1],["17:00",3],["17:10",2],["17:20",1],["17:30",3],["17:40",2],["17:50",1],["18:00",3],["18:10",2],["18:20",1],["18:30",3],["18:40",2],["18:50",1],["19:00",3],["19:10",2],["19:20",1],["19:30",3],["19:40",2],["19:50",1],["20:00",2],["20:10",1],["20:20",2],["20:30",1],["20:50",2]];
const LATE=[["21:10",2],["21:30",2],["21:50",2],["22:10",2],["22:30",2],["22:50",2]];
const SAT=["17:30","17:50","18:10","18:30","18:50","19:10","19:30","19:50","20:10","20:30","20:50","21:10","21:30","21:50","22:10","22:30","22:50"];
const AM={1:["06:00","06:30","07:00","07:30","08:00","08:30","09:00","09:30"],2:["06:15","06:45","07:15","07:45","08:15","08:45","09:15","09:45","10:15"],3:["06:40","07:10","07:40","08:10","08:40","09:10","09:40"]};
const PM={hob1:["16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00","20:30"],soh1:["16:45","17:15","17:45","18:15","18:45","19:15","19:45","20:15"],hob2:["17:15","17:45","18:15","18:45","19:15","19:45","20:15","20:45","21:15"],soh2:["17:30","18:00","18:30","19:00","19:30","20:00","20:30","21:00"],npt3:["15:20","15:50","16:20","16:50","17:20","17:50","18:20","18:50","19:20"],soh3:["15:35","16:05","16:35","17:05","17:35","18:05","18:35","19:05"]};
const clock=new Intl.DateTimeFormat("en-US",{timeZone:NY,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"});
const displayClock=new Intl.DateTimeFormat("en-US",{hour:"numeric",minute:"2-digit",hour12:true});
function parts(d){const p={};for(const v of clock.formatToParts(d))if(v.type!=="literal")p[v.type]=Number(v.value);return p;}
function dateAt(p,t){const a=t.split(":").map(Number),want=Date.UTC(p.year,p.month-1,p.day,a[0],a[1]);let n=want;for(let i=0;i<4;i++){const q=parts(new Date(n)),diff=want-Date.UTC(q.year,q.month-1,q.day,q.hour,q.minute);n+=diff;if(!diff)break;}return new Date(n);}
function schedule(now){
 const p=parts(now),dow=new Date(Date.UTC(p.year,p.month-1,p.day)).getUTCDay(),key=p.year+"-"+String(p.month).padStart(2,"0")+"-"+String(p.day).padStart(2,"0"),temp=dow>0&&dow<6&&key>="2026-11-16",events=[];
 function add(times,bus,origin,dest,phase){for(const t of times){const d=dateAt(p,t);events.push({at:d.getTime(),label:displayClock.format(d),bus,origin,dest,phase});}}
 if(dow===6)add(SAT,1,"soho","hoboken","evening");
 else if(dow&& !temp){OLD_AM.forEach(x=>add([x[0]],x[1],"soho","hoboken","morning"));OLD_PM.concat(dow>=4?LATE:[]).forEach(x=>add([x[0]],x[1],"hoboken","soho","evening"));}
 else if(temp){for(const b of [1,2,3])add(AM[b],b,"soho",b===3?"newport":"hoboken","morning");
 add(PM.hob1,1,"hoboken","soho","evening");add(PM.soh1,1,"soho","hoboken","evening");
 add(PM.hob2.concat(dow>=4?["21:45","22:15"]:[]),2,"hoboken","soho","evening");add(PM.soh2.concat(dow>=4?["21:30","22:00"]:[]),2,"soho","hoboken","evening");
 add(PM.npt3,3,"newport","soho","evening");add(PM.soh3,3,"soho","newport","evening");}
 events.sort((a,b)=>a.at-b.at||a.bus-b.bus);return {p,dow,temp,events};
}
function distance(a,b,c,d){const r=Math.PI/180,x=(c-a)*r,y=(d-b)*r,k=Math.sin(x/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin(y/2)**2;return 12742000*Math.asin(Math.min(1,Math.sqrt(k)));}
async function locationChoice(){
 try{
  Location.setAccuracyToHundredMeters();const loc=await Location.current(),geo=await Location.reverseGeocode(loc.latitude,loc.longitude,"en_US");
  const name=String((geo[0]||{}).administrativeArea||"").toLowerCase();let region=null;
  if(name==="nj"||name==="new jersey")region="nj";if(name==="ny"||name==="new york")region="ny";
  if(!region)throw Error("Location state unknown");
  const h=distance(loc.latitude,loc.longitude,HOB[1],HOB[0]),n=distance(loc.latitude,loc.longitude,NPT[1],NPT[0]);
  const stop=region==="nj"&&!(Math.abs(h-n)<(loc.horizontalAccuracy||0))?(h<=n?"hoboken":"newport"):null;
  const result={region,stop,at:Date.now()};Keychain.set("soho-shuttle-location-choice-v17",JSON.stringify(result));return result;
 }catch(err){
  console.warn("Location fallback: "+err);
  try{const c=JSON.parse(Keychain.get("soho-shuttle-location-choice-v17"));if(Date.now()-c.at<600000)return c;}catch(_){}
  return {region:"unknown",stop:null};
 }
}
async function widget(tap){
 const now=new Date(),s=schedule(now),w=new ListWidget();w.setPadding(2,5,2,5);w.spacing=1;
 let title="",primary="",secondary="";
 if(s.dow===0){primary="Call concierge for shuttle";secondary=displayClock.format(dateAt(s.p,"10:00"))+" – "+displayClock.format(dateAt(s.p,"18:00"));}
 else{
  let rows=[],setting=String((typeof args!=="undefined"&&args.widgetParameter)||"auto").trim().toLowerCase(),cutoff=now.getTime();
  if(!["auto","soho","hoboken","newport","all"].includes(setting))setting="auto";
  if(setting!=="auto"){title=setting==="all"?"ALL DEPARTURES":"FROM "+setting.toUpperCase();rows=s.events.filter(e=>e.at>=cutoff&&(setting==="all"||e.origin===setting));}
  else if(s.dow===6){title="SOHO → HOBOKEN";rows=s.events.filter(e=>e.at>=cutoff);}
  else{
   const upcomingAM=s.events.filter(e=>e.phase==="morning"&&e.at>=cutoff);
   if(upcomingAM.length){title=s.temp?"SOHO → PATH":"SOHO → HOBOKEN";rows=upcomingAM;}
   else if(!s.temp){title="HOBOKEN → SOHO";rows=s.events.filter(e=>e.phase==="evening"&&e.at>=cutoff);}
   else{
    const loc=await locationChoice();let stop;
    if(loc.region==="nj"&&loc.stop){
     stop=loc.stop;rows=s.events.filter(e=>e.phase==="evening"&&e.origin===stop&&e.at>=cutoff);
     if(!rows.length){stop=stop==="hoboken"?"newport":"hoboken";rows=s.events.filter(e=>e.phase==="evening"&&e.origin===stop&&e.at>=cutoff);}
    }else{
     cutoff+=600000;const eligible=s.events.filter(e=>e.phase==="evening"&&e.origin!=="soho"&&e.at>=cutoff);
     stop=eligible.length?eligible[0].origin:null;rows=eligible.filter(e=>e.origin===stop);
    }
    title=stop?stop.toUpperCase()+" → SOHO":"PATH → SOHO";
   }
  }
  rows=rows.slice(0,2);
  const fmt=(e,prefix)=>prefix+e.label+" · Shuttle "+e.bus+(e.origin==="soho"?(e.dest==="newport"?" → NPT":" → HOB"):(e.origin==="newport"?" · NPT":" · HOB"));
  if(rows.length){primary=fmt(rows[0],"");secondary=rows[1]?fmt(rows[1],"Then "):"Last scheduled departure";}
  else{primary="Service ended";secondary="No eligible departures today";}
 }
 if(title){const x=w.addText(title);x.font=Font.semiboldSystemFont(10);x.lineLimit=1;x.minimumScaleFactor=.55;}
 const p=w.addText(primary);p.font=Font.boldSystemFont(s.dow===0?13:14);p.lineLimit=s.dow===0?2:1;p.minimumScaleFactor=.48;
 const d=w.addText(secondary);d.font=Font.regularSystemFont(10);d.lineLimit=1;d.minimumScaleFactor=.46;
 w.url=tap;w.refreshAfterDate=new Date(Date.now()+300000);return w;
}
async function credentials(){
 if(Keychain.contains(KEYU)&&Keychain.contains(KEYP))return {user:Keychain.get(KEYU),pass:Keychain.get(KEYP)};
 const a=new Alert();a.title="Set up shuttle GPS";a.addTextField("Verizon username");a.addSecureTextField("Verizon password");a.addAction("Save");a.addCancelAction("Map only");
 if(await a.presentAlert()<0)return null;const user=a.textFieldValue(0).trim(),pass=a.textFieldValue(1);if(!user||!pass)return null;
 Keychain.set(KEYU,user);Keychain.set(KEYP,pass);return {user,pass};
}
async function request(url,headers){const r=new Request(url);r.headers=headers;r.timeoutInterval=15;let body;try{body=await r.loadString();}catch(e){throw Error(String(e));}const status=r.response&&r.response.statusCode;if(status>=400){const e=Error("HTTP "+status);e.status=status;throw e;}return body;}
let bearer=null;
async function auth(creds){const raw=await request(TOKEN,{Authorization:"Basic "+Data.fromString(creds.user+":"+creds.pass).toBase64String(),Accept:"application/json"});let t;try{const d=JSON.parse(raw);t=typeof d==="string"?d:(d.token||d.access_token||d.Token||d.accessToken);}catch(_){t=raw;}if(typeof t!=="string")throw Error("Invalid token");bearer=t.trim().replace(/^Bearer\s+/i,"").replace(/^"|"$/g,"");}
async function gps(creds){
 if(!bearer)await auth(creds);const headers=()=>({Authorization:"Bearer "+bearer,Accept:"application/json, text/plain, */*",Referer:"https://reveal.us.vzconnect.com/en-US/live-map/"});
 let raw;try{raw=await request(PLOTS,headers());}catch(e){if(e.status!==401)throw e;await auth(creds);raw=await request(PLOTS,headers());}
 const d=JSON.parse(raw);if(!Array.isArray(d.Plots))throw Error("No vehicle Plots");
 const vehicles=d.Plots.map(p=>{const c=p.Coordinate;if(!c)return null;const lat=Number(c.Latitude),lon=Number(c.Longitude);if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return null;
  const id=String(p.id==null?p.vnme:p.id),name=String(p.vnme||"Vehicle "+id),m=name.match(/(?:shuttle|soho\s*lofts|bus|vehicle)\s*#?\s*([123])\b/i)||name.match(/\b([123])$/);
  return {id,name,number:m?m[1]:"unknown",lat,lon,speed:p.spd==null?null:Number(p.spd),heading:p.dir==null?null:Number(p.dir),status:p.Status||"",iconClass:p.icncls||"",updated:p.tmeu||"",lastUpdate:p.LastUpdateForDisplay||p.tme||""};}).filter(Boolean);
 return {vehicles,at:Date.now()};
}
async function imageData(url,svg){try{const r=new Request(url);r.timeoutInterval=10;if(svg){const x=await r.loadString();return "data:image/svg+xml;base64,"+Data.fromString(x).toBase64String();}return "data:image/png;base64,"+Data.fromPNG(await r.loadImage()).toBase64String();}catch(_){return null;}}
function mapUI(){
 // Station framing reserves top space for logo pins and labels.
 // No HTML markers, external overlays, transforms, root CSS, or WebView changes.
 const D=window.DATA;
 document.getElementById("shuttle-version").textContent=String(D.version||"unknown");
 const map=new maplibregl.Map({container:"map",style:"https://tiles.openfreemap.org/styles/positron",center:D.soho,zoom:14.7,attributionControl:false});
 const make=(xy,p)=>({type:"Feature",geometry:{type:"Point",coordinates:xy},properties:p});
 const fc=a=>({type:"FeatureCollection",features:a||[]});
 let ready=false,last=null,selected="soho";
 const vehicles=new Map();
 // Station predictions live in a separate Scriptable-native module.
 // The WebView only renders the popup; it never fetches cross-origin data.
 // Third value is the default route dot color when no live train is reported.
 const PATH_ROWS={
   hoboken:[["33S","33rd Street","blue"],["WTC","World Trade Center","green"]],
   newport:[["33S","33rd Street","yellow"],["WTC","World Trade Center","green"],
            ["JSQ","Journal Square","yellow"],["HOB","Hoboken","blue"]]
 };
 function resetPathDotColors(){
   if(!pathPopup||!activePathStation)return;
   const defaults=PATH_ROWS[activePathStation]||[];
   pathPopup.getElement().querySelectorAll(".path-row").forEach(el=>{
     const times=el.querySelector(".path-times"),dot=el.querySelector(".path-dot");
     if(!times||!dot)return;
     const item=defaults.find(row=>row[0]===times.dataset.destination);
     dot.dataset.route=item?item[2]:"blue";
   });
 }
 let pathPopup=null,activePathStation=null,pathRequest=null,pathRequestId=0;
 function pathLoading(){
   if(!pathPopup)return;
   resetPathDotColors();
   pathPopup.getElement().querySelectorAll(".path-times").forEach(el=>{
     el.textContent="";
     const spinner=document.createElement("span");
     spinner.className="path-spinner";
     spinner.setAttribute("aria-label","Loading live arrival times");
     el.appendChild(spinner);
   });
   const note=pathPopup.getElement().querySelector(".path-note");
   if(note)note.textContent="Fetching live PATH arrivals…";
 }
 function askPathRefresh(){
   if(!pathPopup||!activePathStation)return;
   pathLoading();
   pathRequest={id:++pathRequestId,station:activePathStation};
 }
 function openPathPopup(feature){
   const station=feature.properties.id;
   if(!PATH_ROWS[station])return;
   if(pathPopup)pathPopup.remove();
   activePathStation=station;
   const card=document.createElement("div");
   card.className="path-popup";
   const title=document.createElement("div");
   title.className="path-heading";
   title.textContent=(station==="hoboken"?"Hoboken":"Newport")+" PATH";
   card.appendChild(title);
   PATH_ROWS[station].forEach(([id,name,routeColor])=>{
     const row=document.createElement("div");row.className="path-row";
     const dot=document.createElement("span");dot.className="path-dot";dot.dataset.route=routeColor;
     const label=document.createElement("span");label.className="path-label";label.textContent=name;
     const times=document.createElement("span");times.className="path-times";
     times.dataset.destination=id;
     row.appendChild(dot);row.appendChild(label);row.appendChild(times);card.appendChild(row);
   });
   const note=document.createElement("div");note.className="path-note";card.appendChild(note);
   card.addEventListener("click",()=>{if(activePathStation===station)askPathRefresh();});
   const popupObj=new maplibregl.Popup({offset:12,maxWidth:"calc(100vw - 24px)",closeOnClick:false,className:"path-arrival-popup"})
     .setLngLat(feature.geometry.coordinates).setDOMContent(card).addTo(map);
   pathPopup=popupObj;
   popupObj.on("close",()=>{
     if(pathPopup===popupObj){pathPopup=null;activePathStation=null;pathRequest=null;}
   });
   askPathRefresh();
 }
 window.takePathStationRequest=()=>{const r=pathRequest;pathRequest=null;return r;};
 window.receivePathStationData=payload=>{
   if(!payload||!pathPopup||payload.id!==pathRequestId||payload.station!==activePathStation)return;
   const element=pathPopup.getElement(),note=element.querySelector(".path-note");
   if(payload.error){
     element.querySelectorAll(".path-times").forEach(x=>x.textContent="—");
     note.textContent="Live times unavailable. Tap to retry.";
     return;
   }
   const d=payload.result||{};
   const rows=Array.isArray(d.rows)?d.rows:[];
   const byId={};rows.forEach(r=>{byId[r.id]=r;});
   element.querySelectorAll(".path-times").forEach(el=>{
     const row=byId[el.dataset.destination];
     el.textContent=row&&row.times&&row.times.length?row.times[0]:"—";
     // Change the circle only when a fresh train prediction identifies a line.
     const dot=el.parentNode&&el.parentNode.querySelector(".path-dot");
     if(dot&&row&&row.times&&row.times.length&&
         ["blue","yellow","green","split"].includes(row.routeColor))
       dot.dataset.route=row.routeColor;
   });
   note.textContent=(d.source?d.source+" · ":"")+(d.updatedAt?"Updated "+new Date(d.updatedAt).toLocaleTimeString([], {hour:"numeric",minute:"2-digit"}):"No current predictions");
 }
 setInterval(()=>{if(activePathStation)askPathRefresh();},30000);


 function safe(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");}
 function decode(uri){return new Promise(ok=>{if(!uri)return ok(null);const i=new Image();i.onload=()=>ok(i);i.onerror=()=>ok(null);i.src=uri;});}
 // Classic white rounded label, border and soft shadow drawn into a map icon.
 function rounded(x,left,top,width,height,r){
   r=Math.min(r,width/2,height/2);
   x.beginPath();x.moveTo(left+r,top);x.lineTo(left+width-r,top);
   x.quadraticCurveTo(left+width,top,left+width,top+r);
   x.lineTo(left+width,top+height-r);
   x.quadraticCurveTo(left+width,top+height,left+width-r,top+height);
   x.lineTo(left+r,top+height);
   x.quadraticCurveTo(left,top+height,left,top+height-r);
   x.lineTo(left,top+r);x.quadraticCurveTo(left,top,left+r,top);
   x.closePath();
 }
 function whiteBox(x,text,cx,top){
   const font="700 13px -apple-system, system-ui, Arial, sans-serif";
   x.font=font;
   const width=Math.ceil(x.measureText(text).width)+22;
   const height=30,left=cx-width/2;
   x.save();
   x.shadowColor="rgba(20,35,55,0.23)";
   x.shadowBlur=9;x.shadowOffsetY=3;
   rounded(x,left,top,width,height,11);
   x.fillStyle="#ffffff";x.fill();
   x.restore();
   rounded(x,left+.5,top+.5,width-1,height-1,11);
   x.lineWidth=1;x.strokeStyle="rgba(210,219,229,0.95)";x.stroke();
   x.fillStyle="#18253a";x.font=font;
   x.textAlign="center";x.textBaseline="middle";
   x.fillText(text,cx,top+height/2+0.5);
 }
 // Destination pin and its title box are a SINGLE map image anchored at its
 // actual longitude/latitude. No DOM node can enlarge the WebView document.
 function pin(logo,shortName,title){
   const logicalW=Math.max(132,Math.ceil(title.length*8.6)+36);
   const logicalH=92,scale=2;
   const c=document.createElement("canvas");c.width=logicalW*scale;c.height=logicalH*scale;
   const x=c.getContext("2d");x.scale(scale,scale);
   whiteBox(x,title,logicalW/2,4);
   // Reuse the old teardrop path and actual 50px height.
   x.save();
   x.translate(logicalW/2-19,42);
   x.scale(38/60,50/78);
   x.save();x.shadowColor="rgba(20,35,55,0.23)";x.shadowBlur=6;x.shadowOffsetY=3;
   x.beginPath();x.moveTo(30,1);x.bezierCurveTo(13,1,1,14,1,30);
   x.bezierCurveTo(1,49,18,68,30,78);x.bezierCurveTo(42,68,59,49,59,30);
   x.bezierCurveTo(59,14,47,1,30,1);x.closePath();
   x.fillStyle="#ffffff";x.fill();x.restore();
   x.save();x.beginPath();x.arc(30,29,23,0,Math.PI*2);x.clip();
   x.fillStyle="#dceefa";x.fillRect(7,6,46,46);
   if(logo){
     const r=Math.min(43/logo.width,43/logo.height),w=logo.width*r,h=logo.height*r;
     x.drawImage(logo,30-w/2,29-h/2,w,h);
   }else{
     x.fillStyle="#152b43";x.font="700 12px sans-serif";x.textAlign="center";
     x.textBaseline="middle";x.fillText(shortName,30,29,42);
   }
   x.restore();x.restore();
   return x.getImageData(0,0,c.width,c.height);
 }
 // The original 25px numbered circles, with a small shadow.
 function bus(number,color){
   const s=25,c=document.createElement("canvas");c.width=s*2;c.height=s*2;
   const x=c.getContext("2d");x.scale(2,2);
   x.save();x.shadowColor="rgba(20,35,55,0.25)";x.shadowBlur=3;x.shadowOffsetY=2;
   x.beginPath();x.arc(s/2,s/2,11,0,Math.PI*2);x.fillStyle=color;x.fill();x.restore();
   x.lineWidth=2;x.strokeStyle="#fff";x.beginPath();x.arc(s/2,s/2,11,0,Math.PI*2);x.stroke();
   x.fillStyle="#fff";x.font="700 14px -apple-system, sans-serif";x.textAlign="center";x.textBaseline="middle";
   x.fillText(number,s/2,s/2);
   return x.getImageData(0,0,c.width,c.height);
 }
 function arrow(color){
   const s=44,c=document.createElement("canvas");c.width=s*2;c.height=s*2;
   const x=c.getContext("2d");x.scale(2,2);
   x.beginPath();x.moveTo(22,1.5);x.lineTo(16,9);x.lineTo(28,9);x.closePath();
   x.fillStyle=color;x.fill();x.lineWidth=1.5;x.strokeStyle="#fff";x.stroke();
   return x.getImageData(0,0,c.width,c.height);
 }
 function fit(duration,includeVehicles=false){
   const bounds=new maplibregl.LngLatBounds();
   [D.soho,D.hob,D.npt].forEach(p=>bounds.extend(p));
   if(includeVehicles&&last)last.vehicles.forEach(v=>bounds.extend([v.lon,v.lat]));
   // Keep Hoboken title-box clearance at the top of a shortened WebView.
   // Add 20px at the right to give PATH labels more breathing room.
   map.fitBounds(bounds,{padding:{top:255,bottom:230,left:55,right:75},maxZoom:15.5,duration});
 }
 function refresh(){
   document.getElementById("title").textContent=({soho:"SoHo Lofts",hoboken:"Hoboken PATH",newport:"Newport PATH"})[selected];
   document.querySelectorAll("#tabs button").forEach(b=>b.className=b.dataset.stop===selected?"active":"");
   const el=document.getElementById("departures");el.textContent="";
   if(D.sunday){el.textContent="Call concierge for shuttle · 10 AM–6 PM";return;}
   const rows=D.events.filter(e=>e.origin===selected&&e.at>=Date.now()).slice(0,2);
   if(!rows.length){el.textContent="No more departures here today";return;}
   rows.forEach(e=>{
     const row=document.createElement("div");row.style.padding="4px 0";
     row.textContent=e.label+" · Shuttle "+e.bus+" → "+(e.dest==="soho"?"SoHo Lofts":e.dest==="newport"?"Newport PATH":"Hoboken PATH");
     el.appendChild(row);
   });
 }
 function popup(v){return "<b>"+safe(v.name)+"</b><div>Status: "+safe(v.iconClass||v.status||"Unknown")+
   "</div><div>Speed: "+safe(v.speed==null?"Unknown":v.speed+" mph")+
   "</div><div>Heading: "+safe(v.heading==null?"Unknown":v.heading+"°")+
   "</div><div>GPS update: "+safe(v.lastUpdate||"Unknown")+"</div>"+
   "<div>Coordinates: "+safe(v.lat.toFixed(5)+", "+v.lon.toFixed(5))+"</div>";}
 function fresh(v){
   if(typeof v.updated==="string"){
     const match=/^\/Date\((\d+)/.exec(v.updated);
     const stamp=match?Number(match[1]):Date.parse(v.updated);
     if(Number.isFinite(stamp)&&Date.now()-stamp>120000)return false;
   }
   return true;
 }
 function travelState(v){
   // Engine-off and idling are distinguished only when Reveal reports them.
   // Without an engine state, a stationary shuttle defaults to stopped/gray.
   if(!fresh(v))return "stopped";
   const state=(String(v.status||"")+" "+String(v.iconClass||"")).toLowerCase();
   if(/idl(e|ing)/.test(state))return "idle";
   if(/stop|park|ignition[\s_-]*off|engine[\s_-]*off|stationary/.test(state))return "stopped";
   if(/mov|driv|travel(l)?ing/.test(state))return "moving";
   if(v.speed!=null&&Number.isFinite(v.speed)&&v.speed>2)return "moving";
   if(/ignition[\s_-]*on|engine[\s_-]*on|engine[\s_-]*running/.test(state))return "idle";
   return "stopped";
 }
 function isMoving(v){
   return travelState(v)==="moving"&&v.heading!=null&&Number.isFinite(v.heading);
 }
 function updateVehicles(snapshot){
   last=snapshot;
   if(!ready)return true;
   vehicles.clear();
   const features=snapshot.vehicles.map(v=>{
     vehicles.set(v.id,v);
     const number=["1","2","3"].includes(v.number)?v.number:"unknown";
     const state=travelState(v);
     return make([v.lon,v.lat],{
       id:v.id,icon:"bus-"+number+"-"+state,arrow:"arr-moving",
       heading:v.heading==null?0:v.heading,
       showArrow:isMoving(v)
     });
   });
   map.getSource("shuttles").setData(fc(features));
   document.getElementById("gps").textContent=snapshot.vehicles.length+" vehicle"+
     (snapshot.vehicles.length===1?"":"s")+" · Synced "+new Date(snapshot.at).toLocaleTimeString();
   // Receiving new GPS data never changes the user's chosen map framing.
   return true;
 }
 window.receiveVehicleData=updateVehicles;
 window.receiveVehicleError=e=>{document.getElementById("gps").textContent="GPS: "+String(e);};
 map.on("load",async()=>{
   try{
     const logos=await Promise.all(D.logos.map(decode));
     map.addImage("soho",pin(logos[0],"SoHo","SoHo Lofts"),{pixelRatio:2});
     map.addImage("hoboken-pin",pin(logos[1],"PATH","Hoboken PATH"),{pixelRatio:2});
     map.addImage("newport-pin",pin(logos[1],"PATH","Newport PATH"),{pixelRatio:2});
     for(const number of ["1","2","3","unknown"]){
       for(const state of ["moving","idle","stopped"]){
         map.addImage("bus-"+number+"-"+state,
           bus(number==="unknown"?"?":number,D.colors[state]),{pixelRatio:2});
       }
     }
     map.addImage("arr-moving",arrow(D.colors.moving),{pixelRatio:2});
     map.addSource("shuttles",{type:"geojson",data:fc()});
     map.addLayer({id:"arrows",type:"symbol",source:"shuttles",
       filter:["==",["get","showArrow"],true],
       layout:{"icon-image":["get","arrow"],"icon-anchor":"center",
         "icon-rotate":["get","heading"],"icon-rotation-alignment":"map",
         "icon-allow-overlap":true,"icon-ignore-placement":true}});
     map.addLayer({id:"buses",type:"symbol",source:"shuttles",
       layout:{"icon-image":["get","icon"],"icon-anchor":"center",
         "icon-rotation-alignment":"viewport",
         "icon-allow-overlap":true,"icon-ignore-placement":true}});
     map.addSource("stops",{type:"geojson",data:fc([
       make(D.soho,{id:"soho",name:"SoHo Lofts",icon:"soho"}),
       make(D.hob,{id:"hoboken",name:"Hoboken PATH",icon:"hoboken-pin"}),
       make(D.npt,{id:"newport",name:"Newport PATH",icon:"newport-pin"})
     ])});
     map.addLayer({id:"pins",type:"symbol",source:"stops",
       layout:{"icon-image":["get","icon"],"icon-anchor":"bottom",
         "icon-allow-overlap":true,"icon-ignore-placement":true}});
     map.on("click","pins",e=>{
       const f=e.features&&e.features[0];if(!f)return;
       selected=f.properties.id;refresh();
       if(PATH_ROWS[selected])openPathPopup(f);
       else if(pathPopup)pathPopup.remove();
     });
     // Tapping the map outside a station pin dismisses PATH arrivals.
     // A station-pin click also bubbles to the map, so explicitly keep
     // popups open when the tap falls on a pin.
     map.on("click",e=>{
       if(!pathPopup)return;
       const target=e.originalEvent&&e.originalEvent.target;
       if(target&&target.closest&&target.closest(".maplibregl-popup"))return;
       const hits=map.queryRenderedFeatures(e.point,{layers:["pins"]});
       if(hits&&hits.length)return;
       pathPopup.remove();
     });
     map.on("click","buses",e=>{
       const f=e.features&&e.features[0];if(!f)return;
       const v=vehicles.get(f.properties.id);
       if(v)new maplibregl.Popup({offset:14,maxWidth:"300px"})
         .setLngLat(f.geometry.coordinates).setHTML(popup(v)).addTo(map);
     });
     document.querySelectorAll("#tabs button").forEach(b=>{
       b.onclick=()=>{selected=b.dataset.stop;refresh();};
     });
     document.getElementById("fit").onclick=()=>fit(650,true);
     // Tap GPS status to inspect an intermittent Scriptable/iOS viewport
     // problem without altering fullscreen sizing or rendered map layers.
     const gpsStatus=document.getElementById("gps");
     gpsStatus.style.cursor="pointer";
     gpsStatus.setAttribute("title","Tap for viewport diagnostics");
     gpsStatus.onclick=()=>{
       let panel=document.getElementById("shuttle-debug");
       if(!panel){
         panel=document.createElement("div");panel.id="shuttle-debug";
         panel.style.cssText="position:fixed;z-index:100;top:20%;left:14px;right:14px;padding:16px;border-radius:12px;background:#fffffff5;color:#16263c;border:1px solid #bfcad6;box-shadow:0 5px 28px #0004;font:12px/1.55 ui-monospace,Menlo,monospace;white-space:pre-wrap;max-height:60%;overflow:auto";
         document.body.appendChild(panel);
         panel.addEventListener("click",()=>panel.remove());
       }else{panel.remove();return;}
       const vv=window.visualViewport,root=document.documentElement,rect=map.getContainer().getBoundingClientRect();
       panel.textContent=[
         "v"+String(D.version||"unknown")+" · Viewport diagnostics",
         "Tap this card to close",
         "",
         "screen.height: "+screen.height,
         "screen.availHeight: "+screen.availHeight,
         "window.innerHeight: "+window.innerHeight,
         "document.clientHeight: "+root.clientHeight,
         "visualViewport.height: "+(vv?Math.round(vv.height):"unknown"),
         "visualViewport.offsetTop: "+(vv?vv.offsetTop:"unknown"),
         "map.height: "+Math.round(rect.height),
         "map.bottom: "+Math.round(rect.bottom),
         "canvas.height: "+Math.round(map.getCanvas().getBoundingClientRect().height),
         "devicePixelRatio: "+devicePixelRatio
       ].join("\n");
     };
     refresh();setInterval(refresh,30000);
     ready=true;document.getElementById("status").style.display="none";
     fit(0);if(last)updateVehicles(last);
   }catch(e){document.getElementById("status").textContent="Map error: "+e;}
 });
}
// PATH arrival lookup stays inside core.js and runs using native Scriptable Request.
// Try PANYNJ first. Its feed sometimes returns {"results":[]}, so a separate
// station-specific API may be tried once as a best-effort fallback.
// Neither source is assumed to be live unless timestamps confirm freshness.
const PATH_CODES={hoboken:"HOB",newport:"NEW"};
const PATH_DEST={
 HOB:[{id:"33S",name:"33rd Street"},{id:"WTC",name:"World Trade Center"}],
 NEW:[{id:"33S",name:"33rd Street"},{id:"WTC",name:"World Trade Center"},
      {id:"JSQ",name:"Journal Square"},{id:"HOB",name:"Hoboken"}]
};
// Experimental RidePATH SignalR client. No app credential is stored in GitHub.
const PATH_SIGNALR_KEY="soho-path-signalr-app-token-v1";
const PATH_SIGNALR_ENDPOINT="https://panynj-path-af-tb.azurewebsites.net/api/tokenrequest?TKrTIgWSdgikIrqvftckyOh";
const PATH_SIGNALR_LISTEN_MS=13000;
async function pathSignalRSetup(){
 if(Keychain.contains(PATH_SIGNALR_KEY))return;
 const alert=new Alert();
 alert.title="SignalR test credential";
 alert.message="Enter the RidePATH app bearer token once. It remains in this iPhone's Scriptable Keychain, not GitHub. Cancel leaves SignalR unconfigured until the next launch.";
 alert.addSecureTextField("RidePATH app bearer token");
 alert.addAction("Save on iPhone");
 alert.addCancelAction("Not now");
 if(await alert.presentAlert()<0)return;
 const value=alert.textFieldValue(0).trim().replace(/^Bearer\s+/i,"");
 if(value)Keychain.set(PATH_SIGNALR_KEY,value);
}
async function pathSignalRPost(url,body,headers){
 const req=new Request(url);
 req.method="POST";
 req.timeoutInterval=12;
 req.headers=headers;
 req.body=body;
 const raw=await req.loadString();
 const status=req.response&&req.response.statusCode;
 if(status===204||status>=400)throw Error("SignalR HTTP "+status);
 return JSON.parse(raw);
}
async function pathSignalRConnectParams(code,direction){
 const credential=Keychain.get(PATH_SIGNALR_KEY);
 const station=code==="HOB"?"Hoboken":"Newport";
 const auth=await pathSignalRPost(PATH_SIGNALR_ENDPOINT,
   JSON.stringify({station,direction}),
   {Authorization:"Bearer "+credential,AppName:"RidePATH",AppVersion:"6.2.2","Content-Type":"application/json"});
 if(!auth||!auth.Url||!auth.AccessToken)throw Error("SignalR token missing");
 const base=String(auth.Url);
 const negotiate=base.replace(/^https?:/,"https:").replace(/\/client\/?/,"/client/negotiate");
 const separator=negotiate.includes("?")?"&":"?";
 const info=await pathSignalRPost(negotiate+separator+"negotiateVersion=1","",
   {Authorization:"Bearer "+auth.AccessToken});
 if(!info||!info.connectionToken)throw Error("SignalR negotiation missing connectionToken");
 const wsUrl=base.replace(/^https?:/,"wss:");
 const sep=wsUrl.includes("?")?"&":"?";
 return {code,direction,expected:(direction==="New York"?"ToNY":"ToNJ")+","+code,
   url:wsUrl+sep+"id="+encodeURIComponent(info.connectionToken)+"&access_token="+encodeURIComponent(auth.AccessToken)};
}
async function pathSignalRArrivals(station,web){
 if(!web||!Keychain.contains(PATH_SIGNALR_KEY))throw Error("SignalR unconfigured");
 const code=PATH_CODES[station];
 const dirs=code==="HOB"?["New York"]:["New York","New Jersey"];
 // Acquire tokens and negotiate independent streams concurrently.
 const settled=await Promise.allSettled(dirs.map(d=>pathSignalRConnectParams(code,d)));
 const connections=settled.filter(x=>x.status==="fulfilled").map(x=>x.value);
 if(!connections.length)throw Error("No SignalR negotiation succeeded: "+
   settled.map(x=>String(x.reason)).join("; "));
 // Browser WebSocket cannot set Authorization headers. Azure SignalR supports
 // access_token in the query for WebSocket browser clients.
 const browserCode="(function(){"+
   "const feeds="+JSON.stringify(connections)+";"+
   "const limit="+PATH_SIGNALR_LISTEN_MS+";"+
   "function one(feed){return new Promise(resolve=>{let done=false;let sock=null;"+
   "const finish=(value)=>{if(done)return;done=true;clearTimeout(timeout);"+
   "try{if(sock)sock.close();}catch(_){}resolve(value);};"+
   "const timeout=setTimeout(()=>finish({error:'timeout',feed:feed.expected}),limit);"+
   "try{sock=new WebSocket(feed.url);}catch(e){finish({error:String(e),feed:feed.expected});return;}"+
   "sock.onopen=()=>sock.send(JSON.stringify({protocol:'json',version:1})+String.fromCharCode(30));"+
   "sock.onerror=()=>finish({error:'websocket error',feed:feed.expected});"+
   "sock.onclose=()=>finish({error:'websocket closed',feed:feed.expected});"+
   "sock.onmessage=(event)=>{if(typeof event.data!=='string')return;"+
   "for(const part of event.data.split(String.fromCharCode(30))){if(!part)continue;"+
   "try{const msg=JSON.parse(part);if(msg.target!=='SendMessage')continue;"+
   "const a=msg.arguments||[];if(a.length<2||!String(a[0]).endsWith(','+feed.expected))continue;"+
   "const p=typeof a[1]==='string'?JSON.parse(a[1]):a[1];"+
   "if(!p||p.target!==feed.code||!Array.isArray(p.messages))continue;"+
   "finish({feed:feed.expected,payload:p});return;}catch(_){}"+
   "}};});}"+
   "Promise.all(feeds.map(one)).then(result=>completion(result)).catch(err=>completion([{error:String(err)}]));"+
   "})()";
 const snapshots=await web.evaluateJavaScript(browserCode,true);
 if(!Array.isArray(snapshots))throw Error("Invalid SignalR WebView response");
 const rows=pathBuildRows(code),now=Date.now();
 let latest=0,streams=0;
 for(const snap of snapshots){
   if(!snap||!snap.payload)continue;
   streams++;
   for(const train of snap.payload.messages){
     if(!train)continue;
     const updated=Date.parse(String(train.lastUpdated||""));
     const seconds=Number(train.secondsToArrival);
     if(!Number.isFinite(updated)||now-updated>240000||updated-now>60000||
       !Number.isFinite(seconds)||seconds<0||seconds>7200)continue;
     latest=Math.max(latest,updated);
     pathSetSoonest(rows,train.headSign,updated+seconds*1000,now,train.lineColor,train.route);
   }
 }
 if(!streams||!rows.some(x=>x.times.length)){
   const errors=snapshots.map(x=>x.error||"no usable arrivals").join("; ");
   throw Error("SignalR no usable trains: "+errors);
 }
 return pathResult(code,rows,"RidePATH SignalR",latest);
}

function pathDestination(text){
 const s=String(text||"").trim().toLowerCase();
 if(/^33(?:rd)?(?:\s*(?:st|street))?\b/.test(s))return "33S";
 if(/^world\s+trade\s+center\b|^wtc\b/.test(s))return "WTC";
 if(/^journal\s+square\b|^jsq\b/.test(s))return "JSQ";
 if(/^hoboken\b/.test(s))return "HOB";
 return null;
}
function pathEtaText(eta,now){
 const remaining=(eta-now)/1000;
 if(!Number.isFinite(remaining)||remaining < -30||remaining > 7200)return null;
 return remaining<=35?"Now":Math.max(1,Math.ceil(remaining/60))+" min";
}
function pathBuildRows(code){return PATH_DEST[code].map(r=>({id:r.id,name:r.name,times:[],at:Infinity}));}
function pathTrainColor(headsign,lineColor,routeId,destination){
 // Official RidePATH lineColor identifies blue, yellow, green, and the
 // blue/yellow service, independently of the destination/headsign.
 // The community feed instead provides lineColors[] and a route ID.
 const colors=Array.isArray(lineColor)?lineColor.join(","):String(lineColor||"");
 const compact=colors.replace(/[^a-fA-F0-9,]/g,"").toUpperCase();
 const route=String(routeId||"").toUpperCase();
 const text=String(headsign||"").toLowerCase();
 if(destination==="WTC")return "green";
 if(route.includes("JSQ_33_HOB")||(/via\s+hoboken/i).test(text)||
     (compact.includes("4D92FB")&&compact.includes("FF9900")))
   return "split";
 if(route.includes("HOB_WTC")||compact.includes("65C100"))return "green";
 if(route.includes("HOB_33")||compact.includes("4D92FB"))return "blue";
 if(route.includes("JSQ_33")||compact.includes("FF9900"))return "yellow";
 return null; // The popup keeps its station-specific color when unknown.
}
function pathSetSoonest(rows,headsign,arrival,now,lineColor,routeId){
 const id=pathDestination(headsign);
 if(!id)return;
 const row=rows.find(r=>r.id===id);
 const text=pathEtaText(arrival,now);
 if(row && text && arrival < row.at){
   row.at=arrival;row.times=[text];
   row.routeColor=pathTrainColor(headsign,lineColor,routeId,id);
 }
}
function pathResult(code,rows,source,updatedAt){
 // The map displays one countdown and a line-colored circle per destination.
 return {station:code,rows:rows.map(r=>({
   id:r.id,name:r.name,times:r.times,routeColor:r.routeColor||null
 })),updatedAt,source,status:"Live arrival predictions"};
}
async function fetchArrivals(station,web){
 if(!PATH_CODES[station])throw Error("Unknown PATH station");
 return await pathSignalRArrivals(station,web);
}
// version.json is the only source of release version information.
// The existing launcher already fetches it; core reads it as well because
// installed launchers do not pass version info into imported modules.
// Offline, use the launcher's locally saved last-successful version.
async function getAppVersion(){
 const valid=v=>typeof v==="string"&&/^[0-9]+[.][0-9]+[.][0-9]+$/.test(v);
 try{
   const req=new Request("https://raw.githubusercontent.com/kushs5497/soho-lofts-scriptable-shuttle-tracker/SignalR/version.json?t="+Date.now());
   req.timeoutInterval=6;
   req.headers={"Cache-Control":"no-cache",Accept:"application/json"};
   const raw=await req.loadString();
   if(req.response&&req.response.statusCode>=400)throw Error("Version HTTP "+req.response.statusCode);
   const manifest=JSON.parse(raw);
   if(!manifest||manifest.entrypoint!=="core.js"||!valid(manifest.version))throw Error("Invalid version manifest");
   return manifest.version;
 }catch(e){console.warn("Version manifest unavailable: "+e);}
 try{
   const fm=FileManager.local();
   const path=fm.joinPath(fm.joinPath(fm.documentsDirectory(),"SoHoShuttleRuntime-SignalR"),"update-state.json");
   if(fm.fileExists(path)){
     const state=JSON.parse(fm.readString(path));
     if(state&&valid(state.version))return state.version;
   }
 }catch(e){console.warn("Cached version unavailable: "+e);}
 return "unknown";
}
async function showMap(){
 const versionPromise=getAppVersion();
 await pathSignalRSetup();
 const creds=await credentials(),logos=await Promise.all([imageData(SOHO_LOGO,false),imageData(PATH_LOGO,true)]),day=schedule(new Date());
 const data={soho:SOHO,hob:HOB,npt:NPT,logos,colors:COLORS,events:day.events,sunday:day.dow===0,version:await versionPromise};
 const html='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,viewport-fit=cover"><link rel="stylesheet" href="https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.css"><style>'+
 'html,body,#map{margin:0;width:100%;height:100%;font-family:-apple-system}#map{position:fixed;inset:0}#status{position:fixed;top:45%;left:10%;right:10%;z-index:50;padding:15px;background:white;border-radius:12px}#top{position:fixed;top:calc(8px + env(safe-area-inset-top));left:12px;right:12px;z-index:20;padding:10px;background:#fffffff0;border-radius:12px;display:flex;gap:12px}#gps{flex:1;font-size:12px}#panel{position:fixed;z-index:20;bottom:calc(12px + env(safe-area-inset-bottom));left:12px;right:12px;padding:14px;background:#fffffff5;border-radius:15px;box-shadow:0 3px 15px #0002}#title{font-weight:bold}#tabs{display:flex;margin:8px 0;gap:6px}#tabs button{flex:1;padding:7px;border:1px solid #ddd;border-radius:8px}#tabs button.active{background:#dbeafe}#departures{font-size:12px}#credits{font-size:9px;color:#77808f;margin-top:7px}#credits a{color:inherit;text-decoration:none}#fit{border:0;background:#dbeafe;border-radius:8px;padding:7px;color:#155ac1}.maplibregl-ctrl-top-right{top:60px}.maplibregl-ctrl-bottom-left,.maplibregl-ctrl-bottom-right{bottom:160px}.path-arrival-popup{max-width:calc(100vw - 24px)}.path-arrival-popup .maplibregl-popup-content{box-sizing:border-box;padding:7px 8px;border-radius:10px;max-width:calc(100vw - 24px);max-height:calc(100vh - 80px);overflow-y:auto}.path-popup{width:194px;max-width:calc(100vw - 44px);color:#15253b;font:11.5px -apple-system,system-ui,sans-serif}.path-arrival-popup .maplibregl-popup-close-button{width:42px;height:42px;display:flex;align-items:center;justify-content:center;font-size:28px;line-height:1;font-weight:400;color:#334155;border-radius:12px;cursor:pointer}.path-arrival-popup .maplibregl-popup-close-button:active{background:#e2e8f0}.path-heading{display:flex;align-items:center;min-height:36px;font-size:12px;font-weight:700;margin-bottom:1px;padding-right:42px}.path-row{display:flex;align-items:center;gap:5px;min-height:24px;border-top:1px solid #edf0f5}.path-dot{height:11px;width:11px;border-radius:50%;background:#4D92FB;flex-shrink:0}.path-dot[data-route=blue]{background:#4D92FB}.path-dot[data-route=yellow]{background:#FF9900}.path-dot[data-route=green]{background:#65C100}.path-dot[data-route=split]{background:linear-gradient(145deg,#4D92FB 0%,#4D92FB 45%,#fff 46%,#fff 54%,#FF9900 55%,#FF9900 100%)}.path-label{flex:1;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.path-times{font-size:12px;font-weight:700;white-space:nowrap;color:#172b45;display:flex;align-items:center;justify-content:flex-end;min-width:43px}.path-spinner{display:inline-block;width:11px;height:11px;border:2px solid #d5e4f7;border-top-color:#2563eb;border-radius:50%;animation:path-spin .8s linear infinite}@keyframes path-spin{to{transform:rotate(360deg)}}.path-note{font-size:9px;color:#718096;border-top:1px solid #edf0f5;padding-top:5px;margin-top:2px}</style></head><body>'+
 '<div id="map"></div><div id="status">Loading map…</div><div id="top"><span id="gps">Waiting for GPS…</span><button id="fit">Fit shuttles</button></div>'+
 '<div id="panel"><div id="title">SoHo Lofts</div><div id="tabs"><button data-stop="soho">SoHo</button><button data-stop="hoboken">Hoboken</button><button data-stop="newport">Newport</button></div><div id="departures"></div><small>Shuttle ETA · PATH predictions · v<span id="shuttle-version"></span></small><div id="credits">Map: <a href="https://openmaptiles.org/" target="_blank" rel="noopener">© OpenMapTiles</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap contributors</a></div></div>'+
 '<script src="https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.js"></'+'script><script>window.DATA='+JSON.stringify(data)+';try{('+mapUI.toString()+')();}catch(e){var status=document.getElementById("status");if(status){status.style.display="block";status.textContent="Map startup error: "+String(e);}}</'+'script></body></html>';
 const web=new WebView();await web.loadHTML(html,"https://openfreemap.org/");
 let stop=false,busy=false,timer,pathTimer,pathBusy=false;
 async function pollPath(){
   if(stop||pathBusy)return;
   let q;
   try{
     q=await web.evaluateJavaScript("window.takePathStationRequest && window.takePathStationRequest()",false);
   }catch(_){return;}
   if(!q||!["hoboken","newport"].includes(q.station))return;
   pathBusy=true;
   try{
     const data=await fetchArrivals(q.station,web);
     if(!stop)await web.evaluateJavaScript("window.receivePathStationData && window.receivePathStationData("+JSON.stringify({id:q.id,station:q.station,result:data})+")",false);
   }catch(e){
     if(!stop)try{
       await web.evaluateJavaScript("window.receivePathStationData && window.receivePathStationData("+JSON.stringify({id:q.id,station:q.station,error:String(e)})+")",false);
     }catch(_){}
   }finally{pathBusy=false;}
 }
 async function poll(){if(!creds||stop||busy)return;busy=true;try{const s=await gps(creds);if(!stop)await web.evaluateJavaScript("window.receiveVehicleData && window.receiveVehicleData("+JSON.stringify(s)+")",false);}catch(e){if(!stop)try{await web.evaluateJavaScript("window.receiveVehicleError && window.receiveVehicleError("+JSON.stringify(String(e))+")",false);}catch(_){}}finally{busy=false;}}
 const dismissed=web.present(true);
 try{
   // Keep PATH polling entirely separate from map startup. The polling
   // bridge becomes active only after the WebView has had time to render.
   pathTimer=Timer.schedule(2500,true,()=>{pollPath().catch(e=>console.warn("PATH: "+e));});
   if(creds){timer=Timer.schedule(5000,true,()=>{poll().catch(e=>console.warn(e));});poll().catch(e=>console.warn(e));}
   await dismissed;
 }
 finally{stop=true;if(timer)timer.invalidate();if(pathTimer)pathTimer.invalidate();}
}
async function main(options){if(config.runsInWidget)Script.setWidget(await widget(options.tapURL||URLScheme.forRunningScript()));else await showMap();}
module.exports.main=main;