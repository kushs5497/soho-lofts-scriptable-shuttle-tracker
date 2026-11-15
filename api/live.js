"use strict";

// SoHo Lofts web API for Vercel Node.js functions.
// Set SHUTTLE_USERNAME, SHUTTLE_PASSWORD and RIDEPATH_SECRET_TOKEN in Vercel.
// Do not use NEXT_PUBLIC_ prefixes: these values must stay on the server.
const AUTH_URL="https://fim.api.us.fleetmatics.com/token";
const PLOTS_URL="https://reveal.us.vzconnect.com/plot/Plot/GetVehiclePlotsForUserWithMetadata";
const PATH_URL="https://panynj-path-af-tb.azurewebsites.net/api/tokenrequest?TKrTIgWSdgikIrqvftckyOh";
// The public map gets the same real branding images used by the iOS Scriptable map.
// Proxying them as data URIs keeps canvas icons usable without cross-origin taint.
const SOHO_LOGO="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTkBtP0Tuh9VG-ATuApuApK_5mtOFCwTeisS-y7xZoKZA&s";
const PATH_LOGO="https://upload.wikimedia.org/wikipedia/commons/f/f3/PATH_logo.svg";
let brandingCache=null;
async function loadBranding(){
  if(brandingCache&&Date.now()-brandingCache.at<86400000)return {logos:brandingCache.logos};
  const logos=await Promise.all([SOHO_LOGO,PATH_LOGO].map(async url=>{
    const control=new AbortController(),timer=setTimeout(()=>control.abort(),9000);
    try{
      const response=await fetch(url,{signal:control.signal,headers:{Accept:"image/*"},cache:"force-cache"});
      if(!response.ok)throw Error("Branding HTTP "+response.status);
      const type=(response.headers.get("content-type")||"").split(";")[0].trim().toLowerCase();
      if(!["image/svg+xml","image/png","image/jpeg","image/webp"].includes(type))
        throw Error("Unexpected logo content type");
      const bytes=Buffer.from(await response.arrayBuffer());
      if(bytes.length>160000)throw Error("Logo exceeds safe size");
      return "data:"+type+";base64,"+bytes.toString("base64");
    }finally{clearTimeout(timer)}
  }));
  brandingCache={logos,at:Date.now()};
  return {logos};
}
let vehicleToken=null;
let gpsCache=null;
let gpsCachedAt=0;

