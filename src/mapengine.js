/*
* MapEngine
* GitHub https://github.com/an-24/react-map-engine
* © an-24 https://github.com/an-24
*/
export const MapVendor = {
  Yandex:1,
  Google:2
}

export const MapScriptSrc = (vendor,opt) => {
  switch (vendor) {
    case MapVendor.Yandex:
      return `https://api-maps.yandex.ru/2.1?lang=${opt.lang}&apikey=${opt.apiKey}`
    case MapVendor.Google:
      return `https://maps.googleapis.com/maps/api/js?language=${opt.lang}&key=${opt.apiKey}`
  }
}

export const MapEngine = function(config) {
  var googleDirectionService;
  config = config||{};
  config.mapVendor = config.mapVendor||MapVendor.Yandex;

  var throwMapError = function() {
    throw new Error("Unknow map type " + config.mapVendor);
  }

  var throwUnsupportError = function() {
    throw new Error("Unsupport function for " + config.mapVendor);
  }


  var CommonBalloon = function(ball, map) {
    this.balloon = ball;
    this.map = map;

    var self = this;
    map.events.add('click', function(e) {
      self.close();
    });

    this.afterRender = function(control) {
      var cnt = control.getContentElement();
      var $closeBtn = $("#close-btn", cnt);
      if ($closeBtn.length > 0) {
        $closeBtn.css("cursor", "pointer");
        $closeBtn.click(function() {
          control.close();
        });
      }
    };

    this.setContent = function(cnt, anchor) {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          var ball = this.balloon;

          var point;
          if (anchor instanceof Array) {
            point = anchor;
          } else {
            point = anchor.getPosition();
          }
          if (typeof cnt != "string") {
            ball.open(point, cnt[0].innerHTML, {
              closeButton: false,
              minWidth: 300,
              maxWidth: 300
            });
            setTimeout(function() {
              $(ball.getContentElement()).find('.restpoint-details-header').parent().replaceWith(cnt);
              self.afterRender(ball);
            }, 300);
          } else {
            ball.open(point, cnt, {
              closeButton: false,
              minWidth: 300,
              maxWidth: 300
            });
            setTimeout(function() {
              self.afterRender(ball);
            }, 300);
          }
          break;
        case MapVendor.Google:
          if (typeof cnt == "string") {
            cnt = "<div style=\"padding-top:6px;padding-bottom:12px;\">" + cnt + "</div>";
            cnt = $(cnt);
          } else {
            cnt = $("<div style=\"padding-top:6px;padding-bottom:12px;\">").append(cnt);
          }
          this.balloon.setContent(cnt[0]);
          if (anchor instanceof Array) {
            let point = new google.maps.MVCObject();
            point.set("position", new google.maps.LatLng(anchor[0], anchor[1]));
            anchor = point;
          }
          setTimeout(function() {
            self.balloon.open(self.map.map, anchor);
            self.afterRender(self.balloon);
          }, 300);
          break;
        default:
          throwMapError();
      }
    }

    this.replaceContent = function(cnt) {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          var ball = this.map.map.balloon;
          $(ball.getContentElement()).html(cnt);
          break;
        case MapVendor.Google:
          //TODO
          throwUnsupportError();
          break;
        default:
          throwMapError();
      }
    }

    this.close = function() {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          this.balloon.close();
          break;
        case MapVendor.Google:
          this.balloon.close();
          break;
        default:
          throwMapError();
      }
    }

  }

  var CommonMarker = function(marker) {
    this.marker = marker;
    var self = this;

    if (config.mapVendor == MapVendor.Yandex) {
      let point = marker.properties.get ? marker.properties.get("point") : undefined;
      if (point) {
        this.id = point.id;
      } else {
        this.id = Math.floor(Math.random() * Math.floor(Number.MAX_VALUE));
      }
    }

    this.events = {
      add: function(eventName, cb) {
        switch (config.mapVendor) {
          case MapVendor.Yandex:
            self.marker.events.add(eventName, cb);
            break;
          case MapVendor.Google:
            google.maps.event.addListener(marker, convertEventYToG(eventName), cb);
            break;
          default:
            throwMapError();
        }
      }
    }

    this.getProperty = function(name) {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          return self.marker.properties.get(name);
        case MapVendor.Google:
          if (self.marker.data)
            return self.marker.data[name];
          return undefined;
        default:
          throwMapError();
      }
    }

    this.getOption = function(name) {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          return self.marker.options.get(name);
        case MapVendor.Google:
          return self.marker[name];
        default:
          throwMapError();
      }
    }

    this.setOption = function(name, value) {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          self.marker.options.set(name, value);
          break;
        case MapVendor.Google:
          self.marker.setOptions({
            name: value
          });
          break;
        default:
          throwMapError();
      }
    }

    this.setOptions = function(opts) {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          self.marker.options.set(opts);
          break;
        case MapVendor.Google:
          self.marker.setOptions(opts);
          break;
        default:
          throwMapError();
      }
    }

    this.getPosition = function() {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          return self.marker.geometry.getCoordinates();
        case MapVendor.Google:
          var pos = self.marker.getPosition();
          return [pos.lat(), pos.lng()];
        default:
          throwMapError();
      }
    }

    this.toJSON = function() {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          return {
            "type": "Feature",
            "id": self.id,
              "geometry": {
                type: "Point",
                coordinates: self.marker.geometry.getCoordinates()
              },
              "properties": self.marker.properties.getAll(),
              "options": self.marker.options.getAll()
          }
          case MapVendor.Google:
            //TODO
            throwUnsupportError();
            break;
          default:
            throwMapError();
      }
    }

  }



  var CommonCluster = function(cluster) {
    this.cluster = cluster;

    this.getMarkers = function() {
      switch (config.mapVendor) {
        case MapVendor.Yandex: {
          let objects = cluster.getData().properties.geoObjects;
          let len = objects.length;
          let markers = new Array(len);
          for (let i = 0; i < len; i++) {
            let mrk = objects[i];
            let pm = new ymaps.Placemark(mrk.geometry.coordinates,
              mrk.properties, mrk.options);
            markers[i] = new CommonMarker(pm)
          }
          return markers;
        }
        case MapVendor.Google: {
          let objects = cluster.getMarkers();
          let markers = new Array(objects.length);
          for (let i = 0; i < objects.length; i++) {
            markers[i] = new CommonMarker(objects[i])
          }
          return markers;
        }
        default:
          throwMapError();
      }
    }

    this.getAnchor = function() {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          return this.cluster;
        case MapVendor.Google:
          let anchor = new google.maps.MVCObject();
          anchor.set("position", this.cluster.getCenter());
          return anchor;
        default:
          throwMapError();
      }
    }
  }

  var CommonRectangle = function(obj, map) {
    this.obj = obj;
    this.map = map;
    var self = this;

    this.events = {
      add: function(eventName, cb) {
        switch (config.mapVendor) {
          case MapVendor.Yandex:
            self.obj.events.add(eventName, cb);
            break;
          case MapVendor.Google:
            google.maps.event.addListener(self.obj, convertEventYToG(eventName), cb);
            break;
          default:
            throwMapError();
        }
      }
    }

    this.remove = function() {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          self.map.geoObjects.remove(self.obj);
          break;
        case MapVendor.Google:
          //TODO
          break;
        default:
          throwMapError();
      }
    }

    this.getBounds = function() {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          return self.obj.geometry.getBounds();
          break;
        case MapVendor.Google:
          //TODO
          throwUnsupportError();
          break;
        default:
          throwMapError();
      }
    }

    this.show = function(coords) {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          if (coords) self.obj.geometry.setCoordinates(coords);
          self.obj.options.set("visible", true);
          self.map.geoObjects.add(self.obj);
          break;
        case MapVendor.Google:
          //TODO
          break;
        default:
          throwMapError();
      }
    }

    this.hide = function() {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          self.obj.options.set("visible", false);
          self.map.geoObjects.remove(self.obj);
          break;
        case MapVendor.Google:
          //TODO
          break;
        default:
          throwMapError();
      }
    }

    this.getVisible = function() {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          return self.obj.options.get("visible");
        case MapVendor.Google:
          //TODO
          break;
        default:
          throwMapError();
      }
    }

    this.getBounds = function() {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          return self.obj.geometry.getCoordinates();
        case MapVendor.Google:
          //TODO
          break;
        default:
          throwMapError();
      }
    }
    this.setBounds = function(coords) {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          self.obj.geometry.setCoordinates(coords);
          break;
        case MapVendor.Google:
          //TODO
          break;
        default:
          throwMapError();
      }
    }
  }

  var CommonPolyline = function(obj, map) {
    this.obj = obj;
    this.map = map;
    var self = this;

    this.setBalloonContent = function(cnt) {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          self.obj.properties.set('balloonContent', cnt);
          break;
        case MapVendor.Google:
          //TODO
          throwUnsupportError();
          break;
        default:
          throwMapError();
      }
    }

    this.balloonClose = function() {
      self.obj.balloon.close();
    }
  }

  var CommonMap = function(map, mapContainer) {
    this.map = map;
    var self = this;
    this.mapContainerId = mapContainer;

    this.events = {
      xhandlers: {},
      fireX: function(eventName, args) {
        if (this.xhandlers[eventName]) {
          this.xhandlers[eventName].forEach(function(cb) {
            cb.apply(self, args);
          });
        }
      },
      add: function(eventName, cb) {
        switch (config.mapVendor) {
          case MapVendor.Yandex:
            if (eventName == "search") {
              if (!this.xhandlers[eventName]) this.xhandlers[eventName] = [];
              this.xhandlers[eventName].push(cb);
            } else {
              self.map.events.add(eventName, cb);
            }
            break;
          case MapVendor.Google:
            self.map.addListener(convertEventYToG(eventName), cb);
            break;
          default:
            throwMapError();
        }
      }
    }

    this.getClusterer = function() {
      return {
        events: {
          add: function(eventName, cb) {
            switch (config.mapVendor) {
              case MapVendor.Yandex:
                let epart = eventName.split(".");
                if (epart.length == 1) {
                  self.markCollection.clusters.events.add(eventName, cb);
                } else {
                  if (epart[0] == "clusters")
                    self.markCollection.clusters.events.add(epart[1], cb);
                  if (epart[0] == "objects")
                    self.markCollection.objects.events.add(epart[1], cb);
                }
                break;
              case MapVendor.Google:
                google.maps.event.addListener(self.markCollection, convertEventYToG(eventName), cb);
                break;
              default:
                throwMapError();
            }
          }
        },
        getMarker: function(index) {
          switch (config.mapVendor) {
            case MapVendor.Yandex: {
              let mrk = self.markCollection.objects.getAll()[index]
              if (!mrk) return;
              let pm = new ymaps.Placemark(mrk.geometry.coordinates,
                mrk.properties, mrk.options);
              return new CommonMarker(pm);
            }
            case MapVendor.Google: {
              let mrk = self.markCollection.getMarkers()[index];
              if (!mrk) return;
              return new CommonMarker(mrk);
            }
            default:
              throwMapError();
          }
        },
        getMarkerCount: function() {
          switch (config.mapVendor) {
            case MapVendor.Yandex:
              return self.markCollection.objects.getLength();
            case MapVendor.Google:
              return self.markCollection.getTotalMarkers();
              break;
            default:
              throwMapError();
          }
        },
        getBounds: function() {
          switch (config.mapVendor) {
            case MapVendor.Yandex:
              return self.markCollection.getBounds();
            case MapVendor.Google:
              var gbounds = self.markCollection.getBounds();
              var p1 = [gbounds.getSouthWest().lat(),
                gbounds.getSouthWest().lng()
              ];
              var p2 = [gbounds.getNorthEast().lat(),
                gbounds.getNorthEast().lng()
              ];
              return [p1, p2];
            default:
              throwMapError();
          }
        }
      };
    }

    this.startEditor = function(point, type, options) {
      return new CommonEditor(self, point, type, options).start();
    }

    this.setBounds = function(bounds) {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          map.setBounds(bounds);
          break;
        case MapVendor.Google:
          var gb = new google.maps
            .LatLngBounds(
              new google.maps.LatLng(bounds[0][0], bounds[0][1]),
              new google.maps.LatLng(bounds[1][0], bounds[1][1])
            );
          map.fitBounds(gb);
          break;
        default:
          throwMapError();
      }
    }

    this.checkAndCreateObjectManager = function() {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          if (!this.markCollection) {
            this.markCollection = new ymaps.ObjectManager({
              clusterize: true,
              clusterDisableClickZoom: true,
              clusterBalloonLayout: ymaps.templateLayoutFactory.createClass("<div></div>"),
              clusterBalloonShadow: false,
              geoObjectOpenBalloonOnClick: true,
              clusterOpenBalloonOnClick: true,
              preset: 'islands#invertedDarkGreenClusterIcons'
            });
            this.markCollection.objects.options.set('preset', 'islands#darkgreenDotIcon');
            map.geoObjects.add(this.markCollection);
          };
          break;
        case MapVendor.Google:
          if (!this.markCollection) {
            this.markCollection = new MarkerClusterer(map, [], {
              zoomOnClick: false,
              imagePath: 'https://unpkg.com/@google/markerclustererplus@5.1.0/images/m'
            });
          }
          break;
        default:
          throwMapError();
      }
    }

    // call in construct
    this.checkAndCreateObjectManager();

    this.addMarker = function(coord, props) {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          var pm;
          if (coord instanceof Array) {
            pm = new ymaps.Placemark(coord, (props && props.data) ? props.data : {}, props);
          } else {
            pm = coord.marker;
          }
          let cm = new CommonMarker(pm);
          this.markCollection.add(cm.toJSON());
          return cm;

        case MapVendor.Google:

          if (coord instanceof Array) {
            var place = new google.maps.LatLng(coord[0], coord[1]);
            var gopt = {
              position: place,
              map: map
            };
            if (props) {
              gopt.icon = convertIconYToG(props);
              gopt.iconImageHref = props.iconImageHref; // for compatibility with Yandex
            }
            var mrk = new google.maps.Marker(gopt);
            if (props && props.data)
              mrk.data = props.data;
          } else {
            mrk = coord.marker;
          }

          this.markCollection.addMarker(mrk);
          return new CommonMarker(mrk);
        default:
          throwMapError();
      }
    }

    this.addMarkerDelay = function(coord, props) {
      setTimeout(function() {
        self.addMarker(coord, props);
      }, 100)
    }

    this.addMarkersFromJSON = function(data) {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          this.checkAndCreateObjectManager();
          this.markCollection.add(data);
          break;
        case MapVendor.Google:
          //TODO
          throwUnsupportError();
          break;
        default:
          throwMapError();
      }
    }

    //!! only Yandex
    this.findJsonById = function(id) {
      return this.markCollection.objects.getById(id);
    }

    //!! only Yandex
    this.findClusterById = function(id) {
      return this.markCollection.clusters.getById(id);
    }

    this.createMarkerById = function(id) {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          let jsonobj = this.markCollection.objects.getById(id);
          let pm = new ymaps.Placemark(jsonobj.geometry.coordinates,
            jsonobj.properties, jsonobj.options);
          return new CommonMarker(pm);
        case MapVendor.Google:
          //TODO
          throwUnsupportError();
          break;
        default:
          throwMapError();
      }

    }

    this.setObjectOptions = function(id, opts) {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          this.markCollection.objects.setObjectOptions(id, opts);
          break;
        case MapVendor.Google:
          //TODO
          break;
        default:
          throwMapError();
      }
    }

    this.addCircle = function(coord, rad, props) {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          var circle = new ymaps.Circle([coord, rad], {}, props);
          self.map.geoObjects.add(circle);
          break;
        case MapVendor.Google:
          //TODO
          throwUnsupportError();
        default:
          throwMapError();
      }
    }


    this.addRoute = function(route) {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          var opts = route.getPaths().options;
          for (var propName in opts) {
            route.route.getPaths().options.set(propName, opts[propName]);
          }
          map.geoObjects.add(route.route);
          break;
        case MapVendor.Google:
          if (this.directionsDisplay) {
            this.directionsDisplay.setMap(null);
          }
          this.directionsDisplay = new google.maps.DirectionsRenderer({
            suppressMarkers: true,
            suppressPolylines: true
          });
          this.directionsDisplay.setMap(map);
          this.directionsDisplay.setDirections(route.route);
          // draw point
          var points = route.getWayPoints();
          points.each(function(p) {
            var icon = convertIconYToG({
              iconImageSize: points.options.iconImageSize,
              iconImageOffset: points.options.iconImageOffset,
              iconImageHref: p.options.iconImageHref,
            });
            icon.scaledSize = new google.maps.Size(points.options.iconImageSize[0],
              points.options.iconImageSize[1]);
            new google.maps.Marker({
              position: p.latLng,
              map: map,
              icon: icon
            });
          })
          // draw polyline
          var paths = route.getPaths();
          var strokeColor = paths.options['strokeColor'];
          var strokeWith = 4;
          var bounds = new google.maps.LatLngBounds();
          var legs = route.route.routes[0].legs;
          for (let i = 0; i < legs.length; i++) {
            var steps = legs[i].steps;
            var cleg = paths.get(i);
            var polyline = new google.maps.Polyline({
              path: [],
              strokeColor: strokeColor,
              strokeWeight: strokeWith
            });
            for (let j = 0; j < steps.length; j++) {
              var nextSegment = steps[j].path;
              for (let k = 0; k < nextSegment.length; k++) {
                polyline.getPath().push(nextSegment[k]);
                bounds.extend(nextSegment[k]);
              }
            }
            polyline.setMap(map);
            polyline.cleg = cleg;
            if (cleg.events.click) {
              polyline.addListener('click', function(evn) {
                this.cleg.events.click(evn);
              });
            }
          }
          map.fitBounds(bounds);
          break;
        default:
          throwMapError();
      }
    }

    this.addPolyline = function(coords, options) {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          let props = options && options.balloonContent ? {
            balloonContent: options.balloonContent
          } : undefined;
          let pline = new ymaps.Polyline(coords, props, options);
          map.geoObjects.add(pline);
          let events = options && options.events;
          if (events) {
            for (let ename in events) {
              pline.events.add(ename, events[ename]);
            }
          }
          return new CommonPolyline(pline, self.map);
        case MapVendor.Google:
          //TODO
          throwUnsupportError();
          break;
        default:
          throwMapError();
      }
    }

    // needed ya_maps_arrow.js
    this.addArrow = function(coords, options) {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          var props = options && options.balloonContent ? {
            balloonContent: options.balloonContent
          } : undefined;
          ymaps.modules.require(['geoObject.Arrow'], function(Arrow) {
            var arrow = new Arrow(coords, props, options);
            map.geoObjects.add(arrow);
          });
          break;
        case MapVendor.Google:
          //TODO
          throwUnsupportError();
          break;
        default:
          throwMapError();
      }
    }

    this.createRectangle = function(coords, options) {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          var geo = new ymaps.GeoObject({
            geometry: {
              type: 'Rectangle',
              coordinates: coords
            },
            properties: {}
          }, options);
          return new CommonRectangle(geo, map);
          break;
        case MapVendor.Google:
          //TODO
          throwUnsupportError();
          break;
        default:
          throwMapError();
      }
    }

    this.addRectangle = function(coords, options) {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          var commonRect = this.createRectangle(coords, options);
          map.geoObjects.add(commonRect.obj);
          return commonRect;
        case MapVendor.Google:
          //TODO
          throwUnsupportError();
          break;
        default:
          throwMapError();
      }
    }

    this.removeAllMarkers = function() {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          if (this.markCollection) {
            this.markCollection.removeAll();
          }
          break;
        case MapVendor.Google:
          if (this.markCollection) {
            var arr = this.markCollection.getMarkers().slice(0);
            this.markCollection.removeMarkers(arr);
          }
          break;
        default:
          throwMapError();
      }
    }

    this.removeAll = function() {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          map.geoObjects.removeAll();
          if (this.markCollection) {
            this.markCollection.removeAll();
            map.geoObjects.add(this.markCollection);
          }
          break;
        case MapVendor.Google:
          //TODO
          throwUnsupportError();
        default:
          throwMapError();
      }
    }

    this.setCenter = function(coord) {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          map.setCenter(coord);
          break;
        case MapVendor.Google:
          var place = new google.maps.LatLng(coord[0], coord[1]);
          map.setCenter(place);
          break;
        default:
          throwMapError();
      }
    }

    this.getCenter = function() {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          return map.getCenter();
        case MapVendor.Google:
          var center = map.getCenter();
          return [center.lat(), center.lng()];

        default:
          throwMapError();
      }
    }

    this.setZoom = function(zoom) {
      if (!zoom) return;
      switch (config.mapVendor) {
        case MapVendor.Yandex:
        case MapVendor.Google:
          map.setZoom(zoom);
          break;
        default:
          throwMapError();
      }
    }

    this.getZoom = function() {
      return map.getZoom();
    }

    this.setZoomByPoints = function(points) {
      if (!points || points.length == 0) return;
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          var maxLat = -90,
            maxLng = -180,
            minLat = 90,
            minLng = 180;
          points.forEach(function(p) {
            if (p[0] > maxLat) maxLat = p[0];
            if (p[0] < minLat) minLat = p[0];
            if (p[1] > maxLng) maxLng = p[1];
            if (p[1] < minLng) minLng = p[1];
          })
          map.setBounds([
            [maxLat, minLng],
            [minLat, maxLng]
          ]);
          break;
        case MapVendor.Google:
          //TODO
          break;
        default:
          throwMapError();
      }
    }

    this.addControl = function(control, position) {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          map.controls.add(control, convertControlPosition(position));
          break;
        case MapVendor.Google:
          //TODO
          break;
        default:
          throwMapError();
      }
    }

    this.addUserDefineControl = function(elm, position) {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          map.controls.add(new UserDefinedControlClass(elm), convertControlPosition(position));
          break;
        case MapVendor.Google:
          map.controls[convertControlPosition(position)].push(elm);
          break;
        default:
          throwMapError();
      }
    }

  }

  var convertLatLngYToG = function(ylatlng) {
    return {
      lat: ylatlng[0],
      lng: ylatlng[1]
    };
  }

  var convertOptYToG = function(yoptions) {
    var options = {};
    if (yoptions.center)
      options.center = convertLatLngYToG(yoptions.center);
    options.zoom = yoptions.zoom;
    if (yoptions.controls) {
      if (yoptions.controls.indexOf('zoomControl') >= 0)
        options.zoomControl = true;
    }
    return options;
  }

  var convertIconYToG = function(yicon) {
    if(yicon.iconImageHref) {
      return {
        url: yicon.iconImageHref,
        size: yicon.iconImageSize?new google.maps.Size(yicon.iconImageSize[0], yicon.iconImageSize[1]):undefined,
        anchor: yicon.iconImageOffset?new google.maps.Point(-yicon.iconImageOffset[0], -yicon.iconImageOffset[1]):undefined
      }
    }
  }

  var convertEventYToG = function(yEventName) {
    switch (yEventName) {
      case "boundschange":
        return "bounds_changed";
      case "balloonopen":
        return "clusterclick";
      default:
        return yEventName;
    }
  }

  var convertControlPosition = function(pos) {
    switch (config.mapVendor) {
      case MapVendor.Yandex:
        if (typeof pos == 'object') return pos;
        //TODO
        switch (pos) {
          case MapEngine.position.TOP_LEFT:
            return {
              float: 'none',
                position: {
                  top: 40,
                  left: 0
                }
            };
          case MapEngine.position.TOP_CENTER:
            return {};
          case MapEngine.position.TOP_RIGHT:
            return {
              float: 'none',
                position: {
                  top: 0,
                  right: 0
                }
            };
          case MapEngine.position.RIGHT_CENTER:
            return {};
          case MapEngine.position.BOTTOM_RIGHT:
            return {
              float: 'none',
                position: {
                  bottom: 0,
                  right: 0
                }
            };
          case MapEngine.position.BOTTOM_CENTER:
            return {};
          case MapEngine.position.BOTTOM_LEFT:
            return {
              float: 'none',
                position: {
                  bottom: 0,
                  left: 0
                }
            };
          case MapEngine.position.LEFT_CENTER:
            return {};
        }
        break;
      case MapVendor.Google:
        switch (pos) {
          case MapEngine.position.TOP_LEFT:
            return google.maps.ControlPosition.TOP_LEFT;
          case MapEngine.position.TOP_CENTER:
            return google.maps.ControlPosition.TOP_CENTER;
          case MapEngine.position.TOP_RIGHT:
            return google.maps.ControlPosition.TOP_RIGHT;
          case MapEngine.position.RIGHT_CENTER:
            return google.maps.ControlPosition.RIGHT_CENTER;
          case MapEngine.position.BOTTOM_RIGHT:
            return google.maps.ControlPosition.BOTTOM_RIGHT;
          case MapEngine.position.BOTTOM_CENTER:
            return google.maps.ControlPosition.BOTTOM_CENTER;
          case MapEngine.position.BOTTOM_LEFT:
            return google.maps.ControlPosition.BOTTOM_LEFT;
          case MapEngine.position.LEFT_CENTER:
            return google.maps.ControlPosition.LEFT_CENTER;
        }
        break;
      default:
        throwMapError();
    }
  }

  var ready = function(cb) {
    switch (config.mapVendor) {
      case MapVendor.Yandex:
        ymaps.ready(()=>cb.call(null,this));
        break;
      case MapVendor.Google:
        cb.call(null,this);
        break;
      default:
        throwMapError();
    }
  };

  var extractCoordFromEvent = function(e) {
    switch (config.mapVendor) {
      case MapVendor.Yandex:
        return e.get("coords");
      case MapVendor.Google:
        if (e && e.latLng) return [e.latLng.lat(), e.latLng.lng()];
        else return;
      default:
        throwMapError();
    }
  }

  var extractCoordFromGeoObject = function(obj) {
    switch (config.mapVendor) {
      case MapVendor.Yandex:
        return obj.geometry.getCoordinates()[0];
      case MapVendor.Google:
        if (obj.latLng) return [obj.latLng.lat(), obj.latLng.lng()];
        else if (obj.end_location) return [obj.end_location.lat(), obj.end_location.lng()];
        return;
      default:
        throwMapError();
    }
  }

  var extractCoordFromString = function(s) {
    let scoord = s.split(',');
    let coord = [parseFloat(scoord[0]),parseFloat(scoord[1])];
    return (isNaN(coord[0])||isNaN(coord[1]))?null:coord;
  }

  var extractFullAddress = function(geo) {
    switch (config.mapVendor) {
      case MapVendor.Yandex:
        return geo.GeoObjectCollection.featureMember[0].GeoObject.metaDataProperty.GeocoderMetaData.text;
      case MapVendor.Google:
        return geo[0].formatted_address;
      default:
        throwMapError();
    }
  }

  var extractNearestPlace = function(geo) {
    switch (config.mapVendor) {
      case MapVendor.Yandex:
        var coord = geo.GeoObjectCollection
          .featureMember[0]
          .GeoObject
          .Point.pos.split(" ");
        var lat = coord[1];
        var lng = coord[0];
        return [lat, lng];
      case MapVendor.Google:
        var latLng = geo[0].geometry.location;
        return [latLng.lat(), latLng.lng()];
      default:
        throwMapError();
    }
  }

  var extractCluster = function(event) {
    switch (config.mapVendor) {
      case MapVendor.Yandex:
        return new CommonCluster(event.get('target'));
      case MapVendor.Google:
        return new CommonCluster(event);
      default:
        throwMapError();
    }
  }

  var preventDefault = function(event) {
    switch (config.mapVendor) {
      case MapVendor.Yandex:
        if (event && event.preventDefault)
          event.preventDefault();
        break;
      case MapVendor.Google:
        if (event && event.stop) event.stop();
        break;
      default:
        throwMapError();
    }
  }

  var geocode = function(fnd, cb, opts) {
    if (typeof fnd == "string") {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          ymaps.geocode(fnd, opts || {
            json: true
          }).then(cb);
          break;
        case MapVendor.Google: {
          let geocoder = new google.maps.Geocoder();
          geocoder.geocode({
              address: fnd
            },
            function(res, status) {
              if (status == google.maps.GeocoderStatus.OK) {
                cb(res);
              }
            });
          break;
        }
        default:
          throwMapError();
      }
    } else {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          ymaps.geocode(fnd, opts || {
            json: true
          }).then(cb);
          break;
        case MapVendor.Google: {
          let geocoder = new google.maps.Geocoder();
          var place = new google.maps.LatLng(fnd[0], fnd[1]);
          geocoder.geocode({
              latLng: place
            },
            function(res, status) {
              if (status == google.maps.GeocoderStatus.OK) {
                cb(res);
              }
            });
          break;
        }

        default:
          throwMapError();
      }
    }
  }

  var newMap = function(elemName, options) {
    switch (config.mapVendor) {
      case MapVendor.Yandex: {
        // control class for Yandex
        if (!window.UserDefinedControlClass) {

          window.UserDefinedControlClass = function(cnt, options) {
            UserDefinedControlClass.superclass.constructor.call(this, options);
            this._$content = cnt;
          };

          ymaps.util.augment(UserDefinedControlClass, ymaps.collection.Item, {
            onAddToMap: function(map) {
              UserDefinedControlClass.superclass.onAddToMap.call(this, map);
              this.getParent().getChildElement(this).then(this._onGetChildElement, this);
            },
            onRemoveFromMap: function(oldMap) {
              if (this._$content) {
                this._$content.remove();
              }
              UserDefinedControlClass.superclass.onRemoveFromMap.call(this, oldMap);
            },
            _onGetChildElement: function(parentDomContainer) {
              $(this._$content).appendTo(parentDomContainer);
            }
          });
        }
        let map = new ymaps.Map(elemName, options);
        var searchCtrl = new ymaps.control.SearchControl({
          options: {
            resultsPerPage: 5,
            useMapBounds: 1,
            noPlacemark: true
          }
        });
        var cmap;
        searchCtrl.events.add("resultselect", function(e) {
          searchCtrl.getResult(e.get('index')).then(function(res) {
            cmap.events.fireX("search", [res]);
          });
        })
        map.controls.add(searchCtrl);
        cmap = new CommonMap(map, elemName);
        return cmap;
      }
      case MapVendor.Google: {
        //MarkerClusterer.prototype.MARKER_CLUSTER_IMAGE_PATH_ = "https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m";
        let map = new google.maps.Map(document.getElementById(elemName),
          convertOptYToG(options));
        return new CommonMap(map, elemName);
      }
      default:
        throwMapError();
    }
  };

  var newBalloon = function(map) {
    switch (config.mapVendor) {
      case MapVendor.Yandex: {
        let ball = map.map.balloon;
        ball.getContentElement = function() {
          return $("ymaps[class*='balloon__content']")[0];
        };
        return new CommonBalloon(ball, map);
      }
      case MapVendor.Google: {
        let ball = new google.maps.InfoWindow({});
        google.maps.event.addListener(ball, 'domready', function() {
          $(".gm-style-iw button").css("display", "none");
          var $cont = $(".gm-style-iw");
          $cont.css("left", "30px");
        });
        ball.getContentElement = function() {
          return $(".gm-style-iw")[0];
        };
        return new CommonBalloon(ball, map);
      }
      default:
        throwMapError();
    }
  }

  const boundsFromPoints = function(points) {
    switch (config.mapVendor) {
      case MapVendor.Yandex:
        return ymaps.util.bounds.fromPoints(points);
      case MapVendor.Google:
        var bounds = new google.maps.LatLngBounds();
        for (var i = 0; i < points.length; i++) {
          var latLng = new google.maps.LatLng(points[i][0], points[i][1])
          bounds.extend(latLng);
        }
        var p1 = [bounds.getSouthWest().lat(),
          bounds.getSouthWest().lng()
        ];
        var p2 = [bounds.getNorthEast().lat(),
          bounds.getNorthEast().lng()
        ];
        return [p1, p2];
      default:
        throwMapError();
    }
  }

  const ptInRectangle = function(point, rect, minConstraints) {
    // normalize rect
    let left = Math.min(rect[0][0], rect[1][0]);
    let top = Math.min(rect[0][1], rect[1][1]);
    let right = Math.max(rect[0][0], rect[1][0]);
    let bottom = Math.max(rect[0][1], rect[1][1]);
    if (minConstraints) {
      if (minConstraints[0] && (right - left) < minConstraints[0]) {
        let addwidth = minConstraints[0] - (right - left);
        left -= addwidth / 2;
        right += addwidth / 2;
      }
      if (minConstraints[1] && (bottom - top) < minConstraints[1]) {
        let addheight = minConstraints[1] - (bottom - top);
        top -= addheight / 2;
        bottom += addheight / 2;
      }
    }
    return (point[0] >= left && point[0] <= right) &&
      (point[1] >= top && point[1] <= bottom);
  }

  var CommonGeoCollection = function(collection) {
    this.collection = collection;
    this.options = {
      set: function(key, value) {
        switch (config.mapVendor) {
          case MapVendor.Yandex:
            if (collection instanceof Array) {
              this[key] = value;
            } else {
              collection.options.set(key, value);
            }
            break;
          case MapVendor.Google:
            this[key] = value;
            break;
          default:
            throwMapError();
        }
      },
      unset: function(key) {
        switch (config.mapVendor) {
          case MapVendor.Yandex:
            if (collection instanceof Array) {
              delete this[key];
            } else {
              collection.options.unset(key);
            }

            break;
          case MapVendor.Google:
            delete this[key];
            break;
          default:
            throwMapError();
        }
      }
    }
    this.events = {
      add: function(eventName, cb) {
        switch (config.mapVendor) {
          case MapVendor.Yandex:
            collection.events.add(eventName, cb);
            break;
          case MapVendor.Google:
            //TODO
            break;
          default:
            throwMapError();
        }
      }
    }
    this.each = function(cb) {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          if (collection instanceof Array) {
            collection.map(cb);
          } else {
            collection.each(cb);
          }
          break;
        case MapVendor.Google:
          collection.map(cb);
          break;
        default:
          throwMapError();
      }
    }
    this.get = function(idx) {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          if (collection instanceof Array) {
            return collection[idx];
          } else {
            return collection.get(idx);
          }

          case MapVendor.Google:
            return collection[idx];
          default:
            throwMapError();
      }
    }
  }

  var CommonLeg = function(leg) {
    this.leg = leg;
    this.getLength = function() {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          return leg.getLength();
        case MapVendor.Google:
          return leg.distance.value;
        default:
          throwMapError();
      }
    }
    this.getDuration = function() {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          return leg.getTime();
        case MapVendor.Google:
          return leg.duration.value;
        default:
          throwMapError();
      }
    }
    this.events = {
      add: function(eventName, cb) {
        switch (config.mapVendor) {
          case MapVendor.Yandex:
            leg.events.add(eventName, cb);
            break;
          case MapVendor.Google:
            this[eventName] = cb;
            break;
          default:
            throwMapError();
        }
      },
      fire: function(name, arg) {
        switch (config.mapVendor) {
          case MapVendor.Yandex:
            leg.events.fire(name);
            break;
          case MapVendor.Google:
            this[name](arg);
            break;
          default:
            throwMapError();
        }
      }
    }
    this.options = {
      set: function(key, value) {
        switch (config.mapVendor) {
          case MapVendor.Yandex:
            leg.options.set(key, value);
            break;
          case MapVendor.Google:
            this[key] = value;
            break;
          default:
            throwMapError();
        }
      },
      unset: function(key) {
        switch (config.mapVendor) {
          case MapVendor.Yandex:
            leg.options.unset(key);
            break;
          case MapVendor.Google:
            delete this[key];
            break;
          default:
            throwMapError();
        }
      }
    }
    this.selectPath = function(map, opt) {
      switch (config.mapVendor) {
        case MapVendor.Yandex: {
          if (map.selectPolyline) {
            map.selectPolyline.setParent(null);
            delete map.selectPolyline;
          }
          var points = [];
          leg.getSegments().map(function(s) {
            s.getCoordinates().map(function(coord) {
              points.push(coord)
            });
          });
          let polyline = new ymaps.Polyline(points, {}, {
            strokeColor: opt && opt.strokeColor ? opt.strokeColor : "#FF0000",
            strokeWidth: 4,
            zIndex: 2000
          })
          map.map.geoObjects.add(polyline);
          map.selectPolyline = polyline;
          break;
        }
        case MapVendor.Google: {
          if (map.selectPolyline) {
            map.selectPolyline.setMap(null);
            delete map.selectPolyline;
          }
          var steps = leg.steps;
          let polyline = new google.maps.Polyline({
            path: [],
            strokeColor: opt && opt.strokeColor ? opt.strokeColor : "#FF0000",
            strokeWeight: 4,
            zIndex: 2000
          });
          for (let j = 0; j < steps.length; j++) {
            var nextSegment = steps[j].path;
            for (let k = 0; k < nextSegment.length; k++) {
              polyline.getPath().push(nextSegment[k]);
            }
          }
          polyline.setMap(map.map);
          map.selectPolyline = polyline;
          break;
        }
        default:
          throwMapError();
      }
    }
  }

  var CommonRoute = function(route) {
    this.route = route;

    this.getPaths = function() {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          if (!this.paths) {
            var geobjs = [];
            route.getPaths().each(function(p) {
              geobjs.push(new CommonLeg(p))
            });
            this.paths = new CommonGeoCollection(geobjs);
          }
          return this.paths;
        case MapVendor.Google:
          if (!this.paths) {
            var legs = [];
            var glegs = route.routes[0].legs;
            glegs.map(function(p) {
              legs.push(new CommonLeg(p))
            })
            this.paths = new CommonGeoCollection(legs);
          }
          return this.paths;
        default:
          throwMapError();
      }
    }
    this.getLength = function() {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          return route.getLength();
        case MapVendor.Google:
          var totalDistance = 0;
          var legs = route.routes[0].legs;
          for (var i = 0; i < legs.length; ++i) {
            totalDistance += legs[i].distance.value;
          }
          return totalDistance;
        default:
          throwMapError();
      }
    }
    this.getDuration = function() {
      switch (config.mapVendor) {
        case MapVendor.Yandex: {
          let totalSec = route.getTime();
          let hour = Math.floor(totalSec / 60 / 60);
          let min = Math.round(totalSec / 60 - hour * 60);
          return {
            hour: hour,
            minutes: min,
            totalsec: totalSec
          };
        }
        case MapVendor.Google: {
          let totalDuration = 0;
          let legs = route.routes[0].legs;
          for (let i = 0; i < legs.length; ++i) {
            totalDuration += legs[i].duration.value;
          }
          let hour = Math.floor(totalDuration / 60 / 60);
          let min = Math.round(totalDuration / 60 - hour * 60);
          return {
            hour: hour,
            minutes: min,
            totalsec: totalDuration
          };
        }
        default:
          throwMapError();
      }
    }
    this.getWayPoints = function() {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          if (!this.waypoints)
            this.waypoints = new CommonGeoCollection(route.getWayPoints());
          return this.waypoints;
        case MapVendor.Google:
          if (!this.waypoints) {
            var glegs = route.routes[0].legs;
            var points = route.geocoded_waypoints;
            glegs.map(function(leg, idx) {
              points[idx].latLng = leg.start_location;
            });
            points[points.length - 1].latLng = glegs[glegs.length - 1].end_location;
            this.waypoints = new CommonGeoCollection(points);
          }
          return this.waypoints;
        default:
          throwMapError();
      }
    }

  }

  var route = function(coords, opts, viapoints) {
    switch (config.mapVendor) {
      case MapVendor.Yandex:
        var errfunc = function(err) {
          console.error("Yandex build route fault in [" + coords + "] :" + err);
          if (reject) {
            reject(err);
          } else {
            throw err;
          }
        }
        return new Promise(function(resolve, reject) {
          if (viapoints) {
            viapoints.forEach(function(via, idx) {
              coords.splice(1 + idx, 0, {
                type: 'viaPoint',
                point: via
              });
            })
          }
          if (coords.length > 1) {
            ymaps.route(coords, opts).then(function(yroute) {
              resolve(new CommonRoute(yroute));
            }, errfunc)
          } else {
            // if route include one point!
            // add point
            ymaps.route(coords.concat(coords), opts).then(function(yroute) {
              // and delete from path
              yroute.getPaths().splice(1, 1);
              yroute.getWayPoints().splice(1, 1);
              resolve(new CommonRoute(yroute));
            }, errfunc)
          }
        });
      case MapVendor.Google:
        if (!googleDirectionService)
          googleDirectionService = new google.maps.DirectionsService();
        var waypoints;
        if (coords.length > 2) {
          waypoints = [];
          for (var i = 1; i < coords.length - 1; ++i) {
            waypoints.push({
              location: new google.maps.LatLng(coords[i][0], coords[i][1]),
              stopover: true
            });
          }
        }
        var request = {
          origin: new google.maps.LatLng(coords[0][0], coords[0][1]),
          destination: new google.maps.LatLng(coords[coords.length - 1][0], coords[coords.length - 1][1]),
          waypoints: waypoints,
          travelMode: google.maps.TravelMode.DRIVING,
          provideRouteAlternatives: false,
          optimizeWaypoints: true
        };
        return new Promise(function(resolve, reject) {
          var query = function() {
            googleDirectionService.route(request, function(response, status) {
              if (status == 'OK') {
                resolve(new CommonRoute(response))
              } else
              if (status == 'OVER_QUERY_LIMIT') {
                setTimeout(function() {
                  console.log("to retry call of route(.)");
                  query();
                }, 1500);
              } else {
                reject(status);
              }

            });
          }
          query();
        });
      default:
        throwMapError();
    }
  }

  var initHeatMap = function(cmnMap, cb) {
    switch (config.mapVendor) {
      case MapVendor.Yandex:
        ymaps.modules.require(['Heatmap'], function(Heatmap) {
          var heatmap = new Heatmap();
          cb(heatmap);
          heatmap.setMap(cmnMap.map);
        });
        break;
      case MapVendor.Google:
        break;
      default:
        throwMapError();
    }
  }

  var getTypeSelector = function() {
    switch (config.mapVendor) {
      case MapVendor.Yandex:
        return new ymaps.control.TypeSelector();
      case MapVendor.Google:
        //TODO
        break;
      default:
        throwMapError();
    }
  }

  var onlyVendor = function(vendor, cb) {
    if (vendor instanceof Array) {
      if (vendor.includes(config.mapVendor))
        cb.call();
    } else {
      if (vendor == config.mapVendor)
        cb.call();
    }
  }

  const EDITOR_CIRCLE = 0,
    EDITOR_RECT = 1,
    EDITOR_POLYGON = 2,
    EDITOR_POLYLINE = 3;

  const CommonEditor = function(map, point, typeId, options) {
    this.map = map;
    this.editObject;
    this.events = {};
    this.fillColor = options.fillColor || "#DB709377";
    this.strokeColor = options.strokeColor || "#990066";

    var self = this;

    this.start = function() {
      if (config.mapVendor == MapVendor.Yandex)
        $("a[class$='copyright__link']").prop("tabindex", "-1");

      switch (typeId) {
        case EDITOR_CIRCLE:
          self.startCircleEditor(point, options.radius);
          break;
        case EDITOR_RECT:
          self.startRectangleEditor(point, options.width, options.height);
          break;
        case EDITOR_POLYGON:
          self.startPolygonEditor(point, options.points);
          break;
        case EDITOR_POLYLINE:
          self.startPolylineEditor(point, options.linepoints);
          break;

        default:
          break;
      }
      return self;
    }

    this.startCircleEditor = function(point, rad) {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          var circle = new ymaps.Circle([point, rad], {}, {
            fillColor: self.fillColor,
            strokeColor: self.strokeColor,
            strokeOpacity: 0.8,
            strokeWidth: 4
          });
          self.map.map.geoObjects.add(circle);
          circle.events.add('geometrychange', function(e) {
            let r = Math.round(e.get('target').geometry.getRadius());
            let newpoint = e.get('target').geometry.getCoordinates();
            if (r != rad) {
              let event = self.events["change"];
              if (event) event.call(self, {
                radius: r
              })
              rad = r;
            }
            if (newpoint.toString() != point.toString()) {
              let event = self.events["change"];
              if (event) event.call(self, {
                coord: newpoint
              })
              point = newpoint;
            }
          });
          circle.editor.startEditing();
          self.editObject = circle;
          break;
        case MapVendor.Google:
          //TODO
          break;
        default:
          throwMapError();
      }
    }

    this.startRectangleEditor = function(point, width, height) {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          let solve;
          solve = ymaps.coordSystem.geo.solveDirectProblem(point, [0, 1], width);
          width = Math.abs(solve.endPoint[1] - point[1]);
          solve = ymaps.coordSystem.geo.solveDirectProblem(point, [1, 0], height);
          height = Math.abs(solve.endPoint[0] - point[0]);

          let lt = {
            lat: point[0] - height / 2,
            lng: point[1] - width / 2
          };
          var polygon = new ymaps.Polygon([
            [
              [lt.lat, lt.lng],
              [lt.lat, lt.lng + width],
              [lt.lat + height, lt.lng + width],
              [lt.lat + height, lt.lng],
              [lt.lat, lt.lng]
            ]
          ], {}, {
            fillColor: self.fillColor,
            strokeColor: self.strokeColor,
            strokeOpacity: 0.8,
            strokeWidth: 4
          });
          self.map.map.geoObjects.add(polygon);
          polygon.events.add('geometrychange', function(e) {
            let rect = e.get('target').geometry.getBounds();
            let newpoint = [(rect[0][0] + rect[1][0]) / 2, (rect[0][1] + rect[1][1]) / 2];
            if (newpoint.toString() != point.toString()) {
              let event = self.events["change"];
              if (event) event.call(self, {
                coord: newpoint
              })
              point = newpoint;
            }
          });
          polygon.editor.startFraming();
          self.editObject = polygon;
          break;
        case MapVendor.Google:
          //TODO
          break;
        default:
          throwMapError();
      }
    }

    this.startPolygonEditor = function(point, points) {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          var polygon = new ymaps.Polygon([
            points
          ], {}, {
            fillColor: self.fillColor,
            strokeColor: self.strokeColor,
            strokeOpacity: 0.8,
            strokeWidth: 4
          });
          self.map.map.geoObjects.add(polygon);
          polygon.events.add('geometrychange', function(e) {
            let coords = e.get('target').geometry.getCoordinates();
            let event = self.events["change"];
            if (event) event.call(self, {
              polycoords: coords
            })
          });
          polygon.editor.startEditing();
          self.editObject = polygon;
          break;
        case MapVendor.Google:
          //TODO
          break;
        default:
          throwMapError();
      }
    }

    this.startPolylineEditor = function(point, points) {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          var polyline = new ymaps.Polyline(
            points, {}, {
              fillColor: self.fillColor,
              strokeColor: self.strokeColor,
              strokeOpacity: 0.8,
              strokeWidth: 4
            });
          self.map.map.geoObjects.add(polyline);
          polyline.events.add('geometrychange', function(e) {
            let coords = e.get('target').geometry.getCoordinates();
            let event = self.events["change"];
            if (event) event.call(self, {
              polylinecoords: coords
            })
          });
          polyline.editor.startEditing();
          self.editObject = polyline;
          break;
        case MapVendor.Google:
          //TODO
          break;
        default:
          throwMapError();
      }
    }

    this.stop = function() {
      switch (config.mapVendor) {
        case MapVendor.Yandex:
          if (self.editObject) {
            self.editObject.editor.stopEditing();
            self.map.map.geoObjects.remove(self.editObject);
            self.editObject = undefined;
          }
          break;
        case MapVendor.Google:
          //TODO
          break;
        default:
          throwMapError();
      }

    }
  }

  var calcDistance = function(p1, p2) {
    switch (config.mapVendor) {
      case MapVendor.Yandex:
        return ymaps.coordSystem.geo.solveInverseProblem(p1, p2).distance;
      case MapVendor.Google:
        //TODO
        break;
      default:
        throwMapError();
    }
  }

  var calcEndPoint = function(start, dir, lenInMeter) {
    switch (config.mapVendor) {
      case MapVendor.Yandex:
        return ymaps.coordSystem.geo.solveDirectProblem(start, dir, lenInMeter).endPoint;
      case MapVendor.Google:
        //TODO
        break;
      default:
        throwMapError();
    }
  }

  return {
    ready: ready,
    newMap: newMap,
    newBalloon: newBalloon,
    extractCoordFromEvent: extractCoordFromEvent,
    extractCoordFromGeoObject: extractCoordFromGeoObject,
    extractCoordFromString: extractCoordFromString,
    extractFullAddress: extractFullAddress,
    extractNearestPlace: extractNearestPlace,
    extractCluster: extractCluster,
    geocode: geocode,
    preventDefault: preventDefault,
    boundsFromPoints: boundsFromPoints,
    initHeatMap: initHeatMap,
    getTypeSelector: getTypeSelector,
    onlyVendor: onlyVendor,
    position: {
      TOP_LEFT: 1,
      TOP_CENTER: 2,
      TOP_RIGHT: 3,
      RIGHT_CENTER: 4,
      BOTTOM_RIGHT: 5,
      BOTTOM_CENTER: 6,
      BOTTOM_LEFT: 7,
      LEFT_CENTER: 8
    },
    route: route,
    editorTypes: {
      CIRCLE: EDITOR_CIRCLE,
      RECT: EDITOR_RECT,
      POLYGON: EDITOR_POLYGON,
      POLYLINE: EDITOR_POLYLINE
    },
    calcDistance: calcDistance,
    calcEndPoint: calcEndPoint,
    ptInRectangle: ptInRectangle
  };
};

// hack for google MarkerClusterer
if (window.MarkerClusterer) {
  MarkerClusterer.prototype.getBounds = function() {
    var markers = this.markers_;
    if (markers.length == 0) return;
    var bounds = new google.maps.LatLngBounds(
      markers[0].getPosition(), markers[0].getPosition());
    for (var i = 0, marker; marker = markers[i]; i++) {
      bounds.extend(marker.getPosition());
    }
    return bounds;
  };
}
