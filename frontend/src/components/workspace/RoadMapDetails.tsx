import { Stack, Typography } from "@mui/material";

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
  nodeDetail: NodeDetail;
}

const RoadMapDetails = (props: RoadMapDetailsProps) => {
  const { nodeDetail } = props;

  return (
    <Stack gap={2} p={2}>
      {nodeDetail.overview && (
        <>
          <Typography variant="subtitle1" fontWeight="bold">
            개요
          </Typography>
          <Typography variant="body2">{nodeDetail.overview}</Typography>
        </>
      )}
      {nodeDetail.importance && (
        <>
          <Typography variant="subtitle1" fontWeight="bold">
            중요성
          </Typography>
          <Typography variant="body2">{nodeDetail.importance}</Typography>
        </>
      )}
      {nodeDetail.applications && (
        <>
          <Typography variant="subtitle1" fontWeight="bold">
            활용 분야
          </Typography>
          <Typography variant="body2">{nodeDetail.applications}</Typography>
        </>
      )}
      {nodeDetail.resources && Array.isArray(nodeDetail.resources) && (
        <>
          <Typography variant="subtitle1" fontWeight="bold">
            학습 자료
          </Typography>
          <ul>
            {nodeDetail.resources.map(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (r: any, idx: number) => (
                <li key={idx}>
                  <a href={r.url} target="_blank" rel="noopener noreferrer">
                    {r.title}
                  </a>
                  {r.type && ` (${r.type})`}
                </li>
              )
            )}
          </ul>
        </>
      )}
      {nodeDetail.examInfo && (
        <>
          <Typography variant="subtitle1" fontWeight="bold">
            자격증 정보
          </Typography>
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
                >
                  {nodeDetail.examInfo.registrationUrl}
                </a>
              </>
            )}
          </Typography>
        </>
      )}
    </Stack>
  );
};

export default RoadMapDetails;
