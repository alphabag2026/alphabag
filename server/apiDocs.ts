/**
 * AlphaBag API Documentation
 * GET /api/docs        → Swagger UI HTML (human-readable)
 * GET /api/docs.json   → OpenAPI 3.1 JSON (AI-readable)
 */
import { Router, Request, Response } from "express";

const router = Router();

const OPENAPI_SPEC = {
  openapi: "3.1.0",
  info: {
    title: "AlphaBag Public API v1",
    version: "1.0.0",
    description: `AlphaBag Investment Platform의 공개 REST API입니다.
모든 엔드포인트는 API 키 인증이 필요합니다.

**인증 방법:**
\`Authorization: Bearer {api_key}\` 헤더를 모든 요청에 포함하세요.

**API 키 발급:**
AlphaBag 백오피스 관리자에게 파트너 등록을 요청하세요.

**응답 형식:**
모든 응답은 JSON 형식이며, 다음 구조를 따릅니다:
\`\`\`json
{
  "success": true,
  "data": [...],
  "meta": { "total": 10, "timestamp": "2026-01-01T00:00:00.000Z" }
}
\`\`\`

**오류 응답:**
\`\`\`json
{
  "error": "Unauthorized",
  "message": "Authorization: Bearer {api_key} 헤더가 필요합니다.",
  "docs": "/api/docs"
}
\`\`\``,
    contact: {
      name: "AlphaBag Support",
      url: "https://t.me/alphabag",
    },
    license: {
      name: "Private",
    },
  },
  servers: [
    {
      url: "/api/v1",
      description: "AlphaBag API v1",
    },
  ],
  security: [
    { BearerAuth: [] },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "API Key",
        description: "백오피스에서 발급받은 API 키를 입력하세요. 형식: `abv2_xxxxxxxx...`",
      },
    },
    schemas: {
      ApiResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: { description: "응답 데이터 (배열 또는 객체)" },
          meta: {
            type: "object",
            properties: {
              total: { type: "integer", description: "전체 항목 수" },
              timestamp: { type: "string", format: "date-time" },
            },
          },
        },
      },
      InvestmentPlan: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string", example: "WALLX" },
          logoUrl: { type: "string", format: "uri" },
          dailyRate: { type: "string", example: "1.00" },
          label: { type: "string", example: "HOT" },
          tags: { type: "string", example: "Yield / Optimized" },
          planType: { type: "string", enum: ["golden", "self", "leader", "meme", "influencer", "node", "cbag"] },
          collectionType: { type: "string" },
          rating: { type: "number" },
          urlId: { type: "string" },
        },
      },
      Airdrop: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          tokenSymbol: { type: "string", example: "ABAG" },
          totalAmount: { type: "string" },
          status: { type: "string", enum: ["active", "ended", "upcoming"] },
          startDate: { type: "string", format: "date-time" },
          endDate: { type: "string", format: "date-time" },
          description: { type: "string" },
          imageUrl: { type: "string", format: "uri" },
          participateUrl: { type: "string", format: "uri" },
          isHot: { type: "boolean" },
        },
      },
      SnsPost: {
        type: "object",
        properties: {
          id: { type: "integer" },
          content: { type: "string" },
          translatedContent: { type: "string", nullable: true },
          mediaUrls: { type: "string", nullable: true },
          likes: { type: "integer" },
          retweets: { type: "integer" },
          postedAt: { type: "string", format: "date-time" },
        },
      },
      Node: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          price: { type: "string" },
          color: { type: "string" },
          description: { type: "string" },
          tags: { type: "string" },
          totalSold: { type: "integer" },
        },
      },
      TrendingCoin: {
        type: "object",
        properties: {
          id: { type: "string", example: "bitcoin" },
          symbol: { type: "string", example: "btc" },
          name: { type: "string", example: "Bitcoin" },
          image: { type: "string", format: "uri" },
          price: { type: "number" },
          change24h: { type: "number", description: "24시간 가격 변동률 (%)" },
          marketCap: { type: "number" },
          volume24h: { type: "number" },
        },
      },
    },
  },
  paths: {
    "/info": {
      get: {
        summary: "API 정보 조회",
        description: "API 버전, 파트너 정보, 사용 가능한 엔드포인트 목록을 반환합니다.",
        tags: ["System"],
        responses: {
          "200": {
            description: "성공",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/ApiResponse" },
                    {
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            version: { type: "string", example: "1.0.0" },
                            name: { type: "string" },
                            partner: { type: "string" },
                            endpoints: { type: "array", items: { type: "string" } },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          "401": { description: "인증 실패" },
        },
      },
    },
    "/tabs/recommended": {
      get: {
        summary: "추천 플랜 목록",
        description: "홈 화면 '추천' 탭에 표시되는 투자 플랜 목록입니다. 하이라이트 상품이 우선 표시됩니다.",
        tags: ["Tabs"],
        responses: {
          "200": {
            description: "성공",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/ApiResponse" },
                    { properties: { data: { type: "array", items: { $ref: "#/components/schemas/InvestmentPlan" } } } },
                  ],
                },
              },
            },
          },
          "401": { description: "인증 실패" },
        },
      },
    },
    "/tabs/bbag": {
      get: {
        summary: "B-BAG 상품 목록",
        description: "B-BAG 컬렉션의 투자 상품 목록입니다.",
        tags: ["Tabs"],
        responses: {
          "200": {
            description: "성공",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/ApiResponse" },
                    { properties: { data: { type: "array", items: { $ref: "#/components/schemas/InvestmentPlan" } } } },
                  ],
                },
              },
            },
          },
          "401": { description: "인증 실패" },
        },
      },
    },
    "/tabs/trending": {
      get: {
        summary: "급등 토큰 목록",
        description: "CoinGecko API 기반 24시간 급등 암호화폐 목록입니다. 실시간 데이터입니다.",
        tags: ["Tabs"],
        responses: {
          "200": {
            description: "성공",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/ApiResponse" },
                    { properties: { data: { type: "array", items: { $ref: "#/components/schemas/TrendingCoin" } } } },
                  ],
                },
              },
            },
          },
          "401": { description: "인증 실패" },
        },
      },
    },
    "/tabs/airdrop": {
      get: {
        summary: "에어드랍 목록",
        description: "현재 진행 중인 에어드랍 캠페인 목록입니다.",
        tags: ["Tabs"],
        responses: {
          "200": {
            description: "성공",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/ApiResponse" },
                    { properties: { data: { type: "array", items: { $ref: "#/components/schemas/Airdrop" } } } },
                  ],
                },
              },
            },
          },
          "401": { description: "인증 실패" },
        },
      },
    },
    "/tabs/news": {
      get: {
        summary: "뉴스/공지 목록",
        description: "AlphaBag 공지사항 및 뉴스 목록입니다. 고정 공지가 상단에 표시됩니다.",
        tags: ["Tabs"],
        responses: {
          "200": {
            description: "성공",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/ApiResponse" },
                    {
                      properties: {
                        data: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "integer" },
                              title: { type: "string" },
                              content: { type: "string" },
                              isPinned: { type: "boolean" },
                              createdAt: { type: "string", format: "date-time" },
                            },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          "401": { description: "인증 실패" },
        },
      },
    },
    "/tabs/sns": {
      get: {
        summary: "SNS 인플루언서 피드",
        description: "등록된 KOL(Key Opinion Leader)의 최신 SNS 게시물 목록입니다.",
        tags: ["Tabs"],
        responses: {
          "200": {
            description: "성공",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/ApiResponse" },
                    { properties: { data: { type: "array", items: { $ref: "#/components/schemas/SnsPost" } } } },
                  ],
                },
              },
            },
          },
          "401": { description: "인증 실패" },
        },
      },
    },
    "/tabs/contents": {
      get: {
        summary: "콘텐츠 (공지 + 하이라이트 플랜)",
        description: "최신 공지사항과 하이라이트 투자 플랜을 함께 반환합니다.",
        tags: ["Tabs"],
        responses: {
          "200": {
            description: "성공",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/ApiResponse" },
                    {
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            notices: { type: "array" },
                            highlights: { type: "array" },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          "401": { description: "인증 실패" },
        },
      },
    },
    "/tabs/live": {
      get: {
        summary: "라이브 미팅 목록",
        description: "예정된 온라인 미팅 및 라이브 세션 목록입니다.",
        tags: ["Tabs"],
        responses: {
          "200": {
            description: "성공",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiResponse" },
              },
            },
          },
          "401": { description: "인증 실패" },
        },
      },
    },
    "/tabs/mlm": {
      get: {
        summary: "MLM 레퍼럴 상위 목록",
        description: "수익 기준 상위 레퍼럴 통계입니다.",
        tags: ["Tabs"],
        responses: {
          "200": {
            description: "성공",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiResponse" },
              },
            },
          },
          "401": { description: "인증 실패" },
        },
      },
    },
    "/tabs/meetup": {
      get: {
        summary: "밋업 이벤트 목록",
        description: "AlphaBag 밋업 이벤트 목록입니다.",
        tags: ["Tabs"],
        responses: {
          "200": {
            description: "성공",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiResponse" },
              },
            },
          },
          "401": { description: "인증 실패" },
        },
      },
    },
    "/tabs/expo": {
      get: {
        summary: "엑스포/전시회 목록",
        description: "AlphaBag 참가 엑스포 및 전시회 목록입니다.",
        tags: ["Tabs"],
        responses: {
          "200": {
            description: "성공",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiResponse" },
              },
            },
          },
          "401": { description: "인증 실패" },
        },
      },
    },
    "/tabs/nodes": {
      get: {
        summary: "노드 상품 목록",
        description: "AlphaBag 노드 구매 상품 목록입니다.",
        tags: ["Tabs"],
        responses: {
          "200": {
            description: "성공",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/ApiResponse" },
                    { properties: { data: { type: "array", items: { $ref: "#/components/schemas/Node" } } } },
                  ],
                },
              },
            },
          },
          "401": { description: "인증 실패" },
        },
      },
    },
  },
  tags: [
    { name: "System", description: "API 시스템 정보" },
    { name: "Tabs", description: "홈 화면 탭별 데이터 엔드포인트" },
  ],
};

