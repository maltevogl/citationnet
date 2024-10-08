"""Basic tests for interface."""
from fastapi.testclient import TestClient

from .interface import app

client = TestClient(app)


def test_read_interface() -> None:
    """Test startpage."""
    response = client.get("/")
    assert response.status_code == 200
