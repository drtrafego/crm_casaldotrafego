import { StackServerApp } from "@stackframe/stack";

const projectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID;

export const stackServerApp: any = projectId
  ? new StackServerApp({ tokenStore: "nextjs-cookie" })
  : { getUser: async () => undefined };
