import argparse
from sqlalchemy import create_engine, text


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
    id_exists = conn.execute(
        text(
            """
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = :table
              AND column_name = 'id'
            LIMIT 1
            """
        ),
        {"table": table_name},
    ).fetchone()
    if not id_exists:
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


def migrate_table(sqlite_conn, pg_conn, table_name: str) -> None:
    rows = sqlite_conn.execute(text(f"SELECT * FROM {table_name}")).mappings().all()
    if not rows:
        return

    columns = list(rows[0].keys())
    placeholders = ", ".join([f":{c}" for c in columns])
    columns_sql = ", ".join(columns)
    insert_sql = text(f"INSERT INTO {table_name} ({columns_sql}) VALUES ({placeholders})")
    pg_conn.execute(insert_sql, rows)


def migrate_users_and_units(sqlite_conn, pg_conn) -> None:
    user_rows = sqlite_conn.execute(text("SELECT * FROM users")).mappings().all()
    unit_rows = sqlite_conn.execute(text("SELECT * FROM units")).mappings().all()

    users_with_unit = []
    for row in user_rows:
        data = dict(row)
        users_with_unit.append({"id": data["id"], "unit_id": data.get("unit_id")})
        data["unit_id"] = None
        pg_conn.execute(
            text(
                """
                INSERT INTO users (id, email, hashed_password, role, full_name, profile_image, unit_id)
                VALUES (:id, :email, :hashed_password, :role, :full_name, :profile_image, :unit_id)
                """
            ),
            data,
        )

    units_with_refs = []
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
        pg_conn.execute(
            text(
                """
                INSERT INTO units (id, eco_number, vin, status, model, driver_id, manager_id)
                VALUES (:id, :eco_number, :vin, :status, :model, :driver_id, :manager_id)
                """
            ),
            data,
        )

    for row in users_with_unit:
        if row["unit_id"] is not None:
            pg_conn.execute(text("UPDATE users SET unit_id = :unit_id WHERE id = :id"), row)

    for row in units_with_refs:
        pg_conn.execute(
            text(
                """
                UPDATE units
                SET driver_id = :driver_id, manager_id = :manager_id
                WHERE id = :id
                """
            ),
            row,
        )


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

    print("Source counts:", source_counts)
    if args.dry_run:
        return

    with sqlite_engine.connect() as sqlite_conn, pg_engine.begin() as pg_conn:
        target_tables = existing_tables(pg_conn)

        if args.truncate_target:
            trunc_tables = [t for t in TABLES if t in target_tables]
            if trunc_tables:
                pg_conn.execute(text(f"TRUNCATE TABLE {', '.join(trunc_tables)} RESTART IDENTITY CASCADE"))

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
