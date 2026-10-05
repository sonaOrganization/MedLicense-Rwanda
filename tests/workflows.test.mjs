import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";

test("schema and secure workflow migration execute with real PostgreSQL", async () => {
  const db = new PGlite();
  try {
    await db.exec("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;");
    await db.exec(readFileSync("supabase/schema.sql", "utf8"));
    for (const file of readdirSync("supabase/migrations").filter((f) => f.endsWith(".sql")).sort()) {
      await db.exec(readFileSync("supabase/migrations/" + file, "utf8"));
    }
    const query = async (sql, values = []) => (await db.query(sql, values)).rows;
    const rpc = async (name, values) => (await query("SELECT " + name + "(" + values.map((_, i) => "$" + (i + 1)).join(",") + ") AS result", values))[0].result;
    await db.exec("INSERT INTO users(id,email) VALUES('u','student@example.test'),('fail','fail@example.test'); INSERT INTO categories(id,name,name_en,name_fr,slug) VALUES('c','Medicine','Medicine','Médecine','medicine');");

    const q = { text_en: "Question", text_fr: null, explanation_en: "Explanation", difficulty: "MEDIUM", category_id: "c", language: "EN", license_categories: [] };
    const options = [{ text_en: "Correct", is_correct: true }, { text_en: "Wrong", is_correct: false }];
    const qid = await rpc("save_question", [null, q, options]);
    const aids = await query('SELECT id FROM answers WHERE question_id = $1 ORDER BY "order"', [qid]);
    const correctId = aids[0].id;
    const exam = { title_en: "Exam", category_id: null, duration_minutes: 60, passing_score: 70, points_per_question: 1, is_free: true, is_published: true, shuffle_questions: true, shuffle_answers: true };
    const eid = await rpc("save_theory_exam", [null, exam, [qid]]);
    const first = await rpc("start_exam_attempt", ["u", eid, "theory"]);
    const resume = await rpc("start_exam_attempt", ["u", eid, "theory"]);
    assert.equal(first.id, resume.id, "refresh must resume one attempt");
    assert.equal(first.exam_snapshot.questions[0].answers.length, 2);
    await rpc("save_question", [qid, { ...q, text_en: "Changed question" }, [{ ...options[0], id: correctId, text_en: "Changed option" }, { text_en: "New wrong", is_correct: false }]]);
    assert.equal((await query("SELECT count(*)::int AS count FROM answers WHERE question_id = $1 AND is_active", [qid]))[0].count, 2);
    assert.equal(first.exam_snapshot.questions[0].text_en, "Question", "attempt must preserve original text");

    const submitted = await rpc("submit_exam_attempt", ["u", first.id, "theory", { [qid]: correctId }]);
    assert.equal(submitted.score, 100);
    const duplicate = await rpc("submit_exam_attempt", ["u", first.id, "theory", { [qid]: aids[1].id }]);
    assert.equal(duplicate.error, "already_submitted");
    assert.equal((await query("SELECT answer_id FROM attempt_answers WHERE attempt_id = $1", [first.id]))[0].answer_id, correctId);
    assert.equal((await rpc("submit_exam_attempt", ["fail", first.id, "theory", {}])).error, "not_found", "ownership must be checked inside the transaction");

    const timed = await rpc("start_exam_attempt", ["u", eid, "theory"]);
    const revision = Date.now();
    assert.equal((await rpc("save_exam_state", ["u", timed.id, "theory", { answers: { [qid]: correctId }, currentIndex: 0 }, revision])).ok, true);
    assert.equal((await rpc("save_exam_state", ["u", timed.id, "theory", { answers: {} }, revision - 1])).error, "state_not_saved", "older saves cannot overwrite newer answers");
    await query("UPDATE exam_attempts SET deadline_at = now() - interval '1 second' WHERE id = $1", [timed.id]);
    assert.equal((await rpc("save_exam_state", ["u", timed.id, "theory", { answers: {} }, revision + 1])).error, "state_not_saved");
    const timedResult = await rpc("submit_exam_attempt", ["u", timed.id, "theory", { [qid]: "forged" }]);
    assert.equal(timedResult.timedOut, true);
    assert.equal(timedResult.score, 100, "late submission must use saved answers");
    assert.equal((await query("SELECT status FROM exam_attempts WHERE id = $1", [timed.id]))[0].status, "TIMED_OUT");

    await assert.rejects(rpc("save_theory_exam", [eid, { ...exam, title_en: "Should roll back" }, ["nonexistent"]]));
    assert.equal((await query("SELECT title_en FROM exams WHERE id=$1", [eid]))[0].title_en, "Exam", "failed exam edit must roll back");
    await assert.rejects(rpc("save_question", [qid, { ...q, text_en: "Should roll back" }, [{ id: correctId, text_en: "Good", is_correct: true }, { text_en: null, text_fr: null, is_correct: false }]]));
    assert.equal((await query("SELECT text_en FROM questions WHERE id=$1", [qid]))[0].text_en, "Changed question");
    await rpc("save_question", [null, { ...q, text_en: null, text_fr: "Question française", language: "FR" }, [{ text_en: null, text_fr: "Oui", is_correct: true }, { text_en: null, text_fr: "Non", is_correct: false }]]);

    await db.exec("INSERT INTO practical_exams(id,title,title_en,is_free,is_published) VALUES('pe','Case','Case',true,true); INSERT INTO practical_groups(id,practical_exam_id,stem_en) VALUES('g','pe','Case stem'); INSERT INTO practical_subquestions(id,group_id,prompt_en,model_answer_en) VALUES('s','g','Prompt','Answer');");
    const practical = await rpc("start_exam_attempt", ["u", "pe", "practical"]);
    const practicalResult = await rpc("submit_exam_attempt", ["u", practical.id, "practical", { s: true }]);
    assert.equal(practicalResult.score, 100);
    assert.equal((await rpc("submit_exam_attempt", ["u", practical.id, "practical", { s: false }])).error, "already_submitted");
    assert.equal((await query("SELECT is_correct FROM practical_attempt_answers WHERE attempt_id=$1", [practical.id]))[0].is_correct, true);

    await db.exec("INSERT INTO payments(id,user_id,amount,currency,provider,plan) VALUES('p1','u',1500,'RWF','afripay','weekly'),('p2','u',3000,'RWF','afripay','monthly'),('pf','fail',1500,'RWF','afripay','weekly');");
    assert.equal((await rpc("activate_verified_payment", ["p1", "txn1", 1, "RWF"])).reason, "payment_details_mismatch", "underpayment must not activate");
    assert.equal((await rpc("activate_verified_payment", ["p1", "txn1", 1500, "USD"])).reason, "payment_details_mismatch");
    const paid = await rpc("activate_verified_payment", ["p1", "txn1", 1500, "RWF"]);
    assert.equal(paid.activated, true);
    assert.equal((await rpc("activate_verified_payment", ["p1", "txn1", 1500, "RWF"])).reason, "already_activated");
    const renewed = await rpc("activate_verified_payment", ["p2", "txn2", 3000, "RWF"]);
    assert.equal(new Date(renewed.endDate).getTime() - new Date(paid.endDate).getTime(), 30 * 86400000, "renewal must add all paid time");
    await db.exec("CREATE FUNCTION fail_subscription() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.user_id = 'fail' THEN RAISE EXCEPTION 'simulated outage'; END IF; RETURN NEW; END $$; CREATE TRIGGER fail_subscription BEFORE INSERT OR UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION fail_subscription();");
    await assert.rejects(rpc("activate_verified_payment", ["pf", "txnf", 1500, "RWF"]));
    assert.equal((await query("SELECT status FROM payments WHERE id='pf'"))[0].status, "pending", "failed activation must leave payment retryable");
    await db.exec("DROP TRIGGER fail_subscription ON subscriptions;");
    assert.equal((await rpc("activate_verified_payment", ["pf", "txnf", 1500, "RWF"])).activated, true);

    assert.equal(await rpc("consume_request_limit", ["rate", 2, 60]), true);
    assert.equal(await rpc("consume_request_limit", ["rate", 2, 60]), true);
    assert.equal(await rpc("consume_request_limit", ["rate", 2, 60]), false);
    await db.exec("INSERT INTO user_sessions(user_id,device_type,session_id) VALUES('u','desktop','old'); INSERT INTO verification_tokens(identifier,token,expires) VALUES('password-reset:student@example.test','hash',now()+interval '1 hour');");
    assert.equal(await rpc("reset_account_password", ["password-reset:student@example.test", "hash", "newhash"]), true);
    assert.equal(await rpc("reset_account_password", ["password-reset:student@example.test", "hash", "otherhash"]), false);
    assert.equal((await query("SELECT count(*)::int AS n FROM user_sessions WHERE user_id='u'"))[0].n, 0);

    for (const role of ["anon", "authenticated"]) {
      await db.exec("SET ROLE " + role);
      await assert.rejects(rpc("activate_verified_payment", ["p1", "txn1", 1500, "RWF"]), /permission denied/);
      await assert.rejects(rpc("theory_exam_snapshot", [eid]), /permission denied/);
      await db.exec("RESET ROLE");
    }
  } finally { await db.close(); }
});
 test("secure workflow migration supports older feedback schemas and reruns", async () => {
  const db = new PGlite();
  try {
    await db.exec("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;");
    await db.exec(readFileSync("supabase/schema.sql", "utf8"));
    for (const file of readdirSync("supabase/migrations").filter((f) => f.endsWith(".sql") && f < "011").sort()) {
      await db.exec(readFileSync("supabase/migrations/" + file, "utf8"));
    }
    await db.exec("INSERT INTO feedback(id, subject, message) VALUES ('existing', 'Existing', 'Preserve me'); ALTER TABLE feedback DROP COLUMN subject, DROP COLUMN name, DROP COLUMN email, DROP COLUMN is_read;");
    const migration = readFileSync("supabase/migrations/011_secure_workflows.sql", "utf8");
    await db.exec(migration);
    await db.exec(migration);
    assert.equal((await db.query("SELECT message FROM feedback WHERE id='existing'")).rows[0].message, "Preserve me");
    await db.exec("INSERT INTO feedback(name,email,subject,message,category) VALUES('Visitor','visitor@example.test','Contact','Contact message','contact'); INSERT INTO feedback(rating,category) VALUES(5,'general');");
    await db.exec("ALTER TABLE feedback DROP COLUMN message;");
    await db.exec(migration);
    assert.equal((await db.query("SELECT count(*)::int AS n FROM feedback")).rows[0].n, 3);
  } finally { await db.close(); }
});