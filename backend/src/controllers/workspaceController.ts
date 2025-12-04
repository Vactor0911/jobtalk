import { Request, Response } from "express";
import { dbPool } from "../config/db";
import { getRandWorkspaceName } from "../utils";

// 사용자의 모든 워크스페이스 조회
export const getAllWorkspaces = async (req: Request, res: Response) => {
  try {
    const user = req.user as { userUuid: string };

    if (!user || !user.userUuid) {
      res.status(401).json({
        success: false,
        message: "인증 정보가 유효하지 않습니다.",
      });
      return;
    }

    const workspaces = await dbPool.query(
      `SELECT 
        id,
        workspace_uuid,
        name,
        status,
        chat_topic,
        interest_category,
        created_at,
        updated_at
       FROM workspace 
       WHERE user_uuid = ? AND is_active = TRUE 
       ORDER BY created_at ASC`,
      [user.userUuid]
    );

    res.status(200).json({
      success: true,
      totalCount: workspaces.length,
      data: {
        workspaces: workspaces.map((workspace: any) => ({
          id: workspace.id,
          uuid: workspace.workspace_uuid,
          name: workspace.name,
          status: workspace.status,
          chatTopic: workspace.chat_topic,
          interestCategory: workspace.interest_category,
          createdAt: workspace.created_at,
          updatedAt: workspace.updated_at,
        })),
      },
      message: "워크스페이스 목록 조회를 완료했습니다.",
    });
  } catch (error: any) {
    console.error("워크스페이스 조회 오류:", error.message);
    res.status(500).json({
      success: false,
      message: "워크스페이스 조회에 실패했습니다.",
      error: error.message,
    });
  }
};

// 특정 워크스페이스 조회
export const getWorkspaceByUuid = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;
    const user = req.user as { userUuid: string };

    const workspaces = await dbPool.query(
      `SELECT 
        w.id,
        w.workspace_uuid,
        w.name,
        w.status,
        w.chat_topic,
        w.interest_category,
        w.created_at,
        w.updated_at,
        r.id AS roadmap_id,
        r.job_title,
        r.roadmap_data
       FROM workspace w
       LEFT JOIN workspace_roadmaps r ON w.workspace_uuid = r.workspace_uuid
       WHERE w.workspace_uuid = ? AND w.user_uuid = ? AND w.is_active = TRUE`,
      [uuid, user.userUuid]
    );

    if (workspaces.length === 0) {
      res.status(404).json({
        success: false,
        message: "워크스페이스를 찾을 수 없습니다.",
      });
      return;
    }

    const workspace = workspaces[0];

    // 로드맵 데이터 처리
    const roadmapData = workspace.roadmap_data
      ? {
          id: workspace.roadmap_id,
          jobTitle: workspace.job_title,
          data: JSON.parse(workspace.roadmap_data),
        }
      : null;

    res.status(200).json({
      success: true,
      data: {
        workspace: {
          id: workspace.id,
          uuid: workspace.workspace_uuid,
          name: workspace.name,
          status: workspace.status,
          chatTopic: workspace.chat_topic,
          interestCategory: workspace.interest_category,
          createdAt: workspace.created_at,
          updatedAt: workspace.updated_at,
          roadmap: roadmapData,
        },
      },
      message: "워크스페이스 조회를 완료했습니다.",
    });
  } catch (error: any) {
    console.error("워크스페이스 조회 오류:", error.message);
    res.status(500).json({
      success: false,
      message: "워크스페이스 조회에 실패했습니다.",
      error: error.message,
    });
  }
};

// 워크스페이스 대화 기록 조회
export const getWorkspaceChats = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;
    const user = req.user as { userUuid: string };

    // 해당 워크스페이스 존재 및 권한 확인
    const workspaces = await dbPool.query(
      "SELECT id, force_recommend_count FROM workspace WHERE workspace_uuid = ? AND user_uuid = ? AND is_active = TRUE",
      [uuid, user.userUuid]
    );

    if (workspaces.length === 0) {
      res.status(404).json({
        success: false,
        message: "워크스페이스를 찾을 수 없거나 권한이 없습니다.",
      });
      return;
    }

    const workspaceId = workspaces[0].id;
    const forceRecommendCount = workspaces[0].force_recommend_count ?? 0;
    const isRecommendLimit = forceRecommendCount >= 3;

    // 대화 기록 조회
    const chats = await dbPool.query(
      `SELECT 
        id, 
        role, 
        content, 
        previous_response_id, 
        message_index, 
        created_at 
       FROM workspace_chats 
       WHERE workspace_id = ? 
       ORDER BY message_index ASC, created_at ASC`,
      [workspaceId]
    );

    res.status(200).json({
      success: true,
      totalCount: chats.length,
      data: {
        chats: chats.map((chat: any) => ({
          id: chat.id,
          role: chat.role,
          content: chat.content,
          previousResponseId: chat.previous_response_id,
          messageIndex: chat.message_index,
          createdAt: chat.created_at,
        })),
        isRecommendLimit,
      },
      message: "워크스페이스 대화 기록 조회를 완료했습니다.",
    });
  } catch (error: any) {
    console.error("워크스페이스 대화 기록 조회 오류:", error.message);
    res.status(500).json({
      success: false,
      message: "워크스페이스 대화 기록 조회에 실패했습니다.",
      error: error.message,
    });
  }
};

