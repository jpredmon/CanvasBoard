import { verifyFirebaseToken } from './verifyFirebaseToken';

interface Env {
  DB: D1Database;
  FIREBASE_PROJECT_ID: string;
}

const ALLOWED_ORIGINS = new Set([
  'http://localhost:5173',
  'https://canvasboard.jpredmon.com',
]);

function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') ?? '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : '',
    'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    Vary: 'Origin',
  };
}

function json(request: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), 'Content-Type': 'application/json' },
  });
}

function err(request: Request, message: string, status: number): Response {
  return new Response(message, { status, headers: corsHeaders(request) });
}

async function authenticate(
  request: Request,
  env: Env
): Promise<{ uid: string } | Response> {
  const header = request.headers.get('Authorization');
  if (!header?.startsWith('Bearer ')) return err(request, 'Unauthorized', 401);
  const token = header.slice(7);
  const user = await verifyFirebaseToken(token, env.FIREBASE_PROJECT_ID);
  if (!user) return err(request, 'Unauthorized', 401);
  return user;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    const auth = await authenticate(request, env);
    if (auth instanceof Response) return auth;
    const { uid } = auth;

    const url = new URL(request.url);
    const path = url.pathname;

    // GET /api/boards
    if (request.method === 'GET' && path === '/api/boards') {
      const row = await env.DB.prepare(
        'SELECT boards_json FROM user_boards WHERE user_id = ?'
      )
        .bind(uid)
        .first<{ boards_json: string }>();
      return json(request, row ? JSON.parse(row.boards_json) : null);
    }

    // PUT /api/boards
    if (request.method === 'PUT' && path === '/api/boards') {
      const body = await request.text();
      await env.DB.prepare(
        `INSERT INTO user_boards (user_id, boards_json) VALUES (?, ?)
         ON CONFLICT(user_id) DO UPDATE SET boards_json = excluded.boards_json`
      )
        .bind(uid, body)
        .run();
      return json(request, {});
    }

    const boardStateMatch = path.match(/^\/api\/boards\/([^/]+)\/state$/);
    if (boardStateMatch) {
      const boardId = boardStateMatch[1];

      // GET /api/boards/:boardId/state
      if (request.method === 'GET') {
        const row = await env.DB.prepare(
          'SELECT cards_json, layout_json FROM board_state WHERE user_id = ? AND board_id = ?'
        )
          .bind(uid, boardId)
          .first<{ cards_json: string; layout_json: string }>();
        if (!row) return json(request, null);
        return json(request, {
          cards: JSON.parse(row.cards_json),
          layout: JSON.parse(row.layout_json),
        });
      }

      // PUT /api/boards/:boardId/state
      if (request.method === 'PUT') {
        const { cards, layout } = await request.json<{ cards: unknown; layout: unknown }>();
        await env.DB.prepare(
          `INSERT INTO board_state (user_id, board_id, cards_json, layout_json)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(user_id, board_id) DO UPDATE SET
             cards_json = excluded.cards_json,
             layout_json = excluded.layout_json`
        )
          .bind(uid, boardId, JSON.stringify(cards), JSON.stringify(layout))
          .run();
        return json(request, {});
      }
    }

    const boardDeleteMatch = path.match(/^\/api\/boards\/([^/]+)$/);
    if (request.method === 'DELETE' && boardDeleteMatch) {
      const boardId = boardDeleteMatch[1];
      await env.DB.prepare(
        'DELETE FROM board_state WHERE user_id = ? AND board_id = ?'
      )
        .bind(uid, boardId)
        .run();
      return json(request, {});
    }

    return err(request, 'Not found', 404);
  },
};
