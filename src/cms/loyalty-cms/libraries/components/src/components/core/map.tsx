import React, { useEffect, useRef, useState } from 'react';
import { AppLabel } from './label';
import { AutoComplete } from 'primereact/autocomplete';

declare let vtmapgl: any;

const token = 'acfda3fa21ccc80fc6946681c4d6729f';

const initMapScript = () => {
  // Create a script element for vtmap-gl.js
  const vtmapScript = document.createElement('script');
  vtmapScript.src = 'https://maps.viettel.vn/files/sdk/vtmap-gl-js/v1.2.1/vtmap-gl.js';
  vtmapScript.async = true;

  // Create a link element for vtmap-gl.css
  const vtmapCss = document.createElement('link');
  vtmapCss.rel = 'stylesheet';
  vtmapCss.href = 'https://maps.viettel.vn/files/sdk/vtmap-gl-js/v1.2.1/vtmap-gl.css';

  // Create a script element for vtmap-gl-directions.js
  const directionsScript = document.createElement('script');
  directionsScript.src = 'https://files-maps.viettel.vn/sdk/vtmap-gl-directions/v4.1.0/vtmap-gl-directions.js';
  directionsScript.async = true;

  // Create a link element for vtmap-gl-directions.css
  const directionsCss = document.createElement('link');
  directionsCss.rel = 'stylesheet';
  directionsCss.href = 'https://files-maps.viettel.vn/sdk/vtmap-gl-directions/v4.1.0/vtmap-gl-directions.css';
  return { vtmapScript, vtmapCss, directionsScript, directionsCss };
};

class MapService {
  apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey; // Store the API key
  }

  // Method to fetch latitude and longitude from a given address
  async getLatLngFromText(address: string) {
    const url = new URL('https://api-maps.viettel.vn/gateway/placeapi/v2/place-api/geocode');
    url.searchParams.append('address', address);
    url.searchParams.append('key', this.apiKey);

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error', error);
      throw error;
    }
  }

  // Method to fetch data for autocomplete
  async getRelatedLocations(text: string, off: number, limit: number, key: string) {
    const url = new URL(
      'https://api-maps.viettel.vn/gateway/placeapi/v2-old/place-api/VTMapService/placeService/geocoding'
    );
    url.searchParams.append('t', text);
    url.searchParams.append('off', off.toString());
    url.searchParams.append('lm', limit.toString());
    url.searchParams.append('k', key);

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const relatedLocationsData = await response.json();
      return relatedLocationsData;
    } catch (error) {
      console.error('Error', error);
      throw error;
    }
  }
}

export interface Address {
  lat: number;
  lng: number;
  address: string;
}

interface AppMapProps {
  containerStyleClass?: React.CSSProperties;
  initLocation?: Address;
  zoom?: number;
  viewOnly?: boolean;
  useSearch?: boolean;
  useDirection?: boolean;
  label?: string;
  required?: boolean;
  error?: string;
  caption?: string;
  showCaption?: boolean;
  onAddressChange?: (address: Address) => void;
  onStartAddressChange?: (address: Address) => void;
  onEndAddressChange?: (address: Address) => void;
  onMapReady?: (mapInstance: any, vtmapgl: any, currentMarkers: any[]) => void; // Add this line
}

