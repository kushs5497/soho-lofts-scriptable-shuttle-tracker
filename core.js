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
  // v17.2: styled DOM pins, anchored with MapLibre's own project() coordinates.
  // This deliberately avoids MapLibre Marker transforms and native icon layers.
  const D=window.DATA;
  const map=new maplibregl.Map({
    container:"map",
    style:"https://tiles.openfreemap.org/styles/positron",
    center:D.soho,
    zoom:14.7,
    attributionControl:false
  });
  let ready=false,last=null,first=true,selected="soho",userMoved=false;
  const stopPins=new Map(),busPins=new Map(),allPoints=new Set();

  function node(tag,className,parent,text){
    const e=document.createElement(tag);
    if(className)e.className=className;
    if(text!==undefined)e.textContent=String(text);
    if(parent)parent.appendChild(e);
    return e;
  }
  function safe(s){
    return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;")
      .replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  }
  function fit(duration){
    const b=new maplibregl.LngLatBounds();
    [D.soho,D.hob,D.npt].forEach(p=>b.extend(p));
    if(last)last.vehicles.forEach(v=>b.extend([v.lon,v.lat]));
    map.fitBounds(b,{padding:{top:145,bottom:230,left:55,right:55},maxZoom:15.5,duration:duration});
  }
  function refresh(){
    document.getElementById("title").textContent=({
      soho:"SoHo Lofts",hoboken:"Hoboken PATH",newport:"Newport PATH"
    })[selected];
    document.querySelectorAll("#tabs button").forEach(b=>b.className=b.dataset.stop===selected?"active":"");
    const el=document.getElementById("departures");el.textContent="";
    if(D.sunday){el.textContent="Call concierge for shuttle · 10 AM–6 PM";return;}
    const rows=D.events.filter(e=>e.origin===selected&&e.at>=Date.now()).slice(0,2);
    if(!rows.length){el.textContent="No more departures here today";return;}
    rows.forEach(e=>{
      const row=node("div","departure",el);
      const destination=e.dest==="soho"?"SoHo Lofts":e.dest==="newport"?"Newport PATH":"Hoboken PATH";
      row.textContent=e.label+" · Shuttle "+e.bus+" → "+destination;
    });
  }
  function popup(v){
    return "<b>"+safe(v.name)+"</b>"+
      "<div>Status: "+safe(v.iconClass||v.status||"Unknown")+"</div>"+
      "<div>Speed: "+safe(v.speed==null?"Unknown":v.speed+" mph")+"</div>"+
      "<div>Heading: "+safe(v.heading==null?"Unknown":v.heading+"°")+"</div>"+
      "<div>GPS update: "+safe(v.lastUpdate||"Unknown")+"</div>"+
      "<div>GPS coordinates: "+safe(v.lat.toFixed(5)+", "+v.lon.toFixed(5))+"</div>";
  }
  function gpsTimestamp(v){
    const t=v.updated;
    if(typeof t==="number"&&Number.isFinite(t))return t<1e12?t*1000:t;
    if(typeof t!=="string")return null;
    const dotnet=/^\/Date\((\d+)/.exec(t);
    if(dotnet)return Number(dotnet[1]);
    if(t.indexOf("T")<0||!/(Z|[+-]\d\d:?\d\d)$/.test(t))return null;
    const parsed=Date.parse(t);return Number.isFinite(parsed)?parsed:null;
  }
  function moving(v){
    const status=String(v.iconClass||v.status||"").toLowerCase();
    const t=gpsTimestamp(v);
    const fresh=t==null?true:Date.now()-t<120000;
    return fresh&&!status.includes("stop")&&!status.includes("idle")&&
      v.speed!=null&&Number.isFinite(v.speed)&&v.speed>2&&
      v.heading!=null&&Number.isFinite(v.heading);
  }

  // CSS pixel positions live in MapLibre's canvas coordinate system,
  // NOT device pixels or tile/world pixels. The root gets no CSS transform.
  let overlay;
  function makePoint(coords){
    const root=node("div","geo-point",overlay);
    root.style.left="0px";root.style.top="0px";
    const point={root,coords};
    allPoints.add(point);position(point);
    return point;
  }
  function position(point){
    const projected=map.project(point.coords);
    point.root.style.left=projected.x+"px";
    point.root.style.top=projected.y+"px";
    // Hide distant pins so they cannot appear over the status/panel.
    const wide=map.getCanvasContainer().clientWidth;
    const high=map.getCanvasContainer().clientHeight;
    point.root.style.visibility=
      projected.x < -120 || projected.y < -120 ||
      projected.x > wide+120 || projected.y > high+120
      ? "hidden" : "visible";
  }
  function syncPoints(){if(overlay)allPoints.forEach(position);}
  function removePoint(point){
    if(!point)return;
    allPoints.delete(point);
    point.root.remove();
  }

  function addStop(id,name,coords,logo,label){
    const pt=makePoint(coords);
    const visual=node("div","poi-visual",pt.root);
    visual.style.width="38px";visual.style.height="50px";
    const shape=document.createElementNS("http://www.w3.org/2000/svg","svg");
    shape.setAttribute("viewBox","0 0 60 78");
    shape.setAttribute("class","poi-shape");
    shape.setAttribute("aria-hidden","true");
    const path=document.createElementNS("http://www.w3.org/2000/svg","path");
    path.setAttribute("d","M30 1 C13 1 1 14 1 30 C1 49 18 68 30 78 C42 68 59 49 59 30 C59 14 47 1 30 1 Z");
    path.setAttribute("fill","#fff");
    shape.appendChild(path);
    visual.appendChild(shape);

    const logoShell=node("div","poi-logo",visual);
    if(logo){
      const image=node("img","",logoShell);
      image.src=logo;image.alt=name;
      image.onerror=function(){
        logoShell.textContent=label;
        logoShell.classList.add("poi-logo-fallback");
      };
    }else{
      logoShell.textContent=label;
      logoShell.classList.add("poi-logo-fallback");
    }
    node("div","poi-label",visual,name);
    visual.addEventListener("click",function(event){
      event.stopPropagation();
      selected=id;refresh();
    });
    stopPins.set(id,pt);
  }

  function addBus(v){
    const pt=makePoint([v.lon,v.lat]);
    const visual=node("div","bus-visual",pt.root);
    const rotor=node("div","bus-rotor",visual);
    node("div","bus-arrow",rotor);
    const badge=node("div","bus-badge",visual);
    visual.addEventListener("click",function(event){
      event.stopPropagation();
      if(!pt.vehicle)return;
      new maplibregl.Popup({offset:22,maxWidth:"300px"})
        .setLngLat([pt.vehicle.lon,pt.vehicle.lat])
        .setHTML(popup(pt.vehicle))
        .addTo(map);
    });
    pt.rotor=rotor;
    pt.badge=badge;
    busPins.set(v.id,pt);
    return pt;
  }
  function updateBus(v){
    let pt=busPins.get(v.id);
    if(!pt)pt=addBus(v);
    pt.vehicle=v;
    pt.coords=[v.lon,v.lat];
    const n=["1","2","3"].includes(String(v.number))?String(v.number):"unknown";
    const color=D.colors[n]||D.colors.unknown;
    pt.badge.style.backgroundColor=color;
    pt.badge.textContent=n==="unknown"?"?":n;
    pt.rotor.style.setProperty("--bus-color",color);
    pt.rotor.style.display=moving(v)?"block":"none";
    // The arrow turns, while the badge and its number remain upright.
    pt.rotor.style.transform="translate(-50%, -50%) rotate("+
      (v.heading==null?0:v.heading)+"deg)";
    position(pt);
  }

  window.receiveVehicleData=function(snapshot){
    last=snapshot;
    if(!ready)return true;
    const seen=new Set();
    snapshot.vehicles.forEach(v=>{
      seen.add(v.id);
      updateBus(v);
    });
    for(const [id,pt] of busPins){
      if(!seen.has(id)){
        removePoint(pt);
        busPins.delete(id);
      }
    }
    document.getElementById("gps").textContent=
      snapshot.vehicles.length+" vehicle"+(snapshot.vehicles.length===1?"":"s")+
      " · Synced "+new Date(snapshot.at).toLocaleTimeString([],{
        hour:"numeric",minute:"2-digit",second:"2-digit"
      });
    syncPoints();
    if(first){
      first=false;
      if(!userMoved)fit(0);
    }
    return true;
  };
  window.receiveVehicleError=function(error){
    document.getElementById("gps").textContent="GPS: "+String(error);
    return true;
  };

  map.on("load",function(){
    try{
      // Overlay is a child of the SAME element as MapLibre's canvas.
      // Position from project() and refresh on each rendered map frame.
      overlay=node("div","geo-overlay",map.getCanvasContainer());
      addStop("soho","SoHo Lofts",D.soho,D.logos[0],"SoHo");
      addStop("hoboken","Hoboken PATH",D.hob,D.logos[1],"PATH");
      addStop("newport","Newport PATH",D.npt,D.logos[1],"PATH");
      document.querySelectorAll("#tabs button").forEach(b=>{
        b.onclick=function(){selected=b.dataset.stop;refresh();};
      });
      document.getElementById("fit").onclick=function(){fit(650);};
      map.on("render",syncPoints);
      map.on("move",syncPoints);
      map.on("resize",syncPoints);
      map.on("dragstart",function(){userMoved=true;});
      map.on("touchstart",function(){userMoved=true;});
      map.on("wheel",function(){userMoved=true;});
      window.addEventListener("resize",function(){map.resize();syncPoints();});
      selected="soho";refresh();setInterval(refresh,30000);
      ready=true;
      document.getElementById("status").style.display="none";
      map.resize();
      fit(0);
      if(last)window.receiveVehicleData(last);
      syncPoints();
    }catch(err){
      document.getElementById("status").textContent="Map setup error: "+err;
    }
  });
  map.on("error",function(err){
    if(!ready&&err.error)document.getElementById("status").textContent="Map tile error: "+err.error.message;
  });
  setTimeout(function(){
    if(!ready)document.getElementById("status").textContent="Map timed out loading";
  },20000);
}
async function showMap(){
 const creds=await credentials(),logos=await Promise.all([imageData(SOHO_LOGO,false),imageData(PATH_LOGO,true)]),day=schedule(new Date());
 const data={soho:SOHO,hob:HOB,npt:NPT,logos,colors:COLORS,events:day.events,sunday:day.dow===0};
 const html='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,viewport-fit=cover"><link rel="stylesheet" href="https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.css"><style>'+
 'html,body,#map{margin:0;width:100%;height:100%;font-family:-apple-system}#map{position:fixed;inset:0}.geo-overlay{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:2}.geo-point{position:absolute;left:0;top:0;width:0;height:0;pointer-events:none}.poi-visual{position:absolute;left:0;top:0;transform:translate(-50%,-100%);cursor:pointer;pointer-events:auto}.poi-shape{width:38px;height:50px;display:block;filter:drop-shadow(0 3px 4px #0003)}.poi-logo{position:absolute;left:5px;top:5px;width:28px;height:28px;background:#d9ecf6;border-radius:50%;display:flex;align-items:center;justify-content:center;overflow:hidden}.poi-logo img{display:block;width:100%;height:100%;object-fit:contain}.poi-logo-fallback{font-weight:700;font-size:9px;color:#152b43}.poi-label{position:absolute;left:50%;bottom:55px;transform:translateX(-50%);white-space:nowrap;background:#fff;border:1px solid #e7edf4;border-radius:7px;box-shadow:0 2px 7px #0002;padding:4px 7px;font-size:11px;font-weight:650;color:#18283c;line-height:1.15}.bus-visual{position:absolute;left:0;top:0;width:25px;height:25px;transform:translate(-50%,-50%);pointer-events:auto;cursor:pointer}.bus-badge{position:absolute;inset:0;z-index:2;border:2px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:14px;font-weight:750;line-height:1;box-shadow:0 2px 5px #0004}.bus-rotor{position:absolute;z-index:1;left:50%;top:50%;width:44px;height:44px;pointer-events:none;transform-origin:center}.bus-arrow{position:absolute;top:0;left:50%;transform:translateX(-50%);width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:13px solid var(--bus-color,#2563eb);filter:drop-shadow(0 0 1px #fff)}#status{position:fixed;top:45%;left:10%;right:10%;z-index:50;padding:15px;background:white;border-radius:12px}#top{position:fixed;top:calc(8px + env(safe-area-inset-top));left:12px;right:12px;z-index:20;padding:10px;background:#fffffff0;border-radius:12px;display:flex;gap:12px}#gps{flex:1;font-size:12px}#panel{position:fixed;z-index:20;bottom:calc(12px + env(safe-area-inset-bottom));left:12px;right:12px;padding:14px;background:#fffffff5;border-radius:15px;box-shadow:0 3px 15px #0002}#title{font-weight:bold}#tabs{display:flex;margin:8px 0;gap:6px}#tabs button{flex:1;padding:7px;border:1px solid #ddd;border-radius:8px}#tabs button.active{background:#dbeafe}#departures{font-size:12px}#credits{font-size:9px;color:#77808f;margin-top:7px}#credits a{color:inherit;text-decoration:none}#fit{border:0;background:#dbeafe;border-radius:8px;padding:7px;color:#155ac1}.maplibregl-ctrl-top-right{top:60px}.maplibregl-ctrl-bottom-left,.maplibregl-ctrl-bottom-right{bottom:160px}</style></head><body>'+
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