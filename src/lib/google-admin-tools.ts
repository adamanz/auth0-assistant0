import { z } from "zod";
import { StructuredTool } from "@langchain/core/tools";
import { listUsers, addUser, suspendUser, unsuspendUser, getUser } from "./google-admin";

type GoogleAdminToolsParams = {
  credentials: {
    accessToken: string;
  };
};

export class ListUsersAdminTool extends StructuredTool {
  name = "listUsers";
  description = "List users from Google Admin Directory";
  schema = z.object({
    domain: z.string().describe("The domain name to list users from"),
  });

  private accessToken: string;

  constructor(params: GoogleAdminToolsParams) {
    super();
    this.accessToken = params.credentials.accessToken;
  }

  /** @ignore */
  async _call({ domain }: z.infer<typeof this.schema>): Promise<string> {
    try {
      const users = await listUsers(this.accessToken, domain);
      return JSON.stringify(users, null, 2);
    } catch (error: any) {
      return `Error listing users: ${error.message}`;
    }
  }
}

export class AddUserAdminTool extends StructuredTool {
  name = "addUser";
  description = "Create a new user in Google Admin Directory";
  schema = z.object({
    primaryEmail: z.string().describe("The email address of the user"),
    firstName: z.string().describe("The first name of the user"),
    lastName: z.string().describe("The last name of the user"),
  });

  private accessToken: string;

  constructor(params: GoogleAdminToolsParams) {
    super();
    this.accessToken = params.credentials.accessToken;
  }

  /** @ignore */
  async _call({ primaryEmail, firstName, lastName }: z.infer<typeof this.schema>): Promise<string> {
    try {
      const result = await addUser(this.accessToken, primaryEmail, firstName, lastName);
      return JSON.stringify(result, null, 2);
    } catch (error: any) {
      return `Error adding user: ${error.message}`;
    }
  }
}

export class SuspendUserAdminTool extends StructuredTool {
  name = "suspendUser";
  description = "Suspend a user in Google Admin Directory";
  schema = z.object({
    userKey: z.string().describe("The email address or unique ID of the user"),
  });

  private accessToken: string;

  constructor(params: GoogleAdminToolsParams) {
    super();
    this.accessToken = params.credentials.accessToken;
  }

  /** @ignore */
  async _call({ userKey }: z.infer<typeof this.schema>): Promise<string> {
    try {
      const result = await suspendUser(this.accessToken, userKey);
      return JSON.stringify(result, null, 2);
    } catch (error: any) {
      return `Error suspending user: ${error.message}`;
    }
  }
}

export class UnsuspendUserAdminTool extends StructuredTool {
  name = "unsuspendUser";
  description = "Unsuspend a user in Google Admin Directory";
  schema = z.object({
    userKey: z.string().describe("The email address or unique ID of the user"),
  });

  private accessToken: string;

  constructor(params: GoogleAdminToolsParams) {
    super();
    this.accessToken = params.credentials.accessToken;
  }

  /** @ignore */
  async _call({ userKey }: z.infer<typeof this.schema>): Promise<string> {
    try {
      const result = await unsuspendUser(this.accessToken, userKey);
      return JSON.stringify(result, null, 2);
    } catch (error: any) {
      return `Error unsuspending user: ${error.message}`;
    }
  }
}

export class GetUserAdminTool extends StructuredTool {
  name = "getUser";
  description = "Get a specific user from Google Admin Directory";
  schema = z.object({
    userKey: z.string().describe("The email address or unique ID of the user"),
  });

  private accessToken: string;

  constructor(params: GoogleAdminToolsParams) {
    super();
    this.accessToken = params.credentials.accessToken;
  }

  /** @ignore */
  async _call({ userKey }: z.infer<typeof this.schema>): Promise<string> {
    try {
      const result = await getUser(this.accessToken, userKey);
      return JSON.stringify(result, null, 2);
    } catch (error: any) {
      return `Error retrieving user: ${error.message}`;
    }
  }
} 