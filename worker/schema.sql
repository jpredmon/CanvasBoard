CREATE TABLE IF NOT EXISTS user_boards (
  user_id    TEXT PRIMARY KEY,
  boards_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS board_state (
  user_id     TEXT NOT NULL,
  board_id    TEXT NOT NULL,
  cards_json  TEXT NOT NULL,
  layout_json TEXT NOT NULL,
  PRIMARY KEY (user_id, board_id)
);
