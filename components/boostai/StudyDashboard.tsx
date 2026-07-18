"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./dashboard.module.css";
import { AskBoostAI } from "./AskBoostAI";
import { QuestionBank } from "./QuestionBank";
import { EssayMarker } from "./EssayMarker";
import { FREE_TIER_QUESTION_LIMIT } from "@/lib/limits";

interface UserInfo {
  id: string;
  email: string;
}

interface StudyDashboardProps {
  user: UserInfo;
  subscriptionTier?: string;
  questionsUsed?: number;
}

type NavItem = {
  label: string;
  icon: string;
  active?: boolean;
  meta?: string;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    title: "Workspace",
    items: [
      { label: "Home", icon: "⌂", active: true },
      { label: "Revision Planner", icon: "↺", meta: "New" },
      { label: "Ask BoostAI", icon: "✦", meta: "Beta" }
    ]
  },
  {
    title: "Resources",
    items: [
      { label: "Question Bank", icon: "◫" },
      { label: "Lessons", icon: "▶" },
      { label: "Revision Guides", icon: "▣" },
      { label: "Flashcards", icon: "☰" },
      { label: "Past Papers", icon: "≡" }
    ]
  },
  {
    title: "Tools",
    items: [
      { label: "Mock Exam Builder", icon: "✎" },
      { label: "Essay Marker", icon: "⌁" },
      { label: "Predicted Grade", icon: "◎" },
      { label: "Settings", icon: "⚙" }
    ]
  }
];

const questItems = [
  "Try the Question Bank",
  "Open the revision guides",
  "Complete a lesson",
  "Build a mock exam",
  "Make a revision plan",
  "Ask BoostAI a question",
  "Mark an essay"
];

const paperCards = [
  {
    title: "GCSE Maths · November 2024\nPaper 1 · Non-Calculator · Foundation"
  },
  {
    title: "GCSE Maths · November 2024\nPaper 1 · Non-Calculator · Higher"
  }
];

