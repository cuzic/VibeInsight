/*
  # ログイン情報保存テーブルの作成

  1. 新しいテーブル
    - `user_login_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, user_profilesテーブルへの外部キー)
      - `session_token` (text, セッショントークン)
      - `ip_address` (text, IPアドレス)
      - `user_agent` (text, ブラウザ情報)
      - `login_time` (timestamp, ログイン時刻)
      - `last_activity` (timestamp, 最終アクティビティ時刻)
      - `is_active` (boolean, セッションがアクティブかどうか)
      - `logout_time` (timestamp, ログアウト時刻、nullable)
      - `device_type` (text, デバイスタイプ)
      - `location` (text, ログイン場所、nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. セキュリティ
    - RLSを有効化
    - ユーザーが自分のログイン情報のみ閲覧可能なポリシー
    - 認証されたユーザーがログイン情報を挿入・更新可能なポリシー

  3. インデックス
    - user_idでの高速検索用インデックス
    - session_tokenでの高速検索用インデックス
    - login_timeでの時系列検索用インデックス
*/

-- ログイン情報保存テーブルを作成
CREATE TABLE IF NOT EXISTS user_login_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  session_token text NOT NULL UNIQUE,
  ip_address text,
  user_agent text,
  login_time timestamptz DEFAULT now(),
  last_activity timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  logout_time timestamptz,
  device_type text DEFAULT 'unknown',
  location text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Row Level Security を有効化
ALTER TABLE user_login_sessions ENABLE ROW LEVEL SECURITY;

-- RLSポリシーを作成
CREATE POLICY "Users can view own login sessions"
  ON user_login_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own login sessions"
  ON user_login_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own login sessions"
  ON user_login_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own login sessions"
  ON user_login_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- パフォーマンス向上のためのインデックスを作成
CREATE INDEX IF NOT EXISTS idx_user_login_sessions_user_id ON user_login_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_login_sessions_session_token ON user_login_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_login_sessions_login_time ON user_login_sessions(login_time DESC);
CREATE INDEX IF NOT EXISTS idx_user_login_sessions_is_active ON user_login_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_login_sessions_last_activity ON user_login_sessions(last_activity DESC);

-- updated_atカラムの自動更新トリガーを作成
CREATE TRIGGER update_user_login_sessions_updated_at
  BEFORE UPDATE ON user_login_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- セッション管理用の便利な関数を作成

-- アクティブなセッションを取得する関数
CREATE OR REPLACE FUNCTION get_active_sessions(user_uuid uuid)
RETURNS TABLE (
  session_id uuid,
  session_token text,
  ip_address text,
  user_agent text,
  login_time timestamptz,
  last_activity timestamptz,
  device_type text,
  location text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    id,
    user_login_sessions.session_token,
    user_login_sessions.ip_address,
    user_login_sessions.user_agent,
    user_login_sessions.login_time,
    user_login_sessions.last_activity,
    user_login_sessions.device_type,
    user_login_sessions.location
  FROM user_login_sessions
  WHERE user_id = user_uuid AND is_active = true
  ORDER BY last_activity DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- セッションを無効化する関数
CREATE OR REPLACE FUNCTION deactivate_session(session_uuid uuid, user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  UPDATE user_login_sessions 
  SET 
    is_active = false,
    logout_time = now(),
    updated_at = now()
  WHERE id = session_uuid AND user_id = user_uuid;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 古いセッションを自動削除する関数（30日以上前のログアウト済みセッション）
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM user_login_sessions 
  WHERE is_active = false 
    AND logout_time < now() - interval '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;