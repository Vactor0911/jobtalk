import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

interface MotionWrapperProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  direction?: "x" | "y"; // 방향 설정, 기본값은 'y'
  initialOffset?: number; // 초기 오프셋, 기본값은 -50
}

const MotionWrapper = (props: MotionWrapperProps) => {
  const { children, direction, initialOffset, ...others } = props;

  return (
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
      {...others}
    >
      {children}
    </motion.div>
  );
};

export default MotionWrapper;
