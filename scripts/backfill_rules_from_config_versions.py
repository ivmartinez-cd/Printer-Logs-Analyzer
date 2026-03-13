import uuid
import json
from psycopg2 import extras

from infrastructure.database import Database
from infrastructure.json_config_validator import JsonConfigValidator


def backfill_rules_from_config_versions() -> None:
    db = Database()
    validator = JsonConfigValidator()

    with db.connect() as conn, conn.cursor(cursor_factory=extras.RealDictCursor) as cur:

        cur.execute("""
            SELECT id, version_number, config_json, created_at, created_by
            FROM config_versions
            ORDER BY version_number ASC
        """)

        versions = cur.fetchall() or []

        for version in versions:

            config_id = version["id"]
            version_number = version["version_number"]

            # idempotencia
            cur.execute(
                "SELECT 1 FROM rules WHERE config_version_id = %s LIMIT 1",
                (config_id,),
            )
            if cur.fetchone():
                print(f"[backfill] ya existe version_number={version_number}")
                continue

            raw = version["config_json"]

            if isinstance(raw, str):
                raw = json.loads(raw)

            try:
                doc = validator.validate(raw)
            except Exception as e:
                print(f"[backfill] SKIP version_number={version_number}: {e}")
                continue

            rules = doc.global_rules
            print(f"[backfill] version_number={version_number}, reglas={len(rules)}")

            for rule in rules:

                rule_id = uuid.uuid4()

                cur.execute("""
                    INSERT INTO rules (
                        id,
                        config_version_id,
                        code,
                        classification,
                        description,
                        resolution,
                        recency_window,
                        x_threshold,
                        y_window,
                        counter_max_jump,
                        enabled,
                        sds_link,
                        created_at,
                        created_by
                    )
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """, (
                    str(rule_id),
                    config_id,
                    rule.code,
                    rule.classification,
                    rule.description,
                    rule.resolution,
                    rule.recency_window,
                    rule.X,
                    rule.Y,
                    rule.counter_max_jump,
                    rule.enabled,
                    getattr(rule, "sds_link", None),
                    version["created_at"],
                    version["created_by"],
                ))

                for tag in rule.tags:
                    cur.execute("""
                        INSERT INTO rule_tags (rule_id, tag)
                        VALUES (%s, %s)
                        ON CONFLICT DO NOTHING
                    """, (str(rule_id), tag))

        conn.commit()
        print("[backfill] COMPLETADO")


if __name__ == "__main__":
    backfill_rules_from_config_versions()