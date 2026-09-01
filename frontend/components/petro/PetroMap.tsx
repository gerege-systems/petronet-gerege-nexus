"use client";

/**
 * Where to buy fuel — the citizen's map, and this deployment's front page.
 *
 * Rendered by app/page.tsx at `/`, which components/Layout.tsx already treats as
 * public: Layout returns the children and nothing else, so there is no sidebar,
 * no app rail and no organisation switcher around it. Those belong to somebody
 * administering a company. A driver looking for petrol is not administering
 * anything and, on a first visit, has no session at all.
 *
 * It replaced the platform's marketing landing page. That page argues for the
 * platform to somebody choosing one; this deployment's visitor has already
 * arrived and wants to know where the fuel is.
 *
 * # Why a GeoJSON source and not markers
 *
 * Up to 300 stations in a viewport. Three hundred DOM markers is three hundred
 * absolutely-positioned elements that the browser re-lays-out on every frame of
 * a pan; a GeoJSON source with a circle layer is drawn by the GPU in one pass
 * and stays smooth on a phone. It also lets the brand colour come from a data
 * expression rather than from JavaScript deciding per marker.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import StationSheet from "@/components/petro/StationSheet";
// Named imports, not a default one: maplibre-gl ships ESM from v5 and its
// module has no default export, so `import maplibregl from` builds against the
// CommonJS shim under webpack and fails outright under Turbopack.
import {
  GeolocateControl,
  Map as MapLibreMap,
  NavigationControl,
  setWorkerUrl,
  type GeoJSONSource,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { api, type PublicStation } from "@/lib/api";
import { fuelMapStyle, isCovered, MONGOLIA_BOUNDS, ULAANBAATAR } from "@/lib/petro/mapStyle";
import { addStationPins, PIN_IMAGE_MATCH } from "@/lib/petro/stationPin";
import { useI18n } from "@/lib/i18n";

const SOURCE = "stations";

/**
 * Tell MapLibre where its worker lives.
 *
 * It parses tiles on a module worker whose url it derives from the library's
 * own `import.meta.url`. Under Turbopack that resolves to a path the dev server
 * answers with HTML, the browser rejects it on MIME type, and the map renders
 * nothing — with no error on the map object, because the failure is inside the
 * worker's loader rather than in anything MapLibre awaits. The symptom is a
 * blank canvas and one console line about a "non-JavaScript MIME type".
 *
 * scripts/copy-maplibre-worker.mjs puts the file under /public on predev and
 * prebuild, so this path is served as a static asset with the right type.
 */
setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

function toFeatureCollection(stations: PublicStation[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: stations.map((s) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [s.lon, s.lat] },
      properties: {
        id: s.id,
        name: s.name,
        brand: s.brand,
        brandLabel: s.brand_label || s.brand,
        address: s.address,
        openingHours: s.opening_hours,
        // -1 stands for "nobody has reported a tank size". A real percentage is
        // 0..100, so the sentinel cannot collide with one, and MapLibre feature
        // properties have no null to use instead.
        stock: s.stock_percent ?? -1,
        // MapLibre feature properties are flat, so the fuels ride as JSON and
        // are parsed back when a popup needs them.
        fuels: JSON.stringify(s.fuels ?? []),
      },
    })),
  };
}

/**
 * Хоёр газар зурагдана: `/map` дээр бүтэн дэлгэцээр, нүүр хуудсан дээр нэг
 * хэсэг болж. Ялгаа нь хоёрхон зүйл, тиймээс prop нь хоёрхон.
 *
 * `locate` — байршил асуух эсэх. Бүтэн дэлгэцийн зураг руу орсон хүн ойролцоох
 * ШТС-ээ хайж байгаа тул асуух нь зөв; нүүр хуудас руу зүгээр орсон хүнээс
 * зөвшөөрөл гуйх нь тэдний асуугаагүй зүйл.
 *
 * `initialZoom` — нүүр хуудсан дээр улс бүтнээрээ багтах ёстой; `/map` дээр
 * хот руугаа ойртсон байна.
 */
