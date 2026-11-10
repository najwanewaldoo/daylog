import { NextResponse } from "next/server";
import {
  saveDailyCheckin,
  saveJournalEntry,
  saveDailyIntention,
} from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const today = new Date();

    const sampleDays = [
      {
        daysAgo: 6,
        checkin: {
          sleepHours: 7.5,
          sleepQuality: 4,
          energy: 4,
          mood: 4,
          focus: 4,
          workload: 3,
          studyMinutes: 180,
        },
        journal: {
          gratitude: "Quiet morning coffee and good discussion with study group.",
          wentWell: "Completed Algorithms problem set ahead of deadline.",
          challenge: "Felt slightly scattered during the afternoon lecture.",
          freeText: "Taking regular breaks kept my mental clarity sharp.",
        },
        intention: {
          learningPriority: "Finish Operating Systems Chapter 4 notes",
          recoveryAction: "30-minute evening walk without phone",
        },
      },
      {
        daysAgo: 5,
        checkin: {
          sleepHours: 5.5,
          sleepQuality: 2,
          energy: 2,
          mood: 3,
          focus: 2,
          workload: 5,
          studyMinutes: 240,
        },
        journal: {
          gratitude: "Helpful feedback from teaching assistant.",
          wentWell: "Stayed disciplined through long library session.",
          challenge: "Low sleep made difficult proofs much harder to grasp.",
          freeText: "Noticed a clear drop in concentration after only 5.5h of rest.",
        },
        intention: {
          learningPriority: "Revise Distributed Systems lab",
          recoveryAction: "Sleep before 11 PM tonight",
        },
      },
      {
        daysAgo: 4,
        checkin: {
          sleepHours: 8.0,
          sleepQuality: 5,
          energy: 4,
          mood: 4,
          focus: 5,
          workload: 3,
          studyMinutes: 210,
        },
        journal: {
          gratitude: "Waking up feeling fully rested after early bedtime.",
          wentWell: "Deep focus session on compiler architecture.",
          challenge: "Overcoming initial procrastination on the writing assignment.",
          freeText: "Solid 8 hours of sleep made complex logic problems much easier to solve.",
        },
        intention: {
          learningPriority: "Draft Database design paper outline",
          recoveryAction: "Stretching and reading fiction",
        },
      },
      {
        daysAgo: 3,
        checkin: {
          sleepHours: 7.0,
          sleepQuality: 3,
          energy: 3,
          mood: 4,
          focus: 4,
          workload: 4,
          studyMinutes: 195,
        },
        journal: {
          gratitude: "Sunlight during mid-day break.",
          wentWell: "Made meaningful progress on term project repository.",
          challenge: "Context-switching between three different courses.",
          freeText: "Splitting work into 45-minute blocks worked well today.",
        },
        intention: {
          learningPriority: "Practice 5 Dynamic Programming problems",
          recoveryAction: "Cook a nourishing dinner",
        },
      },
      {
        daysAgo: 2,
        checkin: {
          sleepHours: 6.0,
          sleepQuality: 3,
          energy: 2,
          mood: 3,
          focus: 3,
          workload: 4,
          studyMinutes: 150,
        },
        journal: {
          gratitude: "Peer review comments from project partner.",
          wentWell: "Resolved a tough concurrency bug in the lab code.",
          challenge: "Felt mentally sluggish in late afternoon.",
          freeText: "Need to guard my evening rest more strictly.",
        },
        intention: {
          learningPriority: "Prepare slide deck for seminar presentation",
          recoveryAction: "Listen to ambient music and journal",
        },
      },
      {
        daysAgo: 1,
        checkin: {
          sleepHours: 7.5,
          sleepQuality: 4,
          energy: 4,
          mood: 4,
          focus: 4,
          workload: 3,
          studyMinutes: 180,
        },
        journal: {
          gratitude: "Supportive message from family.",
          wentWell: "Rehearsed presentation twice with good timing.",
          challenge: "Initial nervousness before practice run.",
          freeText: "Steady pace throughout the day prevented last-minute stress.",
        },
        intention: {
          learningPriority: "Review key seminar questions and notes",
          recoveryAction: "Warm shower and tea before bed",
        },
      },
      {
        daysAgo: 0,
        checkin: {
          sleepHours: 7.5,
          sleepQuality: 4,
          energy: 4,
          mood: 5,
          focus: 4,
          workload: 2,
          studyMinutes: 120,
        },
        journal: {
          gratitude: "Successful presentation delivery today.",
          wentWell: "The seminar went smoothly; Q&A was engaging.",
          challenge: "Winding down after the adrenaline of speaking.",
          freeText: "Consistency over the past week really paid off today.",
        },
        intention: {
          learningPriority: "Plan next week's reading list",
          recoveryAction: "Evening off with friends",
        },
      },
    ];

    // Days are independent, so write them in parallel (fewer round trips to Turso).
    await Promise.all(
      sampleDays.map(async (item) => {
        const d = new Date(today);
        d.setDate(today.getDate() - item.daysAgo);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const dateStr = `${yyyy}-${mm}-${dd}`;

        // 1. Journal
        await saveJournalEntry({
          entryDate: dateStr,
          gratitude: item.journal.gratitude,
          wentWell: item.journal.wentWell,
          challenge: item.journal.challenge,
          freeText: item.journal.freeText,
        });

        // 2. Checkin
        await saveDailyCheckin({
          entryDate: dateStr,
          sleepHours: item.checkin.sleepHours,
          sleepQuality: item.checkin.sleepQuality,
          energy: item.checkin.energy,
          mood: item.checkin.mood,
          focus: item.checkin.focus,
          workload: item.checkin.workload,
          studyMinutes: item.checkin.studyMinutes,
        });

        // 3. Intention
        await saveDailyIntention({
          targetDate: dateStr,
          learningPriority: item.intention.learningPriority,
          recoveryAction: item.intention.recoveryAction,
        });
      })
    );

    return NextResponse.json({
      success: true,
      message: "Sample dataset (7 realistic days) created successfully.",
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "Failed to generate demo data." },
      { status: 500 }
    );
  }
}
