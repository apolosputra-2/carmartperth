
import "server-only";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma, PortalRole } from "@prisma/client";

export async function getPortalUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.portalUser.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  return user;
}

type ActivePortalUser = NonNullable<
  Awaited<ReturnType<typeof getPortalUser>>
>;

export function applicationAccessFilter(
  user: ActivePortalUser
): Prisma.FinanceApplicationWhereInput {
  if (user.role === PortalRole.BOSS) {
    return {};
  }

  if (user.role === PortalRole.STAFF) {
    return {
      OR: [
        { assignedStaffId: null },
        { assignedStaffId: user.id },
      ],
    };
  }

  if (user.role === PortalRole.BROKER) {
    return {
      assignedBrokerId: user.id,
      brokerDisclosureAuthorised: true,
    };
  }

  // Deny access if a new role is added in the future.
  return {
    id: "__NO_ACCESS__",
  };
}
