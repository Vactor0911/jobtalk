import { Skeleton, Stack, Typography, useTheme } from "@mui/material";

// 노드 세부사항 인터페이스
export interface NodeDetail {
  overview?: string;
  importance?: string;
  applications?: string;
  resources?: { url: string; title: string; type?: string }[];
  examInfo?: {
    organization?: string;
    registrationUrl?: string;
  };
}

interface RoadMapDetailsProps {
  nodeDetail?: NodeDetail | null;
  loading?: boolean;
}

const RoadMapDetails = (props: RoadMapDetailsProps) => {
  const { nodeDetail, loading } = props;

  const theme = useTheme();

  // 노드 세부사항 데이터가 부적절하거나 로딩 중이면 스켈레톤 UI 렌더링
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

  // 노드 세부사항 렌더링
  return (
    <Stack gap={3} padding={2}>
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
      {nodeDetail.examInfo && (
        <Stack>
          {/* 헤더 */}
          <Typography variant="subtitle1" fontWeight="bold">
            자격증 정보
          </Typography>

          {/* 내용 */}
          <Typography variant="body2">
            {nodeDetail.examInfo.organization &&
              `기관: ${nodeDetail.examInfo.organization}`}
            <br />
            {nodeDetail.examInfo.registrationUrl && (
              <>
                접수:{" "}
                <a
                  href={nodeDetail.examInfo.registrationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  css={{
                    color: theme.palette.primary.main,
                  }}
                >
                  {nodeDetail.examInfo.registrationUrl}
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
