import type { Agent, World } from "../sim/world";
import type { Selection } from "./hitTest";

export type PanelInfo =
  | { kind: "founder"; activity: string }
  | { kind: "robot"; name: string; activity: string }
  | { kind: "desk"; owner: string; activity: string };

/** What a robot is doing right now, in words. */
export function describeActivity(world: World, a: Agent): string {
  switch (a.activity) {
    case "Typing":
      return "typing away at their desk";
    case "Idle":
      return "taking a short breather at their desk";
    case "Walking":
      switch (a.destination) {
        case "printer":
          return "heading to the printer";
        case "coffee":
          return "heading off for a coffee";
        case "stoke":
          return "sneaking over to the Stoke Money desk";
        default:
          return "walking back to their desk";
      }
    case "Carrying":
      return a.held === "mug" ? "carrying a fresh coffee back to their desk" : "carrying printouts back to their desk";
    case "Queueing":
      return a.destination === "printer" ? "waiting for the printer" : "waiting in line for coffee";
    case "UsingPrinter":
      return world.stations.printer.jammed ? "thumping the jammed printer" : "printing some reports";
    case "GettingCoffee":
      return "pouring a coffee";
    case "WorkingOnStoke":
      return "working on Stoke Money";
  }
}

export function describeSelection(world: World, sel: Selection): PanelInfo | null {
  if (!sel) return null;
  const protagonist = world.agents[world.protagonistId];
  if (sel.kind === "stoke" || (sel.kind === "agent" && sel.id === world.protagonistId)) {
    return { kind: "founder", activity: describeActivity(world, protagonist) };
  }
  if (sel.kind === "agent") {
    const a = world.agents[sel.id];
    return { kind: "robot", name: a.name, activity: describeActivity(world, a) };
  }
  const owner = world.agents.find((a) => a.cubicle === sel.id);
  if (!owner) return null;
  return { kind: "desk", owner: owner.name, activity: describeActivity(world, owner) };
}
