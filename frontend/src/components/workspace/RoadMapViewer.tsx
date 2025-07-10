import { Box, useTheme } from "@mui/material";
import roadmapData from "../../assets/roadmap_test.json";
import { Controls, ReactFlow, type ReactFlowInstance } from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useRef, useState } from "react";
import type { JSX } from "@emotion/react/jsx-runtime";

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
  height?: number;
}

// 엣지 데이터 타입
interface Edge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
}

const RoadMapViewer = () => {
  const theme = useTheme();

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const reactFlowInstance = useRef<ReactFlowInstance<Node, Edge> | null>(null);

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
                  css={{ fontSize: "1rem", fontWeight: "bold", color: "white" }}
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
                <span>{node.title}</span>
              </div>
            ),
        },
        position: { x: 0, y: 0 }, // 초기 위치는 나중에 조정
        width: 150,
        height: 40,
        style: {
          padding: "0",
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
  const adjustNodePositions = useCallback((nodes: Node[]) => {
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
  }, []);

  // 엣지 구성
  const createEdges = useCallback((data: NodeData[]) => {
    return data.map((node, index) => ({
      id: `edge-${index}`,
      source: `node-${node.parent_id}`,
      target: `node-${node.id}`,
      animated: node.isOptional || false,
    }));
  }, []);

  useEffect(() => {
    // 노드 생성
    const newNodes = createNodes(roadmapData);
    const adjustedNodes = adjustNodePositions(newNodes);
    setNodes(adjustedNodes);

    // 엣지 생성
    const newEdges = createEdges(roadmapData);
    setEdges(newEdges);
  }, [adjustNodePositions, createEdges, createNodes]);

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
    const centerY = node.position.y + (node.height ? node.height / 2 : 0);

    instance.setCenter(centerX, centerY, { zoom: zoomLevel, duration: 800 });
  }, []);

  return (
    <Box width="100%" height="100%">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onInit={(instance) => {
          reactFlowInstance.current = instance;

          const firstJob = roadmapData.find((n) => n.category === "job");
          if (firstJob) fitViewToNode(`node-${firstJob.id}`, 1);
        }}
        onNodeClick={(_, node) => fitViewToNode(node.id)}
        fitView
        disableKeyboardA11y
        nodesConnectable={false}
        nodesDraggable={false}
        nodesFocusable={false}
      >
        <Controls />
      </ReactFlow>
    </Box>
  );
};

export default RoadMapViewer;
