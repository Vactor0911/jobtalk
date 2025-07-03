import type { ReactNode } from "react";
import { Link } from "react-router-dom";

// 링크 컴포넌트
interface PlainLinkProps {
  to: string;
  children: ReactNode;
}

const PlainLink = (props: PlainLinkProps) => {
  const { to, children, ...others } = props;

  return (
    <Link
      to={to}
      {...others}
      css={{
        textDecoration: "none",
      }}
    >
      {children}
    </Link>
  );
};

export default PlainLink;
