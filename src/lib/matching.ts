import { prisma } from "@/lib/prisma";

export async function getMembershipForTournament(userId: string, tournamentId: string) {
  return prisma.teamMember.findUnique({
    where: {
      userId_tournamentId: { userId, tournamentId },
    },
    include: {
      team: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  displayName: true,
                  lrigs: true,
                  achievements: true,
                  bio: true,
                  xAccount: true,
                },
              },
            },
            orderBy: { joinedAt: "asc" },
          },
        },
      },
    },
  });
}

async function refreshRecruiting(teamId: string) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      tournament: true,
      _count: { select: { members: true } },
    },
  });
  if (!team) return;

  const recruiting = team._count.members < team.tournament.teamSizeLimit;
  if (team.recruiting !== recruiting) {
    await prisma.team.update({
      where: { id: teamId },
      data: { recruiting },
    });
  }
}

/**
 * Create a like and, on mutual like, form or join a team for the tournament.
 *
 * Rules:
 * - Mutual between two solo players → create a team
 * - Mutual with a member of a recruiting team (and you are solo) → join that team
 * - Team hits tournament.teamSizeLimit → recruiting ends
 */
export async function likeUser(params: {
  fromUserId: string;
  toUserId: string;
  tournamentId: string;
}) {
  const { fromUserId, toUserId, tournamentId } = params;

  if (fromUserId === toUserId) {
    throw new Error("自分自身にはいいねできません");
  }

  const [tournament, fromEntry, toEntry] = await Promise.all([
    prisma.tournament.findUnique({ where: { id: tournamentId } }),
    prisma.tournamentEntry.findUnique({
      where: { userId_tournamentId: { userId: fromUserId, tournamentId } },
    }),
    prisma.tournamentEntry.findUnique({
      where: { userId_tournamentId: { userId: toUserId, tournamentId } },
    }),
  ]);

  if (!tournament || !tournament.isOpen) {
    throw new Error("大会が見つからないか、募集が閉じています");
  }
  if (!fromEntry || !toEntry) {
    throw new Error("お互いが同じ大会に参加登録している必要があります");
  }

  const like = await prisma.like.upsert({
    where: {
      fromUserId_toUserId_tournamentId: {
        fromUserId,
        toUserId,
        tournamentId,
      },
    },
    create: { fromUserId, toUserId, tournamentId },
    update: {},
  });

  const reverse = await prisma.like.findUnique({
    where: {
      fromUserId_toUserId_tournamentId: {
        fromUserId: toUserId,
        toUserId: fromUserId,
        tournamentId,
      },
    },
  });

  if (!reverse) {
    return { like, matched: false as const, team: null };
  }

  const [fromMembership, toMembership] = await Promise.all([
    getMembershipForTournament(fromUserId, tournamentId),
    getMembershipForTournament(toUserId, tournamentId),
  ]);

  // Already on the same team
  if (
    fromMembership &&
    toMembership &&
    fromMembership.teamId === toMembership.teamId
  ) {
    return { like, matched: true as const, team: fromMembership.team };
  }

  // Both already on different teams — mutual like recorded, no team change
  if (fromMembership && toMembership) {
    return { like, matched: true as const, team: null };
  }

  // One has a team: solo user joins if recruiting and space available
  if (fromMembership || toMembership) {
    const existing = fromMembership ?? toMembership!;
    const soloUserId = fromMembership ? toUserId : fromUserId;
    const team = existing.team;

    if (!team.recruiting || team.members.length >= tournament.teamSizeLimit) {
      return { like, matched: true as const, team: null };
    }

    await prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId: soloUserId,
        tournamentId,
      },
    });
    await refreshRecruiting(team.id);

    const updated = await prisma.team.findUnique({
      where: { id: team.id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                lrigs: true,
                achievements: true,
                bio: true,
                xAccount: true,
              },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
      },
    });

    return { like, matched: true as const, team: updated };
  }

  // Both solo → create a new team
  const [fromUser, toUser] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: fromUserId } }),
    prisma.user.findUniqueOrThrow({ where: { id: toUserId } }),
  ]);

  const teamName = `${fromUser.displayName} & ${toUser.displayName}`;
  const team = await prisma.team.create({
    data: {
      tournamentId,
      name: teamName,
      recruiting: tournament.teamSizeLimit > 2,
      members: {
        create: [
          { userId: fromUserId, tournamentId },
          { userId: toUserId, tournamentId },
        ],
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              lrigs: true,
              achievements: true,
              bio: true,
              xAccount: true,
            },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  await refreshRecruiting(team.id);

  return { like, matched: true as const, team };
}

export async function getRecommendations(userId: string, tournamentId: string) {
  const membership = await getMembershipForTournament(userId, tournamentId);
  if (membership && !membership.team.recruiting) {
    return [];
  }

  const entries = await prisma.tournamentEntry.findMany({
    where: {
      tournamentId,
      userId: { not: userId },
    },
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          lrigs: true,
          achievements: true,
          bio: true,
          xAccount: true,
        },
      },
    },
  });

  const myLikes = await prisma.like.findMany({
    where: { fromUserId: userId, tournamentId },
    select: { toUserId: true },
  });
  const likedIds = new Set(myLikes.map((l) => l.toUserId));

  const teammateIds = new Set(membership?.team.members.map((m) => m.userId) ?? []);

  const memberships = await prisma.teamMember.findMany({
    where: {
      tournamentId,
      userId: { in: entries.map((e) => e.userId) },
    },
    include: {
      team: { select: { id: true, name: true, recruiting: true } },
    },
  });
  const membershipByUser = new Map(memberships.map((m) => [m.userId, m]));

  const me = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const myLrigTokens = tokenize(me.lrigs);

  const scored = entries
    .filter((e) => !teammateIds.has(e.userId))
    .map((e) => {
      const theirMembership = membershipByUser.get(e.userId);
      // Hide users on full (non-recruiting) other teams
      if (theirMembership && !theirMembership.team.recruiting) {
        return null;
      }
      // If I'm on a team, prefer solo candidates or recruiting teams we're not on
      if (membership && theirMembership) {
        return null;
      }

      const overlap = [...tokenize(e.user.lrigs)].filter((t) => myLrigTokens.has(t)).length;
      return {
        user: e.user,
        alreadyLiked: likedIds.has(e.userId),
        team: theirMembership
          ? {
              id: theirMembership.team.id,
              name: theirMembership.team.name,
              recruiting: theirMembership.team.recruiting,
            }
          : null,
        score: overlap,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b!.score - a!.score || a!.user.displayName.localeCompare(b!.user.displayName));

  return scored as NonNullable<(typeof scored)[number]>[];
}

function tokenize(value: string) {
  return new Set(
    value
      .split(/[,、/\s]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}
