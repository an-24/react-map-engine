/*
* Map
* GitHub https://github.com/an-24/react-map-engine
* © an-24 https://github.com/an-24
*/

import React from 'react'
import styles from './styles.module.css'
import {Dictonary} from "./dict.js"
import {MapEngine,MapScriptSrc,MapVendor} from "./mapengine.js"

export const MapComponent = (props) => {
  const lang = props.lang||"en";
  const vendor = props.mapVendor||MapVendor.Yandex;
  const idMap = "mapArea-"+(props.id?props.id:"one");
  const controls=props.controls||["zoomControl"];
  const defCenter = props.defaultCenter || [58.0057,56.238];
  const defZoom = props.defaultZoom || 13;
  const markers = props.markers || [];
  const ref = React.createRef();
  const dictonary = props.dictonary || Dictonary[lang];

  const initVendorLibrary = ()=>{
    const initEngine=()=>{
      MapEngine({mapVendor:vendor}).ready((engine)=>{
        $(ref.current).find("#loading").remove();
        const $map = $(ref.current).find("#"+idMap);
        $map.css("width",ref.current.offsetWidth);
        $map.css("height",ref.current.offsetHeight);
        const map = engine.newMap(idMap, {
            center: defCenter,
            zoom: defZoom,
            controls: controls
        });
        SetState({engine:engine,map:map,vendor:vendor});
      })
    }

    loadLibrary(MapScriptSrc(vendor,{lang:lang,apiKey:props.apiKeys[vendor]}),()=>{
      if(vendor==MapVendor.Google) {
        loadLibrary("https://unpkg.com/@google/markerclustererplus@5.1.0/dist/markerclustererplus.min.js",()=>{
          initEngine();
        });
      } else {
        initEngine();
      }
    });
  }

  const setClickOnMarkerEvent = ()=>{
    switch (vendor) {
      case MapVendor.Yandex:
        state.map.getClusterer().events.add("objects.click",(event)=>{
          let id = event.get('objectId');
          let pm = state.map.createMarkerById(id);
          props.onMarkerClick(event,pm,state.engine,state.map);
        });
        break;
      case MapVendor.Google:
        state.map.getClusterer().events.add("objects.click",(event,pm)=>{
          props.onMarkerClick(event,pm,state.engine,state.map);
        });
      break;
      default:
    }
  }

  const [state,SetState]=React.useState(()=>{
    initVendorLibrary();
    return {}
  })

  React.useEffect(()=>{
    if(state.map) {
      if(props.onMarkerClick) {
        setClickOnMarkerEvent();
      }
      if(props.onClick) {
        state.map.events.add("click", (event)=>props.onClick(event,state.engine,state.map));
      }
      markers.map(m=>{
        state.map.addMarker(m.coords,m.props);
      })
      if(props.onClusterClick) {
        state.map.getClusterer().events.add("balloonopen", function (event) {
          if(vendor==MapVendor.Yandex && !state.map.hasBalloon()) {
            state.map.map.balloon.close();
          }
          let cluster = state.map.extractCluster(event);
          props.onClusterClick(event,cluster,state.engine,state.map);
        });
      }
    }

  },[state]);

  if(props.bounds && state.engine) {
    state.map.setBounds(props.bounds);
  }
  if(props.center && state.engine) {
    let coord = state.engine.extractCoordFromString(props.center);
    if(coord) {
      state.map.setCenter(coord);
    }
  }
  if(props.zoom && state.engine) {
    state.map.setZoom(props.zoom);
  }
  // refresh all if vendor change
  if(state.vendor && vendor!=state.vendor) {
    initVendorLibrary();
  }

  return <div ref={ref} style={props.style}
              className={styles.root}>
               <span id="loading">{dictonary.loading}</span>
              <div id={idMap}/>
  </div>
}


const loadLibrary = (src,func)=>{
  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  script.onload = func;
  document.body.appendChild(script);

}
