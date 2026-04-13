// ---------------------------------------------------------------------
// KLEINE BASIS-HELPER
// ---------------------------------------------------------------------

export function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
  }

export function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

export function createAnimatedValue(initial = 0) {
    return {
      current: initial,
      target: initial,
      velocity: 0,
    };
  }

export function resetAnimatedValue(animated, value = 0) {
    animated.current = value;
    animated.target = value;
    animated.velocity = 0;
  }


function stepAnimatedValue(animated, spring, delta) {
    const result = spring.step(
      animated.current,
      animated.target,
      animated.velocity,
      delta
    );

    animated.current = result.current;
    animated.velocity = result.velocity;
  }

function isAnimatedValueMoving(animated, spring) {
    return !spring.isSettled(animated.current, animated.target, animated.velocity);
  }

export function createSpring({ stiffness, damping, precision = 0.001 }) {
    return {
      stiffness,
      damping,
      precision,

      step(current, target, velocity, delta) {
        const force = (target - current) * this.stiffness;
        velocity += force * delta;
        velocity *= Math.pow(this.damping, delta);
        current += velocity * delta;
        return { current, velocity };
      },

      isSettled(current, target, velocity, epsilon = this.precision) {
        return (
          Math.abs(target - current) <= epsilon &&
          Math.abs(velocity) <= epsilon
        );
      },
    };
  }
