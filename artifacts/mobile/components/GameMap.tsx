import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

import { NearbyUser, Spot } from "@/context/GameContext";

export interface GameMapHandle {
  centerOnUser: () => void;
  centerOn: (lat: number, lng: number) => void;
  sendEmojiReaction: (userId: string, emoji: string, fromUserId?: string) => void;
  mineHit: (spotId: string, clickCount: number) => void;
  fireAtSpot: (spotId: string, itemType: string) => void;
  fireAtUser: (userId: string, itemType: string) => void;
}

const USER_RADIUS = 60;

const MAP_HTML = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body,#map{width:100%;height:100%;background:#050A14;overflow:hidden}
.leaflet-container{background:#050A14}
.leaflet-control-attribution{display:none}
.leaflet-pane,.leaflet-top,.leaflet-bottom{z-index:1}
.leaflet-tile-pane{filter:sepia(1) hue-rotate(185deg) saturate(3) brightness(0.55)}
@keyframes badgePop{0%{transform:translateX(-50%) scale(0.5);opacity:0}60%{transform:translateX(-50%) scale(1.15)}100%{transform:translateX(-50%) scale(1);opacity:1}}
@keyframes emojiBurst{0%{transform:translate(-50%,-50%) scale(1.6);opacity:1}100%{transform:translate(-50%,-50%) scale(3);opacity:0}}
@keyframes mineFloat{0%{transform:translateX(-50%) translateY(0) scale(1);opacity:1}60%{transform:translateX(-50%) translateY(-28px) scale(1.15);opacity:1}100%{transform:translateX(-50%) translateY(-50px) scale(0.9);opacity:0}}
@keyframes minePulse{0%{transform:scale(1)}30%{transform:scale(1.28)}70%{transform:scale(0.95)}100%{transform:scale(1)}}
</style>
</head>
<body>
<div id="map"></div>
<script>
var C_DARK={
  accent:'#7B68EE',bg:'#08081A',bgSec:'#0D0D24',
  surface:'#13132E',border:'#242450',border33:'#24245033',
  coupon:'#F0A050',money:'#60C878',product:'#50A8F0',rare:'#B87CF0',
  warning:'#F0A050',danger:'#F06565',info:'#50A8F0',spotMoney:'#60C878',
  text:'#EEEEF8',textMuted:'#484870',
  shadow:'text-shadow:0 1px 5px rgba(0,0,0,0.9),0 0 10px rgba(0,0,0,0.6)',
  mapBg:'#050A14',overlayBg:'#0B1829',overlayOpacity:'0.45',
  tileFilter:'sepia(1) hue-rotate(185deg) saturate(3) brightness(0.55)',
  tileUrl:'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
};
var C_LIGHT={
  accent:'#7B68EE',bg:'#E8ECF5',bgSec:'#F0F3FF',
  surface:'#FFFFFF',border:'#C8CCDD',border33:'#C8CCDD33',
  coupon:'#D98A2A',money:'#3EA85A',product:'#3A98E0',rare:'#A86CDE',
  warning:'#D98A2A',danger:'#E05050',info:'#3A98E0',spotMoney:'#3EA85A',
  text:'#0D0D2B',textMuted:'#8888A8',
  shadow:'text-shadow:0 1px 3px rgba(255,255,255,0.85),0 0 6px rgba(255,255,255,0.5)',
  mapBg:'#E8ECF5',overlayBg:'#DCE4F5',overlayOpacity:'0.18',
  tileFilter:'sepia(0.15) hue-rotate(185deg) saturate(1.25) brightness(1.02)',
  tileUrl:'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
};
var C=C_DARK;
var SPOT_COLOR={coupon:C.coupon,money:C.money,product:C.product,rare:C.rare};
var ICONS={
  money:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  coupon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
  product:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>',
  rare:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
};

var map=L.map('map',{center:[-23.5505,-46.6333],zoom:17,zoomControl:false,attributionControl:false});

var tileLayer=L.tileLayer(C.tileUrl,{maxZoom:20,subdomains:'abcd'}).addTo(map);

map.on('click',function(){send({type:'MAP_PRESS'})});

var navyOverlay=document.createElement('div');
navyOverlay.style.cssText='position:absolute;inset:0;background:'+C.overlayBg+';opacity:'+C.overlayOpacity+';z-index:250;pointer-events:none;';
map.getContainer().querySelector('.leaflet-map-pane').appendChild(navyOverlay);

var spotMarkers={},spotCircles={},userMarkers={};
var playerDot=null,playerCircle=null;
var selSpot=null,selUser=null;
var userCollectingSpot={};
var playerCollectingSpotId=null;
var currentSpots=[];var currentUsers=[];var playerLoc=null;var mineableSpotId=null;
var playerProfile=null;var playerCollectingData=null;

function updateSpotColorMap(){SPOT_COLOR={coupon:C.coupon,money:C.money,product:C.product,rare:C.rare};}

window.applyTheme=function(isDark){
  C=isDark?C_DARK:C_LIGHT;
  updateSpotColorMap();
  map.removeLayer(tileLayer);
  tileLayer=L.tileLayer(C.tileUrl,{maxZoom:20,subdomains:'abcd'}).addTo(tileLayer?map:map);
  var tp=document.querySelector('.leaflet-tile-pane');
  if(tp)tp.style.filter=C.tileFilter;
  var mapEl=document.getElementById('map');
  if(mapEl){mapEl.style.background=C.mapBg;}
  var lc=document.querySelector('.leaflet-container');
  if(lc){lc.style.background=C.mapBg;}
  navyOverlay.style.background=C.overlayBg;
  navyOverlay.style.opacity=C.overlayOpacity;
  updateSpots(currentSpots);
  updateUsers(currentUsers);
  if(playerProfile&&playerLoc){updatePlayer(playerLoc,null,playerProfile,playerCollectingData);}
};

function haversineM(lat1,lon1,lat2,lon2){
  var R=6371000,dLat=(lat2-lat1)*Math.PI/180,dLon=(lon2-lon1)*Math.PI/180;
  var a=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
function spotColorForPos(lat,lng){
  var best=null,bestD=Infinity;
  for(var i=0;i<currentSpots.length;i++){
    var s=currentSpots[i];
    var d=haversineM(lat,lng,s.latitude,s.longitude);
    if(d<=s.radius&&d<bestD){best=s;bestD=d;}
  }
  return best?(SPOT_COLOR[best.type]||C.accent):null;
}
function getHColor(health,maxHealth){var r=maxHealth>0?health/maxHealth:1;return r>0.6?C.spotMoney:r>0.3?C.warning:C.danger;}

function heartSvg(color){
  return '<svg width="13" height="13" viewBox="0 0 24 24" fill="'+color+'" stroke="'+color+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
}
function flashSvg(color){
  return '<svg width="11" height="11" viewBox="0 0 24 24" fill="'+color+'" stroke="'+color+'" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>';
}
function getStrColor(s){return s>=200?'#ff6b00':s>=150?'#c084fc':s>=100?'#60a5fa':s>=50?'#94a3b8':C.danger;}
function avatarHtml(avatar,size){
  if(avatar&&(avatar.indexOf('http://')===0||avatar.indexOf('https://')===0)){
    return '<img src="'+avatar+'" style="width:'+size+'px;height:'+size+'px;border-radius:50%;object-fit:cover;display:block;" />';
  }
  return '<span>'+avatar+'</span>';
}

function collectBadge(progress){
  return '<div style="'
    +'position:relative;display:inline-flex;align-items:center;gap:3px;'
    +'border:1px solid '+C.warning+'88;border-radius:8px;'
    +'padding:2px 7px;white-space:nowrap;overflow:hidden;'
    +'background:'+C.bgSec+';">'
    +'<div style="position:absolute;left:0;top:0;bottom:0;width:'+progress+'%;background:'+C.warning+'2A;transition:width 0.4s ease;"></div>'
    +'<span style="position:relative;font-size:10px;">⛏️</span>'
    +'<span style="position:relative;color:'+C.warning+';font-size:10px;font-weight:700;">'+progress+'%</span>'
    +'</div>';
}

function spotIcon(spot,selected){
  var color=SPOT_COLOR[spot.type]||C.accent;
  var scale=selected?'transform:scale(1.15);':'';
  var bg=selected?color+'30':color+'18';
  var shadow=C.shadow;
  var html='<div style="display:flex;flex-direction:column;align-items:center;width:100px;">'
    +'<div style="width:44px;height:44px;border-radius:12px;border:2px solid '+color+';background:'+bg+';display:flex;align-items:center;justify-content:center;color:'+color+';'+scale+'">'
    +(ICONS[spot.type]||ICONS.rare)
    +'</div>'
    +'<div style="margin-top:3px;color:'+C.text+';font-size:11px;font-weight:700;letter-spacing:0.3px;text-align:center;max-width:96px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'+shadow+';">'+spot.title+'</div>'
    +'</div>';
  return L.divIcon({html:html,className:'',iconSize:[100,62],iconAnchor:[50,22]});
}

function userIcon(user,selected,spotColor){
  var shadow=C.shadow;
  if(selected){
    var hColor=getHColor(user.health,user.maxHealth);
    var bc=spotColor||C.accent;
    var statusRow=user.collectingSpotId
      ?'<div style="display:flex;justify-content:center;gap:4px;margin-bottom:2px;">'+collectBadge(user.collectProgress)+'</div>'
      :'';
    var avatarOffsetY=user.collectingSpotId?19:0;
    var totalH=user.collectingSpotId?141:122;
    var html=''
      +'<div style="width:170px;display:flex;flex-direction:column;align-items:center;">'
        +statusRow
        +'<div style="width:54px;height:54px;border-radius:50%;border:2.5px solid '+bc+';background:'+C.bgSec+';display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 0 16px '+bc+'66;overflow:hidden;">'+avatarHtml(user.avatar,50)+'</div>'
        +'<div style="margin-top:5px;color:'+C.text+';font-size:12px;font-weight:700;letter-spacing:0.3px;text-align:center;'+shadow+';">'+user.name+'</div>'
        +'<div style="margin-top:3px;display:flex;align-items:center;justify-content:center;gap:4px;">'
          +heartSvg(hColor)
          +'<span style="color:'+hColor+';font-size:11px;font-weight:700;'+shadow+';">'+user.health+'</span>'
          +'<span style="color:'+C.border+';font-size:10px;margin:0 1px;">|</span>'
          +flashSvg(getStrColor(user.strength||0))
          +'<span style="color:'+getStrColor(user.strength||0)+';font-size:11px;font-weight:700;'+shadow+';">'+(user.strength!=null?Math.round(user.strength):100)+'</span>'
        +'</div>'
      +'</div>';
    return L.divIcon({html:html,className:'',iconSize:[170,totalH],iconAnchor:[85,avatarOffsetY+27]});
  }
  var hColorDim=getHColor(user.health,user.maxHealth);
  var bc=spotColor||hColorDim;
  var statsRow=''
    +'<div style="margin-top:2px;display:flex;align-items:center;justify-content:center;gap:3px;">'
      +heartSvg(hColorDim)
      +'<span style="color:'+hColorDim+';font-size:10px;font-weight:700;'+shadow+';">'+user.health+'</span>'
      +'<span style="color:'+C.border+';font-size:9px;margin:0 1px;">|</span>'
      +flashSvg(getStrColor(user.strength||0))
      +'<span style="color:'+getStrColor(user.strength||0)+';font-size:10px;font-weight:700;'+shadow+';">'+(user.strength!=null?Math.round(user.strength):100)+'</span>'
    +'</div>';
  if(user.collectingSpotId){
    var badge=collectBadge(user.collectProgress);
    var html='<div style="display:flex;flex-direction:column;align-items:center;width:130px;">'
      +'<div style="display:flex;justify-content:center;gap:4px;margin-bottom:2px;">'+badge+'</div>'
      +'<div style="width:40px;height:40px;border-radius:50%;border:2.5px solid '+bc+';background:'+C.bgSec+';display:flex;align-items:center;justify-content:center;font-size:18px;overflow:hidden;">'+avatarHtml(user.avatar,36)+'</div>'
      +'<div style="margin-top:3px;color:'+C.text+';font-size:11px;font-weight:700;letter-spacing:0.3px;text-align:center;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'+shadow+';">'+user.name+'</div>'
      +statsRow
      +'</div>';
    return L.divIcon({html:html,className:'',iconSize:[130,94],iconAnchor:[65,36]});
  }
  var html='<div style="display:flex;flex-direction:column;align-items:center;width:130px;">'
    +'<div style="width:40px;height:40px;border-radius:50%;border:2.5px solid '+bc+';background:'+C.bgSec+';display:flex;align-items:center;justify-content:center;font-size:18px;overflow:hidden;">'+avatarHtml(user.avatar,36)+'</div>'
    +'<div style="margin-top:3px;color:'+C.text+';font-size:11px;font-weight:700;letter-spacing:0.3px;text-align:center;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'+shadow+';">'+user.name+'</div>'
    +statsRow
    +'</div>';
  return L.divIcon({html:html,className:'',iconSize:[130,78],iconAnchor:[65,20]});
}

function showEmojiReaction(userId,emoji,fromUserId){
  var targetMarker=userMarkers[userId];
  if(!targetMarker)return;
  var toPt=map.latLngToContainerPoint(targetMarker.getLatLng());
  var fromPt;
  if(fromUserId&&userMarkers[fromUserId]){
    fromPt=map.latLngToContainerPoint(userMarkers[fromUserId].getLatLng());
  } else if(playerDot){
    fromPt=map.latLngToContainerPoint(playerDot.getLatLng());
  } else {
    fromPt={x:toPt.x,y:toPt.y+80};
  }
  var el=document.createElement('div');
  el.style.cssText=[
    'position:absolute',
    'left:'+fromPt.x+'px',
    'top:'+fromPt.y+'px',
    'transform:translate(-50%,-50%)',
    'font-size:26px',
    'z-index:999',
    'pointer-events:none',
    'opacity:1',
    'will-change:left,top'
  ].join(';');
  el.textContent=emoji;
  var mapEl=document.getElementById('map');
  mapEl.appendChild(el);
  var duration=700;
  var startTs=null;
  function easeInOut(t){return t<0.5?2*t*t:-1+(4-2*t)*t;}
  function step(ts){
    if(!startTs)startTs=ts;
    var p=Math.min((ts-startTs)/duration,1);
    var t=easeInOut(p);
    var x=fromPt.x+(toPt.x-fromPt.x)*t;
    var y=fromPt.y+(toPt.y-fromPt.y)*t;
    var scale=0.7+0.6*t;
    el.style.left=x+'px';
    el.style.top=y+'px';
    el.style.transform='translate(-50%,-50%) scale('+scale+')';
    el.style.opacity=p>0.85?String(1-(p-0.85)/0.15):'1';
    if(p<1){
      requestAnimationFrame(step);
    } else {
      el.parentNode&&el.parentNode.removeChild(el);
      var burst=document.createElement('div');
      burst.style.cssText=[
        'position:absolute',
        'left:'+toPt.x+'px',
        'top:'+toPt.y+'px',
        'font-size:26px',
        'z-index:999',
        'pointer-events:none',
        'animation:emojiBurst 0.4s ease-out forwards'
      ].join(';');
      burst.textContent=emoji;
      mapEl.appendChild(burst);
      setTimeout(function(){burst.parentNode&&burst.parentNode.removeChild(burst)},450);
    }
  }
  requestAnimationFrame(step);
}

function applySpotVisibility(){
  Object.keys(spotMarkers).forEach(function(id){
    var hide=selUser!==null||(selSpot!==null&&selSpot!==id);
    var m=spotMarkers[id];
    var c=spotCircles[id];
    if(m){
      var el=m.getElement();
      if(el){
        el.style.opacity=hide?'0':'1';
        el.style.pointerEvents=hide?'none':'auto';
      }
    }
    if(c){c.setStyle({opacity:hide?0:0.35,fillOpacity:hide?0:0.07});}
  });
}

function applyUserVisibility(){
  Object.keys(userMarkers).forEach(function(id){
    var hide=selUser!==null&&selUser!==id;
    var m=userMarkers[id];
    if(m){
      var el=m.getElement();
      if(el){
        el.style.opacity=hide?'0':'1';
        el.style.pointerEvents=hide?'none':'auto';
      }
    }
  });
}

function applyPlayerVisibility(){
  if(!playerDot)return;
  var el=playerDot.getElement();
  if(!el)return;
  el.style.opacity='1';
}

function updateSpots(spots){
  currentSpots=spots;
  var ids=spots.map(function(s){return s.id});
  Object.keys(spotMarkers).forEach(function(id){
    if(ids.indexOf(id)<0){
      map.removeLayer(spotMarkers[id]);delete spotMarkers[id];
      if(spotCircles[id]){map.removeLayer(spotCircles[id]);delete spotCircles[id]}
    }
  });
  spots.forEach(function(spot){
    var ll=[spot.latitude,spot.longitude];
    var icon=spotIcon(spot,selSpot===spot.id);
    if(spotMarkers[spot.id]){
      spotMarkers[spot.id].setIcon(icon);
    } else {
      var m=L.marker(ll,{icon:icon,zIndexOffset:100});
      (function(sid){m.on('click',function(e){L.DomEvent.stopPropagation(e);send({type:'SPOT_PRESS',spotId:sid})})})(spot.id);
      m.addTo(map);spotMarkers[spot.id]=m;
    }
    var color=SPOT_COLOR[spot.type]||C.accent;
    var playerInRange=mineableSpotId===spot.id;
    var circleOpts=playerInRange
      ?{radius:spot.radius,color:color,fillColor:color,fillOpacity:0.15,weight:3,opacity:0.9}
      :{radius:spot.radius,color:color,fillColor:color,fillOpacity:0.07,weight:1.5,opacity:0.35};
    if(spotCircles[spot.id]){
      spotCircles[spot.id].setStyle(circleOpts);
    } else {
      spotCircles[spot.id]=L.circle(ll,circleOpts).addTo(map);
    }
    var circleEl=spotCircles[spot.id]?spotCircles[spot.id].getElement():null;
    if(circleEl){
      circleEl.style.filter=playerInRange?'drop-shadow(0 0 6px '+color+') drop-shadow(0 0 12px '+color+'88)':'';
    }
  });
  applySpotVisibility();
}

function updateUsers(users){
  currentUsers=users;
  var ids=users.map(function(u){return u.id});
  Object.keys(userMarkers).forEach(function(id){
    if(ids.indexOf(id)<0){map.removeLayer(userMarkers[id]);delete userMarkers[id];delete userCollectingSpot[id];}
  });
  users.forEach(function(user){
    userCollectingSpot[user.id]=user.collectingSpotId||null;
    var ll=[user.latitude,user.longitude];
    var sc=spotColorForPos(user.latitude,user.longitude);
    var icon=userIcon(user,selUser===user.id,sc);
    if(userMarkers[user.id]){
      userMarkers[user.id].setLatLng(ll).setIcon(icon);
    } else {
      var m=L.marker(ll,{icon:icon,zIndexOffset:50});
      (function(uid){m.on('click',function(e){L.DomEvent.stopPropagation(e);send({type:'USER_PRESS',userId:uid})})})(user.id);
      m.addTo(map);userMarkers[user.id]=m;
    }
  });
  applyUserVisibility();
}

function playerIcon(profile,collecting){
  var shadow=C.shadow;
  var hColor=getHColor(profile.health,profile.maxHealth);
  var badgeRow=collecting
    ?'<div style="display:flex;justify-content:center;margin-bottom:2px;">'+collectBadge(Math.round(collecting.progress))+'</div>'
    :'';
  var totalH=collecting?133:110;
  var anchorY=collecting?27+23:27;
  var html=''
    +'<div style="width:170px;display:flex;flex-direction:column;align-items:center;">'
      +badgeRow
      +'<div style="width:46px;height:46px;border-radius:50%;border:2.5px solid '+C.accent+';background:'+C.bgSec+';display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 0 14px '+C.accent+'88;overflow:hidden;">'+avatarHtml(profile.avatar,42)+'</div>'
      +'<div style="margin-top:4px;color:'+C.text+';font-size:12px;font-weight:700;letter-spacing:0.3px;text-align:center;'+shadow+';">Você</div>'
      +'<div style="margin-top:2px;display:flex;align-items:center;justify-content:center;gap:4px;">'
        +heartSvg(hColor)
        +'<span style="color:'+hColor+';font-size:11px;font-weight:700;'+shadow+';">'+profile.health+'</span>'
        +'<span style="color:'+C.border+';font-size:10px;margin:0 1px;">|</span>'
        +flashSvg(getStrColor(profile.strength||0))
        +'<span style="color:'+getStrColor(profile.strength||0)+';font-size:11px;font-weight:700;'+shadow+';">'+(profile.strength!=null?Math.round(profile.strength):100)+'</span>'
      +'</div>'
    +'</div>';
  return L.divIcon({html:html,className:'',iconSize:[170,totalH],iconAnchor:[85,anchorY]});
}

var lastPlayerLat=null,lastPlayerLng=null;

function updatePlayer(loc,radius,profile,collecting){
  if(!loc)return;
  if(profile)playerProfile=profile;
  if(collecting!==undefined)playerCollectingData=collecting;
  playerCollectingSpotId=collecting?collecting.spotId:null;
  var ll=[loc.latitude,loc.longitude];
  var isFirst=!playerDot&&!playerCircle;
  var posChanged=(ll[0]!==lastPlayerLat||ll[1]!==lastPlayerLng);
  lastPlayerLat=ll[0];lastPlayerLng=ll[1];
  if(isFirst){
    map.setView(ll,17);
  } else if(posChanged&&selSpot===null&&selUser===null){
    map.panTo(ll,{animate:true,duration:0.6,easeLinearity:0.5});
  }
  if(playerCircle){map.removeLayer(playerCircle);playerCircle=null;}
  var icon=profile?playerIcon(profile,collecting||null):L.divIcon({
    html:'<div style="width:16px;height:16px;border-radius:50%;background:'+C.accent+';border:2.5px solid white;box-shadow:0 0 10px '+C.accent+'99;"></div>',
    className:'',iconSize:[16,16],iconAnchor:[8,8]
  });
  if(playerDot){
    playerDot.setIcon(icon);
    var el=playerDot.getElement();
    if(el){el.style.transition='transform 0.6s linear';}
    playerDot.setLatLng(ll);
  } else {
    playerDot=L.marker(ll,{icon:icon,zIndexOffset:200,interactive:false}).addTo(map);
    var el=playerDot.getElement();
    if(el){el.style.transition='transform 0.6s linear';}
  }
}

window.receiveFromRN=function(jsonStr){
  try{
    var d=JSON.parse(jsonStr);
    if(d.type==='UPDATE'){
      var prevSelUser=selUser,prevSelSpot=selSpot;
      selSpot=d.selectedSpotId||null;
      selUser=d.selectedUserId||null;
      playerLoc=d.userLocation||null;
      mineableSpotId=d.mineableSpotId||null;
      updateSpots(d.spots||[]);
      updateUsers(d.users||[]);
      updatePlayer(d.userLocation,d.userRadius,d.userProfile||null,d.playerCollecting||null);
      applyPlayerVisibility();
      if(selUser&&selUser!==prevSelUser&&userMarkers[selUser]){
        map.panTo(userMarkers[selUser].getLatLng(),{animate:true,duration:0.5,easeLinearity:0.5});
      } else if(selSpot&&selSpot!==prevSelSpot&&spotMarkers[selSpot]){
        map.panTo(spotMarkers[selSpot].getLatLng(),{animate:true,duration:0.5,easeLinearity:0.5});
      }
    } else if(d.type==='CENTER'){
      map.setView([d.lat,d.lng],d.zoom||17);
    } else if(d.type==='EMOJI_REACTION'){
      showEmojiReaction(d.userId,d.emoji,d.fromUserId||null);
    } else if(d.type==='MINE_HIT'){
      showMineHit(d.spotId,d.clicks);
    } else if(d.type==='SPOT_FIRE'){
      showSpotFire(d.spotId,d.itemType);
    } else if(d.type==='USER_FIRE'){
      showUserFire(d.userId,d.itemType);
    } else if(d.type==='SET_THEME'){
      window.applyTheme(d.isDark);
    }
  }catch(e){}
};

function launchProjectile(fromPt,toPt,color,iconSvg,onDone){
  var mapEl=document.getElementById('map');
  var el=document.createElement('div');
  el.style.cssText=[
    'position:absolute',
    'left:'+fromPt.x+'px',
    'top:'+fromPt.y+'px',
    'width:28px','height:28px',
    'border-radius:50%',
    'background:'+color+'22',
    'border:2.5px solid '+color,
    'display:flex','align-items:center','justify-content:center',
    'color:'+color,
    'transform:translate(-50%,-50%)',
    'z-index:999','pointer-events:none',
    'box-shadow:0 0 10px '+color+',0 0 20px '+color+'55'
  ].join(';');
  el.innerHTML='<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;">'+iconSvg+'</div>';
  mapEl.appendChild(el);
  var duration=520;var startTs=null;
  function easeInOut(t){return t<0.5?2*t*t:-1+(4-2*t)*t;}
  function step(ts){
    if(!startTs)startTs=ts;
    var p=Math.min((ts-startTs)/duration,1);
    var t=easeInOut(p);
    var x=fromPt.x+(toPt.x-fromPt.x)*t;
    var y=fromPt.y+(toPt.y-fromPt.y)*t;
    y+=-Math.sin(p*Math.PI)*28;
    var scale=0.55+0.6*Math.sin(p*Math.PI);
    el.style.left=x+'px';el.style.top=y+'px';
    el.style.transform='translate(-50%,-50%) scale('+scale+')';
    el.style.opacity=p>0.8?String(1-(p-0.8)/0.2):'1';
    if(p<1){requestAnimationFrame(step);}
    else{
      el.parentNode&&el.parentNode.removeChild(el);
      if(onDone)onDone(toPt,color);
    }
  }
  requestAnimationFrame(step);
}

function showSpotFire(spotId,itemType){
  if(!playerDot||!spotMarkers[spotId])return;
  var color=SPOT_COLOR[itemType]||C.accent;
  var icon=ICONS[itemType]||ICONS.rare;
  var fromPt=map.latLngToContainerPoint(playerDot.getLatLng());
  var toPt=map.latLngToContainerPoint(spotMarkers[spotId].getLatLng());
  launchProjectile(fromPt,toPt,color,icon,showSpotFireImpact);
}

function showUserFire(userId,itemType){
  if(!playerDot||!userMarkers[userId])return;
  var color=SPOT_COLOR[itemType]||C.accent;
  var icon=ICONS[itemType]||ICONS.rare;
  var fromPt=map.latLngToContainerPoint(playerDot.getLatLng());
  var toPt=map.latLngToContainerPoint(userMarkers[userId].getLatLng());
  launchProjectile(fromPt,toPt,color,icon,showSpotFireImpact);
}

function showSpotFireImpact(pt,color){
  var mapEl=document.getElementById('map');
  var ring=document.createElement('div');
  ring.style.cssText=[
    'position:absolute','left:'+pt.x+'px','top:'+pt.y+'px',
    'width:22px','height:22px','border-radius:50%',
    'border:2px solid '+color,'box-shadow:0 0 8px '+color,
    'transform:translate(-50%,-50%) scale(1)',
    'opacity:1','z-index:999','pointer-events:none'
  ].join(';');
  mapEl.appendChild(ring);
  var numSparks=6;var sparks=[];
  for(var i=0;i<numSparks;i++){
    var angle=(i/numSparks)*Math.PI*2;
    var sp=document.createElement('div');
    sp.style.cssText=[
      'position:absolute','left:'+pt.x+'px','top:'+pt.y+'px',
      'width:4px','height:4px','border-radius:50%',
      'background:'+color,'box-shadow:0 0 4px '+color,
      'transform:translate(-50%,-50%)',
      'z-index:999','pointer-events:none','opacity:1'
    ].join(';');
    sp._angle=angle;mapEl.appendChild(sp);sparks.push(sp);
  }
  var dur=380;var startTs=null;
  function impactStep(ts){
    if(!startTs)startTs=ts;
    var p=Math.min((ts-startTs)/dur,1);
    ring.style.transform='translate(-50%,-50%) scale('+(1+p*2.8)+')';
    ring.style.opacity=String(1-p);
    sparks.forEach(function(sp){
      var d=p*32;
      sp.style.left=(pt.x+Math.cos(sp._angle)*d)+'px';
      sp.style.top=(pt.y+Math.sin(sp._angle)*d)+'px';
      sp.style.opacity=String(1-p);
    });
    if(p<1){requestAnimationFrame(impactStep);}
    else{
      ring.parentNode&&ring.parentNode.removeChild(ring);
      sparks.forEach(function(s){s.parentNode&&s.parentNode.removeChild(s);});
    }
  }
  requestAnimationFrame(impactStep);
}

function showMineHit(spotId,clicks){
  var marker=spotMarkers[spotId];
  if(!marker)return;
  var pt=map.latLngToContainerPoint(marker.getLatLng());
  var mapEl=document.getElementById('map');
  var label=document.createElement('div');
  label.style.cssText=[
    'position:absolute',
    'left:'+pt.x+'px',
    'top:'+(pt.y-24)+'px',
    'color:#F5C518',
    'font-size:14px',
    'font-weight:700',
    'z-index:999',
    'pointer-events:none',
    'letter-spacing:0.5px',
    'text-shadow:0 1px 4px rgba(0,0,0,0.8)',
    'animation:mineFloat 0.75s ease-out forwards'
  ].join(';');
  label.textContent='⛏ '+clicks+'x';
  mapEl.appendChild(label);
  setTimeout(function(){label.parentNode&&label.parentNode.removeChild(label)},800);
  var mEl=marker.getElement();
  if(mEl){
    var inner=mEl.querySelector('div');
    if(inner){
      inner.style.animation='none';
      void inner.offsetWidth;
      inner.style.animation='minePulse 0.35s ease-out';
      setTimeout(function(){if(inner)inner.style.animation='';},380);
    }
  }
}

function send(data){
  try{window.ReactNativeWebView.postMessage(JSON.stringify(data))}catch(e){}
}

map.whenReady(function(){
  setTimeout(function(){send({type:'MAP_READY'})},300);
});
</script>
</body>
</html>`;

interface GameMapProps {
  spots: Spot[];
  nearbyUsers: NearbyUser[];
  selectedSpotId?: string | null;
  selectedUserId?: string | null;
  mineableSpotId?: string | null;
  userLocation?: { latitude: number; longitude: number } | null;
  userProfile?: { name: string; avatar: string; health: number; maxHealth: number; strength: number } | null;
  activeCollection?: { spotId: string; progress: number } | null;
  theme?: "light" | "dark";
  onSpotPress: (spotId: string) => void;
  onUserPress: (userId: string) => void;
  onMapPress: () => void;
}

export const GameMap = forwardRef<GameMapHandle, GameMapProps>(function GameMap({
  spots,
  nearbyUsers,
  mineableSpotId,
  selectedSpotId,
  selectedUserId,
  userLocation,
  userProfile,
  activeCollection,
  theme = "dark",
  onSpotPress,
  onUserPress,
  onMapPress,
}, ref) {
  const webViewRef = useRef<WebView>(null);
  const [mapReady, setMapReady] = useState(false);
  const userLocationRef = useRef(userLocation);
  userLocationRef.current = userLocation;

  const inject = useCallback((data: object) => {
    if (!webViewRef.current) return;
    const json = JSON.stringify(data);
    webViewRef.current.injectJavaScript(
      `window.receiveFromRN(${JSON.stringify(json)});true;`
    );
  }, []);

  useImperativeHandle(ref, () => ({
    centerOnUser: () => {
      const loc = userLocationRef.current;
      if (!loc) return;
      inject({ type: "CENTER", lat: loc.latitude, lng: loc.longitude, zoom: 17 });
    },
    centerOn: (lat: number, lng: number) => {
      inject({ type: "CENTER", lat, lng, zoom: 17 });
    },
    sendEmojiReaction: (userId: string, emoji: string, fromUserId?: string) => {
      inject({ type: "EMOJI_REACTION", userId, emoji, fromUserId });
    },
    mineHit: (spotId: string, clickCount: number) => {
      inject({ type: "MINE_HIT", spotId, clicks: clickCount });
    },
    fireAtSpot: (spotId: string, itemType: string) => {
      inject({ type: "SPOT_FIRE", spotId, itemType });
    },
    fireAtUser: (userId: string, itemType: string) => {
      inject({ type: "USER_FIRE", userId, itemType });
    },
  }));

  useEffect(() => {
    if (!mapReady) return;
    inject({ type: "SET_THEME", isDark: theme === "dark" });
  }, [theme, mapReady]);

  useEffect(() => {
    if (!mapReady) return;
    inject({
      type: "UPDATE",
      spots,
      users: nearbyUsers,
      selectedSpotId: selectedSpotId ?? null,
      selectedUserId: selectedUserId ?? null,
      mineableSpotId: mineableSpotId ?? null,
      userLocation: userLocation ?? null,
      userRadius: USER_RADIUS,
      userProfile: userProfile ?? null,
      playerCollecting: activeCollection ?? null,
    });
  }, [mapReady, spots, nearbyUsers, selectedSpotId, selectedUserId, mineableSpotId, userLocation, userProfile, activeCollection]);

  const handleMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "MAP_READY") {
        setMapReady(true);
      } else if (data.type === "SPOT_PRESS") {
        onSpotPress(data.spotId);
      } else if (data.type === "USER_PRESS") {
        onUserPress(data.userId);
      } else if (data.type === "MAP_PRESS") {
        onMapPress();
      }
    } catch {}
  }, [onSpotPress, onUserPress, onMapPress]);

  return (
    <WebView
      ref={webViewRef}
      style={styles.webView}
      source={{ html: MAP_HTML }}
      onMessage={handleMessage}
      scrollEnabled={false}
      bounces={false}
      overScrollMode="never"
      javaScriptEnabled
      domStorageEnabled
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      originWhitelist={["*"]}
    />
  );
});

const styles = StyleSheet.create({
  webView: {
    flex: 1,
  },
});
