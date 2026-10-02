"use server";

import { prisma } from "@/lib/prisma";

export async function getDailyInsights(date: string) {
  const start = new Date(`${date}T00:00:00+08:00`);
  const end = new Date(`${date}T00:00:00+08:00`);
  end.setDate(end.getDate() + 1);

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

    // 9. List of HOT leads not contacted
    prisma.lead.findMany({
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

      select: {
        id: true,
        name: true,

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
  ]);

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
        contacted: allLeadsContacted,
        contractSigned: contractSignedToday,
        won: wonToday,
        delivered: deliveredToday,
        lost: lostToday,
      },

      me: {
        contacted: myLeadsContacted,
        contractSigned: myContractSignedToday,
        won: myWonToday,
        delivered: myDeliveredToday,
        lost: myLostToday,
      },
    },

    hotLeadsNotContacted,
  };
}