// 워크스페이스 대화 저장
export const saveWorkspaceChat = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;
    const { role, content, previousResponseId } = req.body;
    const user = req.user as { userUuid: string };

    // 필수 입력값 확인
    if (!role || !content) {
      res.status(400).json({
        success: false,
        message: "역할과 내용은 필수 입력값입니다.",
      });
      return;
    }

    // 올바른 역할 확인
    if (!["user", "JobtalkAI"].includes(role)) {
      res.status(400).json({
        success: false,
        message: "역할은 user 또는 JobtalkAI만 가능합니다.",
      });
      return;
    }

    // 워크스페이스 확인 및 권한 검증
    const workspaces = await dbPool.query(
      "SELECT id FROM workspace WHERE workspace_uuid = ? AND user_uuid = ? AND is_active = TRUE",
      [uuid, user.userUuid]
    );

    if (workspaces.length === 0) {
      res.status(404).json({
        success: false,
        message: "워크스페이스를 찾을 수 없거나 권한이 없습니다.",
      });
      return;
    }

    const workspaceId = workspaces[0].id;

    // 현재 메시지 인덱스 조회
    const lastMessageResult = await dbPool.query(
      "SELECT MAX(message_index) as last_index FROM workspace_chats WHERE workspace_id = ?",
      [workspaceId]
    );

    const lastIndex = lastMessageResult[0].last_index || 0;
    const nextIndex = lastIndex + 1;

    // 새 대화 저장
    const result = await dbPool.query(
      `INSERT INTO workspace_chats 
   (workspace_id, role, content, previous_response_id, message_index, workspace_uuid) 
   VALUES (?, ?, ?, ?, ?, ?)`,
      [
        workspaceId,
        role,
        content,
        previousResponseId ? String(previousResponseId) : null,
        nextIndex,
        uuid,
      ]
    );

    // 워크스페이스 상태 업데이트 (대화 중으로)
    await dbPool.query(
      "UPDATE workspace SET status = 'chatting', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [workspaceId]
    );

    res.status(201).json({
      success: true,
      data: {
        id: Number(result.insertId),
        role,
        content,
        previousResponseId,
        messageIndex: nextIndex,
      },
      message: "대화가 저장되었습니다.",
    });
  } catch (error: any) {
    console.error("대화 저장 오류:", error.message);
    res.status(500).json({
      success: false,
      message: "대화 저장에 실패했습니다.",
      error: error.message,
    });
  }
};

// 로드맵 챗봇 대화 저장
export const saveRoadmapChatbotChat = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;
    const { role, content } = req.body;
    if (!uuid || !role || !content) {
      res.status(400).json({ success: false, message: "필수값 누락" });
      return;
    }

    // workspaceUuid로 roadmapUuid 조회
    const [roadmapRow] = await dbPool.query(
      "SELECT roadmap_uuid FROM workspace_roadmaps WHERE workspace_uuid = ? ORDER BY created_at DESC LIMIT 1",
      [uuid]
    );
    if (!roadmapRow || !roadmapRow.roadmap_uuid) {
      res.status(404).json({ success: false, message: "로드맵이 없습니다." });
      return;
    }
    const roadmapUuid = roadmapRow.roadmap_uuid;

    await dbPool.query(
      `INSERT INTO roadmap_chatbot_chats (workspace_uuid, roadmap_uuid, role, content) VALUES (?, ?, ?, ?)`,
      [uuid, roadmapUuid, role, content]
    );
    res.status(201).json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 로드맵 챗봇 대화 조회
