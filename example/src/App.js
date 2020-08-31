import React from 'react'

import { MapView, MapViewVendor } from 'react-map-engine'
import 'react-map-engine/dist/index.css'
import {VendorKeys} from './keys.js'

const App = () => {
  const [center,setCenter] = React.useState(null);
  const [bounds,setBounds] = React.useState(null);
  const [zoom,setZoom] = React.useState(null);
  const [vendor,setVendor] = React.useState(MapViewVendor.Yandex);

  return  <div style={{padding:40}}>
                Coords: <input onChange={(event)=>{
                  setCenter(event.target.value);
                }}/>
                <button style={{marginLeft:40}} onClick={()=>{
                  setBounds([[58.07115817984001, 55.999219024658224],[57.93007793541389, 56.42356594848632]]);
                }}>Set Bounds</button>
                <span style={{marginLeft:40}}>Zoom: <input onChange={(event)=>{
                  setZoom(parseInt(event.target.value));
                }}/>
                </span>
                <span style={{marginLeft:40}}>Vendor:
                <select onChange={(event)=>{
                          setVendor(parseInt(event.target.value));
                        }}>
                  <option value={MapViewVendor.Yandex}>Yandex</option>
                  <option value={MapViewVendor.Google}>Google</option>
                </select>
                </span>


                <MapView style={{width:900,height:500,marginTop:20}}
                          mapVendor={vendor}
                          lang={"ru"}
                          apiKeys={{
                            [MapViewVendor.Yandex]: VendorKeys.Yandex,
                            [MapViewVendor.Google]: VendorKeys.Google
                          }}
                          markers={[
                            {
                              coords:[58.0057,56.238],
                              props: {
                                iconColor: '#0095b6'
                              }
                            },
                            {
                              coords:[58.0123,56.200]
                            }
                          ]}
                          bounds={bounds}
                          //defaultCenter={center}
                          center={center}
                          //defaultZoom={zoom}
                          zoom={zoom}
                          onClick={(event,engine,map)=>{
                            map.removeAllMarkers();
                            let coords = engine.extractCoordFromEvent(event);
                            console.log("click",coords);
                            map.addMarker(coords);
                          }}
                          onMarkerClick={(event,marker,engine,map)=>{
                            console.log("onMarkerClick",marker);
                          }}
                          onClusterClick={(event,cluster,engine,map)=>{
                            console.log("onClusterClick",cluster);
                          }}
              />
  </div>
}

export default App
