"use strict";
// Privacy-conscious, allowlisted PostHog product analytics relay.
// No credentials, GPS coordinates, IP addresses, or personal profiles are sent.
const EVENTS=new Set(["map_open","path_open","path_destination_open","path_load","shuttle_open","shuttle_stop_select","widget_refresh","path_api_load","data_error"]);
const FIELDS=new Set(["station","destination","shuttle","stop","version","duration_ms","status","cache","service","error_type"]);
const SOURCES=new Set(["website","scriptable_map","scriptable_widget"]);
module.exports=async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  res.setHeader("Cache-Control","no-store");
  if(req.method==="OPTIONS")return res.status(204).end();
  if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
  if(Number(req.headers["content-length"]||0)>4096)return res.status(413).json({error:"Payload too large"});
  const input=typeof req.body==="string"?(()=>{try{return JSON.parse(req.body)}catch{return null}})():req.body;
  if(!input||!EVENTS.has(input.event)||!SOURCES.has(input.source))return res.status(400).json({error:"Invalid event"});
  const distinct=String(input.distinct_id||"");
  if(!/^[a-zA-Z0-9_-]{8,80}$/.test(distinct))return res.status(400).json({error:"Invalid anonymous identifier"});
  const props={$lib:"soho-transit-relay",$process_person_profile:false,source:input.source};
  if(input.properties&&typeof input.properties==="object"&&!Array.isArray(input.properties)){
    for(const [key,value] of Object.entries(input.properties)){
      if(!FIELDS.has(key))continue;
      if(key==="duration_ms"){
        if(typeof value==="number"&&Number.isFinite(value)&&value>=0&&value<=120000)props[key]=Math.round(value);
      }else if(typeof value==="string"&&value.length<=80&&/^[a-zA-Z0-9 _.,:-]*$/.test(value)){
        props[key]=value;
      }
    }
  }
  const key=process.env.POSTHOG_PROJECT_KEY,host=process.env.POSTHOG_HOST;
  if(!key||!host){
    if(process.env.NODE_ENV!=="production")console.warn("POSTHOG_PROJECT_KEY or POSTHOG_HOST variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once configured");
    return res.status(204).end();
  }
  try{
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),1800);
    let response;
    try{response=await fetch(host.replace(/[/]$/,"")+"/capture/",{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({api_key:key,event:input.event,distinct_id:distinct,properties:props}),signal:controller.signal
    })}finally{clearTimeout(timer)}
    if(!response.ok){console.warn("PostHog ingest returned "+response.status);return res.status(202).json({queued:false})}
    return res.status(202).json({queued:true});
  }catch(_){return res.status(202).json({queued:false})}
};