function nameFromEmail(email: string) {
  const local = email.split("@")[0] || "anon";
  return local
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function timeGreeting() {
  const hour = new Date().getHours();

  if (hour < 5) return "Good late night";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function StudyDashboard({
  user,
  subscriptionTier = "free",
  questionsUsed = 0,
}: StudyDashboardProps) {
  const name = nameFromEmail(user.email);
  const [activeView, setActiveView] = useState("Home");
  const isPro = subscriptionTier !== "free";

  return (
    <main className={styles.page}>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <Link className={styles.brand} href="/">
            <Image
              className={styles.brandMark}
              src="/logo.webp"
              alt="BoostAI logo"
              width={44}
              height={44}
              priority
            />
            <span className={styles.brandWord}>
              Boost<span>AI</span>
            </span>
          </Link>

          {navSections.map((section) => (
            <div className={styles.navGroup} key={section.title}>
              <span className={styles.groupTitle}>{section.title}</span>
              {section.items.map((item) => (
                <button
                  type="button"
                  className={
                    item.label === activeView ? styles.navItemActive : styles.navItem
                  }
                  key={item.label}
                  onClick={() => setActiveView(item.label)}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span>{item.label}</span>
                  {item.meta ? <span className={styles.navMeta}>{item.meta}</span> : null}
                </button>
              ))}
            </div>
          ))}

          <div className={styles.supportCard}>
            <strong>{user.email}</strong>
            <p>Signed in to BoostAI Study.</p>
            <form action="/api/auth/signout" method="POST">
              <button type="submit" className={styles.signOutButton}>Sign out</button>
            </form>
          </div>
        </aside>

        <section className={styles.content}>
          <div className={styles.mobileTop}>
            <Link className={styles.brand} href="/">
              <Image
                className={styles.brandMark}
                src="/logo.webp"
                alt="BoostAI logo"
                width={40}
                height={40}
              />
              <span className={styles.brandWord}>
                Boost<span>AI</span>
              </span>
            </Link>
            <span className={styles.avatar}>{name.charAt(0).toUpperCase()}</span>
          </div>

          <div className={styles.topbar}>
            <div className={styles.searchRow}>
              <div className={styles.search}>Search topics, papers, or prompts…</div>
              <div className={styles.coursePicker}>
                <span>Find your course…</span>
                <span>⌄</span>
              </div>
            </div>

            <div className={styles.topActions}>
              <div className={styles.energyPill}>
                <span>{isPro ? "⚡ Pro" : "⚡ Free"}</span>
                <span className={styles.energyStatus}>
                  {isPro
                    ? "Unlimited generation"
                    : `${questionsUsed} / ${FREE_TIER_QUESTION_LIMIT} questions used`}
                </span>
              </div>
              <div className={styles.avatar}>{name.charAt(0).toUpperCase()}</div>
            </div>
          </div>

          {activeView === "Ask BoostAI" ? (
            <div className={styles.mainColumn}>
              <AskBoostAI />
            </div>
          ) : activeView === "Question Bank" ? (
            <div className={styles.mainColumn}>
              <QuestionBank />
            </div>
          ) : activeView === "Essay Marker" ? (
            <div className={styles.mainColumn}>
              <EssayMarker />
            </div>
          ) : (
          <div className={styles.grid}>
            <div className={styles.mainColumn}>
              <section className={styles.heroPanel}>
                <span className={styles.eyebrow}>BoostAI Workspace</span>
                <h1>
                  {timeGreeting()}, <span>{name}</span>
                </h1>
                <p>
                  Paste a question you&apos;re stuck on and BoostAI will generate
                  more like it, or browse everything you&apos;ve already
                  generated in your question bank.
                </p>
                <div className={styles.heroActions}>
                  <button
                    type="button"
                    className={styles.primaryCta}
                    onClick={() => setActiveView("Ask BoostAI")}
                  >
                    Ask BoostAI a question →
                  </button>
                  <Link className={styles.secondaryCta} href="/">
                    Back to landing page
                  </Link>
                </div>
              </section>

              <section className={styles.progressPanel}>
                <div className={styles.progressHeader}>
                  <div>
                    <h3>Momentum for this week</h3>
                    <p>
                      We’re keeping the dashboard lightweight for now, but the structure
                      is ready for real user progress later.
                    </p>
                  </div>
                  <div className={styles.progressBadge}>78%</div>
                </div>

                <div className={styles.progressGrid}>
                  <div className={styles.metric}>
                    <strong>12</strong>
                    <span>Questions solved</span>
                  </div>
                  <div className={styles.metric}>
                    <strong>4</strong>
                    <span>Topics revisited</span>
                  </div>
                  <div className={styles.metric}>
                    <strong>2h 18m</strong>
                    <span>Focused study time</span>
                  </div>
                </div>
              </section>

              <section>
                <div className={styles.sectionHeader}>
                  <div>
                    <h2>My subjects</h2>
                    <div className={styles.subtle}>Jump back into your last subject.</div>
                  </div>
                  <a className={styles.addButton} href="#">
                    + Add subjects
                  </a>
                </div>

                <article className={styles.subjectCard}>
                  <div className={styles.subjectInner}>
                    <div className={styles.subjectCopy}>
                      <span>GCSE · Edexcel</span>
                      <h3>Maths</h3>
                      <p>
                        Step-by-step walkthroughs, similar-question generation, and
                        ready-to-open exam paper sets in the same BoostAI palette.
                      </p>
                      <a className={styles.subjectButton} href="#">
                        Open →
                      </a>
                    </div>

                    <div className={styles.subjectArt}>
                      <div className={styles.shapeOne} />
                      <div className={styles.shapeTwo} />
                      <div className={styles.shapeThree} />
                    </div>
                  </div>
                </article>
              </section>

              <section>
                <div className={styles.sectionHeader}>
                  <div>
                    <h2>Suggested past papers</h2>
                    <div className={styles.subtle}>Two starting points to make the workflow feel real.</div>
                  </div>
                </div>

                <div className={styles.paperGrid}>
                  {paperCards.map((card) => (
                    <article className={styles.paperCard} key={card.title}>
                      <div className={styles.paperTop}>
                        <h3>
                          {card.title.split("\n").map((line) => (
                            <span key={line}>
                              {line}
                              <br />
                            </span>
                          ))}
                        </h3>
                        <div className={styles.paperLinks}>
                          <span>
                            <span>Questions</span>
                            <span>›</span>
                          </span>
                          <span>
                            <span>Mark scheme</span>
                            <span>›</span>
                          </span>
                          <span>
                            <span>Solutions</span>
                            <span>›</span>
                          </span>
                        </div>
                      </div>
                      <div className={styles.paperFooter}>
                        <span>No attempts yet</span>
                        <a className={styles.logAttempt} href="#">
                          Log attempt
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>

            <aside className={styles.questPanel}>
              <h2>Quests</h2>
              <p>Use these starter actions to walk someone through the product after login.</p>
              <div className={styles.questList}>
                {questItems.map((item) => (
                  <div className={styles.questItem} key={item}>
                    <span className={styles.questCheck} />
                    <span>{item}</span>
                    <span className={styles.questReward}>+ ∞ ⚡</span>
                  </div>
                ))}
              </div>
            </aside>
          </div>
          )}
        </section>
      </div>
    </main>
  );
}
