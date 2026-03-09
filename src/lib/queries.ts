import { getSupabase } from "./supabase";

const sb = () => getSupabase();

export async function getKPIRollup(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data } = await sb()
    .from("kpi_daily_rollup")
    .select("*")
    .gte("date", since.toISOString().split("T")[0])
    .order("date", { ascending: true });
  return data ?? [];
}

export async function getOverviewStats() {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const dayStart = `${todayStr}T00:00:00Z`;

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalUsers,
    onboardedUsers,
    newToday,
    sessionsToday,
    completedToday,
    crisisToday,
    dauWeek,
    mauMonth,
  ] = await Promise.all([
    sb().from("users").select("id", { count: "exact", head: true }),
    sb().from("users").select("id", { count: "exact", head: true }).not("onboarding_completed_at", "is", null),
    sb().from("users").select("id", { count: "exact", head: true }).gte("created_at", dayStart),
    sb().from("sessions").select("id", { count: "exact", head: true }).gte("started_at", dayStart),
    sb().from("sessions").select("id", { count: "exact", head: true }).gte("started_at", dayStart).not("ended_at", "is", null),
    sb().from("sessions").select("id", { count: "exact", head: true }).gte("started_at", dayStart).eq("crisis_flag", true),
    sb().from("sessions").select("user_id").gte("started_at", sevenDaysAgo.toISOString()),
    sb().from("sessions").select("user_id").gte("started_at", thirtyDaysAgo.toISOString()),
  ]);

  const wau = new Set((dauWeek.data ?? []).map((r: any) => r.user_id)).size;
  const mau = new Set((mauMonth.data ?? []).map((r: any) => r.user_id)).size;

  const sessionsStarted = sessionsToday.count ?? 0;
  const sessionsCompleted = completedToday.count ?? 0;
  const completionRate = sessionsStarted > 0 ? Math.round((sessionsCompleted / sessionsStarted) * 100) : 0;

  // MSW: users with 2+ meaningful sessions in trailing 7 days
  const { data: weekSessions } = await sb()
    .from("sessions")
    .select("id, user_id")
    .gte("started_at", sevenDaysAgo.toISOString())
    .not("ended_at", "is", null);

  let mswCount = 0;
  if (weekSessions && weekSessions.length > 0) {
    const sessionIds = weekSessions.map((s: any) => s.id);

    const { data: echoSessions } = await sb()
      .from("session_echoes")
      .select("session_id")
      .in("session_id", sessionIds);

    const { data: goalSessions } = await sb()
      .from("goals")
      .select("session_id")
      .in("session_id", sessionIds);

    const sessionsWithExtraction = new Set<string>();
    (echoSessions ?? []).forEach((e: any) => sessionsWithExtraction.add(e.session_id));
    (goalSessions ?? []).forEach((g: any) => {
      if (g.session_id) sessionsWithExtraction.add(g.session_id);
    });

    const userMeaningful: Record<string, number> = {};
    for (const s of weekSessions as any[]) {
      if (sessionsWithExtraction.has(s.id)) {
        userMeaningful[s.user_id] = (userMeaningful[s.user_id] || 0) + 1;
      }
    }
    mswCount = Object.values(userMeaningful).filter((c) => c >= 2).length;
  }

  return {
    totalUsers: totalUsers.count ?? 0,
    onboardedUsers: onboardedUsers.count ?? 0,
    newToday: newToday.count ?? 0,
    sessionsToday: sessionsStarted,
    completedToday: sessionsCompleted,
    completionRate,
    crisisToday: crisisToday.count ?? 0,
    wau,
    mau,
    mswCount,
  };
}

