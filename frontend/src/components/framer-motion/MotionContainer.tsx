import { motion } from "framer-motion";
import type { ReactNode } from "react";

// 스크롤 애니메이션 container
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.75,
      staggerDirection: 1,
    },
  },
};

const MotionContainer = ({ children }: { children: ReactNode }) => (
  <motion.div
    initial="hidden"
    whileInView="show"
    variants={containerVariants}
    viewport={{ once: true }}
    css={{
      width: "100%",
      height: "100%",
    }}
  >
    {children}
  </motion.div>
);

export default MotionContainer;
