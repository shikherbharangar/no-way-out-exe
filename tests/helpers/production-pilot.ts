import { CampaignPilot } from './machine-pilot';
import { idleInput, type Snapshot } from '../../src/game/simulation';

/** Input-only driver for slower production browser captures (20Hz snapshots).
 * Recover below the terminal with the existing wall jump. Wait for the server's
 * released-jump state rather than hoping a short tick-modulo pulse is observed.
 */
export class ProductionPilot extends CampaignPilot {
 private recovery = 0;
 override controls(s: Snapshot) {
  const values = super.controls(s), p = s.players[0];
  if (s.sector !== 1 || s.gate || p.ghost) return values;
  // Brake before the target: rendered input has another browser-frame of delay
  // after the authoritative 20Hz snapshot. Never change the observed snapshot.
  const steer = (id: number, target: number) => {
   const observed = s.players[id], projected = observed.x + observed.vx * .12;
   return { ...idleInput(), left: projected > target + 3, right: projected < target - 3 };
  };
  if (s.players[1].x > 330) values[1] = steer(1, 369);
  if (p.grounded && p.y < 230 && p.x > 448) {
   this.recovery = 0; values[0] = { ...steer(0, 487), interact: true }; return values;
  }
  if (!this.recovery && p.x > 448 && p.y > 263) this.recovery = 1;
  if (!this.recovery) return values;
  if (p.grounded && p.y < 230) { this.recovery = 0; return values; }
  if (this.recovery === 1 && p.x >= 542 && p.x <= 558 && Math.abs(p.vx) < 40 && p.grounded) this.recovery = 2;
  if (this.recovery === 2 && p.x < 534 && p.y > 263) this.recovery = 1;
  if (this.recovery === 1) values[0] = steer(0, 550);
  else values[0] = { ...idleInput(), left: p.y < 262 && p.x > 491,
   // Release at the wall, then press again only after the host observed release.
   jump: p.grounded || p.wall ? !p.wasJump : true, interact: true };
  return values;
 }
}
