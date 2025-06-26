/*
  # テーブル名の変更

  1. テーブル名変更
    - `text_entries` → `japanese_text_entries`
    - `profiles` → `user_profiles`

  2. 関連する制約とインデックスの更新
    - 外部キー制約の更新
    - RLS ポリシーの更新
    - トリガーの更新

  3. セキュリティ
    - 新しいテーブル名でRLSポリシーを再作成
    - 適切な権限設定を維持
*/

-- テーブル名を変更
ALTER TABLE IF EXISTS public.text_entries RENAME TO japanese_text_entries;
ALTER TABLE IF EXISTS public.profiles RENAME TO user_profiles;

-- RLS ポリシーを削除して再作成（text_entries → japanese_text_entries）
DROP POLICY IF EXISTS "Users can read all text entries" ON public.japanese_text_entries;
DROP POLICY IF EXISTS "Users can insert text entries" ON public.japanese_text_entries;
DROP POLICY IF EXISTS "Users can update text entries" ON public.japanese_text_entries;
DROP POLICY IF EXISTS "Users can delete text entries" ON public.japanese_text_entries;

-- 新しいテーブル名でRLSポリシーを作成
CREATE POLICY "Users can read all japanese text entries"
  ON public.japanese_text_entries
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert japanese text entries"
  ON public.japanese_text_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update japanese text entries"
  ON public.japanese_text_entries
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete japanese text entries"
  ON public.japanese_text_entries
  FOR DELETE
  TO authenticated
  USING (true);

-- RLS ポリシーを削除して再作成（profiles → user_profiles）
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;

-- 新しいテーブル名でRLSポリシーを作成
CREATE POLICY "Users can view own user profile"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own user profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- トリガーを削除して再作成
DROP TRIGGER IF EXISTS update_text_entries_updated_at ON public.japanese_text_entries;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.user_profiles;

-- 新しいテーブル名でトリガーを作成
CREATE TRIGGER update_japanese_text_entries_updated_at
  BEFORE UPDATE ON public.japanese_text_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- handle_new_user関数を更新（profilesテーブル名の変更に対応）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, created_at, updated_at)
  VALUES (new.id, new.email, now(), now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;