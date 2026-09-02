"use client";

import {Check, Fuel, Ship, TestTube2, Truck, Warehouse} from "lucide-react";

import {useI18n} from "@/lib/i18n";

/**
 * Гинжин хэлхээний зурвас: импортоос түгээлт хүртэлх зургаан зогсоол.
 *
 * `ui.tsx`-ээс тусдаа файл болсон нь загварын шийдвэр биш, хилийн шийдвэр:
 * энэ нь толь уншдаг тул клиент компонент байх ёстой, харин `ui.tsx`-ийн
 * бусад хэсэг нь сервер хуудсуудаас lucide-ийн дүрсийг prop-оор хүлээж авдаг —
 * функцийг сервер талаас клиент рүү дамжуулах боломжгүй.
 */
const FLOW_STEPS = [
  [Ship, "website.rail.import", "website.rail.import_note"],
  [TestTube2, "website.rail.border", "website.rail.border_note"],
  [Warehouse, "website.rail.terminal", "website.rail.terminal_note"],
  [Truck, "website.rail.transport", "website.rail.transport_note"],
  [Fuel, "website.rail.station", "website.rail.station_note"],
  [Check, "website.rail.dispensed", "website.rail.dispensed_note"],
] as const;

export function FlowRail({compact = false}: {compact?: boolean}) {
  const {t} = useI18n();

  return (
    <div className={`pn-flow-rail${compact ? " is-compact" : ""}`}>
      {FLOW_STEPS.map(([Icon, title, body], index) => (
        <div className="pn-flow-step" key={title}>
          <span className="pn-flow-step__icon"><Icon /></span>
          <span><b>{t(title)}</b><small>{t(body)}</small></span>
          {index < FLOW_STEPS.length - 1 ? <i className="pn-flow-step__line"><em /></i> : null}
        </div>
      ))}
    </div>
  );
}
