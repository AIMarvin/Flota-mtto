import argparse
from sqlalchemy import create_engine, text


TABLES = ["users", "units", "work_orders", "checklists", "media", "time_logs"]


def count_rows(conn, table_name: str) -> int:
    return conn.execute(text(f"SELECT COUNT(*) FROM {table_name}")).scalar_one()


def migrate_table(sqlite_conn, pg_conn, table_name: str) -> None:
    rows = sqlite_conn.execute(text(f"SELECT * FROM {table_name}")).mappings().all()
    if not rows:
        return

    columns = list(rows[0].keys())
    placeholders = ", ".join([f":{c}" for c in columns])
    columns_sql = ", ".join(columns)
    insert_sql = text(f"INSERT INTO {table_name} ({columns_sql}) VALUES ({placeholders})")
    pg_conn.execute(insert_sql, rows)


def main() -> None:
    parser = argparse.ArgumentParser(description="Migrate data from SQLite to Postgres.")
    parser.add_argument("--sqlite-url", required=True, help="sqlite:///./flota.db")
    parser.add_argument("--postgres-url", required=True, help="postgresql+psycopg2://...")
    parser.add_argument("--dry-run", action="store_true", help="Only validate source counts")
    args = parser.parse_args()

    sqlite_engine = create_engine(args.sqlite_url)
    pg_engine = create_engine(args.postgres_url)

    with sqlite_engine.connect() as sqlite_conn:
        source_counts = {t: count_rows(sqlite_conn, t) for t in TABLES}

    print("Source counts:", source_counts)
    if args.dry_run:
        return

    with sqlite_engine.connect() as sqlite_conn, pg_engine.begin() as pg_conn:
        for table in TABLES:
            migrate_table(sqlite_conn, pg_conn, table)

    with pg_engine.connect() as pg_conn:
        target_counts = {t: count_rows(pg_conn, t) for t in TABLES}
    print("Target counts:", target_counts)


if __name__ == "__main__":
    main()
