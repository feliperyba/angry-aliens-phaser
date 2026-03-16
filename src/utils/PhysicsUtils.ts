import Matter from "matter-js";
import type Phaser from "phaser";
import { TimeScaleCompensator } from "./TimeScaleCompensator";

export interface RadialForceResult {
  success: boolean;
  distance: number;
  distanceRatio: number;
}

export function applyRadialImpulse(
  body: Matter.Body,
  originX: number,
  originY: number,
  radius: number,
  baseSpeed: number
): RadialForceResult {
  if (body.isStatic) {
    return { success: false, distance: 0, distanceRatio: 1 };
  }

  const dx = body.position.x - originX;
  const dy = body.position.y - originY;
  const distSquared = dx * dx + dy * dy;
  const radiusSquared = radius * radius;

  // Early exit BEFORE sqrt - much faster for bodies outside radius
  if (distSquared >= radiusSquared) {
    return { success: false, distance: Math.sqrt(distSquared), distanceRatio: 1 };
  }

  const distance = Math.sqrt(distSquared);

  if (body.isSleeping) {
    Matter.Sleeping.set(body, false);
  }

  const distanceRatio = distance / radius;
  let pushSpeed = baseSpeed * (1 - distanceRatio);

  const massFactor = 1 / (1 + body.mass * 0.02);
  pushSpeed *= massFactor;

  let dirX: number;
  let dirY: number;
  if (distance <= 0) {
    const randomAngle = Math.random() * Math.PI * 2;
    dirX = Math.cos(randomAngle);
    dirY = Math.sin(randomAngle);
  } else {
    dirX = dx / distance;
    dirY = dy / distance;
  }

  Matter.Body.setVelocity(body, {
    x: body.velocity.x + dirX * pushSpeed,
    y: body.velocity.y + dirY * pushSpeed,
  });

  return { success: true, distance, distanceRatio };
}

export function getRelativeVelocity(
  bodyA: Matter.Body,
  bodyB: Matter.Body
): { x: number; y: number } {
  return {
    x: bodyA.velocity.x - bodyB.velocity.x,
    y: bodyA.velocity.y - bodyB.velocity.y,
  };
}

export function calculateImpactSpeed(
  bodyA: Matter.Body,
  bodyB: Matter.Body,
  scene?: Phaser.Scene
): number {
  const relativeVelocity = getRelativeVelocity(bodyA, bodyB);
  const rawSpeed = Math.sqrt(relativeVelocity.x ** 2 + relativeVelocity.y ** 2);

  if (scene) {
    return TimeScaleCompensator.compensateImpactSpeed(rawSpeed, scene);
  }
  return rawSpeed;
}
