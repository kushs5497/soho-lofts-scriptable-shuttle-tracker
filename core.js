// SoHo Lofts Scriptable module; loaded by GitHub launcher.
const NY="America/New_York",SOHO=[-74.0451,40.7332],HOB=[-74.029028,40.73575],NPT=[-74.03476,40.7268];
const TOKEN="https://fim.api.us.fleetmatics.com/token",PLOTS="https://reveal.us.vzconnect.com/plot/Plot/GetVehiclePlotsForUserWithMetadata";
const KEYU="soho-lofts-reveal-user-v11",KEYP="soho-lofts-reveal-pass-v11";
const COLORS={"1":"#2563eb","2":"#e58a22","3":"#64748b","unknown":"#2563eb"};
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
 // v17.4: render all pins and title boxes in MapLibre's native symbol layers.
 // No HTML markers, external overlays, transforms, root CSS, or WebView changes.
 const D=window.DATA;
 const map=new maplibregl.Map({container:"map",style:"https://tiles.openfreemap.org/styles/positron",center:D.soho,zoom:14.7,attributionControl:false});
 const make=(xy,p)=>({type:"Feature",geometry:{type:"Point",coordinates:xy},properties:p});
 const fc=a=>({type:"FeatureCollection",features:a||[]});
 let ready=false,last=null,selected="soho",first=true;
 const vehicles=new Map(),titleCache=new Map();

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
 function busTitle(text){
   const scale=2,c=document.createElement("canvas"),probe=c.getContext("2d");
   probe.font="700 13px -apple-system, system-ui, Arial, sans-serif";
   const width=Math.max(86,Math.ceil(probe.measureText(text).width)+36);
   const height=44;c.width=width*scale;c.height=height*scale;
   const x=c.getContext("2d");x.scale(scale,scale);whiteBox(x,text,width/2,5);
   return {data:x.getImageData(0,0,c.width,c.height),width,height};
 }
 function registerTitle(id,title){
   const key="bus-title-"+String(id),cached=titleCache.get(key);
   if(cached&&cached.title===title)return cached;
   if(cached&&map.hasImage(key))map.removeImage(key);
   const asset=busTitle(title);
   map.addImage(key,asset.data,{pixelRatio:2});
   const next={id:key,title,width:asset.width,height:asset.height};
   titleCache.set(key,next);return next;
 }
 function fit(duration){
   const bounds=new maplibregl.LngLatBounds();
   [D.soho,D.hob,D.npt].forEach(p=>bounds.extend(p));
   if(last)last.vehicles.forEach(v=>bounds.extend([v.lon,v.lat]));
   map.fitBounds(bounds,{padding:{top:145,bottom:230,left:55,right:55},maxZoom:15.5,duration});
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
 function isMoving(v){
   const status=String(v.iconClass||v.status||"").toLowerCase();
   return fresh(v)&&!status.includes("idle")&&!status.includes("stop")&&
      v.speed!=null&&v.speed>2&&v.heading!=null&&Number.isFinite(v.heading);
 }
 function updateVehicles(snapshot){
   last=snapshot;
   if(!ready)return true;
   vehicles.clear();
   // Assign vertical lanes only to labels near each other in map pixels.
   // Pin/circle positions themselves never move.
   const placed=[];
   const sorted=snapshot.vehicles.slice().sort((a,b)=>{
     const i=Number(a.number),j=Number(b.number);
     return (Number.isFinite(i)?i:99)-(Number.isFinite(j)?j:99);
   });
   const features=sorted.map(v=>{
     vehicles.set(v.id,v);
     const number=["1","2","3"].includes(v.number)?v.number:"unknown";
     const name=v.name||("Soho Lofts "+number),label=registerTitle(v.id,name);
     const screen=map.project([v.lon,v.lat]);
     let lift=0;
     for(let i=0;i<8;i++){
       const y=screen.y-19-lift;
       const rect={left:screen.x-label.width/2,right:screen.x+label.width/2,top:y-label.height,bottom:y};
       if(!placed.some(p=>rect.left<p.right+6&&rect.right>p.left-6&&rect.top<p.bottom+5&&rect.bottom>p.top-5)){
         placed.push(rect);break;
       }
       lift+=label.height+3;
     }
     return make([v.lon,v.lat],{
       id:v.id,icon:"bus-"+number,arrow:"arr-"+number,
       heading:v.heading==null?0:v.heading,
       showArrow:isMoving(v),titleIcon:label.id,labelOffset:[0,-19-lift]
     });
   });
   map.getSource("shuttles").setData(fc(features));
   document.getElementById("gps").textContent=snapshot.vehicles.length+" vehicle"+
     (snapshot.vehicles.length===1?"":"s")+" · Synced "+new Date(snapshot.at).toLocaleTimeString();
   if(first){first=false;fit(0);}
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
       const color=D.colors[number];
       map.addImage("bus-"+number,bus(number==="unknown"?"?":number,color),{pixelRatio:2});
       map.addImage("arr-"+number,arrow(color),{pixelRatio:2});
     }
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
     map.addLayer({id:"bus-titles",type:"symbol",source:"shuttles",
       layout:{"icon-image":["get","titleIcon"],"icon-anchor":"bottom",
         "icon-offset":["array","number",2,["get","labelOffset"]],"icon-rotation-alignment":"viewport",
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
     });
     map.on("click","buses",e=>{
       const f=e.features&&e.features[0];if(!f)return;
       const v=vehicles.get(f.properties.id);
       if(v)new maplibregl.Popup({offset:14,maxWidth:"300px"})
         .setLngLat(f.geometry.coordinates).setHTML(popup(v)).addTo(map);
     });
     map.on("click","bus-titles",e=>{
       const f=e.features&&e.features[0];if(!f)return;
       const v=vehicles.get(f.properties.id);
       if(v)new maplibregl.Popup({offset:14,maxWidth:"300px"})
         .setLngLat(f.geometry.coordinates).setHTML(popup(v)).addTo(map);
     });
     document.querySelectorAll("#tabs button").forEach(b=>{
       b.onclick=()=>{selected=b.dataset.stop;refresh();};
     });
     document.getElementById("fit").onclick=()=>fit(650);
     refresh();setInterval(refresh,30000);
     ready=true;document.getElementById("status").style.display="none";
     fit(0);if(last)updateVehicles(last);
   }catch(e){document.getElementById("status").textContent="Map error: "+e;}
 });
}
async function showMap(){
 const creds=await credentials(),logos=await Promise.all([imageData(SOHO_LOGO,false),imageData(PATH_LOGO,true)]),day=schedule(new Date());
 const data={soho:SOHO,hob:HOB,npt:NPT,logos,colors:COLORS,events:day.events,sunday:day.dow===0};
 const html='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,viewport-fit=cover"><link rel="stylesheet" href="https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.css"><style>'+
 'html,body,#map{margin:0;width:100%;height:100%;font-family:-apple-system}#map{position:fixed;inset:0}#status{position:fixed;top:45%;left:10%;right:10%;z-index:50;padding:15px;background:white;border-radius:12px}#top{position:fixed;top:calc(8px + env(safe-area-inset-top));left:12px;right:12px;z-index:20;padding:10px;background:#fffffff0;border-radius:12px;display:flex;gap:12px}#gps{flex:1;font-size:12px}#panel{position:fixed;z-index:20;bottom:calc(12px + env(safe-area-inset-bottom));left:12px;right:12px;padding:14px;background:#fffffff5;border-radius:15px;box-shadow:0 3px 15px #0002}#title{font-weight:bold}#tabs{display:flex;margin:8px 0;gap:6px}#tabs button{flex:1;padding:7px;border:1px solid #ddd;border-radius:8px}#tabs button.active{background:#dbeafe}#departures{font-size:12px}#credits{font-size:9px;color:#77808f;margin-top:7px}#credits a{color:inherit;text-decoration:none}#fit{border:0;background:#dbeafe;border-radius:8px;padding:7px;color:#155ac1}.maplibregl-ctrl-top-right{top:60px}.maplibregl-ctrl-bottom-left,.maplibregl-ctrl-bottom-right{bottom:160px}</style></head><body>'+
 '<div id="map"></div><div id="status">Loading map…</div><div id="top"><span id="gps">Waiting for GPS…</span><button id="fit">Fit shuttles</button></div>'+
 '<div id="panel"><div id="title">SoHo Lofts</div><div id="tabs"><button data-stop="soho">SoHo</button><button data-stop="hoboken">Hoboken</button><button data-stop="newport">Newport</button></div><div id="departures"></div><small>Scheduled departures, not live ETAs</small><div id="credits">Map: <a href="https://openmaptiles.org/" target="_blank" rel="noopener">© OpenMapTiles</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap contributors</a></div></div>'+
 '<script src="https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.js"></'+'script><script>window.DATA='+JSON.stringify(data)+';('+mapUI.toString()+')();</'+'script></body></html>';
 const web=new WebView();await web.loadHTML(html,"https://openfreemap.org/");
 let stop=false,busy=false,timer;
 async function poll(){if(!creds||stop||busy)return;busy=true;try{const s=await gps(creds);if(!stop)await web.evaluateJavaScript("window.receiveVehicleData && window.receiveVehicleData("+JSON.stringify(s)+")",false);}catch(e){if(!stop)try{await web.evaluateJavaScript("window.receiveVehicleError && window.receiveVehicleError("+JSON.stringify(String(e))+")",false);}catch(_){}}finally{busy=false;}}
 const dismissed=web.present(true);
 try{if(creds){timer=Timer.schedule(5000,true,()=>{poll().catch(e=>console.warn(e));});poll().catch(e=>console.warn(e));}await dismissed;}
 finally{stop=true;if(timer)timer.invalidate();}
}
async function main(options){if(config.runsInWidget)Script.setWidget(await widget(options.tapURL||URLScheme.forRunningScript()));else await showMap();}
module.exports.main=main;