export const getRoadmapChatbotChats = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;
    if (!uuid) {
      res.status(400).json({ success: false, message: "필수값 누락" });
      return;
    }

    // workspaceUuid로 roadmapUuid 조회
    const [roadmapRow] = await dbPool.query(
      "SELECT roadmap_uuid FROM workspace_roadmaps WHERE workspace_uuid = ? ORDER BY created_at DESC LIMIT 1",
      [uuid]
    );
    if (!roadmapRow || !roadmapRow.roadmap_uuid) {
      res.status(404).json({ success: false, message: "로드맵이 없습니다." });
      return;
    }
    const roadmapUuid = roadmapRow.roadmap_uuid;

    const chats = await dbPool.query(
      `SELECT id, role, content, created_at FROM roadmap_chatbot_chats WHERE workspace_uuid = ? AND roadmap_uuid = ? ORDER BY created_at ASC`,
      [uuid, roadmapUuid]
    );
    res.status(200).json({ success: true, data: chats });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 워크스페이스 이름 업데이트 (챗봇 대화 시작 시)
export const updateWorkspaceForChat = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;
    const { chatTopic } = req.body; // 대화 주제
    const user = req.user as { userUuid: string };

    if (!chatTopic || typeof chatTopic !== "string") {
      res.status(400).json({
        success: false,
        message: "유효한 대화 주제를 입력해주세요.",
      });
      return;
    }

    // 워크스페이스 소유자 확인
    const workspaces = await dbPool.query(
      "SELECT id, status FROM workspace WHERE workspace_uuid = ? AND user_uuid = ? AND is_active = TRUE",
      [uuid, user.userUuid]
    );

    if (workspaces.length === 0) {
      res.status(404).json({
        success: false,
        message: "워크스페이스를 찾을 수 없거나 권한이 없습니다.",
      });
      return;
    }

    if (workspaces[0].status === "roadmap_generated") {
      // 이미 로드맵 생성된 워크스페이스는 상태/이름 변경하지 않음
      res.status(200).json({
        success: true,
        message: "이미 로드맵이 생성된 워크스페이스입니다.",
        data: {
          name: workspaces[0].name,
          status: workspaces[0].status,
          chatTopic,
        },
      });
      return;
    }

    // 새로운 이름과 상태 설정
    const newName = `${chatTopic}에 대해 상담 중 💬`;

    // 워크스페이스 업데이트
    await dbPool.query(
      `UPDATE workspace 
       SET name = ?, status = 'chatting', chat_topic = ?, updated_at = CURRENT_TIMESTAMP
       WHERE workspace_uuid = ? AND user_uuid = ?`,
      [newName, chatTopic, uuid, user.userUuid]
    );

    res.status(200).json({
      success: true,
      message: "워크스페이스가 대화 모드로 업데이트되었습니다.",
      data: {
        name: newName,
        status: "chatting",
        chatTopic,
      },
    });
  } catch (error: any) {
    console.error("워크스페이스 대화 모드 업데이트 오류:", error.message);
    res.status(500).json({
      success: false,
      message: "워크스페이스 업데이트에 실패했습니다.",
      error: error.message,
    });
  }
};

