"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import type { Layer } from "leaflet";

interface VectorGridFeature {
  type: number;
  id: string | number;
  properties?: {
    _geometryType?: number;
    [key: string]: unknown;
  };
}

interface VectorGridLayer extends Layer {
  bringToFront: () => void;
}

const HIDDEN_STYLE = {
  weight: 0,
  radius: 0,
  fill: false,
  stroke: false,
  fillOpacity: 0,
  opacity: 0,
};

const RAIL_STYLE = {
  weight: 2,
  color: "#ec5b13",
  opacity: 1,
  fillColor: "#ec5b13",
  fill: false,
  radius: 0,
  fillOpacity: 0,
};

const styleFunction = (
  properties: { _geometryType?: number },
  zoom: number,
) => {
  if (properties._geometryType === 1) {
    return HIDDEN_STYLE;
  }

  const weight = zoom < 9 ? 1 : zoom < 12 ? 1.5 : 2;

  return {
    ...RAIL_STYLE,
    weight,
  };
};

const styleProxy = new Proxy(
  {},
  {
    get: () => styleFunction,
  },
);

export function RailsVectorTiles({ url }: { url: string }) {
  const map = useMap();
  const layerRef = useRef<VectorGridLayer | null>(null);
  const currentUrlRef = useRef<string>(url);

  useEffect(() => {
    if (!map) return;

    async function init() {
      if (typeof window === "undefined") return;

      if (layerRef.current && currentUrlRef.current === url) {
        return;
      }

      try {
        await import("leaflet.vectorgrid");
      } catch (err) {
        return;
      }

      const L = require("leaflet");
      if (!L.vectorGrid || !L.vectorGrid.protobuf) {
        return;
      }

      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }

      currentUrlRef.current = url;
      layerRef.current = L.vectorGrid
        .protobuf(url, {
          rendererFactory: L.canvas.tile,
          pane: "railsPane",
          maxNativeZoom: 15,
          minZoom: 9,
          getFeatureId: (f: VectorGridFeature) => {
            if (f.properties) {
              f.properties._geometryType = f.type;
            }
            return f.id;
          },
          vectorTileLayerStyles: styleProxy,
          interactive: false,
          updateWhenZooming: false,
          keepBuffer: 3,
        })
        .addTo(map);

      if (layerRef.current) {
        layerRef.current.bringToFront();
      }
    }

    init();

    return () => {};
  }, [map, url]);

  useEffect(() => {
    return () => {
      if (layerRef.current && map) {
        try {
          map.removeLayer(layerRef.current);
        } catch (e) {}
        layerRef.current = null;
      }
    };
  }, [map]);

  return null;
}
