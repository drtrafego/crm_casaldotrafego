import { StackServerApp } from "@stackframe/stack";

const projectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID;
const clientKey = process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY;

export const stackServerApp: any = projectId && clientKey
  ? new StackServerApp({ tokenStore: "nextjs-cookie" })
  : { getUser: async () => undefined };
