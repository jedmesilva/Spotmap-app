import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

import { NearbyUser, Spot } from "@/context/GameContext";

export interface GameMapHandle {
  centerOnUser: () => void;
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
</style>
</head>
<body>
<div id="map"></div>
<script>
var C={
  accent:'#00FF88',bg:'#050A14',bgSec:'#0D1B2E',
  surface:'#1E3A5F',border:'#1E3A5F33',
  coupon:'#00BFFF',money:'#00FF88',product:'#FF8C00',rare:'#BF5FFF',
  warning:'#FFB800',danger:'#FF4444',text:'#E8F4FD'
};
var SPOT_COLOR={coupon:C.coupon,money:C.money,product:C.product,rare:C.rare};
var ICONS={
  money:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  coupon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
  product:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>',
  rare:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
};

var map=L.map('map',{center:[-23.5505,-46.6333],zoom:17,zoomControl:false,attributionControl:false});

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{
  maxZoom:20,subdomains:'abcd'
}).addTo(map);

map.on('click',function(){send({type:'MAP_PRESS'})});

var spotMarkers={},spotCircles={},userMarkers={};
var playerDot=null,playerCircle=null;
var selSpot=null,selUser=null;

function spotIcon(spot,selected){
  var color=SPOT_COLOR[spot.type]||C.accent;
  var bo=selected?color:color+'99';
  var bgo=selected?color+'30':color+'18';
  var bgi=selected?color+'30':C.bgSec;
  var scale=selected?'transform:scale(1.15);':'';
  var dot=spot.isCollecting
    ?'<div style="position:absolute;top:8px;right:8px;width:10px;height:10px;border-radius:50%;background:'+C.accent+';border:1.5px solid '+C.bg+'"></div>'
    :'';
  var html='<div style="position:relative;width:48px;height:48px;display:flex;align-items:center;justify-content:center;'+scale+'">'
    +'<div style="width:48px;height:48px;border-radius:50%;border:1.5px solid '+bo+';background:'+bgo+';display:flex;align-items:center;justify-content:center;">'
    +'<div style="width:34px;height:34px;border-radius:50%;border:2px solid '+color+';background:'+bgi+';display:flex;align-items:center;justify-content:center;color:'+color+'">'
    +(ICONS[spot.type]||ICONS.rare)
    +'</div></div>'+dot+'</div>';
  return L.divIcon({html:html,className:'',iconSize:[48,48],iconAnchor:[24,24]});
}

function userIcon(user,selected){
  var hp=user.health/user.maxHealth;
  var hc=hp>0.6?C.accent:hp>0.3?C.warning:C.danger;
  var bc=selected?C.accent:user.collectingSpotId?C.warning:C.border;
  var prog=user.collectingSpotId
    ?'<div style="width:52px;height:5px;background:'+C.surface+';border-radius:3px;margin-bottom:3px;overflow:hidden;">'
     +'<div style="width:'+user.collectProgress+'%;height:100%;border-radius:3px;background:'+(user.collectProgress>60?C.danger:C.warning)+';"></div></div>'
    :'';
  var extraH=user.collectingSpotId?8:0;
  var totalH=40+7+extraH;
  var html='<div style="display:flex;flex-direction:column;align-items:center;width:56px;">'
    +prog
    +'<div style="width:40px;height:40px;border-radius:50%;border:2.5px solid '+bc+';background:'+C.bgSec+';display:flex;align-items:center;justify-content:center;font-size:18px;">'+user.avatar+'</div>'
    +'<div style="width:40px;height:4px;background:'+C.surface+';border-radius:2px;margin-top:3px;overflow:hidden;">'
    +'<div style="width:'+(hp*100)+'%;height:100%;border-radius:2px;background:'+hc+';"></div></div>'
    +'</div>';
  return L.divIcon({html:html,className:'',iconSize:[56,totalH],iconAnchor:[28,totalH/2]});
}

