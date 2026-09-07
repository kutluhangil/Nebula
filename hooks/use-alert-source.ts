"use client";

import { useEffect } from "react";
import { useWatchlist } from "@/hooks/use-watchlist";
import { useNotifications } from "@/hooks/use-notifications";

export interface AlertCandidate {
  /** Stable across polls, and unique across every source. Also used as the OS notification tag. */
  id: string;
  title: string;
  body?: string;
}

export interface AlertSourceResult {
  /** What would alert right now, most important first. */
  candidates: AlertCandidate[];
  /** What enabling alerts should mark as already seen. */
  primeIds: string[];
}

interface AlertSourceOptions {
  enabled: boolean;
  /**
   * Everything that currently qualifies for an alert, most important first.
   * Already-seen entries are filtered out here, so a source computes this the
   * same way whether alerts are on or off — which is what lets the engine use
   * it to prime the seen set at enable time.
   */
  candidates: AlertCandidate[];
  /** Past this many new candidates in one pass, {@link summarize} stands in for the rest. */
  maxIndividual?: number;
  summarize?: (remaining: number) => AlertCandidate;
}

const DEFAULT_MAX_INDIVIDUAL = 3;

/**
 * The dedupe-cap-send core shared by every alert source.
 *
 * Sources differ only in what qualifies and how it reads; the parts that must
 * not drift — never alerting twice for the same event, never opening a dozen
 * windows at once, marking the summarised remainder as seen too — live here so
 * a new source cannot get them subtly wrong.
 *
 * `candidates` must be referentially stable between renders (memoise it), or
 * the effect re-runs on every render.
 */
export function useAlertSource({
  enabled,
  candidates,
  maxIndividual = DEFAULT_MAX_INDIVIDUAL,
  summarize,
}: AlertSourceOptions) {
  const { knownEventIds, rememberEvents } = useWatchlist();
  const { sendNotification } = useNotifications();

  useEffect(() => {
    if (!enabled || !candidates.length) return;

    const known = new Set(knownEventIds);
    const fresh = candidates.filter((candidate) => !known.has(candidate.id));
    if (!fresh.length) return;

    for (const candidate of fresh.slice(0, maxIndividual)) {
      sendNotification(candidate.title, {
        body: candidate.body,
        // The tag collapses repeats of the same event at the OS level, a second
        // line of defence behind the persisted id set.
        tag: candidate.id,
      });
    }

    const remaining = fresh.length - maxIndividual;
    if (remaining > 0 && summarize) {
      const summary = summarize(remaining);
      sendNotification(summary.title, { body: summary.body, tag: summary.id });
    }

    // Mark every match seen, including the ones folded into the summary, so
    // they are not reported again on the next poll.
    rememberEvents(fresh.map((candidate) => candidate.id));
  }, [
    candidates,
    enabled,
    knownEventIds,
    maxIndividual,
    rememberEvents,
    sendNotification,
    summarize,
  ]);
}