export async function getNorthStarMetrics() {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const since = sevenDaysAgo.toISOString();

  const { data: completedSessions } = await sb()
    .from("sessions")
    .select("id, user_id")
    .gte("started_at", since)
    .not("ended_at", "is", null);

  const sessions = completedSessions ?? [];
  
  if (sessions.length === 0) {
    return {
      msw: 0,
      meaningfulSessionsThisWeek: 0,
      totalCompletedThisWeek: 0,
      sessionCompletionRate: 0,
      extractionRate: 0,
      commitFollowthrough: 0,
      onboardingRate: 0,
      avgMemoryDepth: 0,
    };
  }

  const sessionIds = sessions.map((s: any) => s.id);

  const [echoesRes, goalsRes, allSessionsRes, commitDoneRes, commitTotalRes, totalUsersRes, onboardedRes, memoryRes] = await Promise.all([
    sb().from("session_echoes").select("session_id").in("session_id", sessionIds),
    sb().from("goals").select("session_id").in("session_id", sessionIds).not("session_id", "is", null),
    sb().from("sessions").select("id", { count: "exact", head: true }).gte("started_at", since),
    sb().from("session_echoes").select("id", { count: "exact", head: true }).eq("outcome", "done").gte("check_in_at", since),
    sb().from("session_echoes").select("id", { count: "exact", head: true }).not("outcome", "is", null).gte("check_in_at", since),
    sb().from("users").select("id", { count: "exact", head: true }),
    sb().from("users").select("id", { count: "exact", head: true }).not("onboarding_completed_at", "is", null),
    sb().from("user_memory_doc").select("version"),
  ]);

  const sessionsWithExtraction = new Set<string>();
  (echoesRes.data ?? []).forEach((e: any) => sessionsWithExtraction.add(e.session_id));
  (goalsRes.data ?? []).forEach((g: any) => { if (g.session_id) sessionsWithExtraction.add(g.session_id); });

  const meaningfulSessions = sessions.filter((s: any) => sessionsWithExtraction.has(s.id));

  const userMeaningfulCounts: Record<string, number> = {};
  meaningfulSessions.forEach((s: any) => {
    userMeaningfulCounts[s.user_id] = (userMeaningfulCounts[s.user_id] || 0) + 1;
  });
  const msw = Object.values(userMeaningfulCounts).filter(c => c >= 2).length;

  const totalStarted = allSessionsRes.count ?? 0;
  const totalCompleted = sessions.length;
  const done = commitDoneRes.count ?? 0;
  const checkedTotal = commitTotalRes.count ?? 0;

  const memoryVersions = (memoryRes.data ?? []) as { version: number }[];
  const avgMemory = memoryVersions.length > 0 
    ? +(memoryVersions.reduce((s, m) => s + m.version, 0) / memoryVersions.length).toFixed(1) 
    : 0;

  return {
    msw,
    meaningfulSessionsThisWeek: meaningfulSessions.length,
    totalCompletedThisWeek: totalCompleted,
    sessionCompletionRate: totalStarted > 0 ? +((totalCompleted / totalStarted) * 100).toFixed(1) : 0,
    extractionRate: totalCompleted > 0 ? +((meaningfulSessions.length / totalCompleted) * 100).toFixed(1) : 0,
    commitFollowthrough: checkedTotal > 0 ? +((done / checkedTotal) * 100).toFixed(1) : 0,
    onboardingRate: (totalUsersRes.count ?? 0) > 0 ? +(((onboardedRes.count ?? 0) / (totalUsersRes.count ?? 1)) * 100).toFixed(1) : 0,
    avgMemoryDepth: avgMemory,
  };
}

export async function getUsersList(page = 0, pageSize = 50) {
  const { data, count } = await sb()
    .from("users")
    .select("id, email, display_name, created_at, onboarding_completed_at, current_streak, longest_streak, companion_name, push_token", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);
  return { users: data ?? [], total: count ?? 0 };
}

