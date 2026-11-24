import { projects } from "@/data/projects";

/** Stoke Money's site root: the panel introduces the product, not the waitlist. */
export const STOKE_URL = "https://www.stokemoney.com/";

const stoke = projects.find((p) => p.slug === "stoke");
if (!stoke) throw new Error("The Stoke project entry is missing from src/data/projects.ts");

export const STOKE_TITLE = stoke.title;
export const STOKE_DESCRIPTION = stoke.description;

/** Placeholder founder intro; edit freely. */
export const FOUNDER_INTRO =
  "This is Joseph Wibowo, a data engineer who builds pipelines by day. Between tickets he keeps slipping over to a quiet desk in the corner to work on his own app.";

export const CANVAS_LABEL =
  "An isometric office where twenty small robots type, queue for the printer and fetch coffee. One robot with an indigo stripe keeps sneaking off to the Stoke Money desk.";
