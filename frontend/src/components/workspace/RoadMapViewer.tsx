import { Box, Paper, Stack, Typography, useTheme } from "@mui/material";
import { Controls, ReactFlow, type ReactFlowInstance } from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useRef, useState } from "react";
import type { JSX } from "@emotion/react/jsx-runtime";
import { useParams } from "react-router";
import axiosInstance from "../../utils/axiosInstance";

// 로드맵 데이터 타입
interface NodeData {
  id: number | string;
  title: string;
  parent_id: number | string | null;
  isOptional?: boolean;
  category?: string;
}

// 노드 데이터 타입
interface Node {
  id: string;
  type?: string;
  data: { label: JSX.Element | string };
  position: { x: number; y: number };
  style: {
    backgroundColor: string;
    border: string;
    color: string;
    boxShadow?: string;
  };
  width?: number;
}

// 엣지 데이터 타입
interface Edge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
}

const RoadMapViewer = ({
  onNodeDetail,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onNodeDetail: (detail: any, loading: boolean) => void;
}) => {
  const theme = useTheme();
  const { uuid } = useParams<{ uuid: string }>(); // URL에서 워크스페이스 UUID 가져오기

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [roadmapData, setRoadmapData] = useState<NodeData[]>([]);
  const reactFlowInstance = useRef<ReactFlowInstance<Node, Edge> | null>(null);

  // DB에서 로드맵 데이터 조회
  useEffect(() => {
    const fetchRoadmap = async () => {
      if (!uuid) return;
      try {
        const response = await axiosInstance.get(`/workspace/${uuid}/roadmap`);
        if (response.data.success && response.data.data?.roadmapData) {
          setRoadmapData(response.data.data.roadmapData);
        } else {
          setRoadmapData([]);
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        setRoadmapData([]);
      }
    };
    fetchRoadmap();
  }, [uuid]);

  // 노드 배경색 추출
  const getNodeBackgroundColor = useCallback(
    (category: string) => {
      switch (category) {
        case "job":
        case "stage":
          return theme.palette.primary.main;
        case "certificate":
          return theme.palette.secondary.main;
        default:
          return "inherit"; // 기본 배경색
      }
    },
    [theme.palette]
  );

  // 노드 구성
  const createNodes = useCallback(
    (data: NodeData[]) => {
      const nodes: Node[] = data.map((node) => ({
        id: `node-${node.id}`,
        data: {
          label:
            node.category === "job" || node.category === "stage" ? (
              <div
                css={{
                  display: "flex",
                  height: "100%",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <span
                  css={{
                    fontSize: "1rem",
                    fontWeight: "bold",
                    color: "white",
                    wordBreak: "keep-all",
                    textWrap: "balance",
                  }}
                >
                  {node.title}
                </span>
              </div>
            ) : (
              <div
                css={{
                  display: "flex",
                  height: "100%",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <span
                  css={{
                    wordBreak: "keep-all",
                    textWrap: "balance",
                  }}
                >
                  {node.title}
                </span>
              </div>
            ),
        },
        position: { x: 0, y: 0 }, // 초기 위치는 나중에 조정
        width: 150,
        style: {
          padding: "10px 0",
          backgroundColor: getNodeBackgroundColor(node.category || "default"),
          border:
            node.category === "skill"
              ? `2px solid ${theme.palette.primary.main}`
              : "2px solid black",
          color:
            node.category === "job" || node.category === "stage"
              ? "white"
              : "black",
        },
      }));

      // 자식 노드가 없는 노드의 타입을 "output"으로 설정
      const parentIdSet = new Set(
        data.map((n) => n.parent_id).filter((id) => id !== null)
      );
      nodes.forEach((node) => {
        const nodeData = data.find((d) => `node-${d.id}` === node.id);

        if (!nodeData) {
          // 노드 데이터가 없는 경우
          return;
        } else if (nodeData.category === "job") {
          // category가 "job"인 경우
          node.type = "input";
        } else if (!parentIdSet.has(nodeData.id)) {
          // 자식 노드가 없는 경우
          node.type = "output";
        }
      });

      return nodes;
    },
    [getNodeBackgroundColor, theme.palette.primary.main]
  );

  // 노드 위치 조정
  const adjustNodePositions = useCallback(
    (nodes: Node[]) => {
      // id와 parent_id 매핑
      const idToNode = new Map();
      roadmapData.forEach((node: NodeData) =>
        idToNode.set(`node-${node.id}`, node)
      );

      // 트리 구조 생성 (children 정보 추가)
      const childrenMap: Record<string, string[]> = {};
      roadmapData.forEach((node) => {
        if (node.parent_id) {
          const parentKey = `node-${node.parent_id}`;
          if (!childrenMap[parentKey]) childrenMap[parentKey] = [];
          childrenMap[parentKey].push(`node-${node.id}`);
        }
      });

      // 루트 노드 찾기
      const rootNodes = nodes.filter((node) => {
        const data = idToNode.get(node.id);
        return !data?.parent_id;
      });

      // 재귀적으로 위치 계산
      let currentX = 0;
      const nodePositions: Record<string, { x: number; y: number }> = {};

      const setPositions = (nodeId: string, depth: number) => {
        const children = childrenMap[nodeId] || [];

        if (children.length === 0) {
          // 리프 노드를 현재 x에 위치
          nodePositions[nodeId] = { x: currentX * 200, y: depth * 150 };
          currentX += 1;
        } else {
          // 자식 먼저 배치
          const childXs: number[] = [];
          children.forEach((childId) => {
            setPositions(childId, depth + 1);
            childXs.push(nodePositions[childId].x);
          });
          // 부모는 자식들의 x의 중앙에 위치
          const minX = Math.min(...childXs);
          const maxX = Math.max(...childXs);
          nodePositions[nodeId] = { x: (minX + maxX) / 2, y: depth * 150 };
        }
      };

      rootNodes.forEach((node) => setPositions(node.id, 0));

      // 노드에 position 할당
      return nodes.map((node) => ({
        ...node,
        position: nodePositions[node.id] || { x: 0, y: 0 },
      }));
    },
    [roadmapData]
  );

  // 엣지 구성
  const createEdges = useCallback((data: NodeData[]) => {
    return data.map((node, index) => ({
      id: `edge-${index}`,
      source: `node-${node.parent_id}`,
      target: `node-${node.id}`,
      animated: node.isOptional || false,
    }));
  }, []);

  // 노드로 시점 이동
  const fitViewToNode = useCallback((nodeId: string, zoomLevel = 1.5) => {
    // reactFlowInstance 참조
    const instance = reactFlowInstance.current;
    if (!instance) return;

    // 선택한 노드 가져오기
    const node = instance.getNode(nodeId);
    if (!node) return;

    // 노드를 가운데로 이동
    const centerX = node.position.x + (node.width ? node.width / 2 : 0);
    const centerY = node.position.y;

    instance.setCenter(centerX, centerY, { zoom: zoomLevel, duration: 800 });
  }, []);

  useEffect(() => {
    // 노드 생성
    const newNodes = createNodes(roadmapData);
    const adjustedNodes = adjustNodePositions(newNodes);
    setNodes(adjustedNodes);

    // 엣지 생성
    const newEdges = createEdges(roadmapData);
    setEdges(newEdges);
  }, [adjustNodePositions, createEdges, createNodes, roadmapData]);

  // 노드 클릭 핸들러
  const handleNodeClick = useCallback(
    async (_: unknown, node: Node) => {
      fitViewToNode(node.id); // 1. 시점 이동

      // 노드의 카테고리가 "job" 또는 "stage"인 경우 상세정보를 불러오지 않음
      const selectedNode = roadmapData.find(
        (n) =>
          `node-${n.id}` === node.id &&
          n.category !== "job" &&
          n.category !== "stage"
      );
      if (!selectedNode) {
        onNodeDetail(null, false); // 상세정보 없음
        return;
      }

      // 상세정보 API 호출
      const nodeId = node.id.replace("node-", "");
      onNodeDetail(null, true); // 로딩 시작

      try {
        const response = await axiosInstance.post("/chat/roadmap/node/detail", {
          workspace_uuid: uuid,
          node_id: nodeId,
          title: selectedNode.title,
        });
        if (response.data.success && response.data.data?.nodeDetail) {
          onNodeDetail(response.data.data.nodeDetail, false);
        } else if (response.status === 204) {
          return;
        } else {
          onNodeDetail({ overview: "세부 정보를 불러오지 못했습니다." }, false);
        }
      } catch {
        onNodeDetail({ overview: "세부 정보를 불러오지 못했습니다." }, false);
      }
    },
    [fitViewToNode, roadmapData, uuid, onNodeDetail]
  );

  return (
    <Box width="100%" height="100%" position="relative">
      {/* 로드맵 레전드 */}
      <Paper
        variant="outlined"
        sx={{
          position: "absolute",
          top: 10,
          left: 10,
          padding: 1,
          bgcolor: "#f6f6f6",
          zIndex: 2,
        }}
      >
        <Stack gap={0.75}>
          {/* 학습 단계 */}
          <Stack direction="row" gap={1} alignItems="center">
            <Box
              width="60px"
              height="30px"
              bgcolor={theme.palette.primary.main}
              border="2px solid black"
              borderRadius={1}
            />
            <Typography variant="subtitle1">학습 단계</Typography>
          </Stack>

          {/* 학습 내용 */}
          <Stack direction="row" gap={1} alignItems="center">
            <Box
              width="60px"
              height="30px"
              bgcolor="white"
              border={`2px solid ${theme.palette.primary.main}`}
              borderRadius={1}
            />
            <Typography variant="subtitle1">학습 내용</Typography>
          </Stack>

          {/* 자격증 */}
          <Stack direction="row" gap={1} alignItems="center">
            <Box
              width="60px"
              height="30px"
              bgcolor={theme.palette.secondary.main}
              border="2px solid black"
              borderRadius={1}
            />
            <Typography variant="subtitle1">자격증</Typography>
          </Stack>

          {/* 정규 학습 과정 */}
          <Stack direction="row" gap={1} alignItems="center">
            <Box width="60px" border="2px solid #b1b1b7" borderRadius={1} />
            <Typography variant="subtitle1">정규 과정</Typography>
          </Stack>

          {/* 선택 학습 과정 */}
          <Stack direction="row" gap={1} alignItems="center">
            <Box width="60px" border="2px dashed #b1b1b7" borderRadius={1} />
            <Typography variant="subtitle1">선택 학습 과정</Typography>
          </Stack>
        </Stack>
      </Paper>

      {/* 로드맵 플로우 */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onInit={(instance) => {
          reactFlowInstance.current = instance;
        }}
        onNodeClick={handleNodeClick}
        disableKeyboardA11y
        nodesConnectable={false}
        nodesDraggable={false}
        nodesFocusable={false}
        edgesFocusable={false}
        fitView
        fitViewOptions={{
          nodes: [{ id: "node-1" }],
          padding: 0.1,
          duration: 800,
          maxZoom: 0.75,
        }}
      >
        <Controls
          showInteractive={false}
          fitViewOptions={{
            nodes: [{ id: "node-1" }],
            padding: 0.1,
            duration: 800,
            maxZoom: 0.75,
          }}
        />
      </ReactFlow>
    </Box>
  );
};

export default RoadMapViewer;
