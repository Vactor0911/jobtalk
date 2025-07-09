import { Box, useTheme } from "@mui/material";
import roadmapData from "../../assets/roadmap_test.json";
import { ReactFlow } from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useState } from "react";

// 로드맵 데이터 타입
interface NodeData {
  id: number | string;
  title: string;
  parent_id: number | string | null;
  isOptional?: boolean;
}

// 노드 데이터 타입
interface Node {
  id: string;
  data: { label: string };
  position: { x: number; y: number };
  style: {
    backgroundColor: string;
    color: string;
  };
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

  // 노드 구성
  const createNodes = useCallback(
    (data: NodeData[]) => {
      const nodes = data.map((node) => ({
        id: `node-${node.id}`,
        data: { label: node.title },
        position: { x: 0, y: 0 }, // 초기 위치는 나중에 조정
        style: {
          backgroundColor: theme.palette.secondary.main,
          color: "black",
        },
      }));
      return nodes;
    },
    [theme]
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

  return (
    <Box width="100%" height="100%">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={(event, node) => {
          console.log("Node clicked:", event, node);
        }}
        fitView
      />
    </Box>
  );
};

export default RoadMapViewer;
