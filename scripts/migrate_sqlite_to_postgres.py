import argparse
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError


TABLES = [
    "users",
    "units",
    "products",
    "purchase_orders",
    "purchase_order_items",
    "stock_movements",
    "work_orders",
    "checklists",
    "media",
    "time_logs",
]


def build_insert_or_upsert_sql(table_name: str, columns: list[str], dialect_name: str) -> str:
    placeholders = ", ".join([f":{c}" for c in columns])
    columns_sql = ", ".join(columns)

    if dialect_name == "postgresql" and "id" in columns:
        update_cols = [c for c in columns if c != "id"]
        update_sql = ", ".join([f"{c}=EXCLUDED.{c}" for c in update_cols])
        return (
            f"INSERT INTO {table_name} ({columns_sql}) VALUES ({placeholders}) "
            f"ON CONFLICT (id) DO UPDATE SET {update_sql}"
        )

    return f"INSERT INTO {table_name} ({columns_sql}) VALUES ({placeholders})"


def count_rows(conn, table_name: str) -> int:
    return conn.execute(text(f"SELECT COUNT(*) FROM {table_name}")).scalar_one()


def existing_tables(conn) -> set[str]:
    rows = conn.execute(
        text(
            """
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            """
        )
    ).fetchall()
    return {r[0] for r in rows}


def reset_sequences(conn, table_name: str) -> None:
    id_col = conn.execute(
        text(
            """
            SELECT data_type
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = :table
              AND column_name = 'id'
            """
        ),
        {"table": table_name},
    ).fetchone()
    if not id_col:
        return

    if id_col[0] not in {"integer", "bigint", "smallint"}:
        return

    conn.execute(
        text(
            """
            SELECT setval(
                pg_get_serial_sequence(:table_name, 'id'),
                COALESCE((SELECT MAX(id) FROM {}), 1),
                TRUE
            )
            """.format(table_name)
        ),
        {"table_name": table_name},
    )


def clear_target_data(pg_conn, target_tables: set[str]) -> None:
    if "users" in target_tables and "units" in target_tables:
        pg_conn.execute(text("UPDATE users SET unit_id = NULL WHERE unit_id IS NOT NULL"))
        pg_conn.execute(
            text("UPDATE units SET driver_id = NULL, manager_id = NULL WHERE driver_id IS NOT NULL OR manager_id IS NOT NULL")
        )

    if "checklists" in target_tables:
        pg_conn.execute(text("UPDATE checklists SET generated_order_id = NULL WHERE generated_order_id IS NOT NULL"))

    delete_order = [
        "time_logs",
        "media",
        "checklists",
        "work_orders",
        "stock_movements",
        "purchase_order_items",
        "purchase_orders",
        "products",
        "units",
        "users",
    ]
    for table in delete_order:
        if table in target_tables:
            pg_conn.execute(text(f"DELETE FROM {table}"))
            print(f"[ok] deleted rows from {table}", flush=True)


def migrate_table(sqlite_conn, pg_conn, table_name: str) -> None:
    rows = sqlite_conn.execute(text(f"SELECT * FROM {table_name}")).mappings().all()
    if not rows:
        print(f"[skip] {table_name}: 0 rows", flush=True)
        return

    valid_user_ids = set()
    valid_unit_ids = set()
    valid_order_ids = set()
    if table_name in {"checklists", "time_logs"}:
        valid_user_ids = {r[0] for r in sqlite_conn.execute(text("SELECT id FROM users")).fetchall()}
        valid_unit_ids = {r[0] for r in sqlite_conn.execute(text("SELECT id FROM units")).fetchall()}
        valid_order_ids = {r[0] for r in sqlite_conn.execute(text("SELECT id FROM work_orders")).fetchall()}

    normalized_rows = []
    skipped_rows = 0
    for raw_row in rows:
        row = dict(raw_row)
        if table_name == "checklists":
            if "has_failed" in row and row["has_failed"] is not None:
                row["has_failed"] = bool(row["has_failed"])
            if "is_priority" in row and row["is_priority"] is not None:
                row["is_priority"] = bool(row["is_priority"])
            if row.get("user_id") not in valid_user_ids or row.get("unit_id") not in valid_unit_ids:
                skipped_rows += 1
                continue
            if row.get("generated_order_id") is not None and row.get("generated_order_id") not in valid_order_ids:
                row["generated_order_id"] = None
        if table_name == "time_logs":
            if row.get("technician_id") not in valid_user_ids or row.get("work_order_id") not in valid_order_ids:
                skipped_rows += 1
                continue
        normalized_rows.append(row)

    if not normalized_rows:
        print(f"[skip] {table_name}: 0 valid rows", flush=True)
        return

    columns = list(normalized_rows[0].keys())
    insert_sql = text(build_insert_or_upsert_sql(table_name, columns, pg_conn.dialect.name))
    pg_conn.execute(insert_sql, normalized_rows)
    if skipped_rows:
        print(f"[ok] {table_name}: {len(normalized_rows)} rows (skipped {skipped_rows} invalid FK rows)", flush=True)
    else:
        print(f"[ok] {table_name}: {len(normalized_rows)} rows", flush=True)


