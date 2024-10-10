"""Test network generation."""
from pathlib import Path
import requests

import pytest

from citationnet.network import GetRecords

MAIL = "mail@example.com"
LIMIT = 100
PUBID = "W4234174590"
DOI = "10.1093/llc/fqae052"

def test_setup(tmp_path: Path) -> None:
    """Test successful setup and start paper."""
    outdir = tmp_path / "out"
    outdir.mkdir()
    generatedata = GetRecords(email=MAIL, outpath=outdir)

    output = generatedata.getStart(
        doi=PUBID,
        citationlimit=LIMIT,
    )
    assert isinstance(output, tuple)
    assert output[0] == "Continue"

def test_citationlimit(tmp_path: Path) -> None:
    """Test low citationlimit returns abort."""
    outdir = tmp_path / "out"
    outdir.mkdir()
    generatedata = GetRecords(email=MAIL, outpath=outdir)

    output = generatedata.getStart(
        doi=PUBID,
        citationlimit=2,
    )
    assert isinstance(output, tuple)
    assert output[0] == "Abort"

def test_wrong_doi_format(tmp_path: Path) -> None:
    """Test raised error when no doi: preset."""
    outdir = tmp_path / "out"
    outdir.mkdir()
    generatedata = GetRecords(email=MAIL, outpath=outdir)

    with pytest.raises(expected_exception=ValueError) as e_info:
        _ = generatedata.getStart(
            doi=DOI,
            citationlimit=2,
        )
    assert e_info.value.args[0] == "Error from API: Return code 404 \nfor query https://api.openalex.org/works/10.1093/llc/fqae052."

def test_clean_node_return_format(tmp_path: Path) -> None:
    """Test correct format returned for nodes."""
    outdir = tmp_path / "out"
    outdir.mkdir()
    generatedata = GetRecords(email=MAIL, outpath=outdir)
    queryRes = requests.get(f"{generatedata.baseurl}/{PUBID}", timeout=5)
    generatedata.startNode = generatedata._checkReturn(queryRes)
    startNodeFormat = generatedata._cleanNode(generatedata.startNode)
    keys = ["id", "publication_year", "cited_by_count", "topic","fz"]
    for key in keys:
        assert key in startNodeFormat