const AppMap: React.FC<AppMapProps> = ({
  initLocation = { lng: 108.2022, lat: 16.0544 },
  zoom = 12,
  viewOnly = false,
  useSearch = false,
  useDirection = false,
  label = '',
  required = false,
  error = '',
  caption = '',
  showCaption = false,
  onAddressChange,
  onStartAddressChange,
  onEndAddressChange,
  onMapReady,
  containerStyleClass = {
    height: '100vh',
    width: '100%',
  },
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<any>(null);
  const [selectedPosition, setSelectedPosition] = useState<string>('');
  const [filteredPositions, setFilteredPositions] = useState<string[]>([]);
  const [selectedPositionStart, setSelectedPositionStart] = useState<string>('');
  const [filteredPositionsStart, setFilteredPositionsStart] = useState<string[]>([]);
  const [selectedPositionEnd, setSelectedPositionEnd] = useState<string>('');
  const [filteredPositionsEnd, setFilteredPositionsEnd] = useState<string[]>([]);
  const [route, setRoute] = useState({
    startLat: null,
    startLng: null,
    endLat: null,
    endLng: null,
  });

  const [currentMarkers, setCurrentMarkers] = useState<any[]>([]);

  useEffect(() => {
    const { vtmapScript, vtmapCss, directionsScript, directionsCss } = initMapScript();

    document.head.appendChild(vtmapCss);
    document.head.appendChild(vtmapScript);
    document.head.appendChild(directionsCss);
    document.head.appendChild(directionsScript);

    vtmapScript.onload = () => {
      const vtmapgl = (window as any).vtmapgl;
      if (mapContainerRef.current && vtmapgl) {
        vtmapgl.accessToken = token;
        const newMap = new vtmapgl.Map({
          container: mapContainerRef.current,
          style: vtmapgl.STYLES.VTRANS,
          center: [initLocation.lng, initLocation.lat],
          zoom: zoom,
        });

        newMap.on('load', () => {
          newMap.mapLoaded = true;
        });

        // Add zoom and rotation controls to the map.
        newMap.addControl(new vtmapgl.NavigationControl());

        const waiting = () => {
          if (!newMap || !vtmapgl || !newMap.isStyleLoaded()) {
            setTimeout(waiting, 200);
          } else {
            newMap.on('zoom', () => {
              zoom = newMap.getZoom();
            });
          }
        };

        // Waiting for the map loaded successfully
        waiting();

        if (!viewOnly) {
          newMap.on('click', (e: any) => {
            const { lng, lat } = e.lngLat;
            const marker = addMarker(lng, lat, newMap);
            setCurrentMarkers((prev) => {
              if (prev.length > 0) {
                prev[0].remove(); // Remove the first marker
                return [marker];
              }
              return [marker];
            });

            fetchLatlngToAddress(lat, lng, (result: any, status: number) => {
              if (status === 0) {
                const address = result.items[0].name;
                if (!useDirection && onAddressChange) {
                  onAddressChange({ lat, lng, address });
                }
              } else {
                alert('Không xác định được địa chỉ');
              }
            });
          });
        }

        setMap(newMap);
        if (onMapReady) {
          onMapReady(newMap, vtmapgl, currentMarkers);
        }
      }
    };

    // Cleanup function to remove scripts and styles on component unmount
    return () => {
      document.head.removeChild(vtmapCss);
      document.head.removeChild(vtmapScript);
      document.head.removeChild(directionsCss);
      document.head.removeChild(directionsScript);
    };
  }, []);

  const addMarker = (lng: number, lat: number, map: any) => {
    return new vtmapgl.Marker().setLngLat([lng, lat]).addTo(map);
  };

  const fetchLatlngToAddress = (lat: string, lng: string, onSuccess: (result: any, status: number) => void) => {
    const geocoderService = new vtmapgl.GeocoderAPIService({
      accessToken: token,
    });
    geocoderService.fetchLatlngToAddress(`${lat},${lng}`, onSuccess);
  };

  const getLatLngFromText = (data: any, onSuccess: (response: any) => void) => {
    const mapService = new MapService(token);
    mapService
      .getLatLngFromText(data.value)
      .then((response) => {
        onSuccess(response);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  };

  const handleSelectPosition = (data: any) => {
    getLatLngFromText(data, (response: any) => {
      const { lng, lat } = response?.results[0]?.geometry?.location ?? {};
      const marker = addMarker(lng, lat, map);
      setCurrentMarkers((prev) => {
        if (prev.length > 1) {
          prev[0].remove(); // Remove the first marker
          return [marker];
        }
        return [marker];
      });

      fetchLatlngToAddress(lat, lng, (result: any, status: number) => {
        if (status === 0) {
          const address = result.items[0].name;
          setSelectedPosition(address);
          if (onAddressChange) {
            onAddressChange({ lat, lng, address });
          }
        } else {
          alert('Cannot determine the address');
        }
      });
      map.flyTo({ center: [lng, lat] });
    });
  };

  const handleSelectPositionStart = (data: any) => {
    getLatLngFromText(data, (response: any) => {
      const { lng, lat } = response?.results[0]?.geometry?.location ?? {};
      fetchLatlngToAddress(lat, lng, (result: any, status: number) => {
        if (status === 0) {
          const address = result.items[0].name;
          setSelectedPositionStart(address);
          if (onStartAddressChange) {
            onStartAddressChange({ lat, lng, address });
          }

          // Update the route with the start coordinates
          setRoute((prevRoute) => ({
            ...prevRoute,
            startLat: lat,
            startLng: lng,
          }));

          // Check if both start and end positions are selected
          if (selectedPositionStart.length > 0 && selectedPositionEnd.length > 0) {
            drawDirection(`${lng},${lat}`, `${route.endLng},${route.endLat}`);
          }
        } else {
          alert('Cannot determine the address');
        }
      });
      map.flyTo({ center: [lng, lat] });
    });
  };

  const handleSelectPositionEnd = (data: any) => {
    getLatLngFromText(data, (response: any) => {
      const { lng, lat } = response?.results[0]?.geometry?.location ?? {};
      fetchLatlngToAddress(lat, lng, (result: any, status: number) => {
        if (status === 0) {
          const address = result.items[0].name;
          setSelectedPositionEnd(address);
          if (onEndAddressChange) {
            onEndAddressChange({ lat, lng, address });
          }

          // Update the route with the end coordinates
          setRoute((prevRoute) => ({
            ...prevRoute,
            endLat: lat,
            endLng: lng,
          }));

          // Check if both start and end positions are selected
          if (selectedPositionStart.length > 0 && selectedPositionEnd.length > 0) {
            drawDirection(`${route.startLng},${route.startLat}`, `${lng},${lat}`);
          }
        } else {
          alert('Cannot determine the address');
        }
      });
      map.flyTo({ center: [lng, lat] });
    });
  };

  const searchPosition = (event: any) => {
    fetchPosition(event, (response: any) => {
      setFilteredPositions(response?.items?.map((item: any) => item.address));
    });
  };

  const searchPositionStart = (event: any) => {
    fetchPosition(event, (response: any) => {
      setFilteredPositionsStart(response?.items?.map((item: any) => item.address));
    });
  };

  const searchPositionEnd = (event: any) => {
    fetchPosition(event, (response: any) => {
      setFilteredPositionsEnd(response?.items?.map((item: any) => item.address));
    });
  };

  const fetchPosition = (event: any, onSuccess: (response: any) => void) => {
    const query = event.query;
    const mapService = new MapService(token);
    mapService
      .getRelatedLocations(query, 0, 10, token)
      .then((response) => {
        onSuccess(response);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  };

  const getWaypoints = (origin: string, destination: string, onSuccess: (data: any, statusCode: any) => void) => {
    const routingService = new vtmapgl.RoutingService({ accessToken: token });
    routingService.fetchDirections(`${origin};${destination}`, false, 'driving', onSuccess);
  };

  const drawDirection = (origin: string, destination: string) => {
    getWaypoints(origin, destination, (data: any) => {
      if (map.getLayer('routeLayer')) {
        map.removeLayer('routeLayer');
      }

      if (map.getSource('routeLayer')) {
        map.removeSource('routeLayer');
      }

      map.addSource('routeLayer', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: data.routes[0]?.geometry,
          },
        },
      });

      map.addLayer({
        id: 'routeLayer',
        type: 'line',
        source: 'routeLayer',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#FF5733',
          'line-width': 8,
        },
      });
    });
  };

  const childContent = (
    <div className="relative" style={containerStyleClass}>
      {useSearch && (
        <div className="p-mr-2 p-input w-6 p-3 absolute z-3">
          <div className="p-inputgroup">
            <AutoComplete
              inputId="autocomplete"
              value={selectedPosition}
              suggestions={filteredPositions}
              completeMethod={searchPosition}
              onSelect={handleSelectPosition}
              placeholder="Nhập địa điểm tìm kiếm"
              // showClear
              onChange={(e) => setSelectedPosition(e.value)}
              maxLength={255}
            />
          </div>
        </div>
      )}

      {useDirection && (
        <>
          <div className="p-mr-2 p-input w-6 p-3 absolute z-3" style={{ bottom: 0, left: 0 }}>
            <div className="p-inputgroup">
              <AutoComplete
                inputId="autocompleteStart"
                value={selectedPositionStart}
                suggestions={filteredPositionsStart}
                completeMethod={searchPositionStart}
                onSelect={handleSelectPositionStart}
                placeholder="Nhập địa điểm bắt đầu"
                //   showClear
                onChange={(e) => setSelectedPositionStart(e.value)}
                maxLength={255}
              />
            </div>
          </div>
          <div className="p-mr-2 p-input w-6 p-3 absolute z-3" style={{ bottom: 0, right: 0 }}>
            <div className="p-inputgroup">
              <AutoComplete
                inputId="autocompleteEnd"
                value={selectedPositionEnd}
                suggestions={filteredPositionsEnd}
                completeMethod={searchPositionEnd}
                onSelect={handleSelectPositionEnd}
                placeholder="Nhập địa điểm kết thúc"
                //   showClear
                onChange={(e) => setSelectedPositionEnd(e.value)}
                maxLength={255}
              />
            </div>
          </div>
        </>
      )}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
  return label ? (
    <AppLabel label={label} error={error} required={required} caption={caption} showCaption={showCaption}>
      {childContent}
    </AppLabel>
  ) : (
    childContent
  );
};

export { AppMap };