def migrate_users_and_units(sqlite_conn, pg_conn) -> None:
    user_rows = sqlite_conn.execute(text("SELECT * FROM users")).mappings().all()
    unit_rows = sqlite_conn.execute(text("SELECT * FROM units")).mappings().all()

    users_with_unit = []
    user_insert_rows = []
    for row in user_rows:
        data = dict(row)
        users_with_unit.append({"id": data["id"], "unit_id": data.get("unit_id")})
        data["unit_id"] = None
        user_insert_rows.append(data)

    pg_conn.execute(
        text(
            """
            INSERT INTO users (id, email, hashed_password, role, full_name, profile_image, unit_id)
            VALUES (:id, :email, :hashed_password, :role, :full_name, :profile_image, :unit_id)
            ON CONFLICT (id) DO UPDATE SET
                email=EXCLUDED.email,
                hashed_password=EXCLUDED.hashed_password,
                role=EXCLUDED.role,
                full_name=EXCLUDED.full_name,
                profile_image=EXCLUDED.profile_image,
                unit_id=EXCLUDED.unit_id
            """
        ),
        user_insert_rows,
    )
    print(f"[ok] users: {len(user_insert_rows)} rows", flush=True)

    units_with_refs = []
    unit_insert_rows = []
    for row in unit_rows:
        data = dict(row)
        units_with_refs.append(
            {
                "id": data["id"],
                "driver_id": data.get("driver_id"),
                "manager_id": data.get("manager_id"),
            }
        )
        data["driver_id"] = None
        data["manager_id"] = None
        unit_insert_rows.append(data)

    pg_conn.execute(
        text(
            """
            INSERT INTO units (id, eco_number, vin, status, model, driver_id, manager_id)
            VALUES (:id, :eco_number, :vin, :status, :model, :driver_id, :manager_id)
            ON CONFLICT (id) DO UPDATE SET
                eco_number=EXCLUDED.eco_number,
                vin=EXCLUDED.vin,
                status=EXCLUDED.status,
                model=EXCLUDED.model,
                driver_id=EXCLUDED.driver_id,
                manager_id=EXCLUDED.manager_id
            """
        ),
        unit_insert_rows,
    )
    print(f"[ok] units: {len(unit_insert_rows)} rows", flush=True)

    user_updates = [r for r in users_with_unit if r["unit_id"] is not None]
    if user_updates:
        pg_conn.execute(text("UPDATE users SET unit_id = :unit_id WHERE id = :id"), user_updates)
        print(f"[ok] users.unit_id updates: {len(user_updates)}", flush=True)

    if units_with_refs:
        pg_conn.execute(
            text(
                """
                UPDATE units
                SET driver_id = :driver_id, manager_id = :manager_id
                WHERE id = :id
                """
            ),
            units_with_refs,
        )
        print(f"[ok] units refs updates: {len(units_with_refs)}", flush=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="Migrate data from SQLite to Postgres.")
    parser.add_argument("--sqlite-url", required=True, help="sqlite:///./flota.db")
    parser.add_argument("--postgres-url", required=True, help="postgresql+psycopg2://...")
    parser.add_argument("--dry-run", action="store_true", help="Only validate source counts")
    parser.add_argument(
        "--truncate-target",
        action="store_true",
        help="Truncate target tables before migrating",
    )
    args = parser.parse_args()

    sqlite_engine = create_engine(args.sqlite_url)
    pg_engine = create_engine(args.postgres_url)

    with sqlite_engine.connect() as sqlite_conn:
        source_counts = {t: count_rows(sqlite_conn, t) for t in TABLES}

    print("Source counts:", source_counts, flush=True)
    if args.dry_run:
        return

    with sqlite_engine.connect() as sqlite_conn, pg_engine.begin() as pg_conn:
        pg_conn.execute(text("SET lock_timeout TO '5s'"))
        pg_conn.execute(text("SET statement_timeout TO '5min'"))
        target_tables = existing_tables(pg_conn)

        if args.truncate_target:
            trunc_tables = [t for t in TABLES if t in target_tables]
            if trunc_tables:
                print(f"[run] truncating target tables: {', '.join(trunc_tables)}", flush=True)
                try:
                    pg_conn.execute(text(f"TRUNCATE TABLE {', '.join(trunc_tables)} RESTART IDENTITY CASCADE"))
                    print("[ok] truncate completed", flush=True)
                except OperationalError:
                    print("[warn] truncate blocked by lock, using row-by-row delete fallback", flush=True)
                    clear_target_data(pg_conn, target_tables)

        if "users" in target_tables and "units" in target_tables:
            migrate_users_and_units(sqlite_conn, pg_conn)

        for table in [t for t in TABLES if t not in {"users", "units"}]:
            if table in target_tables:
                migrate_table(sqlite_conn, pg_conn, table)

        for table in TABLES:
            if table in target_tables:
                reset_sequences(pg_conn, table)

    with pg_engine.connect() as pg_conn:
        target_counts = {t: count_rows(pg_conn, t) for t in TABLES}
    print("Target counts:", target_counts)


if __name__ == "__main__":
    main()
