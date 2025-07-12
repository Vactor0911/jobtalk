import { Skeleton, Stack, Typography, useTheme } from "@mui/material";

// 노드 상세정보 인터페이스
export interface NodeDetail {
  overview?: string;
  importance?: string;
  applications?: string;
  resources?: { url: string; title: string; type?: string }[];
  others?: {
    organization?: string;
    url?: string;
  };
}

interface RoadMapDetailsProps {
  nodeDetail?: NodeDetail | null;
  loading?: boolean;
}

const RoadMapDetails = (props: RoadMapDetailsProps) => {
  const { nodeDetail, loading } = props;

  const theme = useTheme();

  // 노드 상세정보 데이터가 부적절하거나 로딩 중이면 스켈레톤 UI 렌더링
  if (loading || !nodeDetail) {
    return (
      <Stack gap={2} padding={2}>
        <Stack>
          <Skeleton variant="text" width="10%" animation="wave" />
          <Skeleton
            variant="rounded"
            width="100%"
            height="80px"
            animation="wave"
          />
        </Stack>
        <Stack>
          <Skeleton variant="text" width="13%" animation="wave" />
          <Skeleton
            variant="rounded"
            width="100%"
            height="120px"
            animation="wave"
          />
        </Stack>
        <Stack>
          <Skeleton variant="text" width="16%" animation="wave" />
          <Skeleton
            variant="rounded"
            width="100%"
            height="50px"
            animation="wave"
          />
        </Stack>
      </Stack>
    );
  }

  // 노드 상세정보 렌더링
  return (
    <Stack gap={3} padding={2}>
      {/* 개요 */}
      {nodeDetail.overview && (
        <Stack>
          {/* 헤더 */}
          <Typography variant="subtitle1" fontWeight="bold">
            개요
          </Typography>

          {/* 내용 */}
          <Typography variant="body2">{nodeDetail.overview}</Typography>
        </Stack>
      )}

      {/* 중요성 */}
      {nodeDetail.importance && (
        <Stack>
          {/* 헤더 */}
          <Typography variant="subtitle1" fontWeight="bold">
            중요성
          </Typography>

          {/* 내용 */}
          <Typography variant="body2">{nodeDetail.importance}</Typography>
        </Stack>
      )}

      {/* 활용 분야 */}
      {nodeDetail.applications && (
        <Stack>
          {/* 헤더 */}
          <Typography variant="subtitle1" fontWeight="bold">
            활용 분야
          </Typography>

          {/* 내용 */}
          <Typography variant="body2">{nodeDetail.applications}</Typography>
        </Stack>
      )}

      {/* 학습 자료 */}
      {nodeDetail.resources && Array.isArray(nodeDetail.resources) && (
        <Stack>
          {/* 헤더 */}
          <Typography variant="subtitle1" fontWeight="bold">
            학습 자료
          </Typography>

          {/* 내용 */}
          <ul css={{ margin: 0, paddingLeft: 20 }}>
            {nodeDetail.resources.map(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (r: any, idx: number) => (
                <li
                  key={idx}
                  css={{
                    fontSize: theme.typography.body2.fontSize,
                  }}
                >
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    css={{
                      color: theme.palette.primary.main,
                    }}
                  >
                    {r.title}
                  </a>
                  {r.type && ` (${r.type})`}
                </li>
              )
            )}
          </ul>
        </Stack>
      )}

      {/* 추가 정보 */}
      {nodeDetail.others &&
        nodeDetail.others.organization &&
        nodeDetail.others.url && (
          <Stack>
            {/* 헤더 */}
            <Typography variant="subtitle1" fontWeight="bold">
              추가 정보
            </Typography>

            {/* 내용 */}
            <Typography variant="body2">
              {nodeDetail.others.organization &&
                `기관: ${nodeDetail.others.organization}`}
              <br />
              {nodeDetail.others.url && (
                <>
                  링크:{" "}
                  <a
                    href={nodeDetail.others.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    css={{
                      color: theme.palette.primary.main,
                    }}
                  >
                    {nodeDetail.others.url}
                  </a>
                </>
              )}
            </Typography>
          </Stack>
        )}
    </Stack>
  );
};

export default RoadMapDetails;
