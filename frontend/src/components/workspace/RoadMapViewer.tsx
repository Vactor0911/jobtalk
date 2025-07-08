import { Box, useTheme } from "@mui/material";
import roadmapData from "../../assets/roadmap_test.json";
import { ReactFlow } from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useState } from "react";

const initialNodes = [
  { id: "1", position: { x: 0, y: 0 }, data: { label: "1" } },
  { id: "2", position: { x: 0, y: 100 }, data: { label: "2" } },
];
const initialEdges = [{ id: "e1-2", source: "1", target: "2" }];

const RoadMapViewer = () => {
  const theme = useTheme();

  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  // 노드 구성하기
  const createNodes = useCallback(
    (data: unknown[]) => {
      const nodes = data.map((node, index) => ({
        id: `node-${node.id}`,
        position: { x: index * 50, y: index * 50 },
        data: { label: node.title },
        style: {
          backgroundColor: theme.palette.secondary.main,
          color: "black",
        },
      }));
      return nodes;
    },
    [theme]
  );

  // 엣지 구성하기
  const createEdges = useCallback((data: unknown[]) => {
    return data.map((edge, index) => ({
      id: `edge-${index}`,
      source: `node-${edge.parent_id}`,
      target: `node-${edge.id}`,
      animated: edge.isOptional || false,
    }));
  }, []);

  useEffect(() => {
    setNodes(createNodes(roadmapData));
    setEdges(createEdges(roadmapData));
  }, [createEdges, createNodes]);

  return (
    <Box width="100%" height="100%">
      <ReactFlow
        defaultNodes={createNodes(roadmapData)}
        edges={createEdges(roadmapData)}
        onNodeClick={(event, node) => {
          console.log("Node clicked:", event, node);
        }}
        fitView
      />
    </Box>
  );
};

export default RoadMapViewer;
