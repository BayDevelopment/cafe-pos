
import { defineEventHandler } from "h3";
import { identifyUser } from "../../utils/auth";

export default defineEventHandler(async (event) => {
  await identifyUser(event);
});