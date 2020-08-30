import React from 'react'

import { MapView, MapViewVendor } from 'react-map-engine'
import 'react-map-engine/dist/index.css'
import {VendorKeys} from './keys.js'

const App = () => {
  const [center,setCenter] = React.useState(null);
  const [bounds,setBounds] = React.useState(null);
  const [zoom,setZoom] = React.useState(null);

  return  <div style={{padding:40}}>
                Coords: <input onChange={(event)=>{
                  setCenter(event.target.value);
                }}/>
                <button style={{marginLeft:40}} onClick={()=>{
                  setBounds([[58.07115817984001, 55.999219024658224],[57.93007793541389, 56.42356594848632]]);
                }}>Set Bounds</button>
                <span style={{marginLeft:40}}>Zoom: <input onChange={(event)=>{
                  setZoom(event.target.value);
                }}/>
                </span>

                <MapView style={{width:700,height:500,marginTop:20}}
                          mapVendor={MapViewVendor.Yandex}
                          lang={"ru"}
                          apiKeys={{
                            [MapViewVendor.Yandex]: VendorKeys.VendorKeys,
                            [MapViewVendor.Google]: VendorKeys.Google
                          }}
                          onClick={(event,engine,map)=>{
                            map.removeAllMarkers();
                            let coords = engine.ejectCoordFromEvent(event);
                            console.log("click",coords);
                            map.addMarker(coords);
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
              />
  </div>
}

export default App
