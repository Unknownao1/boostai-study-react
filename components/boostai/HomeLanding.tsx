"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./boostai.module.css";
import { routeCards } from "./site-data";
import { StudyWorkspace } from "./StudyWorkspace";

const EXAM_LEVELS = ["GCSE", "A-Level", "IB", "IGCSE", "university"];
const EXAM_BOARDS = ["AQA", "Edexcel", "OCR", "WJEC", "CCEA", "IB"];

export function HomeLanding() {
  const [levelIndex, setLevelIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setLevelIndex((i) => (i + 1) % EXAM_LEVELS.length);
    }, 2200);
    return () => clearInterval(id);
  }, []);
  return (
    <main className={styles.page}>
      <div className={styles.orbA} />
      <div className={styles.orbB} />
      <div className={styles.orbC} />

      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <Link className={styles.brand} href="/" prefetch={false}>
            <Image
              src="/boostai/images/logo.webp"
              alt="BoostAI logo"
              width={54}
              height={36}
              sizes="54px"
            />
            <span className={styles.brandName}>
              Boost<span>AI</span>
            </span>
          </Link>

          <nav className={styles.nav}>
            <a href="#routes">Choose route</a>
            <a href="#workspace">Workspace</a>
            <Link href="/school" prefetch={false}>School</Link>
            <Link href="/uni" prefetch={false}>Uni</Link>
            <Link href="/auth" prefetch={false}>Login</Link>
            <a href="#join" className={styles.navCta}>
              Why BoostAI
            </a>
          </nav>
        </div>
      </header>

      <section className={styles.shell}>
        <div className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>AI exam practice</span>
            <h1>
              Practise like it&apos;s the real{" "}
              <span className={styles.rotatingWord} key={levelIndex}>
                {EXAM_LEVELS[levelIndex]}
              </span>{" "}
              exam
            </h1>
            <p>
              Paste any question you&apos;ve already worked through and BoostAI
              generates fresh ones testing the exact same concept — with
              mark-scheme style working, not just an answer key.
            </p>
            <div className={styles.heroActions}>
              <Link className={styles.primaryButton} href="/auth" prefetch={false}>
                Start practising free
              </Link>
              <a className={styles.secondaryButton} href="#workspace">
                See how it works
              </a>
            </div>

            <div className={styles.boardStrip}>
              <span>Built for every UK exam board</span>
              <div className={styles.boardRow}>
                {EXAM_BOARDS.map((board) => (
                  <span key={board} className={styles.boardChip}>
                    {board}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.heroMediaWrap}>
            <div className={styles.rocketLaunch} aria-hidden="true">
              <Image
                className={styles.rocketMark}
                src="/logo.svg"
                alt=""
                width={120}
                height={120}
              />
              <div className={styles.rocketTrail} />
            </div>
            <Image
              className={styles.heroMedia}
              src="/boostai/images/hero-demo-image.webp"
              alt="BoostAI question workspace preview"
              width={720}
              height={590}
              priority
              sizes="(max-width: 1080px) 100vw, 46vw"
            />
          </div>
        </div>

        <section className={styles.routeSection} id="routes">
          <div className={styles.sectionHeading}>
            <span className={styles.eyebrow}>Choose your path</span>
            <h2>One product, tuned for where you&apos;re studying</h2>
            <p>
              School and university work look different on the page, but the
              engine underneath — generate similar, practise, check your
              working — stays the same.
            </p>
          </div>

          <div className={styles.routeGrid}>
            {routeCards.map((card) => (
              <Link
                key={card.href}
                className={`${styles.routeCard} ${
                  card.accent === "school" ? styles.routeCardSchool : styles.routeCardUni
                }`}
                href={card.href}
                prefetch={false}
              >
                <div className={styles.routeCardTop} />
                <div className={styles.routeCardBody}>
                  <span className={styles.routeLabel}>{card.label}</span>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>

                  <div className={styles.tagRow}>
                    {card.tags.map((tag) => (
                      <span key={tag} className={styles.tag}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className={styles.routePreview}>
                    <Image
                      src={card.image}
                      alt={`${card.label} preview`}
                      width={655}
                      height={381}
                      sizes="(max-width: 1080px) 100vw, 31vw"
                    />
                  </div>

                  <span className={styles.routeCta}>{card.cta}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <StudyWorkspace />

        <section className={styles.summaryGrid} id="join">
          <article className={styles.summaryCard}>
            <h3>Unlimited similar questions</h3>
            <p>
              Stuck isn&apos;t the end — get another question testing the same
              concept, and another, until it actually clicks.
            </p>
          </article>
          <article className={styles.summaryCard}>
            <h3>Mark-scheme style working</h3>
            <p>
              Every generated question comes with terse, numbered steps —
              the way examiners actually award marks, not a wall of prose.
            </p>
          </article>
          <article className={styles.summaryCard}>
            <h3>Matched to your exam board</h3>
            <p>
              Tell BoostAI your subject and level once. Every question after
              that is pitched at the right difficulty for your syllabus.
            </p>
          </article>
        </section>
      </section>
    </main>
  );
}