export async function getUserDetail(userId: string) {
  const [
    userRes, sessionsRes, moodsRes, goalsRes, habitsRes, echoesRes,
    patternsRes, memoryRes, relationshipsRes, domainsRes, checkinsRes,
    remindersRes, referralCodeRes, referralsGivenRes, referralsReceivedRes,
    voiceNotesRes,
  ] = await Promise.all([
    sb().from("users").select("*").eq("id", userId).single(),
    sb().from("sessions").select("id, session_number, session_type, started_at, ended_at, summary, key_themes, crisis_flag").eq("user_id", userId).order("started_at", { ascending: false }).limit(100),
    sb().from("mood_entries").select("mood_score, notes, logged_at").eq("user_id", userId).order("logged_at", { ascending: false }).limit(60),
    sb().from("goals").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    sb().from("habits").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    sb().from("session_echoes").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
    sb().from("patterns").select("*").eq("user_id", userId).order("detected_at", { ascending: false }),
    sb().from("user_memory_doc").select("content, version, updated_at").eq("user_id", userId).single(),
    sb().from("relationships").select("*").eq("user_id", userId).order("mentioned_count", { ascending: false }),
    sb().from("life_domains").select("*").eq("user_id", userId).order("assessed_at", { ascending: false }).limit(50),
    sb().from("daily_checkins").select("*").eq("user_id", userId).order("checkin_date", { ascending: false }).limit(30),
    sb().from("reminders").select("*").eq("user_id", userId).order("scheduled_for", { ascending: false }).limit(20),
    sb().from("referral_codes").select("code, created_at").eq("user_id", userId).single(),
    sb().from("referrals").select("*").eq("referrer_id", userId).order("created_at", { ascending: false }),
    sb().from("referrals").select("*").eq("referred_id", userId).single(),
    sb().from("voice_notes").select("id, transcript, themes, duration_seconds, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
  ]);

  const sessions = sessionsRes.data ?? [];
  const completedSessions = sessions.filter((s: any) => s.ended_at);
  const sessionIds = completedSessions.map((s: any) => s.id);

  let meaningfulCount = 0;
  if (sessionIds.length > 0) {
    const { data: echoBySess } = await sb().from("session_echoes").select("session_id").in("session_id", sessionIds);
    const { data: goalBySess } = await sb().from("goals").select("session_id").in("session_id", sessionIds);
    const meaningfulIds = new Set<string>();
    (echoBySess ?? []).forEach((e: any) => meaningfulIds.add(e.session_id));
    (goalBySess ?? []).forEach((g: any) => { if (g.session_id) meaningfulIds.add(g.session_id); });
    meaningfulCount = meaningfulIds.size;
  }

  const echoes = echoesRes.data ?? [];
  const commitmentsDone = echoes.filter((e: any) => e.outcome === "done").length;
  const commitmentsNotDone = echoes.filter((e: any) => e.outcome === "not_done").length;
  const commitmentsPending = echoes.filter((e: any) => !e.outcome && e.committed_for).length;

  return {
    user: userRes.data,
    sessions,
    moods: moodsRes.data ?? [],
    goals: goalsRes.data ?? [],
    habits: habitsRes.data ?? [],
    echoes,
    patterns: patternsRes.data ?? [],
    memory: memoryRes.data,
    relationships: relationshipsRes.data ?? [],
    lifeDomains: domainsRes.data ?? [],
    dailyCheckins: checkinsRes.data ?? [],
    reminders: remindersRes.data ?? [],
    referralCode: referralCodeRes.data,
    referralsGiven: referralsGivenRes.data ?? [],
    referralReceived: referralsReceivedRes.data,
    voiceNotes: voiceNotesRes.data ?? [],
    stats: {
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      meaningfulSessions: meaningfulCount,
      completionRate: sessions.length > 0 ? +(completedSessions.length / sessions.length * 100).toFixed(0) : 0,
      extractionRate: completedSessions.length > 0 ? +(meaningfulCount / completedSessions.length * 100).toFixed(0) : 0,
      commitmentsDone,
      commitmentsNotDone,
      commitmentsPending,
      followThroughRate: (commitmentsDone + commitmentsNotDone) > 0
        ? +(commitmentsDone / (commitmentsDone + commitmentsNotDone) * 100).toFixed(0) : 0,
    },
  };
}

export async function getSessionMessages(sessionId: string) {
  const { data } = await sb()
    .from("messages")
    .select("role, content, created_at, crisis_score")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function getEngagementStats() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const since = thirtyDaysAgo.toISOString();

  const [sessions, habits, commitments, checkins, moods, voiceNotes] = await Promise.all([
    sb().from("sessions").select("id, session_type, started_at, ended_at, user_id").gte("started_at", since),
    sb().from("habits").select("id, title, current_streak, total_completions, frequency, status").eq("status", "active"),
    sb().from("session_echoes").select("id, outcome, committed_for").not("committed_for", "is", null).gte("created_at", since),
    sb().from("daily_checkins").select("id, checkin_date, morning_intention, day_rating").gte("checkin_date", thirtyDaysAgo.toISOString().split("T")[0]),
    sb().from("mood_entries").select("id").gte("logged_at", since),
    sb().from("voice_notes").select("id").gte("created_at", since),
  ]);

  const sessionData = sessions.data ?? [];
  const chatCount = sessionData.filter((s: any) => s.session_type === "chat").length;
  const voiceCount = sessionData.filter((s: any) => s.session_type === "voice").length;
  const completed = sessionData.filter((s: any) => s.ended_at).length;
  const durations = sessionData
    .filter((s: any) => s.ended_at)
    .map((s: any) => (new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 1000);
  const avgDuration = durations.length > 0 ? durations.reduce((a: number, b: number) => a + b, 0) / durations.length : 0;

  const commitData = commitments.data ?? [];
  const done = commitData.filter((c: any) => c.outcome === "done").length;
  const notDone = commitData.filter((c: any) => c.outcome === "not_done").length;
  const partial = commitData.filter((c: any) => c.outcome === "partially").length;
  const rescheduled = commitData.filter((c: any) => c.outcome === "rescheduled").length;
  const pending = commitData.filter((c: any) => !c.outcome).length;

  return {
    totalSessions: sessionData.length,
    chatSessions: chatCount,
    voiceSessions: voiceCount,
    completedSessions: completed,
    completionRate: sessionData.length > 0 ? Math.round((completed / sessionData.length) * 100) : 0,
    avgDurationSec: Math.round(avgDuration),
    habitsActive: (habits.data ?? []).length,
    topHabits: (habits.data ?? []).sort((a: any, b: any) => b.total_completions - a.total_completions).slice(0, 5),
    commitments: { done, notDone, partial, rescheduled, pending, total: commitData.length },
    dailyCheckins: (checkins.data ?? []).length,
    moodEntries: (moods.data ?? []).length,
    voiceNotes: (voiceNotes.data ?? []).length,
  };
}

export async function getAIQualityStats() {
  const { data: auditData } = await sb()
    .from("audit_log")
    .select("details, created_at")
    .eq("action", "session_processed")
    .order("created_at", { ascending: false })
    .limit(100);

  const entries = (auditData ?? []) as { details: any; created_at: string }[];
  const totalProcessed = entries.length;
  const totalEchoes = entries.reduce((s, e) => s + (e.details?.echoes_extracted ?? 0), 0);
  const totalCommitments = entries.reduce((s, e) => s + (e.details?.commitments_extracted ?? 0), 0);
  const totalHabits = entries.reduce((s, e) => s + (e.details?.habits_extracted ?? 0), 0);
  const totalGoals = entries.reduce((s, e) => s + (e.details?.goals_extracted ?? 0), 0);
  const totalReminders = entries.reduce((s, e) => s + (e.details?.reminders_extracted ?? 0), 0);
  const totalRelationships = entries.reduce((s, e) => s + (e.details?.relationships_extracted ?? 0), 0);

  return {
    totalProcessed,
    avgEchoesPerSession: totalProcessed > 0 ? +(totalEchoes / totalProcessed).toFixed(1) : 0,
    avgCommitmentsPerSession: totalProcessed > 0 ? +(totalCommitments / totalProcessed).toFixed(1) : 0,
    avgHabitsPerSession: totalProcessed > 0 ? +(totalHabits / totalProcessed).toFixed(1) : 0,
    avgGoalsPerSession: totalProcessed > 0 ? +(totalGoals / totalProcessed).toFixed(1) : 0,
    avgRemindersPerSession: totalProcessed > 0 ? +(totalReminders / totalProcessed).toFixed(1) : 0,
    avgRelationshipsPerSession: totalProcessed > 0 ? +(totalRelationships / totalProcessed).toFixed(1) : 0,
    recentExtractions: entries.slice(0, 20),
  };
}

export async function getRecentSessions(limit = 30) {
  const { data } = await sb()
    .from("sessions")
    .select("id, user_id, session_number, session_type, started_at, ended_at, summary, key_themes, crisis_flag")
    .order("started_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getGrowthStats() {
  const { data: users } = await sb()
    .from("users")
    .select("id, created_at, onboarding_completed_at")
    .order("created_at", { ascending: true });

  const allUsers = users ?? [];

  const { data: sessionCounts } = await sb()
    .from("sessions")
    .select("user_id")
    .not("ended_at", "is", null);

  const userSessionMap: Record<string, number> = {};
  (sessionCounts ?? []).forEach((s: any) => {
    userSessionMap[s.user_id] = (userSessionMap[s.user_id] || 0) + 1;
  });

  const onboarded = allUsers.filter((u: any) => u.onboarding_completed_at).length;
  const session1 = Object.values(userSessionMap).filter((c) => c >= 1).length;
  const session3 = Object.values(userSessionMap).filter((c) => c >= 3).length;
  const session7 = Object.values(userSessionMap).filter((c) => c >= 7).length;

  const { data: referralData } = await sb().from("referrals").select("id, status, created_at");
  const refs = referralData ?? [];

  const { data: notifData } = await sb()
    .from("notification_log")
    .select("notification_type, sequence_step")
    .order("created_at", { ascending: false })
    .limit(200);

  const notifsByType: Record<string, number> = {};
  (notifData ?? []).forEach((n: any) => {
    const key = n.notification_type || n.sequence_step || "unknown";
    notifsByType[key] = (notifsByType[key] || 0) + 1;
  });

  // Retention cohorts: D1, D7, D30
  const now = new Date();
  let d1Retained = 0;
  let d1Eligible = 0;
  let d7Retained = 0;
  let d7Eligible = 0;
  let d30Retained = 0;
  let d30Eligible = 0;

  for (const u of allUsers) {
    const createdAt = new Date(u.created_at);
    const daysSinceJoin = Math.floor((now.getTime() - createdAt.getTime()) / 86400000);
    const sessionCount = userSessionMap[u.id] || 0;

    if (daysSinceJoin >= 1) {
      d1Eligible++;
      if (sessionCount >= 1) d1Retained++;
    }
    if (daysSinceJoin >= 7) {
      d7Eligible++;
      if (sessionCount >= 2) d7Retained++;
    }
    if (daysSinceJoin >= 30) {
      d30Eligible++;
      if (sessionCount >= 3) d30Retained++;
    }
  }

  return {
    totalUsers: allUsers.length,
    onboarded,
    onboardingRate: allUsers.length > 0 ? Math.round((onboarded / allUsers.length) * 100) : 0,
    session1,
    session3,
    session7,
    funnel: [
      { name: "Signed Up", value: allUsers.length },
      { name: "Onboarded", value: onboarded },
      { name: "1+ Session", value: session1 },
      { name: "3+ Sessions", value: session3 },
      { name: "7+ Sessions", value: session7 },
    ],
    retention: {
      d1: d1Eligible > 0 ? Math.round((d1Retained / d1Eligible) * 100) : 0,
      d7: d7Eligible > 0 ? Math.round((d7Retained / d7Eligible) * 100) : 0,
      d30: d30Eligible > 0 ? Math.round((d30Retained / d30Eligible) * 100) : 0,
    },
    referrals: {
      total: refs.length,
      pending: refs.filter((r: any) => r.status === "pending").length,
      activated: refs.filter((r: any) => r.status === "activated").length,
      rewarded: refs.filter((r: any) => r.status === "rewarded").length,
    },
    notificationsByType: notifsByType,
    usersByWeek: groupByWeek(allUsers),
  };
}

function groupByWeek(users: any[]) {
  const weeks: Record<string, number> = {};
  users.forEach((u) => {
    const d = new Date(u.created_at);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().split("T")[0];
    weeks[key] = (weeks[key] || 0) + 1;
  });
  return Object.entries(weeks).map(([week, count]) => ({ week, count }));
}

export async function getWellbeingStats() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [moodsRes, domainsRes] = await Promise.all([
    sb().from("mood_entries").select("mood_score, logged_at, user_id").gte("logged_at", thirtyDaysAgo.toISOString()).order("logged_at", { ascending: true }),
    sb().from("life_domains").select("domain, score").order("assessed_at", { ascending: false }).limit(500),
  ]);

  const moods = (moodsRes.data ?? []) as { mood_score: number; logged_at: string; user_id: string }[];

  const moodByDay: Record<string, { total: number; count: number }> = {};
  moods.forEach((m) => {
    const day = m.logged_at.split("T")[0];
    if (!moodByDay[day]) moodByDay[day] = { total: 0, count: 0 };
    moodByDay[day].total += m.mood_score;
    moodByDay[day].count += 1;
  });

  const moodTrend = Object.entries(moodByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { total, count }]) => ({ date, avg: +(total / count).toFixed(1), count }));

  const distribution = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  moods.forEach((m) => { if (m.mood_score >= 1 && m.mood_score <= 10) distribution[m.mood_score - 1]++; });

  const domains = (domainsRes.data ?? []) as { domain: string; score: number }[];
  const domainAgg: Record<string, { total: number; count: number }> = {};
  domains.forEach((d) => {
    if (!domainAgg[d.domain]) domainAgg[d.domain] = { total: 0, count: 0 };
    domainAgg[d.domain].total += d.score;
    domainAgg[d.domain].count += 1;
  });
  const domainAvgs = Object.entries(domainAgg).map(([domain, { total, count }]) => ({
    domain: domain.replace(/_/g, " "),
    avg: +(total / count).toFixed(1),
    count,
  }));

  return { moodTrend, distribution, domainAvgs, totalEntries: moods.length };
}

