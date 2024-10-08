"""Basic tests for interface."""
from fastapi.testclient import TestClient

from citationnet.interface import app

client = TestClient(app)

SUCCESS = 200
NOTALLOWED = 405

#####################
# Tests for startpage
#####################

def test_read_interface() -> None:
    """Test startpage."""
    response = client.get("/")
    assert response.status_code == SUCCESS

def test_wrong_request_format_interface() -> None:
    """Test startpage."""
    response = client.post("/")
    assert response.status_code == NOTALLOWED

#########################
# Tests for creating data
#########################

def test_wrong_request_format_create() -> None:
    """Test error by wrong parameter."""
    response = client.get("/createdata/")
    assert response.status_code == NOTALLOWED

def test_query_highly_cited_paper() -> None:
    """Test error returned for highly cited paper."""
    json={
            "publication":"w2035618305",
            "citationlimit":100,
            "email":"vogl@gea.mpg.de",
        }
    response = client.post(
        "/createdata/",
        data=json,
    )
    assert response.status_code == SUCCESS
    assert "Failed" in response.text

def test_valid_query() -> None:
    """Test query returns correct filename."""
    json={
            "publication":"w4402969608",
            "citationlimit":100,
            "email":"vogl@gea.mpg.de",
        }
    response = client.post(
        "/createdata/",
        data=json,
    )
    assert response.status_code == SUCCESS
    assert "Damerow_W4402969608" in response.text

#######################
# Tests for drawing net
#######################

def test_wrong_request_format_draw() -> None:
    """Test error by wrong parameter."""
    response = client.get("/drawnetwork/")
    assert response.status_code == NOTALLOWED

def test_drawing_net() -> None:
    """Test drawing a citationnet."""
    json={
            "filename":"Jürgen_Renn_W4234174590.json",
        }
    response = client.post(
        "/drawnetwork/",
        data=json,
    )
    assert response.status_code == SUCCESS
    assert '<div id="3d-graph"' in response.text