// GET /api/docs.json - AI가 읽을 수 있는 OpenAPI JSON 스펙
router.get("/docs.json", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.json(OPENAPI_SPEC);
});

// GET /api/docs - Swagger UI HTML (인간 + AI 모두 읽기 가능)
router.get("/docs", (_req: Request, res: Response) => {
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AlphaBag API v1 Documentation</title>
  <meta name="description" content="AlphaBag Investment Platform Public REST API v1 - OpenAPI 3.1 Documentation" />
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>
    body { margin: 0; background: #0a0a0f; }
    .swagger-ui { background: #0a0a0f; }
    .swagger-ui .topbar { background: #111118; border-bottom: 1px solid #2a2a3a; }
    .swagger-ui .topbar-wrapper .link { display: flex; align-items: center; gap: 8px; }
    .swagger-ui .topbar-wrapper .link::before {
      content: "🅰 AlphaBag API";
      color: #f5a623;
      font-weight: 700;
      font-size: 1.1rem;
    }
    .swagger-ui .topbar-wrapper img { display: none; }
    .swagger-ui .info .title { color: #f5a623; }
    .swagger-ui .scheme-container { background: #111118; }
    .ai-notice {
      background: #111118;
      border: 1px solid #2a2a3a;
      border-radius: 8px;
      padding: 12px 20px;
      margin: 0;
      font-family: monospace;
      font-size: 13px;
      color: #8888aa;
      text-align: center;
    }
    .ai-notice a { color: #f5a623; text-decoration: none; }
  </style>
</head>
<body>
  <div class="ai-notice">
    🤖 AI/LLM용 OpenAPI JSON 스펙:
    <a href="/api/docs.json" target="_blank">/api/docs.json</a>
    &nbsp;|&nbsp;
    모든 엔드포인트는 <code>Authorization: Bearer {api_key}</code> 헤더 필요
    &nbsp;|&nbsp;
    API 키 발급: <a href="/admin/api-keys" target="_blank">백오피스 → API 키 관리</a>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      SwaggerUIBundle({
        url: "/api/docs.json",
        dom_id: "#swagger-ui",
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
        layout: "BaseLayout",
        deepLinking: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true,
        requestInterceptor: (req) => {
          // 테스트 시 Authorization 헤더 자동 추가 안내
          return req;
        },
      });
    };
  </script>
</body>
</html>`;
  res.setHeader("Content-Type", "text/html");
  res.send(html);
});

export default router;
