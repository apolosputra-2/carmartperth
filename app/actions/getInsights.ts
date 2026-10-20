"use server";

import { prisma } from "@/lib/prisma";

export async function getInsights(
  date: string,
  range: "today" | "week" | "month"
) {
  // For HOT LEADS list only
  const todayStart = new Date(`${date}T00:00:00+08:00`);

  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  // For all other queries
  const selectedDate = new Date(`${date}T00:00:00+08:00`);

  let start = new Date(selectedDate);
  let end = new Date(selectedDate);

  if (range === "today") {
    end.setDate(end.getDate() + 1);
  }

  if (range === "week") {
    const day = selectedDate.getDay();

    // Monday = start of week
    const daysFromMonday = day === 0 ? 6 : day - 1;

    start.setDate(start.getDate() - daysFromMonday);

    end = new Date(start);
    end.setDate(end.getDate() + 7);
  }

  if (range === "month") {
    start = new Date(
      `${date.slice(0, 7)}-01T00:00:00+08:00`
    );

    end = new Date(start);
    end.setMonth(end.getMonth() + 1);
  }

  // Separate DATE-only range for LeadContactDay
  const [year, month, day] = date.split("-").map(Number);

  let contactStart = new Date(
    Date.UTC(year, month - 1, day)
  );

  let contactEnd = new Date(contactStart);

  if (range === "today") {
    contactEnd.setUTCDate(contactEnd.getUTCDate() + 1);
  }

  if (range === "week") {
    const dayOfWeek = contactStart.getUTCDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    contactStart.setUTCDate(
      contactStart.getUTCDate() - daysFromMonday
    );

    contactEnd = new Date(contactStart);
    contactEnd.setUTCDate(contactEnd.getUTCDate() + 7);
  }

  if (range === "month") {
    contactStart = new Date(
      Date.UTC(year, month - 1, 1)
    );

    contactEnd = new Date(
      Date.UTC(year, month, 1)
    );
  }

  // TEMPORARY until authentication exists
  const currentSalespersonId = 4;

  const [
    allLeadsCreated,
    allLeadsContacted,
    allUncontacted,
    allHotUncontacted,

    myLeadsCreated,
    myLeadsContacted,
    myUncontacted,
    myHotUncontacted,

    hotLeadsNotContacted,

    contractSignedToday,
    wonToday,
    deliveredToday,
    lostToday,

    myContractSignedToday,
    myWonToday,
    myDeliveredToday,
    myLostToday,

    contactSuccessfulToday,
    contactUnsuccessfulToday,

    myContactSuccessfulToday,
    myContactUnsuccessfulToday,

  ] = await Promise.all([
    // 1. ALL - leads created
    prisma.lead.count({
      where: {
        createdAt: {
          gte: start,
          lt: end,
        },
      },
    }),

    // 2. ALL - leads contacted
    prisma.lead.count({
      where: {
        lastContactedAt: {
          gte: start,
          lt: end,
        },
      },
    }),

    // 3. ALL - leads not contacted
    prisma.lead.count({
      where: {
        createdAt: {
          lt: end,
        },

        OR: [
          { lastContactedAt: null },
          { lastContactedAt: { lt: start } },
          { lastContactedAt: { gte: end } },
        ],
      },
    }),

    // 4. ALL - hot leads not contacted
    prisma.lead.count({
      where: {
        status: "HOT",

        createdAt: {
          lt: end,
        },

        OR: [
          { lastContactedAt: null },
          { lastContactedAt: { lt: start } },
          { lastContactedAt: { gte: end } },
        ],
      },
    }),

    // 5. ME - leads created
    prisma.lead.count({
      where: {
        salespersonId: currentSalespersonId,

        createdAt: {
          gte: start,
          lt: end,
        },
      },
    }),

    // 6. ME - leads contacted
    prisma.lead.count({
      where: {
        salespersonId: currentSalespersonId,

        lastContactedAt: {
          gte: start,
          lt: end,
        },
      },
    }),

    // 7. ME - leads not contacted
    prisma.lead.count({
      where: {
        salespersonId: currentSalespersonId,

        createdAt: {
          lt: end,
        },

        OR: [
          { lastContactedAt: null },
          { lastContactedAt: { lt: start } },
          { lastContactedAt: { gte: end } },
        ],
      },
    }),

    // 8. ME - hot leads not contacted
    prisma.lead.count({
      where: {
        salespersonId: currentSalespersonId,
        status: "HOT",

        createdAt: {
          lt: end,
        },

        OR: [
          { lastContactedAt: null },
          { lastContactedAt: { lt: start } },
          { lastContactedAt: { gte: end } },
        ],
      },
    }),

    // 9. List of HOT leads not contacted TODAY
    prisma.lead.findMany({
      where: {
        status: "HOT",

        createdAt: {
          lt: todayEnd,
        },

        OR: [
          { lastContactedAt: null },
          { lastContactedAt: { lt: todayStart } },
          { lastContactedAt: { gte: todayEnd } },
        ],
      },

      select: {
        id: true,
        name: true,
        phone: true,
        salespersonId: true,

        salesperson: {
          select: {
            name: true,
          },
        },

        lastContactedAt: true,
      },

      orderBy: {
        name: "asc",
      },
    }),

    // 10. Contract signed today
    prisma.lead.count({
      where: {
        contractSignedAt: {
          gte: start,
          lt: end,
        },
      },
    }),

    // 11. Won today
    prisma.lead.count({
      where: {
        wonAt: {
          gte: start,
          lt: end,
        },
      },
    }),

    // 12. Delivered today
    prisma.lead.count({
      where: {
        deliveredAt: {
          gte: start,
          lt: end,
        },
      },
    }),

    // 13. Lost today
    prisma.lead.count({
      where: {
        lostAt: {
          gte: start,
          lt: end,
        },
      },
    }),

    // 14. Contract signed today (for current salesperson)
    prisma.lead.count({
      where: {
        salespersonId: currentSalespersonId,
        contractSignedAt: {
          gte: start,
          lt: end,
        },
      },
    }),

    // 15. Won today (for current salesperson)
    prisma.lead.count({
      where: {
        salespersonId: currentSalespersonId,
        wonAt: {
          gte: start,
          lt: end,
        },
      },
    }),

    // 16. Delivered today (for current salesperson)
    prisma.lead.count({
      where: {
        salespersonId: currentSalespersonId,
        deliveredAt: {
          gte: start,
          lt: end,
        },
      },
    }),

    // 17. Lost today (for current salesperson)
    prisma.lead.count({
      where: {
        salespersonId: currentSalespersonId,
        lostAt: {
          gte: start,
          lt: end,
        },
      },
    }),

    // 18. Contact successful today
    prisma.leadContactDay.count({
      where: {
        contactDate: {
          gte: contactStart,
          lt: contactEnd,
        },
        outcome: "SUCCESSFUL",
      },
    }),

    // 19. Contact unsuccessful today
    prisma.leadContactDay.count({
      where: {
        contactDate: {
          gte: contactStart,
          lt: contactEnd,
        },
        outcome: "UNSUCCESSFUL",
      },
    }),

    // 20. Contact successful today (for current salesperson)
    prisma.leadContactDay.count({
      where: {
        salespersonId: currentSalespersonId,
        contactDate: {
          gte: contactStart,
          lt: contactEnd,
        },
        outcome: "SUCCESSFUL",
      },
    }),

    // 21. Contact unsuccessful today (for current salesperson)
    prisma.leadContactDay.count({
      where: {
        salespersonId: currentSalespersonId,
        contactDate: {
          gte: contactStart,
          lt: contactEnd,
        },
        outcome: "UNSUCCESSFUL",
      },
    }),
  ]);

const graphRows = await prisma.leadContactDay.findMany({
  where: {
    contactDate: {
      gte: contactStart,
      lt: contactEnd,
    },
  },
  select: {
    salespersonId: true,
    outcome: true,
    contactDate: true,
    lastContactedAt: true,
  },
});

type GraphPoint = {
  label: string;
  contacted: number;
  contactSuccessful: number;
  contactUnsuccessful: number;
};

let graphAll: GraphPoint[] = [];
let graphMe: GraphPoint[] = [];

if (range === "today") {
  graphAll = Array.from({ length: 24 }, (_, hour) => ({
    label: `${hour.toString().padStart(2, "0")}:00`,
    contacted: 0,
    contactSuccessful: 0,
    contactUnsuccessful: 0,
  }));

  graphMe = structuredClone(graphAll);

  for (const row of graphRows) {
    const perthHour = new Date(
      row.lastContactedAt.getTime() + 8 * 60 * 60 * 1000
    ).getUTCHours();

    graphAll[perthHour].contacted += 1;

    if (row.outcome === "SUCCESSFUL") {
      graphAll[perthHour].contactSuccessful += 1;
    } else {
      graphAll[perthHour].contactUnsuccessful += 1;
    }

    if (row.salespersonId === currentSalespersonId) {
      graphMe[perthHour].contacted += 1;

      if (row.outcome === "SUCCESSFUL") {
        graphMe[perthHour].contactSuccessful += 1;
      } else {
        graphMe[perthHour].contactUnsuccessful += 1;
      }
    }
  }
}

if (range === "week") {
  const labels = [
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun",
  ];

  graphAll = labels.map((label) => ({
    label,
    contacted: 0,
    contactSuccessful: 0,
    contactUnsuccessful: 0,
  }));

  graphMe = structuredClone(graphAll);

  for (const row of graphRows) {
    const day = row.contactDate.getUTCDay();

    // JS: Sunday = 0
    // We want Monday = 0
    const index = day === 0 ? 6 : day - 1;

    graphAll[index].contacted += 1;

    if (row.outcome === "SUCCESSFUL") {
      graphAll[index].contactSuccessful += 1;
    } else {
      graphAll[index].contactUnsuccessful += 1;
    }

    if (row.salespersonId === currentSalespersonId) {
      graphMe[index].contacted += 1;

      if (row.outcome === "SUCCESSFUL") {
        graphMe[index].contactSuccessful += 1;
      } else {
        graphMe[index].contactUnsuccessful += 1;
      }
    }
  }
}

if (range === "month") {
  const daysInMonth = new Date(
    Date.UTC(year, month, 0)
  ).getUTCDate();

  graphAll = Array.from(
    { length: daysInMonth },
    (_, index) => ({
      label: `${index + 1}`,
      contacted: 0,
      contactSuccessful: 0,
      contactUnsuccessful: 0,
    })
  );

  graphMe = structuredClone(graphAll);

  for (const row of graphRows) {
    const dayOfMonth = row.contactDate.getUTCDate();
    const index = dayOfMonth - 1;

    graphAll[index].contacted += 1;

    if (row.outcome === "SUCCESSFUL") {
      graphAll[index].contactSuccessful += 1;
    } else {
      graphAll[index].contactUnsuccessful += 1;
    }

    if (row.salespersonId === currentSalespersonId) {
      graphMe[index].contacted += 1;

      if (row.outcome === "SUCCESSFUL") {
        graphMe[index].contactSuccessful += 1;
      } else {
        graphMe[index].contactUnsuccessful += 1;
      }
    }
  }
}

  return {
    all: {
      leadsCreated: allLeadsCreated,
      leadsContacted: allLeadsContacted,
      uncontacted: allUncontacted,
      hotUncontacted: allHotUncontacted,
    },

    me: {
      leadsCreated: myLeadsCreated,
      leadsContacted: myLeadsContacted,
      uncontacted: myUncontacted,
      hotUncontacted: myHotUncontacted,
    },

    activity: {
      all: {
        contacted:
          contactSuccessfulToday +
          contactUnsuccessfulToday,

        contactSuccessful: contactSuccessfulToday,
        contactUnsuccessful: contactUnsuccessfulToday,

        contractSigned: contractSignedToday,
        won: wonToday,
        delivered: deliveredToday,
        lost: lostToday,
      },

      me: {
        contacted:
          myContactSuccessfulToday +
          myContactUnsuccessfulToday,

        contactSuccessful: myContactSuccessfulToday,
        contactUnsuccessful: myContactUnsuccessfulToday,

        contractSigned: myContractSignedToday,
        won: myWonToday,
        delivered: myDeliveredToday,
        lost: myLostToday,
      },
    },

    graph: {
      all: graphAll,
      me: graphMe,
    },

    hotLeadsNotContacted,
  };
}