export default function PetroMap({
  locate = true,
  initialZoom = 12,
}: { locate?: boolean; initialZoom?: number } = {}) {
  const { t } = useI18n();
  const container = useRef<HTMLDivElement | null>(null);
  const map = useRef<InstanceType<typeof MapLibreMap> | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  // The station whose panel is open. Held in React rather than drawn into a
  // MapLibre popup because the panel has a form in it — see StationSheet.
  const [selected, setSelected] = useState<PublicStation | null>(null);
  // The last answer from the server, so a tap can find the whole station rather
  // than the flattened properties MapLibre carries on a feature.
  const stationsByID = useRef<Map<string, PublicStation>>(new Map());

  /**
   * Read the viewport, ask the server, hand the answer to the source.
   *
   * Дэлгэцийн хүрээг улсын хилээр таслаад асууна. Сервер нь улсаас том хүрээг
   * татгалздаг («bbox is too large; zoom in») — тэр нь зөв: хязгааргүй хүрээ
   * гэдэг «бүгдийг нь» гэсэн асуулт параметрийн нүүр зүүсэн хэлбэр. Гэхдээ
   * өргөн дэлгэц дээр улсыг бүтнээр нь харах гэсэн хүн 35 градусаас хальж,
   * газрын зураг дээрээ ганц ШТС-гүй улаан алдаа хардаг байв.
   *
   * Таслах нь хариултыг өөрчлөхгүй: ШТС бүгд Монголд байгаа тул хилээс
   * гадуурх хэсэгт үлдэх зүйл байхгүй. Огт огтлолцохгүй бол (хэн нэгэн
   * Европ руу гүйлгэсэн) серверээс асуух зүйлгүй.
   */
  const refresh = useCallback(async () => {
    const m = map.current;
    if (!m) return;
    const b = m.getBounds();
    const box = {
      minLon: Math.max(b.getWest(), MONGOLIA_BOUNDS.minLon),
      minLat: Math.max(b.getSouth(), MONGOLIA_BOUNDS.minLat),
      maxLon: Math.min(b.getEast(), MONGOLIA_BOUNDS.maxLon),
      maxLat: Math.min(b.getNorth(), MONGOLIA_BOUNDS.maxLat),
    };
    if (box.minLon >= box.maxLon || box.minLat >= box.maxLat) {
      const empty = m.getSource(SOURCE) as GeoJSONSource | undefined;
      empty?.setData(toFeatureCollection([]));
      stationsByID.current = new Map();
      setCount(0);
      setError(null);
      return;
    }
    try {
      const result = await api.publicFuelStations(box);
      const source = m.getSource(SOURCE) as GeoJSONSource | undefined;
      source?.setData(toFeatureCollection(result.stations));
      stationsByID.current = new Map(result.stations.map((s) => [s.id, s]));
      setCount(result.count);
      setError(null);
    } catch (err) {
      // A 429 is the rate limiter, not a fault: the map stays as it was and the
      // next settled viewport asks again.
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    if (!container.current || map.current) return;

    const m = new MapLibreMap({
      container: container.current,
      style: fuelMapStyle(),
      center: [ULAANBAATAR.lon, ULAANBAATAR.lat],
      zoom: initialZoom,
      // Шулуун дээрээс, эргүүлэлгүй. Налуу нь өргөгдсөн барилга байхад
      // утгатай байсан; растер дэвсгэр налуу үед зөвхөн бүдгэрдэг тул
      // `maxPitch: 0` — хазайлт нь боломж биш, эвдрэл болно.
      pitch: 0,
      bearing: 0,
      maxPitch: 0,
      attributionControl: { compact: true },
    });
    map.current = m;

    // MapLibre reports a broken style or an unreachable tile here and nowhere
    // else. Without this the map simply draws nothing, which is the same thing
    // a working map over empty tiles looks like.
    m.on("error", (event) => {
      setError(event.error?.message ?? "map error");
    });

    // Луужинтай: газрын зураг эргэдэг гэдгийг хэлдэг бас хойд зүг рүү нь
    // буцаадаг цорын ганц хяналт нь тэр. Налуу нь `maxPitch: 0` болсон тул
    // зүү дээр харуулах юм үлдээгүй.
    m.addControl(new NavigationControl({ showCompass: true }), "bottom-right");
    m.addControl(
      new GeolocateControl({ trackUserLocation: false, showAccuracyCircle: true }),
      "bottom-right",
    );

    m.on("load", async () => {
      m.addSource(SOURCE, { type: "geojson", data: toFeatureCollection([]) });

      // A pin per station, not a circle. The image is chosen from the feature's
      // brand, which is why there is one image per colour — see lib/petro/stationPin.ts.
      await addStationPins(m);
      m.addLayer({
        id: "station-pin",
        type: "symbol",
        source: SOURCE,
        layout: {
          "icon-image": PIN_IMAGE_MATCH as never,
          // Anchored at the point of the teardrop, so the pin marks the station
          // rather than hovering above it.
          "icon-anchor": "bottom",
          "icon-size": ["interpolate", ["linear"], ["zoom"], 8, 0.45, 13, 0.7, 17, 1],
          // Stations cluster along a road; letting MapLibre drop the ones that
          // collide would hide exactly the choice a driver is making.
          "icon-allow-overlap": true,
        },
      });

      // How full the fullest tank is, as a dot on the pin's shoulder.
      //
      // Green / amber / red, and grey where no tank here has a reported size —
      // an unknown level and an empty one send a driver to opposite places, so
      // they must not look alike. Drawn as its own circle layer rather than
      // baked into the pin image: six brands times four levels would be
      // twenty-four images to redraw whenever either scale moves.
      m.addLayer({
        id: "station-level",
        type: "circle",
        source: SOURCE,
        minzoom: 10,
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 3.5, 17, 6],
          "circle-color": [
            "case",
            ["<", ["get", "stock"], 0], "#94a3b8",
            ["<", ["get", "stock"], 15], "#dc2626",
            ["<", ["get", "stock"], 40], "#f59e0b",
            "#16a34a",
          ],
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#ffffff",
          // Onto the pin's upper right. The pin is anchored at its point, so the
          // offset is measured up from the station itself.
          "circle-translate": ["interpolate", ["linear"], ["zoom"], 10, ["literal", [9, -30]], 17, ["literal", [13, -44]]],
          "circle-translate-anchor": "viewport",
        },
      });

      m.on("mouseenter", "station-pin", () => (m.getCanvas().style.cursor = "pointer"));
      m.on("mouseleave", "station-pin", () => (m.getCanvas().style.cursor = ""));
      m.on("click", "station-pin", (event) => {
        const feature = event.features?.[0];
        if (!feature) return;
        const id = String((feature.properties as Record<string, string>).id);
        const station = stationsByID.current.get(id);
        if (station) setSelected(station);
      });

      void refresh();
    });

    // On the settled viewport, not on every frame of a drag: the server allows
    // sixty calls a minute and a pan fires `move` far more often than that.
    m.on("moveend", () => void refresh());

    // Centre on the visitor only where we have tiles. A position abroad — a
    // traveller, or a browser guessing badly — would open onto the background
    // colour and read as a broken page.
    if (locate && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          if (isCovered(latitude, longitude)) m.jumpTo({ center: [longitude, latitude], zoom: 13 });
        },
        () => {
          /* refused or unavailable: Ulaanbaatar is a fine answer */
        },
        { enableHighAccuracy: true, timeout: 8000 },
      );
    }

    return () => {
      m.remove();
      map.current = null;
    };
  }, [refresh, t, locate, initialZoom]);

  return (
    // The height is an inline style rather than a utility class on purpose.
    // With `h-dvh` the wrapper measured zero high — every child here is
    // absolutely positioned, so nothing gives it intrinsic height, and MapLibre
    // left the canvas at the <canvas> element's own 300x150 default. An inline
    // value cannot be missing from a stylesheet, and `100vh` is behind it for
    // anything that does not know `dvh`.
    <div className="absolute inset-0">
      <div ref={container} className="absolute inset-0" style={{ height: "100%" }} />


      {/* A count, and nothing else.
          The rail that stood here carried the entitlement, the voucher list and
          the way in — a sidebar on a desktop and the entire screen on a phone,
          which is where a driver actually opens this. The header above the map
          already offers the way in, and the entitlement belongs where somebody
          is deciding to spend it: the station panel. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 p-3">
        <div className="pointer-events-auto mx-auto flex w-fit items-center gap-3 rounded-full bg-white/95 px-4 py-1.5 text-sm shadow-lg ring-1 ring-black/5 backdrop-blur">
          <span className="font-medium text-slate-900">
            {count === null ? "…" : `${count} ШТС`}
          </span>
        </div>
      </div>

      {error ? (
        <p className="pointer-events-auto absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </p>
      ) : null}

      {selected ? // key: without it React reuses the sheet's instance across stations, so the
        // grade, the voucher and the error survived a change of station. Tapping a
        // diesel-only forecourt and then a petrol-only one sent a diesel voucher
        // request for a station that does not sell it, and showed the first
        // station's QR under the second one's name (audit §20).
        <StationSheet key={selected.id} station={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}
