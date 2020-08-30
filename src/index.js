import React from 'react'
import {MapComponent} from "./Map.jsx"
import {MapVendor} from "./mapengine.js"

window.$ = window.jQuery = require('jquery')
export const MapView = (props)=>{return <MapComponent {...props}/>}
export const MapViewVendor = MapVendor;