// 워크스페이스 관심 분야 설정
export const updateWorkspaceInterest = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;
    const { interestCategory } = req.body;
    const user = req.user as { userUuid: string };

    if (!interestCategory) {
      res.status(400).json({
        success: false,
        message: "관심 분야를 입력해주세요.",
      });
      return;
    }

    // 워크스페이스 소유자 확인
    const workspaces = await dbPool.query(
      "SELECT id, name FROM workspace WHERE workspace_uuid = ? AND user_uuid = ? AND is_active = TRUE",
      [uuid, user.userUuid]
    );

    if (workspaces.length === 0) {
      res.status(404).json({
        success: false,
        message: "워크스페이스를 찾을 수 없거나 권한이 없습니다.",
      });
      return;
    }

    const workspaceId = workspaces[0].id;

    // 새 이름 설정 (기존 이름에 관심분야 추가)
    const newName = `${interestCategory} 분야 탐색하기 💼`;

    // 워크스페이스 업데이트
    await dbPool.query(
      `UPDATE workspace 
       SET interest_category = ?, name = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [interestCategory, newName, workspaceId]
    );

    res.status(200).json({
      success: true,
      message: "관심 분야가 성공적으로 설정되었습니다.",
      data: {
        interestCategory,
        name: newName,
      },
    });
  } catch (error: any) {
    console.error("관심 분야 설정 오류:", error.message);
    res.status(500).json({
      success: false,
      message: "관심 분야 설정에 실패했습니다.",
      error: error.message,
    });
  }
};

// 워크스페이스 기본 정보와 사용자 기본 정보 조회
export const getWorkspaceAndUserBasicInfo = async (
  req: Request,
  res: Response
) => {
  try {
    const { uuid } = req.params;
    const user = req.user as { userUuid: string };

    // 트랜잭션으로 쿼리 묶기
    const connection = await dbPool.getConnection();

    try {
      await connection.beginTransaction();

      // 1. 워크스페이스 정보 조회 (관심분야만)
      const workspaces = await connection.query(
        `SELECT 
          interest_category
         FROM workspace 
         WHERE workspace_uuid = ? AND user_uuid = ? AND is_active = TRUE`,
        [uuid, user.userUuid]
      );

      if (workspaces.length === 0) {
        res.status(404).json({
          success: false,
          message: "워크스페이스를 찾을 수 없거나 권한이 없습니다.",
        });
        return;
      }

      // 2. 사용자 정보 조회 (자격증, 이름, 프로필 이미지만)
      const users = await connection.query(
        `SELECT 
          name,
          certificates,
          profile_image
         FROM user
         WHERE user_uuid = ?`,
        [user.userUuid]
      );

      if (users.length === 0) {
        res.status(404).json({
          success: false,
          message: "사용자 정보를 찾을 수 없습니다.",
        });
        return;
      }

      await connection.commit();

      // 결과 반환
      res.status(200).json({
        success: true,
        data: {
          workspace: {
            interestCategory: workspaces[0].interest_category,
          },
          user: {
            name: users[0].name,
            certificates: users[0].certificates,
            profileImage: users[0].profile_image,
          },
        },
        message: "워크스페이스와 사용자 기본 정보를 성공적으로 조회했습니다.",
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error("워크스페이스/사용자 정보 조회 오류:", error.message);
    res.status(500).json({
      success: false,
      message: "정보 조회에 실패했습니다.",
      error: error.message,
    });
  }
};

// 워크스페이스 로드맵 저장
export const saveWorkspaceRoadmap = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params; // workspace_uuid
    const { jobTitle, roadmapData } = req.body;
    const user = req.user as { userUuid: string };
    const connection = await dbPool.getConnection();

    try {
      await connection.beginTransaction();

      // 필수 입력값 확인
      if (!jobTitle || !roadmapData) {
        res.status(400).json({
          success: false,
          message: "직업명과 로드맵 데이터는 필수입니다.",
        });
        return;
      }

      // 워크스페이스 소유자 확인
      const workspaces = await connection.query(
        "SELECT id FROM workspace WHERE workspace_uuid = ? AND user_uuid = ? AND is_active = TRUE",
        [uuid, user.userUuid]
      );

      if (workspaces.length === 0) {
        res.status(404).json({
          success: false,
          message: "워크스페이스를 찾을 수 없거나 권한이 없습니다.",
        });
        return;
      }

      // roadmapData가 JSON 문자열인지 확인하고 변환
      const roadmapDataJson =
        typeof roadmapData === "string"
          ? roadmapData
          : JSON.stringify(roadmapData);

      // 기존 로드맵이 있는지 확인
      const existingRoadmap = await connection.query(
        "SELECT id FROM workspace_roadmaps WHERE workspace_uuid = ?",
        [uuid]
      );

      if (existingRoadmap.length > 0) {
        // 기존 로드맵 UPDATE
        await connection.query(
          `UPDATE workspace_roadmaps 
           SET job_title = ?, roadmap_data = ?, created_at = CURRENT_TIMESTAMP
           WHERE workspace_uuid = ?`,
          [jobTitle, roadmapDataJson, uuid]
        );
      } else {
        // 새 로드맵 INSERT (roadmap_uuid는 uuid()로 생성)
        await connection.query(
          `INSERT INTO workspace_roadmaps 
           (workspace_uuid, job_title, roadmap_data)
           VALUES (?, ?, ?)`,
          [uuid, jobTitle, roadmapDataJson]
        );
      }

      // 워크스페이스 상태 및 이름 업데이트
      await connection.query(
        `UPDATE workspace 
         SET status = 'roadmap_generated', 
             name = CONCAT(?, ' 로드맵 💼'), 
             updated_at = CURRENT_TIMESTAMP
         WHERE workspace_uuid = ? AND user_uuid = ?`,
        [jobTitle, uuid, user.userUuid]
      );

      await connection.commit();

      res.status(200).json({
        success: true,
        message: "로드맵이 성공적으로 저장되었습니다.",
        data: {
          jobTitle,
        },
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error("로드맵 저장 오류:", error.message);
    res.status(500).json({
      success: false,
      message: "로드맵 저장에 실패했습니다.",
      error: error.message,
    });
  }
};

// 워크스페이스 uuid로 로드맵 조회
export const getWorkspaceRoadmap = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params; // workspace_uuid
    const user = req.user as { userUuid: string };

    // 워크스페이스 소유자 확인
    const workspaces = await dbPool.query(
      "SELECT id FROM workspace WHERE workspace_uuid = ? AND user_uuid = ? AND is_active = TRUE",
      [uuid, user.userUuid]
    );

    if (workspaces.length === 0) {
      res.status(404).json({
        success: false,
        message: "워크스페이스를 찾을 수 없거나 권한이 없습니다.",
      });
      return;
    }

    // 로드맵 조회
    const roadmaps = await dbPool.query(
      `SELECT 
        id,
        roadmap_uuid,
        workspace_uuid,
        job_title,
        roadmap_data,
        created_at
       FROM workspace_roadmaps
       WHERE workspace_uuid = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [uuid]
    );

    if (roadmaps.length === 0) {
      res.status(404).json({
        success: false,
        message: "해당 워크스페이스에 저장된 로드맵이 없습니다.",
      });
      return;
    }

    const roadmap = roadmaps[0];

    res.status(200).json({
      success: true,
      data: {
        id: roadmap.id,
        roadmapUuid: roadmap.roadmap_uuid,
        workspaceUuid: roadmap.workspace_uuid,
        jobTitle: roadmap.job_title,
        roadmapData: JSON.parse(roadmap.roadmap_data),
        createdAt: roadmap.created_at,
      },
      message: "로드맵 조회를 완료했습니다.",
    });
  } catch (error: any) {
    console.error("로드맵 조회 오류:", error.message);
    res.status(500).json({
      success: false,
      message: "로드맵 조회에 실패했습니다.",
      error: error.message,
    });
  }
};

