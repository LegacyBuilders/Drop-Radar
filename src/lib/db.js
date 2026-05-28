import { init } from "@instantdb/react";
import schema from "../../instant.schema";

const APP_ID = import.meta.env.VITE_INSTANT_APP_ID;

if (!APP_ID) {
  // eslint-disable-next-line no-console
  console.warn(
    "[Drop Radar] VITE_INSTANT_APP_ID is not set. Create an app at https://instantdb.com and copy the App ID into .env.local."
  );
}

export const db = init({
  appId: APP_ID,
  schema,
});