function json(res,status,data){
  res.setHeader("Content-Type","application/json; charset=utf-8");
  res.setHeader("Cache-Control","private, no-store, max-age=0");
  res.setHeader("X-Content-Type-Options","nosniff");
  res.status(status).end(JSON.stringify(data));
}
async function request(url,options={}){
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),12000);
  try{
    const response=await fetch(url,{...options,signal:ctl.signal,cache:"no-store"});
    const body=await response.text();
    if(!response.ok){
      const e=new Error("Upstream HTTP "+response.status);
      e.status=response.status;
      throw e;
    }
    return body;
  }finally{clearTimeout(timer)}
}
async function acquireVehicleToken(){
  const user=process.env.SHUTTLE_USERNAME,pass=process.env.SHUTTLE_PASSWORD;
  if(!user||!pass)throw new Error("Shuttle GPS not configured");
  const raw=await request(AUTH_URL,{headers:{
    Authorization:"Basic "+Buffer.from(user+":"+pass).toString("base64"),
    Accept:"application/json"
  }});
  let token;
  try{
    const data=JSON.parse(raw);
    token=typeof data==="string"?data:data.token||data.access_token||data.Token||data.accessToken;
  }catch(_){token=raw}
  if(typeof token!=="string"||!token.trim())throw Error("Invalid Verizon authentication response");
  vehicleToken=token.trim().replace(/^Bearer\s+/i,"").replace(/^"|"$/g,"");
}
async function loadGPS(){
  if(gpsCache&&Date.now()-gpsCachedAt<4500)return gpsCache;
  if(!vehicleToken)await acquireVehicleToken();
  const headers=()=>({
    Authorization:"Bearer "+vehicleToken,
    Accept:"application/json, text/plain, */*",
    Referer:"https://reveal.us.vzconnect.com/en-US/live-map/"
  });
  let raw;
  try{raw=await request(PLOTS_URL,{headers:headers()})}
  catch(e){
    if(e.status!==401)throw e;
    await acquireVehicleToken();
    raw=await request(PLOTS_URL,{headers:headers()});
  }
  const data=JSON.parse(raw);
  if(!Array.isArray(data.Plots))throw Error("Unexpected vehicle plot response");
  const vehicles=data.Plots.map(p=>{
    const c=p.Coordinate;if(!c)return null;
    const lat=Number(c.Latitude),lon=Number(c.Longitude);
    if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return null;
    const id=String(p.id==null?p.vnme:p.id),name=String(p.vnme||"Vehicle "+id);
    const m=name.match(/(?:shuttle|soho\s*lofts|bus|vehicle)\s*#?\s*([123])\b/i)||name.match(/\b([123])$/);
    return {id,name,number:m?m[1]:"unknown",lat,lon,
      speed:p.spd==null?null:Number(p.spd),heading:p.dir==null?null:Number(p.dir),
      status:p.Status||"",iconClass:p.icncls||"",
      updated:p.tmeu||"",lastUpdate:p.LastUpdateForDisplay||p.tme||""};
  }).filter(Boolean);
  gpsCache={vehicles,at:Date.now()};
  gpsCachedAt=Date.now();
  return gpsCache;
}
async function pathConnection(station,direction){
  const token=process.env.RIDEPATH_SECRET_TOKEN;
  if(!token)throw Error("RidePATH token not configured");
  const stations={HOB:"Hoboken",NEW:"Newport"};
  if(!stations[station]||!["New York","New Jersey"].includes(direction)||
     (station==="HOB"&&direction!=="New York")){
    const err=new Error("Invalid PATH station or direction");err.status=400;throw err;
  }
  const authRaw=await request(PATH_URL,{
    method:"POST",
    headers:{Authorization:"Bearer "+token.trim().replace(/^Bearer\s+/i,""),
      AppName:"RidePATH",AppVersion:"6.2.2","Content-Type":"application/json"},
    body:JSON.stringify({station:stations[station],direction})
  });
  const auth=JSON.parse(authRaw);
  if(!auth.Url||!auth.AccessToken)throw Error("RidePATH negotiation token unavailable");
  const base=new URL(auth.Url);
  if(base.protocol!=="https:"||base.hostname!=="path-countdownclocks-signalr-50.service.signalr.net"||
     base.pathname!=="/client/")throw Error("Unexpected SignalR server URL");
  const negotiation=new URL(base);
  negotiation.pathname="/client/negotiate";
  negotiation.searchParams.set("negotiateVersion","1");
  const info=JSON.parse(await request(negotiation.toString(),{
    method:"POST",
    headers:{Authorization:"Bearer "+auth.AccessToken},
    body:""
  }));
  if(!info.connectionToken)throw Error("PATH connection token missing");
  base.protocol="wss:";
  base.searchParams.set("id",info.connectionToken);
  base.searchParams.set("access_token",auth.AccessToken);
  return {code:station,direction,
    expected:(direction==="New York"?"ToNY":"ToNJ")+","+station,
    url:base.toString()};
}
module.exports=async function handler(req,res){
  res.setHeader("Allow","GET");
  if(req.method!=="GET")return json(res,405,{error:"Method not allowed"});
  const kind=String(req.query.kind||"");
  if(kind!=="gps"&&kind!=="path"&&kind!=="logos")return json(res,400,{error:"Unknown live data type"});
  try{
    if(kind==="gps")return json(res,200,await loadGPS());
    if(kind==="logos")return json(res,200,await loadBranding());
    const station=String(req.query.station||"");
    const direction=String(req.query.direction||"");
    return json(res,200,await pathConnection(station,direction));
  }catch(e){
    console.error("[live API]",kind,e.message);
    if(e.status===400)return json(res,400,{error:e.message});
    if(/not configured/.test(e.message))return json(res,503,{error:e.message});
    return json(res,502,{error:"Live data provider unavailable"});
  }
};
