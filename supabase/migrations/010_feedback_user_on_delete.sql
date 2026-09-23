-- feedback.user_id was declared as a plain REFERENCES users(id) with no ON DELETE
-- clause, so it defaults to NO ACTION and blocks deleting any user who has ever
-- submitted feedback. Every other table referencing users already cascades.
--
-- Feedback is detached rather than deleted: the row carries its own name/email
-- and is useful to admins after the account is gone. The column is nullable.
ALTER TABLE feedback DROP CONSTRAINT IF EXISTS feedback_user_id_fkey;

ALTER TABLE feedback
  ADD CONSTRAINT feedback_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
