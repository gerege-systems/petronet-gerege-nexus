import type {ReactNode} from "react";
import Link from "next/link";
import {ArrowRight, Check, Fuel, Ship, TestTube2, Truck, Warehouse} from "lucide-react";

export function SectionHeading({label, title, body, inverse = false}: {label: string; title: string; body?: string; inverse?: boolean}) {
  return (
    <div className={`pn-section-heading${inverse ? " is-inverse" : ""}`}>
      <span>{label}</span>
      <h2>{title}</h2>
      {body ? <p>{body}</p> : null}
    </div>
  );
}

export function FlowRail({compact = false}: {compact?: boolean}) {
  const steps = [
    [Ship, "Импорт", "Гэрээ · Ачилт"],
    [TestTube2, "Хил", "Гааль · Чанар"],
    [Warehouse, "Терминал", "Сав · Нөөц"],
    [Truck, "Тээвэр", "GPS · Цахим лац"],
    [Fuel, "ШТС", "Сав · Хошуу"],
    [Check, "Түгээлт", "Баримт · Тулгалт"],
  ] as const;

  return (
    <div className={`pn-flow-rail${compact ? " is-compact" : ""}`}>
      {steps.map(([Icon, title, body], index) => (
        <div className="pn-flow-step" key={title}>
          <span className="pn-flow-step__icon"><Icon /></span>
          <span><b>{title}</b><small>{body}</small></span>
          {index < steps.length - 1 ? <i className="pn-flow-step__line"><em /></i> : null}
        </div>
      ))}
    </div>
  );
}

export function PageHero({eyebrow, title, accent, body, children}: {eyebrow: string; title: string; accent: string; body: string; children?: ReactNode}) {
  return (
    <section className="pn-page-hero">
      <div className="pn-page-hero__grid" />
      <div className="pn-container pn-page-hero__inner">
        <div>
          <div className="pn-kicker"><span /> {eyebrow}</div>
          <h1>{title} <em>{accent}</em></h1>
          <p>{body}</p>
        </div>
        {children ? <div className="pn-page-hero__visual">{children}</div> : null}
      </div>
    </section>
  );
}

export function FeatureGrid({items}: {items: {icon: typeof Fuel; title: string; body: string; tag?: string}[]}) {
  return (
    <div className="pn-feature-grid">
      {items.map(({icon: Icon, title, body, tag}) => (
        <article className="pn-feature-card" key={title}>
          <div className="pn-feature-card__icon"><Icon /></div>
          {tag ? <span>{tag}</span> : null}
          <h3>{title}</h3>
          <p>{body}</p>
        </article>
      ))}
    </div>
  );
}

export function PageCTA({title, body, href = "/rollout", action = "Нэвтрүүлэх төлөвлөгөө"}: {title: string; body: string; href?: string; action?: string}) {
  return (
    <section className="pn-page-cta">
      <div className="pn-container">
        <div><h2>{title}</h2><p>{body}</p></div>
        <Link href={href} className="pn-button pn-button--light">{action} <ArrowRight /></Link>
      </div>
    </section>
  );
}

export function CheckList({items}: {items: string[]}) {
  return <ul className="pn-check-list">{items.map((item) => <li key={item}><Check />{item}</li>)}</ul>;
}
