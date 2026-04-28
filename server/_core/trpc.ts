import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import jwt from "jsonwebtoken";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

// Helper: verify admin_token cookie (username/password login)
function verifyAdminTokenCore(req: any): { id: number; username: string; role: string } | null {
  try {
    const token = req.cookies?.admin_token;
    if (!token) return null;
    const secret = process.env.JWT_SECRET ?? "alphabag-admin-secret";
    return jwt.verify(token, secret) as { id: number; username: string; role: string };
  } catch {
    return null;
  }
}

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    // Accept admin_token cookie (username/password login)
    const adminToken = verifyAdminTokenCore(ctx.req);
    if (adminToken && (adminToken.role === 'admin' || adminToken.role === 'sub_admin')) {
      return next({ ctx: { ...ctx, user: ctx.user } });
    }

    // Accept Manus OAuth user with admin role
    if (ctx.user && (ctx.user.role === 'admin' || ctx.user.role === 'sub_admin')) {
      return next({ ctx: { ...ctx, user: ctx.user } });
    }

    throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
  }),
);