export const deleteWorkspace = async (req: Request, res: Response) => {
  const { uuid } = req.params; // 워크스페이스 uuid
  const user = req.user as { userUuid: string };
  const connection = await dbPool.getConnection();

  // test 계정의 기본 워크스페이스는 삭제 불가
  if (
    user.userUuid === "26710add-be9c-11f0-9eb0-668079403453" &&
    uuid === "4dbaa705-c9d8-11f0-9eb0-668079403453"
  ) {
    res.status(403).json({
      success: false,
      message: "테스트 계정의 기본 워크스페이스는 삭제할 수 없습니다.",
    });
    return;
  }

  try {
    // 트랜잭션 시작
    await connection.beginTransaction();

    // 워크스페이스 소유자 확인
    const workspaces = await dbPool.query(
      "SELECT id, status FROM workspace WHERE workspace_uuid = ? AND user_uuid = ? AND is_active = TRUE",
      [uuid, user.userUuid]
    );
    if (workspaces.length === 0) {
      res.status(404).json({
        success: false,
        message: "워크스페이스를 찾을 수 없거나 권한이 없습니다.",
      });
      return;
    } else if (workspaces[0].status === "waiting") {
      res.status(400).json({
        success: false,
        message: "대화가 시작되지 않은 워크스페이스는 삭제할 수 없습니다.",
      });
      return;
    }

    // 워크스페이스 삭제
    await connection.execute(
      `
        DELETE FROM workspace
        WHERE workspace_uuid = ? AND user_uuid = ?
      `,
      [uuid, user.userUuid]
    );

    // 워크스페이스 생성
    const workspaceName = getRandWorkspaceName();
    await connection.execute(
      `INSERT INTO workspace 
        (user_uuid, name, status, chat_topic, is_active) 
        VALUES (?, ?, 'waiting', NULL, TRUE)`,
      [user.userUuid, workspaceName]
    );

    // 트랜잭션 커밋
    await connection.commit();

    // 성공 응답 전송
    res.status(200).json({
      success: true,
      message: "워크스페이스가 성공적으로 삭제되었습니다.",
    });
  } catch (error: any) {
    await connection.rollback();

    console.error("워크스페이스 삭제 오류:", error.message);
    res.status(500).json({
      success: false,
      message: "워크스페이스 삭제에 실패했습니다.",
    });
  } finally {
    connection.release();
  }
};
