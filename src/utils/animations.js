import gsap from "gsap"

// Framer Motion Variants for Apple-inspired fluid animations
export const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2 } },
}

export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
}

export const cardVariant = {
  initial: { opacity: 0, y: 16, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.2 } },
}

export const modalVariant = {
  initial: { opacity: 0, scale: 0.94, y: 20 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 12,
    transition: { duration: 0.2, ease: "easeIn" },
  },
}

export const backdropVariant = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

// GSAP special micro-animations
export const triggerGlowPulse = (element) => {
  if (!element) return
  gsap.fromTo(
    element,
    { boxShadow: "0 0 0px rgba(56, 189, 248, 0)" },
    {
      boxShadow: "0 0 35px rgba(56, 189, 248, 0.4)",
      duration: 0.6,
      yoyo: true,
      repeat: 1,
      ease: "power2.out",
    }
  )
}

export const triggerNumberRoll = (element, targetValue, duration = 1.2) => {
  if (!element) return
  const obj = { val: 0 }
  gsap.to(obj, {
    val: targetValue,
    duration,
    ease: "power2.out",
    onUpdate: () => {
      element.innerText = Math.round(obj.val).toLocaleString()
    },
  })
}
