import { motion } from "framer-motion";
import type { ReactNode } from "react";

const MotionWrapper = ({
  children,
  direction,
  initialOffset,
}: {
  children: ReactNode;
  direction?: "x" | "y";
  initialOffset?: number;
}) => (
  <motion.div
    variants={{
      hidden: { [direction || "y"]: [initialOffset || -50], opacity: 0 },
      show: {
        [direction || "y"]: 0,
        opacity: 1,
      },
    }}
    transition={{
      duration: 1,
      ease: "easeInOut",
    }}
  >
    {children}
  </motion.div>
);

export default MotionWrapper;
