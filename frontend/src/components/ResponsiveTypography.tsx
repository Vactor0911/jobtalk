import { Typography, useTheme, type TypographyProps } from "@mui/material";

// 반응형 타이포그래피 컴포넌트
interface ResponsiveTypographyProps extends TypographyProps {
  step?: number;
}

const ResponsiveTypography = (props: ResponsiveTypographyProps) => {
  const { variant, sx, step = 1, ...others } = props;
  const theme = useTheme();

  const dictVariant: Record<string, number> = {
    h1: 7,
    h2: 6,
    h3: 5,
    h4: 4,
    h5: 3,
    h6: 2,
    subtitle1: 1,
    subtitle2: 0,
  };

  const getSmallerVariant = (variant: string | undefined, step: number) => {
    const variantIndex = dictVariant[variant || "subtitle2"];
    const smallerIndex = Math.max(variantIndex - step, 0);
    return Object.keys(dictVariant).find(
      (key) => dictVariant[key] === smallerIndex
    );
  };

  const getVariantFontSize = (variant: string | undefined) => {
    switch (variant) {
      case "h1":
        return theme.typography.h1.fontSize;
      case "h2":
        return theme.typography.h2.fontSize;
      case "h3":
        return theme.typography.h3.fontSize;
      case "h4":
        return theme.typography.h4.fontSize;
      case "h5":
        return theme.typography.h5.fontSize;
      case "h6":
        return theme.typography.h6.fontSize;
      case "subtitle1":
        return theme.typography.subtitle1.fontSize;
      case "subtitle2":
        return theme.typography.subtitle2.fontSize;
      default:
        return undefined;
    }
  };

  return (
    <Typography
      variant={variant}
      sx={{
        fontSize: {
          xs: getVariantFontSize(getSmallerVariant(variant, step)),
          md: getVariantFontSize(variant),
        },
        ...sx,
      }}
      {...others}
    />
  );
};

export default ResponsiveTypography;
