
import unittest
from unittest.mock import MagicMock, patch
import psycopg2
import psycopg2.pool
from backend.infrastructure.database import Database, DatabaseUnavailableError

class TestDatabaseInfra(unittest.TestCase):
    def setUp(self):
        self.dsn = "postgres://user:pass@host/db"
        self.db = Database(dsn=self.dsn)

    @patch("psycopg2.pool.ThreadedConnectionPool")
    def test_get_pool_initialization(self, mock_pool_class):
        mock_pool = mock_pool_class.return_value
        pool = self.db._get_pool()
        self.assertEqual(pool, mock_pool)
        mock_pool_class.assert_called_once_with(1, 5, self.dsn, connect_timeout=5)

    @patch("psycopg2.pool.ThreadedConnectionPool")
    def test_get_pool_failure(self, mock_pool_class):
        mock_pool_class.side_effect = psycopg2.OperationalError("Refused")
        with self.assertRaises(DatabaseUnavailableError):
            self.db._get_pool()

    @patch("psycopg2.pool.ThreadedConnectionPool")
    def test_connect_success(self, mock_pool_class):
        mock_pool = mock_pool_class.return_value
        mock_conn = MagicMock()
        mock_pool.getconn.return_value = mock_conn
        
        # Pre-ping success
        mock_cur = mock_conn.cursor.return_value.__enter__.return_value
        
        with self.db.connect() as conn:
            self.assertEqual(conn, mock_conn)
            mock_cur.execute.assert_called_with("SELECT 1")
        
        mock_pool.putconn.assert_called_with(mock_conn)

    @patch("psycopg2.pool.ThreadedConnectionPool")
    def test_connect_retry_on_dead_connection(self, mock_pool_class):
        mock_pool = mock_pool_class.return_value
        dead_conn = MagicMock()
        live_conn = MagicMock()
        mock_pool.getconn.side_effect = [dead_conn, live_conn]
        
        # Dead connection fails pre-ping
        dead_cur = dead_conn.cursor.return_value.__enter__.return_value
        dead_cur.execute.side_effect = psycopg2.OperationalError("Connection closed")
        
        # Live connection succeeds pre-ping
        live_cur = live_conn.cursor.return_value.__enter__.return_value
        
        with self.db.connect() as conn:
            self.assertEqual(conn, live_conn)
        
        self.assertEqual(mock_pool.getconn.call_count, 2)
        mock_pool.putconn.assert_any_call(dead_conn, close=True)
        mock_pool.putconn.assert_any_call(live_conn)

    @patch("psycopg2.pool.ThreadedConnectionPool")
    def test_connect_pool_exhausted(self, mock_pool_class):
        mock_pool = mock_pool_class.return_value
        mock_pool.getconn.side_effect = psycopg2.pool.PoolError("Maxed out")
        
        with self.assertRaises(DatabaseUnavailableError):
            with self.db.connect():
                pass

    @patch("psycopg2.pool.ThreadedConnectionPool")
    def test_rollback_on_exception(self, mock_pool_class):
        mock_pool = mock_pool_class.return_value
        mock_conn = MagicMock()
        mock_pool.getconn.return_value = mock_conn
        
        with self.assertRaises(ValueError):
            with self.db.connect() as conn:
                raise ValueError("Oops")
        
        mock_conn.rollback.assert_called_once()
        mock_pool.putconn.assert_called_with(mock_conn)

    @patch("psycopg2.pool.ThreadedConnectionPool")
    def test_is_available_true(self, mock_pool_class):
        mock_pool = mock_pool_class.return_value
        mock_conn = MagicMock()
        mock_pool.getconn.return_value = mock_conn
        self.assertTrue(self.db.is_available())

    @patch("psycopg2.pool.ThreadedConnectionPool")
    def test_is_available_false(self, mock_pool_class):
        mock_pool_class.side_effect = psycopg2.OperationalError("Down")
        self.assertFalse(self.db.is_available())

if __name__ == "__main__":
    unittest.main()