function updateSpots(spots){
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
    if(!spotCircles[spot.id]){
      var color=SPOT_COLOR[spot.type]||C.accent;
      spotCircles[spot.id]=L.circle(ll,{radius:spot.radius,color:color,fillColor:color,fillOpacity:0.07,weight:1.5,opacity:0.35}).addTo(map);
    }
  });
}

function updateUsers(users){
  var ids=users.map(function(u){return u.id});
  Object.keys(userMarkers).forEach(function(id){
    if(ids.indexOf(id)<0){map.removeLayer(userMarkers[id]);delete userMarkers[id]}
  });
  users.forEach(function(user){
    var ll=[user.latitude,user.longitude];
    var icon=userIcon(user,selUser===user.id);
    if(userMarkers[user.id]){
      userMarkers[user.id].setLatLng(ll).setIcon(icon);
    } else {
      var m=L.marker(ll,{icon:icon,zIndexOffset:50});
      (function(uid){m.on('click',function(e){L.DomEvent.stopPropagation(e);send({type:'USER_PRESS',userId:uid})})})(user.id);
      m.addTo(map);userMarkers[user.id]=m;
    }
  });
}

function updatePlayer(loc,radius){
  if(!loc)return;
  var ll=[loc.latitude,loc.longitude];
  if(playerCircle){playerCircle.setLatLng(ll)}
  else{
    playerCircle=L.circle(ll,{radius:radius||60,color:C.accent,fillColor:C.accent,fillOpacity:0.06,weight:2,opacity:0.5}).addTo(map);
    map.setView(ll,17);
  }
  if(playerDot){playerDot.setLatLng(ll)}
  else{
    var icon=L.divIcon({
      html:'<div style="width:16px;height:16px;border-radius:50%;background:'+C.accent+';border:2.5px solid white;box-shadow:0 0 10px '+C.accent+'99;"></div>',
      className:'',iconSize:[16,16],iconAnchor:[8,8]
    });
    playerDot=L.marker(ll,{icon:icon,zIndexOffset:200,interactive:false}).addTo(map);
  }
}

window.receiveFromRN=function(jsonStr){
  try{
    var d=JSON.parse(jsonStr);
    if(d.type==='UPDATE'){
      selSpot=d.selectedSpotId||null;
      selUser=d.selectedUserId||null;
      updateSpots(d.spots||[]);
      updateUsers(d.users||[]);
      updatePlayer(d.userLocation,d.userRadius);
    } else if(d.type==='CENTER'){
      map.setView([d.lat,d.lng],d.zoom||17);
    }
  }catch(e){}
};

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
  userLocation?: { latitude: number; longitude: number } | null;
  onSpotPress: (spotId: string) => void;
  onUserPress: (userId: string) => void;
  onMapPress: () => void;
}

export const GameMap = forwardRef<GameMapHandle, GameMapProps>(function GameMap({
  spots,
  nearbyUsers,
  selectedSpotId,
  selectedUserId,
  userLocation,
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
  }), [inject]);

  useEffect(() => {
    if (!mapReady) return;
    inject({
      type: "UPDATE",
      spots,
      users: nearbyUsers,
      userLocation,
      userRadius: USER_RADIUS,
      selectedSpotId: selectedSpotId ?? null,
      selectedUserId: selectedUserId ?? null,
    });
  }, [mapReady, spots, nearbyUsers, userLocation, selectedSpotId, selectedUserId, inject]);

  const handleMessage = useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === "MAP_READY") setMapReady(true);
        else if (data.type === "SPOT_PRESS") onSpotPress(data.spotId);
        else if (data.type === "USER_PRESS") onUserPress(data.userId);
        else if (data.type === "MAP_PRESS") onMapPress();
      } catch (_) {}
    },
    [onSpotPress, onUserPress, onMapPress]
  );

  return (
    <WebView
      ref={webViewRef}
      source={{ html: MAP_HTML }}
      style={StyleSheet.absoluteFill}
      originWhitelist={["*"]}
      javaScriptEnabled
      domStorageEnabled
      scrollEnabled={false}
      overScrollMode="never"
      bounces={false}
      onMessage={handleMessage}
      mixedContentMode="always"
      allowFileAccess
      cacheEnabled
    />
  );
});