export async function getPromptVersions() {
  const { data } = await sb()
    .from("prompt_versions")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getRecentActivity(limit = 50) {
  const [auditRes, sessionsRes, usersRes] = await Promise.all([
    sb().from("audit_log").select("action, details, user_id, created_at").order("created_at", { ascending: false }).limit(limit),
    sb().from("sessions").select("id, user_id, session_type, started_at, crisis_flag").order("started_at", { ascending: false }).limit(20),
    sb().from("users").select("id, email, created_at").order("created_at", { ascending: false }).limit(10),
  ]);
  return {
    audit: auditRes.data ?? [],
    recentSessions: sessionsRes.data ?? [],
    recentUsers: usersRes.data ?? [],
  };
}

export async function getSubscriptionStats() {
  const [payingRes, trialRes, freeRes, eventsRes, totalRevenueRes] = await Promise.all([
    sb().from("users").select("id", { count: "exact", head: true }).neq("subscription_tier", "free"),
    sb().from("users").select("id", { count: "exact", head: true })
      .not("trial_started_at", "is", null)
      .gt("trial_expires_at", new Date().toISOString()),
    sb().from("users").select("id", { count: "exact", head: true }).eq("subscription_tier", "free"),
    sb().from("subscription_events").select("event_type, revenue_cents, created_at, product_id")
      .order("created_at", { ascending: false }).limit(50),
    sb().from("users").select("lifetime_revenue_cents"),
  ]);

  const totalRevenue = ((totalRevenueRes.data ?? []) as { lifetime_revenue_cents: number }[])
    .reduce((s, u) => s + (u.lifetime_revenue_cents || 0), 0);

  return {
    payingUsers: payingRes.count ?? 0,
    trialUsers: trialRes.count ?? 0,
    freeUsers: freeRes.count ?? 0,
    totalRevenueCents: totalRevenue,
    recentEvents: eventsRes.data ?? [],
  };
}

export async function getEventStats(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceISO = since.toISOString();

  const { data: events } = await sb()
    .from("app_events")
    .select("event_name, properties, screen, created_at, user_id")
    .gte("created_at", sinceISO)
    .order("created_at", { ascending: false })
    .limit(5000);

  const rows = events ?? [];

  const countsByName: Record<string, number> = {};
  const countsByScreen: Record<string, number> = {};
  const countsByDay: Record<string, number> = {};
  const uniqueUsersByEvent: Record<string, Set<string>> = {};

  for (const e of rows) {
    countsByName[e.event_name] = (countsByName[e.event_name] || 0) + 1;

    if (!uniqueUsersByEvent[e.event_name]) uniqueUsersByEvent[e.event_name] = new Set();
    uniqueUsersByEvent[e.event_name].add(e.user_id);

    if (e.screen) {
      countsByScreen[e.screen] = (countsByScreen[e.screen] || 0) + 1;
    }

    const day = e.created_at.split("T")[0];
    countsByDay[day] = (countsByDay[day] || 0) + 1;
  }

  const topEvents = Object.entries(countsByName)
    .map(([name, count]) => ({ name, count, users: uniqueUsersByEvent[name]?.size ?? 0 }))
    .sort((a, b) => b.count - a.count);

  const screenBreakdown = Object.entries(countsByScreen)
    .map(([screen, count]) => ({ screen, count }))
    .sort((a, b) => b.count - a.count);

  const timeline = Object.entries(countsByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  const signUpMethods: Record<string, number> = {};
  const signInMethods: Record<string, number> = {};
  rows.forEach((e) => {
    if (e.event_name === "sign_up" && e.properties?.method) {
      signUpMethods[e.properties.method] = (signUpMethods[e.properties.method] || 0) + 1;
    }
    if (e.event_name === "sign_in" && e.properties?.method) {
      signInMethods[e.properties.method] = (signInMethods[e.properties.method] || 0) + 1;
    }
  });

  const purchaseEvents = rows.filter((e) => e.event_name.startsWith("purchase_"));
  const paywallViews = rows.filter((e) => e.event_name === "paywall_viewed").length;
  const purchaseStarted = purchaseEvents.filter((e) => e.event_name === "purchase_started").length;
  const purchaseCompleted = purchaseEvents.filter((e) => e.event_name === "purchase_completed").length;
  const purchaseFailed = purchaseEvents.filter((e) => e.event_name === "purchase_failed").length;

  return {
    totalEvents: rows.length,
    uniqueUsers: new Set(rows.map((e) => e.user_id)).size,
    topEvents,
    screenBreakdown,
    timeline,
    recentEvents: rows.slice(0, 100),
    signUpMethods: Object.entries(signUpMethods).map(([method, count]) => ({ method, count })),
    signInMethods: Object.entries(signInMethods).map(([method, count]) => ({ method, count })),
    purchaseFunnel: {
      paywallViews,
      purchaseStarted,
      purchaseCompleted,
      purchaseFailed,
    },
    onboardingSteps: rows
      .filter((e) => e.event_name === "onboarding_step_completed")
      .reduce((acc: Record<string, number>, e) => {
        const step = e.properties?.step ?? "unknown";
        acc[step] = (acc[step] || 0) + 1;
        return acc;
      }, {}),
  };
}

export async function getRevenueStats() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    allUsersRes,
    payingUsersRes,
    sessionDataRes,
    recentEventsRes,
    allEventsRes,
    monthlyRevenueRes,
  ] = await Promise.all([
    sb().from("users").select("id, created_at, onboarding_completed_at"),
    sb()
      .from("users")
      .select("id", { count: "exact", head: true })
      .neq("subscription_tier", "free"),
    sb()
      .from("sessions")
      .select("user_id")
      .not("ended_at", "is", null),
    sb()
      .from("subscription_events")
      .select("id, user_id, event_type, product_id, revenue_cents, currency, platform, details, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    sb()
      .from("subscription_events")
      .select("event_type, revenue_cents, created_at, user_id")
      .order("created_at", { ascending: false }),
    sb()
      .from("subscription_events")
      .select("revenue_cents")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .in("event_type", ["INITIAL_PURCHASE", "RENEWAL"]),
  ]);

  const users = allUsersRes.data ?? [];
  const totalUsers = users.length;
  const onboarded = users.filter((u: any) => u.onboarding_completed_at).length;
  const activeSubscribers = payingUsersRes.count ?? 0;

  const userSessions: Record<string, number> = {};
  (sessionDataRes.data ?? []).forEach((s: any) => {
    userSessions[s.user_id] = (userSessions[s.user_id] || 0) + 1;
  });
  const trialReady = Object.values(userSessions).filter((c) => c >= 3).length;
  const highValue = Object.values(userSessions).filter((c) => c >= 7).length;
  const power = Object.values(userSessions).filter((c) => c >= 15).length;

  // MRR: sum revenue from purchases/renewals in last 30 days, normalized to monthly
  const monthlyRevenueCents = (monthlyRevenueRes.data ?? [])
    .reduce((sum: number, e: any) => sum + (e.revenue_cents || 0), 0);

  // Total lifetime revenue from all events
  const allEvents = allEventsRes.data ?? [];
  const totalRevenueCents = allEvents
    .filter((e: any) => ["INITIAL_PURCHASE", "RENEWAL"].includes(e.event_type))
    .reduce((sum: number, e: any) => sum + (e.revenue_cents || 0), 0);

  // Churn: count CANCELLATION + EXPIRATION events in last 30 days
  const churnEvents = allEvents.filter(
    (e: any) =>
      ["CANCELLATION", "EXPIRATION"].includes(e.event_type) &&
      new Date(e.created_at) >= thirtyDaysAgo
  ).length;

  // New subscriptions in last 30 days
  const newSubscriptions = allEvents.filter(
    (e: any) =>
      e.event_type === "INITIAL_PURCHASE" &&
      new Date(e.created_at) >= thirtyDaysAgo
  ).length;

  return {
    totalUsers,
    onboarded,
    activeSubscribers,
    mrr: monthlyRevenueCents,
    totalRevenueCents,
    churnEvents,
    newSubscriptions,
    recentEvents: recentEventsRes.data ?? [],
    conversionFunnel: [
      { name: "All Users", value: totalUsers },
      { name: "Onboarded", value: onboarded },
      { name: "Trial-Ready (3+ sessions)", value: trialReady },
      { name: "High-Value (7+ sessions)", value: highValue },
      { name: "Power Users (15+ sessions)", value: power },
    ],
    trialReady,
    highValue,
    power,
  };
}
