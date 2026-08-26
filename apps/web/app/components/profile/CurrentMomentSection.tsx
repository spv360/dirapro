"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { CurrentMoment } from "../../data/profile";

type CurrentMomentSectionProps = {
  moment: CurrentMoment;
};

export default function CurrentMomentSection({ moment }: CurrentMomentSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(() =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const activeMoment = moment.moments[activeIndex];

  useEffect(() => {
    if (isPaused || moment.moments.length < 2) return;

    const advance = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % moment.moments.length);
    }, 5500);

    return () => window.clearInterval(advance);
  }, [isPaused, moment.moments.length]);

  useEffect(() => {
    const handleVisibilityChange = () => setIsPaused(document.hidden);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  return (
    <section
      className="profile-current-moment"
      id="current-moment"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false);
      }}
    >
      <div className="profile-current-moment__intro">
        <p className="section-eyebrow">CURRENT MOMENT</p>
        <p className="profile-current-moment__updated">Updated {moment.updated}</p>
      </div>

      <div
        className="profile-current-moment__media"
        aria-label={activeMoment.imageAlt}
      >
        <Image
          key={activeMoment.image}
          src={activeMoment.image}
          alt={activeMoment.imageAlt}
          fill
          sizes="(max-width: 900px) 100vw, 50vw"
          priority={activeIndex === 0}
          className="profile-current-moment__image"
        />
      </div>

      <div className="profile-current-moment__content">
        <p className="profile-current-moment__kicker">{activeMoment.type}</p>
        <h2>{activeMoment.title}</h2>
        <div className="profile-current-moment__meta">
          {activeMoment.organization ? <span>{activeMoment.organization}</span> : null}
          <span>{activeMoment.date}</span>
        </div>
        <p className="profile-current-moment__summary">{activeMoment.summary}</p>

        <div className="profile-current-moment__focus">
          {activeMoment.focus?.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>

        <div
          className="profile-current-moment__navigation"
          aria-label="Select a professional moment"
        >
          {moment.moments.map((item, index) => (
            <button
              key={item.title}
              type="button"
              className={`profile-current-moment__indicator ${index === activeIndex ? "profile-current-moment__indicator--active" : ""}`}
              aria-label={`Show ${item.title}`}
              aria-pressed={index === activeIndex}
              onClick={() => {
                setActiveIndex(index);
                setIsPaused(true);
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
