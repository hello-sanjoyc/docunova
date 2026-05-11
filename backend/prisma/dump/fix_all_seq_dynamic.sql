DO $$
DECLARE
    r RECORD;
    max_id BIGINT;
    seq_name TEXT;
BEGIN
    FOR r IN
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE column_default LIKE 'nextval%'
          AND table_schema = 'public'
          AND column_name = 'id'
    LOOP
        seq_name := pg_get_serial_sequence(r.table_name, r.column_name);
        IF seq_name IS NOT NULL THEN
            EXECUTE format('SELECT COALESCE(MAX(id), 1) FROM %I', r.table_name) INTO max_id;
            PERFORM setval(seq_name, max_id);
            RAISE NOTICE 'Reset % to %', seq_name, max_id;
        END IF;
    END LOOP;
END $$;
