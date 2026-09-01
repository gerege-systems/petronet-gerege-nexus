import { permanentRedirect } from "next/navigation";

/**
 * The old address of the fuel overview.
 *
 * The module was renamed `fuel` → `petro` and its console screen moved with
 * it, which turned every bookmark and every link written before the rename
 * into a 404. A rename is the product's business; a dead address is the
 * reader's, and four lines is a cheaper answer than asking people to notice.
 */
export default function ControlPlaneFuelRedirect() {
  permanentRedirect("/cp/petro");
}
